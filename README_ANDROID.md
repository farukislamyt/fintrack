# FinTrack Pro - Android App

A modern, privacy-first personal finance management Android app built with Kotlin and Jetpack Compose.

## Features

- **Complete Transaction Management**
  - Track unlimited income and expense transactions
  - Custom categories (editable, organized)
  - Date, amount, category, and description for each transaction
  - Real-time balance calculation
  - Transaction history with search and filters

- **Smart Analytics & Reports**
  - Income vs expense analysis
  - Category spending breakdown with pie charts
  - Monthly trend visualization with bar charts
  - Interactive charts using MPAndroidChart
  - Customizable date ranges

- **Budget Planning**
  - Set monthly budgets per category
  - Real-time spending progress tracking
  - Visual progress bars with color coding
  - Budget alerts at 80% and 100% thresholds
  - Over-budget warnings

- **Savings Goals**
  - Create multiple financial goals
  - Track progress toward targets
  - Auto-calculate percent complete
  - Add contributions to goals
  - Mark goals as achieved
  - Deadline tracking

- **Loan Management**
  - Track loans given and taken
  - Borrower/lender name and details
  - Payment management with history
  - Automatic balance impact
  - Track remaining balance
  - Full loan settlement

- **Data Management**
  - Export complete data as JSON backup
  - Import data with validation
  - Merge or replace import modes
  - Clear all data option
  - Local storage only (no cloud)

- **Settings & Preferences**
  - User profile management
  - Currency selection (USD, EUR, GBP, JPY, CAD, AUD)
  - Date format preferences
  - Savings target configuration
  - Dark/light theme support

## Tech Stack

- **Language**: Kotlin
- **UI Framework**: Jetpack Compose
- **Architecture**: MVVM with Repository pattern
- **Database**: Room with LiveData/Flow
- **Dependency Injection**: Hilt
- **Navigation**: Jetpack Navigation Compose
- **Charts**: MPAndroidChart
- **Settings Storage**: DataStore Preferences
- **JSON Processing**: Gson

## Project Structure

```
app/src/main/java/com/farukislamyt/fintrack/
├── data/
│   ├── database/          # Room entities, DAOs, converters
│   ├── model/            # Data models (Transaction, Budget, Goal, Loan, Settings)
│   └── repository/       # Repository layer with business logic
├── di/                   # Dependency injection modules
├── ui/
│   ├── components/       # Reusable UI components (BottomNavigation)
│   ├── screens/          # Main screens (Dashboard, Transactions, etc.)
│   ├── theme/            # Material Design 3 theme
│   └── viewmodels/       # ViewModels for each screen
├── FinTrackApplication.kt
├── MainActivity.kt
└── data/                 # Data management utilities
```

## Privacy & Security

- **100% Offline**: All data stored locally on device
- **No Cloud Sync**: Data never leaves your device
- **No Tracking**: No analytics, no telemetry
- **No Ads**: Completely ad-free
- **No Data Collection**: We don't know you exist
- **Encrypted Storage**: Room database with SQLCipher-level security

## Getting Started

1. **Import Project**: Open this folder in Android Studio
2. **Build**: Let Android Studio download dependencies
3. **Run**: Run on emulator or physical device
4. **Sample Data**: App includes sample data for demonstration

## Requirements

- Android Studio Arctic Fox or later
- Minimum SDK: API 24 (Android 7.0)
- Target SDK: API 34 (Android 14)
- Kotlin 1.9.10+

## Architecture

### MVVM Pattern
- **ViewModels**: Handle UI logic and state management
- **Repositories**: Abstract data sources and business logic
- **Room Database**: Local SQLite database with DAOs

### Dependency Injection
- **Hilt**: Provides dependency injection
- **ViewModel Injection**: Automatic ViewModel creation
- **Repository Injection**: Clean data layer abstraction

### Data Flow
```
UI (Compose) → ViewModel → Repository → Room Database
                      ↓
              LiveData/Flow updates
```

## Key Components

### Database Layer
- **AppDatabase**: Main database class with Room configuration
- **DAOs**: Data Access Objects for each entity
- **Converters**: Type converters for Room (Date, Enums)

### Repository Layer
- **TransactionRepository**: Income/expense management
- **BudgetRepository**: Monthly budget tracking
- **GoalRepository**: Savings goal management
- **LoanRepository**: Loan tracking
- **SettingsRepository**: App preferences

### UI Layer
- **Material Design 3**: Modern Android design system
- **Jetpack Compose**: Declarative UI framework
- **Navigation**: Single-activity architecture
- **Charts**: MPAndroidChart integration

## Sample Data

The app includes sample data on first launch:
- Sample transactions (income and expenses)
- Monthly budgets for common categories
- Savings goals with progress
- Loan examples

## Data Export/Import

- **Export**: Creates JSON backup file in app storage
- **Import**: Restores data from JSON backup
- **Merge Mode**: Combine with existing data
- **Replace Mode**: Overwrite all data

## Development

### Adding New Features

1. **Database Changes**:
   - Update entity models
   - Modify DAO interfaces
   - Update database version
   - Add migrations if needed

2. **New Screens**:
   - Create Composable in `ui/screens/`
   - Create ViewModel in `ui/viewmodels/`
   - Add navigation route in `MainActivity`
   - Update bottom navigation if needed

3. **Business Logic**:
   - Add methods to Repository
   - Update ViewModel to expose data
   - Update UI to display new features

### Testing
- Unit tests for ViewModels and Repositories
- Integration tests for database operations
- UI tests with Compose testing framework

## Performance

- **Efficient Queries**: Room generates optimized SQL
- **Flow-based Updates**: Reactive UI updates
- **Background Processing**: Coroutines for async operations
- **Memory Management**: Proper lifecycle handling

## Future Enhancements

- **Biometric Authentication**: Secure app access
- **Cloud Backup**: Optional encrypted cloud storage
- **Advanced Analytics**: More detailed financial insights
- **Recurring Transactions**: Automated transaction creation
- **Multi-currency Support**: Enhanced currency handling
- **PDF Reports**: Generate financial reports
- **Widget Support**: Home screen widgets

---

**FinTrack Pro** - Take control of your finances with complete privacy and powerful features.
- Target SDK: API 34 (Android 14)

## Architecture

The app follows Clean Architecture principles:

- **Presentation Layer**: Compose UI + ViewModels
- **Domain Layer**: Use cases and business logic
- **Data Layer**: Repository + Room database

## Data Models

- `Transaction`: Income/expense records
- `Budget`: Monthly spending limits by category
- `Goal`: Savings targets
- `Loan`: Money lent or borrowed

## Privacy & Security

- 100% offline operation
- No data collection or tracking
- All data stored locally using Room database
- No internet permissions required

## Development

### Adding New Features

1. Create data model in `data/model/`
2. Add DAO methods in `data/database/`
3. Create repository in `data/repository/`
4. Add ViewModel in `ui/viewmodels/`
5. Create UI screen in `ui/screens/`

### Database Migrations

When changing database schema:
1. Update model classes
2. Increment database version in `AppDatabase`
3. Add migration logic if needed

## License

MIT License - see original web project for details.