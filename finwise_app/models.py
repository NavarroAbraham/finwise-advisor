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
		
		# Sum transactions in this category for this month for this user
		spent = Transaction.objects.filter(
			account__user=self.user,  # Filter by user's accounts
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

	user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="accounts")
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


class Bill(models.Model):
	"""Bill management for tracking recurring and one-time bills"""
	FREQUENCY_CHOICES = [
		("WEEKLY", "Weekly"),
		("BIWEEKLY", "Bi-weekly"),
		("MONTHLY", "Monthly"),
		("QUARTERLY", "Quarterly"),
		("YEARLY", "Yearly"),
		("ONE_TIME", "One-time"),
	]
	
	STATUS_CHOICES = [
		("PENDING", "Pending"),
		("PAID", "Paid"),
		("OVERDUE", "Overdue"),
		("CANCELLED", "Cancelled"),
	]

	user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="bills")
	name = models.CharField(max_length=255, help_text="Bill name or payee")
	description = models.TextField(blank=True, help_text="Additional notes about this bill")
	amount = models.DecimalField(
		max_digits=12, 
		decimal_places=2,
		validators=[MinValueValidator(Decimal('0.01'))],
		help_text="Bill amount"
	)
	due_date = models.DateField(help_text="When the bill is due")
	frequency = models.CharField(
		max_length=16, 
		choices=FREQUENCY_CHOICES, 
		default="MONTHLY",
		help_text="How often this bill repeats"
	)
	status = models.CharField(
		max_length=16, 
		choices=STATUS_CHOICES, 
		default="PENDING",
		help_text="Current status of the bill"
	)
	category = models.ForeignKey(
		Category, 
		on_delete=models.SET_NULL, 
		null=True, 
		blank=True,
		related_name="bills",
		help_text="Category for expense tracking"
	)
	
	# Reminder settings
	reminder_days = models.PositiveIntegerField(
		default=3,
		help_text="How many days before due date to send reminder"
	)
	reminder_enabled = models.BooleanField(default=True)
	
	# Tracking fields
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)
	last_paid_date = models.DateField(null=True, blank=True)
	
	class Meta:
		ordering = ["due_date", "name"]
		indexes = [
			models.Index(fields=["user", "due_date"]),
			models.Index(fields=["user", "status"]),
		]

	def __str__(self) -> str:
		return f"{self.name} - ${self.amount} due {self.due_date}"

	def is_overdue(self) -> bool:
		"""Check if bill is overdue"""
		from django.utils import timezone
		return self.due_date < timezone.now().date() and self.status == "PENDING"

	def days_until_due(self) -> int:
		"""Calculate days until due date"""
		from django.utils import timezone
		delta = self.due_date - timezone.now().date()
		return delta.days

	def needs_reminder(self) -> bool:
		"""Check if reminder should be sent"""
		if not self.reminder_enabled or self.status != "PENDING":
			return False
		return self.days_until_due() <= self.reminder_days

	def mark_as_paid(self, paid_date=None):
		"""Mark bill as paid and set paid date"""
		from django.utils import timezone
		self.status = "PAID"
		self.last_paid_date = paid_date or timezone.now().date()
		self.save()
		
		# If recurring, create next bill
		if self.frequency != "ONE_TIME":
			self.create_next_bill()

	def create_next_bill(self):
		"""Create the next bill instance for recurring bills"""
		from dateutil.relativedelta import relativedelta
		from django.utils import timezone
		
		next_due_date = self.due_date
		
		if self.frequency == "WEEKLY":
			next_due_date += relativedelta(weeks=1)
		elif self.frequency == "BIWEEKLY":
			next_due_date += relativedelta(weeks=2)
		elif self.frequency == "MONTHLY":
			next_due_date += relativedelta(months=1)
		elif self.frequency == "QUARTERLY":
			next_due_date += relativedelta(months=3)
		elif self.frequency == "YEARLY":
			next_due_date += relativedelta(years=1)
		
		# Create new bill instance
		if self.frequency != "ONE_TIME":
			Bill.objects.create(
				user=self.user,
				name=self.name,
				description=self.description,
				amount=self.amount,
				due_date=next_due_date,
				frequency=self.frequency,
				category=self.category,
				reminder_days=self.reminder_days,
				reminder_enabled=self.reminder_enabled,
			)

	def get_status_color(self) -> str:
		"""Get CSS color class for status"""
		status_colors = {
			"PENDING": "warning",
			"PAID": "success", 
			"OVERDUE": "danger",
			"CANCELLED": "secondary",
		}
		return status_colors.get(self.status, "secondary")

	def get_frequency_display_short(self) -> str:
		"""Get short frequency display"""
		frequency_short = {
			"WEEKLY": "Weekly",
			"BIWEEKLY": "Bi-weekly", 
			"MONTHLY": "Monthly",
			"QUARTERLY": "Quarterly",
			"YEARLY": "Yearly",
			"ONE_TIME": "One-time",
		}
		return frequency_short.get(self.frequency, self.frequency)

