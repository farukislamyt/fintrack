package com.farukislamyt.fintrack.ui.viewmodels

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.farukislamyt.fintrack.data.model.Goal
import com.farukislamyt.fintrack.data.repository.GoalRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import java.util.*
import javax.inject.Inject

@HiltViewModel
class GoalsViewModel @Inject constructor(
    private val goalRepository: GoalRepository
) : ViewModel() {

    val goals = goalRepository.getAllGoals()
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = emptyList()
        )

    fun addGoal(name: String, targetAmount: Double, deadline: Date? = null) {
        viewModelScope.launch {
            val goal = Goal(
                name = name,
                targetAmount = targetAmount,
                deadline = deadline
            )
            goalRepository.insertGoal(goal)
        }
    }

    fun updateGoal(goal: Goal) {
        viewModelScope.launch {
            goalRepository.updateGoal(goal)
        }
    }

    fun deleteGoal(goal: Goal) {
        viewModelScope.launch {
            goalRepository.deleteGoal(goal)
        }
    }

    fun addContribution(goal: Goal, amount: Double) {
        viewModelScope.launch {
            val updatedGoal = goal.copy(
                currentAmount = goal.currentAmount + amount,
                isCompleted = goal.currentAmount + amount >= goal.targetAmount
            )
            goalRepository.updateGoal(updatedGoal)
        }
    }
}