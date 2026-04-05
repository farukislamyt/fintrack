package com.farukislamyt.fintrack.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey
import java.util.Date

@Entity(tableName = "loans")
data class Loan(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val type: LoanType,
    val personName: String,
    val amount: Double,
    val remainingAmount: Double,
    val description: String = "",
    val createdAt: Date = Date(),
    val dueDate: Date? = null
)

enum class LoanType {
    GIVEN, TAKEN
}