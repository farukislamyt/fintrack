package com.farukislamyt.fintrack.data.model

data class AppSettings(
    val userName: String = "",
    val currency: String = "USD",
    val dateFormat: String = "MM/DD/YYYY",
    val savingsTarget: Int = 20,
    val incomeCategories: List<String> = listOf(
        "Salary", "Freelance", "Business", "Investment", "Rental", "Gift", "Other Income"
    ),
    val expenseCategories: List<String> = listOf(
        "Food & Dining", "Transportation", "Shopping", "Housing", "Utilities",
        "Healthcare", "Entertainment", "Education", "Personal Care", "Travel",
        "Insurance", "Savings", "Other Expense"
    )
)