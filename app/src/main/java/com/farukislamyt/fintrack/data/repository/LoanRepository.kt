package com.farukislamyt.fintrack.data.repository

import com.farukislamyt.fintrack.data.database.LoanDao
import com.farukislamyt.fintrack.data.model.Loan
import com.farukislamyt.fintrack.data.model.LoanType
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class LoanRepository @Inject constructor(
    private val loanDao: LoanDao
) {
    fun getAllLoans(): Flow<List<Loan>> = loanDao.getAllLoans()

    fun getLoansByType(type: LoanType): Flow<List<Loan>> = loanDao.getLoansByType(type)

    fun getTotalRemainingByType(type: LoanType): Flow<Double?> =
        loanDao.getTotalRemainingByType(type)

    suspend fun insertLoan(loan: Loan): Long = loanDao.insertLoan(loan)

    suspend fun updateLoan(loan: Loan) = loanDao.updateLoan(loan)

    suspend fun deleteLoan(loan: Loan) = loanDao.deleteLoan(loan)

    suspend fun deleteLoanById(id: Long) = loanDao.deleteLoanById(id)
}