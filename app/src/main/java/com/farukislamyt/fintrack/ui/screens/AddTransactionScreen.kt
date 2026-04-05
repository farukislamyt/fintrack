package com.farukislamyt.fintrack.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.farukislamyt.fintrack.data.model.TransactionType
import com.farukislamyt.fintrack.ui.viewmodels.TransactionsViewModel
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddTransactionScreen(
    viewModel: TransactionsViewModel = hiltViewModel(),
    onTransactionAdded: () -> Unit = {},
    onCancel: () -> Unit = {}
) {
    var selectedType by remember { mutableStateOf(TransactionType.EXPENSE) }
    var amount by remember { mutableStateOf("") }
    var category by remember { mutableStateOf("") }
    var description by remember { mutableStateOf("") }
    var selectedDate by remember { mutableStateOf(Date()) }
    var showDatePicker by remember { mutableStateOf(false) }

    val transactionTypes = listOf("Income", "Expense")
    val defaultCategories = if (selectedType == TransactionType.INCOME) {
        listOf("Salary", "Freelance", "Business", "Investment", "Rental", "Gift", "Other Income")
    } else {
        listOf("Food & Dining", "Transportation", "Shopping", "Housing", "Utilities", "Healthcare", "Entertainment", "Education", "Personal Care", "Travel", "Insurance", "Savings", "Other Expense")
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text(
            text = "Add Transaction",
            style = MaterialTheme.typography.headlineMedium
        )

        // Transaction Type
        Text("Type", style = MaterialTheme.typography.titleMedium)
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            transactionTypes.forEach { type ->
                val isSelected = (type == "Income" && selectedType == TransactionType.INCOME) ||
                               (type == "Expense" && selectedType == TransactionType.EXPENSE)

                OutlinedButton(
                    onClick = {
                        selectedType = if (type == "Income") TransactionType.INCOME else TransactionType.EXPENSE
                        category = "" // Reset category when type changes
                    },
                    modifier = Modifier.weight(1f),
                    colors = ButtonDefaults.outlinedButtonColors(
                        containerColor = if (isSelected) {
                            if (selectedType == TransactionType.INCOME) Color(0xFFE8F5E8) else Color(0xFFFFEBEE)
                        } else MaterialTheme.colorScheme.surface
                    )
                ) {
                    Text(type)
                }
            }
        }

        // Amount
        OutlinedTextField(
            value = amount,
            onValueChange = { amount = it },
            label = { Text("Amount") },
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
            modifier = Modifier.fillMaxWidth()
        )

        // Category
        ExposedDropdownMenuBox(
            expanded = false, // TODO: Implement dropdown
            onExpandedChange = { }
        ) {
            OutlinedTextField(
                value = category,
                onValueChange = { category = it },
                label = { Text("Category") },
                modifier = Modifier
                    .fillMaxWidth()
                    .menuAnchor()
            )
            ExposedDropdownMenu(
                expanded = false,
                onDismissRequest = { }
            ) {
                defaultCategories.forEach { cat ->
                    DropdownMenuItem(
                        text = { Text(cat) },
                        onClick = { category = cat }
                    )
                }
            }
        }

        // Description
        OutlinedTextField(
            value = description,
            onValueChange = { description = it },
            label = { Text("Description") },
            modifier = Modifier.fillMaxWidth()
        )

        // Date
        OutlinedButton(
            onClick = { showDatePicker = true },
            modifier = Modifier.fillMaxWidth()
        ) {
            Text("Date: ${java.text.SimpleDateFormat("MMM dd, yyyy", Locale.getDefault()).format(selectedDate)}")
        }

        Spacer(modifier = Modifier.weight(1f))

        // Buttons
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            OutlinedButton(
                onClick = onCancel,
                modifier = Modifier.weight(1f)
            ) {
                Text("Cancel")
            }

            Button(
                onClick = {
                    val amountValue = amount.toDoubleOrNull()
                    if (amountValue != null && category.isNotBlank() && description.isNotBlank()) {
                        viewModel.addTransaction(
                            type = selectedType,
                            amount = amountValue,
                            category = category,
                            description = description,
                            date = selectedDate
                        )
                        onTransactionAdded()
                    }
                },
                modifier = Modifier.weight(1f),
                enabled = amount.isNotBlank() && category.isNotBlank() && description.isNotBlank()
            ) {
                Text("Save")
            }
        }
    }

    if (showDatePicker) {
        // TODO: Implement date picker
        showDatePicker = false
    }
}