from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator
from decimal import Decimal


class Category(models.Model):
	"""Spending categories for transaction classification"""
	name = models.CharField(max_length=100, unique=True)
	description = models.TextField(blank=True)
	keywords = models.TextField(
		blank=True,
		help_text="Comma-separated keywords for automatic categorization"
	)
	color = models.CharField(max_length=7, default="#6366F1", help_text="Hex color code")
	is_active = models.BooleanField(default=True)
	created_at = models.DateTimeField(auto_now_add=True)

	class Meta:
		verbose_name_plural = "categories"
		ordering = ["name"]

	def __str__(self) -> str:
		return self.name

	def get_keywords_list(self) -> list[str]:
		"""Return keywords as a list"""
		if not self.keywords:
			return []
		return [kw.strip().lower() for kw in self.keywords.split(",") if kw.strip()]


class Budget(models.Model):
	"""Monthly budgets per category per user"""
	user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="budgets")
	category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name="budgets")
	amount = models.DecimalField(
		max_digits=12, 
		decimal_places=2,
		validators=[MinValueValidator(Decimal('0.01'))]
	)
	month = models.DateField(help_text="First day of the budget month (YYYY-MM-01)")
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	class Meta:
		unique_together = ("user", "category", "month")
		ordering = ["-month", "category__name"]

	def __str__(self) -> str:
		return f"{self.user.username} - {self.category.name} - {self.month.strftime('%B %Y')}: ${self.amount}"

	def get_spent_amount(self) -> Decimal:
		"""Calculate total spent in this category for this month"""
		from django.db.models import Sum
		from datetime import datetime
		
		# Get start and end of the month
		year, month = self.month.year, self.month.month
		if month == 12:
			next_month_start = datetime(year + 1, 1, 1)
		else:
			next_month_start = datetime(year, month + 1, 1)
		
		month_start = datetime(year, month, 1)
		
		# Sum transactions in this category for this month
		spent = Transaction.objects.filter(
			account__in=Account.objects.all(),  # User's accounts would be filtered here
			category=self.category,
			posted_date__gte=month_start,
			posted_date__lt=next_month_start,
			amount__lt=0  # Only expenses (negative amounts)
		).aggregate(total=Sum('amount'))['total'] or Decimal('0')
		
		return abs(spent)  # Return positive amount

	def get_percentage_used(self) -> float:
		"""Get percentage of budget used"""
		if self.amount <= 0:
			return 0.0
		spent = self.get_spent_amount()
		return float(spent / self.amount * 100)

	def is_over_threshold(self, threshold_percent: float = 80.0) -> bool:
		"""Check if budget usage exceeds threshold"""
		return self.get_percentage_used() >= threshold_percent


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
	category = models.ForeignKey(
		Category, 
		on_delete=models.SET_NULL, 
		null=True, 
		blank=True,
		related_name="transactions"
	)
	fitid = models.CharField(max_length=128)  # Financial Institution Transaction ID
	posted_date = models.DateTimeField()
	amount = models.DecimalField(max_digits=12, decimal_places=2)
	trntype = models.CharField(max_length=32, blank=True)
	name = models.CharField(max_length=255, blank=True)
	memo = models.CharField(max_length=512, blank=True)
	checknum = models.CharField(max_length=64, blank=True)
	currency = models.CharField(max_length=8, blank=True)
	is_categorized = models.BooleanField(default=False)
	categorized_at = models.DateTimeField(null=True, blank=True)

	class Meta:
		unique_together = ("account", "fitid")
		ordering = ["-posted_date", "-id"]

	def __str__(self) -> str:  # pragma: no cover - simple repr
		return f"{self.posted_date.date()} {self.amount} {self.name or self.memo}"

	def auto_categorize(self) -> bool:
		"""
		Automatically categorize this transaction based on keywords.
		Returns True if categorized successfully.
		"""
		if self.is_categorized:
			return True

		# Get transaction text for matching
		text_to_match = f"{self.name} {self.memo}".lower()
		
		# Try to find a matching category
		for category in Category.objects.filter(is_active=True):
			keywords = category.get_keywords_list()
			if any(keyword in text_to_match for keyword in keywords):
				self.category = category
				self.is_categorized = True
				from django.utils import timezone
				self.categorized_at = timezone.now()
				self.save()
				return True
		
		# No match found - assign to "Uncategorized"
		uncategorized, _ = Category.objects.get_or_create(
			name="Uncategorized",
			defaults={
				"description": "Transactions that couldn't be automatically categorized",
				"color": "#9CA3AF"
			}
		)
		self.category = uncategorized
		self.is_categorized = True
		from django.utils import timezone
		self.categorized_at = timezone.now()
		self.save()
		return True

