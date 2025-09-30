// FinWise Dark Mode Functionality

class ThemeManager {
    constructor() {
        this.currentTheme = localStorage.getItem('theme') || 'light';
        this.init();
    }

    init() {
        // Apply saved theme on page load
        this.applyTheme(this.currentTheme);
        
        // Create and add theme toggle button
        this.createThemeToggle();
        
        // Listen for system theme changes
        this.watchSystemTheme();
    }

    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        this.currentTheme = theme;
        localStorage.setItem('theme', theme);
        
        // Update toggle button if it exists
        this.updateToggleButton();
        
        // Dispatch custom event for other scripts
        document.dispatchEvent(new CustomEvent('themeChanged', { 
            detail: { theme } 
        }));
    }

    toggleTheme() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme(newTheme);
    }

    createThemeToggle() {
        const navbar = document.querySelector('.navbar .navbar-nav:last-child');
        if (!navbar) return;

        // Create theme toggle container
        const themeContainer = document.createElement('li');
        themeContainer.className = 'nav-item d-flex align-items-center me-2';
        
        // Create toggle button
        const toggleButton = document.createElement('button');
        toggleButton.className = 'theme-toggle btn btn-sm';
        toggleButton.id = 'theme-toggle';
        toggleButton.setAttribute('aria-label', 'Toggle theme');
        toggleButton.innerHTML = this.getToggleHTML();
        
        // Add click event
        toggleButton.addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleTheme();
        });

        themeContainer.appendChild(toggleButton);
        
        // Insert before the first child (login/logout buttons)
        navbar.insertBefore(themeContainer, navbar.firstChild);
    }

    getToggleHTML() {
        const isDark = this.currentTheme === 'dark';
        return `
            <i class="${isDark ? 'bi bi-sun-fill' : 'bi bi-moon-fill'}"></i>
            <span>${isDark ? 'Light' : 'Dark'}</span>
        `;
    }

    updateToggleButton() {
        const toggleButton = document.getElementById('theme-toggle');
        if (toggleButton) {
            toggleButton.innerHTML = this.getToggleHTML();
        }
    }

    watchSystemTheme() {
        // Only watch system theme if user hasn't set a preference
        if (!localStorage.getItem('theme')) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            
            const handleSystemThemeChange = (e) => {
                if (!localStorage.getItem('theme')) {
                    this.applyTheme(e.matches ? 'dark' : 'light');
                }
            };

            mediaQuery.addListener(handleSystemThemeChange);
            
            // Apply initial system theme
            handleSystemThemeChange(mediaQuery);
        }
    }

    // Public method to get current theme
    getCurrentTheme() {
        return this.currentTheme;
    }

    // Public method to set theme programmatically
    setTheme(theme) {
        if (theme === 'light' || theme === 'dark') {
            this.applyTheme(theme);
        }
    }
}

// Enhanced Table Functionality
class TableEnhancer {
    constructor() {
        this.init();
    }

    init() {
        // Apply enhancements to existing tables
        this.enhanceExistingTables();
        
        // Watch for dynamically added tables
        this.watchForNewTables();
    }

    enhanceExistingTables() {
        const tables = document.querySelectorAll('.table');
        tables.forEach(table => this.enhanceTable(table));
    }

    enhanceTable(table) {
        // Skip if already enhanced
        if (table.classList.contains('table-enhanced')) return;
        
        // Add enhanced class
        table.classList.add('table-enhanced');
        
        // Add hover effects to rows
        this.addRowHoverEffects(table);
        
        // Add sorting capability if not already present
        this.addSortingCapability(table);
        
        // Add responsive wrapper if needed
        this.addResponsiveWrapper(table);
    }

    addRowHoverEffects(table) {
        const rows = table.querySelectorAll('tbody tr');
        rows.forEach(row => {
            row.addEventListener('mouseenter', () => {
                row.style.transform = 'scale(1.01)';
            });
            
            row.addEventListener('mouseleave', () => {
                row.style.transform = 'scale(1)';
            });
        });
    }

