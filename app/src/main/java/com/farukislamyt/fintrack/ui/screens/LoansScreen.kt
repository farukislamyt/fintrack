package com.farukislamyt.fintrack.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.farukislamyt.fintrack.data.model.Loan
import com.farukislamyt.fintrack.data.model.LoanType
import com.farukislamyt.fintrack.ui.viewmodels.LoansViewModel
import java.text.NumberFormat
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LoansScreen(
    viewModel: LoansViewModel = hiltViewModel(),
    onAddLoan: () -> Unit = {}
) {
    val loans by viewModel.loans.collectAsState(initial = emptyList())
    val totalGiven by viewModel.totalGiven.collectAsState(initial = 0.0)
    val totalTaken by viewModel.totalTaken.collectAsState(initial = 0.0)

    val currencyFormatter = NumberFormat.getCurrencyInstance(Locale.getDefault()).apply {
        currency = Currency.getInstance("USD")
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Loans") },
                actions = {
                    IconButton(onClick = onAddLoan) {
                        Icon(Icons.Default.Add, contentDescription = "Add Loan")
                    }
                }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
        ) {
            // Summary Cards
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Card(
                    modifier = Modifier.weight(1f),
                    colors = CardDefaults.cardColors(
                        containerColor = Color(0xFFFFEBEE)
                    )
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text("Given", style = MaterialTheme.typography.bodyMedium)
                        Text(
                            currencyFormatter.format(totalGiven),
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFFF44336)
                        )
                    }
                }

                Card(
                    modifier = Modifier.weight(1f),
                    colors = CardDefaults.cardColors(
                        containerColor = Color(0xFFE8F5E8)
                    )
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text("Taken", style = MaterialTheme.typography.bodyMedium)
                        Text(
                            currencyFormatter.format(totalTaken),
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFF4CAF50)
                        )
                    }
                }
            }

            // Loans List
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(loans) { loan ->
                    LoanItem(
                        loan = loan,
                        currencyFormatter = currencyFormatter,
                        onEdit = { /* TODO: Implement edit */ },
                        onDelete = { viewModel.deleteLoan(loan) }
                    )
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LoanItem(
    loan: Loan,
    currencyFormatter: NumberFormat,
    onEdit: () -> Unit,
    onDelete: () -> Unit
) {
    val progress = if (loan.amount > 0) ((loan.amount - loan.remainingAmount) / loan.amount).toFloat() else 0f
    val isFullyPaid = loan.remainingAmount <= 0

    Card(
        modifier = Modifier.fillMaxWidth(),
        onClick = onEdit
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = loan.personName,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Medium
                    )
                    Text(
                        text = if (loan.type == LoanType.GIVEN) "Given to" else "Taken from",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

                Text(
                    text = if (isFullyPaid) "✓ Paid" else "${(progress * 100).toInt()}%",
                    style = MaterialTheme.typography.bodySmall,
                    color = if (isFullyPaid) Color(0xFF4CAF50) else MaterialTheme.colorScheme.primary,
                    fontWeight = FontWeight.Medium
                )
            }

            if (loan.description.isNotBlank()) {
                Text(
                    text = loan.description,
                    style = MaterialTheme.typography.bodyMedium,
                    modifier = Modifier.padding(vertical = 4.dp)
                )
            }

            if (!isFullyPaid) {
                LinearProgressIndicator(
                    progress = progress.coerceIn(0f, 1f),
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 8.dp)
                )
            }

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = "Remaining: ${currencyFormatter.format(loan.remainingAmount)}",
                    style = MaterialTheme.typography.bodyMedium,
                    color = if (isFullyPaid) Color(0xFF4CAF50) else MaterialTheme.colorScheme.onSurface
                )

                Text(
                    text = "Total: ${currencyFormatter.format(loan.amount)}",
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = FontWeight.Medium
                )
            }
        }
    }
}