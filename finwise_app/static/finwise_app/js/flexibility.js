// Flexibility and Efficiency - Advanced User Features

class FlexibilityManager {
    constructor() {
        this.bulkSelection = new Set();
        this.quickActions = [];
        this.userPreferences = this.loadUserPreferences();
        this.init();
    }

    init() {
        this.addBulkActions();
        this.implementQuickActions();
        this.addAdvancedSearch();
        this.createCustomShortcuts();
        this.addDragAndDrop();
        this.implementSmartFilters();
        this.addExportOptions();
        this.createQuickAccessToolbar();
    }

    // Bulk actions for efficient management
    addBulkActions() {
        this.addBulkSelectionToTables();
        this.createBulkActionBar();
    }

    addBulkSelectionToTables() {
        const tables = document.querySelectorAll('.table-enhanced');
        tables.forEach(table => {
            this.enhanceTableWithBulkSelection(table);
        });
    }

    enhanceTableWithBulkSelection(table) {
        const tbody = table.querySelector('tbody');
        if (!tbody) return;

        // Add master checkbox to header
        const headerRow = table.querySelector('thead tr');
        if (headerRow) {
            const masterCheckboxCell = document.createElement('th');
            masterCheckboxCell.innerHTML = `
                <input type="checkbox" class="form-check-input master-checkbox" 
                       title="Select all rows">
            `;
            headerRow.insertBefore(masterCheckboxCell, headerRow.firstChild);

            const masterCheckbox = masterCheckboxCell.querySelector('.master-checkbox');
            masterCheckbox.addEventListener('change', () => {
                this.toggleAllRows(table, masterCheckbox.checked);
            });
        }

        // Add checkboxes to each row
        const rows = tbody.querySelectorAll('tr');
        rows.forEach((row, index) => {
            const checkboxCell = document.createElement('td');
            checkboxCell.innerHTML = `
                <input type="checkbox" class="form-check-input row-checkbox" 
                       data-row-id="${index}" title="Select this row">
            `;
            row.insertBefore(checkboxCell, row.firstChild);

            const checkbox = checkboxCell.querySelector('.row-checkbox');
            checkbox.addEventListener('change', () => {
                this.handleRowSelection(table, row, checkbox.checked, index);
            });
        });
    }

    toggleAllRows(table, checked) {
        const checkboxes = table.querySelectorAll('.row-checkbox');
        checkboxes.forEach((checkbox, index) => {
            checkbox.checked = checked;
            const row = checkbox.closest('tr');
            this.handleRowSelection(table, row, checked, index);
        });
    }

    handleRowSelection(table, row, checked, index) {
        if (checked) {
            this.bulkSelection.add(`${table.id || 'table'}-${index}`);
            row.classList.add('table-selected');
        } else {
            this.bulkSelection.delete(`${table.id || 'table'}-${index}`);
            row.classList.remove('table-selected');
        }

        this.updateBulkActionBar();
        this.updateMasterCheckbox(table);
    }

    updateMasterCheckbox(table) {
        const masterCheckbox = table.querySelector('.master-checkbox');
        const rowCheckboxes = table.querySelectorAll('.row-checkbox');
        const checkedBoxes = table.querySelectorAll('.row-checkbox:checked');

        if (checkedBoxes.length === 0) {
            masterCheckbox.indeterminate = false;
            masterCheckbox.checked = false;
        } else if (checkedBoxes.length === rowCheckboxes.length) {
            masterCheckbox.indeterminate = false;
            masterCheckbox.checked = true;
        } else {
            masterCheckbox.indeterminate = true;
        }
    }

