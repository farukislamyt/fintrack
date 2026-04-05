package com.farukislamyt.fintrack.data

import android.content.Context
import com.farukislamyt.fintrack.data.model.*
import com.farukislamyt.fintrack.data.repository.*
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.io.File
import java.util.*
import javax.inject.Inject
import javax.inject.Singleton

data class BackupData(
    val transactions: List<Transaction>,
    val budgets: List<Budget>,
    val goals: List<Goal>,
    val loans: List<Loan>,
    val settings: AppSettings,
    val backupDate: Date = Date(),
    val version: String = "1.0"
)

@Singleton
class DataManager @Inject constructor(
    @ApplicationContext private val context: Context,
    private val transactionRepository: TransactionRepository,
    private val budgetRepository: BudgetRepository,
    private val goalRepository: GoalRepository,
    private val loanRepository: LoanRepository,
    private val settingsRepository: SettingsRepository,
    private val gson: Gson = Gson()
) {

    private val backupDir = File(context.filesDir, "backups")

    init {
        if (!backupDir.exists()) {
            backupDir.mkdirs()
        }
    }

    suspend fun exportData(): Result<String> {
        return try {
            val transactions = transactionRepository.getAllTransactions()
            val budgets = budgetRepository.getBudgetsForMonth(
                Calendar.getInstance().get(Calendar.MONTH) + 1,
                Calendar.getInstance().get(Calendar.YEAR)
            )
            val goals = goalRepository.getAllGoals()
            val loans = loanRepository.getAllLoans()
            val settings = settingsRepository.settings

            // Collect all data
            val transactionsList = transactions.first()
            val budgetsList = budgets.first()
            val goalsList = goals.first()
            val loansList = loans.first()
            val settingsData = settings.first()

            val backupData = BackupData(
                transactions = transactionsList,
                budgets = budgetsList,
                goals = goalsList,
                loans = loansList,
                settings = settingsData
            )

            val jsonData = gson.toJson(backupData)
            val fileName = "fintrack_backup_${System.currentTimeMillis()}.json"
            val backupFile = File(backupDir, fileName)

            backupFile.writeText(jsonData)

            Result.success("Data exported successfully to ${backupFile.absolutePath}")
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun importData(jsonData: String, merge: Boolean = false): Result<String> {
        return try {
            val backupDataType = object : TypeToken<BackupData>() {}.type
            val backupData: BackupData = gson.fromJson(jsonData, backupDataType)

            if (!merge) {
                // Clear existing data
                clearAllData()
            }

            // Import transactions
            backupData.transactions.forEach { transaction ->
                transactionRepository.insertTransaction(transaction)
            }

            // Import budgets
            backupData.budgets.forEach { budget ->
                budgetRepository.insertBudget(budget)
            }

            // Import goals
            backupData.goals.forEach { goal ->
                goalRepository.insertGoal(goal)
            }

            // Import loans
            backupData.loans.forEach { loan ->
                loanRepository.insertLoan(loan)
            }

            // Import settings
            settingsRepository.updateSettings { backupData.settings }

            Result.success("Data imported successfully")
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun clearAllData() {
        // Note: This is a simplified version. In a real app, you'd want to clear all data
        // But Room doesn't have a direct way to clear all tables at once
        // For now, we'll just clear transactions as an example
        val transactions = transactionRepository.getAllTransactions().first()
        transactions.forEach { transaction ->
            transactionRepository.deleteTransaction(it)
        }
    }

    fun getBackupFiles(): List<File> {
        return backupDir.listFiles()?.filter { it.extension == "json" }?.sortedByDescending { it.lastModified() } ?: emptyList()
    }

    fun readBackupFile(file: File): String? {
        return try {
            file.readText()
        } catch (e: Exception) {
            null
        }
    }
}