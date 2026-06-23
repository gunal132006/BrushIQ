package com.brushiq.data.repository

import com.brushiq.data.remote.ScanApi
import com.brushiq.domain.repository.*
import com.brushiq.util.Resource
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.runBlocking
import okhttp3.MultipartBody
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class BrushIQRepositoryImpl @Inject constructor(
    private val authRepository: AuthRepository,
    private val familyRepository: FamilyRepository,
    private val toothbrushRepository: ToothbrushRepository,
    private val scanRepository: ScanRepository,
    private val tipsRepository: TipsRepository,
    private val profileRepository: ProfileRepository,
    private val scanApi: ScanApi // Injected for legacy MultipartBody.Part method compatibility
) : BrushIQRepository {

    private fun <T> Resource<T>.getOrThrow(): T {
        return when (this) {
            is Resource.Success -> this.data
            is Resource.Error -> throw this.exception
            is Resource.Loading -> throw IllegalStateException("Resource is in loading state.")
        }
    }

    // ------------------------------------
    // Auth
    // ------------------------------------
    override suspend fun register(fullName: String, email: String?, phone: String?, password: String): User {
        return authRepository.register(fullName, email, phone, password).getOrThrow()
    }

    override suspend fun login(username: String, password: String): User {
        return authRepository.login(username, password).getOrThrow()
    }

    override suspend fun googleLogin(googleId: String, email: String, fullName: String, photoUrl: String?): User {
        return authRepository.googleLogin(googleId, email, fullName, photoUrl).getOrThrow()
    }

    override suspend fun forgotPassword(email: String?, phone: String?): String {
        return authRepository.forgotPassword(email, phone).getOrThrow()
    }

    override suspend fun getMe(): User {
        return profileRepository.fetchUserProfile().getOrThrow()
    }

    override fun getSessionToken(): String? = runBlocking {
        authRepository.getSessionToken().first()
    }

    override fun logout() {
        runBlocking {
            authRepository.logout()
        }
    }

    // ------------------------------------
    // Family Members
    // ------------------------------------
    override fun getFamilyMembers(): Flow<List<FamilyMember>> {
        return familyRepository.getFamilyMembers().map { res ->
            when (res) {
                is Resource.Success -> res.data
                else -> emptyList()
            }
        }
    }

    override suspend fun syncFamilyMembers() {
        familyRepository.syncFamilyMembers().getOrThrow()
    }

    override suspend fun addFamilyMember(
        name: String,
        age: Int,
        gender: String,
        relationship: String,
        profilePhotoUrl: String?
    ): FamilyMember {
        return familyRepository.addFamilyMember(name, age, gender, relationship, profilePhotoUrl).getOrThrow()
    }

    override suspend fun updateFamilyMember(
        id: String,
        name: String,
        age: Int,
        gender: String,
        relationship: String,
        profilePhotoUrl: String?
    ): FamilyMember {
        return familyRepository.updateFamilyMember(id, name, age, gender, relationship, profilePhotoUrl).getOrThrow()
    }

    override suspend fun deleteFamilyMember(id: String) {
        familyRepository.deleteFamilyMember(id).getOrThrow()
    }

    // ------------------------------------
    // Toothbrushes
    // ------------------------------------
    override fun getToothbrushes(familyMemberId: String?): Flow<List<Toothbrush>> {
        return toothbrushRepository.getToothbrushes(familyMemberId).map { res ->
            when (res) {
                is Resource.Success -> res.data
                else -> emptyList()
            }
        }
    }

    override suspend fun syncToothbrushes(familyMemberId: String?) {
        toothbrushRepository.syncToothbrushes(familyMemberId).getOrThrow()
    }

    override suspend fun addToothbrush(
        familyMemberId: String,
        brand: String,
        model: String,
        color: String,
        type: String,
        purchaseDate: String
    ): Toothbrush {
        return toothbrushRepository.addToothbrush(familyMemberId, brand, model, color, type, purchaseDate).getOrThrow()
    }

    override suspend fun updateToothbrush(
        id: String,
        brand: String,
        model: String,
        color: String,
        type: String,
        purchaseDate: String
    ): Toothbrush {
        return toothbrushRepository.updateToothbrush(id, brand, model, color, type, purchaseDate).getOrThrow()
    }

    override suspend fun deleteToothbrush(id: String) {
        toothbrushRepository.deleteToothbrush(id).getOrThrow()
    }

    // ------------------------------------
    // Scans
    // ------------------------------------
    override fun getScansHistory(toothbrushId: String): Flow<List<ScanReport>> {
        return scanRepository.getScansHistory(toothbrushId).map { res ->
            when (res) {
                is Resource.Success -> res.data
                else -> emptyList()
            }
        }
    }

    override suspend fun syncScansHistory(toothbrushId: String) {
        scanRepository.syncScansHistory(toothbrushId).getOrThrow()
    }

    override suspend fun analyzeScan(image: MultipartBody.Part): ScanReport {
        // Delegate directly to API for legacy compatibility, parsing response into Domain object
        val dto = scanApi.analyzeScan(image)
        return ScanReport(
            id = dto.id ?: "",
            toothbrushId = dto.toothbrushId ?: "",
            imageUrl = dto.imageUrl ?: "",
            wearPercentage = dto.wearPercentage ?: 0.0,
            healthScore = dto.healthScore ?: 0.0,
            remainingLifeDays = dto.remainingLifeDays ?: 0,
            condition = dto.condition ?: "",
            confidenceScore = dto.confidenceScore ?: 0.0,
            bristleSpreading = dto.bristleSpreading ?: 0.0,
            bristleBending = dto.bristleBending ?: 0.0,
            bristleDamage = dto.bristleDamage ?: 0.0,
            brushingFrequency = dto.brushingFrequency ?: "",
            detectedIssues = dto.detectedIssues ?: emptyList(),
            aiRecommendation = dto.aiRecommendation ?: "",
            scanDate = dto.scanDate ?: ""
        )
    }

    override suspend fun saveScan(
        toothbrushId: String,
        imageUrl: String,
        wearPercentage: Double,
        healthScore: Double,
        remainingLifeDays: Int,
        condition: String,
        confidenceScore: Double,
        bristleSpreading: Double,
        bristleBending: Double,
        bristleDamage: Double,
        brushingFrequency: String,
        detectedIssues: List<String>,
        aiRecommendation: String
    ): ScanReport {
        return scanRepository.saveScan(
            toothbrushId, imageUrl, wearPercentage, healthScore, remainingLifeDays, condition,
            confidenceScore, bristleSpreading, bristleBending, bristleDamage, brushingFrequency, detectedIssues, aiRecommendation
        ).getOrThrow()
    }

    override suspend fun getScanDetails(id: String): ScanReport {
        return scanRepository.getScanDetails(id).getOrThrow()
    }

    // ------------------------------------
    // Reminders
    // ------------------------------------
    override fun getActiveReminders(familyMemberId: String?): Flow<List<Reminder>> {
        return familyRepository.getActiveReminders(familyMemberId).map { res ->
            when (res) {
                is Resource.Success -> res.data
                else -> emptyList()
            }
        }
    }

    override suspend fun syncReminders(familyMemberId: String?) {
        familyRepository.syncReminders(familyMemberId).getOrThrow()
    }

    override suspend fun completeReminder(id: String) {
        familyRepository.completeReminder(id).getOrThrow()
    }

    // ------------------------------------
    // Tips
    // ------------------------------------
    override fun getTips(): Flow<List<Tip>> {
        return tipsRepository.getTips().map { res ->
            when (res) {
                is Resource.Success -> res.data
                else -> emptyList()
            }
        }
    }

    override suspend fun syncTips() {
        tipsRepository.syncTips().getOrThrow()
    }

    override suspend fun getPersonalizedTips(familyMemberId: String): List<Tip> {
        return tipsRepository.getPersonalizedTips(familyMemberId).getOrThrow()
    }

    override fun getBookmarkedTips(): Flow<List<Tip>> {
        return tipsRepository.getBookmarkedTips().map { res ->
            when (res) {
                is Resource.Success -> res.data
                else -> emptyList()
            }
        }
    }

    override suspend fun toggleBookmark(tip: Tip) {
        tipsRepository.toggleBookmark(tip).getOrThrow()
    }

    override fun isTipBookmarked(tipId: String): Flow<Boolean> {
        return tipsRepository.isTipBookmarked(tipId)
    }

    // ------------------------------------
    // Dashboard
    // ------------------------------------
    override suspend fun getDashboardData(): DashboardStats {
        return profileRepository.getDashboardData().getOrThrow()
    }
}
