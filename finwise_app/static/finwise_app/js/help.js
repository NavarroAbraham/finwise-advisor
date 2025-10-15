// Help and Documentation - Comprehensive User Assistance

class HelpManager {
    constructor() {
        this.helpContent = this.loadHelpContent();
        this.tourSteps = this.defineTourSteps();
        this.currentTourStep = 0;
        this.init();
    }

    init() {
        this.createHelpSystem();
        this.addContextualHelp();
        this.implementUserOnboarding();
        this.createSearchableHelp();
        this.addQuickHelp();
        this.implementTutorials();
        this.addFAQSystem();
        this.createHelpShortcuts();
    }

    // Main help system creation
    createHelpSystem() {
        this.addHelpButton();
        this.createHelpPanel();
        this.addHelpModal();
    }

    addHelpButton() {
        // Add help button to navbar
        const navbar = document.querySelector('.navbar');
        if (navbar) {
            const helpButton = document.createElement('div');
            helpButton.className = 'help-system ms-2';
            helpButton.innerHTML = `
                <div class="dropdown">
                    <button class="btn btn-sm btn-outline-light" type="button" 
                            data-bs-toggle="dropdown" title="Help & Support">
                        <i class="bi bi-question-circle me-1"></i>
                        <span class="d-none d-md-inline">Help</span>
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end help-dropdown">
                        <li><h6 class="dropdown-header">Getting Started</h6></li>
                        <li><a class="dropdown-item" href="#" onclick="window.helpManager.startTour()">
                            <i class="bi bi-play-circle me-2"></i>Take a Tour
                        </a></li>
                        <li><a class="dropdown-item" href="#" onclick="window.helpManager.showQuickStart()">
                            <i class="bi bi-rocket me-2"></i>Quick Start Guide
                        </a></li>
                        <li><hr class="dropdown-divider"></li>
                        <li><h6 class="dropdown-header">Help Topics</h6></li>
                        <li><a class="dropdown-item" href="#" onclick="window.helpManager.showHelp('importing')">
                            <i class="bi bi-upload me-2"></i>Importing Transactions
                        </a></li>
                        <li><a class="dropdown-item" href="#" onclick="window.helpManager.showHelp('categories')">
                            <i class="bi bi-tags me-2"></i>Managing Categories
                        </a></li>
                        <li><a class="dropdown-item" href="#" onclick="window.helpManager.showHelp('budgets')">
                            <i class="bi bi-pie-chart me-2"></i>Creating Budgets
                        </a></li>
                        <li><hr class="dropdown-divider"></li>
                        <li><a class="dropdown-item" href="#" onclick="window.helpManager.showFAQ()">
                            <i class="bi bi-chat-square-text me-2"></i>FAQ
                        </a></li>
                        <li><a class="dropdown-item" href="#" onclick="window.helpManager.showKeyboardShortcuts()">
                            <i class="bi bi-keyboard me-2"></i>Keyboard Shortcuts
                        </a></li>
                        <li><a class="dropdown-item" href="#" onclick="window.helpManager.contactSupport()">
                            <i class="bi bi-envelope me-2"></i>Contact Support
                        </a></li>
                    </ul>
                </div>
            `;

            // Insert before user menu
            const userMenu = navbar.querySelector('.navbar-nav:last-child');
            if (userMenu) {
                userMenu.parentNode.insertBefore(helpButton, userMenu);
            }
        }
    }

    createHelpPanel() {
        // Create floating help panel
        const helpPanel = document.createElement('div');
        helpPanel.className = 'help-panel';
        helpPanel.id = 'help-panel';
        helpPanel.innerHTML = `
            <div class="help-panel-header">
                <h6><i class="bi bi-lightbulb me-2"></i>Quick Help</h6>
                <button class="btn btn-sm btn-link help-panel-close" onclick="window.helpManager.closeHelpPanel()">
                    <i class="bi bi-x"></i>
                </button>
            </div>
            <div class="help-panel-content">
                <p class="text-muted">No help content available for this page.</p>
            </div>
            <div class="help-panel-actions">
                <button class="btn btn-sm btn-primary" onclick="window.helpManager.openFullHelp()">
                    More Help
                </button>
            </div>
        `;

        document.body.appendChild(helpPanel);
        this.updateContextualHelp();
    }

