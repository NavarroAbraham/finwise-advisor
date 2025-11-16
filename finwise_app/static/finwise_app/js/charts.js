// FinWise Interactive Charts using Chart.js

class FinWiseCharts {
    constructor() {
        this.charts = {};
        this.defaultColors = [
            '#4dabf7', '#51cf66', '#ffd43b', '#ff6b6b', '#a78bfa',
            '#fb923c', '#22d3ee', '#f472b6', '#a3e635', '#facc15'
        ];
        this.init();
    }

    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initializeCharts());
        } else {
            this.initializeCharts();
        }

        // Listen for theme changes to update chart colors
        document.addEventListener('themeChanged', (e) => {
            this.updateChartsForTheme(e.detail.theme);
        });
    }

    initializeCharts() {
        // Initialize all charts based on canvas elements present
        if (document.getElementById('spendingByCategoryChart')) {
            this.loadSpendingByCategory();
        }
        if (document.getElementById('spendingTrendChart')) {
            this.loadSpendingTrend();
        }
        if (document.getElementById('incomeVsExpensesChart')) {
            this.loadIncomeVsExpenses();
        }
        if (document.getElementById('accountBalanceChart')) {
            this.loadAccountBalance();
        }
        if (document.getElementById('budgetProgressChart')) {
            this.loadBudgetProgress();
        }
    }

    getChartDefaults() {
        const theme = document.documentElement.getAttribute('data-theme') || 'light';
        const isDark = theme === 'dark';

        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: isDark ? '#ffffff' : '#212529',
                        font: {
                            family: "'Segoe UI', system-ui, -apple-system, sans-serif"
                        }
                    }
                },
                tooltip: {
                    backgroundColor: isDark ? '#2d2d2d' : '#ffffff',
                    titleColor: isDark ? '#ffffff' : '#212529',
                    bodyColor: isDark ? '#b0b0b0' : '#6c757d',
                    borderColor: isDark ? '#404040' : '#dee2e6',
                    borderWidth: 1
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: isDark ? '#b0b0b0' : '#6c757d'
                    },
                    grid: {
                        color: isDark ? '#404040' : '#dee2e6'
                    }
                },
                y: {
                    ticks: {
                        color: isDark ? '#b0b0b0' : '#6c757d',
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        }
                    },
                    grid: {
                        color: isDark ? '#404040' : '#dee2e6'
                    }
                }
            }
        };
    }

    async loadSpendingByCategory(days = 30) {
        try {
            const response = await fetch(`/api/spending-by-category/?days=${days}`);
            const data = await response.json();

            const ctx = document.getElementById('spendingByCategoryChart');
            if (!ctx) return;

            // Destroy existing chart if it exists
            if (this.charts.spendingByCategory) {
                this.charts.spendingByCategory.destroy();
            }

            const chartData = {
                labels: data.categories,
                datasets: [{
                    label: 'Spending by Category',
                    data: data.amounts,
                    backgroundColor: data.colors,
                    borderWidth: 2,
                    borderColor: document.documentElement.getAttribute('data-theme') === 'dark' ? '#1a1a1a' : '#ffffff'
                }]
            };

            const config = {
                type: 'doughnut',
                data: chartData,
                options: {
                    ...this.getChartDefaults(),
                    plugins: {
                        ...this.getChartDefaults().plugins,
                        legend: {
                            position: 'right',
                            labels: {
                                color: document.documentElement.getAttribute('data-theme') === 'dark' ? '#ffffff' : '#212529',
                                padding: 15,
                                font: {
                                    size: 12
                                }
                            }
                        },
                        tooltip: {
                            ...this.getChartDefaults().plugins.tooltip,
                            callbacks: {
                                label: function(context) {
                                    const label = context.label || '';
                                    const value = context.parsed || 0;
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = ((value / total) * 100).toFixed(1);
                                    return `${label}: $${value.toFixed(2)} (${percentage}%)`;
                                }
                            }
                        }
                    }
                }
            };

            this.charts.spendingByCategory = new Chart(ctx, config);
        } catch (error) {
            console.error('Error loading spending by category chart:', error);
        }
    }

    async loadSpendingTrend(days = 30) {
        try {
            const response = await fetch(`/api/spending-trend/?days=${days}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Spending trend data:', data);

            const ctx = document.getElementById('spendingTrendChart');
            if (!ctx) {
                console.error('Canvas element spendingTrendChart not found');
                return;
            }

            if (this.charts.spendingTrend) {
                this.charts.spendingTrend.destroy();
            }

            // Check if we have data
            if (!data.dates || data.dates.length === 0) {
                console.warn('No spending trend data available');
                // Show empty state - preserve canvas for future reloads
                const canvasParent = ctx.parentElement;
                ctx.style.display = 'none';
                let emptyState = canvasParent.querySelector('.chart-empty-state');
                if (!emptyState) {
                    emptyState = document.createElement('div');
                    emptyState.className = 'chart-empty-state';
                    emptyState.innerHTML = '<i class="bi bi-graph-up"></i><p>No spending data available for this period</p>';
                    canvasParent.appendChild(emptyState);
                } else {
                    emptyState.style.display = 'flex';
                }
                return;
            }

            // Hide empty state and show canvas if it exists
            ctx.style.display = 'block';
            const emptyState = ctx.parentElement.querySelector('.chart-empty-state');
            if (emptyState) {
                emptyState.style.display = 'none';
            }

            const chartData = {
                labels: data.dates,
                datasets: [{
                    label: 'Daily Spending',
                    data: data.amounts,
                    borderColor: '#4dabf7',
                    backgroundColor: 'rgba(77, 171, 247, 0.1)',
                    tension: 0.4,
                    fill: true,
                    borderWidth: 2
                }]
            };

            const config = {
                type: 'line',
                data: chartData,
                options: {
                    ...this.getChartDefaults(),
                    plugins: {
                        ...this.getChartDefaults().plugins,
                        legend: {
                            display: false
                        }
                    }
                }
            };

            this.charts.spendingTrend = new Chart(ctx, config);
            console.log('Spending trend chart created successfully');
        } catch (error) {
            console.error('Error loading spending trend chart:', error);
            // Show error state - preserve canvas
            const ctx = document.getElementById('spendingTrendChart');
            if (ctx && ctx.parentElement) {
                ctx.style.display = 'none';
                const canvasParent = ctx.parentElement;
                let errorState = canvasParent.querySelector('.chart-error-state');
                if (!errorState) {
                    errorState = document.createElement('div');
                    errorState.className = 'chart-empty-state chart-error-state';
                    errorState.innerHTML = '<i class="bi bi-exclamation-triangle text-danger"></i><p>Error loading chart data</p>';
                    canvasParent.appendChild(errorState);
                } else {
                    errorState.style.display = 'flex';
                }
            }
        }
    }

    async loadIncomeVsExpenses(months = 6) {
        try {
            const response = await fetch(`/api/income-vs-expenses/?months=${months}`);
            const data = await response.json();

            const ctx = document.getElementById('incomeVsExpensesChart');
            if (!ctx) return;

            if (this.charts.incomeVsExpenses) {
                this.charts.incomeVsExpenses.destroy();
            }

            const chartData = {
                labels: data.data.map(d => d.month),
                datasets: [
                    {
                        label: 'Income',
                        data: data.data.map(d => d.income),
                        backgroundColor: '#51cf66',
                        borderColor: '#51cf66',
                        borderWidth: 2
                    },
                    {
                        label: 'Expenses',
                        data: data.data.map(d => d.expenses),
                        backgroundColor: '#ff6b6b',
                        borderColor: '#ff6b6b',
                        borderWidth: 2
                    }
                ]
            };

            const config = {
                type: 'bar',
                data: chartData,
                options: {
                    ...this.getChartDefaults(),
                    plugins: {
                        ...this.getChartDefaults().plugins,
                        legend: {
                            position: 'top',
                            labels: {
                                color: document.documentElement.getAttribute('data-theme') === 'dark' ? '#ffffff' : '#212529'
                            }
                        }
                    }
                }
            };

            this.charts.incomeVsExpenses = new Chart(ctx, config);
        } catch (error) {
            console.error('Error loading income vs expenses chart:', error);
        }
    }

    async loadAccountBalance() {
        try {
            const response = await fetch('/api/account-balance/');
            const data = await response.json();

            const ctx = document.getElementById('accountBalanceChart');
            if (!ctx) return;

            if (this.charts.accountBalance) {
                this.charts.accountBalance.destroy();
            }

            const colors = data.accounts.map((_, index) => this.defaultColors[index % this.defaultColors.length]);

            const chartData = {
                labels: data.accounts.map(a => a.name),
                datasets: [{
                    label: 'Account Balance',
                    data: data.accounts.map(a => a.balance),
                    backgroundColor: colors,
                    borderWidth: 2,
                    borderColor: document.documentElement.getAttribute('data-theme') === 'dark' ? '#1a1a1a' : '#ffffff'
                }]
            };

            const config = {
                type: 'pie',
                data: chartData,
                options: {
                    ...this.getChartDefaults(),
                    plugins: {
                        ...this.getChartDefaults().plugins,
                        legend: {
                            position: 'bottom',
                            labels: {
                                color: document.documentElement.getAttribute('data-theme') === 'dark' ? '#ffffff' : '#212529',
                                padding: 15
                            }
                        },
                        tooltip: {
                            ...this.getChartDefaults().plugins.tooltip,
                            callbacks: {
                                label: function(context) {
                                    const label = context.label || '';
                                    const value = context.parsed || 0;
                                    return `${label}: $${value.toFixed(2)}`;
                                }
                            }
                        }
                    }
                }
            };

            this.charts.accountBalance = new Chart(ctx, config);
        } catch (error) {
            console.error('Error loading account balance chart:', error);
        }
    }

    async loadBudgetProgress() {
        try {
            const response = await fetch('/api/budgets/');
            const data = await response.json();

            const ctx = document.getElementById('budgetProgressChart');
            if (!ctx) return;

            if (this.charts.budgetProgress) {
                this.charts.budgetProgress.destroy();
            }

            const chartData = {
                labels: data.budgets.map(b => b.category),
                datasets: [
                    {
                        label: 'Budgeted',
                        data: data.budgets.map(b => b.budgeted),
                        backgroundColor: 'rgba(77, 171, 247, 0.5)',
                        borderColor: '#4dabf7',
                        borderWidth: 2
                    },
                    {
                        label: 'Spent',
                        data: data.budgets.map(b => b.spent),
                        backgroundColor: data.budgets.map(b => 
                            b.over_threshold ? 'rgba(255, 107, 107, 0.5)' : 'rgba(255, 212, 59, 0.5)'
                        ),
                        borderColor: data.budgets.map(b => 
                            b.over_threshold ? '#ff6b6b' : '#ffd43b'
                        ),
                        borderWidth: 2
                    }
                ]
            };

            const config = {
                type: 'bar',
                data: chartData,
                options: {
                    ...this.getChartDefaults(),
                    indexAxis: 'y',
                    plugins: {
                        ...this.getChartDefaults().plugins,
                        legend: {
                            position: 'top',
                            labels: {
                                color: document.documentElement.getAttribute('data-theme') === 'dark' ? '#ffffff' : '#212529'
                            }
                        }
                    }
                }
            };

            this.charts.budgetProgress = new Chart(ctx, config);
        } catch (error) {
            console.error('Error loading budget progress chart:', error);
        }
    }

    updateChartsForTheme(theme) {
        // Reload all active charts with new theme colors
        Object.keys(this.charts).forEach(chartKey => {
            const chart = this.charts[chartKey];
            if (chart) {
                const isDark = theme === 'dark';
                
                // Update legend colors
                if (chart.options.plugins.legend) {
                    chart.options.plugins.legend.labels.color = isDark ? '#ffffff' : '#212529';
                }
                
                // Update tooltip colors
                if (chart.options.plugins.tooltip) {
                    chart.options.plugins.tooltip.backgroundColor = isDark ? '#2d2d2d' : '#ffffff';
                    chart.options.plugins.tooltip.titleColor = isDark ? '#ffffff' : '#212529';
                    chart.options.plugins.tooltip.bodyColor = isDark ? '#b0b0b0' : '#6c757d';
                    chart.options.plugins.tooltip.borderColor = isDark ? '#404040' : '#dee2e6';
                }
                
                // Update scale colors
                if (chart.options.scales) {
                    if (chart.options.scales.x) {
                        chart.options.scales.x.ticks.color = isDark ? '#b0b0b0' : '#6c757d';
                        chart.options.scales.x.grid.color = isDark ? '#404040' : '#dee2e6';
                    }
                    if (chart.options.scales.y) {
                        chart.options.scales.y.ticks.color = isDark ? '#b0b0b0' : '#6c757d';
                        chart.options.scales.y.grid.color = isDark ? '#404040' : '#dee2e6';
                    }
                }
                
                chart.update();
            }
        });
    }

    // Public method to reload a specific chart
    reloadChart(chartName, ...args) {
        switch(chartName) {
            case 'spendingByCategory':
                this.loadSpendingByCategory(...args);
                break;
            case 'spendingTrend':
                this.loadSpendingTrend(...args);
                break;
            case 'incomeVsExpenses':
                this.loadIncomeVsExpenses(...args);
                break;
            case 'accountBalance':
                this.loadAccountBalance();
                break;
            case 'budgetProgress':
                this.loadBudgetProgress();
                break;
        }
    }
}

// Initialize charts when script loads
const finWiseCharts = new FinWiseCharts();

// Make it globally accessible for manual control
window.finWiseCharts = finWiseCharts;
