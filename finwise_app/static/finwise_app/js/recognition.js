// Recognition over Recall - Contextual Help and Tooltips

class RecognitionManager {
    constructor() {
        this.tooltips = new Map();
        this.init();
    }

    init() {
        this.addTooltips();
        this.addContextualHelp();
        this.enhanceFormLabels();
        this.addVisualCues();
        this.implementSmartDefaults();
        this.addInlineHelp();
    }

    // Add tooltips throughout the interface
    addTooltips() {
        // Financial terminology tooltips
        const tooltipData = {
            'OFX': 'Open Financial Exchange - A standard format used by banks to share financial data. Most banks offer OFX file downloads in their online banking systems.',
            'Budget': 'A spending plan that helps you track and control your expenses by category. Set monthly limits to stay on track with your financial goals.',
            'Category': 'A classification system for grouping similar transactions (e.g., groceries, dining, utilities) to better understand spending patterns.',
            'Transaction': 'A single financial activity - either money coming in (income) or going out (expense) from your account.',
            'Account ID': 'A unique identifier for your bank account, used to match transactions to the correct account.',
            'Posted Date': 'The date when a transaction was officially processed and recorded by your bank.',
            'Memo': 'Additional details about a transaction, often showing the merchant name or transaction description.',
            'Reconcile': 'The process of matching your imported transactions with your actual bank records to ensure accuracy.'
        };

        // Add tooltips to existing elements
        this.addFinancialTermTooltips(tooltipData);
        
        // Add icon tooltips
        this.addIconTooltips();
        
        // Add form field tooltips
        this.addFormFieldTooltips();
        
        // Initialize Bootstrap tooltips
        this.initializeBootstrapTooltips();
    }

    addFinancialTermTooltips(tooltipData) {
        Object.entries(tooltipData).forEach(([term, description]) => {
            // Find elements containing these terms
            const elements = document.querySelectorAll('*');
            elements.forEach(element => {
                if (element.children.length === 0 && element.textContent.includes(term)) {
                    this.wrapTermWithTooltip(element, term, description);
                }
            });
        });
    }

    wrapTermWithTooltip(element, term, description) {
        const text = element.textContent;
        const regex = new RegExp(`\\b${term}\\b`, 'gi');
        
        if (regex.test(text)) {
            const newHTML = text.replace(regex, (match) => {
                return `<span class="tooltip-term" data-bs-toggle="tooltip" data-bs-placement="top" title="${description}">${match}</span>`;
            });
            element.innerHTML = newHTML;
        }
    }

    addIconTooltips() {
        const iconTooltips = {
            'bi-upload': 'Import bank statements and financial data',
            'bi-download': 'Export or download data',
            'bi-trash': 'Delete this item permanently',
            'bi-pencil': 'Edit this item',
            'bi-eye': 'View details',
            'bi-plus': 'Add new item',
            'bi-gear': 'Settings and configuration',
            'bi-question-circle': 'Get help and information',
            'bi-shield-check': 'Secure and protected',
            'bi-exclamation-triangle': 'Warning or attention needed',
            'bi-check-circle': 'Success or completed',
            'bi-info-circle': 'Additional information available'
        };

        Object.entries(iconTooltips).forEach(([iconClass, tooltip]) => {
            const icons = document.querySelectorAll(`.${iconClass}`);
            icons.forEach(icon => {
                if (!icon.closest('[data-bs-toggle="tooltip"]')) {
                    icon.setAttribute('data-bs-toggle', 'tooltip');
                    icon.setAttribute('data-bs-placement', 'top');
                    icon.setAttribute('title', tooltip);
                }
            });
        });
    }

