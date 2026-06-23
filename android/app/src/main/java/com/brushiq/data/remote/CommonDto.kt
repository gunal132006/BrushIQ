package com.brushiq.data.remote

data class UserDto(
    val id: String,
    val fullName: String,
    val email: String?,
    val phone: String?,
    val createdAt: String
)

data class FamilyMemberDto(
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

data class ToothbrushDto(
    val id: String,
    val familyMemberId: String,
    val brand: String,
    val model: String,
    val color: String,
    val type: String,
    val purchaseDate: String,
    val createdAt: String?,
    val memberName: String?
)

data class ScanDto(
    val id: String?,
    val toothbrushId: String?,
    val imageUrl: String?,
    val wearPercentage: Double?,
    val healthScore: Double?,
    val remainingLifeDays: Int?,
    val condition: String?,
    val confidenceScore: Double?,
    val bristleSpreading: Double?,
    val bristleBending: Double?,
    val bristleDamage: Double?,
    val brushingFrequency: String?,
    val detectedIssues: List<String>?,
    val aiRecommendation: String?,
    val scanDate: String?
)

data class ReminderDto(
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

data class TipDto(
    val id: String,
    val category: String,
    val title: String,
    val content: String,
    val illustrationUrl: String?
)

data class DashboardResponse(
    val totalMembers: Int,
    val totalToothbrushes: Int,
    val avgHealthScore: Double,
    val pendingReplacements: Int,
    val recentScans: List<DashboardRecentScanDto>
)

data class DashboardRecentScanDto(
    val id: String?,
    val imageUrl: String?,
    val wearPercentage: Double?,
    val healthScore: Double?,
    val condition: String?,
    val scanDate: String?,
    val brand: String?,
    val model: String?,
    val memberName: String?
)

data class GenericMessageResponse(val message: String)