    createHelpModal() {
        // Create main help modal
        const helpModal = document.createElement('div');
        helpModal.className = 'modal fade';
        helpModal.id = 'help-modal';
        helpModal.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="bi bi-question-circle me-2"></i>Help & Documentation
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-4">
                                <div class="help-navigation">
                                    <div class="list-group">
                                        <a href="#" class="list-group-item list-group-item-action active" 
                                           onclick="window.helpManager.showHelpSection('overview')">
                                            <i class="bi bi-house me-2"></i>Overview
                                        </a>
                                        <a href="#" class="list-group-item list-group-item-action" 
                                           onclick="window.helpManager.showHelpSection('importing')">
                                            <i class="bi bi-upload me-2"></i>Importing Data
                                        </a>
                                        <a href="#" class="list-group-item list-group-item-action" 
                                           onclick="window.helpManager.showHelpSection('categories')">
                                            <i class="bi bi-tags me-2"></i>Categories
                                        </a>
                                        <a href="#" class="list-group-item list-group-item-action" 
                                           onclick="window.helpManager.showHelpSection('budgets')">
                                            <i class="bi bi-pie-chart me-2"></i>Budgets
                                        </a>
                                        <a href="#" class="list-group-item list-group-item-action" 
                                           onclick="window.helpManager.showHelpSection('reports')">
                                            <i class="bi bi-bar-chart me-2"></i>Reports
                                        </a>
                                        <a href="#" class="list-group-item list-group-item-action" 
                                           onclick="window.helpManager.showHelpSection('shortcuts')">
                                            <i class="bi bi-keyboard me-2"></i>Shortcuts
                                        </a>
                                        <a href="#" class="list-group-item list-group-item-action" 
                                           onclick="window.helpManager.showHelpSection('troubleshooting')">
                                            <i class="bi bi-tools me-2"></i>Troubleshooting
                                        </a>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-8">
                                <div class="help-content" id="help-content">
                                    <div class="help-search mb-3">
                                        <div class="input-group">
                                            <input type="text" class="form-control" id="help-search" 
                                                   placeholder="Search help...">
                                            <button class="btn btn-outline-secondary" type="button">
                                                <i class="bi bi-search"></i>
                                            </button>
                                        </div>
                                    </div>
                                    <div class="help-section" id="help-section-content">
                                        <!-- Help content will be loaded here -->
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(helpModal);
        this.setupHelpSearch();
    }

    // Contextual help system
    addContextualHelp() {
        this.addPageSpecificHelp();
        this.addFormHelp();
        this.addFeatureHints();
    }

    addPageSpecificHelp() {
        // Detect current page and show relevant help
        const currentPath = window.location.pathname;
        let helpContent = '';

        switch (true) {
            case currentPath.includes('dashboard'):
                helpContent = this.getDashboardHelp();
                break;
            case currentPath.includes('import'):
                helpContent = this.getImportHelp();
                break;
            case currentPath.includes('categories'):
                helpContent = this.getCategoriesHelp();
                break;
            case currentPath.includes('budgets'):
                helpContent = this.getBudgetsHelp();
                break;
            default:
                helpContent = this.getGeneralHelp();
        }

        this.updateHelpPanel(helpContent);
    }

    getDashboardHelp() {
        return {
            title: 'Dashboard Overview',
            content: `
                <h6>Your Financial Dashboard</h6>
                <p>The dashboard provides a quick overview of your financial status:</p>
                <ul>
                    <li><strong>Account Balance:</strong> Your current account balance</li>
                    <li><strong>Recent Transactions:</strong> Latest financial activities</li>
                    <li><strong>Category Breakdown:</strong> Where your money is going</li>
                    <li><strong>Budget Status:</strong> How you're doing against your budgets</li>
                </ul>
                <p><em>Tip:</em> Use the filters to view specific time periods or transaction types.</p>
            `,
            actions: ['Take Dashboard Tour', 'Import Transactions']
        };
    }

    getImportHelp() {
        return {
            title: 'Importing Transactions',
            content: `
                <h6>Upload Your Financial Data</h6>
                <p>Follow these steps to import your transactions:</p>
                <ol>
                    <li>Download your bank statement in OFX format</li>
                    <li>Click "Choose File" or drag and drop the file</li>
                    <li>Review the transactions before importing</li>
                    <li>Click "Import" to add them to your account</li>
                </ol>
                <p><strong>Supported formats:</strong> OFX, QFX</p>
                <p><em>Note:</em> Duplicate transactions will be automatically detected and skipped.</p>
            `,
            actions: ['View File Requirements', 'Troubleshoot Import Issues']
        };
    }

    getCategoriesHelp() {
        return {
            title: 'Managing Categories',
            content: `
                <h6>Organize Your Expenses</h6>
                <p>Categories help you understand your spending patterns:</p>
                <ul>
                    <li><strong>Create Categories:</strong> Add new expense categories</li>
                    <li><strong>Auto-Categorization:</strong> Set rules for automatic assignment</li>
                    <li><strong>Bulk Actions:</strong> Categorize multiple transactions at once</li>
                    <li><strong>Category Reports:</strong> View spending by category</li>
                </ul>
                <p><em>Tip:</em> Start with broad categories and create subcategories as needed.</p>
            `,
            actions: ['Create Category', 'Set Auto-Rules']
        };
    }

