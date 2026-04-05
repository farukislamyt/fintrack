package com.farukislamyt.fintrack.data.repository

import com.farukislamyt.fintrack.data.database.GoalDao
import com.farukislamyt.fintrack.data.model.Goal
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class GoalRepository @Inject constructor(
    private val goalDao: GoalDao
) {
    fun getAllGoals(): Flow<List<Goal>> = goalDao.getAllGoals()

    fun getActiveGoals(): Flow<List<Goal>> = goalDao.getActiveGoals()

    fun getCompletedGoals(): Flow<List<Goal>> = goalDao.getCompletedGoals()

    suspend fun insertGoal(goal: Goal): Long = goalDao.insertGoal(goal)

    suspend fun updateGoal(goal: Goal) = goalDao.updateGoal(goal)

    suspend fun deleteGoal(goal: Goal) = goalDao.deleteGoal(goal)

    suspend fun deleteGoalById(id: Long) = goalDao.deleteGoalById(id)
}