# FinTrack Pro — Personal Finance Manager v3.1.0+

> 💰 Modern, privacy-first personal finance management. Track income, expenses, budgets, savings goals, and loans with zero data collection. 100% offline, 100% private, zero servers.

![Version](https://img.shields.io/badge/version-3.1.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow.svg)
![PWA](https://img.shields.io/badge/PWA-Installed-success.svg)

---

## ✨ Features

### 💳 Complete Transaction Management
- Track unlimited income and expense transactions
- Custom categories (editable, organized)
- Date, amount, category, and description for each transaction
- Edit and delete transactions anytime
- Real-time balance calculation
- Transaction history with search and filters

### 📊 Smart Analytics & Reports
- Income vs expense analysis
- Category spending breakdown
- Monthly trend visualization
- Year-over-year comparisons
- Customizable date ranges (week, month, year, all-time)
- Interactive charts with Chart.js

### 💰 Budget Planning
- Set monthly budgets per category
- Real-time spending progress tracking
- Visual progress bars
- Budget alerts at 80% and 100% thresholds
- Comparison with previous months
- Over-budget warnings

### 🎯 Savings Goals
- Create multiple financial goals
- Track progress toward targets
- Auto-calculate percent complete
- Adjust contributions anytime
- Mark goals as achieved
- Motivational progress visualization

### 🏦 Loan Management
- Track loans given or taken
- Borrower/lender name and details
- Payment management with history
- Automatic balance impact:
  - **Loans taken**: Increases your balance
  - **Loans given**: Decreases your balance
- Track remaining balance
- Full loan settlement

### 🔐 100% Private
- **Zero Servers** - All data stays on your device
- **No Cloud Sync** - Unless you export
- **No Tracking** - No analytics, no cookies, no telemetry
- **No Ads** - Completely ad-free
- **No Data Collection** - We don't know you exist
- **Browser Storage** - Encrypted locally by your browser

### 📱 Works Everywhere
- Desktop web browser
- Tablet (responsive design)
- Mobile device (PWA)
- Install as native app
- Works completely offline
- Sync across browsers on same device

### 📥 Data Management
- **Export JSON** - Complete backup of all data
- **Export CSV** - Transaction list for spreadsheets
- **Import with Validation** - Smart backup recovery
- **Merge or Replace** - Choose import mode
- **Backup History** - Track your recent backups
- **Storage Management** - Monitor & optimize usage

### 🎨 Professional Interface
- Light & dark themes
- Auto theme detection (respects OS preference)
- Smooth transitions
- Responsive layout
- Accessibility features
- Reduced motion support

---

## 🚀 Getting Started

### Installation

#### Option 1: Web Browser (Recommended)
1. Open https://fintrackpro.com in any modern browser
2. Click "Install" button in address bar
3. Follow browser prompts
4. Done! App now works offline too

#### Option 2: Local Development
```bash
# Clone the repository
git clone https://github.com/farukislamyt/fintrack.git
cd fintrack

# Open in browser
open index.html

# Or use a local server
python -m http.server 8000
# Visit http://localhost:8000
```

### First Time Setup
1. **Welcome Screen** - Tour of features
2. **Basic Settings** - Name, currency, savings target
3. **Add Categories** - Customize income/expense categories
4. **Start Tracking** - Create your first transaction

---

## 📚 How to Use

### Adding Transactions
```
Dashboard → Transactions → Add Transaction
├─ Type: Income or Expense
├─ Category: Choose from list
├─ Amount: Dollar amount
├─ Date: Transaction date
└─ Description: Optional notes

Changes apply immediately!
```

### Creating a Budget
```
Dashboard → Budget → Add Budget
├─ Category: Select category
├─ Monthly Limit: Set your limit
└─ Save

Track spending in real-time with visual progress bars
```

### Setting Goals
```
Dashboard → Goals → Add Goal
├─ Goal Name: What are you saving for?
├─ Target Amount: Your goal amount
├─ Target Date: When do you want to achieve it?
└─ Save

Contribute to goals as you progress
```

### Managing Loans
```
Dashboard → Loans → Add Loan
├─ Type: Lending or Borrowing
├─ Person: Name of borrower/lender
├─ Amount: Loan amount
├─ Date: Loan date
└─ Save

Add payments as they're made
Track remaining balance automatically
```

### Analyzing Reports
```
Dashboard → Reports → Select Period
├─ View income vs expense
├─ See category breakdown
├─ Check monthly trends
└─ Analyze spending patterns
```

### Backing Up Data
```
Settings → Data Management
├─ Export JSON: Full backup
├─ Export CSV: Transactions for Excel
├─ Import: Restore from backup
├─ Backup History: See recent backups
└─ Optimize Storage: Free up space
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+N` / `Cmd+N` | New transaction |
| `Ctrl+E` / `Cmd+E` | Export data |
| `Ctrl+I` / `Cmd+I` | Import backup |
| `Escape` | Close modals |
| `Tab` | Navigate fields |
| `Enter` | Submit forms |

---

## 🔒 Privacy & Security

### Your Data is Yours
- **100% Local Storage** - stays on your device
- **No Login Required** - no account, no tracking
- **No Data Sharing** - we don't share with anyone
- **No Ads** - no third-party tracking pixels
- **GDPR Compliant** - we follow privacy regulations

### Export & Backup
```javascript
// Full backup includes:
- All transactions with dates
- Budget configurations
- Goals and progress
- Loan records
- Settings and preferences
- Complete financial history

// Backups are JSON format:
Easy to import elsewhere
Compatible with common tools
Readable in any text editor
```

### Clearing Data
```
Settings → Danger Zone → Clear All Data
├─ Creates automatic backup first (recommended!)
├─ Confirmation required
└─ Irreversible
```

---

## 🌐 Browser Requirements

### Supported Browsers
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Opera 76+

### Required Features
- ES6+ JavaScript support
- localStorage API (5-10 MB)
- Service Workers
- CSS Grid & Flexbox

### Not Supported
- ❌ Internet Explorer (use modern browser)
- ❌ Very old mobile browsers

---

## 📊 Data Structure

### Transaction
```javascript
{
  id: "txn_1234567890",
  date: "2025-12-15",
  type: "expense",           // or "income"
  category: "Groceries",
  amount: 125.50,
  balance: 4500.00,          // Running balance
  description: "Weekly groceries"
}
```

### Budget
```javascript
{
  id: "bgt_1234567890",
  category: "Groceries",
  limit: 500.00,             // Monthly
  spent: 325.50,
  lastReset: "2025-12-01"
}
```

### Goal
```javascript
{
  id: "goal_1234567890",
  name: "Emergency Fund",
  target: 5000.00,
  current: 2150.00,
  targetDate: "2026-12-31",
  created: "2025-01-15"
}
```

### Loan
```javascript
{
  id: "loan_1234567890",
  loanType: "given",         // or "taken"
  personName: "John Doe",
  amount: 1000.00,
  remaining: 300.00,
  date: "2025-11-01",
  settled: false,
  payments: [                // Array of payments
    { id, date, amount }
  ]
}
```

---

## 🛠️ Project Architecture

### Core Modules
- **storage.js** - Data persistence layer
- **datasync.js** - Real-time synchronization
- **logger.js** - Production logging
- **thememanager.js** - Theme management

### Feature Modules
- **transactions.js** - Income/expense tracking
- **budget.js** - Budget management
- **goals.js** - Financial goals
- **loans.js** - Loan management
- **reports.js** - Analytics & reporting

### UI Modules
- **utils.js** - Helper functions
- **charts.js** - Data visualization
- **pages.js** - Professional pages
- **app.js** - Main orchestration

### Tools
- **backupmanager.js** - Backup/import/export
- **onboarding.js** - First-time setup
- **DataSyncIntegration.js** - Integration guide

See [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) for detailed documentation.

---

## ⚡ Performance

### Loading Speed
- First Load: ~2 seconds on 3G
- Subsequent Loads: <500ms (cached)
- Interactive Time: <1 second
- Offline: Instant

### Data Limits
- Storage Quota: ~5 MB per browser
- Typical Capacity: 10+ years of daily transactions
- Recommended: Archive/export after 5 years
- Performance: Optimized for 10,000+ transactions

### Optimizations
- CSS containment for paint optimization
- Lazy loading for assets
- Debounced syncing for rapid changes
- Efficient data structures
- Minimal dependencies

---

## 🔄 Synchronization

### Auto-Sync Every 5 Seconds
Most recent changes automatically sync across all modules.

### Real-Time Updates
- Add transaction → balance updates instantly
- Create budget → appears immediately
- Set goal → progresses sync
- Make loan payment → balance affected
- Export data → all modules included

### Manual Sync
```javascript
DataSync.syncAll()           // Force full sync
DataSync.syncTransaction()   // Sync one type
DataSync.batchSync(['...'])  // Batch operation
```

---

## 🎨 Customization

### Change Currency
Settings → Display Settings → Currency Select
- Supports 150+ currencies
- Visual only (amount stays same)
- Update all pages instantly

### Create Categories
Settings → Categories → Add Category
- Unlimited income categories
- Unlimited expense categories
- Reorder anytime
- Delete unused categories
- Changes apply to all transactions

### Adjust Theme
Settings → Theme & Appearance
- Auto (follows OS preference)
- Light (day mode)
- Dark (night mode)
- Reduce motion option for accessibility

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Data disappeared | Check if in private/incognito mode. Restore from JSON backup. |
| Storage full | Settings → Advanced → Optimize Storage. Export old data. |
| Not syncing between devices | Sync is per-device. Export backup and import on other device. |
| Theme not changing | Clear browser cache. Check browser language settings. |
| Charts not showing | Enable JavaScript. Update browser. Check console for errors. |
| Offline not working | App must be visited online first. Then works offline. |

### View Application Logs
Settings → Advanced → View Logs
- Last 50 log entries
- Shows all operations
- Helpful for debugging

---

## 📝 License

MIT License © 2026 FinTrack Pro

```
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
See LICENSE file for complete terms.
```

---

## 👨‍💼 About

**FinTrack Pro** is developed with ❤️ to give you complete control over your finances.

### Team
- **Name**: FinTrack Team
- **Email**: support@fintrackpro.com
- **Version**: 3.1.0
- **Build**: April 5, 2026
- **License**: MIT

### Technologies
- Pure JavaScript (No frameworks)
- Modern CSS (Grid, Flexbox, Variables)
- Web APIs (localStorage, Service Workers)
- PWA (Progressive Web App)
- Chart.js (Visualizations)

---

## 🤝 Contributing

We welcome contributions! Ways to help:

1. **Report Bugs** - Email issues with details
2. **Suggest Features** - Ideas for improvements
3. **Improve Docs** - Help us document better
4. **Share Feedback** - How can we improve UX?

Email: support@fintrackpro.com

---

## 📚 Resources

- **Help** - In-app Help & FAQ section
- **Privacy Policy** - Settings → Privacy Policy
- **Terms of Service** - Settings → Terms of Service
- **Contact** - Settings → Contact Us
- **About** - Settings → About Us

---

## 🚀 What's New in v3.1.0+

### Latest Updates
- ✨ Real-time DataSync across all modules
- ✨ Professional pages (About, Privacy, Terms, Help, Contact)
- ✨ Enhanced backup & import with validation
- ✨ Intelligent theme management
- ✨ Storage optimization tools
- ✨ Professional project structure documentation
- ✨ Comprehensive logging system
- ✨ Industry-grade code organization

### Coming Soon
- Cloud backup with encryption
- Multi-device sync
- Recurring transactions
- Receipt scanning
- Financial forecasting

---

## 📞 Support

**Email**: support@fintrackpro.com

**Response Time**: Usually within 48 hours

**Hours**: We monitor emails continuously

---

## 🎯 Roadmap

### Q2 2026
- Mobile app (iOS/Android)
- Dark mode refinements
- Performance optimizations

### Q3 2026
- Cloud sync option
- Multi-device support
- API for integrations

### Q4 2026
- AI-powered insights
- Automated categorization
- Advanced forecasting

---

## 🙏 Thank You!

Thank you for using FinTrack Pro. We hope it helps you take control of your finances and achieve your financial goals.

**Happy tracking!** 💪

---

**FinTrack Pro** — *Your Financial Data, Your Device, Your Control.*

[Visit App](https://fintrackpro.com) • [GitHub](https://github.com/farukislamyt/fintrack) • [Report Issue](mailto:support@fintrackpro.com)