    getBudgetsHelp() {
        return {
            title: 'Creating Budgets',
            content: `
                <h6>Plan Your Spending</h6>
                <p>Budgets help you control your finances:</p>
                <ul>
                    <li><strong>Set Limits:</strong> Define spending limits for each category</li>
                    <li><strong>Track Progress:</strong> Monitor your spending against budgets</li>
                    <li><strong>Alerts:</strong> Get notified when approaching limits</li>
                    <li><strong>Adjust:</strong> Update budgets based on spending patterns</li>
                </ul>
                <p><em>Tip:</em> Use the 50/30/20 rule: 50% needs, 30% wants, 20% savings.</p>
            `,
            actions: ['Create Budget', 'View Budget Templates']
        };
    }

    getGeneralHelp() {
        return {
            title: 'Welcome to FinWise',
            content: `
                <h6>Getting Started</h6>
                <p>FinWise helps you manage your personal finances effectively:</p>
                <ul>
                    <li><strong>Import:</strong> Upload bank statements and transaction data</li>
                    <li><strong>Categorize:</strong> Organize expenses into meaningful categories</li>
                    <li><strong>Budget:</strong> Set spending limits and track progress</li>
                    <li><strong>Analyze:</strong> Generate reports and insights</li>
                </ul>
                <p><em>New user?</em> Start with our guided tour to learn the basics.</p>
            `,
            actions: ['Take Tour', 'Quick Start Guide']
        };
    }

    updateHelpPanel(helpData) {
        const panel = document.getElementById('help-panel');
        if (panel && helpData) {
            const content = panel.querySelector('.help-panel-content');
            content.innerHTML = helpData.content;

            const title = panel.querySelector('h6');
            title.innerHTML = `<i class="bi bi-lightbulb me-2"></i>${helpData.title}`;
        }
    }

    updateContextualHelp() {
        this.addPageSpecificHelp();
    }

    // User onboarding system
    implementUserOnboarding() {
        this.checkFirstVisit();
        this.createWelcomeFlow();
    }

    checkFirstVisit() {
        const hasVisited = localStorage.getItem('finwise-visited');
        if (!hasVisited) {
            // Show welcome message for first-time users
            this.showWelcomeMessage();
            localStorage.setItem('finwise-visited', 'true');
        }
    }

    showWelcomeMessage() {
        setTimeout(() => {
            window.FinWise.AlertManager.showToast(
                'Welcome to FinWise! Click the Help button for a guided tour.',
                'info',
                5000
            );
        }, 2000);
    }

    createWelcomeFlow() {
        // Define welcome flow steps
        this.welcomeSteps = [
            {
                target: '.navbar-brand',
                title: 'Welcome to FinWise!',
                content: 'FinWise helps you manage your personal finances. Let\'s take a quick tour!',
                position: 'bottom'
            },
            {
                target: '.nav-link[href*="dashboard"]',
                title: 'Dashboard',
                content: 'View your financial overview and recent activity here.',
                position: 'bottom'
            },
            {
                target: '.nav-link[href*="import"]',
                title: 'Import Transactions',
                content: 'Upload bank statements and transaction files here.',
                position: 'bottom'
            },
            {
                target: '.help-system',
                title: 'Get Help',
                content: 'Need assistance? Click here for help, tutorials, and shortcuts.',
                position: 'bottom-left'
            }
        ];
    }

    startTour() {
        this.currentTourStep = 0;
        this.showTourStep();
    }

    showTourStep() {
        if (this.currentTourStep >= this.welcomeSteps.length) {
            this.endTour();
            return;
        }

        const step = this.welcomeSteps[this.currentTourStep];
        this.createTourHighlight(step);
    }

    createTourHighlight(step) {
        // Remove existing tour elements
        this.removeTourElements();

        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'tour-overlay';
        overlay.id = 'tour-overlay';

        // Create highlight area
        const target = document.querySelector(step.target);
        if (target) {
            const rect = target.getBoundingClientRect();
            
            // Create tour tooltip
            const tooltip = document.createElement('div');
            tooltip.className = `tour-tooltip tour-position-${step.position}`;
            tooltip.innerHTML = `
                <div class="tour-content">
                    <h6>${step.title}</h6>
                    <p>${step.content}</p>
                    <div class="tour-actions">
                        <button class="btn btn-sm btn-outline-secondary" onclick="window.helpManager.skipTour()">
                            Skip Tour
                        </button>
                        <button class="btn btn-sm btn-primary" onclick="window.helpManager.nextTourStep()">
                            ${this.currentTourStep === this.welcomeSteps.length - 1 ? 'Finish' : 'Next'}
                        </button>
                    </div>
                    <div class="tour-progress">
                        Step ${this.currentTourStep + 1} of ${this.welcomeSteps.length}
                    </div>
                </div>
            `;

            // Position tooltip
            this.positionTourTooltip(tooltip, rect, step.position);

            // Add elements to page
            document.body.appendChild(overlay);
            document.body.appendChild(tooltip);

            // Highlight target element
            target.classList.add('tour-highlight');
        } else {
            // Target not found, skip to next step
            this.nextTourStep();
        }
    }

