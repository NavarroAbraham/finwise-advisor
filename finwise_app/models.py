from django.db import models


class Account(models.Model):
	TYPE_CHOICES = [
		("BANK", "Bank"),
		("CREDITCARD", "Credit Card"),
	]

	name = models.CharField(max_length=255, blank=True)
	type = models.CharField(max_length=16, choices=TYPE_CHOICES)
	bank_id = models.CharField(max_length=64, blank=True, null=True)
	account_id = models.CharField(max_length=64)

	class Meta:
		unique_together = ("type", "bank_id", "account_id")

	def __str__(self) -> str:  # pragma: no cover - simple repr
		parts = [self.get_type_display()]
		if self.name:
			parts.append(self.name)
		parts.append(self.account_id)
		return " - ".join(parts)


class Transaction(models.Model):
	account = models.ForeignKey(Account, on_delete=models.CASCADE, related_name="transactions")
	fitid = models.CharField(max_length=128)  # Financial Institution Transaction ID
	posted_date = models.DateTimeField()
	amount = models.DecimalField(max_digits=12, decimal_places=2)
	trntype = models.CharField(max_length=32, blank=True)
	name = models.CharField(max_length=255, blank=True)
	memo = models.CharField(max_length=512, blank=True)
	checknum = models.CharField(max_length=64, blank=True)
	currency = models.CharField(max_length=8, blank=True)

	class Meta:
		unique_together = ("account", "fitid")
		ordering = ["-posted_date", "-id"]

	def __str__(self) -> str:  # pragma: no cover - simple repr
		return f"{self.posted_date.date()} {self.amount} {self.name or self.memo}"

