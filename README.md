# FinTrack — Personal Finance Manager

> A fully client-side, zero-dependency (except Chart.js) income and expense manager built with vanilla HTML, CSS, and JavaScript. No backend needed.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)

---

## Table of Contents

1. [Features](#features)
2. [Project Structure](#project-structure)
3. [Installation](#installation)
4. [Usage Guide](#usage-guide)
5. [Module Documentation](#module-documentation)
6. [Customization](#customization)
7. [Performance & SEO](#performance--seo)
8. [Browser Support](#browser-support)
9. [Troubleshooting](#troubleshooting)
10. [License](#license)

---

## Features

### Core Features
- **Dashboard** — Real-time overview with income, expense, balance, and savings rate cards
- **Transactions** — Add, edit, delete, sort, search, filter, and paginate transactions
- **Budget Planner** — Set monthly category budgets with visual progress bars
- **Financial Goals** — Track savings goals with deadlines and contribution tracking
- **Reports & Analytics** — Annual reports with monthly breakdown and trend charts
- **Settings** — Currency, date format, savings targets, and custom categories

### Technical Features
- 📱 **Fully Responsive** — Mobile-first design that works on all screen sizes
- 🌙 **Dark/Light Theme** — Toggle with preference persistence
- 📊 **Interactive Charts** — Powered by Chart.js (cash flow, category, trend charts)
- 💾 **localStorage Persistence** — All data saved locally in the browser
- ♿ **Accessible** — ARIA roles, skip links, keyboard navigation
- 🔍 **SEO Friendly** — Semantic HTML5, meta tags, Open Graph
- ⚡ **Fast** — No build step, no frameworks, lazy-loaded charts
- 📤 **Import/Export** — JSON backup and CSV export for transactions
- 🔁 **Recurring Transactions** — Mark transactions as recurring with frequency
- 🎯 **Goal Contributions** — Add money to savings goals incrementally
- 🔔 **Toast Notifications** — Non-blocking feedback for all user actions
- 🧹 **Data Management** — Export, import, and clear all data

---

## Project Structure

```
finance-manager/
├── index.html              # Main HTML entry point
├── css/
│   └── style.css           # All styles (CSS custom properties, responsive)
├── js/
│   ├── storage.js          # localStorage abstraction layer
│   ├── utils.js            # Shared utility functions
│   ├── charts.js           # Chart.js wrapper module
│   ├── transactions.js     # Transaction CRUD and rendering
│   ├── budget.js           # Budget management
│   ├── goals.js            # Financial goals management
│   ├── reports.js          # Annual reports and analytics
│   └── app.js              # Main app, navigation, settings, boot
└── README.md               # This documentation
```

---

## Installation

### Method 1: Open Directly (Recommended for local use)

1. **Download** the project folder
2. **Open** `index.html` in any modern browser

> No server needed! All data is stored in your browser's localStorage.

```bash
# Clone or download the project
cd finance-manager
open index.html   # macOS
start index.html  # Windows
xdg-open index.html # Linux
```

### Method 2: Local Development Server

For development or to avoid CORS issues with some browsers:

```bash
# Using Python (built-in)
cd finance-manager
python3 -m http.server 8080
# Open: http://localhost:8080

# Using Node.js (npx)
npx serve .
# Open: http://localhost:3000

# Using PHP
php -S localhost:8080
# Open: http://localhost:8080
```

### Method 3: Deploy to Web

**GitHub Pages:**
1. Push the folder to a GitHub repository
2. Go to Settings → Pages → Source: main branch / root
3. Your app is live at `https://yourusername.github.io/repo-name`

**Netlify:**
1. Drag the `finance-manager/` folder to [app.netlify.com/drop](https://app.netlify.com/drop)
2. Instant deployment — no configuration needed

**Vercel:**
```bash
npm i -g vercel
cd finance-manager
vercel
```

**Any Static Host** (Firebase Hosting, Cloudflare Pages, etc.):
- Just upload the entire folder as-is. No build step required.

---

## Usage Guide

### First Launch
On first load, FinTrack automatically seeds **sample data** so you can explore all features immediately. You can clear this data from **Settings → Clear All Data**.

### Adding a Transaction
1. Click the **"+ Add"** button in the top bar (or any "Add transaction" button)
2. Select **Income** or **Expense** using the toggle
3. Fill in Amount, Date, Description, and Category
4. Optionally add Payment Method, Notes, and mark as Recurring
5. Click **"Add Transaction"**

### Setting a Budget
1. Navigate to **Budget** from the sidebar
2. Click **"+ Add Budget"**
3. Select a category and set a monthly spending limit
4. The progress bar updates automatically based on current month's spending

### Creating a Financial Goal
1. Navigate to **Goals** from the sidebar
2. Click **"+ Add Goal"**
3. Fill in the goal name, target amount, current savings, deadline, and pick an emoji
4. Use the **"+ Add"** button on a goal card to log contributions

### Viewing Reports
1. Navigate to **Reports** from the sidebar
2. Select a year from the dropdown
3. View annual totals, monthly bar chart, savings trend, and category breakdown

### Exporting Data
- **CSV Export**: Click the ⬇ icon in the topbar or go to Settings → Export CSV
- **JSON Backup**: Go to Settings → Export JSON (includes all app data)
- **Import**: Go to Settings → Import JSON to restore a backup

---

## Module Documentation

### `Storage` (`js/storage.js`)
Abstraction over `localStorage` with a namespace prefix.

```javascript
Storage.get('transactions')         // Returns parsed array or null
Storage.set('transactions', data)   // Saves to localStorage
Storage.remove('key')               // Deletes a key
Storage.clear()                     // Clears all FinTrack data
Storage.exportAll()                 // Returns all data as object
Storage.importAll(data)             // Imports a backup object
```

---

### `Utils` (`js/utils.js`)
Shared helper functions used across all modules.

```javascript
Utils.uid()                         // Generates a unique ID
Utils.formatCurrency(1234.5)        // → "$1,234.50" (respects settings)
Utils.formatDate('2024-03-15')      // → "03/15/2024" (respects settings)
Utils.today()                       // → "2024-03-15"
Utils.currentMonth()                // → "2024-03"
Utils.filterByPeriod(txns, 'month') // Filters transactions by period
Utils.summarize(txns)               // → { income, expense, balance, savingsRate }
Utils.groupByCategory(txns, 'expense') // Groups and sums by category
Utils.groupByMonth(txns, 2024)      // 12-element array of { income, expense }
Utils.toast('Message', 'success')   // Shows a toast notification
Utils.download(content, name, mime) // Triggers a file download
Utils.toCSV(transactions)           // Converts transactions to CSV string
Utils.escHtml(str)                  // Escapes HTML for safe rendering
Utils.debounce(fn, 300)             // Debounces a function
```

---

### `Charts` (`js/charts.js`)
Chart.js wrapper that manages chart instances and handles theming.

```javascript
Charts.renderCashflow(canvasId, labels, incomeData, expenseData)
Charts.renderCategory(canvasId, labels, data)
Charts.renderMonthly(canvasId, monthlyData)
Charts.renderTrend(canvasId, monthlyData)
Charts.destroy(canvasId)            // Destroy a specific chart instance
Charts.applyTheme()                 // Re-apply theme colors to all charts
```

---

### `Transactions` (`js/transactions.js`)
Handles all transaction CRUD, filtering, sorting, and rendering.

```javascript
Transactions.getAll()              // Returns all transactions array
Transactions.upsert(data)          // Add or update a transaction
Transactions.remove(id)            // Delete a transaction by ID
Transactions.renderTable()         // Re-renders the full transactions table
Transactions.renderRecent(8, 'month') // Renders recent transactions for dashboard
Transactions.openAdd()             // Opens the add transaction modal
Transactions.openEdit(id)          // Opens the edit modal for a transaction
Transactions.confirmDelete(id)     // Opens the delete confirmation modal
Transactions.goPage(page)          // Navigate to a pagination page
```

**Transaction Object Schema:**
```javascript
{
  id: "abc123-xyz",         // Unique ID (auto-generated)
  type: "income" | "expense",
  amount: 250.00,           // Number, always positive
  date: "2024-03-15",       // ISO date string YYYY-MM-DD
  description: "Salary",    // String
  category: "Salary",       // String matching a category
  payment: "bank",          // "cash" | "card" | "bank" | "mobile" | "other"
  notes: "Optional notes",  // String
  recurring: false,         // Boolean
  recurringFreq: "monthly", // "daily" | "weekly" | "monthly" | "yearly"
  createdAt: "2024-03-15T10:00:00.000Z" // ISO timestamp
}
```

---

### `Budget` (`js/budget.js`)
Monthly budget management per category.

```javascript
Budget.getAll()              // Returns all budgets
Budget.upsert(data)          // Add or update a budget
Budget.remove(id)            // Delete a budget
Budget.render()              // Re-renders the budget page
Budget.openAdd()             // Opens add budget modal
Budget.openEdit(id)          // Opens edit modal
Budget.confirmDelete(id)     // Opens delete confirmation
Budget.getMonthlySpending()  // Returns { category: totalSpent } for current month
```

**Budget Object Schema:**
```javascript
{
  id: "abc123",
  category: "Food & Dining",
  amount: 600.00        // Monthly spending limit
}
```

---

### `Goals` (`js/goals.js`)
Financial goal tracking with contributions.

```javascript
Goals.getAll()               // Returns all goals
Goals.upsert(data)           // Add or update a goal
Goals.remove(id)             // Delete a goal
Goals.addContribution(id, amount) // Add to goal's saved amount
Goals.render()               // Re-renders the goals page
Goals.contribute(id)         // Called by UI to add contribution
Goals.openAdd()              // Opens add goal modal
Goals.openEdit(id)           // Opens edit goal modal
Goals.confirmDelete(id)      // Opens delete confirmation
```

**Goal Object Schema:**
```javascript
{
  id: "abc123",
  name: "Emergency Fund",
  target: 10000,        // Target amount
  saved: 3500,          // Amount saved so far
  deadline: "2025-12-31", // ISO date string or ""
  emoji: "💰",          // Emoji icon
  createdAt: "..."      // ISO timestamp
}
```

---

### `Reports` (`js/reports.js`)
Annual analytics and chart rendering.

```javascript
Reports.getYears()           // Returns array of years from transactions
Reports.populateYears()      // Populates year dropdown
Reports.render()             // Renders all report sections for selected year
```

---

### `App` (`js/app.js`)
Main orchestrator — app state, navigation, settings, data management.

```javascript
App.refreshDashboard()       // Refresh dashboard cards, charts, recent list
App.refreshAll()             // Refresh all currently visible UI
App.seedSampleData()         // Seeds sample data if no transactions exist
App.init()                   // Boots the entire application
```

**AppState:**
```javascript
AppState.settings = {
  userName: '',
  currency: 'USD',
  dateFormat: 'MM/DD/YYYY',
  savingsTarget: 20,
  incomeCategories: [...],
  expenseCategories: [...]
}
```

---

## Customization

### Changing Color Theme
Edit CSS variables in `css/style.css`:

```css
:root {
  --income: #10b981;        /* Green for income */
  --expense: #f43f5e;       /* Red for expenses */
  --balance: #3b82f6;       /* Blue for balance */
  --gold: #f59e0b;          /* Gold for savings */
  --accent: #6366f1;        /* Purple accent */
}
```

### Adding Default Categories
In `js/app.js`, edit the `AppState.settings` object:

```javascript
incomeCategories: ['Salary', 'Freelance', 'YourCustomCategory'],
expenseCategories: ['Housing', 'Food', 'YourCustomCategory']
```

### Adding a New Currency
In `js/utils.js`, add to the symbols object:

```javascript
const symbols = { USD:'$', EUR:'€', SGD:'S$', /* add here */ };
```

And in `index.html`, add an `<option>` to the currency `<select>`.

---

## Performance & SEO

### Performance
- **No build step** — Files load directly, zero compile time
- **Deferred scripts** — All JS uses `defer` attribute
- **Chart.js via CDN** — Loaded from jsDelivr CDN with caching
- **CSS variables** — Efficient theme switching without JS re-renders
- **Debounced search** — 200ms debounce on search input
- **Pagination** — Only renders 10 transactions per page

### SEO
- Semantic HTML5 elements (`<main>`, `<header>`, `<nav>`, `<aside>`, `<article>`, `<section>`)
- Meta description and keywords
- Open Graph meta tags
- `lang="en"` on `<html>`
- ARIA roles and labels throughout
- Skip-to-content link for screen readers
- `<title>` and `<h1>` hierarchy

---

## Browser Support

| Browser | Version | Support |
|---------|---------|---------|
| Chrome  | 90+     | ✅ Full |
| Firefox | 85+     | ✅ Full |
| Safari  | 14+     | ✅ Full |
| Edge    | 90+     | ✅ Full |
| Opera   | 75+     | ✅ Full |
| IE      | Any     | ❌ Not supported |

**Requires:** `localStorage`, `CSS Custom Properties`, `ES6+`

---

## Troubleshooting

### Data isn't persisting between sessions
- Make sure you're not in **private/incognito mode** — localStorage is wiped when the session ends
- Check if your browser has localStorage disabled

### Charts not showing
- Check your internet connection — Chart.js is loaded from CDN
- Open browser DevTools → Console and look for errors
- As a fallback, download Chart.js locally and update the `<script>` tag in `index.html`

### App not loading
- Ensure you're opening `index.html` (not another file)
- Try a different browser
- Check DevTools console for JavaScript errors

### Import not working
- The import file must be a valid JSON file exported from FinTrack
- Ensure the JSON has not been manually edited in a way that breaks structure

---

## License

MIT License — free to use, modify, and distribute.

---

**Built with ♥ using vanilla HTML, CSS & JavaScript**
