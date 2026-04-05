package com.farukislamyt.fintrack.data

import com.farukislamyt.fintrack.data.model.*
import com.farukislamyt.fintrack.data.repository.*
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.util.*
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class DataSeeder @Inject constructor(
    private val transactionRepository: TransactionRepository,
    private val budgetRepository: BudgetRepository,
    private val goalRepository: GoalRepository,
    private val loanRepository: LoanRepository
) {

    fun seedSampleData() {
        CoroutineScope(Dispatchers.IO).launch {
            // Only seed if no data exists
            val existingTransactions = transactionRepository.getAllTransactions()
            existingTransactions.collect { transactions ->
                if (transactions.isEmpty()) {
                    seedTransactions()
                    seedBudgets()
                    seedGoals()
                    seedLoans()
                }
            }
        }
    }

    private suspend fun seedTransactions() {
        val calendar = Calendar.getInstance()

        // Sample income transactions
        val incomes = listOf(
            Transaction(type = TransactionType.INCOME, amount = 3500.0, category = "Salary", description = "Monthly Salary", date = calendar.time),
            Transaction(type = TransactionType.INCOME, amount = 500.0, category = "Freelance", description = "Web Development Project", date = calendar.apply { add(Calendar.DAY_OF_MONTH, -5) }.time),
            Transaction(type = TransactionType.INCOME, amount = 200.0, category = "Investment", description = "Stock Dividends", date = calendar.apply { add(Calendar.DAY_OF_MONTH, -10) }.time)
        )

        // Sample expense transactions
        calendar.time = Date() // Reset to today
        val expenses = listOf(
            Transaction(type = TransactionType.EXPENSE, amount = 85.50, category = "Food & Dining", description = "Grocery Shopping", date = calendar.apply { add(Calendar.DAY_OF_MONTH, -1) }.time),
            Transaction(type = TransactionType.EXPENSE, amount = 45.00, category = "Transportation", description = "Gas Station", date = calendar.apply { add(Calendar.DAY_OF_MONTH, -2) }.time),
            Transaction(type = TransactionType.EXPENSE, amount = 1200.00, category = "Housing", description = "Monthly Rent", date = calendar.apply { add(Calendar.DAY_OF_MONTH, -3) }.time),
            Transaction(type = TransactionType.EXPENSE, amount = 150.00, category = "Utilities", description = "Electricity Bill", date = calendar.apply { add(Calendar.DAY_OF_MONTH, -7) }.time),
            Transaction(type = TransactionType.EXPENSE, amount = 75.00, category = "Entertainment", description = "Movie Tickets", date = calendar.apply { add(Calendar.DAY_OF_MONTH, -4) }.time),
            Transaction(type = TransactionType.EXPENSE, amount = 200.00, category = "Shopping", description = "New Clothes", date = calendar.apply { add(Calendar.DAY_OF_MONTH, -6) }.time)
        )

        (incomes + expenses).forEach { transaction ->
            transactionRepository.insertTransaction(transaction)
        }
    }

    private suspend fun seedBudgets() {
        val currentMonth = Calendar.getInstance().get(Calendar.MONTH) + 1
        val currentYear = Calendar.getInstance().get(Calendar.YEAR)

        val budgets = listOf(
            Budget(category = "Food & Dining", amount = 600.0, month = currentMonth, year = currentYear),
            Budget(category = "Transportation", amount = 300.0, month = currentMonth, year = currentYear),
            Budget(category = "Entertainment", amount = 200.0, month = currentMonth, year = currentYear),
            Budget(category = "Shopping", amount = 400.0, month = currentMonth, year = currentYear),
            Budget(category = "Utilities", amount = 250.0, month = currentMonth, year = currentYear)
        )

        budgets.forEach { budget ->
            budgetRepository.insertBudget(budget)
        }
    }

    private suspend fun seedGoals() {
        val calendar = Calendar.getInstance()
        calendar.add(Calendar.YEAR, 1) // One year from now

        val goals = listOf(
            Goal(
                name = "Emergency Fund",
                targetAmount = 10000.0,
                currentAmount = 2500.0,
                deadline = calendar.time
            ),
            Goal(
                name = "Vacation to Europe",
                targetAmount = 5000.0,
                currentAmount = 1200.0,
                deadline = calendar.apply { add(Calendar.MONTH, 6) }.time
            ),
            Goal(
                name = "New Laptop",
                targetAmount = 2000.0,
                currentAmount = 800.0
            )
        )

        goals.forEach { goal ->
            goalRepository.insertGoal(goal)
        }
    }

    private suspend fun seedLoans() {
        val loans = listOf(
            Loan(
                type = LoanType.GIVEN,
                personName = "John Smith",
                amount = 5000.0,
                remainingAmount = 3000.0,
                description = "Personal loan for home renovation"
            ),
            Loan(
                type = LoanType.TAKEN,
                personName = "ABC Bank",
                amount = 15000.0,
                remainingAmount = 12000.0,
                description = "Car loan"
            )
        )

        loans.forEach { loan ->
            loanRepository.insertLoan(loan)
        }
    }
}