package com.brushiq.data.repository

import com.brushiq.data.local.ScanDao
import com.brushiq.data.local.ScanEntity
import com.brushiq.data.remote.ScanApi
import com.brushiq.data.remote.SaveScanRequest
import com.brushiq.domain.repository.ScanReport
import com.brushiq.domain.repository.ScanRepository
import com.brushiq.util.Resource
import com.brushiq.util.safeApiCall
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.map
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.asRequestBody
import java.io.File
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ScanRepositoryImpl @Inject constructor(
    private val scanApi: ScanApi,
    private val scanDao: ScanDao
) : ScanRepository {

    override fun getScansHistory(toothbrushId: String): Flow<Resource<List<ScanReport>>> {
        return scanDao.getByToothbrush(toothbrushId).map { list ->
            val domainList = list.map {
                ScanReport(
                    it.id, it.toothbrushId, it.imageUrl, it.wearPercentage, it.healthScore,
                    it.remainingLifeDays, it.condition, it.confidenceScore, it.bristleSpreading,
                    it.bristleBending, it.bristleDamage, it.brushingFrequency,
                    it.detectedIssues, it.aiRecommendation, it.scanDate
                )
            }
            Resource.Success(domainList) as Resource<List<ScanReport>>
        }.catch { emit(Resource.Error(it)) }
    }

    override suspend fun syncScansHistory(toothbrushId: String): Resource<Unit> {
        val res = safeApiCall { scanApi.getScansHistory(toothbrushId) }
        return when (res) {
            is Resource.Success -> {
                val dtoList = res.data
                val entities = dtoList.map {
                    ScanEntity(
                        id = it.id ?: "",
                        toothbrushId = it.toothbrushId ?: "",
                        imageUrl = it.imageUrl ?: "",
                        wearPercentage = it.wearPercentage ?: 0.0,
                        healthScore = it.healthScore ?: 0.0,
                        remainingLifeDays = it.remainingLifeDays ?: 0,
                        condition = it.condition ?: "Good",
                        confidenceScore = it.confidenceScore ?: 0.0,
                        bristleSpreading = it.bristleSpreading ?: 0.0,
                        bristleBending = it.bristleBending ?: 0.0,
                        bristleDamage = it.bristleDamage ?: 0.0,
                        brushingFrequency = it.brushingFrequency ?: "2x daily",
                        detectedIssues = it.detectedIssues ?: emptyList(),
                        aiRecommendation = it.aiRecommendation ?: "",
                        scanDate = it.scanDate ?: ""
                    )
                }
                scanDao.insertAll(entities)
                Resource.Success(Unit)
            }
            is Resource.Error -> Resource.Error(res.exception, res.message)
            is Resource.Loading -> Resource.Loading
        }
    }

    override suspend fun analyzeScan(imageFile: File): Resource<ScanReport> {
        val requestFile = imageFile.asRequestBody("image/jpeg".toMediaTypeOrNull())
        val body = MultipartBody.Part.createFormData("image", imageFile.name, requestFile)
        val res = safeApiCall { scanApi.analyzeScan(body) }
        return when (res) {
            is Resource.Success -> {
                val dto = res.data
                Resource.Success(
                    ScanReport(
                        id = dto.id ?: "",
                        toothbrushId = dto.toothbrushId ?: "",
                        imageUrl = dto.imageUrl ?: "",
                        wearPercentage = dto.wearPercentage ?: 0.0,
                        healthScore = dto.healthScore ?: 0.0,
                        remainingLifeDays = dto.remainingLifeDays ?: 0,
                        condition = dto.condition ?: "Good",
                        confidenceScore = dto.confidenceScore ?: 0.0,
                        bristleSpreading = dto.bristleSpreading ?: 0.0,
                        bristleBending = dto.bristleBending ?: 0.0,
                        bristleDamage = dto.bristleDamage ?: 0.0,
                        brushingFrequency = dto.brushingFrequency ?: "2x daily",
                        detectedIssues = dto.detectedIssues ?: emptyList(),
                        aiRecommendation = dto.aiRecommendation ?: "",
                        scanDate = dto.scanDate ?: ""
                    )
                )
            }
            is Resource.Error -> Resource.Error(res.exception, res.message)
            is Resource.Loading -> Resource.Loading
        }
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
    ): Resource<ScanReport> {
        val req = SaveScanRequest(
            toothbrushId, imageUrl, wearPercentage, healthScore, remainingLifeDays, condition,
            confidenceScore, bristleSpreading, bristleBending, bristleDamage, brushingFrequency, detectedIssues, aiRecommendation
        )
        val res = safeApiCall { scanApi.saveScan(req) }
        return when (res) {
            is Resource.Success -> {
                val dto = res.data
                val entity = ScanEntity(
                    id = dto.id ?: "",
                    toothbrushId = dto.toothbrushId ?: "",
                    imageUrl = dto.imageUrl ?: "",
                    wearPercentage = dto.wearPercentage ?: 0.0,
                    healthScore = dto.healthScore ?: 0.0,
                    remainingLifeDays = dto.remainingLifeDays ?: 0,
                    condition = dto.condition ?: "Good",
                    confidenceScore = dto.confidenceScore ?: 0.0,
                    bristleSpreading = dto.bristleSpreading ?: 0.0,
                    bristleBending = dto.bristleBending ?: 0.0,
                    bristleDamage = dto.bristleDamage ?: 0.0,
                    brushingFrequency = dto.brushingFrequency ?: "2x daily",
                    detectedIssues = dto.detectedIssues ?: emptyList(),
                    aiRecommendation = dto.aiRecommendation ?: "",
                    scanDate = dto.scanDate ?: ""
                )
                scanDao.insert(entity)
                Resource.Success(
                    ScanReport(
                        id = dto.id ?: "",
                        toothbrushId = dto.toothbrushId ?: "",
                        imageUrl = dto.imageUrl ?: "",
                        wearPercentage = dto.wearPercentage ?: 0.0,
                        healthScore = dto.healthScore ?: 0.0,
                        remainingLifeDays = dto.remainingLifeDays ?: 0,
                        condition = dto.condition ?: "Good",
                        confidenceScore = dto.confidenceScore ?: 0.0,
                        bristleSpreading = dto.bristleSpreading ?: 0.0,
                        bristleBending = dto.bristleBending ?: 0.0,
                        bristleDamage = dto.bristleDamage ?: 0.0,
                        brushingFrequency = dto.brushingFrequency ?: "2x daily",
                        detectedIssues = dto.detectedIssues ?: emptyList(),
                        aiRecommendation = dto.aiRecommendation ?: "",
                        scanDate = dto.scanDate ?: ""
                    )
                )
            }
            is Resource.Error -> Resource.Error(res.exception, res.message)
            is Resource.Loading -> Resource.Loading
        }
    }

    override suspend fun getScanDetails(id: String): Resource<ScanReport> {
        val cached = scanDao.getById(id)
        if (cached != null) {
            return Resource.Success(
                ScanReport(
                    cached.id, cached.toothbrushId, cached.imageUrl, cached.wearPercentage, cached.healthScore,
                    cached.remainingLifeDays, cached.condition, cached.confidenceScore, cached.bristleSpreading,
                    cached.bristleBending, cached.bristleDamage, cached.brushingFrequency,
                    cached.detectedIssues, cached.aiRecommendation, cached.scanDate
                )
            )
        }

        val res = safeApiCall { scanApi.getScanDetails(id) }
        return when (res) {
            is Resource.Success -> {
                val dto = res.data
                Resource.Success(
                    ScanReport(
                        id = dto.id ?: "",
                        toothbrushId = dto.toothbrushId ?: "",
                        imageUrl = dto.imageUrl ?: "",
                        wearPercentage = dto.wearPercentage ?: 0.0,
                        healthScore = dto.healthScore ?: 0.0,
                        remainingLifeDays = dto.remainingLifeDays ?: 0,
                        condition = dto.condition ?: "Good",
                        confidenceScore = dto.confidenceScore ?: 0.0,
                        bristleSpreading = dto.bristleSpreading ?: 0.0,
                        bristleBending = dto.bristleBending ?: 0.0,
                        bristleDamage = dto.bristleDamage ?: 0.0,
                        brushingFrequency = dto.brushingFrequency ?: "2x daily",
                        detectedIssues = dto.detectedIssues ?: emptyList(),
                        aiRecommendation = dto.aiRecommendation ?: "",
                        scanDate = dto.scanDate ?: ""
                    )
                )
            }
            is Resource.Error -> Resource.Error(res.exception, res.message)
            is Resource.Loading -> Resource.Loading
        }
    }
}