    addSortingCapability(table) {
        const headers = table.querySelectorAll('thead th');
        headers.forEach((header, index) => {
            // Skip if header already has sorting
            if (header.querySelector('.sort-indicator')) return;
            
            // Skip certain columns (like actions)
            const text = header.textContent.toLowerCase();
            if (text.includes('action') || text.includes('edit') || text.includes('delete')) return;
            
            header.style.cursor = 'pointer';
            header.style.userSelect = 'none';
            
            // Add sort indicator
            const indicator = document.createElement('span');
            indicator.className = 'sort-indicator ms-1';
            indicator.innerHTML = '<i class="bi bi-arrow-down-up" style="font-size: 0.8em; opacity: 0.5;"></i>';
            header.appendChild(indicator);
            
            // Add click event for sorting
            header.addEventListener('click', () => {
                this.sortTable(table, index);
            });
        });
    }

    sortTable(table, columnIndex) {
        const tbody = table.querySelector('tbody');
        const rows = Array.from(tbody.querySelectorAll('tr'));
        
        // Determine sort direction
        const header = table.querySelectorAll('thead th')[columnIndex];
        const currentSort = header.getAttribute('data-sort') || 'none';
        const newSort = currentSort === 'asc' ? 'desc' : 'asc';
        
        // Clear all sort indicators
        table.querySelectorAll('thead th').forEach(th => {
            th.removeAttribute('data-sort');
            const indicator = th.querySelector('.sort-indicator i');
            if (indicator) {
                indicator.className = 'bi bi-arrow-down-up';
                indicator.style.opacity = '0.5';
            }
        });
        
        // Set new sort indicator
        header.setAttribute('data-sort', newSort);
        const indicator = header.querySelector('.sort-indicator i');
        if (indicator) {
            indicator.className = newSort === 'asc' ? 'bi bi-arrow-up' : 'bi bi-arrow-down';
            indicator.style.opacity = '1';
        }
        
        // Sort rows
        rows.sort((a, b) => {
            const aText = a.cells[columnIndex]?.textContent.trim() || '';
            const bText = b.cells[columnIndex]?.textContent.trim() || '';
            
            // Try to parse as numbers for numeric sorting
            const aNum = parseFloat(aText.replace(/[$,]/g, ''));
            const bNum = parseFloat(bText.replace(/[$,]/g, ''));
            
            let comparison = 0;
            if (!isNaN(aNum) && !isNaN(bNum)) {
                comparison = aNum - bNum;
            } else {
                comparison = aText.localeCompare(bText);
            }
            
            return newSort === 'asc' ? comparison : -comparison;
        });
        
        // Reappend sorted rows
        rows.forEach(row => tbody.appendChild(row));
    }

    addResponsiveWrapper(table) {
        // Skip if already wrapped
        if (table.parentElement.classList.contains('table-responsive')) return;
        
        const wrapper = document.createElement('div');
        wrapper.className = 'table-responsive';
        table.parentNode.insertBefore(wrapper, table);
        wrapper.appendChild(table);
    }

    watchForNewTables() {
        // Use MutationObserver to watch for new tables
        const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const tables = node.querySelectorAll ? node.querySelectorAll('.table') : [];
                        tables.forEach(table => this.enhanceTable(table));
                        
                        // Check if the node itself is a table
                        if (node.classList && node.classList.contains('table')) {
                            this.enhanceTable(node);
                        }
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
}

// Animation utilities
class AnimationUtils {
    static fadeIn(element, duration = 300) {
        element.style.opacity = '0';
        element.style.transition = `opacity ${duration}ms ease`;
        
        requestAnimationFrame(() => {
            element.style.opacity = '1';
        });
    }

    static slideIn(element, direction = 'up', duration = 300) {
        const transforms = {
            up: 'translateY(20px)',
            down: 'translateY(-20px)',
            left: 'translateX(20px)',
            right: 'translateX(-20px)'
        };

        element.style.transform = transforms[direction];
        element.style.opacity = '0';
        element.style.transition = `all ${duration}ms ease`;
        
        requestAnimationFrame(() => {
            element.style.transform = 'translate(0)';
            element.style.opacity = '1';
        });
    }
}

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Initialize theme manager
    window.themeManager = new ThemeManager();
    
    // Initialize table enhancer
    window.tableEnhancer = new TableEnhancer();
    
    // Add smooth animations to cards
    const cards = document.querySelectorAll('.card');
    cards.forEach((card, index) => {
        setTimeout(() => {
            AnimationUtils.fadeIn(card);
        }, index * 50);
    });
});

// Export for use in other scripts
window.FinWise = {
    ThemeManager,
    TableEnhancer,
    AnimationUtils
};