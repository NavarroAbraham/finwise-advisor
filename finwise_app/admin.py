from django.contrib import admin

from .models import Account, Transaction


@admin.register(Account)
class AccountAdmin(admin.ModelAdmin):
	list_display = ("id", "name", "type", "bank_id", "account_id")
	search_fields = ("name", "bank_id", "account_id")
	list_filter = ("type",)


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
	list_display = ("id", "account", "posted_date", "amount", "trntype", "name", "fitid")
	list_filter = ("trntype", "account")
	search_fields = ("name", "memo", "fitid", "checknum")
	date_hierarchy = "posted_date"

