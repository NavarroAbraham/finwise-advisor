"""
Alternative OFX parsing methods - multiple approaches to extract transaction data
"""
import re
from pathlib import Path
from decimal import Decimal
from datetime import datetime
from typing import List, Dict, Any
import xml.etree.ElementTree as ET
from dataclasses import dataclass

@dataclass
class Transaction:
    fitid: str
    date: datetime
    amount: Decimal
    type: str
    name: str
    memo: str

class AlternativeOFXParser:
    """Multiple methods to parse OFX files without ofxtools dependency"""
    
    def method1_regex_parsing(self, content: str) -> List[Transaction]:
        """Method 1: Pure regex-based parsing - most reliable for SGML"""
        transactions = []
        
        # Find all STMTTRN blocks
        stmttrn_pattern = r'<STMTTRN>(.*?)(?=<STMTTRN>|</BANKTRANLIST>|<LEDGERBAL>)'
        matches = re.findall(stmttrn_pattern, content, re.DOTALL | re.IGNORECASE)
        
        for match in matches:
            # Extract individual fields
            fitid = self._extract_field(match, 'FITID')
            dtposted = self._extract_field(match, 'DTPOSTED')
            trnamt = self._extract_field(match, 'TRNAMT')
            trntype = self._extract_field(match, 'TRNTYPE')
            name = self._extract_field(match, 'NAME')
            memo = self._extract_field(match, 'MEMO')
            
            if fitid and dtposted and trnamt:
                transactions.append(Transaction(
                    fitid=fitid,
                    date=self._parse_date(dtposted),
                    amount=Decimal(trnamt),
                    type=trntype or '',
                    name=name or '',
                    memo=memo or ''
                ))
        
        return transactions
    
    def method2_sgml_to_xml_conversion(self, content: str) -> List[Transaction]:
        """Method 2: Convert SGML to XML then parse with ElementTree"""
        # Convert SGML to proper XML
        xml_content = self._sgml_to_xml(content)
        
        try:
            root = ET.fromstring(xml_content)
            transactions = []
            
            # Find all STMTTRN elements
            for stmttrn in root.findall('.//STMTTRN'):
                fitid = self._get_element_text(stmttrn, 'FITID')
                dtposted = self._get_element_text(stmttrn, 'DTPOSTED')
                trnamt = self._get_element_text(stmttrn, 'TRNAMT')
                trntype = self._get_element_text(stmttrn, 'TRNTYPE')
                name = self._get_element_text(stmttrn, 'NAME')
                memo = self._get_element_text(stmttrn, 'MEMO')
                
                if fitid and dtposted and trnamt:
                    transactions.append(Transaction(
                        fitid=fitid,
                        date=self._parse_date(dtposted),
                        amount=Decimal(trnamt),
                        type=trntype or '',
                        name=name or '',
                        memo=memo or ''
                    ))
            
            return transactions
        except ET.ParseError as e:
            print(f"XML parsing failed: {e}")
            return []
    
    def method3_line_by_line_parsing(self, content: str) -> List[Transaction]:
        """Method 3: Simple line-by-line state machine parsing"""
        lines = content.split('\n')
        transactions = []
        current_txn = {}
        in_transaction = False
        
        for line in lines:
            line = line.strip()
            
            if '<STMTTRN>' in line:
                in_transaction = True
                current_txn = {}
            elif not in_transaction:
                continue
            elif line.startswith('<') and '>' in line:
                # Extract tag and value
                match = re.match(r'<([^>]+)>(.*)$', line)
                if match:
                    tag, value = match.groups()
                    current_txn[tag] = value
                    
                    # Check if we have enough data for a transaction
                    if all(key in current_txn for key in ['FITID', 'DTPOSTED', 'TRNAMT']):
                        transactions.append(Transaction(
                            fitid=current_txn.get('FITID', ''),
                            date=self._parse_date(current_txn.get('DTPOSTED', '')),
                            amount=Decimal(current_txn.get('TRNAMT', '0')),
                            type=current_txn.get('TRNTYPE', ''),
                            name=current_txn.get('NAME', ''),
                            memo=current_txn.get('MEMO', '')
                        ))
                        in_transaction = False
        
        return transactions
    
    def method4_custom_ofx_to_csv(self, content: str) -> str:
        """Method 4: Convert OFX to CSV format for easy processing"""
        transactions = self.method1_regex_parsing(content)
        
        csv_lines = ['Date,Amount,Type,Name,Memo,FITID']
        for txn in transactions:
            csv_lines.append(f'"{txn.date.strftime("%Y-%m-%d")}",'
                           f'"{txn.amount}",'
                           f'"{txn.type}",'
                           f'"{txn.name}",'
                           f'"{txn.memo}",'
                           f'"{txn.fitid}"')
        
        return '\n'.join(csv_lines)
    
    def method5_json_export(self, content: str) -> str:
        """Method 5: Convert OFX to JSON for easy API consumption"""
        import json
        transactions = self.method1_regex_parsing(content)
        
        json_data = {
            'account_info': self._extract_account_info(content),
            'transactions': [
                {
                    'fitid': txn.fitid,
                    'date': txn.date.isoformat(),
                    'amount': str(txn.amount),
                    'type': txn.type,
                    'name': txn.name,
                    'memo': txn.memo
                }
                for txn in transactions
            ]
        }
        
        return json.dumps(json_data, indent=2)
    
    # Helper methods
    def _extract_field(self, text: str, field: str) -> str:
        """Extract a field value using regex"""
        pattern = f'<{field}>([^<\n]*)'
        match = re.search(pattern, text, re.IGNORECASE)
        return match.group(1).strip() if match else ''
    
    def _parse_date(self, date_str: str) -> datetime:
        """Parse OFX date format YYYYMMDDHHMMSS"""
        if len(date_str) >= 8:
            if len(date_str) >= 14:
                return datetime.strptime(date_str[:14], "%Y%m%d%H%M%S")
            else:
                return datetime.strptime(date_str[:8], "%Y%m%d")
        return datetime.now()
    
    def _sgml_to_xml(self, content: str) -> str:
        """Convert SGML OFX to proper XML"""
        # Remove OFX header
        xml_start = content.find('<OFX>')
        if xml_start >= 0:
            content = content[xml_start:]
        
        # Add XML declaration
        xml_content = '<?xml version="1.0" encoding="UTF-8"?>\n' + content
        
        # Convert SGML tags to XML (add closing tags)
        tags_to_close = ['FITID', 'DTPOSTED', 'TRNAMT', 'TRNTYPE', 'NAME', 'MEMO', 
                        'CODE', 'SEVERITY', 'TRNUID', 'CURDEF', 'BANKID', 'ACCTID', 
                        'ACCTTYPE', 'DTSTART', 'DTEND', 'BALAMT', 'DTASOF', 'DTSERVER',
                        'LANGUAGE', 'ORG', 'FID']
        
        for tag in tags_to_close:
            # Replace <TAG>value with <TAG>value</TAG>
            pattern = f'<{tag}>([^<\n]*)'
            xml_content = re.sub(pattern, f'<{tag}>\\1</{tag}>', xml_content, flags=re.IGNORECASE)
        
        return xml_content
    
    def _get_element_text(self, parent, tag: str) -> str:
        """Get text content of XML element"""
        element = parent.find(tag)
        return element.text.strip() if element is not None and element.text else ''
    
    def _extract_account_info(self, content: str) -> Dict[str, str]:
        """Extract account information from OFX"""
        return {
            'bank_id': self._extract_field(content, 'BANKID'),
            'account_id': self._extract_field(content, 'ACCTID'),
            'account_type': self._extract_field(content, 'ACCTTYPE'),
            'currency': self._extract_field(content, 'CURDEF')
        }

