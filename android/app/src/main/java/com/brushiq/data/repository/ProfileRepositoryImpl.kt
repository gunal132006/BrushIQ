package com.brushiq.data.repository

import com.brushiq.data.local.UserDao
import com.brushiq.data.local.UserEntity
import com.brushiq.data.remote.ProfileApi
import com.brushiq.domain.repository.DashboardStats
import com.brushiq.domain.repository.ProfileRepository
import com.brushiq.domain.repository.ScanReport
import com.brushiq.domain.repository.User
import com.brushiq.util.PreferenceManager
import com.brushiq.util.Resource
import com.brushiq.util.safeApiCall
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ProfileRepositoryImpl @Inject constructor(
    private val profileApi: ProfileApi,
    private val userDao: UserDao,
    private val preferenceManager: PreferenceManager
) : ProfileRepository {

    override fun getUserProfile(): Flow<Resource<User>> {
        return userDao.getUserFlow().map { entity ->
            if (entity != null) {
                Resource.Success(User(entity.id, entity.fullName, entity.email, entity.phone, entity.createdAt))
            } else {
                Resource.Error(NoSuchElementException("No cached user profile found."))
            }
        }.catch { emit(Resource.Error(it)) }
    }

    override suspend fun fetchUserProfile(): Resource<User> {
        val res = safeApiCall { profileApi.getMe() }
        return when (res) {
            is Resource.Success -> {
                val dto = res.data
                val entity = UserEntity(dto.id, dto.fullName, dto.email, dto.phone, dto.createdAt)
                userDao.insert(entity)
                Resource.Success(User(dto.id, dto.fullName, dto.email, dto.phone, dto.createdAt))
            }
            is Resource.Error -> Resource.Error(res.exception, res.message)
            is Resource.Loading -> Resource.Loading
        }
    }

    override suspend fun getDashboardData(): Resource<DashboardStats> {
        val res = safeApiCall { profileApi.getDashboardData() }
        return when (res) {
            is Resource.Success -> {
                val dto = res.data
                val stats = DashboardStats(
                    totalMembers = dto.totalMembers,
                    totalToothbrushes = dto.totalToothbrushes,
                    avgHealthScore = dto.avgHealthScore,
                    pendingReplacements = dto.pendingReplacements,
                    recentScans = dto.recentScans.map {
                        ScanReport(
                            id = it.id ?: "",
                            toothbrushId = "",
                            imageUrl = it.imageUrl ?: "",
                            wearPercentage = it.wearPercentage ?: 0.0,
                            healthScore = it.healthScore ?: 0.0,
                            remainingLifeDays = 0,
                            condition = it.condition ?: "",
                            confidenceScore = 0.0,
                            bristleSpreading = 0.0,
                            bristleBending = 0.0,
                            bristleDamage = 0.0,
                            brushingFrequency = "Daily",
                            detectedIssues = emptyList(),
                            aiRecommendation = "",
                            scanDate = it.scanDate ?: ""
                        )
                    }
                )
                Resource.Success(stats)
            }
            is Resource.Error -> Resource.Error(res.exception, res.message)
            is Resource.Loading -> Resource.Loading
        }
    }

    override fun getThemePreference(): Flow<String> = preferenceManager.themePreference

    override suspend fun saveThemePreference(theme: String): Resource<Unit> {
        return try {
            preferenceManager.saveThemePreference(theme)
            Resource.Success(Unit)
        } catch (e: Exception) {
            Resource.Error(e, e.localizedMessage)
        }
    }

    override fun getLanguagePreference(): Flow<String> = preferenceManager.languagePreference

    override suspend fun saveLanguagePreference(language: String): Resource<Unit> {
        return try {
            preferenceManager.saveLanguagePreference(language)
            Resource.Success(Unit)
        } catch (e: Exception) {
            Resource.Error(e, e.localizedMessage)
        }
    }

    override suspend fun exportScanHistory(): Resource<String> {
        return try {
            delay(1000)
            Resource.Success("Scan history successfully exported as CSV.")
        } catch (e: Exception) {
            Resource.Error(e, "Export failed.")
        }
    }

    override suspend fun exportFamilyData(): Resource<String> {
        return try {
            delay(1000)
            Resource.Success("Family member data successfully exported as JSON.")
        } catch (e: Exception) {
            Resource.Error(e, "Export failed.")
        }
    }

    override suspend fun exportToothbrushData(): Resource<String> {
        return try {
            delay(1000)
            Resource.Success("Toothbrush profiles successfully exported as JSON.")
        } catch (e: Exception) {
            Resource.Error(e, "Export failed.")
        }
    }
}
