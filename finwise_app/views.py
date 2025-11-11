from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.views.decorators.http import require_http_methods
from django.contrib.auth.decorators import login_required
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.core.files.uploadedfile import UploadedFile
from django.http import JsonResponse
from django.db.models import Sum, Q
from django.utils import timezone
from datetime import datetime, date, timedelta
from decimal import Decimal

from .services.ofx_importer import import_ofx
from .services.ofx_importer_alternative import import_ofx_alternative
from .services.categorization_service import TransactionCategorizationService, create_default_categories
from .models import Account, Transaction, Category, Budget, Bill

def home(request):
    return render(request, 'finwise_app/home.html')

@require_http_methods(["GET", "POST"])
def login_view(request):
    if request.method == "POST":
        username = request.POST.get("username", "")
        password = request.POST.get("password", "")
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            next_url = request.GET.get("next") or "dashboard"
            return redirect(next_url)
        messages.error(request, "Invalid credentials.")
    return render(request, 'finwise_app/login.html')


@require_http_methods(["GET", "POST"])
def register_view(request):
    if request.method == "POST":
        username = (request.POST.get("username") or "").strip()
        email = (request.POST.get("email") or "").strip()
        password = request.POST.get("password") or ""
        confirm = request.POST.get("confirm_password") or ""

        if not username or not password:
            messages.error(request, "Username and password are required.")
            return render(request, 'finwise_app/register.html')
        if password != confirm:
            messages.error(request, "Passwords do not match.")
            return render(request, 'finwise_app/register.html')
        if User.objects.filter(username=username).exists():
            messages.error(request, "Username is already taken.")
            return render(request, 'finwise_app/register.html')

        user = User.objects.create_user(username=username, email=email, password=password)
        user.save()
        login(request, user)
        return redirect('dashboard')

    return render(request, 'finwise_app/register.html')

@login_required
def dashboard(request):
    # Get filter parameters
    account_filter = request.GET.get('account', '')
    category_filter = request.GET.get('category', '')
    days_filter = request.GET.get('days', '30')  # Default to 30 days

    selected_account_id: int | None = None
    if account_filter:
        try:
            selected_account_id = int(account_filter)
        except (ValueError, TypeError):
            account_filter = ''

    selected_category_id: int | None = None
    selected_uncategorized = False
    if category_filter:
        if category_filter == 'uncategorized':
            selected_uncategorized = True
        else:
            try:
                selected_category_id = int(category_filter)
            except (ValueError, TypeError):
                category_filter = ''
    
    try:
        days_filter = int(days_filter)
    except (ValueError, TypeError):
        days_filter = 30
    
    # Get all accounts for current user
    accounts = Account.objects.filter(user=request.user).order_by("name", "account_id")[:20]
    categories = (
        Category.objects.filter(
            Q(transactions__account__user=request.user) | Q(budgets__user=request.user)
        )
        .distinct()
        .order_by("name")
    )
    
    # Get transactions with optional filters
    recent_query = Transaction.objects.filter(account__user=request.user).select_related("account", "category")
    
    # Apply account filter if specified
    if selected_account_id:
        recent_query = recent_query.filter(account_id=selected_account_id)
    
    # Apply date filter if specified
    if days_filter > 0:
        cutoff_date = timezone.now() - timedelta(days=days_filter)
        recent_query = recent_query.filter(posted_date__gte=cutoff_date)

    # Apply category filter if specified
    if selected_uncategorized:
        recent_query = recent_query.filter(category__isnull=True)
    elif selected_category_id:
        recent_query = recent_query.filter(category_id=selected_category_id)
    
    recent = recent_query.order_by("-posted_date")[:10]
    filters_active = bool(
        selected_account_id or selected_category_id or selected_uncategorized or days_filter != 30
    )
    
    # Get budget summary for current month if user is logged in
    budget_summary = None
    if request.user.is_authenticated:
        current_month = date.today().replace(day=1)
        budgets = Budget.objects.filter(user=request.user, month=current_month).select_related('category')
        
        if budgets.exists():
            budget_summary = {
                'total_budgeted': sum(b.amount for b in budgets),
                'total_spent': sum(b.get_spent_amount() for b in budgets),
                'budgets_count': budgets.count(),
                'over_threshold_count': sum(1 for b in budgets if b.is_over_threshold())
            }
    
    return render(request, 'finwise_app/dashboard.html', {
        "accounts": accounts, 
        "categories": categories,
        "recent": recent,
        "budget_summary": budget_summary,
        "account_filter": account_filter,
        "selected_account_id": selected_account_id,
        "category_filter": category_filter,
        "selected_category_id": selected_category_id,
        "selected_uncategorized": selected_uncategorized,
        "days_filter": days_filter,
        "filters_active": filters_active,
    })


