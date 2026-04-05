package com.farukislamyt.fintrack.data.repository

import com.farukislamyt.fintrack.data.database.BudgetDao
import com.farukislamyt.fintrack.data.model.Budget
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class BudgetRepository @Inject constructor(
    private val budgetDao: BudgetDao
) {
    fun getBudgetsForMonth(month: Int, year: Int): Flow<List<Budget>> =
        budgetDao.getBudgetsForMonth(month, year)

    fun getBudgetByCategory(category: String, month: Int, year: Int): Flow<Budget?> =
        budgetDao.getBudgetByCategory(category, month, year)

    suspend fun insertBudget(budget: Budget): Long = budgetDao.insertBudget(budget)

    suspend fun updateBudget(budget: Budget) = budgetDao.updateBudget(budget)

    suspend fun deleteBudget(budget: Budget) = budgetDao.deleteBudget(budget)

    suspend fun deleteBudgetById(id: Long) = budgetDao.deleteBudgetById(id)
}