    positionTourTooltip(tooltip, targetRect, position) {
        const spacing = 20;
        
        switch (position) {
            case 'bottom':
                tooltip.style.top = (targetRect.bottom + spacing) + 'px';
                tooltip.style.left = (targetRect.left + targetRect.width / 2) + 'px';
                tooltip.style.transform = 'translateX(-50%)';
                break;
            case 'bottom-left':
                tooltip.style.top = (targetRect.bottom + spacing) + 'px';
                tooltip.style.right = spacing + 'px';
                break;
            case 'right':
                tooltip.style.top = (targetRect.top + targetRect.height / 2) + 'px';
                tooltip.style.left = (targetRect.right + spacing) + 'px';
                tooltip.style.transform = 'translateY(-50%)';
                break;
            default:
                tooltip.style.top = (targetRect.bottom + spacing) + 'px';
                tooltip.style.left = targetRect.left + 'px';
        }
    }

    nextTourStep() {
        this.currentTourStep++;
        this.showTourStep();
    }

    skipTour() {
        this.endTour();
    }

    endTour() {
        this.removeTourElements();
        window.FinWise.AlertManager.showToast(
            'Tour completed! Use the Help menu anytime for assistance.',
            'success',
            3000
        );
    }

    removeTourElements() {
        const overlay = document.getElementById('tour-overlay');
        const tooltip = document.querySelector('.tour-tooltip');
        const highlights = document.querySelectorAll('.tour-highlight');

        if (overlay) overlay.remove();
        if (tooltip) tooltip.remove();
        highlights.forEach(el => el.classList.remove('tour-highlight'));
    }

    // Searchable help
    createSearchableHelp() {
        this.setupHelpSearch();
        this.buildHelpIndex();
    }

    setupHelpSearch() {
        document.addEventListener('input', (e) => {
            if (e.target.id === 'help-search') {
                this.searchHelp(e.target.value);
            }
        });
    }

    searchHelp(query) {
        if (!query.trim()) {
            this.showHelpSection('overview');
            return;
        }

        const results = this.searchHelpContent(query);
        this.displaySearchResults(results, query);
    }

    searchHelpContent(query) {
        const results = [];
        const queryLower = query.toLowerCase();

        Object.entries(this.helpContent).forEach(([section, content]) => {
            if (content.title.toLowerCase().includes(queryLower) ||
                content.content.toLowerCase().includes(queryLower)) {
                results.push({
                    section,
                    title: content.title,
                    relevance: this.calculateRelevance(content, queryLower),
                    excerpt: this.getExcerpt(content.content, queryLower)
                });
            }
        });

        return results.sort((a, b) => b.relevance - a.relevance);
    }

    calculateRelevance(content, query) {
        let score = 0;
        const titleMatches = (content.title.toLowerCase().match(new RegExp(query, 'g')) || []).length;
        const contentMatches = (content.content.toLowerCase().match(new RegExp(query, 'g')) || []).length;
        
        score += titleMatches * 10; // Title matches are more important
        score += contentMatches * 2;
        
        return score;
    }

    getExcerpt(content, query) {
        const index = content.toLowerCase().indexOf(query);
        if (index === -1) return '';
        
        const start = Math.max(0, index - 50);
        const end = Math.min(content.length, index + query.length + 50);
        let excerpt = content.substring(start, end);
        
        if (start > 0) excerpt = '...' + excerpt;
        if (end < content.length) excerpt = excerpt + '...';
        
        return excerpt.replace(new RegExp(query, 'gi'), `<mark>$&</mark>`);
    }

