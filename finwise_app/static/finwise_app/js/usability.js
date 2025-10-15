// Enhanced User Feedback and System Status Visibility

class SystemStatusManager {
    constructor() {
        this.init();
    }

    init() {
        this.addLoadingIndicators();
        this.enhanceFormSubmissions();
        this.addProgressIndicators();
        this.improveFileUploadFeedback();
    }

    // Add loading indicators for all forms
    addLoadingIndicators() {
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            form.addEventListener('submit', (e) => {
                const submitButton = form.querySelector('button[type="submit"]');
                if (submitButton && !submitButton.dataset.loading) {
                    this.showLoadingState(submitButton);
                }
            });
        });
    }

    showLoadingState(button) {
        button.dataset.loading = 'true';
        button.dataset.originalText = button.innerHTML;
        button.disabled = true;
        button.innerHTML = `
            <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
            Processing...
        `;
    }

    hideLoadingState(button) {
        if (button && button.dataset.loading === 'true') {
            button.disabled = false;
            button.innerHTML = button.dataset.originalText;
            delete button.dataset.loading;
            delete button.dataset.originalText;
        }
    }

    // Enhanced form submissions with better feedback
    enhanceFormSubmissions() {
        // File upload forms
        const fileInputs = document.querySelectorAll('input[type="file"]');
        fileInputs.forEach(input => {
            input.addEventListener('change', (e) => {
                this.showFileInfo(e.target);
            });
        });
    }

    showFileInfo(fileInput) {
        const file = fileInput.files[0];
        let feedbackElement = fileInput.parentNode.querySelector('.file-feedback');
        
        if (!feedbackElement) {
            feedbackElement = document.createElement('div');
            feedbackElement.className = 'file-feedback small mt-2';
            fileInput.parentNode.appendChild(feedbackElement);
        }

        if (file) {
            const size = this.formatFileSize(file.size);
            feedbackElement.innerHTML = `
                <div class="d-flex align-items-center text-success">
                    <i class="bi bi-check-circle me-2"></i>
                    <span><strong>${file.name}</strong> (${size}) selected</span>
                </div>
            `;
        } else {
            feedbackElement.innerHTML = '';
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Add progress indicators for multi-step processes
    addProgressIndicators() {
        this.createBreadcrumbs();
        this.addStepIndicators();
    }

    createBreadcrumbs() {
        const pageMap = {
            '/': 'Home',
            '/dashboard/': 'Dashboard',
            '/import/': 'Import Transactions',
            '/categories/': 'Categories',
            '/budgets/': 'Budgets',
            '/login/': 'Login',
            '/register/': 'Register'
        };

        const currentPath = window.location.pathname;
        const currentPage = pageMap[currentPath] || 'Page';
        
        if (currentPath !== '/') {
            const breadcrumbContainer = document.createElement('nav');
            breadcrumbContainer.setAttribute('aria-label', 'breadcrumb');
            breadcrumbContainer.innerHTML = `
                <ol class="breadcrumb">
                    <li class="breadcrumb-item"><a href="/">Home</a></li>
                    ${currentPath !== '/dashboard/' ? '<li class="breadcrumb-item"><a href="/dashboard/">Dashboard</a></li>' : ''}
                    <li class="breadcrumb-item active" aria-current="page">${currentPage}</li>
                </ol>
            `;

            const main = document.querySelector('main');
            if (main && main.firstChild) {
                main.insertBefore(breadcrumbContainer, main.firstChild);
            }
        }
    }

    addStepIndicators() {
        // Add step indicators for import process
        const importForm = document.querySelector('form[enctype="multipart/form-data"]');
        if (importForm) {
            const stepIndicator = document.createElement('div');
            stepIndicator.className = 'progress-steps mb-4';
            stepIndicator.innerHTML = `
                <div class="d-flex justify-content-between">
                    <div class="step active">
                        <div class="step-number">1</div>
                        <div class="step-label">Select File</div>
                    </div>
                    <div class="step">
                        <div class="step-number">2</div>
                        <div class="step-label">Upload</div>
                    </div>
                    <div class="step">
                        <div class="step-number">3</div>
                        <div class="step-label">Process</div>
                    </div>
                    <div class="step">
                        <div class="step-number">4</div>
                        <div class="step-label">Complete</div>
                    </div>
                </div>
            `;
            importForm.parentNode.insertBefore(stepIndicator, importForm);
        }
    }

    // Real-time feedback for file uploads
    improveFileUploadFeedback() {
        const fileInputs = document.querySelectorAll('input[type="file"]');
        fileInputs.forEach(input => {
            const form = input.closest('form');
            if (form) {
                form.addEventListener('submit', () => {
                    this.showUploadProgress();
                });
            }
        });
    }

    showUploadProgress() {
        const existingProgress = document.querySelector('.upload-progress');
        if (existingProgress) existingProgress.remove();

        const progressContainer = document.createElement('div');
        progressContainer.className = 'upload-progress mt-3';
        progressContainer.innerHTML = `
            <div class="alert alert-info">
                <div class="d-flex align-items-center">
                    <div class="spinner-border spinner-border-sm me-3" role="status">
                        <span class="visually-hidden">Uploading...</span>
                    </div>
                    <div>
                        <strong>Uploading and processing your file...</strong><br>
                        <small class="text-muted">This may take a few moments depending on file size.</small>
                    </div>
                </div>
                <div class="progress mt-2" style="height: 6px;">
                    <div class="progress-bar progress-bar-striped progress-bar-animated" 
                         role="progressbar" style="width: 100%"></div>
                </div>
            </div>
        `;

        const form = document.querySelector('form[enctype="multipart/form-data"]');
        if (form) {
            form.appendChild(progressContainer);
        }
    }
}

// Auto-dismiss alerts after a delay
class AlertManager {
    constructor() {
        this.init();
    }

    init() {
        this.enhanceAlerts();
        this.addDismissibleAlerts();
    }

    enhanceAlerts() {
        const alerts = document.querySelectorAll('.alert');
        alerts.forEach(alert => {
            if (!alert.classList.contains('alert-dismissible')) {
                alert.classList.add('alert-dismissible');
                const closeBtn = document.createElement('button');
                closeBtn.type = 'button';
                closeBtn.className = 'btn-close';
                closeBtn.setAttribute('data-bs-dismiss', 'alert');
                closeBtn.setAttribute('aria-label', 'Close');
                alert.appendChild(closeBtn);
            }

            // Auto-dismiss success messages after 5 seconds
            if (alert.classList.contains('alert-success')) {
                setTimeout(() => {
                    if (alert.parentNode) {
                        alert.remove();
                    }
                }, 5000);
            }
        });
    }

    addDismissibleAlerts() {
        // Make all messages dismissible
        const messages = document.querySelectorAll('.alert');
        messages.forEach(message => {
            if (!message.querySelector('.btn-close')) {
                const closeBtn = document.createElement('button');
                closeBtn.type = 'button';
                closeBtn.className = 'btn-close';
                closeBtn.setAttribute('data-bs-dismiss', 'alert');
                closeBtn.setAttribute('aria-label', 'Close');
                message.appendChild(closeBtn);
            }
        });
    }

    static showToast(message, type = 'info', duration = 3000) {
        const toastContainer = document.getElementById('toast-container') || this.createToastContainer();
        
        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-white bg-${type} border-0`;
        toast.setAttribute('role', 'alert');
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" 
                        data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        `;

        toastContainer.appendChild(toast);
        
        const bsToast = new bootstrap.Toast(toast, { delay: duration });
        bsToast.show();

        // Remove from DOM after hiding
        toast.addEventListener('hidden.bs.toast', () => {
            toast.remove();
        });
    }

    static createToastContainer() {
        const container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container position-fixed top-0 end-0 p-3';
        container.style.zIndex = '1055';
        document.body.appendChild(container);
        return container;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new SystemStatusManager();
    new AlertManager();
});

// Export for use in other scripts
window.FinWise = window.FinWise || {};
window.FinWise.SystemStatusManager = SystemStatusManager;
window.FinWise.AlertManager = AlertManager;