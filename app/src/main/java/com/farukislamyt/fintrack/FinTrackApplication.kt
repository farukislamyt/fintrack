package com.farukislamyt.fintrack

import android.app.Application
import com.farukislamyt.fintrack.data.DataSeeder
import dagger.hilt.android.HiltAndroidApp
import javax.inject.Inject

@HiltAndroidApp
class FinTrackApplication : Application() {

    @Inject
    lateinit var dataSeeder: DataSeeder

    override fun onCreate() {
        super.onCreate()
        dataSeeder.seedSampleData()
    }
}