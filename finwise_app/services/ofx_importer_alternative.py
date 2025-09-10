"""
Drop-in replacement for ofxtools-based OFX importer
This uses pure Python regex parsing instead of ofxtools
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal
from typing import Iterable, Optional
import re

from django.db import transaction as db_transaction
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


def _extract_field(text: str, field: str) -> str:
    """Extract a field value using regex"""
    pattern = f'<{field}>([^<\n]*)'
    match = re.search(pattern, text, re.IGNORECASE)
    return match.group(1).strip() if match else ''


def _parse_date(date_str: str) -> datetime:
    """Parse OFX date format YYYYMMDDHHMMSS"""
    if not date_str:
        return datetime.now()
    
    s = str(date_str).strip()
    # Remove timezone info if present
    s = s.split("[")[0]
    
    try:
        if len(s) >= 14:
            return datetime.strptime(s[:14], "%Y%m%d%H%M%S")
        elif len(s) >= 8:
            return datetime.strptime(s[:8], "%Y%m%d")
        else:
            return datetime.now()
    except ValueError:
        return datetime.now()


def parse_ofx_alternative(content: bytes) -> tuple[dict, list[ImportedTxn]]:
    """
    Alternative OFX parser using pure regex - no ofxtools dependency
    
    Returns: (account_info, transactions)
      account_info: dict with keys: type ('BANK'|'CREDITCARD'), bank_id, account_id, name
      transactions: list[ImportedTxn]
    """
    try:
        # Decode bytes to string
        text = content.decode('utf-8', errors='ignore')
    except:
        text = content.decode('latin-1', errors='ignore')
    
    # Check for request file rejection
    upper_sample = text[:4096].upper()
    if (
        "STMTTRNRQ" in upper_sample
        and "STMTTRNRS" not in upper_sample
        and "STMTRS" not in upper_sample
    ):
        raise ValueError(
            "The uploaded OFX appears to be only a statement request (STMTTRNRQ) without a response. "
            "Export a statement/transactions file from your bank instead."
        )
    
    acct_info: dict = {
        "type": "BANK",
        "bank_id": None,
        "account_id": None,
        "name": "",
    }
    txns: list[ImportedTxn] = []
    
    # Determine account type and extract account info
    if re.search(r'<BANKMSGSRSV1>', text, re.IGNORECASE):
        acct_info["type"] = "BANK"
        acct_info["bank_id"] = _extract_field(text, 'BANKID')
        acct_info["account_id"] = _extract_field(text, 'ACCTID')
    elif re.search(r'<CREDITCARDMSGSRSV1>', text, re.IGNORECASE):
        acct_info["type"] = "CREDITCARD"
        acct_info["bank_id"] = None
        acct_info["account_id"] = _extract_field(text, 'ACCTID')
    else:
        raise ValueError("Unsupported OFX: missing BANKMSGSRSV1 or CREDITCARDMSGSRSV1")
    
    # Extract currency
    currency = _extract_field(text, 'CURDEF') or 'USD'
    
    # Extract organization name if available
    acct_info["name"] = _extract_field(text, 'ORG') or ""
    
    # Find all STMTTRN blocks using regex
    stmttrn_pattern = r'<STMTTRN>(.*?)(?=<STMTTRN>|</BANKTRANLIST>|<LEDGERBAL>|<AVAILBAL>)'
    matches = re.findall(stmttrn_pattern, text, re.DOTALL | re.IGNORECASE)
    
    for match in matches:
        try:
            fitid = _extract_field(match, 'FITID')
            dtposted = _extract_field(match, 'DTPOSTED')
            trnamt = _extract_field(match, 'TRNAMT')
            trntype = _extract_field(match, 'TRNTYPE')
            name = _extract_field(match, 'NAME')
            memo = _extract_field(match, 'MEMO')
            checknum = _extract_field(match, 'CHECKNUM')
            
            if fitid and dtposted and trnamt:
                txns.append(
                    ImportedTxn(
                        fitid=fitid,
                        posted=_parse_date(dtposted),
                        amount=Decimal(str(trnamt)),
                        trntype=trntype,
                        name=name,
                        memo=memo,
                        checknum=checknum,
                        currency=currency,
                    )
                )
        except (ValueError, TypeError, AttributeError) as e:
            # Skip malformed transactions
            continue
    
    if not txns:
        raise ValueError("No valid transactions found in OFX file")
    
    return acct_info, txns


def import_ofx_alternative(content: bytes) -> tuple[Account, int]:
    """Parse and persist OFX content using alternative parser. Returns (account, created_count)."""
    acct_info, txns = parse_ofx_alternative(content)

    with db_transaction.atomic():
        account, _ = Account.objects.get_or_create(
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
            logger.info(f"OFX Import (Alternative): {created} new transactions, "
                       f"{stats['categorized']} categorized automatically")

    return account, created
