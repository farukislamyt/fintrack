package com.farukislamyt.fintrack.data.repository

import com.farukislamyt.fintrack.data.database.TransactionDao
import com.farukislamyt.fintrack.data.model.Transaction
import com.farukislamyt.fintrack.data.model.TransactionType
import kotlinx.coroutines.flow.Flow
import java.util.Date
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class TransactionRepository @Inject constructor(
    private val transactionDao: TransactionDao
) {
    fun getAllTransactions(): Flow<List<Transaction>> = transactionDao.getAllTransactions()

    fun getTransactionsByType(type: TransactionType): Flow<List<Transaction>> =
        transactionDao.getTransactionsByType(type)

    fun getTransactionsBetweenDates(startDate: Date, endDate: Date): Flow<List<Transaction>> =
        transactionDao.getTransactionsBetweenDates(startDate, endDate)

    fun getTotalByType(type: TransactionType): Flow<Double?> = transactionDao.getTotalByType(type)

    fun getTotalByTypeAndMonth(type: TransactionType, yearMonth: String): Flow<Double?> =
        transactionDao.getTotalByTypeAndMonth(type, yearMonth)

    suspend fun insertTransaction(transaction: Transaction): Long =
        transactionDao.insertTransaction(transaction)

    suspend fun updateTransaction(transaction: Transaction) =
        transactionDao.updateTransaction(transaction)

    suspend fun deleteTransaction(transaction: Transaction) =
        transactionDao.deleteTransaction(transaction)

    suspend fun deleteTransactionById(id: Long) =
        transactionDao.deleteTransactionById(id)
}