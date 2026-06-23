package com.brushiq.data.repository

import com.brushiq.data.local.ToothbrushDao
import com.brushiq.data.local.ToothbrushEntity
import com.brushiq.data.remote.ToothbrushApi
import com.brushiq.data.remote.ToothbrushRequest
import com.brushiq.domain.repository.Toothbrush
import com.brushiq.domain.repository.ToothbrushRepository
import com.brushiq.util.Resource
import com.brushiq.util.safeApiCall
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ToothbrushRepositoryImpl @Inject constructor(
    private val toothbrushApi: ToothbrushApi,
    private val toothbrushDao: ToothbrushDao
) : ToothbrushRepository {

    override fun getToothbrushes(familyMemberId: String?): Flow<Resource<List<Toothbrush>>> {
        val localFlow = if (familyMemberId != null) {
            toothbrushDao.getByMember(familyMemberId)
        } else {
            toothbrushDao.getAll()
        }
        return localFlow.map { list ->
            val domainList = list.map {
                Toothbrush(it.id, it.familyMemberId, it.brand, it.model, it.color, it.type, it.purchaseDate, it.memberName)
            }
            Resource.Success(domainList) as Resource<List<Toothbrush>>
        }.catch { emit(Resource.Error(it)) }
    }

    override suspend fun syncToothbrushes(familyMemberId: String?): Resource<Unit> {
        val res = safeApiCall { toothbrushApi.getToothbrushes(familyMemberId) }
        return when (res) {
            is Resource.Success -> {
                val dtoList = res.data
                val entities = dtoList.map {
                    ToothbrushEntity(it.id, it.familyMemberId, it.brand, it.model, it.color, it.type, it.purchaseDate, it.memberName)
                }
                if (familyMemberId == null) {
                    toothbrushDao.clearAll()
                }
                toothbrushDao.insertAll(entities)
                Resource.Success(Unit)
            }
            is Resource.Error -> Resource.Error(res.exception, res.message)
            is Resource.Loading -> Resource.Loading
        }
    }

    override suspend fun addToothbrush(
        familyMemberId: String,
        brand: String,
        model: String,
        color: String,
        type: String,
        purchaseDate: String
    ): Resource<Toothbrush> {
        val res = safeApiCall {
            toothbrushApi.addToothbrush(ToothbrushRequest(familyMemberId, brand, model, color, type, purchaseDate))
        }
        return when (res) {
            is Resource.Success -> {
                val dto = res.data
                val entity = ToothbrushEntity(dto.id, dto.familyMemberId, dto.brand, dto.model, dto.color, dto.type, dto.purchaseDate, dto.memberName)
                toothbrushDao.insert(entity)
                Resource.Success(
                    Toothbrush(dto.id, dto.familyMemberId, dto.brand, dto.model, dto.color, dto.type, dto.purchaseDate, dto.memberName)
                )
            }
            is Resource.Error -> Resource.Error(res.exception, res.message)
            is Resource.Loading -> Resource.Loading
        }
    }

    override suspend fun updateToothbrush(
        id: String,
        brand: String,
        model: String,
        color: String,
        type: String,
        purchaseDate: String
    ): Resource<Toothbrush> {
        val res = safeApiCall {
            toothbrushApi.updateToothbrush(id, ToothbrushRequest("", brand, model, color, type, purchaseDate))
        }
        return when (res) {
            is Resource.Success -> {
                val dto = res.data
                val entity = ToothbrushEntity(dto.id, dto.familyMemberId, dto.brand, dto.model, dto.color, dto.type, dto.purchaseDate, dto.memberName)
                toothbrushDao.insert(entity)
                Resource.Success(
                    Toothbrush(dto.id, dto.familyMemberId, dto.brand, dto.model, dto.color, dto.type, dto.purchaseDate, dto.memberName)
                )
            }
            is Resource.Error -> Resource.Error(res.exception, res.message)
            is Resource.Loading -> Resource.Loading
        }
    }

    override suspend fun deleteToothbrush(id: String): Resource<Unit> {
        val res = safeApiCall {
            toothbrushApi.deleteToothbrush(id)
        }
        return when (res) {
            is Resource.Success -> {
                toothbrushDao.deleteById(id)
                Resource.Success(Unit)
            }
            is Resource.Error -> Resource.Error(res.exception, res.message)
            is Resource.Loading -> Resource.Loading
        }
    }
}
