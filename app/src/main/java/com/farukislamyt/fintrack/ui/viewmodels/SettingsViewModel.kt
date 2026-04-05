package com.farukislamyt.fintrack.ui.viewmodels

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.farukislamyt.fintrack.data.DataManager
import com.farukislamyt.fintrack.data.model.AppSettings
import com.farukislamyt.fintrack.data.repository.SettingsRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class SettingsViewModel @Inject constructor(
    private val settingsRepository: SettingsRepository,
    private val dataManager: DataManager
) : ViewModel() {

    val settings = settingsRepository.settings
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = AppSettings()
        )

    private val _exportResult = MutableStateFlow<String?>(null)
    val exportResult: StateFlow<String?> = _exportResult

    private val _importResult = MutableStateFlow<String?>(null)
    val importResult: StateFlow<String?> = _importResult

    fun updateUserName(name: String) {
        viewModelScope.launch {
            settingsRepository.updateSettings { it.copy(userName = name) }
        }
    }

    fun updateCurrency(currency: String) {
        viewModelScope.launch {
            settingsRepository.updateSettings { it.copy(currency = currency) }
        }
    }

    fun updateDateFormat(format: String) {
        viewModelScope.launch {
            settingsRepository.updateSettings { it.copy(dateFormat = format) }
        }
    }

    fun updateSavingsTarget(target: Int) {
        viewModelScope.launch {
            settingsRepository.updateSettings { it.copy(savingsTarget = target) }
        }
    }

    fun exportData() {
        viewModelScope.launch {
            val result = dataManager.exportData()
            _exportResult.value = result.getOrNull() ?: result.exceptionOrNull()?.message
        }
    }

    fun importData(jsonData: String, merge: Boolean = false) {
        viewModelScope.launch {
            val result = dataManager.importData(jsonData, merge)
            _importResult.value = result.getOrNull() ?: result.exceptionOrNull()?.message
        }
    }

    fun clearExportResult() {
        _exportResult.value = null
    }

    fun clearImportResult() {
        _importResult.value = null
    }
}