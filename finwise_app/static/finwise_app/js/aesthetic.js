// Aesthetic and Minimalist Design - Clean Interface Manager

class AestheticManager {
    constructor() {
        this.currentLayout = 'comfortable';
        this.userPreferences = this.loadLayoutPreferences();
        this.init();
    }

    init() {
        this.applyMinimalistDesign();
        this.optimizeInformationHierarchy();
        this.addLayoutControls();
        this.improveTypography();
        this.reduceVisualClutter();
        this.enhanceWhitespace();
        this.addLayoutToggle();
        this.optimizeColorUsage();
    }

    // Apply minimalist design principles
    applyMinimalistDesign() {
        this.addMinimalistClasses();
        this.optimizeCardLayouts();
        this.streamlineNavigation();
    }

    addMinimalistClasses() {
        // Add minimalist class to body for global styles
        document.body.classList.add('minimalist-design');

        // Enhance cards with cleaner styling
        const cards = document.querySelectorAll('.card');
        cards.forEach(card => {
            card.classList.add('card-minimal');
            this.optimizeCardContent(card);
        });

        // Clean up tables
        const tables = document.querySelectorAll('.table');
        tables.forEach(table => {
            table.classList.add('table-minimal');
            this.optimizeTableDesign(table);
        });
    }

    optimizeCardContent(card) {
        // Streamline card headers
        const header = card.querySelector('.card-header');
        if (header) {
            header.classList.add('header-minimal');
            
            // Group action buttons
            const buttons = header.querySelectorAll('.btn');
            if (buttons.length > 1) {
                this.groupActionButtons(header, buttons);
            }
        }

        // Clean up card body
        const body = card.querySelector('.card-body');
        if (body) {
            body.classList.add('body-minimal');
        }
    }

    groupActionButtons(header, buttons) {
        // Create a button group for cleaner layout
        const buttonGroup = document.createElement('div');
        buttonGroup.className = 'btn-group ms-auto';
        buttonGroup.setAttribute('role', 'group');

        // Move buttons to group
        buttons.forEach(button => {
            if (button.classList.contains('btn')) {
                button.classList.add('btn-sm');
                buttonGroup.appendChild(button.cloneNode(true));
                button.remove();
            }
        });

        header.appendChild(buttonGroup);
    }

    optimizeTableDesign(table) {
        // Add minimal styling to table
        table.classList.add('table-borderless', 'table-hover');
        
        // Optimize table headers
        const headers = table.querySelectorAll('thead th');
        headers.forEach(header => {
            header.classList.add('header-minimal');
        });

        // Add zebra striping for better readability
        const rows = table.querySelectorAll('tbody tr');
        rows.forEach((row, index) => {
            if (index % 2 === 0) {
                row.classList.add('row-even');
            }
        });
    }

    // Information hierarchy optimization
    optimizeInformationHierarchy() {
        this.prioritizeContent();
        this.addVisualHierarchy();
        this.groupRelatedElements();
    }

    prioritizeContent() {
        // Identify and highlight primary content
        const primaryContent = document.querySelectorAll('.card-body, .main-content');
        primaryContent.forEach(content => {
            content.classList.add('content-primary');
        });

        // De-emphasize secondary content
        const secondaryContent = document.querySelectorAll('.text-muted, .small, .card-footer');
        secondaryContent.forEach(content => {
            content.classList.add('content-secondary');
        });
    }

    addVisualHierarchy() {
        // Add hierarchy to headings
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        headings.forEach(heading => {
            heading.classList.add('heading-minimal');
        });

        // Improve section separation
        const sections = document.querySelectorAll('.card, .row > .col');
        sections.forEach(section => {
            section.classList.add('section-minimal');
        });
    }

