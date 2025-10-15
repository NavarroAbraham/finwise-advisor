// Error Prevention and Form Validation

class ErrorPreventionManager {
    constructor() {
        this.validationRules = {};
        this.init();
    }

    init() {
        this.enhanceFormValidation();
        this.addInputConstraints();
        this.preventCommonErrors();
        this.addConfirmationDialogs();
        this.implementClientSideValidation();
    }

    // Enhanced form validation
    enhanceFormValidation() {
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            this.setupFormValidation(form);
        });
    }

    setupFormValidation(form) {
        // Prevent double submission
        form.addEventListener('submit', (e) => {
            if (form.dataset.submitting === 'true') {
                e.preventDefault();
                return false;
            }
            
            if (this.validateForm(form)) {
                form.dataset.submitting = 'true';
                setTimeout(() => {
                    form.dataset.submitting = 'false';
                }, 3000);
            } else {
                e.preventDefault();
                return false;
            }
        });

        // Real-time validation
        const inputs = form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            this.setupInputValidation(input);
        });
    }

    setupInputValidation(input) {
        // Add validation on blur and input events
        input.addEventListener('blur', () => {
            this.validateInput(input);
        });

        input.addEventListener('input', () => {
            // Clear error state on input
            this.clearInputError(input);
            
            // Validate on input for specific types
            if (input.type === 'email' || input.type === 'url') {
                setTimeout(() => this.validateInput(input), 500);
            }
        });

        // Special handling for password confirmation
        if (input.name === 'confirm_password') {
            input.addEventListener('input', () => {
                this.validatePasswordConfirmation(input);
            });
        }

        // File upload validation
        if (input.type === 'file') {
            input.addEventListener('change', () => {
                this.validateFileInput(input);
            });
        }
    }

    validateForm(form) {
        let isValid = true;
        const inputs = form.querySelectorAll('input, select, textarea');
        
        inputs.forEach(input => {
            if (!this.validateInput(input)) {
                isValid = false;
            }
        });

        // Special form-level validations
        if (form.querySelector('input[name="confirm_password"]')) {
            if (!this.validatePasswordMatch(form)) {
                isValid = false;
            }
        }

        return isValid;
    }

    validateInput(input) {
        const value = input.value.trim();
        let isValid = true;
        let errorMessage = '';

        // Required field validation
        if (input.required && !value) {
            isValid = false;
            errorMessage = this.getRequiredFieldMessage(input);
        }
        
        // Type-specific validation
        else if (value) {
            switch (input.type) {
                case 'email':
                    if (!this.isValidEmail(value)) {
                        isValid = false;
                        errorMessage = 'Please enter a valid email address';
                    }
                    break;
                
                case 'password':
                    const passwordValidation = this.validatePassword(value);
                    if (!passwordValidation.isValid) {
                        isValid = false;
                        errorMessage = passwordValidation.message;
                    }
                    break;
                
                case 'file':
                    const fileValidation = this.validateFile(input);
                    if (!fileValidation.isValid) {
                        isValid = false;
                        errorMessage = fileValidation.message;
                    }
                    break;
            }

            // Name-specific validation
            if (input.name === 'username') {
                const usernameValidation = this.validateUsername(value);
                if (!usernameValidation.isValid) {
                    isValid = false;
                    errorMessage = usernameValidation.message;
                }
            }
        }

        // Update UI based on validation result
        if (isValid) {
            this.showInputSuccess(input);
        } else {
            this.showInputError(input, errorMessage);
        }

        return isValid;
    }

    validatePassword(password) {
        if (password.length < 8) {
            return {
                isValid: false,
                message: 'Password must be at least 8 characters long'
            };
        }

        if (!/(?=.*[a-z])(?=.*[A-Z])/.test(password)) {
            return {
                isValid: false,
                message: 'Password must contain both uppercase and lowercase letters'
            };
        }

        if (!/(?=.*\d)/.test(password)) {
            return {
                isValid: false,
                message: 'Password must contain at least one number'
            };
        }

        return { isValid: true };
    }

    validateUsername(username) {
        if (username.length < 3) {
            return {
                isValid: false,
                message: 'Username must be at least 3 characters long'
            };
        }

        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            return {
                isValid: false,
                message: 'Username can only contain letters, numbers, and underscores'
            };
        }

        return { isValid: true };
    }

    validatePasswordConfirmation(confirmInput) {
        const passwordInput = confirmInput.form.querySelector('input[name="password"]');
        if (passwordInput && confirmInput.value !== passwordInput.value) {
            this.showInputError(confirmInput, 'Passwords do not match');
            return false;
        } else if (confirmInput.value) {
            this.showInputSuccess(confirmInput);
        }
        return true;
    }

    validatePasswordMatch(form) {
        const password = form.querySelector('input[name="password"]');
        const confirm = form.querySelector('input[name="confirm_password"]');
        
        if (password && confirm && password.value !== confirm.value) {
            this.showInputError(confirm, 'Passwords do not match');
            return false;
        }
        return true;
    }

    validateFileInput(input) {
        const file = input.files[0];
        if (!file) return true;

        const validation = this.validateFile(input);
        if (!validation.isValid) {
            this.showInputError(input, validation.message);
            input.value = ''; // Clear invalid file
            return false;
        }

        this.showInputSuccess(input);
        return true;
    }

    validateFile(input) {
        const file = input.files[0];
        if (!file) return { isValid: true };

        // File size validation (10MB limit)
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            return {
                isValid: false,
                message: 'File size must be less than 10MB'
            };
        }

        // File type validation for OFX files
        if (input.accept && input.accept.includes('ofx')) {
            const validExtensions = ['.ofx', '.xml'];
            const fileName = file.name.toLowerCase();
            const isValidExtension = validExtensions.some(ext => fileName.endsWith(ext));
            
            if (!isValidExtension) {
                return {
                    isValid: false,
                    message: 'Please select a valid OFX file (.ofx or .xml)'
                };
            }
        }

        return { isValid: true };
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    getRequiredFieldMessage(input) {
        const fieldName = this.getFieldDisplayName(input);
        return `${fieldName} is required`;
    }

    getFieldDisplayName(input) {
        const label = input.form?.querySelector(`label[for="${input.id}"]`);
        if (label) {
            return label.textContent.replace(/[*:]/g, '').trim();
        }
        
        return input.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    showInputError(input, message) {
        input.classList.remove('is-valid');
        input.classList.add('is-invalid');
        
        let feedback = input.parentNode.querySelector('.invalid-feedback');
        if (!feedback) {
            feedback = document.createElement('div');
            feedback.className = 'invalid-feedback';
            input.parentNode.appendChild(feedback);
        }
        
        feedback.innerHTML = `<i class="bi bi-exclamation-circle me-1"></i>${message}`;
        
        // Remove any valid feedback
        const validFeedback = input.parentNode.querySelector('.valid-feedback');
        if (validFeedback) {
            validFeedback.remove();
        }
    }

    showInputSuccess(input) {
        input.classList.remove('is-invalid');
        input.classList.add('is-valid');
        
        // Remove error feedback
        const invalidFeedback = input.parentNode.querySelector('.invalid-feedback');
        if (invalidFeedback) {
            invalidFeedback.remove();
        }
        
        // Add success feedback for password fields
        if (input.type === 'password' || input.name === 'confirm_password') {
            let feedback = input.parentNode.querySelector('.valid-feedback');
            if (!feedback) {
                feedback = document.createElement('div');
                feedback.className = 'valid-feedback';
                input.parentNode.appendChild(feedback);
            }
            feedback.innerHTML = '<i class="bi bi-check-circle me-1"></i>Looks good!';
        }
    }

    clearInputError(input) {
        input.classList.remove('is-invalid', 'is-valid');
        const feedback = input.parentNode.querySelector('.invalid-feedback, .valid-feedback');
        if (feedback) {
            feedback.remove();
        }
    }

    // Add input constraints and helpers
    addInputConstraints() {
        // Username input constraints
        const usernameInputs = document.querySelectorAll('input[name="username"]');
        usernameInputs.forEach(input => {
            input.setAttribute('minlength', '3');
            input.setAttribute('maxlength', '30');
            input.setAttribute('pattern', '[a-zA-Z0-9_]+');
            this.addInputHelper(input, 'Letters, numbers, and underscores only. 3-30 characters.');
        });

        // Password input constraints
        const passwordInputs = document.querySelectorAll('input[type="password"]');
        passwordInputs.forEach(input => {
            if (input.name === 'password') {
                input.setAttribute('minlength', '8');
                this.addPasswordStrengthIndicator(input);
            }
        });

        // Email input constraints
        const emailInputs = document.querySelectorAll('input[type="email"]');
        emailInputs.forEach(input => {
            this.addInputHelper(input, 'We\'ll use this for account recovery if needed.');
        });

        // File input constraints
        const fileInputs = document.querySelectorAll('input[type="file"]');
        fileInputs.forEach(input => {
            this.addInputHelper(input, 'Maximum file size: 10MB. Supported formats: OFX, XML');
        });
    }

    addInputHelper(input, helpText) {
        if (!input.parentNode.querySelector('.form-text')) {
            const helper = document.createElement('div');
            helper.className = 'form-text';
            helper.innerHTML = `<i class="bi bi-info-circle me-1"></i>${helpText}`;
            input.parentNode.appendChild(helper);
        }
    }

    addPasswordStrengthIndicator(passwordInput) {
        const indicator = document.createElement('div');
        indicator.className = 'password-strength mt-2';
        indicator.innerHTML = `
            <div class="d-flex gap-1 mb-1">
                <div class="strength-bar"></div>
                <div class="strength-bar"></div>
                <div class="strength-bar"></div>
                <div class="strength-bar"></div>
            </div>
            <small class="strength-text text-muted">Enter a password</small>
        `;
        
        passwordInput.parentNode.appendChild(indicator);
        
        passwordInput.addEventListener('input', () => {
            this.updatePasswordStrength(passwordInput, indicator);
        });
    }

    updatePasswordStrength(input, indicator) {
        const password = input.value;
        const bars = indicator.querySelectorAll('.strength-bar');
        const text = indicator.querySelector('.strength-text');
        
        let strength = 0;
        let strengthText = '';
        
        if (password.length >= 8) strength++;
        if (/[a-z]/.test(password)) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/\d/.test(password)) strength++;
        if (/[^a-zA-Z\d]/.test(password)) strength++;
        
        // Reset bars
        bars.forEach(bar => {
            bar.className = 'strength-bar';
        });
        
        // Update bars and text based on strength
        switch (strength) {
            case 0:
            case 1:
                if (password.length > 0) {
                    bars[0].classList.add('weak');
                    strengthText = 'Weak password';
                    text.className = 'strength-text text-danger';
                } else {
                    strengthText = 'Enter a password';
                    text.className = 'strength-text text-muted';
                }
                break;
            case 2:
                bars[0].classList.add('weak');
                bars[1].classList.add('weak');
                strengthText = 'Fair password';
                text.className = 'strength-text text-warning';
                break;
            case 3:
                bars[0].classList.add('good');
                bars[1].classList.add('good');
                bars[2].classList.add('good');
                strengthText = 'Good password';
                text.className = 'strength-text text-info';
                break;
            case 4:
            case 5:
                bars.forEach(bar => bar.classList.add('strong'));
                strengthText = 'Strong password';
                text.className = 'strength-text text-success';
                break;
        }
        
        text.textContent = strengthText;
    }

    // Prevent common errors
    preventCommonErrors() {
        // Prevent form submission on Enter key in input fields (except submit buttons)
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.target.tagName === 'INPUT' && e.target.type !== 'submit') {
                const form = e.target.closest('form');
                if (form) {
                    e.preventDefault();
                    const submitButton = form.querySelector('button[type="submit"]');
                    if (submitButton && this.validateForm(form)) {
                        submitButton.click();
                    }
                }
            }
        });

        // Warn before leaving page with unsaved changes
        this.addUnsavedChangesWarning();
        
        // Prevent back button on forms with data
        this.preventAccidentalNavigation();
    }

    addUnsavedChangesWarning() {
        let hasUnsavedChanges = false;
        
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            const inputs = form.querySelectorAll('input, textarea, select');
            inputs.forEach(input => {
                input.addEventListener('input', () => {
                    hasUnsavedChanges = true;
                });
            });
            
            form.addEventListener('submit', () => {
                hasUnsavedChanges = false;
            });
        });

        window.addEventListener('beforeunload', (e) => {
            if (hasUnsavedChanges) {
                e.preventDefault();
                e.returnValue = '';
                return '';
            }
        });
    }

    preventAccidentalNavigation() {
        // Add confirmation for dangerous navigation
        const destructiveLinks = document.querySelectorAll('a[href*="delete"], a[href*="remove"]');
        destructiveLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                if (!confirm('Are you sure you want to proceed? This action cannot be undone.')) {
                    e.preventDefault();
                }
            });
        });
    }

    // Add confirmation dialogs for destructive actions
    addConfirmationDialogs() {
        // This is handled in user-control.js but we can add additional protection here
        const deleteButtons = document.querySelectorAll('[data-confirm]');
        deleteButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const message = button.dataset.confirm || 'Are you sure?';
                if (!confirm(message)) {
                    e.preventDefault();
                }
            });
        });
    }

    // Client-side validation for better UX
    implementClientSideValidation() {
        // Add HTML5 validation attributes programmatically
        const inputs = document.querySelectorAll('input');
        inputs.forEach(input => {
            switch (input.type) {
                case 'email':
                    input.setAttribute('autocomplete', 'email');
                    break;
                case 'password':
                    input.setAttribute('autocomplete', input.name === 'password' ? 'new-password' : 'current-password');
                    break;
                case 'text':
                    if (input.name === 'username') {
                        input.setAttribute('autocomplete', 'username');
                    }
                    break;
            }
        });
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new ErrorPreventionManager();
});

// Export for use in other scripts
window.FinWise = window.FinWise || {};
window.FinWise.ErrorPreventionManager = ErrorPreventionManager;