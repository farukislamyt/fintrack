package com.farukislamyt.fintrack.data.database

import androidx.room.Dao
import androidx.room.Delete
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.farukislamyt.fintrack.data.model.Loan
import com.farukislamyt.fintrack.data.model.LoanType
import kotlinx.coroutines.flow.Flow

@Dao
interface LoanDao {
    @Query("SELECT * FROM loans ORDER BY createdAt DESC")
    fun getAllLoans(): Flow<List<Loan>>

    @Query("SELECT * FROM loans WHERE type = :type ORDER BY createdAt DESC")
    fun getLoansByType(type: LoanType): Flow<List<Loan>>

    @Query("SELECT SUM(remainingAmount) FROM loans WHERE type = :type")
    fun getTotalRemainingByType(type: LoanType): Flow<Double?>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertLoan(loan: Loan): Long

    @Update
    suspend fun updateLoan(loan: Loan)

    @Delete
    suspend fun deleteLoan(loan: Loan)

    @Query("DELETE FROM loans WHERE id = :id")
    suspend fun deleteLoanById(id: Long)
}