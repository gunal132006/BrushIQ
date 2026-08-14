package com.brushiq.config

import android.os.Build
import android.util.Log
import com.brushiq.BuildConfig

enum class EnvironmentType {
    EMULATOR_DEBUG,
    PHYSICAL_DEVICE_DEBUG,
    PRODUCTION
}

object NetworkConfig {
    val EMULATOR_BASE_URL: String = BuildConfig.DEV_EMULATOR_BASE_URL
    val PHYSICAL_DEVICE_BASE_URL: String = BuildConfig.DEV_PHYSICAL_BASE_URL
    val PROD_BASE_URL: String = BuildConfig.PROD_BASE_URL

    /**
     * Determines whether application is executing inside Android Emulator or on Physical Device.
     */
    fun isRunningOnEmulator(): Boolean {
        return (Build.FINGERPRINT.startsWith("generic")
                || Build.FINGERPRINT.startsWith("unknown")
                || Build.MODEL.contains("google_sdk")
                || Build.MODEL.contains("Emulator")
                || Build.MODEL.contains("Android SDK built for x86")
                || Build.MANUFACTURER.contains("Genymotion")
                || (Build.BRAND.startsWith("generic") && Build.DEVICE.startsWith("generic"))
                || "google_sdk" == Build.PRODUCT)
    }

    /**
     * Centralized Source of Truth for Base API URL.
     */
    fun getActiveBaseUrl(): String {
        val constUrl = "https://brushiq-backend.onrender.com/api/"
        Log.d("AuthFlow", "[AUTH] Base URL host = brushiq-backend.onrender.com")
        Log.d("NetworkConfig", "Base URL = $constUrl")
        return constUrl
    }
}