@login_required
@require_http_methods(["GET", "POST"])
def import_transactions(request):
    if request.method == "POST":
        f: UploadedFile | None = request.FILES.get("ofx_file")
        if not f:
            messages.error(request, "Please choose an OFX file to upload.")
            return redirect("import_transactions")
        try:
            content = f.read()
            
            # Try the main ofxtools-based parser first
            try:
                account, created_count = import_ofx(content, request.user)
                messages.success(
                    request,
                    f"Imported {created_count} transactions into account {account}.",
                )
                return redirect("dashboard")
            except Exception as primary_error:
                # Fallback to alternative regex-based parser
                try:
                    account, created_count = import_ofx_alternative(content, request.user)
                    messages.success(
                        request,
                        f"Imported {created_count} transactions into account {account} (using alternative parser).",
                    )
                    return redirect("dashboard")
                except Exception as fallback_error:
                    # Both parsers failed
                    messages.error(
                        request, 
                        f"Failed to import OFX with both parsers. Primary: {primary_error}. Fallback: {fallback_error}"
                    )
                    return redirect("import_transactions")
        except Exception as e:  # broad: surface file reading errors
            messages.error(request, f"Failed to read OFX file: {e}")
            return redirect("import_transactions")

    return render(request, "finwise_app/import_transactions.html")


@require_http_methods(["POST"]) 
def logout_view(request):
    logout(request)
    return redirect("home")


@login_required
def budgets_view(request):
    """FR05: Display user's budgets and goals with create/edit/delete functionality"""
    current_month = date.today().replace(day=1)
    
    # Get filter parameter (BUDGET, GOAL, or ALL)
    budget_type_filter = request.GET.get('type', 'BUDGET')  # Default to BUDGET
    
    # Get current month budgets
    budgets_query = Budget.objects.filter(
        user=request.user, 
        month=current_month
    ).select_related('category').order_by('category__name')
    
    # Filter by type if specified
    if budget_type_filter == 'BUDGET':
        budgets = budgets_query.filter(budget_type='BUDGET')
        goals = []
        page_title = "Spending Limits"
    elif budget_type_filter == 'GOAL':
        budgets = []
        goals = budgets_query.filter(budget_type='GOAL')
        page_title = "Savings Goals"
    else:  # ALL
        budgets = budgets_query.filter(budget_type='BUDGET')
        goals = budgets_query.filter(budget_type='GOAL')
        page_title = "Budgets & Goals"
    
    # Get all categories for creating new budgets
    categories = Category.objects.filter(is_active=True).order_by('name')
    
    # Calculate summary stats for budgets (spending limits)
    total_budgeted = sum(b.amount for b in budgets)
    total_spent = sum(b.get_spent_amount() for b in budgets)
    total_remaining = total_budgeted - total_spent
    over_threshold_count = sum(1 for b in budgets if b.is_over_threshold())
    
    # Calculate summary stats for goals (savings targets)
    total_goal_amount = sum(g.amount for g in goals)
    total_goal_saved = sum(g.get_spent_amount() for g in goals)  # Reusing method for savings
    total_goal_progress = total_goal_saved if total_goal_amount > 0 else 0
    goal_completion_pct = (total_goal_saved / total_goal_amount * 100) if total_goal_amount > 0 else 0
    
    context = {
        'budgets': budgets,
        'goals': goals,
        'categories': categories,
        'current_month': current_month,
        'total_budgeted': total_budgeted,
        'total_spent': total_spent,
        'total_remaining': total_remaining,
        'over_threshold_count': over_threshold_count,
        'total_goal_amount': total_goal_amount,
        'total_goal_saved': total_goal_saved,
        'goal_completion_pct': goal_completion_pct,
        'budget_type_filter': budget_type_filter,
        'page_title': page_title,
    }
    
    return render(request, 'finwise_app/budgets.html', context)