    displaySearchResults(results, query) {
        const contentArea = document.getElementById('help-section-content');
        
        if (results.length === 0) {
            contentArea.innerHTML = `
                <div class="text-center py-4">
                    <i class="bi bi-search display-4 text-muted"></i>
                    <h5 class="mt-3">No results found</h5>
                    <p class="text-muted">Try different keywords or browse the help sections.</p>
                </div>
            `;
            return;
        }

        let html = `
            <h5>Search Results for "${query}"</h5>
            <p class="text-muted">${results.length} result${results.length !== 1 ? 's' : ''} found</p>
            <div class="search-results">
        `;

        results.forEach(result => {
            html += `
                <div class="search-result mb-3 p-3 border rounded">
                    <h6><a href="#" onclick="window.helpManager.showHelpSection('${result.section}')">${result.title}</a></h6>
                    <p class="small text-muted">${result.excerpt}</p>
                </div>
            `;
        });

        html += '</div>';
        contentArea.innerHTML = html;
    }

    // FAQ System
    addFAQSystem() {
        this.faqData = this.loadFAQData();
    }

    showFAQ() {
        const modal = new bootstrap.Modal(document.getElementById('help-modal'));
        this.showHelpSection('faq');
        modal.show();
    }

    loadFAQData() {
        return [
            {
                question: 'How do I import transactions from my bank?',
                answer: 'Download your bank statement in OFX format and use the Import page to upload it. The system will automatically process and categorize your transactions.',
                category: 'importing'
            },
            {
                question: 'Can I categorize transactions automatically?',
                answer: 'Yes! FinWise includes smart categorization that learns from your patterns. You can also create custom rules for automatic categorization.',
                category: 'categories'
            },
            {
                question: 'How do I set up a budget?',
                answer: 'Go to the Budgets page and click "Create Budget". Set spending limits for different categories and track your progress throughout the month.',
                category: 'budgets'
            },
            {
                question: 'What file formats are supported for import?',
                answer: 'Currently, FinWise supports OFX and QFX files. These are standard formats provided by most banks and financial institutions.',
                category: 'importing'
            },
            {
                question: 'How do I delete duplicate transactions?',
                answer: 'FinWise automatically detects and prevents duplicate imports. If you need to manually remove duplicates, use the bulk selection feature on the dashboard.',
                category: 'general'
            },
            {
                question: 'Can I export my data?',
                answer: 'Yes, you can export your transactions and budgets in CSV or JSON format using the export options in the table headers.',
                category: 'general'
            }
        ];
    }

    // Quick help features
    addQuickHelp() {
        this.addHelpShortcuts();
        this.addQuickTips();
    }

    addHelpShortcuts() {
        document.addEventListener('keydown', (e) => {
            // F1 key for help
            if (e.key === 'F1') {
                e.preventDefault();
                this.openFullHelp();
            }
            
            // Ctrl + Shift + ? for quick help
            if (e.ctrlKey && e.shiftKey && e.key === '?') {
                e.preventDefault();
                this.toggleHelpPanel();
            }
        });
    }

    addQuickTips() {
        // Add contextual tips based on user actions
        this.addFormTips();
        this.addPageTips();
    }