# Test all methods
def test_all_methods():
    parser = AlternativeOFXParser()
    content = Path('docs/testdata.ofx').read_text()
    
    print("=== Method 1: Regex Parsing ===")
    try:
        txns1 = parser.method1_regex_parsing(content)
        print(f"Found {len(txns1)} transactions")
        for txn in txns1[:2]:  # Show first 2
            print(f"  {txn.date.date()} | {txn.amount:>8} | {txn.name}")
    except Exception as e:
        print(f"Error: {e}")
    
    print("\n=== Method 2: SGML to XML Conversion ===")
    try:
        txns2 = parser.method2_sgml_to_xml_conversion(content)
        print(f"Found {len(txns2)} transactions")
        for txn in txns2[:2]:
            print(f"  {txn.date.date()} | {txn.amount:>8} | {txn.name}")
    except Exception as e:
        print(f"Error: {e}")
    
    print("\n=== Method 3: Line-by-Line Parsing ===")
    try:
        txns3 = parser.method3_line_by_line_parsing(content)
        print(f"Found {len(txns3)} transactions")
        for txn in txns3[:2]:
            print(f"  {txn.date.date()} | {txn.amount:>8} | {txn.name}")
    except Exception as e:
        print(f"Error: {e}")
    
    print("\n=== Method 4: Convert to CSV ===")
    try:
        csv_data = parser.method4_custom_ofx_to_csv(content)
        print("CSV output (first 3 lines):")
        print('\n'.join(csv_data.split('\n')[:3]))
    except Exception as e:
        print(f"Error: {e}")
    
    print("\n=== Method 5: Convert to JSON ===")
    try:
        json_data = parser.method5_json_export(content)
        print("JSON output (first 500 chars):")
        print(json_data[:500] + "...")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_all_methods()