@login_required
@require_http_methods(["POST"])
def create_budget(request):
    """FR05: Create a new monthly budget or goal for a category"""
    category_id = request.POST.get('category_id')
    amount = request.POST.get('amount')
    month_str = request.POST.get('month')  # Format: YYYY-MM
    budget_type = request.POST.get('budget_type', 'BUDGET')  # BUDGET or GOAL
    
    try:
        category = get_object_or_404(Category, id=category_id, is_active=True)
        amount = Decimal(amount)
        
        if amount <= 0:
            messages.error(request, "Amount must be greater than zero.")
            return redirect('budgets')
        
        # Parse month
        if month_str:
            year, month = map(int, month_str.split('-'))
            budget_month = date(year, month, 1)
        else:
            budget_month = date.today().replace(day=1)
        
        # Create or update budget/goal
        budget, created = Budget.objects.update_or_create(
            user=request.user,
            category=category,
            month=budget_month,
            defaults={'amount': amount, 'budget_type': budget_type}
        )
        
        # Update budget_type if it changed
        if not created and budget.budget_type != budget_type:
            budget.budget_type = budget_type
            budget.save()
        
        type_name = "Budget" if budget_type == "BUDGET" else "Goal"
        action = "created" if created else "updated"
        messages.success(request, f"{type_name} for {category.name} {action} successfully.")
        
    except (ValueError, TypeError):
        messages.error(request, "Invalid amount entered.")
    except Exception as e:
        messages.error(request, f"Error creating budget: {e}")
    
    return redirect('budgets')


@login_required
@require_http_methods(["POST"])
def update_budget(request, budget_id):
    """FR05: Update an existing budget"""
    budget = get_object_or_404(Budget, id=budget_id, user=request.user)
    amount = request.POST.get('amount')
    
    try:
        amount = Decimal(amount)
        if amount <= 0:
            messages.error(request, "Budget amount must be greater than zero.")
            return redirect('budgets')
        
        budget.amount = amount
        budget.save()
        
        messages.success(request, f"Budget for {budget.category.name} updated successfully.")
        
    except (ValueError, TypeError):
        messages.error(request, "Invalid amount entered.")
    except Exception as e:
        messages.error(request, f"Error updating budget: {e}")
    
    return redirect('budgets')


@login_required
@require_http_methods(["POST"])
def delete_budget(request, budget_id):
    """FR05: Delete a budget"""
    budget = get_object_or_404(Budget, id=budget_id, user=request.user)
    category_name = budget.category.name
    
    try:
        budget.delete()
        messages.success(request, f"Budget for {category_name} deleted successfully.")
    except Exception as e:
        messages.error(request, f"Error deleting budget: {e}")
    
    return redirect('budgets')


@login_required
def budget_api_data(request):
    """API endpoint for budget data (for charts/widgets)"""
    current_month = date.today().replace(day=1)
    
    budgets = Budget.objects.filter(
        user=request.user, 
        month=current_month
    ).select_related('category')
    
    budget_data = []
    for budget in budgets:
        spent = budget.get_spent_amount()
        percentage = budget.get_percentage_used()
        
        budget_data.append({
            'id': budget.id,
            'category': budget.category.name,
            'category_color': budget.category.color,
            'budgeted': float(budget.amount),
            'spent': float(spent),
            'remaining': float(budget.amount - spent),
            'percentage': round(percentage, 1),
            'over_threshold': budget.is_over_threshold(),
        })
    
    return JsonResponse({
        'budgets': budget_data,
        'month': current_month.strftime('%B %Y')
    })


@login_required
@login_required
def categories_view(request):
    """Manage spending categories - show spending per category for current user"""
    categories = Category.objects.filter(is_active=True).order_by('name')
    
    # Get transaction counts and spending per category for current user
    category_stats = {}
    for category in categories:
        user_transactions = category.transactions.filter(account__user=request.user)
        category_stats[category.id] = {
            'transaction_count': user_transactions.count(),
            'total_amount': user_transactions.aggregate(total=Sum('amount'))['total'] or Decimal('0'),
            'recent_amount': user_transactions.filter(
                posted_date__gte=date.today().replace(day=1)
            ).aggregate(total=Sum('amount'))['total'] or Decimal('0')
        }
    
    return render(request, 'finwise_app/categories.html', {
        'categories': categories,
        'category_stats': category_stats
    })


