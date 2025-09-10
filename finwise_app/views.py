from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.views.decorators.http import require_http_methods
from django.contrib.auth.decorators import login_required
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.core.files.uploadedfile import UploadedFile
from django.http import JsonResponse
from django.db.models import Sum, Q
from datetime import datetime, date
from decimal import Decimal

from .services.ofx_importer import import_ofx
from .services.ofx_importer_alternative import import_ofx_alternative
from .services.categorization_service import TransactionCategorizationService, create_default_categories
from .models import Account, Transaction, Category, Budget

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

def dashboard(request):
    accounts = Account.objects.all().order_by("name", "account_id")[:20]
    recent = Transaction.objects.select_related("account", "category").all().order_by("-posted_date")[:10]
    
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
        "recent": recent,
        "budget_summary": budget_summary
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
                account, created_count = import_ofx(content)
                messages.success(
                    request,
                    f"Imported {created_count} transactions into account {account}.",
                )
                return redirect("dashboard")
            except Exception as primary_error:
                # Fallback to alternative regex-based parser
                try:
                    account, created_count = import_ofx_alternative(content)
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
    """FR05: Display user's budgets with create/edit/delete functionality"""
    current_month = date.today().replace(day=1)
    
    # Get current month budgets
    budgets = Budget.objects.filter(
        user=request.user, 
        month=current_month
    ).select_related('category').order_by('category__name')
    
    # Get all categories for creating new budgets
    categories = Category.objects.filter(is_active=True).order_by('name')
    
    # Calculate summary stats
    total_budgeted = sum(b.amount for b in budgets)
    total_spent = sum(b.get_spent_amount() for b in budgets)
    over_threshold_count = sum(1 for b in budgets if b.is_over_threshold())
    
    context = {
        'budgets': budgets,
        'categories': categories,
        'current_month': current_month,
        'total_budgeted': total_budgeted,
        'total_spent': total_spent,
        'over_threshold_count': over_threshold_count,
    }
    
    return render(request, 'finwise_app/budgets.html', context)


@login_required
@require_http_methods(["POST"])
def create_budget(request):
    """FR05: Create a new monthly budget for a category"""
    category_id = request.POST.get('category_id')
    amount = request.POST.get('amount')
    month_str = request.POST.get('month')  # Format: YYYY-MM
    
    try:
        category = get_object_or_404(Category, id=category_id, is_active=True)
        amount = Decimal(amount)
        
        if amount <= 0:
            messages.error(request, "Budget amount must be greater than zero.")
            return redirect('budgets')
        
        # Parse month
        if month_str:
            year, month = map(int, month_str.split('-'))
            budget_month = date(year, month, 1)
        else:
            budget_month = date.today().replace(day=1)
        
        # Create or update budget
        budget, created = Budget.objects.update_or_create(
            user=request.user,
            category=category,
            month=budget_month,
            defaults={'amount': amount}
        )
        
        action = "created" if created else "updated"
        messages.success(request, f"Budget for {category.name} {action} successfully.")
        
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
def categories_view(request):
    """Manage spending categories"""
    categories = Category.objects.filter(is_active=True).order_by('name')
    
    # Get transaction counts per category
    category_stats = {}
    for category in categories:
        category_stats[category.id] = {
            'transaction_count': category.transactions.count(),
            'recent_amount': category.transactions.filter(
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