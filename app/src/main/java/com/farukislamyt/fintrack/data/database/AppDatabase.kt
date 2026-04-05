package com.farukislamyt.fintrack.data.database

import androidx.room.Database
import androidx.room.RoomDatabase
import androidx.room.TypeConverters
import com.farukislamyt.fintrack.data.model.Budget
import com.farukislamyt.fintrack.data.model.Goal
import com.farukislamyt.fintrack.data.model.Loan
import com.farukislamyt.fintrack.data.model.Transaction

@Database(
    entities = [Transaction::class, Budget::class, Goal::class, Loan::class],
    version = 1,
    exportSchema = false
)
@TypeConverters(Converters::class)
abstract class AppDatabase : RoomDatabase() {
    abstract fun transactionDao(): TransactionDao
    abstract fun budgetDao(): BudgetDao
    abstract fun goalDao(): GoalDao
    abstract fun loanDao(): LoanDao
}