@login_required
@require_http_methods(["POST"])
def recategorize_transactions(request):
    """Manually trigger re-categorization of uncategorized transactions"""
    try:
        # Find uncategorized transactions
        uncategorized = Transaction.objects.filter(
            Q(category__isnull=True) | Q(is_categorized=False)
        )
        
        if not uncategorized.exists():
            messages.info(request, "No uncategorized transactions found.")
            return redirect('dashboard')
        
        # Run categorization
        categorizer = TransactionCategorizationService()
        stats = categorizer.categorize_bulk_transactions(list(uncategorized))
        
        messages.success(
            request, 
            f"Recategorized {stats['categorized']} of {stats['total']} transactions."
        )
        
    except Exception as e:
        messages.error(request, f"Error during recategorization: {e}")
    
    return redirect('dashboard')


@login_required
@require_http_methods(["POST"])
def setup_default_categories(request):
    """Create default spending categories with keywords"""
    try:
        created_count = create_default_categories()
        if created_count > 0:
            messages.success(request, f"Created {created_count} default categories.")
        else:
            messages.info(request, "Default categories already exist.")
    except Exception as e:
        messages.error(request, f"Error creating default categories: {e}")
    
    return redirect('categories')


# Account Management Views

@login_required
def account_view(request):
    """Display user account details and data management options"""
    user = request.user
    
    # Get account statistics
    user_accounts = Account.objects.filter(user=user)
    total_transactions = Transaction.objects.filter(account__user=user).count()
    total_categories = Category.objects.filter(is_active=True).count()  # Categories are shared
    total_budgets = Budget.objects.filter(user=user).count()
    
    # Get account balance summary
    account_balances = []
    total_balance = Decimal('0')
    
    for account in user_accounts:
        # Calculate balance from transactions
        balance = account.transactions.aggregate(total=Sum('amount'))['total'] or Decimal('0')
        total_balance += balance
        
        account_balances.append({
            'account': account,
            'balance': balance,
            'transaction_count': account.transactions.count()
        })
    
    # Recent activity (last 5 transactions)
    recent_transactions = Transaction.objects.filter(
        account__user=user
    ).order_by('-posted_date')[:5]
    
    # Account age
    account_age_days = (timezone.now().date() - user.date_joined.date()).days
    
    # Calculate data usage
    data_stats = {
        'total_transactions': total_transactions,
        'total_categories': total_categories,
        'total_budgets': total_budgets,
        'accounts_count': user_accounts.count(),
        'total_balance': total_balance,
        'account_age_days': account_age_days,
    }
    
    context = {
        'user': user,
        'account_balances': account_balances,
        'data_stats': data_stats,
        'recent_transactions': recent_transactions,
    }
    
    return render(request, 'finwise_app/account.html', context)


@login_required
@require_http_methods(["POST"])
def update_account(request):
    """Update user account information"""
    user = request.user
    
    # Update basic information
    first_name = request.POST.get('first_name', '').strip()
    last_name = request.POST.get('last_name', '').strip()
    email = request.POST.get('email', '').strip()
    
    if not email:
        messages.error(request, "Email is required.")
        return redirect('account')
    
    # Check if email is already taken by another user
    if User.objects.filter(email=email).exclude(id=user.id).exists():
        messages.error(request, "Email is already taken by another user.")
        return redirect('account')
    
    # Update user information
    user.first_name = first_name
    user.last_name = last_name
    user.email = email
    user.save()
    
    messages.success(request, "Account information updated successfully.")
    return redirect('account')


@login_required
@require_http_methods(["POST"])
def change_password(request):
    """Change user password"""
    user = request.user
    
    current_password = request.POST.get('current_password', '')
    new_password = request.POST.get('new_password', '')
    confirm_password = request.POST.get('confirm_password', '')
    
    # Validate current password
    if not user.check_password(current_password):
        messages.error(request, "Current password is incorrect.")
        return redirect('account')
    
    # Validate new password
    if len(new_password) < 8:
        messages.error(request, "New password must be at least 8 characters long.")
        return redirect('account')
    
    if new_password != confirm_password:
        messages.error(request, "New passwords do not match.")
        return redirect('account')
    
    # Update password
    user.set_password(new_password)
    user.save()
    
    # Re-authenticate user
    user = authenticate(request, username=user.username, password=new_password)
    if user:
        login(request, user)
    
    messages.success(request, "Password changed successfully.")
    return redirect('account')


