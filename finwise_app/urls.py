from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('login/', views.login_view, name='login'),
    path('register/', views.register_view, name='register'),
    path('dashboard/', views.dashboard, name='dashboard'),
    path('import/', views.import_transactions, name='import_transactions'),
    path('logout/', views.logout_view, name='logout'),
    
    # Budget management (FR05)
    path('budgets/', views.budgets_view, name='budgets'),
    path('budgets/create/', views.create_budget, name='create_budget'),
    path('budgets/<int:budget_id>/update/', views.update_budget, name='update_budget'),
    path('budgets/<int:budget_id>/delete/', views.delete_budget, name='delete_budget'),
    path('api/budgets/', views.budget_api_data, name='budget_api_data'),
    
    # Category management
    path('categories/', views.categories_view, name='categories'),
    path('categories/setup-defaults/', views.setup_default_categories, name='setup_default_categories'),
    path('transactions/recategorize/', views.recategorize_transactions, name='recategorize_transactions'),
    
    # Account management
    path('account/', views.account_view, name='account'),
    path('account/update/', views.update_account, name='update_account'),
    path('account/change-password/', views.change_password, name='change_password'),
    path('account/delete-account/', views.delete_account, name='delete_account'),
    path('account/export-data/', views.export_data, name='export_data'),
    path('account/clean-data/', views.clean_data, name='clean_data'),
    
    # Bill management
    path('bills/', views.bills, name='bills'),
    path('bills/add/', views.add_bill, name='add_bill'),
    path('bills/<int:bill_id>/edit/', views.edit_bill, name='edit_bill'),
    path('bills/<int:bill_id>/delete/', views.delete_bill, name='delete_bill'),
    path('bills/<int:bill_id>/mark-paid/', views.mark_bill_paid, name='mark_bill_paid'),
    path('bills/<int:bill_id>/mark-pending/', views.mark_bill_pending, name='mark_bill_pending'),
    path('bills/reminders/', views.bill_reminders, name='bill_reminders'),
]