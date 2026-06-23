package com.brushiq.data.remote

import retrofit2.http.*

data class FamilyMemberRequest(
    val name: String,
    val age: Int,
    val gender: String,
    val relationship: String,
    val profilePhotoUrl: String?
)

data class ReminderRequest(
    val familyMemberId: String,
    val toothbrushId: String,
    val type: String,
    val nextReminderDate: String,
    val message: String
)

interface FamilyApi {
    @GET("family")
    suspend fun getFamilyMembers(): List<FamilyMemberDto>

    @POST("family")
    suspend fun addFamilyMember(@Body request: FamilyMemberRequest): FamilyMemberDto

    @PUT("family/{id}")
    suspend fun updateFamilyMember(@Path("id") id: String, @Body request: FamilyMemberRequest): FamilyMemberDto

    @DELETE("family/{id}")
    suspend fun deleteFamilyMember(@Path("id") id: String): GenericMessageResponse

    // Reminders
    @GET("reminders")
    suspend fun getReminders(@Query("familyMemberId") familyMemberId: String?): List<ReminderDto>

    @POST("reminders")
    suspend fun createReminder(@Body request: ReminderRequest): ReminderDto

    @PUT("reminders/{id}/complete")
    suspend fun completeReminder(@Path("id") id: String): ReminderDto
}