    createBulkActionBar() {
        const bulkBar = document.createElement('div');
        bulkBar.className = 'bulk-selection';
        bulkBar.id = 'bulk-action-bar';
        bulkBar.innerHTML = `
            <div class="d-flex align-items-center">
                <span class="selected-count">0 items selected</span>
                <div class="bulk-actions ms-auto">
                    <button class="btn btn-sm btn-outline-primary" onclick="window.flexibilityManager.exportSelected()">
                        <i class="bi bi-download me-1"></i>Export
                    </button>
                    <button class="btn btn-sm btn-outline-warning" onclick="window.flexibilityManager.categorizeSelected()">
                        <i class="bi bi-tags me-1"></i>Categorize
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="window.flexibilityManager.deleteSelected()">
                        <i class="bi bi-trash me-1"></i>Delete
                    </button>
                    <button class="btn btn-sm btn-outline-secondary" onclick="window.flexibilityManager.clearSelection()">
                        <i class="bi bi-x me-1"></i>Clear
                    </button>
                </div>
            </div>
        `;

        // Insert before first table
        const firstTable = document.querySelector('.table-enhanced');
        if (firstTable) {
            const container = firstTable.closest('.card, .table-responsive') || firstTable.parentNode;
            container.parentNode.insertBefore(bulkBar, container);
        }
    }

    updateBulkActionBar() {
        const bulkBar = document.getElementById('bulk-action-bar');
        const count = this.bulkSelection.size;
        
        if (count > 0) {
            bulkBar.classList.add('show');
            bulkBar.querySelector('.selected-count').textContent = `${count} item${count !== 1 ? 's' : ''} selected`;
        } else {
            bulkBar.classList.remove('show');
        }
    }

    // Bulk action methods
    exportSelected() {
        if (this.bulkSelection.size === 0) return;
        
        // Implementation would depend on your data structure
        window.FinWise.AlertManager.showToast(
            `Exporting ${this.bulkSelection.size} selected items...`, 
            'info', 
            3000
        );
    }

    categorizeSelected() {
        if (this.bulkSelection.size === 0) return;
        
        this.showBulkCategorizeDialog();
    }

    showBulkCategorizeDialog() {
        const dialog = document.createElement('div');
        dialog.className = 'confirmation-overlay';
        dialog.innerHTML = `
            <div class="confirmation-dialog">
                <h5><i class="bi bi-tags me-2"></i>Bulk Categorize</h5>
                <p>Apply category to ${this.bulkSelection.size} selected items:</p>
                <select class="form-select mb-3" id="bulk-category-select">
                    <option value="">-- Select Category --</option>
                    <option value="groceries">Groceries</option>
                    <option value="dining">Dining Out</option>
                    <option value="utilities">Utilities</option>
                    <option value="transportation">Transportation</option>
                    <option value="entertainment">Entertainment</option>
                </select>
                <div class="d-flex gap-2 justify-content-end">
                    <button class="btn btn-secondary cancel-btn">Cancel</button>
                    <button class="btn btn-primary apply-btn">Apply Category</button>
                </div>
            </div>
        `;

        dialog.querySelector('.cancel-btn').onclick = () => dialog.remove();
        dialog.querySelector('.apply-btn').onclick = () => {
            const category = dialog.querySelector('#bulk-category-select').value;
            if (category) {
                this.applyBulkCategory(category);
                dialog.remove();
            }
        };

        document.body.appendChild(dialog);
    }

    applyBulkCategory(category) {
        window.FinWise.AlertManager.showToast(
            `Applied "${category}" category to ${this.bulkSelection.size} items`, 
            'success', 
            3000
        );
        this.clearSelection();
    }

    deleteSelected() {
        if (this.bulkSelection.size === 0) return;
        
        if (confirm(`Are you sure you want to delete ${this.bulkSelection.size} selected items? This action cannot be undone.`)) {
            window.FinWise.AlertManager.showToast(
                `Deleted ${this.bulkSelection.size} items`, 
                'success', 
                3000
            );
            this.clearSelection();
        }
    }

    clearSelection() {
        this.bulkSelection.clear();
        
        // Uncheck all checkboxes
        const checkboxes = document.querySelectorAll('.row-checkbox, .master-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = false;
            checkbox.indeterminate = false;
        });

        // Remove selected class from rows
        const selectedRows = document.querySelectorAll('.table-selected');
        selectedRows.forEach(row => row.classList.remove('table-selected'));

