package com.brushiq.domain.repository

import kotlinx.coroutines.flow.Flow
import okhttp3.MultipartBody

// Domain Models
data class User(
    val id: String,
    val fullName: String,
    val email: String?,
    val phone: String?,
    val createdAt: String
)

data class FamilyMember(
    val id: String,
    val name: String,
    val age: Int,
    val gender: String,
    val relationship: String,
    val profilePhotoUrl: String?,
    val toothbrushId: String?,
    val toothbrushBrand: String?,
    val toothbrushModel: String?,
    val toothbrushType: String?,
    val toothbrushPurchaseDate: String?,
    val healthScore: Double?,
    val toothbrushCondition: String?,
    val lastScanDate: String?
)


data class Toothbrush(
    val id: String,
    val familyMemberId: String,
    val brand: String,
    val model: String,
    val color: String,
    val type: String,
    val purchaseDate: String,
    val memberName: String?
)

data class ScanReport(
    val id: String,
    val toothbrushId: String,
    val imageUrl: String,
    val wearPercentage: Double,
    val healthScore: Double,
    val remainingLifeDays: Int,
    val condition: String,
    val confidenceScore: Double,
    val bristleSpreading: Double,
    val bristleBending: Double,
    val bristleDamage: Double,
    val brushingFrequency: String,
    val detectedIssues: List<String>,
    val aiRecommendation: String,
    val scanDate: String
)

data class Reminder(
    val id: String,
    val familyMemberId: String,
    val toothbrushId: String,
    val scanId: String?,
    val type: String,
    val nextReminderDate: String,
    val message: String,
    val isCompleted: Boolean,
    val memberName: String?,
    val toothbrushBrand: String?,
    val toothbrushModel: String?
)

data class Tip(
    val id: String,
    val category: String,
    val title: String,
    val content: String,
    val illustrationUrl: String?
)

data class DashboardStats(
    val totalMembers: Int,
    val totalToothbrushes: Int,
    val avgHealthScore: Double,
    val pendingReplacements: Int,
    val recentScans: List<ScanReport>
)

interface BrushIQRepository {
    
    // Auth
    suspend fun register(fullName: String, email: String?, phone: String?, password: String): User
    suspend fun login(username: String, password: String): User
    suspend fun googleLogin(googleId: String, email: String, fullName: String, photoUrl: String?): User
    suspend fun forgotPassword(email: String?, phone: String?): String
    suspend fun getMe(): User
    fun getSessionToken(): String?
    fun logout()

    // Family Members
    fun getFamilyMembers(): Flow<List<FamilyMember>>
    suspend fun syncFamilyMembers()
    suspend fun addFamilyMember(name: String, age: Int, gender: String, relationship: String, profilePhotoUrl: String?): FamilyMember
    suspend fun updateFamilyMember(id: String, name: String, age: Int, gender: String, relationship: String, profilePhotoUrl: String?): FamilyMember
    suspend fun deleteFamilyMember(id: String)

    // Toothbrushes
    fun getToothbrushes(familyMemberId: String? = null): Flow<List<Toothbrush>>
    suspend fun syncToothbrushes(familyMemberId: String? = null)
    suspend fun addToothbrush(familyMemberId: String, brand: String, model: String, color: String, type: String, purchaseDate: String): Toothbrush
    suspend fun updateToothbrush(id: String, brand: String, model: String, color: String, type: String, purchaseDate: String): Toothbrush
    suspend fun deleteToothbrush(id: String)

    // Scans
    fun getScansHistory(toothbrushId: String): Flow<List<ScanReport>>
    suspend fun syncScansHistory(toothbrushId: String)
    suspend fun analyzeScan(image: MultipartBody.Part): ScanReport
    suspend fun saveScan(
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
    ): ScanReport
    suspend fun getScanDetails(id: String): ScanReport

    // Reminders
    fun getActiveReminders(familyMemberId: String? = null): Flow<List<Reminder>>
    suspend fun syncReminders(familyMemberId: String? = null)
    suspend fun completeReminder(id: String)

    // Tips
    fun getTips(): Flow<List<Tip>>
    suspend fun syncTips()
    suspend fun getPersonalizedTips(familyMemberId: String): List<Tip>

    // Bookmarks
    fun getBookmarkedTips(): Flow<List<Tip>>
    suspend fun toggleBookmark(tip: Tip)
    fun isTipBookmarked(tipId: String): Flow<Boolean>

    // Dashboard
    suspend fun getDashboardData(): DashboardStats
}
