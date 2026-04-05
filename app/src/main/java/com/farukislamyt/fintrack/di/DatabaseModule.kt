package com.farukislamyt.fintrack.di

import android.content.Context
import androidx.room.Room
import com.farukislamyt.fintrack.data.database.AppDatabase
import com.farukislamyt.fintrack.data.database.BudgetDao
import com.farukislamyt.fintrack.data.database.GoalDao
import com.farukislamyt.fintrack.data.database.LoanDao
import com.farukislamyt.fintrack.data.database.TransactionDao
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object DatabaseModule {

    @Provides
    @Singleton
    fun provideAppDatabase(@ApplicationContext context: Context): AppDatabase {
        return Room.databaseBuilder(
            context,
            AppDatabase::class.java,
            "fintrack_database"
        ).build()
    }

    @Provides
    fun provideTransactionDao(database: AppDatabase): TransactionDao {
        return database.transactionDao()
    }

    @Provides
    fun provideBudgetDao(database: AppDatabase): BudgetDao {
        return database.budgetDao()
    }

    @Provides
    fun provideGoalDao(database: AppDatabase): GoalDao {
        return database.goalDao()
    }

    @Provides
    fun provideLoanDao(database: AppDatabase): LoanDao {
        return database.loanDao()
    }
}