    groupRelatedElements() {
        // Group form elements logically
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            this.optimizeFormLayout(form);
        });

        // Group navigation elements
        const navs = document.querySelectorAll('.navbar, .nav');
        navs.forEach(nav => {
            nav.classList.add('nav-minimal');
        });
    }

    optimizeFormLayout(form) {
        form.classList.add('form-minimal');

        // Group related form fields
        const fieldGroups = form.querySelectorAll('.mb-3, .form-group');
        fieldGroups.forEach(group => {
            group.classList.add('field-group-minimal');
        });

        // Optimize labels
        const labels = form.querySelectorAll('label');
        labels.forEach(label => {
            label.classList.add('label-minimal');
        });

        // Clean up form controls
        const controls = form.querySelectorAll('.form-control, .form-select');
        controls.forEach(control => {
            control.classList.add('control-minimal');
        });
    }

    // Layout controls for user customization
    addLayoutControls() {
        this.createLayoutToggle();
        this.addDensityControls();
    }

    createLayoutToggle() {
        // Add layout control to navbar
        const navbar = document.querySelector('.navbar');
        if (navbar) {
            const layoutControl = document.createElement('div');
            layoutControl.className = 'layout-control ms-2';
            layoutControl.innerHTML = `
                <div class="dropdown">
                    <button class="btn btn-sm btn-outline-light dropdown-toggle" type="button" 
                            data-bs-toggle="dropdown" title="Layout Options">
                        <i class="bi bi-layout-text-sidebar-reverse me-1"></i>
                        <span class="d-none d-md-inline">Layout</span>
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end">
                        <li><h6 class="dropdown-header">Density</h6></li>
                        <li><a class="dropdown-item density-option" href="#" data-density="comfortable">
                            <i class="bi bi-check me-2" style="visibility: ${this.currentLayout === 'comfortable' ? 'visible' : 'hidden'}"></i>
                            Comfortable
                        </a></li>
                        <li><a class="dropdown-item density-option" href="#" data-density="compact">
                            <i class="bi bi-check me-2" style="visibility: ${this.currentLayout === 'compact' ? 'visible' : 'hidden'}"></i>
                            Compact
                        </a></li>
                        <li><a class="dropdown-item density-option" href="#" data-density="minimal">
                            <i class="bi bi-check me-2" style="visibility: ${this.currentLayout === 'minimal' ? 'visible' : 'hidden'}"></i>
                            Minimal
                        </a></li>
                        <li><hr class="dropdown-divider"></li>
                        <li><h6 class="dropdown-header">Display</h6></li>
                        <li><a class="dropdown-item" href="#" onclick="window.aestheticManager.toggleFocusMode()">
                            <i class="bi bi-eye me-2"></i>Focus Mode
                        </a></li>
                        <li><a class="dropdown-item" href="#" onclick="window.aestheticManager.resetLayout()">
                            <i class="bi bi-arrow-clockwise me-2"></i>Reset Layout
                        </a></li>
                    </ul>
                </div>
            `;

            // Insert before existing navbar items
            const navbarNav = navbar.querySelector('.navbar-nav:last-child');
            if (navbarNav) {
                navbarNav.parentNode.insertBefore(layoutControl, navbarNav);
            }

            // Add event listeners
            layoutControl.addEventListener('click', (e) => {
                if (e.target.classList.contains('density-option')) {
                    e.preventDefault();
                    const density = e.target.dataset.density;
                    this.applyDensity(density);
                }
            });
        }
    }

    addDensityControls() {
        // Add density classes to body
        this.applyDensity(this.currentLayout);
    }

    applyDensity(density) {
        // Remove existing density classes
        document.body.classList.remove('density-comfortable', 'density-compact', 'density-minimal');
        
        // Apply new density
        document.body.classList.add(`density-${density}`);
        this.currentLayout = density;

        // Update dropdown check marks
        const options = document.querySelectorAll('.density-option');
        options.forEach(option => {
            const check = option.querySelector('.bi-check');
            if (option.dataset.density === density) {
                check.style.visibility = 'visible';
            } else {
                check.style.visibility = 'hidden';
            }
        });

        // Save preference
        this.saveLayoutPreferences();

        // Show feedback
        window.FinWise.AlertManager.showToast(
            `Layout changed to ${density}`, 
            'info', 
            2000
        );
    }

    // Typography improvements
    improveTypography() {
        this.optimizeFontSizes();
        this.improveReadability();
        this.addTypographicHierarchy();
    }

    optimizeFontSizes() {
        // Add typography classes to body
        document.body.classList.add('typography-optimized');

        // Optimize heading sizes
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        headings.forEach((heading, index) => {
            heading.classList.add(`heading-level-${index + 1}`);
        });
    }

    improveReadability() {
        // Optimize line height and spacing for better readability
        const textElements = document.querySelectorAll('p, .card-text, .list-group-item-text');
        textElements.forEach(element => {
            element.classList.add('text-readable');
        });

        // Improve form readability
        const formTexts = document.querySelectorAll('.form-text, .help-text');
        formTexts.forEach(text => {
            text.classList.add('help-text-readable');
        });
    }

    addTypographicHierarchy() {
        // Add clear hierarchy to different text elements
        const priorities = {
            'h1, .display-1, .display-2': 'text-priority-highest',
            'h2, h3, .card-title': 'text-priority-high',
            'h4, h5, h6, .lead': 'text-priority-medium',
            'p, .card-text, td': 'text-priority-normal',
            '.text-muted, .small, .card-footer': 'text-priority-low'
        };

        Object.entries(priorities).forEach(([selectors, className]) => {
            const elements = document.querySelectorAll(selectors);
            elements.forEach(element => {
                element.classList.add(className);
            });
        });
    }

    // Visual clutter reduction
    reduceVisualClutter() {
        this.simplifyBorders();
        this.consolidateActions();
        this.hideNonEssentialElements();
    }

    simplifyBorders() {
        // Reduce border usage for cleaner look
        const cards = document.querySelectorAll('.card');
        cards.forEach(card => {
            card.classList.add('border-minimal');
        });

        const tables = document.querySelectorAll('.table');
        tables.forEach(table => {
            table.classList.add('table-borderless');
        });
    }

    consolidateActions() {
        // Group multiple action buttons
        const actionGroups = document.querySelectorAll('.card-header, .table-actions');
        actionGroups.forEach(group => {
            const buttons = group.querySelectorAll('.btn');
            if (buttons.length > 2) {
                this.createActionDropdown(group, buttons);
            }
        });
    }

    createActionDropdown(container, buttons) {
        // Keep primary action visible, move others to dropdown
        const primaryButton = buttons[0];
        const secondaryButtons = Array.from(buttons).slice(1);

        if (secondaryButtons.length > 0) {
            const dropdown = document.createElement('div');
            dropdown.className = 'dropdown d-inline-block ms-2';
            dropdown.innerHTML = `
                <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" 
                        data-bs-toggle="dropdown" title="More actions">
                    <i class="bi bi-three-dots"></i>
                </button>
                <ul class="dropdown-menu">
                </ul>
            `;

            const dropdownMenu = dropdown.querySelector('.dropdown-menu');
            secondaryButtons.forEach(button => {
                const li = document.createElement('li');
                const a = document.createElement('a');
                a.className = 'dropdown-item';
                a.href = '#';
                a.innerHTML = button.innerHTML;
                a.onclick = button.onclick;
                li.appendChild(a);
                dropdownMenu.appendChild(li);
                button.remove();
            });

            container.appendChild(dropdown);
        }
    }

    hideNonEssentialElements() {
        // Hide elements that might not be immediately necessary
        const nonEssential = document.querySelectorAll('.text-muted small, .secondary-info');
        nonEssential.forEach(element => {
            element.classList.add('minimalist-hidden');
        });

        // Add toggle to show/hide these elements
        this.addDetailToggle();
    }

    addDetailToggle() {
        const cards = document.querySelectorAll('.card');
        cards.forEach(card => {
            const hiddenElements = card.querySelectorAll('.minimalist-hidden');
            if (hiddenElements.length > 0) {
                this.addShowDetailsButton(card, hiddenElements);
            }
        });
    }

    addShowDetailsButton(card, hiddenElements) {
        const header = card.querySelector('.card-header');
        if (header) {
            const detailToggle = document.createElement('button');
            detailToggle.className = 'btn btn-sm btn-link text-muted ms-2';
            detailToggle.innerHTML = '<i class="bi bi-eye"></i>';
            detailToggle.title = 'Show details';
            
            detailToggle.onclick = () => {
                const isHidden = hiddenElements[0].classList.contains('d-none');
                hiddenElements.forEach(element => {
                    element.classList.toggle('d-none', !isHidden);
                });
                
                detailToggle.innerHTML = isHidden ? '<i class="bi bi-eye-slash"></i>' : '<i class="bi bi-eye"></i>';
                detailToggle.title = isHidden ? 'Hide details' : 'Show details';
            };

            header.appendChild(detailToggle);
        }
    }

    // Whitespace enhancement
    enhanceWhitespace() {
        this.optimizeSpacing();
        this.addBreathingRoom();
        this.improveContentFlow();
    }

    optimizeSpacing() {
        // Add optimal spacing classes
        document.body.classList.add('spacing-optimized');

        // Optimize card spacing
        const cards = document.querySelectorAll('.card');
        cards.forEach(card => {
            card.classList.add('card-spaced');
        });

        // Optimize form spacing
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            form.classList.add('form-spaced');
        });
    }

    addBreathingRoom() {
        // Add breathing room between major sections
        const majorSections = document.querySelectorAll('.container > .row, main > .card');
        majorSections.forEach(section => {
            section.classList.add('section-breathing-room');
        });
    }

    improveContentFlow() {
        // Improve flow between related content
        const contentGroups = document.querySelectorAll('.card-body, .form-group, .list-group');
        contentGroups.forEach(group => {
            group.classList.add('content-flow-optimized');
        });
    }

    // Focus mode
    toggleFocusMode() {
        document.body.classList.toggle('focus-mode');
        
        const isFocusMode = document.body.classList.contains('focus-mode');
        
        if (isFocusMode) {
            // Hide non-essential UI elements
            this.hideFocusModeElements();
            window.FinWise.AlertManager.showToast('Focus mode enabled', 'info', 2000);
        } else {
            this.showFocusModeElements();
            window.FinWise.AlertManager.showToast('Focus mode disabled', 'info', 2000);
        }
    }

    hideFocusModeElements() {
        const elementsToHide = [
            '.quick-actions',
            '.bulk-selection',
            '.search-filters',
            '.card-footer',
            '.navbar .btn-group:not(.layout-control)',
            '.quick-access-toolbar'
        ];

        elementsToHide.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                element.classList.add('focus-mode-hidden');
            });
        });
    }

    showFocusModeElements() {
        const hiddenElements = document.querySelectorAll('.focus-mode-hidden');
        hiddenElements.forEach(element => {
            element.classList.remove('focus-mode-hidden');
        });
    }

    // Color optimization
    optimizeColorUsage() {
        this.reduceColorComplexity();
        this.emphasizeImportantElements();
    }

    reduceColorComplexity() {
        // Apply minimal color palette
        document.body.classList.add('color-minimal');

        // Reduce badge colors to essentials
        const badges = document.querySelectorAll('.badge');
        badges.forEach(badge => {
            // Simplify badge colors
            if (badge.classList.contains('bg-secondary') || 
                badge.classList.contains('bg-light') ||
                badge.classList.contains('bg-dark')) {
                badge.classList.add('badge-minimal');
            }
        });
    }

    emphasizeImportantElements() {
        // Use color strategically for important elements
        const importantElements = document.querySelectorAll('.btn-primary, .alert-danger, .text-success, .text-danger');
        importantElements.forEach(element => {
            element.classList.add('color-emphasis');
        });
    }

    // Layout management
    resetLayout() {
        // Reset to default layout
        this.applyDensity('comfortable');
        
        // Remove focus mode
        document.body.classList.remove('focus-mode');
        this.showFocusModeElements();
        
        // Reset customizations
        const customElements = document.querySelectorAll('.minimalist-hidden.d-none');
        customElements.forEach(element => {
            element.classList.remove('d-none');
        });

        window.FinWise.AlertManager.showToast('Layout reset to default', 'success', 2000);
    }

    // Preferences management
    loadLayoutPreferences() {
        const prefs = localStorage.getItem('finwise-layout-preferences');
        return prefs ? JSON.parse(prefs) : {
            density: 'comfortable',
            focusMode: false,
            showDetails: true
        };
    }

    saveLayoutPreferences() {
        const prefs = {
            density: this.currentLayout,
            focusMode: document.body.classList.contains('focus-mode'),
            showDetails: !document.body.classList.contains('minimalist-design')
        };
        localStorage.setItem('finwise-layout-preferences', JSON.stringify(prefs));
    }

    // Card optimization
    optimizeCardLayouts() {
        const cards = document.querySelectorAll('.card');
        cards.forEach(card => {
            this.addCardOptimizations(card);
        });
    }

    addCardOptimizations(card) {
        // Add minimal card styling
        card.classList.add('card-optimized');

        // Optimize card headers
        const header = card.querySelector('.card-header');
        if (header) {
            header.classList.add('header-optimized');
        }

        // Add hover effects for better interaction
        card.addEventListener('mouseenter', () => {
            card.classList.add('card-hover');
        });

        card.addEventListener('mouseleave', () => {
            card.classList.remove('card-hover');
        });
    }

    // Navigation streamlining
    streamlineNavigation() {
        const navbar = document.querySelector('.navbar');
        if (navbar) {
            navbar.classList.add('navbar-minimal');
        }

        // Simplify navigation items
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.classList.add('nav-item-minimal');
        });
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.aestheticManager = new AestheticManager();
});

// Export for use in other scripts
window.FinWise = window.FinWise || {};
window.FinWise.AestheticManager = AestheticManager;