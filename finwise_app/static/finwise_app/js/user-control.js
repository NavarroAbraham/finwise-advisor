// User Control and Freedom Enhancements

class UserControlManager {
    constructor() {
        this.undoStack = [];
        this.init();
    }

    init() {
        this.addConfirmationDialogs();
        this.addUndoFunctionality();
        this.enhanceNavigation();
        this.addKeyboardShortcuts();
    }

    // Add confirmation dialogs for destructive actions
    addConfirmationDialogs() {
        // Find all delete buttons and forms
        const deleteButtons = document.querySelectorAll('button[type="submit"][class*="danger"], form[action*="delete"] button');
        const deleteForms = document.querySelectorAll('form[action*="delete"]');

        deleteButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                if (!button.dataset.confirmed) {
                    e.preventDefault();
                    this.showConfirmationDialog(button);
                }
            });
        });

        deleteForms.forEach(form => {
            form.addEventListener('submit', (e) => {
                if (!form.dataset.confirmed) {
                    e.preventDefault();
                    this.showFormConfirmationDialog(form);
                }
            });
        });
    }

    showConfirmationDialog(button) {
        const action = this.getActionFromButton(button);
        const itemName = this.getItemNameFromButton(button);
        
        const dialog = this.createConfirmationDialog(
            `Confirm ${action}`,
            `Are you sure you want to ${action.toLowerCase()} "${itemName}"? This action cannot be undone.`,
            () => {
                button.dataset.confirmed = 'true';
                button.click();
            }
        );

        document.body.appendChild(dialog);
        dialog.querySelector('.btn-danger').focus();
    }

    showFormConfirmationDialog(form) {
        const action = this.getActionFromForm(form);
        const itemName = this.getItemNameFromForm(form);
        
        const dialog = this.createConfirmationDialog(
            `Confirm ${action}`,
            `Are you sure you want to ${action.toLowerCase()} "${itemName}"? This action cannot be undone.`,
            () => {
                form.dataset.confirmed = 'true';
                form.submit();
            }
        );

        document.body.appendChild(dialog);
        dialog.querySelector('.btn-danger').focus();
    }

    createConfirmationDialog(title, message, onConfirm) {
        const overlay = document.createElement('div');
        overlay.className = 'confirmation-overlay';
        overlay.innerHTML = `
            <div class="confirmation-dialog">
                <div class="d-flex align-items-center mb-3">
                    <i class="bi bi-exclamation-triangle text-warning me-2" style="font-size: 1.5rem;"></i>
                    <h5 class="mb-0">${title}</h5>
                </div>
                <p class="mb-4">${message}</p>
                <div class="d-flex gap-2 justify-content-end">
                    <button type="button" class="btn btn-outline-secondary cancel-btn">
                        <i class="bi bi-x me-1"></i>Cancel
                    </button>
                    <button type="button" class="btn btn-danger confirm-btn">
                        <i class="bi bi-check me-1"></i>Confirm
                    </button>
                </div>
            </div>
        `;

        // Add event listeners
        overlay.querySelector('.cancel-btn').addEventListener('click', () => {
            overlay.remove();
        });

        overlay.querySelector('.confirm-btn').addEventListener('click', () => {
            onConfirm();
            overlay.remove();
        });

        // Close on overlay click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.remove();
            }
        });

        // Close on Escape key
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                overlay.remove();
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);

        return overlay;
    }

    getActionFromButton(button) {
        const text = button.textContent.toLowerCase();
        if (text.includes('delete')) return 'Delete';
        if (text.includes('remove')) return 'Remove';
        if (text.includes('clear')) return 'Clear';
        return 'Delete';
    }

    getItemNameFromButton(button) {
        // Try to find context from nearby elements
        const row = button.closest('tr');
        if (row) {
            const firstCell = row.querySelector('td');
            if (firstCell) {
                const badge = firstCell.querySelector('.badge');
                if (badge) return badge.textContent.trim();
                return firstCell.textContent.trim();
            }
        }

        const card = button.closest('.card');
        if (card) {
            const header = card.querySelector('.card-header h6, .card-header h5');
            if (header) return header.textContent.trim();
        }

        return 'this item';
    }

    getActionFromForm(form) {
        const action = form.getAttribute('action') || '';
        if (action.includes('delete')) return 'Delete';
        if (action.includes('remove')) return 'Remove';
        return 'Delete';
    }

    getItemNameFromForm(form) {
        // Look for onsubmit confirmation message
        const onsubmit = form.getAttribute('onsubmit') || '';
        const match = onsubmit.match(/Delete budget for ([^']+)'/);
        if (match) return match[1];

        return this.getItemNameFromButton(form.querySelector('button[type="submit"]'));
    }

    // Add undo functionality for non-destructive actions
    addUndoFunctionality() {
        // For now, we'll add undo for form submissions that aren't delete operations
        const forms = document.querySelectorAll('form:not([action*="delete"])');
        
        forms.forEach(form => {
            form.addEventListener('submit', (e) => {
                // Store form state for potential undo
                this.storeFormState(form);
            });
        });

        // Add undo notification
        this.createUndoNotification();
    }

    storeFormState(form) {
        const formData = new FormData(form);
        const state = {
            form: form,
            action: form.action,
            data: Object.fromEntries(formData),
            timestamp: Date.now()
        };

        this.undoStack.push(state);
        
        // Keep only last 5 actions
        if (this.undoStack.length > 5) {
            this.undoStack.shift();
        }
    }

    createUndoNotification() {
        // This would be enhanced based on the specific actions in your app
        // For now, we'll add a global undo shortcut
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                this.showUndoOptions();
            }
        });
    }

    showUndoOptions() {
        if (this.undoStack.length === 0) {
            window.FinWise.AlertManager.showToast('No actions to undo', 'info', 2000);
            return;
        }

        const lastAction = this.undoStack[this.undoStack.length - 1];
        window.FinWise.AlertManager.showToast(
            `Last action: ${lastAction.action} (Ctrl+Z to undo)`, 
            'info', 
            3000
        );
    }

    // Enhanced navigation
    enhanceNavigation() {
        this.addBackToTopButton();
        this.addNavigationShortcuts();
        this.improveKeyboardNavigation();
    }

    addBackToTopButton() {
        const backToTop = document.createElement('button');
        backToTop.className = 'btn btn-primary position-fixed';
        backToTop.style.cssText = `
            bottom: 20px;
            right: 20px;
            z-index: 1000;
            border-radius: 50%;
            width: 50px;
            height: 50px;
            opacity: 0;
            transition: opacity 0.3s ease;
            pointer-events: none;
        `;
        backToTop.innerHTML = '<i class="bi bi-arrow-up"></i>';
        backToTop.setAttribute('aria-label', 'Back to top');
        backToTop.title = 'Back to top';

        backToTop.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });

        document.body.appendChild(backToTop);

        // Show/hide based on scroll position
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                backToTop.style.opacity = '1';
                backToTop.style.pointerEvents = 'auto';
            } else {
                backToTop.style.opacity = '0';
                backToTop.style.pointerEvents = 'none';
            }
        });
    }

    addNavigationShortcuts() {
        const shortcuts = {
            'd': () => window.location.href = '/dashboard/',
            'i': () => window.location.href = '/import/',
            'c': () => window.location.href = '/categories/',
            'b': () => window.location.href = '/budgets/',
            'h': () => window.location.href = '/',
        };

        document.addEventListener('keydown', (e) => {
            // Only trigger if not in input/textarea and Alt key is pressed
            if (e.altKey && !e.ctrlKey && !e.metaKey && 
                !['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
                
                const shortcut = shortcuts[e.key.toLowerCase()];
                if (shortcut) {
                    e.preventDefault();
                    shortcut();
                }
            }
        });

        // Add keyboard shortcut help
        this.addShortcutHelp();
    }

    addShortcutHelp() {
        // Add a help button to show keyboard shortcuts
        const helpButton = document.createElement('button');
        helpButton.className = 'btn btn-outline-secondary position-fixed';
        helpButton.style.cssText = `
            bottom: 80px;
            right: 20px;
            z-index: 1000;
            border-radius: 50%;
            width: 40px;
            height: 40px;
        `;
        helpButton.innerHTML = '<i class="bi bi-question"></i>';
        helpButton.title = 'Keyboard shortcuts (?)';
        helpButton.setAttribute('aria-label', 'Show keyboard shortcuts');

        helpButton.addEventListener('click', () => {
            this.showShortcutHelp();
        });

        document.body.appendChild(helpButton);

        // Also show on '?' key
        document.addEventListener('keydown', (e) => {
            if (e.key === '?' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
                e.preventDefault();
                this.showShortcutHelp();
            }
        });
    }

    showShortcutHelp() {
        const modal = document.createElement('div');
        modal.className = 'confirmation-overlay';
        modal.innerHTML = `
            <div class="confirmation-dialog" style="max-width: 500px;">
                <div class="d-flex align-items-center justify-content-between mb-3">
                    <h5 class="mb-0"><i class="bi bi-keyboard me-2"></i>Keyboard Shortcuts</h5>
                    <button type="button" class="btn-close" aria-label="Close"></button>
                </div>
                <div class="row">
                    <div class="col-6">
                        <h6>Navigation</h6>
                        <div class="d-flex justify-content-between mb-2">
                            <span>Dashboard</span>
                            <kbd>Alt + D</kbd>
                        </div>
                        <div class="d-flex justify-content-between mb-2">
                            <span>Import</span>
                            <kbd>Alt + I</kbd>
                        </div>
                        <div class="d-flex justify-content-between mb-2">
                            <span>Categories</span>
                            <kbd>Alt + C</kbd>
                        </div>
                        <div class="d-flex justify-content-between mb-2">
                            <span>Budgets</span>
                            <kbd>Alt + B</kbd>
                        </div>
                        <div class="d-flex justify-content-between mb-2">
                            <span>Home</span>
                            <kbd>Alt + H</kbd>
                        </div>
                    </div>
                    <div class="col-6">
                        <h6>Actions</h6>
                        <div class="d-flex justify-content-between mb-2">
                            <span>Help</span>
                            <kbd>?</kbd>
                        </div>
                        <div class="d-flex justify-content-between mb-2">
                            <span>Undo</span>
                            <kbd>Ctrl + Z</kbd>
                        </div>
                        <div class="d-flex justify-content-between mb-2">
                            <span>Close Dialog</span>
                            <kbd>Esc</kbd>
                        </div>
                        <div class="d-flex justify-content-between mb-2">
                            <span>Back to Top</span>
                            <kbd>Home</kbd>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const closeBtn = modal.querySelector('.btn-close');
        closeBtn.addEventListener('click', () => modal.remove());

        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });

        document.addEventListener('keydown', function escHandler(e) {
            if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', escHandler);
            }
        });

        document.body.appendChild(modal);
    }

    improveKeyboardNavigation() {
        // Add focus indicators
        const style = document.createElement('style');
        style.textContent = `
            .keyboard-focus {
                outline: 2px solid var(--accent-color) !important;
                outline-offset: 2px !important;
            }
        `;
        document.head.appendChild(style);

        // Improve tab navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                document.body.classList.add('keyboard-navigation');
            }
        });

        document.addEventListener('mousedown', () => {
            document.body.classList.remove('keyboard-navigation');
        });

        // Home key goes to top
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Home' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    }

    addKeyboardShortcuts() {
        // Add common shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + S to save (prevent default browser save)
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                const activeForm = document.querySelector('form:focus-within');
                if (activeForm) {
                    e.preventDefault();
                    activeForm.submit();
                }
            }

            // Escape to close modals/dialogs
            if (e.key === 'Escape') {
                const activeModal = document.querySelector('.modal.show, .confirmation-overlay');
                if (activeModal) {
                    if (activeModal.classList.contains('confirmation-overlay')) {
                        activeModal.remove();
                    } else {
                        const modalInstance = bootstrap.Modal.getInstance(activeModal);
                        if (modalInstance) modalInstance.hide();
                    }
                }
            }
        });
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new UserControlManager();
});

// Export for use in other scripts
window.FinWise = window.FinWise || {};
window.FinWise.UserControlManager = UserControlManager;