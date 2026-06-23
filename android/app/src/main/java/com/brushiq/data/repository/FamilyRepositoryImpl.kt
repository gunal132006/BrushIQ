package com.brushiq.data.repository

import com.brushiq.data.local.FamilyMemberDao
import com.brushiq.data.local.FamilyMemberEntity
import com.brushiq.data.local.ReminderDao
import com.brushiq.data.local.ReminderEntity
import com.brushiq.data.remote.FamilyApi
import com.brushiq.data.remote.FamilyMemberRequest
import com.brushiq.data.remote.ReminderRequest
import com.brushiq.domain.repository.FamilyMember
import com.brushiq.domain.repository.FamilyRepository
import com.brushiq.domain.repository.Reminder
import com.brushiq.util.Resource
import com.brushiq.util.safeApiCall
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class FamilyRepositoryImpl @Inject constructor(
    private val familyApi: FamilyApi,
    private val familyMemberDao: FamilyMemberDao,
    private val reminderDao: ReminderDao
) : FamilyRepository {

    override fun getFamilyMembers(): Flow<Resource<List<FamilyMember>>> {
        return familyMemberDao.getAll()
            .map { list ->
                val domainList = list.map {
                    FamilyMember(
                        it.id, it.name, it.age, it.gender, it.relationship, it.profilePhotoUrl,
                        it.toothbrushId, it.toothbrushBrand, it.toothbrushModel, it.toothbrushType, it.toothbrushPurchaseDate,
                        it.healthScore, it.toothbrushCondition, it.lastScanDate
                    )
                }
                Resource.Success(domainList) as Resource<List<FamilyMember>>
            }
            .catch { emit(Resource.Error(it)) }
    }

    override suspend fun syncFamilyMembers(): Resource<Unit> {
        val res = safeApiCall { familyApi.getFamilyMembers() }
        return when (res) {
            is Resource.Success -> {
                val dtoList = res.data
                val entities = dtoList.map {
                    FamilyMemberEntity(
                        it.id, it.name, it.age, it.gender, it.relationship, it.profilePhotoUrl,
                        it.toothbrushId, it.toothbrushBrand, it.toothbrushModel, it.toothbrushType, it.toothbrushPurchaseDate,
                        it.healthScore, it.toothbrushCondition, it.lastScanDate
                    )
                }
                familyMemberDao.clearAll()
                familyMemberDao.insertAll(entities)
                Resource.Success(Unit)
            }
            is Resource.Error -> Resource.Error(res.exception, res.message)
            is Resource.Loading -> Resource.Loading
        }
    }

    override suspend fun addFamilyMember(
        name: String,
        age: Int,
        gender: String,
        relationship: String,
        profilePhotoUrl: String?
    ): Resource<FamilyMember> {
        val res = safeApiCall {
            familyApi.addFamilyMember(FamilyMemberRequest(name, age, gender, relationship, profilePhotoUrl))
        }
        return when (res) {
            is Resource.Success -> {
                val dto = res.data
                val entity = FamilyMemberEntity(
                    dto.id, dto.name, dto.age, dto.gender, dto.relationship, dto.profilePhotoUrl,
                    dto.toothbrushId, dto.toothbrushBrand, dto.toothbrushModel, dto.toothbrushType, dto.toothbrushPurchaseDate,
                    dto.healthScore, dto.toothbrushCondition, dto.lastScanDate
                )
                familyMemberDao.insert(entity)
                Resource.Success(
                    FamilyMember(
                        dto.id, dto.name, dto.age, dto.gender, dto.relationship, dto.profilePhotoUrl,
                        dto.toothbrushId, dto.toothbrushBrand, dto.toothbrushModel, dto.toothbrushType, dto.toothbrushPurchaseDate,
                        dto.healthScore, dto.toothbrushCondition, dto.lastScanDate
                    )
                )
            }
            is Resource.Error -> Resource.Error(res.exception, res.message)
            is Resource.Loading -> Resource.Loading
        }
    }

    override suspend fun updateFamilyMember(
        id: String,
        name: String,
        age: Int,
        gender: String,
        relationship: String,
        profilePhotoUrl: String?
    ): Resource<FamilyMember> {
        val res = safeApiCall {
            familyApi.updateFamilyMember(id, FamilyMemberRequest(name, age, gender, relationship, profilePhotoUrl))
        }
        return when (res) {
            is Resource.Success -> {
                val dto = res.data
                val entity = FamilyMemberEntity(
                    dto.id, dto.name, dto.age, dto.gender, dto.relationship, dto.profilePhotoUrl,
                    dto.toothbrushId, dto.toothbrushBrand, dto.toothbrushModel, dto.toothbrushType, dto.toothbrushPurchaseDate,
                    dto.healthScore, dto.toothbrushCondition, dto.lastScanDate
                )
                familyMemberDao.insert(entity)
                Resource.Success(
                    FamilyMember(
                        dto.id, dto.name, dto.age, dto.gender, dto.relationship, dto.profilePhotoUrl,
                        dto.toothbrushId, dto.toothbrushBrand, dto.toothbrushModel, dto.toothbrushType, dto.toothbrushPurchaseDate,
                        dto.healthScore, dto.toothbrushCondition, dto.lastScanDate
                    )
                )
            }
            is Resource.Error -> Resource.Error(res.exception, res.message)
            is Resource.Loading -> Resource.Loading
        }
    }

    override suspend fun deleteFamilyMember(id: String): Resource<Unit> {
        val res = safeApiCall {
            familyApi.deleteFamilyMember(id)
        }
        return when (res) {
            is Resource.Success -> {
                familyMemberDao.deleteById(id)
                Resource.Success(Unit)
            }
            is Resource.Error -> Resource.Error(res.exception, res.message)
            is Resource.Loading -> Resource.Loading
        }
    }

    // Reminders
    override fun getActiveReminders(familyMemberId: String?): Flow<Resource<List<Reminder>>> {
        val localFlow = if (familyMemberId != null) {
            reminderDao.getActiveByMember(familyMemberId)
        } else {
            reminderDao.getActive()
        }
        return localFlow.map { list ->
            val domainList = list.map {
                Reminder(
                    it.id, it.familyMemberId, it.toothbrushId, it.scanId, it.type,
                    it.nextReminderDate, it.message, it.isCompleted, it.memberName,
                    it.toothbrushBrand, it.toothbrushModel
                )
            }
            Resource.Success(domainList) as Resource<List<Reminder>>
        }.catch { emit(Resource.Error(it)) }
    }

    override suspend fun syncReminders(familyMemberId: String?): Resource<Unit> {
        val res = safeApiCall { familyApi.getReminders(familyMemberId) }
        return when (res) {
            is Resource.Success -> {
                val dtoList = res.data
                val entities = dtoList.map {
                    ReminderEntity(
                        it.id, it.familyMemberId, it.toothbrushId, it.scanId, it.type,
                        it.nextReminderDate, it.message, it.isCompleted, it.memberName,
                        it.toothbrushBrand, it.toothbrushModel
                    )
                }
                reminderDao.clearAll()
                reminderDao.insertAll(entities)
                Resource.Success(Unit)
            }
            is Resource.Error -> Resource.Error(res.exception, res.message)
            is Resource.Loading -> Resource.Loading
        }
    }

    override suspend fun createReminder(
        familyMemberId: String,
        toothbrushId: String,
        type: String,
        nextReminderDate: String,
        message: String
    ): Resource<Reminder> {
        val res = safeApiCall {
            familyApi.createReminder(ReminderRequest(familyMemberId, toothbrushId, type, nextReminderDate, message))
        }
        return when (res) {
            is Resource.Success -> {
                val dto = res.data
                val entity = ReminderEntity(
                    dto.id, dto.familyMemberId, dto.toothbrushId, dto.scanId, dto.type,
                    dto.nextReminderDate, dto.message, dto.isCompleted, dto.memberName,
                    dto.toothbrushBrand, dto.toothbrushModel
                )
                reminderDao.insert(entity)
                Resource.Success(
                    Reminder(
                        dto.id, dto.familyMemberId, dto.toothbrushId, dto.scanId, dto.type,
                        dto.nextReminderDate, dto.message, dto.isCompleted, dto.memberName,
                        dto.toothbrushBrand, dto.toothbrushModel
                    )
                )
            }
            is Resource.Error -> Resource.Error(res.exception, res.message)
            is Resource.Loading -> Resource.Loading
        }
    }

    override suspend fun completeReminder(id: String): Resource<Unit> {
        val res = safeApiCall {
            familyApi.completeReminder(id)
        }
        return when (res) {
            is Resource.Success -> {
                reminderDao.markAsCompleted(id)
                Resource.Success(Unit)
            }
            is Resource.Error -> Resource.Error(res.exception, res.message)
            is Resource.Loading -> Resource.Loading
        }
    }
}
