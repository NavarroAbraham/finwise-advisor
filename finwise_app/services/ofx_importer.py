from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal
from typing import Iterable, Optional

from django.db import transaction as db_transaction

try:
    # ofxtools is a well-known library supporting OFX 1.x SGML and 2.x XML
    from ofxtools.Parser import OFXTree  # type: ignore
except Exception as e:  # pragma: no cover - import-time failure surfaced to caller
    OFXTree = None  # type: ignore

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

    ofx = OFXTree()
    ofx.parse(content)
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
    stmtrs = None
    if getattr(ofx_obj, "bankmsgsrsv1", None):
        trnrs = ofx_obj.bankmsgsrsv1.stmttrnrs
        stmtrs = trnrs.stmtrs
        acct_info["type"] = "BANK"
        acct_info["bank_id"] = getattr(stmtrs.bankacctfrom, "bankid", None)
        acct_info["account_id"] = getattr(stmtrs.bankacctfrom, "acctid", None)
        acct_info["name"] = getattr(stmtrs, "mktginfo", "") or ""
        ledger = getattr(stmtrs, "banktranlist", None)
    elif getattr(ofx_obj, "creditcardmsgsrsv1", None):
        trnrs = ofx_obj.creditcardmsgsrsv1.ccstmttrnrs
        stmtrs = trnrs.ccstmtrs
        acct_info["type"] = "CREDITCARD"
        acct_info["bank_id"] = None
        acct_info["account_id"] = getattr(stmtrs.ccacctfrom, "acctid", None)
        acct_info["name"] = getattr(stmtrs, "mktginfo", "") or ""
        ledger = getattr(stmtrs, "banktranlist", None)
    else:
        raise ValueError("Unsupported OFX: missing BANKMSGSRSV1 or CREDITCARDMSGSRSV1")

    if ledger and getattr(ledger, "stmttrn", None):
        for t in ledger.stmttrn:
            txns.append(
                ImportedTxn(
                    fitid=str(getattr(t, "fitid", "")),
                    posted=_to_datetime(getattr(t, "dtposted", "")),
                    amount=Decimal(str(getattr(t, "trnamt", "0"))),
                    trntype=str(getattr(t, "trntype", "")),
                    name=str(getattr(t, "name", "")),
                    memo=str(getattr(t, "memo", "")),
                    checknum=str(getattr(t, "checknum", "")),
                    currency=str(getattr(stmtrs, "curdef", "")) if stmtrs else "",
                )
            )

    return acct_info, txns


def import_ofx(content: bytes) -> tuple[Account, int]:
    """Parse and persist OFX content. Returns (account, created_count)."""
    acct_info, txns = parse_ofx(content)

    with db_transaction.atomic():
        account, _ = Account.objects.get_or_create(
            type=acct_info["type"],
            bank_id=acct_info.get("bank_id"),
            account_id=acct_info.get("account_id") or "",
            defaults={"name": acct_info.get("name", "")},
        )

        created = 0
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

    return account, created
