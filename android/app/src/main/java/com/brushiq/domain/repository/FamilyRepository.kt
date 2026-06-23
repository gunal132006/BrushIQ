package com.brushiq.domain.repository

import com.brushiq.util.Resource
import kotlinx.coroutines.flow.Flow

interface FamilyRepository {
    fun getFamilyMembers(): Flow<Resource<List<FamilyMember>>>
    suspend fun syncFamilyMembers(): Resource<Unit>
    suspend fun addFamilyMember(name: String, age: Int, gender: String, relationship: String, profilePhotoUrl: String?): Resource<FamilyMember>
    suspend fun updateFamilyMember(id: String, name: String, age: Int, gender: String, relationship: String, profilePhotoUrl: String?): Resource<FamilyMember>
    suspend fun deleteFamilyMember(id: String): Resource<Unit>

    // Reminders
    fun getActiveReminders(familyMemberId: String? = null): Flow<Resource<List<Reminder>>>
    suspend fun syncReminders(familyMemberId: String? = null): Resource<Unit>
    suspend fun createReminder(familyMemberId: String, toothbrushId: String, type: String, nextReminderDate: String, message: String): Resource<Reminder>
    suspend fun completeReminder(id: String): Resource<Unit>
}
