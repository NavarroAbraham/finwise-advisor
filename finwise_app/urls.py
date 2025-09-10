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
]