    addFormTips() {
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            form.addEventListener('focusin', (e) => {
                this.showFieldTip(e.target);
            });
        });
    }

    showFieldTip(field) {
        const tips = {
            'file': 'Tip: You can drag and drop files directly onto the upload area.',
            'category': 'Tip: Use specific category names to better track your spending.',
            'amount': 'Tip: Enter amounts without currency symbols (e.g., 150.50).',
            'description': 'Tip: Use clear descriptions to help with automatic categorization.'
        };

        const fieldType = field.type || field.name || '';
        const tip = tips[fieldType];
        
        if (tip) {
            this.showQuickTip(tip, field);
        }
    }

    showQuickTip(message, element) {
        // Remove existing tips
        const existingTip = document.querySelector('.quick-tip');
        if (existingTip) existingTip.remove();

        const tip = document.createElement('div');
        tip.className = 'quick-tip';
        tip.innerHTML = `
            <i class="bi bi-lightbulb me-2"></i>${message}
            <button class="btn btn-sm btn-link quick-tip-close" onclick="this.parentElement.remove()">
                <i class="bi bi-x"></i>
            </button>
        `;

        // Position tip near the element
        const rect = element.getBoundingClientRect();
        tip.style.position = 'fixed';
        tip.style.top = (rect.bottom + 5) + 'px';
        tip.style.left = rect.left + 'px';
        tip.style.zIndex = '1060';

        document.body.appendChild(tip);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (tip.parentNode) tip.remove();
        }, 5000);
    }

    // Help panel management
    toggleHelpPanel() {
        const panel = document.getElementById('help-panel');
        panel.classList.toggle('show');
    }

    closeHelpPanel() {
        const panel = document.getElementById('help-panel');
        panel.classList.remove('show');
    }

    openFullHelp() {
        const modal = new bootstrap.Modal(document.getElementById('help-modal'));
        modal.show();
    }

    // Help content management
    showHelp(topic) {
        const modal = new bootstrap.Modal(document.getElementById('help-modal'));
        this.showHelpSection(topic);
        modal.show();
    }

    showHelpSection(section) {
        // Update navigation
        const navItems = document.querySelectorAll('.help-navigation .list-group-item');
        navItems.forEach(item => item.classList.remove('active'));
        
        const activeItem = document.querySelector(`[onclick="window.helpManager.showHelpSection('${section}')"]`);
        if (activeItem) activeItem.classList.add('active');

        // Load content
        const content = this.helpContent[section] || this.helpContent.overview;
        const contentArea = document.getElementById('help-section-content');
        contentArea.innerHTML = content.content;
    }

    showQuickStart() {
        this.showHelp('quickstart');
    }

    showKeyboardShortcuts() {
        this.showHelp('shortcuts');
    }

    contactSupport() {
        window.FinWise.AlertManager.showToast(
            'For support, please email: support@finwise.app',
            'info',
            5000
        );
    }

    // Content loading
    loadHelpContent() {
        return {
            overview: {
                title: 'FinWise Overview',
                content: `
                    <h4>Welcome to FinWise</h4>
                    <p>FinWise is your personal financial management assistant, designed to help you take control of your finances with ease and confidence.</p>
                    
                    <h5>Key Features</h5>
                    <div class="row">
                        <div class="col-md-6">
                            <div class="feature-card">
                                <h6><i class="bi bi-upload me-2"></i>Transaction Import</h6>
                                <p>Easily import bank statements and transaction data from OFX files.</p>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="feature-card">
                                <h6><i class="bi bi-tags me-2"></i>Smart Categorization</h6>
                                <p>Automatically categorize expenses and create custom categories.</p>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="feature-card">
                                <h6><i class="bi bi-pie-chart me-2"></i>Budget Management</h6>
                                <p>Set budgets and track spending against your financial goals.</p>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="feature-card">
                                <h6><i class="bi bi-bar-chart me-2"></i>Financial Insights</h6>
                                <p>Generate reports and visualizations to understand your finances.</p>
                            </div>
                        </div>
                    </div>

                    <h5>Getting Started</h5>
                    <ol>
                        <li><strong>Import Your Data:</strong> Start by importing your bank statements</li>
                        <li><strong>Review Transactions:</strong> Check and categorize your transactions</li>
                        <li><strong>Set Up Budgets:</strong> Create budgets for different expense categories</li>
                        <li><strong>Monitor Progress:</strong> Use the dashboard to track your financial health</li>
                    </ol>
                `
            },
            importing: {
                title: 'Importing Data',
                content: `
                    <h4>How to Import Financial Data</h4>
                    
                    <h5>Supported File Formats</h5>
                    <ul>
                        <li><strong>OFX (Open Financial Exchange):</strong> Most commonly supported format</li>
                        <li><strong>QFX:</strong> Quicken format, compatible with most banks</li>
                    </ul>

                    <h5>Step-by-Step Import Process</h5>
                    <ol>
                        <li><strong>Download Bank Statement:</strong> Log into your bank and download transactions in OFX format</li>
                        <li><strong>Navigate to Import Page:</strong> Click "Import" in the main navigation</li>
                        <li><strong>Select File:</strong> Choose your downloaded file or drag it to the upload area</li>
                        <li><strong>Review Transactions:</strong> Check the preview of transactions to be imported</li>
                        <li><strong>Confirm Import:</strong> Click "Import" to add transactions to your account</li>
                    </ol>

                    <h5>Troubleshooting Import Issues</h5>
                    <div class="alert alert-info">
                        <strong>File Not Recognized?</strong><br>
                        Ensure your file is in OFX or QFX format. Some banks may provide CSV files - these require manual conversion.
                    </div>
                    <div class="alert alert-warning">
                        <strong>Duplicate Transactions?</strong><br>
                        FinWise automatically detects and skips duplicate transactions based on date, amount, and description.
                    </div>
                `
            },
            categories: {
                title: 'Managing Categories',
                content: `
                    <h4>Category Management</h4>
                    
                    <h5>Default Categories</h5>
                    <p>FinWise comes with pre-defined categories for common expenses:</p>
                    <div class="row">
                        <div class="col-md-6">
                            <ul>
                                <li>Groceries</li>
                                <li>Dining Out</li>
                                <li>Transportation</li>
                                <li>Utilities</li>
                            </ul>
                        </div>
                        <div class="col-md-6">
                            <ul>
                                <li>Entertainment</li>
                                <li>Healthcare</li>
                                <li>Shopping</li>
                                <li>Income</li>
                            </ul>
                        </div>
                    </div>

                    <h5>Creating Custom Categories</h5>
                    <ol>
                        <li>Go to the Categories page</li>
                        <li>Click "Add Category"</li>
                        <li>Enter a descriptive name</li>
                        <li>Optionally add a description</li>
                        <li>Save the category</li>
                    </ol>

                    <h5>Automatic Categorization</h5>
                    <p>FinWise learns from your categorization patterns and suggests categories for new transactions. You can also:</p>
                    <ul>
                        <li>Create rules based on transaction descriptions</li>
                        <li>Set default categories for specific merchants</li>
                        <li>Use bulk categorization for multiple transactions</li>
                    </ul>
                `
            },
            budgets: {
                title: 'Budget Management',
                content: `
                    <h4>Creating and Managing Budgets</h4>
                    
                    <h5>Setting Up Your First Budget</h5>
                    <ol>
                        <li>Navigate to the Budgets page</li>
                        <li>Click "Create Budget"</li>
                        <li>Select a category (e.g., Groceries)</li>
                        <li>Set a monthly spending limit</li>
                        <li>Choose a budget period (monthly/weekly)</li>
                        <li>Save your budget</li>
                    </ol>

                    <h5>Budget Strategies</h5>
                    <div class="alert alert-success">
                        <strong>50/30/20 Rule:</strong><br>
                        Allocate 50% for needs, 30% for wants, and 20% for savings and debt repayment.
                    </div>
                    
                    <h5>Monitoring Budget Performance</h5>
                    <ul>
                        <li><strong>Progress Bars:</strong> Visual indicators show spending vs. budget</li>
                        <li><strong>Alerts:</strong> Get notified when approaching budget limits</li>
                        <li><strong>Historical Data:</strong> Compare current month to previous periods</li>
                        <li><strong>Overspending Warnings:</strong> Immediate feedback when budgets are exceeded</li>
                    </ul>

                    <h5>Adjusting Budgets</h5>
                    <p>Regularly review and adjust your budgets based on:</p>
                    <ul>
                        <li>Seasonal spending variations</li>
                        <li>Changes in income</li>
                        <li>Life events and circumstances</li>
                        <li>Spending pattern analysis</li>
                    </ul>
                `
            },
            shortcuts: {
                title: 'Keyboard Shortcuts',
                content: `
                    <h4>Keyboard Shortcuts</h4>
                    
                    <h5>Navigation Shortcuts</h5>
                    <div class="shortcuts-grid">
                        <span class="shortcut-key">Alt + D</span>
                        <span class="shortcut-description">Go to Dashboard</span>
                        <span class="shortcut-key">Alt + I</span>
                        <span class="shortcut-description">Go to Import page</span>
                        <span class="shortcut-key">Alt + C</span>
                        <span class="shortcut-description">Go to Categories</span>
                        <span class="shortcut-key">Alt + B</span>
                        <span class="shortcut-description">Go to Budgets</span>
                    </div>

                    <h5>Action Shortcuts</h5>
                    <div class="shortcuts-grid">
                        <span class="shortcut-key">Ctrl + Shift + I</span>
                        <span class="shortcut-description">Quick Import</span>
                        <span class="shortcut-key">Ctrl + Shift + A</span>
                        <span class="shortcut-description">Quick Add</span>
                        <span class="shortcut-key">Ctrl + Shift + E</span>
                        <span class="shortcut-description">Quick Export</span>
                        <span class="shortcut-key">Ctrl + Shift + S</span>
                        <span class="shortcut-description">Select All</span>
                    </div>

                    <h5>Help Shortcuts</h5>
                    <div class="shortcuts-grid">
                        <span class="shortcut-key">F1</span>
                        <span class="shortcut-description">Open Help</span>
                        <span class="shortcut-key">Ctrl + Shift + ?</span>
                        <span class="shortcut-description">Toggle Quick Help Panel</span>
                        <span class="shortcut-key">?</span>
                        <span class="shortcut-description">Show Keyboard Shortcuts</span>
                    </div>

                    <h5>Search and Filter</h5>
                    <div class="shortcuts-grid">
                        <span class="shortcut-key">Ctrl + Shift + F</span>
                        <span class="shortcut-description">Focus Search</span>
                        <span class="shortcut-key">Alt + 1-4</span>
                        <span class="shortcut-description">Apply Quick Filters</span>
                        <span class="shortcut-key">Escape</span>
                        <span class="shortcut-description">Clear Filters/Close Dialogs</span>
                    </div>
                `
            },
            troubleshooting: {
                title: 'Troubleshooting',
                content: `
                    <h4>Common Issues and Solutions</h4>
                    
                    <h5>Import Problems</h5>
                    <div class="accordion" id="troubleshootingAccordion">
                        <div class="accordion-item">
                            <h6 class="accordion-header">
                                <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#import-issue-1">
                                    File upload fails or shows error
                                </button>
                            </h6>
                            <div id="import-issue-1" class="accordion-collapse collapse">
                                <div class="accordion-body">
                                    <ul>
                                        <li>Check file format - only OFX and QFX are supported</li>
                                        <li>Ensure file size is under 10MB</li>
                                        <li>Try downloading the file again from your bank</li>
                                        <li>Clear browser cache and try again</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                        
                        <div class="accordion-item">
                            <h6 class="accordion-header">
                                <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#import-issue-2">
                                    No transactions appear after import
                                </button>
                            </h6>
                            <div id="import-issue-2" class="accordion-collapse collapse">
                                <div class="accordion-body">
                                    <ul>
                                        <li>Check if transactions were already imported (duplicates are skipped)</li>
                                        <li>Verify the date range in your file</li>
                                        <li>Ensure the file contains transaction data</li>
                                        <li>Check browser console for error messages</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>

                    <h5>Performance Issues</h5>
                    <div class="alert alert-info">
                        <strong>Slow Loading?</strong><br>
                        Try refreshing the page, clearing browser cache, or reducing the number of transactions displayed using filters.
                    </div>

                    <h5>Browser Compatibility</h5>
                    <p>FinWise works best with modern browsers:</p>
                    <ul>
                        <li>Chrome 90+</li>
                        <li>Firefox 88+</li>
                        <li>Safari 14+</li>
                        <li>Edge 90+</li>
                    </ul>

                    <h5>Getting More Help</h5>
                    <p>If you're still experiencing issues:</p>
                    <ul>
                        <li>Check our FAQ section</li>
                        <li>Contact support at support@finwise.app</li>
                        <li>Include error messages and browser information</li>
                    </ul>
                `
            },
            faq: {
                title: 'Frequently Asked Questions',
                content: this.generateFAQContent()
            }
        };
    }

    generateFAQContent() {
        let content = '<h4>Frequently Asked Questions</h4>';
        
        const categories = [...new Set(this.faqData.map(faq => faq.category))];
        
        categories.forEach(category => {
            const categoryFAQs = this.faqData.filter(faq => faq.category === category);
            content += `<h5>${category.charAt(0).toUpperCase() + category.slice(1)}</h5>`;
            content += '<div class="accordion mb-4">';
            
            categoryFAQs.forEach((faq, index) => {
                const id = `faq-${category}-${index}`;
                content += `
                    <div class="accordion-item">
                        <h6 class="accordion-header">
                            <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#${id}">
                                ${faq.question}
                            </button>
                        </h6>
                        <div id="${id}" class="accordion-collapse collapse">
                            <div class="accordion-body">
                                ${faq.answer}
                            </div>
                        </div>
                    </div>
                `;
            });
            
            content += '</div>';
        });
        
        return content;
    }

    buildHelpIndex() {
        // Build search index for faster searching
        this.helpIndex = {};
        
        Object.entries(this.helpContent).forEach(([section, content]) => {
            const words = (content.title + ' ' + content.content).toLowerCase()
                .replace(/<[^>]*>/g, '') // Remove HTML tags
                .split(/\W+/)
                .filter(word => word.length > 2);
            
            words.forEach(word => {
                if (!this.helpIndex[word]) {
                    this.helpIndex[word] = [];
                }
                this.helpIndex[word].push(section);
            });
        });
    }

    // Tutorial system
    implementTutorials() {
        this.tutorials = {
            'first-import': this.createImportTutorial(),
            'budget-setup': this.createBudgetTutorial(),
            'category-management': this.createCategoryTutorial()
        };
    }

    createImportTutorial() {
        return [
            {
                target: '.nav-link[href*="import"]',
                title: 'Start Importing',
                content: 'Click here to go to the import page where you can upload your bank statements.'
            },
            {
                target: 'input[type="file"]',
                title: 'Select Your File',
                content: 'Click here to select your OFX file, or simply drag and drop it onto the upload area.'
            },
            {
                target: '.btn-primary',
                title: 'Import Transactions',
                content: 'After reviewing the preview, click this button to import your transactions.'
            }
        ];
    }

    createBudgetTutorial() {
        return [
            {
                target: '.nav-link[href*="budget"]',
                title: 'Budget Management',
                content: 'Navigate to the budgets page to set spending limits for different categories.'
            }
        ];
    }

    createCategoryTutorial() {
        return [
            {
                target: '.nav-link[href*="categories"]',
                title: 'Category Organization',
                content: 'Manage your expense categories here to better track your spending patterns.'
            }
        ];
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.helpManager = new HelpManager();
});

// Export for use in other scripts
window.FinWise = window.FinWise || {};
window.FinWise.HelpManager = HelpManager;