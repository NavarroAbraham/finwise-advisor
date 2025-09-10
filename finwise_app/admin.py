from django.contrib import admin

from .models import Account, Transaction, Category, Budget


@admin.register(Account)
class AccountAdmin(admin.ModelAdmin):
	list_display = ("id", "name", "type", "bank_id", "account_id")
	search_fields = ("name", "bank_id", "account_id")
	list_filter = ("type",)


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
	list_display = ("id", "account", "posted_date", "amount", "trntype", "name", "fitid", "category", "is_categorized")
	list_filter = ("trntype", "account", "category", "is_categorized")
	search_fields = ("name", "memo", "fitid", "checknum")
	date_hierarchy = "posted_date"
	list_editable = ("category",)
	
	def get_queryset(self, request):
		return super().get_queryset(request).select_related('account', 'category')


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
	list_display = ('name', 'color', 'is_active', 'created_at', 'transaction_count')
	list_filter = ('is_active', 'created_at')
	search_fields = ('name', 'description', 'keywords')
	list_editable = ('is_active',)
	
	def transaction_count(self, obj):
		return obj.transactions.count()
	transaction_count.short_description = 'Transactions'


@admin.register(Budget)
class BudgetAdmin(admin.ModelAdmin):
	list_display = ('user', 'category', 'month', 'amount', 'spent_amount', 'percentage_used')
	list_filter = ('month', 'category', 'user')
	search_fields = ('user__username', 'category__name')
	date_hierarchy = 'month'
	
	def spent_amount(self, obj):
		return f"${obj.get_spent_amount():.2f}"
	spent_amount.short_description = 'Spent'
	
	def percentage_used(self, obj):
		return f"{obj.get_percentage_used():.1f}%"
	percentage_used.short_description = 'Used %'
	
	def get_queryset(self, request):
		return super().get_queryset(request).select_related('user', 'category')

