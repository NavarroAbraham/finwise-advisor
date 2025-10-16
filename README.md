# FinWise – Intelligent Financial Advisor

<img width="310" height="310" alt="image" src="https://github.com/user-attachments/assets/4019df48-5907-4963-8423-5915f6013a3c" />

## Description

FinWise is a comprehensive personal finance management application that helps you take control of your financial life. Import transactions from OFX files, automatically categorize expenses, set budgets, track bills, and gain insights into your spending patterns—all with a clean, intuitive interface and dark mode support.

**Key Features:**
- 📊 **Transaction Import**: Upload OFX files from financial institutions
- 🏷️ **Smart Categorization**: Automatic expense categorization with manual override
- 💰 **Budget Tracking**: Set monthly budgets and monitor spending
- 📅 **Bill Management**: Track recurring bills and set reminders
- 🌙 **Dark Mode**: Easy on the eyes with theme switching
- 🔒 **Secure**: User authentication and data privacy

## How to Use

### Prerequisites
- Python 3.8 or higher
- pip (Python package installer)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/NavarroAbraham/finwise-advisor.git
   cd finwise-advisor
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Run database migrations:**
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

4. **Create a superuser (optional, for admin access):**
   ```bash
   python manage.py createsuperuser
   ```

5. **Start the development server:**
   ```bash
   python manage.py runserver
   ```

6. **Open your browser and navigate to:**
   ```
   http://127.0.0.1:8000/
   ```

### Basic Usage

1. **Register/Login:**
   - Create an account or log in to access your dashboard

2. **Import Transactions:**
   - Go to the Import page
   - Upload an OFX file from your bank
   - Transactions will be automatically categorized

3. **Manage Categories:**
   - View and edit expense categories
   - Add custom categories for better organization

4. **Set Budgets:**
   - Create monthly budgets for different categories
   - Monitor spending against your budget limits

5. **Track Bills:**
   - Add recurring bills with due dates
   - Set reminders and mark bills as paid

6. **View Dashboard:**
   - Get an overview of your financial health
   - See spending trends and upcoming bills

### Additional Features

- **Export Data:** Download your financial data as JSON
- **Clean Data:** Remove duplicates, old transactions, or unused categories
- **Dark Mode:** Toggle between light and dark themes
- **Responsive Design:** Works on desktop and mobile devices

## Technologies Used

- **Backend:** Django 5.2
- **Frontend:** Bootstrap 5, JavaScript
- **Database:** SQLite (development), PostgreSQL (production)
- **File Processing:** OFX tools for financial data import

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