        this.updateBulkActionBar();
    }

    // Quick actions floating button
    implementQuickActions() {
        this.createQuickActionFAB();
        this.addQuickActionItems();
    }

    createQuickActionFAB() {
        const quickActions = document.createElement('div');
        quickActions.className = 'quick-actions';
        quickActions.innerHTML = `
            <button class="btn btn-primary quick-action-fab" id="quick-actions-toggle" 
                    title="Quick Actions" data-bs-toggle="tooltip">
                <i class="bi bi-lightning-fill"></i>
            </button>
            <div class="quick-action-menu" id="quick-action-menu" style="display: none;">
                <button class="btn btn-success quick-action-fab" onclick="window.flexibilityManager.quickImport()" 
                        title="Quick Import" data-bs-toggle="tooltip">
                    <i class="bi bi-upload"></i>
                </button>
                <button class="btn btn-info quick-action-fab" onclick="window.flexibilityManager.quickAdd()" 
                        title="Quick Add" data-bs-toggle="tooltip">
                    <i class="bi bi-plus"></i>
                </button>
                <button class="btn btn-warning quick-action-fab" onclick="window.flexibilityManager.quickExport()" 
                        title="Quick Export" data-bs-toggle="tooltip">
                    <i class="bi bi-download"></i>
                </button>
            </div>
        `;

        document.body.appendChild(quickActions);

        // Toggle menu
        document.getElementById('quick-actions-toggle').addEventListener('click', () => {
            this.toggleQuickActionMenu();
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.quick-actions')) {
                this.closeQuickActionMenu();
            }
        });
    }

    toggleQuickActionMenu() {
        const menu = document.getElementById('quick-action-menu');
        const isVisible = menu.style.display !== 'none';
        
        if (isVisible) {
            this.closeQuickActionMenu();
        } else {
            this.openQuickActionMenu();
        }
    }

    openQuickActionMenu() {
        const menu = document.getElementById('quick-action-menu');
        menu.style.display = 'block';
        
        // Animate buttons in
        const buttons = menu.querySelectorAll('.quick-action-fab');
        buttons.forEach((button, index) => {
            setTimeout(() => {
                button.style.transform = 'scale(1)';
                button.style.opacity = '1';
            }, index * 100);
        });
    }

    closeQuickActionMenu() {
        const menu = document.getElementById('quick-action-menu');
        menu.style.display = 'none';
        
        // Reset button styles
        const buttons = menu.querySelectorAll('.quick-action-fab');
        buttons.forEach(button => {
            button.style.transform = 'scale(0)';
            button.style.opacity = '0';
        });
    }

    addQuickActionItems() {
        // Quick action implementations
        this.quickActions = [
            {
                key: 'i',
                action: () => this.quickImport(),
                description: 'Quick Import'
            },
            {
                key: 'e',
                action: () => this.quickExport(),
                description: 'Quick Export'
            },
            {
                key: 'a',
                action: () => this.quickAdd(),
                description: 'Quick Add'
            }
        ];

        // Add keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey) {
                const action = this.quickActions.find(qa => qa.key === e.key.toLowerCase());
                if (action) {
                    e.preventDefault();
                    action.action();
                }
            }
        });
    }

    quickImport() {
        window.location.href = '/import/';
    }

    quickAdd() {
        // Quick add functionality - could open a modal for adding transactions/categories/budgets
        this.showQuickAddDialog();
    }

    showQuickAddDialog() {
        const currentPath = window.location.pathname;
        let addType = 'item';
        let addOptions = '';

        if (currentPath.includes('budget')) {
            addType = 'budget';
            addOptions = `
                <option value="budget">New Budget</option>
                <option value="category">New Category</option>
            `;
        } else if (currentPath.includes('categor')) {
            addType = 'category';
            addOptions = `
                <option value="category">New Category</option>
                <option value="budget">New Budget</option>
            `;
        } else {
            addOptions = `
                <option value="transaction">Import Transactions</option>
                <option value="category">New Category</option>
                <option value="budget">New Budget</option>
            `;
        }

        const dialog = document.createElement('div');
        dialog.className = 'confirmation-overlay';
        dialog.innerHTML = `
            <div class="confirmation-dialog">
                <h5><i class="bi bi-plus-circle me-2"></i>Quick Add</h5>
                <p>What would you like to add?</p>
                <select class="form-select mb-3" id="quick-add-select">
                    ${addOptions}
                </select>
                <div class="d-flex gap-2 justify-content-end">
                    <button class="btn btn-secondary cancel-btn">Cancel</button>
                    <button class="btn btn-primary add-btn">Add</button>
                </div>
            </div>
        `;

        dialog.querySelector('.cancel-btn').onclick = () => dialog.remove();
        dialog.querySelector('.add-btn').onclick = () => {
            const selected = dialog.querySelector('#quick-add-select').value;
            this.executeQuickAdd(selected);
            dialog.remove();
        };

        document.body.appendChild(dialog);
    }

    executeQuickAdd(type) {
        switch (type) {
            case 'transaction':
                window.location.href = '/import/';
                break;
            case 'category':
                window.location.href = '/categories/';
                break;
            case 'budget':
                window.location.href = '/budgets/';
                break;
        }
    }

    quickExport() {
        this.showQuickExportDialog();
    }

    showQuickExportDialog() {
        const dialog = document.createElement('div');
        dialog.className = 'confirmation-overlay';
        dialog.innerHTML = `
            <div class="confirmation-dialog">
                <h5><i class="bi bi-download me-2"></i>Quick Export</h5>
                <p>Select data to export:</p>
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" id="export-transactions" checked>
                    <label class="form-check-label" for="export-transactions">
                        Recent Transactions
                    </label>
                </div>
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" id="export-categories">
                    <label class="form-check-label" for="export-categories">
                        Categories
                    </label>
                </div>
                <div class="form-check mb-3">
                    <input class="form-check-input" type="checkbox" id="export-budgets">
                    <label class="form-check-label" for="export-budgets">
                        Budget Information
                    </label>
                </div>
                <div class="d-flex gap-2 justify-content-end">
                    <button class="btn btn-secondary cancel-btn">Cancel</button>
                    <button class="btn btn-primary export-btn">Export</button>
                </div>
            </div>
        `;

        dialog.querySelector('.cancel-btn').onclick = () => dialog.remove();
        dialog.querySelector('.export-btn').onclick = () => {
            const selected = [];
            if (dialog.querySelector('#export-transactions').checked) selected.push('transactions');
            if (dialog.querySelector('#export-categories').checked) selected.push('categories');
            if (dialog.querySelector('#export-budgets').checked) selected.push('budgets');
            
            if (selected.length > 0) {
                window.FinWise.AlertManager.showToast(
                    `Exporting ${selected.join(', ')}...`, 
                    'info', 
                    3000
                );
            }
            dialog.remove();
        };

        document.body.appendChild(dialog);
    }

    // Advanced search functionality
    addAdvancedSearch() {
        this.createAdvancedSearchToggle();
        this.implementSearchFilters();
    }

    createAdvancedSearchToggle() {
        const tables = document.querySelectorAll('.table-enhanced');
        tables.forEach(table => {
            const wrapper = table.closest('.card');
            if (wrapper) {
                this.addSearchToTable(wrapper, table);
            }
        });
    }

    addSearchToTable(wrapper, table) {
        const header = wrapper.querySelector('.card-header');
        if (!header) return;

        const searchToggle = document.createElement('button');
        searchToggle.className = 'btn btn-sm btn-outline-info ms-2';
        searchToggle.innerHTML = '<i class="bi bi-search me-1"></i>Search';
        searchToggle.onclick = () => this.toggleAdvancedSearch(wrapper);

        header.appendChild(searchToggle);
        
        // Create search filters panel
        const filtersPanel = document.createElement('div');
        filtersPanel.className = 'search-filters';
        filtersPanel.innerHTML = `
            <div class="row">
                <div class="col-md-4">
                    <label class="form-label">Search Text</label>
                    <input type="text" class="form-control search-text" placeholder="Search...">
                </div>
                <div class="col-md-3">
                    <label class="form-label">Date From</label>
                    <input type="date" class="form-control date-from">
                </div>
                <div class="col-md-3">
                    <label class="form-label">Date To</label>
                    <input type="date" class="form-control date-to">
                </div>
                <div class="col-md-2">
                    <label class="form-label">&nbsp;</label>
                    <div class="d-flex gap-1">
                        <button class="btn btn-primary btn-sm apply-filters">Apply</button>
                        <button class="btn btn-outline-secondary btn-sm clear-filters">Clear</button>
                    </div>
                </div>
            </div>
        `;

        wrapper.insertBefore(filtersPanel, wrapper.querySelector('.card-body') || wrapper.firstChild);

        // Add filter functionality
        filtersPanel.querySelector('.apply-filters').onclick = () => this.applyTableFilters(table, filtersPanel);
        filtersPanel.querySelector('.clear-filters').onclick = () => this.clearTableFilters(table, filtersPanel);
        
        // Real-time search
        const searchInput = filtersPanel.querySelector('.search-text');
        searchInput.addEventListener('input', () => {
            setTimeout(() => this.applyTableFilters(table, filtersPanel), 300);
        });
    }

    toggleAdvancedSearch(wrapper) {
        const filtersPanel = wrapper.querySelector('.search-filters');
        filtersPanel.classList.toggle('show');
    }

    applyTableFilters(table, filtersPanel) {
        const searchText = filtersPanel.querySelector('.search-text').value.toLowerCase();
        const dateFrom = filtersPanel.querySelector('.date-from').value;
        const dateTo = filtersPanel.querySelector('.date-to').value;

        const rows = table.querySelectorAll('tbody tr');
        let visibleCount = 0;

        rows.forEach(row => {
            let shouldShow = true;

            // Text search
            if (searchText) {
                const rowText = row.textContent.toLowerCase();
                if (!rowText.includes(searchText)) {
                    shouldShow = false;
                }
            }

            // Date filtering (if date column exists)
            if ((dateFrom || dateTo) && shouldShow) {
                const dateCell = row.querySelector('td:first-child'); // Assuming first column is date
                if (dateCell) {
                    const rowDate = this.extractDateFromCell(dateCell);
                    if (rowDate) {
                        if (dateFrom && rowDate < new Date(dateFrom)) shouldShow = false;
                        if (dateTo && rowDate > new Date(dateTo)) shouldShow = false;
                    }
                }
            }

            row.style.display = shouldShow ? '' : 'none';
            if (shouldShow) visibleCount++;
        });

        // Show results count
        this.showFilterResults(table, visibleCount, rows.length);
    }

    extractDateFromCell(cell) {
        const text = cell.textContent.trim();
        // Try to parse date from various formats
        const date = new Date(text);
        return isNaN(date) ? null : date;
    }

    clearTableFilters(table, filtersPanel) {
        // Clear filter inputs
        filtersPanel.querySelector('.search-text').value = '';
        filtersPanel.querySelector('.date-from').value = '';
        filtersPanel.querySelector('.date-to').value = '';

        // Show all rows
        const rows = table.querySelectorAll('tbody tr');
        rows.forEach(row => {
            row.style.display = '';
        });

        // Hide results count
        const resultsInfo = table.parentNode.querySelector('.filter-results');
        if (resultsInfo) resultsInfo.remove();
    }

    showFilterResults(table, visibleCount, totalCount) {
        let resultsInfo = table.parentNode.querySelector('.filter-results');
        if (!resultsInfo) {
            resultsInfo = document.createElement('div');
            resultsInfo.className = 'filter-results alert alert-info small py-2 mt-2';
            table.parentNode.appendChild(resultsInfo);
        }

        resultsInfo.textContent = `Showing ${visibleCount} of ${totalCount} items`;
        
        if (visibleCount === totalCount) {
            resultsInfo.remove();
        }
    }

    // Drag and drop functionality
    addDragAndDrop() {
        this.addFileDropZone();
        this.addTableRowDragging();
    }

    addFileDropZone() {
        const fileInputs = document.querySelectorAll('input[type="file"]');
        fileInputs.forEach(input => {
            this.createDropZone(input);
        });
    }

    createDropZone(fileInput) {
        const dropZone = document.createElement('div');
        dropZone.className = 'drop-zone mt-3';
        dropZone.innerHTML = `
            <div class="drop-zone-icon">
                <i class="bi bi-cloud-upload"></i>
            </div>
            <div class="drop-zone-text">
                <strong>Drop files here</strong><br>
                <small>or click to browse</small>
            </div>
        `;

        dropZone.onclick = () => fileInput.click();

        // Drag and drop events
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, this.preventDefaults, false);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => dropZone.classList.add('drag-over'), false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => dropZone.classList.remove('drag-over'), false);
        });

        dropZone.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                fileInput.files = files;
                fileInput.dispatchEvent(new Event('change'));
            }
        });

        fileInput.parentNode.appendChild(dropZone);
    }

    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    // Smart filters and saved searches
    implementSmartFilters() {
        this.addQuickFilterButtons();
        this.addSavedSearches();
    }

    addQuickFilterButtons() {
        const tables = document.querySelectorAll('.table-enhanced');
        tables.forEach(table => {
            this.addQuickFiltersToTable(table);
        });
    }

    addQuickFiltersToTable(table) {
        const wrapper = table.closest('.card');
        if (!wrapper) return;

        const quickFilters = document.createElement('div');
        quickFilters.className = 'quick-filters mb-3';
        quickFilters.innerHTML = `
            <div class="btn-group" role="group">
                <button class="btn btn-sm btn-outline-secondary filter-btn active" data-filter="all">
                    All
                </button>
                <button class="btn btn-sm btn-outline-success filter-btn" data-filter="positive">
                    Income
                </button>
                <button class="btn btn-sm btn-outline-danger filter-btn" data-filter="negative">
                    Expenses
                </button>
                <button class="btn btn-sm btn-outline-info filter-btn" data-filter="recent">
                    This Month
                </button>
            </div>
        `;

        const cardBody = wrapper.querySelector('.card-body');
        if (cardBody) {
            cardBody.insertBefore(quickFilters, cardBody.firstChild);
        }

        // Add filter functionality
        quickFilters.addEventListener('click', (e) => {
            if (e.target.classList.contains('filter-btn')) {
                this.applyQuickFilter(table, e.target.dataset.filter, e.target);
            }
        });
    }

    applyQuickFilter(table, filter, button) {
        // Update active button
        const filterButtons = button.parentNode.querySelectorAll('.filter-btn');
        filterButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        const rows = table.querySelectorAll('tbody tr');
        
        rows.forEach(row => {
            let shouldShow = true;

            switch (filter) {
                case 'all':
                    shouldShow = true;
                    break;
                case 'positive':
                    shouldShow = this.isPositiveAmount(row);
                    break;
                case 'negative':
                    shouldShow = this.isNegativeAmount(row);
                    break;
                case 'recent':
                    shouldShow = this.isRecentDate(row);
                    break;
            }

            row.style.display = shouldShow ? '' : 'none';
        });
    }

    isPositiveAmount(row) {
        // Look for amount cells (usually have currency symbols or text-success class)
        const amountCells = row.querySelectorAll('.text-success, td');
        for (let cell of amountCells) {
            const text = cell.textContent;
            if (text.match(/\$?\d+\.?\d*/) && !text.includes('-') && cell.classList.contains('text-success')) {
                return true;
            }
        }
        return false;
    }

    isNegativeAmount(row) {
        // Look for amount cells with negative values or danger class
        const amountCells = row.querySelectorAll('.text-danger, td');
        for (let cell of amountCells) {
            const text = cell.textContent;
            if ((text.includes('-') || cell.classList.contains('text-danger')) && text.match(/\$?\d+\.?\d*/)) {
                return true;
            }
        }
        return false;
    }

    isRecentDate(row) {
        // Check if date is within current month
        const dateCells = row.querySelectorAll('td');
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        for (let cell of dateCells) {
            const date = this.extractDateFromCell(cell);
            if (date && date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
                return true;
            }
        }
        return false;
    }

    // Export options
    addExportOptions() {
        this.createExportButton();
    }

    createExportButton() {
        const tables = document.querySelectorAll('.table-enhanced');
        tables.forEach(table => {
            const wrapper = table.closest('.card');
            if (wrapper) {
                this.addExportToTable(wrapper, table);
            }
        });
    }

    addExportToTable(wrapper, table) {
        const header = wrapper.querySelector('.card-header');
        if (!header) return;

        const exportBtn = document.createElement('div');
        exportBtn.className = 'dropdown ms-2';
        exportBtn.innerHTML = `
            <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" 
                    data-bs-toggle="dropdown">
                <i class="bi bi-download me-1"></i>Export
            </button>
            <ul class="dropdown-menu">
                <li><a class="dropdown-item" href="#" onclick="window.flexibilityManager.exportTableCSV('${table.id || 'table'}')">
                    <i class="bi bi-file-earmark-spreadsheet me-2"></i>CSV
                </a></li>
                <li><a class="dropdown-item" href="#" onclick="window.flexibilityManager.exportTableJSON('${table.id || 'table'}')">
                    <i class="bi bi-file-earmark-code me-2"></i>JSON
                </a></li>
                <li><a class="dropdown-item" href="#" onclick="window.flexibilityManager.printTable('${table.id || 'table'}')">
                    <i class="bi bi-printer me-2"></i>Print
                </a></li>
            </ul>
        `;

        header.appendChild(exportBtn);
    }

    exportTableCSV(tableId) {
        const table = document.getElementById(tableId) || document.querySelector('.table-enhanced');
        const csv = this.tableToCSV(table);
        this.downloadFile(csv, 'export.csv', 'text/csv');
    }

    exportTableJSON(tableId) {
        const table = document.getElementById(tableId) || document.querySelector('.table-enhanced');
        const json = this.tableToJSON(table);
        this.downloadFile(JSON.stringify(json, null, 2), 'export.json', 'application/json');
    }

    printTable(tableId) {
        const table = document.getElementById(tableId) || document.querySelector('.table-enhanced');
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>FinWise Data Export</title>
                    <style>
                        table { border-collapse: collapse; width: 100%; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        th { background-color: #f2f2f2; }
                    </style>
                </head>
                <body>
                    <h1>FinWise Data Export</h1>
                    ${table.outerHTML}
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    }

    tableToCSV(table) {
        const rows = table.querySelectorAll('tr');
        const csv = [];

        rows.forEach(row => {
            const cells = row.querySelectorAll('th, td');
            const rowData = [];
            cells.forEach(cell => {
                // Skip checkbox columns
                if (!cell.querySelector('input[type="checkbox"]')) {
                    rowData.push('"' + cell.textContent.trim().replace(/"/g, '""') + '"');
                }
            });
            if (rowData.length > 0) {
                csv.push(rowData.join(','));
            }
        });

        return csv.join('\n');
    }

    tableToJSON(table) {
        const headers = [];
        const data = [];

        // Get headers
        const headerCells = table.querySelectorAll('thead th');
        headerCells.forEach(cell => {
            if (!cell.querySelector('input[type="checkbox"]')) {
                headers.push(cell.textContent.trim());
            }
        });

        // Get data
        const rows = table.querySelectorAll('tbody tr');
        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            const rowData = {};
            let headerIndex = 0;

            cells.forEach(cell => {
                if (!cell.querySelector('input[type="checkbox"]')) {
                    rowData[headers[headerIndex]] = cell.textContent.trim();
                    headerIndex++;
                }
            });

            if (Object.keys(rowData).length > 0) {
                data.push(rowData);
            }
        });

        return data;
    }

    downloadFile(content, filename, contentType) {
        const blob = new Blob([content], { type: contentType });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }

    // Quick access toolbar
    createQuickAccessToolbar() {
        const toolbar = document.createElement('div');
        toolbar.className = 'quick-access-toolbar position-fixed d-none d-lg-block';
        toolbar.style.cssText = `
            top: 50%;
            left: 20px;
            transform: translateY(-50%);
            z-index: 1030;
        `;

        toolbar.innerHTML = `
            <div class="d-flex flex-column gap-2">
                <button class="btn btn-primary btn-sm" onclick="window.flexibilityManager.quickImport()" 
                        title="Quick Import (Ctrl+Shift+I)" data-bs-toggle="tooltip" data-bs-placement="right">
                    <i class="bi bi-upload"></i>
                </button>
                <button class="btn btn-success btn-sm" onclick="window.flexibilityManager.quickAdd()" 
                        title="Quick Add (Ctrl+Shift+A)" data-bs-toggle="tooltip" data-bs-placement="right">
                    <i class="bi bi-plus"></i>
                </button>
                <button class="btn btn-info btn-sm" onclick="window.flexibilityManager.toggleDarkMode()" 
                        title="Toggle Theme" data-bs-toggle="tooltip" data-bs-placement="right">
                    <i class="bi bi-moon"></i>
                </button>
                <button class="btn btn-warning btn-sm" onclick="window.flexibilityManager.showKeyboardShortcuts()" 
                        title="Keyboard Shortcuts (?)" data-bs-toggle="tooltip" data-bs-placement="right">
                    <i class="bi bi-keyboard"></i>
                </button>
            </div>
        `;

        document.body.appendChild(toolbar);

        // Initialize tooltips
        const tooltips = toolbar.querySelectorAll('[data-bs-toggle="tooltip"]');
        tooltips.forEach(tooltip => {
            new bootstrap.Tooltip(tooltip);
        });
    }

    toggleDarkMode() {
        if (window.themeManager) {
            window.themeManager.toggleTheme();
        }
    }

    showKeyboardShortcuts() {
        if (window.FinWise && window.FinWise.UserControlManager) {
            // Use existing shortcut help from UserControlManager
            const userControl = new window.FinWise.UserControlManager();
            userControl.showShortcutHelp();
        }
    }

    // Custom shortcuts
    createCustomShortcuts() {
        this.addAdvancedShortcuts();
    }

    addAdvancedShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+Shift shortcuts for power users
            if (e.ctrlKey && e.shiftKey) {
                switch (e.key.toLowerCase()) {
                    case 'f':
                        e.preventDefault();
                        this.focusSearch();
                        break;
                    case 's':
                        e.preventDefault();
                        this.selectAll();
                        break;
                    case 'e':
                        e.preventDefault();
                        this.quickExport();
                        break;
                    case 'c':
                        e.preventDefault();
                        this.clearSelection();
                        break;
                }
            }

            // Alt + number for quick filters
            if (e.altKey && !e.ctrlKey) {
                const num = parseInt(e.key);
                if (num >= 1 && num <= 4) {
                    e.preventDefault();
                    this.applyQuickFilterByIndex(num - 1);
                }
            }
        });
    }

    focusSearch() {
        const searchInput = document.querySelector('.search-text, .table-search input, input[type="search"]');
        if (searchInput) {
            searchInput.focus();
            searchInput.select();
        }
    }

    selectAll() {
        const masterCheckbox = document.querySelector('.master-checkbox');
        if (masterCheckbox) {
            masterCheckbox.checked = true;
            masterCheckbox.dispatchEvent(new Event('change'));
        }
    }

    applyQuickFilterByIndex(index) {
        const filterButtons = document.querySelectorAll('.filter-btn');
        if (filterButtons[index]) {
            filterButtons[index].click();
        }
    }

    // User preferences
    loadUserPreferences() {
        const prefs = localStorage.getItem('finwise-preferences');
        return prefs ? JSON.parse(prefs) : {
            tablePageSize: 25,
            defaultExportFormat: 'csv',
            autoSave: true,
            showTooltips: true
        };
    }

    saveUserPreferences() {
        localStorage.setItem('finwise-preferences', JSON.stringify(this.userPreferences));
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.flexibilityManager = new FlexibilityManager();
});

// Export for use in other scripts
window.FinWise = window.FinWise || {};
window.FinWise.FlexibilityManager = FlexibilityManager;