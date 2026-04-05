package com.farukislamyt.fintrack.data.repository

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.*
import androidx.datastore.preferences.preferencesDataStore
import com.farukislamyt.fintrack.data.model.AppSettings
import com.google.gson.Gson
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.runBlocking
import javax.inject.Inject
import javax.inject.Singleton

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "settings")

@Singleton
class SettingsRepository @Inject constructor(
    @ApplicationContext private val context: Context,
    private val gson: Gson = Gson()
) {

    private val dataStore = context.dataStore

    val settings: Flow<AppSettings> = dataStore.data.map { preferences ->
        val userName = preferences[USER_NAME_KEY] ?: ""
        val currency = preferences[CURRENCY_KEY] ?: "USD"
        val dateFormat = preferences[DATE_FORMAT_KEY] ?: "MM/DD/YYYY"
        val savingsTarget = preferences[SAVINGS_TARGET_KEY] ?: 20
        val incomeCategoriesJson = preferences[INCOME_CATEGORIES_KEY] ?: gson.toJson(AppSettings().incomeCategories)
        val expenseCategoriesJson = preferences[EXPENSE_CATEGORIES_KEY] ?: gson.toJson(AppSettings().expenseCategories)

        val incomeCategories = try {
            gson.fromJson(incomeCategoriesJson, Array<String>::class.java).toList()
        } catch (e: Exception) {
            AppSettings().incomeCategories
        }

        val expenseCategories = try {
            gson.fromJson(expenseCategoriesJson, Array<String>::class.java).toList()
        } catch (e: Exception) {
            AppSettings().expenseCategories
        }

        AppSettings(
            userName = userName,
            currency = currency,
            dateFormat = dateFormat,
            savingsTarget = savingsTarget,
            incomeCategories = incomeCategories,
            expenseCategories = expenseCategories
        )
    }

    suspend fun updateSettings(update: (AppSettings) -> AppSettings) {
        dataStore.edit { preferences ->
            val currentSettings = runBlocking { settings.first() }
            val newSettings = update(currentSettings)

            preferences[USER_NAME_KEY] = newSettings.userName
            preferences[CURRENCY_KEY] = newSettings.currency
            preferences[DATE_FORMAT_KEY] = newSettings.dateFormat
            preferences[SAVINGS_TARGET_KEY] = newSettings.savingsTarget
            preferences[INCOME_CATEGORIES_KEY] = gson.toJson(newSettings.incomeCategories)
            preferences[EXPENSE_CATEGORIES_KEY] = gson.toJson(newSettings.expenseCategories)
        }
    }

    companion object {
        private val USER_NAME_KEY = stringPreferencesKey("user_name")
        private val CURRENCY_KEY = stringPreferencesKey("currency")
        private val DATE_FORMAT_KEY = stringPreferencesKey("date_format")
        private val SAVINGS_TARGET_KEY = intPreferencesKey("savings_target")
        private val INCOME_CATEGORIES_KEY = stringPreferencesKey("income_categories")
        private val EXPENSE_CATEGORIES_KEY = stringPreferencesKey("expense_categories")
    }
}