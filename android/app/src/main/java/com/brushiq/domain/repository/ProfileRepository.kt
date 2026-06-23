package com.brushiq.domain.repository

import com.brushiq.util.Resource
import kotlinx.coroutines.flow.Flow

interface ProfileRepository {
    fun getUserProfile(): Flow<Resource<User>>
    suspend fun fetchUserProfile(): Resource<User>
    suspend fun getDashboardData(): Resource<DashboardStats>
    
    // Preferences
    fun getThemePreference(): Flow<String>
    suspend fun saveThemePreference(theme: String): Resource<Unit>
    fun getLanguagePreference(): Flow<String>
    suspend fun saveLanguagePreference(language: String): Resource<Unit>

    // Data Exports (returns a string representation or success message)
    suspend fun exportScanHistory(): Resource<String>
    suspend fun exportFamilyData(): Resource<String>
    suspend fun exportToothbrushData(): Resource<String>
}