    addFormFieldTooltips() {
        const fieldTooltips = {
            'username': 'Choose a unique name to identify your account. Use letters, numbers, and underscores only.',
            'password': 'Create a strong password with at least 8 characters, including uppercase, lowercase, and numbers.',
            'confirm_password': 'Re-enter your password to make sure it matches.',
            'email': 'Your email address for account recovery and notifications (optional).',
            'ofx_file': 'Select an OFX file downloaded from your bank\'s website. Usually found in "Export Transactions" section.'
        };

        Object.entries(fieldTooltips).forEach(([fieldName, tooltip]) => {
            const field = document.querySelector(`input[name="${fieldName}"], select[name="${fieldName}"], textarea[name="${fieldName}"]`);
            if (field && !field.getAttribute('data-bs-toggle')) {
                field.setAttribute('data-bs-toggle', 'tooltip');
                field.setAttribute('data-bs-placement', 'right');
                field.setAttribute('title', tooltip);
            }
        });
    }

    initializeBootstrapTooltips() {
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl, {
                trigger: 'hover focus',
                delay: { show: 500, hide: 100 }
            });
        });
    }

    // Add contextual help panels
    addContextualHelp() {
        this.addPageSpecificHelp();
        this.addFormHelp();
    }

    addPageSpecificHelp() {
        const currentPath = window.location.pathname;
        const helpContent = this.getHelpContentForPath(currentPath);
        
        if (helpContent) {
            this.createHelpPanel(helpContent);
        }
    }

    getHelpContentForPath(path) {
        const helpMap = {
            '/dashboard/': {
                title: 'Dashboard Overview',
                content: `
                    <div class="help-section">
                        <h6><i class="bi bi-speedometer2 me-2"></i>Your Financial Dashboard</h6>
                        <p>This is your main financial overview. Here you can:</p>
                        <ul>
                            <li><strong>View Accounts:</strong> See all your imported bank accounts</li>
                            <li><strong>Recent Transactions:</strong> Monitor your latest financial activity</li>
                            <li><strong>Budget Summary:</strong> Track your monthly spending against budgets</li>
                        </ul>
                        <div class="mt-3">
                            <small class="text-muted">
                                <i class="bi bi-lightbulb me-1"></i>
                                <strong>Tip:</strong> Start by importing your bank statements to see your data here.
                            </small>
                        </div>
                    </div>
                `
            },
            '/import/': {
                title: 'Import Bank Statements',
                content: `
                    <div class="help-section">
                        <h6><i class="bi bi-upload me-2"></i>How to Import Transactions</h6>
                        <div class="step-guide">
                            <div class="step">
                                <div class="step-number">1</div>
                                <div class="step-content">
                                    <strong>Get OFX File:</strong> Log into your online banking and look for "Export" or "Download Transactions"
                                </div>
                            </div>
                            <div class="step">
                                <div class="step-number">2</div>
                                <div class="step-content">
                                    <strong>Select Format:</strong> Choose "OFX", "Quicken", or "Money" format when downloading
                                </div>
                            </div>
                            <div class="step">
                                <div class="step-number">3</div>
                                <div class="step-content">
                                    <strong>Upload Here:</strong> Select the downloaded file and click "Import Transactions"
                                </div>
                            </div>
                        </div>
                        <div class="alert alert-info mt-3">
                            <i class="bi bi-shield-check me-2"></i>
                            Your financial data is processed locally and securely. We never store your bank login credentials.
                        </div>
                    </div>
                `
            },
            '/categories/': {
                title: 'Spending Categories',
                content: `
                    <div class="help-section">
                        <h6><i class="bi bi-tags me-2"></i>Understanding Categories</h6>
                        <p>Categories help you understand your spending patterns by grouping similar transactions:</p>
                        <ul>
                            <li><strong>Automatic Categorization:</strong> Transactions are automatically sorted based on merchant names and keywords</li>
                            <li><strong>Custom Keywords:</strong> Add keywords to improve automatic categorization</li>
                            <li><strong>Color Coding:</strong> Each category has a unique color for easy identification</li>
                        </ul>
                        <div class="mt-3">
                            <small class="text-muted">
                                <i class="bi bi-lightbulb me-1"></i>
                                <strong>Tip:</strong> Use "Recategorize Transactions" after adding new keywords to update existing transactions.
                            </small>
                        </div>
                    </div>
                `
            },
            '/budgets/': {
                title: 'Budget Management',
                content: `
                    <div class="help-section">
                        <h6><i class="bi bi-piggy-bank me-2"></i>Creating Effective Budgets</h6>
                        <p>Budgets help you control spending by setting monthly limits for each category:</p>
                        <ul>
                            <li><strong>Set Realistic Goals:</strong> Base budgets on your actual spending history</li>
                            <li><strong>Monitor Progress:</strong> Watch the progress bars to stay on track</li>
                            <li><strong>Adjust as Needed:</strong> Update budget amounts based on changing needs</li>
                        </ul>
                        <div class="alert alert-warning mt-3">
                            <i class="bi bi-exclamation-triangle me-2"></i>
                            Budgets over 80% usage are highlighted to help you avoid overspending.
                        </div>
                    </div>
                `
            }
        };

        return helpMap[path];
    }

    createHelpPanel(helpContent) {
        // Create collapsible help panel
        const helpPanel = document.createElement('div');
        helpPanel.className = 'help-panel mb-4';
        helpPanel.innerHTML = `
            <div class="collapsible-section">
                <div class="collapsible-header" onclick="this.parentElement.classList.toggle('expanded')">
                    <div class="d-flex align-items-center">
                        <i class="bi bi-question-circle-fill text-info me-2"></i>
                        <span>${helpContent.title}</span>
                    </div>
                    <i class="bi bi-chevron-down expand-icon"></i>
                </div>
                <div class="collapsible-content">
                    ${helpContent.content}
                </div>
            </div>
        `;

        // Insert after the main heading
        const main = document.querySelector('main .container');
        if (main && main.firstElementChild) {
            main.insertBefore(helpPanel, main.firstElementChild.nextSibling);
        }
    }

    addFormHelp() {
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            this.addFormSpecificHelp(form);
        });
    }

    addFormSpecificHelp(form) {
        // Add help for file upload forms
        const fileInput = form.querySelector('input[type="file"]');
        if (fileInput) {
            this.addFileUploadHelp(fileInput);
        }

        // Add help for registration forms
        const passwordInput = form.querySelector('input[name="password"]');
        if (passwordInput && form.querySelector('input[name="confirm_password"]')) {
            this.addPasswordHelp(passwordInput);
        }
    }

    addFileUploadHelp(fileInput) {
        const helpContent = document.createElement('div');
        helpContent.className = 'file-upload-help mt-3';
        helpContent.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h6 class="mb-0"><i class="bi bi-info-circle me-2"></i>Need help finding your OFX file?</h6>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-6">
                            <h6>Common Bank Locations:</h6>
                            <ul class="list-unstyled">
                                <li><i class="bi bi-arrow-right me-2"></i>Account → Export</li>
                                <li><i class="bi bi-arrow-right me-2"></i>Statements → Download</li>
                                <li><i class="bi bi-arrow-right me-2"></i>Tools → Export Data</li>
                                <li><i class="bi bi-arrow-right me-2"></i>Reports → Transaction Export</li>
                            </ul>
                        </div>
                        <div class="col-md-6">
                            <h6>File Format Options:</h6>
                            <ul class="list-unstyled">
                                <li><i class="bi bi-check text-success me-2"></i>OFX (Open Financial Exchange)</li>
                                <li><i class="bi bi-check text-success me-2"></i>QFX (Quicken format)</li>
                                <li><i class="bi bi-check text-success me-2"></i>XML (if from your bank)</li>
                                <li><i class="bi bi-x text-danger me-2"></i>CSV or Excel files</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        `;

        fileInput.parentNode.appendChild(helpContent);
    }

    addPasswordHelp(passwordInput) {
        const helpContent = document.createElement('div');
        helpContent.className = 'password-help mt-2';
        helpContent.innerHTML = `
            <div class="alert alert-info">
                <h6><i class="bi bi-shield-check me-2"></i>Password Security Tips</h6>
                <ul class="mb-0">
                    <li>Use at least 8 characters</li>
                    <li>Include uppercase and lowercase letters</li>
                    <li>Add numbers and special characters</li>
                    <li>Avoid common words or personal information</li>
                </ul>
            </div>
        `;

        passwordInput.parentNode.appendChild(helpContent);
    }

    // Enhance form labels with better descriptions
    enhanceFormLabels() {
        const labels = document.querySelectorAll('label');
        labels.forEach(label => {
            this.enhanceLabel(label);
        });
    }

    enhanceLabel(label) {
        const input = document.querySelector(`#${label.getAttribute('for')}`);
        if (!input) return;

        // Add visual indicators for required fields
        if (input.required && !label.querySelector('.required-indicator')) {
            const indicator = document.createElement('span');
            indicator.className = 'required-indicator text-danger';
            indicator.innerHTML = ' *';
            indicator.title = 'This field is required';
            label.appendChild(indicator);
        }

        // Add field type indicators
        this.addFieldTypeIndicator(label, input);
    }

    addFieldTypeIndicator(label, input) {
        if (label.querySelector('.field-type-indicator')) return;

        let indicator = '';
        let tooltip = '';

        switch (input.type) {
            case 'email':
                indicator = '<i class="bi bi-envelope"></i>';
                tooltip = 'Email address format required';
                break;
            case 'password':
                indicator = '<i class="bi bi-lock"></i>';
                tooltip = 'Secure password field';
                break;
            case 'file':
                indicator = '<i class="bi bi-file-earmark"></i>';
                tooltip = 'File upload field';
                break;
            case 'url':
                indicator = '<i class="bi bi-link"></i>';
                tooltip = 'Web address format required';
                break;
        }

        if (indicator) {
            const iconSpan = document.createElement('span');
            iconSpan.className = 'field-type-indicator me-2';
            iconSpan.innerHTML = indicator;
            iconSpan.title = tooltip;
            iconSpan.setAttribute('data-bs-toggle', 'tooltip');
            
            label.insertBefore(iconSpan, label.firstChild);
        }
    }

    // Add visual cues throughout the interface
    addVisualCues() {
        this.addStatusIndicators();
        this.addProgressIndicators();
        this.addActionCues();
    }

    addStatusIndicators() {
        // Add status indicators to various elements
        const statusElements = [
            { selector: '.text-success', status: 'success', icon: 'check-circle' },
            { selector: '.text-danger', status: 'danger', icon: 'exclamation-triangle' },
            { selector: '.text-warning', status: 'warning', icon: 'exclamation-triangle' },
            { selector: '.text-info', status: 'info', icon: 'info-circle' }
        ];

        statusElements.forEach(({ selector, status, icon }) => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                if (!element.querySelector('.status-icon') && element.textContent.trim()) {
                    const iconElement = document.createElement('i');
                    iconElement.className = `bi bi-${icon} status-icon me-1`;
                    element.insertBefore(iconElement, element.firstChild);
                }
            });
        });
    }

    addProgressIndicators() {
        // Enhance progress bars with labels
        const progressBars = document.querySelectorAll('.progress-bar');
        progressBars.forEach(bar => {
            if (!bar.textContent.trim()) {
                const percentage = bar.style.width || bar.getAttribute('aria-valuenow') + '%';
                bar.textContent = percentage;
            }
        });
    }

    addActionCues() {
        // Add hover effects and cues to interactive elements
        const interactiveElements = document.querySelectorAll('button, .btn, a[href], input[type="submit"]');
        interactiveElements.forEach(element => {
            if (!element.classList.contains('action-cue-added')) {
                element.classList.add('action-cue-added');
                
                // Add click animation
                element.addEventListener('click', (e) => {
                    element.style.transform = 'scale(0.95)';
                    setTimeout(() => {
                        element.style.transform = '';
                    }, 150);
                });
            }
        });
    }

    // Implement smart defaults
    implementSmartDefaults() {
        this.setFormDefaults();
        this.addPlaceholderText();
        this.enhanceSelectOptions();
    }

    setFormDefaults() {
        // Set intelligent defaults based on context
        const currentDate = new Date();
        const dateInputs = document.querySelectorAll('input[type="date"]');
        dateInputs.forEach(input => {
            if (!input.value && input.name.includes('start')) {
                // Default to first day of current month
                const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
                input.value = firstDay.toISOString().split('T')[0];
            } else if (!input.value && input.name.includes('end')) {
                // Default to today
                input.value = currentDate.toISOString().split('T')[0];
            }
        });
    }

    addPlaceholderText() {
        const placeholders = {
            'username': 'Enter your username',
            'email': 'your.email@example.com',
            'password': 'Create a secure password',
            'confirm_password': 'Confirm your password',
            'amount': '0.00',
            'search': 'Search...'
        };

        Object.entries(placeholders).forEach(([name, placeholder]) => {
            const inputs = document.querySelectorAll(`input[name="${name}"], input[id="${name}"]`);
            inputs.forEach(input => {
                if (!input.placeholder) {
                    input.placeholder = placeholder;
                }
            });
        });
    }

    enhanceSelectOptions() {
        const selects = document.querySelectorAll('select');
        selects.forEach(select => {
            if (select.options.length === 0 || select.options[0].value !== '') {
                // Add default "please select" option
                const defaultOption = document.createElement('option');
                defaultOption.value = '';
                defaultOption.textContent = `-- Select ${this.getSelectLabel(select)} --`;
                defaultOption.selected = true;
                select.insertBefore(defaultOption, select.firstChild);
            }
        });
    }

    getSelectLabel(select) {
        const label = document.querySelector(`label[for="${select.id}"]`);
        if (label) {
            return label.textContent.replace(/[*:]/g, '').trim().toLowerCase();
        }
        return select.name.replace(/_/g, ' ');
    }

    // Add inline help
    addInlineHelp() {
        this.addFieldExamples();
        this.addFormatHelp();
        this.addValidationHelp();
    }

    addFieldExamples() {
        const examples = {
            'email': 'Example: john.doe@gmail.com',
            'username': 'Example: john_doe123',
            'phone': 'Example: (555) 123-4567'
        };

        Object.entries(examples).forEach(([type, example]) => {
            const inputs = document.querySelectorAll(`input[type="${type}"], input[name="${type}"]`);
            inputs.forEach(input => {
                if (!input.parentNode.querySelector('.example-text')) {
                    const exampleText = document.createElement('small');
                    exampleText.className = 'example-text text-muted d-block mt-1';
                    exampleText.textContent = example;
                    input.parentNode.appendChild(exampleText);
                }
            });
        });
    }

    addFormatHelp() {
        // Add format help for specific inputs
        const formatHelp = {
            'date': 'Format: MM/DD/YYYY',
            'time': 'Format: HH:MM (24-hour)',
            'tel': 'Format: (XXX) XXX-XXXX'
        };

        Object.entries(formatHelp).forEach(([type, help]) => {
            const inputs = document.querySelectorAll(`input[type="${type}"]`);
            inputs.forEach(input => {
                if (!input.getAttribute('title')) {
                    input.setAttribute('title', help);
                    input.setAttribute('data-bs-toggle', 'tooltip');
                }
            });
        });
    }

    addValidationHelp() {
        // Add validation help messages
        const inputs = document.querySelectorAll('input[required]');
        inputs.forEach(input => {
            input.addEventListener('invalid', (e) => {
                e.preventDefault();
                const fieldName = this.getFieldDisplayName(input);
                this.showValidationHelp(input, `Please provide a valid ${fieldName.toLowerCase()}.`);
            });
        });
    }

    showValidationHelp(input, message) {
        // This integrates with the error prevention system
        if (window.FinWise && window.FinWise.ErrorPreventionManager) {
            // Use existing error display system
            const errorManager = new window.FinWise.ErrorPreventionManager();
            errorManager.showInputError(input, message);
        }
    }

    getFieldDisplayName(input) {
        const label = document.querySelector(`label[for="${input.id}"]`);
        if (label) {
            return label.textContent.replace(/[*:]/g, '').trim();
        }
        return input.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new RecognitionManager();
});

// Export for use in other scripts
window.FinWise = window.FinWise || {};
window.FinWise.RecognitionManager = RecognitionManager;