@login_required
@require_http_methods(["POST"])
def delete_account(request):
    """Delete user account and all associated data"""
    user = request.user
    confirm_username = request.POST.get('confirm_username', '').strip()
    
    # Verify username confirmation
    if confirm_username != user.username:
        messages.error(request, "Username confirmation does not match.")
        return redirect('account')
    
    try:
        # Delete all user data
        Account.objects.filter(user=user).delete()
        Category.objects.filter(user=user).delete()
        Budget.objects.filter(user=user).delete()
        # Transactions are deleted via cascade when accounts are deleted
        
        # Delete user account
        user.delete()
        
        messages.success(request, "Account deleted successfully.")
        return redirect('home')
        
    except Exception as e:
        messages.error(request, f"Error deleting account: {e}")
        return redirect('account')


@login_required
def export_data(request):
    """Export all user data as JSON"""
    import json
    from django.http import HttpResponse
    from django.core import serializers
    
    user = request.user
    
    try:
        # Collect all user data
        user_data = {
            'user_info': {
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'date_joined': user.date_joined.isoformat(),
            },
            'accounts': [],
            'categories': [],
            'budgets': [],
            'transactions': [],
        }
        
        # Export accounts
        for account in Account.objects.filter(user=user):
            user_data['accounts'].append({
                'name': account.name,
                'account_type': account.account_type,
                'balance': str(account.balance) if account.balance else '0',
                'created_at': account.created_at.isoformat() if hasattr(account, 'created_at') else None,
            })
        
        # Export categories
        for category in Category.objects.filter(user=user):
            user_data['categories'].append({
                'name': category.name,
                'description': category.description,
                'created_at': category.created_at.isoformat() if hasattr(category, 'created_at') else None,
            })
        
        # Export budgets
        for budget in Budget.objects.filter(user=user):
            user_data['budgets'].append({
                'category': budget.category.name if budget.category else None,
                'amount': str(budget.amount),
                'period': budget.period,
                'created_at': budget.created_at.isoformat() if hasattr(budget, 'created_at') else None,
            })
        
        # Export transactions
        for transaction in Transaction.objects.filter(account__user=user):
            user_data['transactions'].append({
                'date': transaction.date.isoformat(),
                'description': transaction.description,
                'amount': str(transaction.amount),
                'account': transaction.account.name,
                'category': transaction.category.name if transaction.category else None,
                'transaction_type': transaction.transaction_type,
                'categorized_at': transaction.categorized_at.isoformat() if transaction.categorized_at else None,
            })
        
        # Create response
        response = HttpResponse(
            json.dumps(user_data, indent=2, ensure_ascii=False),
            content_type='application/json'
        )
        response['Content-Disposition'] = f'attachment; filename="finwise_data_{user.username}_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json"'
        
        return response
        
    except Exception as e:
        messages.error(request, f"Error exporting data: {e}")
        return redirect('account')


@login_required
@require_http_methods(["POST"])
def clean_data(request):
    """Clean user data based on selected options"""
    user = request.user
    
    clean_transactions = request.POST.get('clean_transactions') == 'on'
    clean_categories = request.POST.get('clean_categories') == 'on'
    clean_budgets = request.POST.get('clean_budgets') == 'on'
    clean_duplicates = request.POST.get('clean_duplicates') == 'on'
    clean_old_data = request.POST.get('clean_old_data') == 'on'
    clean_bills = request.POST.get('clean_bills') == 'on'
    
    try:
        deleted_count = 0
        
        if clean_duplicates:
            # Remove duplicate transactions based on FITID
            from django.db.models import Count
            # Find accounts with duplicate FITIDs
            duplicates = Transaction.objects.filter(
                account__user=user
            ).values(
                'fitid', 'account'
            ).annotate(
                count=Count('id')
            ).filter(count__gt=1)
            
            for duplicate in duplicates:
                # Keep the first transaction, delete the rest
                transactions = Transaction.objects.filter(
                    account__user=user,
                    fitid=duplicate['fitid'],
                    account_id=duplicate['account']
                ).order_by('id')
                
                if transactions.count() > 1:
                    transactions_to_delete = transactions[1:]
                    count = transactions_to_delete.count()
                    transactions_to_delete.delete()
                    deleted_count += count
        
        if clean_old_data:
            # Remove transactions older than 2 years
            from datetime import timedelta
            from django.utils import timezone
            cutoff_date = timezone.now() - timedelta(days=730)
            old_transactions = Transaction.objects.filter(
                account__user=user,
                posted_date__lt=cutoff_date
            )
            deleted_count += old_transactions.count()
            old_transactions.delete()
        
        if clean_transactions:
            # Remove all transactions
            transactions = Transaction.objects.filter(account__user=user)
            deleted_count += transactions.count()
            transactions.delete()
        
        if clean_categories:
            # Categories are global and shared - don't delete them
            # Instead, just inform the user that categories cannot be cleaned
            messages.info(request, "Categories are shared system-wide and cannot be deleted individually.")
        
        if clean_budgets:
            # Remove all budgets
            budgets = Budget.objects.filter(user=user)
            deleted_count += budgets.count()
            budgets.delete()
        
        if clean_bills:
            # Remove all bills
            bills = Bill.objects.filter(user=user)
            deleted_count += bills.count()
            bills.delete()
        
        if deleted_count > 0:
            messages.success(request, f"Successfully cleaned {deleted_count} items from your data.")
        else:
            messages.info(request, "No items were cleaned based on your selections.")
            
    except Exception as e:
        messages.error(request, f"Error cleaning data: {e}")
    
    return redirect('account')


