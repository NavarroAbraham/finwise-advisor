from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal
from typing import Iterable, Optional
from io import BytesIO

from django.db import transaction as db_transaction

try:
    # ofxtools is a well-known library supporting OFX 1.x SGML and 2.x XML
    from ofxtools.Parser import OFXTree  # type: ignore
except Exception as e:  # pragma: no cover - import-time failure surfaced to caller
    OFXTree = None  # type: ignore

from django.contrib.auth.models import User
from ..models import Account, Transaction


@dataclass(frozen=True)
class ImportedTxn:
    fitid: str
    posted: datetime
    amount: Decimal
    trntype: str
    name: str
    memo: str
    checknum: str
    currency: str


def _to_datetime(dt: datetime | str) -> datetime:
    if isinstance(dt, datetime):
        return dt
    # Fallback parse of OFX date formats if library returns raw strings
    # Common formats: YYYYMMDD, YYYYMMDDHHMMSS, with optional .XXX[gmt offset]
    s = str(dt)
    s = s.split("[")[0]  # strip tz if present like [0:GMT]
    if len(s) >= 14:
        return datetime.strptime(s[:14], "%Y%m%d%H%M%S")
    return datetime.strptime(s[:8], "%Y%m%d")


def parse_ofx(content: bytes) -> tuple[dict, list[ImportedTxn]]:
    """
    Parse OFX (including OFX 2.2 XML) content and return account info and transactions.

    Returns: (account_info, transactions)
      account_info: dict with keys: type ('BANK'|'CREDITCARD'), bank_id, account_id, name
      transactions: list[ImportedTxn]
    """
    if OFXTree is None:
        raise RuntimeError("ofxtools not installed. Please install 'ofxtools'.")

    upper_sample = content[:4096].upper()
    # Detect a pure request file (contains STMTTRNRQ but no response tags). Some banks echo the request
    # and also include the response; we only reject if response tags are absent to avoid false negatives.
    if (
        b"STMTTRNRQ" in upper_sample
        and b"STMTTRNRS" not in upper_sample
        and b"STMTRS" not in upper_sample
    ):
        raise ValueError(
            "The uploaded OFX appears to be only a statement request (STMTTRNRQ) without a response (STMTTRNRS/STMTRS). "
            "Export a statement/transactions file from your bank instead of a request payload."
        )

    ofx = OFXTree()
    # Provide a file-like buffer; passing raw bytes makes ofxtools treat it like a path
    ofx.parse(BytesIO(content))
    ofx_obj = ofx.convert()

    acct_info: dict = {
        "type": "BANK",
        "bank_id": None,
        "account_id": None,
        "name": "",
    }
    txns: list[ImportedTxn] = []

    # Support both Bank and CreditCard statements
    # ofxtools object model: ofx_obj.bankmsgsrsv1.stmttrnrs.stmtrs, or creditcardmsgsrsv1.ccstmttrnrs.ccstmtrs
    def _as_list(value):
        if value is None:
            return []
        if isinstance(value, (list, tuple)):
            return list(value)
        return [value]

    def _extract_from_stmtrs(stmtrs_obj):
        nonlocal acct_info, txns
        if not stmtrs_obj:
            return
        # Determine ledger & account fields depending on bank / credit card
        bankacct = getattr(stmtrs_obj, "bankacctfrom", None)
        ccacct = getattr(stmtrs_obj, "ccacctfrom", None)
        if bankacct:
            acct_info["type"] = "BANK"
            acct_info["bank_id"] = getattr(bankacct, "bankid", None)
            acct_info["account_id"] = getattr(bankacct, "acctid", None)
        elif ccacct:
            acct_info["type"] = "CREDITCARD"
            acct_info["bank_id"] = None
            acct_info["account_id"] = getattr(ccacct, "acctid", None)
        acct_info["name"] = getattr(stmtrs_obj, "mktginfo", "") or acct_info.get("name") or ""
        ledger_local = getattr(stmtrs_obj, "banktranlist", None)
        if ledger_local and getattr(ledger_local, "stmttrn", None):
            currency_code = str(getattr(stmtrs_obj, "curdef", ""))
            for t in ledger_local.stmttrn:
                try:
                    txns.append(
                        ImportedTxn(
                            fitid=str(getattr(t, "fitid", "")),
                            posted=_to_datetime(getattr(t, "dtposted", "")),
                            amount=Decimal(str(getattr(t, "trnamt", "0"))),
                            trntype=str(getattr(t, "trntype", "")),
                            name=str(getattr(t, "name", "")),
                            memo=str(getattr(t, "memo", "")),
                            checknum=str(getattr(t, "checknum", "")),
                            currency=currency_code,
                        )
                    )
                except Exception as e:  # pragma: no cover - defensive; skip bad txn
                    # Could add logging here if desired
                    continue

    bank_section = getattr(ofx_obj, "bankmsgsrsv1", None)
    credit_section = getattr(ofx_obj, "creditcardmsgsrsv1", None)

    found_any = False
    if bank_section:
        stmt_resp_list: list = []
        
        # bankmsgsrsv1 is typically a list-like container
        try:
            # Try to iterate through the bank section
            for item in bank_section:
                if hasattr(item, 'stmttrnrs'):
                    val = getattr(item, "stmttrnrs", None)
                    if val:
                        stmt_resp_list.extend(_as_list(val))
        except (TypeError, AttributeError):
            # Fallback: treat as single object
            val = getattr(bank_section, "stmttrnrs", None)
            if val:
                stmt_resp_list.extend(_as_list(val))
        
        for resp in stmt_resp_list:
            _extract_from_stmtrs(getattr(resp, "stmtrs", None))
        if stmt_resp_list:
            found_any = True
    if credit_section:
        cc_stmt_resp_list: list = []
        
        # creditcardmsgsrsv1 is typically a list-like container
        try:
            for item in credit_section:
                if hasattr(item, 'ccstmttrnrs'):
                    val = getattr(item, "ccstmttrnrs", None)
                    if val:
                        cc_stmt_resp_list.extend(_as_list(val))
        except (TypeError, AttributeError):
            # Fallback: treat as single object
            val = getattr(credit_section, "ccstmttrnrs", None)
            if val:
                cc_stmt_resp_list.extend(_as_list(val))
        
        for resp in cc_stmt_resp_list:
            _extract_from_stmtrs(getattr(resp, "ccstmtrs", None))
        if cc_stmt_resp_list:
            found_any = True

    if not found_any:
        # Provide available attribute names to aid debugging
        def _filtered_attrs(obj):
            return [a for a in dir(obj) if not a.startswith("__")] if obj else []
        bank_attrs = _filtered_attrs(bank_section)[:25]
        credit_attrs = _filtered_attrs(credit_section)[:25]
        raise ValueError(
            "Unsupported or empty OFX statement structure. Present sections but no STMTTRNRS/CCSTMTTRNRS. "
            f"Bank attrs: {bank_attrs[:15]} Credit attrs: {credit_attrs[:15]}"
        )

    return acct_info, txns


