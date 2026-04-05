package com.farukislamyt.fintrack.ui.viewmodels

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.farukislamyt.fintrack.data.model.Loan
import com.farukislamyt.fintrack.data.model.LoanType
import com.farukislamyt.fintrack.data.repository.LoanRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class LoansViewModel @Inject constructor(
    private val loanRepository: LoanRepository
) : ViewModel() {

    val loans = loanRepository.getAllLoans()
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = emptyList()
        )

    val totalGiven = loanRepository.getTotalRemainingByType(LoanType.GIVEN)
        .map { it ?: 0.0 }
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = 0.0
        )

    val totalTaken = loanRepository.getTotalRemainingByType(LoanType.TAKEN)
        .map { it ?: 0.0 }
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = 0.0
        )

    fun addLoan(
        type: LoanType,
        personName: String,
        amount: Double,
        description: String = "",
        dueDate: java.util.Date? = null
    ) {
        viewModelScope.launch {
            val loan = Loan(
                type = type,
                personName = personName,
                amount = amount,
                remainingAmount = amount,
                description = description,
                dueDate = dueDate
            )
            loanRepository.insertLoan(loan)
        }
    }

    fun updateLoan(loan: Loan) {
        viewModelScope.launch {
            loanRepository.updateLoan(loan)
        }
    }

    fun deleteLoan(loan: Loan) {
        viewModelScope.launch {
            loanRepository.deleteLoan(loan)
        }
    }

    fun makePayment(loan: Loan, paymentAmount: Double) {
        viewModelScope.launch {
            val newRemaining = (loan.remainingAmount - paymentAmount).coerceAtLeast(0.0)
            val updatedLoan = loan.copy(remainingAmount = newRemaining)
            loanRepository.updateLoan(updatedLoan)
        }
    }
}