# Bill Management Views

@login_required
def bills(request):
    """Display all bills for the current user"""
    user = request.user
    
    # Get filter parameters
    status_filter = request.GET.get('status', '')
    frequency_filter = request.GET.get('frequency', '')
    
    # Base queryset
    bills_queryset = Bill.objects.filter(user=user)
    
    # Apply filters
    if status_filter:
        bills_queryset = bills_queryset.filter(status=status_filter)
    if frequency_filter:
        bills_queryset = bills_queryset.filter(frequency=frequency_filter)
    
    # Update overdue bills
    from django.utils import timezone
    overdue_bills = bills_queryset.filter(
        due_date__lt=timezone.now().date(),
        status='PENDING'
    )
    overdue_bills.update(status='OVERDUE')
    
    # Get bills with additional context
    bills_list = bills_queryset.order_by('due_date', 'name')
    
    # Calculate summary statistics
    total_pending = bills_queryset.filter(status='PENDING').count()
    total_overdue = bills_queryset.filter(status='OVERDUE').count()
    total_paid_this_month = bills_queryset.filter(
        status='PAID',
        last_paid_date__month=timezone.now().month,
        last_paid_date__year=timezone.now().year
    ).count()
    
    # Get bills needing reminders
    bills_needing_reminders = [bill for bill in bills_list if bill.needs_reminder()]
    
    context = {
        'bills': bills_list,
        'status_filter': status_filter,
        'frequency_filter': frequency_filter,
        'bill_status_choices': Bill.STATUS_CHOICES,
        'bill_frequency_choices': Bill.FREQUENCY_CHOICES,
        'total_pending': total_pending,
        'total_overdue': total_overdue,
        'total_paid_this_month': total_paid_this_month,
        'bills_needing_reminders': bills_needing_reminders,
    }
    
    return render(request, 'finwise_app/bills.html', context)


@login_required
def add_bill(request):
    """Add a new bill"""
    if request.method == 'POST':
        try:
            # Get form data
            name = request.POST.get('name', '').strip()
            description = request.POST.get('description', '').strip()
            amount = Decimal(request.POST.get('amount', '0'))
            due_date = datetime.strptime(request.POST.get('due_date'), '%Y-%m-%d').date()
            frequency = request.POST.get('frequency', 'MONTHLY')
            category_id = request.POST.get('category')
            reminder_days = int(request.POST.get('reminder_days', 3))
            reminder_enabled = request.POST.get('reminder_enabled') == 'on'
            
            # Validation
            if not name:
                messages.error(request, 'Bill name is required.')
                return redirect('add_bill')
            
            if amount <= 0:
                messages.error(request, 'Amount must be greater than 0.')
                return redirect('add_bill')
            
            # Get related objects
            category = None
            if category_id:
                category = get_object_or_404(Category, id=category_id)
            
            # Create bill
            bill = Bill.objects.create(
                user=request.user,
                name=name,
                description=description,
                amount=amount,
                due_date=due_date,
                frequency=frequency,
                category=category,
                reminder_days=reminder_days,
                reminder_enabled=reminder_enabled,
            )
            
            messages.success(request, f'Bill "{bill.name}" has been added successfully.')
            return redirect('bills')
            
        except ValueError as e:
            messages.error(request, f'Invalid data provided: {e}')
        except Exception as e:
            messages.error(request, f'Error creating bill: {e}')
    
    # Get context for form
    categories = Category.objects.filter(is_active=True).order_by('name')
    
    context = {
        'categories': categories,
        'bill_frequency_choices': Bill.FREQUENCY_CHOICES,
    }
    
    return render(request, 'finwise_app/add_bill.html', context)


