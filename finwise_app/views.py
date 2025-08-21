from django.shortcuts import render, redirect
from django.contrib import messages
from django.views.decorators.http import require_http_methods
from django.contrib.auth.decorators import login_required
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.core.files.uploadedfile import UploadedFile

from .services.ofx_importer import import_ofx
from .models import Account, Transaction

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
    recent = Transaction.objects.select_related("account").all().order_by("-posted_date")[:10]
    return render(request, 'finwise_app/dashboard.html', {"accounts": accounts, "recent": recent})


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
            account, created_count = import_ofx(content)
            messages.success(
                request,
                f"Imported {created_count} transactions into account {account}.",
            )
            return redirect("dashboard")
        except Exception as e:  # broad: surface parsing errors to user succinctly
            messages.error(request, f"Failed to import OFX: {e}")
            return redirect("import_transactions")

    return render(request, "finwise_app/import_transactions.html")


@require_http_methods(["POST"]) 
def logout_view(request):
    logout(request)
    return redirect("home")