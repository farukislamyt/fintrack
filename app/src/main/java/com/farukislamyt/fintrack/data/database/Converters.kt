package com.farukislamyt.fintrack.data.database

import androidx.room.TypeConverter
import com.farukislamyt.fintrack.data.model.LoanType
import com.farukislamyt.fintrack.data.model.TransactionType
import java.util.Date

class Converters {
    @TypeConverter
    fun fromTimestamp(value: Long?): Date? {
        return value?.let { Date(it) }
    }

    @TypeConverter
    fun dateToTimestamp(date: Date?): Long? {
        return date?.time
    }

    @TypeConverter
    fun fromTransactionType(value: String?): TransactionType? {
        return value?.let { TransactionType.valueOf(it) }
    }

    @TypeConverter
    fun transactionTypeToString(type: TransactionType?): String? {
        return type?.name
    }

    @TypeConverter
    fun fromLoanType(value: String?): LoanType? {
        return value?.let { LoanType.valueOf(it) }
    }

    @TypeConverter
    fun loanTypeToString(type: LoanType?): String? {
        return type?.name
    }
}