@login_required
def edit_bill(request, bill_id):
    """Edit an existing bill"""
    bill = get_object_or_404(Bill, id=bill_id, user=request.user)
    
    if request.method == 'POST':
        try:
            # Update bill data
            bill.name = request.POST.get('name', '').strip()
            bill.description = request.POST.get('description', '').strip()
            bill.amount = Decimal(request.POST.get('amount', '0'))
            bill.due_date = datetime.strptime(request.POST.get('due_date'), '%Y-%m-%d').date()
            bill.frequency = request.POST.get('frequency', 'MONTHLY')
            bill.reminder_days = int(request.POST.get('reminder_days', 3))
            bill.reminder_enabled = request.POST.get('reminder_enabled') == 'on'
            
            # Update category
            category_id = request.POST.get('category')
            if category_id:
                bill.category = get_object_or_404(Category, id=category_id)
            else:
                bill.category = None
            
            # Validation
            if not bill.name:
                messages.error(request, 'Bill name is required.')
                return redirect('edit_bill', bill_id=bill.id)
            
            if bill.amount <= 0:
                messages.error(request, 'Amount must be greater than 0.')
                return redirect('edit_bill', bill_id=bill.id)
            
            bill.save()
            messages.success(request, f'Bill "{bill.name}" has been updated successfully.')
            return redirect('bills')
            
        except ValueError as e:
            messages.error(request, f'Invalid data provided: {e}')
        except Exception as e:
            messages.error(request, f'Error updating bill: {e}')
    
    # Get context for form
    categories = Category.objects.filter(is_active=True).order_by('name')
    
    context = {
        'bill': bill,
        'categories': categories,
        'bill_frequency_choices': Bill.FREQUENCY_CHOICES,
    }
    
    return render(request, 'finwise_app/edit_bill.html', context)


@login_required
@require_http_methods(["POST"])
def delete_bill(request, bill_id):
    """Delete a bill"""
    bill = get_object_or_404(Bill, id=bill_id, user=request.user)
    bill_name = bill.name
    
    try:
        bill.delete()
        messages.success(request, f'Bill "{bill_name}" has been deleted successfully.')
    except Exception as e:
        messages.error(request, f'Error deleting bill: {e}')
    
    return redirect('bills')


@login_required
@require_http_methods(["POST"])
def mark_bill_paid(request, bill_id):
    """Mark a bill as paid"""
    bill = get_object_or_404(Bill, id=bill_id, user=request.user)
    
    try:
        paid_date_str = request.POST.get('paid_date')
        if paid_date_str:
            paid_date = datetime.strptime(paid_date_str, '%Y-%m-%d').date()
        else:
            from django.utils import timezone
            paid_date = timezone.now().date()
        
        bill.mark_as_paid(paid_date)
        messages.success(request, f'Bill "{bill.name}" has been marked as paid.')
    except Exception as e:
        messages.error(request, f'Error marking bill as paid: {e}')
    
    return redirect('bills')


@login_required
@require_http_methods(["POST"])
def mark_bill_pending(request, bill_id):
    """Mark a bill as pending (unpaid)"""
    bill = get_object_or_404(Bill, id=bill_id, user=request.user)
    
    try:
        bill.status = 'PENDING'
        bill.last_paid_date = None
        bill.save()
        messages.success(request, f'Bill "{bill.name}" has been marked as pending.')
    except Exception as e:
        messages.error(request, f'Error updating bill status: {e}')
    
    return redirect('bills')


@login_required
def bill_reminders(request):
    """Show bills that need reminders"""
    user = request.user
    
    # Get bills needing reminders
    bills = Bill.objects.filter(user=user, status='PENDING')
    bills_needing_reminders = [bill for bill in bills if bill.needs_reminder()]
    
    # Get overdue bills
    from django.utils import timezone
    overdue_bills = bills.filter(due_date__lt=timezone.now().date())
    
    context = {
        'bills_needing_reminders': bills_needing_reminders,
        'overdue_bills': overdue_bills,
    }
    
    return render(request, 'finwise_app/bill_reminders.html', context)