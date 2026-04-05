package com.farukislamyt.fintrack.ui.viewmodels

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.farukislamyt.fintrack.data.model.TransactionType
import com.farukislamyt.fintrack.data.repository.TransactionRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.util.*
import javax.inject.Inject

@HiltViewModel
class ReportsViewModel @Inject constructor(
    private val transactionRepository: TransactionRepository
) : ViewModel() {

    val totalIncome = transactionRepository.getTotalByType(TransactionType.INCOME)
        .map { it ?: 0.0 }
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = 0.0
        )

    val totalExpenses = transactionRepository.getTotalByType(TransactionType.EXPENSE)
        .map { it ?: 0.0 }
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = 0.0
        )

    // Category spending breakdown
    val categorySpending = transactionRepository.getAllTransactions()
        .map { transactions ->
            transactions
                .filter { it.type == TransactionType.EXPENSE }
                .groupBy { it.category }
                .mapValues { (_, txns) -> txns.sumOf { it.amount } }
                .filterValues { it > 0 }
        }
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = emptyMap<String, Double>()
        )

    // Monthly trends (last 6 months)
    val monthlyTrends = flow {
        val calendar = Calendar.getInstance()
        val trends = mutableMapOf<String, Pair<Double, Double>>()

        // Get data for last 6 months
        for (i in 0..5) {
            val month = calendar.get(Calendar.MONTH) + 1
            val year = calendar.get(Calendar.YEAR)
            val yearMonth = String.format("%04d-%02d", year, month)

            val income = transactionRepository.getTotalByTypeAndMonth(TransactionType.INCOME, yearMonth).firstOrNull() ?: 0.0
            val expenses = transactionRepository.getTotalByTypeAndMonth(TransactionType.EXPENSE, yearMonth).firstOrNull() ?: 0.0

            val monthKey = String.format("%02d/%04d", month, year)
            trends[monthKey] = Pair(income, expenses)

            calendar.add(Calendar.MONTH, -1)
        }

        emit(trends.toSortedMap(compareByDescending { it }))
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = emptyMap<String, Pair<Double, Double>>()
    )
}