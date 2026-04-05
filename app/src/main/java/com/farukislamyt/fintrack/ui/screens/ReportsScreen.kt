package com.farukislamyt.fintrack.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.hilt.navigation.compose.hiltViewModel
import com.farukislamyt.fintrack.ui.viewmodels.ReportsViewModel
import com.github.mikephil.charting.charts.PieChart
import com.github.mikephil.charting.charts.BarChart
import com.github.mikephil.charting.components.Legend
import com.github.mikephil.charting.data.*
import com.github.mikephil.charting.formatter.PercentFormatter
import com.github.mikephil.charting.utils.ColorTemplate
import java.text.NumberFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ReportsScreen(
    viewModel: ReportsViewModel = hiltViewModel()
) {
    val categorySpending by viewModel.categorySpending.collectAsState(initial = emptyMap())
    val monthlyTrends by viewModel.monthlyTrends.collectAsState(initial = emptyMap())
    val totalIncome by viewModel.totalIncome.collectAsState(initial = 0.0)
    val totalExpenses by viewModel.totalExpenses.collectAsState(initial = 0.0)

    val currencyFormatter = NumberFormat.getCurrencyInstance(Locale.getDefault()).apply {
        currency = Currency.getInstance("USD")
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Reports & Analytics") }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Summary Cards
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
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
                        Text("Total Income", style = MaterialTheme.typography.bodyMedium)
                        Text(
                            currencyFormatter.format(totalIncome),
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFF4CAF50)
                        )
                    }
                }

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
                        Text("Total Expenses", style = MaterialTheme.typography.bodyMedium)
                        Text(
                            currencyFormatter.format(totalExpenses),
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFFF44336)
                        )
                    }
                }
            }

            // Category Spending Pie Chart
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp)
                    .height(300.dp)
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(16.dp)
                ) {
                    Text(
                        "Spending by Category",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Medium
                    )

                    Spacer(modifier = Modifier.height(16.dp))

                    AndroidView(
                        factory = { context ->
                            PieChart(context).apply {
                                description.isEnabled = false
                                setUsePercentValues(true)
                                legend.isEnabled = true
                                legend.verticalAlignment = Legend.LegendVerticalAlignment.BOTTOM
                                legend.horizontalAlignment = Legend.LegendHorizontalAlignment.CENTER
                                legend.orientation = Legend.LegendOrientation.HORIZONTAL
                                legend.setDrawInside(false)
                                setEntryLabelColor(android.graphics.Color.BLACK)
                                setEntryLabelTextSize(12f)
                            }
                        },
                        update = { chart ->
                            val entries = categorySpending.map { (category, amount) ->
                                PieEntry(amount.toFloat(), category)
                            }

                            val dataSet = PieDataSet(entries, "").apply {
                                colors = ColorTemplate.MATERIAL_COLORS.toList()
                                valueFormatter = PercentFormatter(chart)
                                valueTextSize = 12f
                                valueTextColor = android.graphics.Color.WHITE
                            }

                            chart.data = PieData(dataSet)
                            chart.invalidate()
                        },
                        modifier = Modifier.fillMaxSize()
                    )
                }
            }

            // Monthly Trends Bar Chart
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp)
                    .height(300.dp)
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(16.dp)
                ) {
                    Text(
                        "Monthly Trends",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Medium
                    )

                    Spacer(modifier = Modifier.height(16.dp))

                    AndroidView(
                        factory = { context ->
                            BarChart(context).apply {
                                description.isEnabled = false
                                legend.isEnabled = true
                                setFitBars(true)
                                xAxis.setDrawGridLines(false)
                                axisLeft.setDrawGridLines(false)
                                axisRight.setDrawGridLines(false)
                            }
                        },
                        update = { chart ->
                            val months = monthlyTrends.keys.sorted()
                            val incomeEntries = months.mapIndexed { index, month ->
                                BarEntry(index.toFloat(), monthlyTrends[month]?.first?.toFloat() ?: 0f)
                            }
                            val expenseEntries = months.mapIndexed { index, month ->
                                BarEntry(index.toFloat(), monthlyTrends[month]?.second?.toFloat() ?: 0f)
                            }

                            val incomeDataSet = BarDataSet(incomeEntries, "Income").apply {
                                color = android.graphics.Color.parseColor("#4CAF50")
                            }

                            val expenseDataSet = BarDataSet(expenseEntries, "Expenses").apply {
                                color = android.graphics.Color.parseColor("#F44336")
                            }

                            chart.data = BarData(incomeDataSet, expenseDataSet).apply {
                                barWidth = 0.35f
                                groupBars(0f, 0.15f, 0.35f)
                            }

                            chart.invalidate()
                        },
                        modifier = Modifier.fillMaxSize()
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))
        }
    }
}