def import_ofx(content: bytes, user: User) -> tuple[Account, int]:
    """Parse and persist OFX content. Returns (account, created_count)."""
    acct_info, txns = parse_ofx(content)

    with db_transaction.atomic():
        account, _ = Account.objects.get_or_create(
            user=user,
            type=acct_info["type"],
            bank_id=acct_info.get("bank_id"),
            account_id=acct_info.get("account_id") or "",
            defaults={"name": acct_info.get("name", "")},
        )

        created = 0
        new_transactions = []
        for t in txns:
            obj, was_created = Transaction.objects.get_or_create(
                account=account,
                fitid=t.fitid,
                defaults={
                    "posted_date": t.posted,
                    "amount": t.amount,
                    "trntype": t.trntype,
                    "name": t.name,
                    "memo": t.memo,
                    "checknum": t.checknum,
                    "currency": t.currency,
                },
            )
            if was_created:
                created += 1
                new_transactions.append(obj)

        # Auto-categorize new transactions (FR04 requirement)
        if new_transactions:
            from .categorization_service import TransactionCategorizationService
            categorizer = TransactionCategorizationService()
            stats = categorizer.categorize_bulk_transactions(new_transactions)
            
            import logging
            logger = logging.getLogger(__name__)
            logger.info(f"OFX Import: {created} new transactions, "
                       f"{stats['categorized']} categorized automatically")

    return account, created
