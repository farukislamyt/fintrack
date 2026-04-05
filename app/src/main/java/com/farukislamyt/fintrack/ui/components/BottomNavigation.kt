package com.farukislamyt.fintrack.ui.components

import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.navigation.NavController
import androidx.navigation.compose.currentBackStackEntryAsState
import com.farukislamyt.fintrack.R

sealed class Screen(val route: String, val title: String, val icon: Int) {
    object Dashboard : Screen("dashboard", "Dashboard", R.drawable.ic_dashboard)
    object Transactions : Screen("transactions", "Transactions", R.drawable.ic_transactions)
    object Budgets : Screen("budgets", "Budgets", R.drawable.ic_budgets)
    object Goals : Screen("goals", "Goals", R.drawable.ic_goals)
    object Loans : Screen("loans", "Loans", R.drawable.ic_loans)
    object Reports : Screen("reports", "Reports", R.drawable.ic_reports)
    object Settings : Screen("settings", "Settings", R.drawable.ic_settings)
}

val screens = listOf(
    Screen.Dashboard,
    Screen.Transactions,
    Screen.Budgets,
    Screen.Goals,
    Screen.Loans,
    Screen.Reports,
    Screen.Settings
)

@Composable
fun BottomNavigationBar(navController: NavController) {
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route

    NavigationBar {
        screens.forEach { screen ->
            NavigationBarItem(
                icon = { Icon(painterResource(id = screen.icon), contentDescription = screen.title) },
                label = { Text(screen.title) },
                selected = currentRoute == screen.route,
                onClick = {
                    navController.navigate(screen.route) {
                        // Pop up to the start destination of the graph to
                        // avoid building up a large stack of destinations
                        // on the back stack as users select items
                        navController.graph.startDestinationRoute?.let { route ->
                            popUpTo(route) {
                                saveState = true
                            }
                        }
                        // Avoid multiple copies of the same destination when
                        // reselecting the same item
                        launchSingleTop = true
                        // Restore state when reselecting a previously selected item
                        restoreState = true
                    }
                }
            )
        }
    }
}