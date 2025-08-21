from django.test import TestCase

from .services.ofx_importer import parse_ofx, import_ofx


SAMPLE_OFX_XML = b"""
<?xml version="1.0" encoding="UTF-8"?>
<?OFX OFXHEADER="200" VERSION="220" SECURITY="NONE" OLDFILEUID="NONE" NEWFILEUID="NONE"?>
<OFX>
	<SIGNONMSGSRSV1>
		<SONRS>
			<STATUS><CODE>0</CODE><SEVERITY>INFO</SEVERITY></STATUS>
			<DTSERVER>20250101000000</DTSERVER>
			<LANGUAGE>ENG</LANGUAGE>
		</SONRS>
	</SIGNONMSGSRSV1>
	<BANKMSGSRSV1>
		<STMTTRNRS>
			<TRNUID>1</TRNUID>
			<STATUS><CODE>0</CODE><SEVERITY>INFO</SEVERITY></STATUS>
			<STMTRS>
				<CURDEF>USD</CURDEF>
				<BANKACCTFROM>
					<BANKID>99999999</BANKID>
					<ACCTID>123456789</ACCTID>
					<ACCTTYPE>CHECKING</ACCTTYPE>
				</BANKACCTFROM>
				<BANKTRANLIST>
					<DTSTART>20241201000000</DTSTART>
					<DTEND>20241231235959</DTEND>
					<STMTTRN>
						<TRNTYPE>DEBIT</TRNTYPE>
						<DTPOSTED>20241205120000</DTPOSTED>
						<TRNAMT>-12.34</TRNAMT>
						<FITID>ABC123</FITID>
						<NAME>Coffee Shop</NAME>
						<MEMO>Latte</MEMO>
					</STMTTRN>
				</BANKTRANLIST>
			</STMTRS>
		</STMTTRNRS>
	</BANKMSGSRSV1>
</OFX>
"""


class ImporterTests(TestCase):
		def test_parse_and_import(self):
				acct_info, txns = parse_ofx(SAMPLE_OFX_XML)
				self.assertEqual(acct_info["type"], "BANK")
				self.assertEqual(acct_info["bank_id"], "99999999")
				self.assertEqual(acct_info["account_id"], "123456789")
				self.assertEqual(len(txns), 1)
				account, created = import_ofx(SAMPLE_OFX_XML)
				self.assertEqual(created, 1)

# Create your tests here.
