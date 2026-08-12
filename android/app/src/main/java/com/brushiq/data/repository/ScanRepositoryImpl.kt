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
        val flow = if (toothbrushId.isBlank()) {
            scanDao.getAll()
        } else {
            scanDao.getByToothbrush(toothbrushId)
        }
        return flow.map { list ->
            val domainList = list.map {
                ScanReport(
                    it.id, it.toothbrushId, it.imageUrl, it.wearPercentage, it.healthScore,
                    it.remainingLifeDays, it.condition, it.confidenceScore, it.bristleSpreading,
                    it.bristleBending, it.bristleDamage, it.brushingFrequency,
                    it.detectedIssues, it.aiRecommendation, it.scanDate,
                    it.syncStatus, it.syncError
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
                        scanDate = it.scanDate ?: "",
                        syncStatus = "SYNCED",
                        syncError = null
                    )
                }
                if (toothbrushId.isBlank()) {
                    scanDao.clearAll()
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
                        scanDate = dto.scanDate ?: "",
                        syncStatus = "SYNCED",
                        syncError = null
                    )
                )
            }
            is Resource.Error -> Resource.Error(res.exception, res.message)
            is Resource.Loading -> Resource.Loading
        }
    }

    override suspend fun saveScan(
        toothbrushId: String,
        familyMemberId: String?,
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
            toothbrushId = toothbrushId,
            familyMemberId = familyMemberId,
            imageUrl = imageUrl,
            wearPercentage = wearPercentage,
            healthScore = healthScore,
            remainingLifeDays = remainingLifeDays,
            condition = condition,
            confidenceScore = confidenceScore,
            bristleSpreading = bristleSpreading,
            bristleBending = bristleBending,
            bristleDamage = bristleDamage,
            brushingFrequency = brushingFrequency,
            detectedIssues = detectedIssues,
            aiRecommendation = aiRecommendation
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
                    scanDate = dto.scanDate ?: "",
                    syncStatus = "SYNCED",
                    syncError = null,
                    familyMemberId = familyMemberId
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
                        scanDate = dto.scanDate ?: "",
                        syncStatus = "SYNCED",
                        syncError = null
                    )
                )
            }
            is Resource.Error -> Resource.Error(res.exception, res.message)
            is Resource.Loading -> Resource.Loading
        }
    }

    override suspend fun saveScanLocallyPending(
        toothbrushId: String,
        familyMemberId: String?,
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
        val tempId = "temp_scan_${System.currentTimeMillis()}"
        val currentDate = java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", java.util.Locale.US).format(java.util.Date())
        val entity = ScanEntity(
            id = tempId,
            toothbrushId = toothbrushId,
            imageUrl = imageUrl,
            wearPercentage = wearPercentage,
            healthScore = healthScore,
            remainingLifeDays = remainingLifeDays,
            condition = condition,
            confidenceScore = confidenceScore,
            bristleSpreading = bristleSpreading,
            bristleBending = bristleBending,
            bristleDamage = bristleDamage,
            brushingFrequency = brushingFrequency,
            detectedIssues = detectedIssues,
            aiRecommendation = aiRecommendation,
            scanDate = currentDate,
            syncStatus = "PENDING",
            syncError = null,
            familyMemberId = familyMemberId
        )
        scanDao.insert(entity)
        android.util.Log.d("SYNC", "[SYNC] Scan saved locally with PENDING status. scanId=$tempId, toothbrushId=$toothbrushId")
        return Resource.Success(
            ScanReport(
                id = tempId,
                toothbrushId = toothbrushId,
                imageUrl = imageUrl,
                wearPercentage = wearPercentage,
                healthScore = healthScore,
                remainingLifeDays = remainingLifeDays,
                condition = condition,
                confidenceScore = confidenceScore,
                bristleSpreading = bristleSpreading,
                bristleBending = bristleBending,
                bristleDamage = bristleDamage,
                brushingFrequency = brushingFrequency,
                detectedIssues = detectedIssues,
                aiRecommendation = aiRecommendation,
                scanDate = currentDate,
                syncStatus = "PENDING",
                syncError = null
            )
        )
    }

    override suspend fun syncPendingScans(): Resource<Int> {
        val pendingList = scanDao.getPendingScans()
        android.util.Log.d("SYNC", "[SYNC] Pending scans = ${pendingList.size}")
        if (pendingList.isEmpty()) {
            return Resource.Success(0)
        }

        var syncedCount = 0
        for (scan in pendingList) {
            android.util.Log.d("SYNC", "[SYNC] Starting sync")
            android.util.Log.d("SYNC", "[SYNC] scanId = ${scan.id}")
            android.util.Log.d("SYNC", "[SYNC] toothbrushId = ${scan.toothbrushId}")
            android.util.Log.d("SYNC", "[SYNC] familyMemberId = ${scan.familyMemberId}")

            if (scan.toothbrushId.isBlank()) {
                android.util.Log.e("SYNC", "[SYNC] FAILED — permanent failure (missing toothbrushId)")
                scanDao.updateSyncStatus(scan.id, "FAILED", "Missing server toothbrushId relationship")
                continue
            }

            val req = SaveScanRequest(
                toothbrushId = scan.toothbrushId,
                familyMemberId = scan.familyMemberId,
                imageUrl = scan.imageUrl,
                wearPercentage = scan.wearPercentage,
                healthScore = scan.healthScore,
                remainingLifeDays = scan.remainingLifeDays,
                condition = scan.condition,
                confidenceScore = scan.confidenceScore,
                bristleSpreading = scan.bristleSpreading,
                bristleBending = scan.bristleBending,
                bristleDamage = scan.bristleDamage,
                brushingFrequency = scan.brushingFrequency,
                detectedIssues = scan.detectedIssues,
                aiRecommendation = scan.aiRecommendation
            )

            val res = safeApiCall { scanApi.saveScan(req) }
            when (res) {
                is Resource.Success -> {
                    val dto = res.data
                    val serverId = dto.id ?: scan.id
                    android.util.Log.d("SYNC", "[SYNC] HTTP status = 201")
                    android.util.Log.d("SYNC", "[SYNC] SYNCED")

                    scanDao.deleteById(scan.id)
                    val syncedEntity = ScanEntity(
                        id = serverId,
                        toothbrushId = dto.toothbrushId ?: scan.toothbrushId,
                        imageUrl = dto.imageUrl ?: scan.imageUrl,
                        wearPercentage = dto.wearPercentage ?: scan.wearPercentage,
                        healthScore = dto.healthScore ?: scan.healthScore,
                        remainingLifeDays = dto.remainingLifeDays ?: scan.remainingLifeDays,
                        condition = dto.condition ?: scan.condition,
                        confidenceScore = dto.confidenceScore ?: scan.confidenceScore,
                        bristleSpreading = dto.bristleSpreading ?: scan.bristleSpreading,
                        bristleBending = dto.bristleBending ?: scan.bristleBending,
                        bristleDamage = dto.bristleDamage ?: scan.bristleDamage,
                        brushingFrequency = dto.brushingFrequency ?: scan.brushingFrequency,
                        detectedIssues = dto.detectedIssues ?: scan.detectedIssues,
                        aiRecommendation = dto.aiRecommendation ?: scan.aiRecommendation,
                        scanDate = dto.scanDate ?: scan.scanDate,
                        syncStatus = "SYNCED",
                        syncError = null,
                        familyMemberId = scan.familyMemberId
                    )
                    scanDao.insert(syncedEntity)
                    syncedCount++
                }
                is Resource.Error -> {
                    val exception = res.exception
                    val httpCode = (exception as? retrofit2.HttpException)?.code() ?: 0
                    android.util.Log.d("SYNC", "[SYNC] HTTP status = $httpCode")

                    if (httpCode in 400..499) {
                        android.util.Log.e("SYNC", "[SYNC] FAILED — permanent failure")
                        val errorMsg = res.message ?: "Permanent validation error ($httpCode)"
                        scanDao.updateSyncStatus(scan.id, "FAILED", errorMsg)
                    } else {
                        android.util.Log.d("SYNC", "[SYNC] PENDING — temporary failure")
                    }
                }
                is Resource.Loading -> {}
            }
        }
        return Resource.Success(syncedCount)
    }

    override suspend fun getScanDetails(id: String): Resource<ScanReport> {
        val cached = scanDao.getById(id)
        if (cached != null) {
            return Resource.Success(
                ScanReport(
                    cached.id, cached.toothbrushId, cached.imageUrl, cached.wearPercentage, cached.healthScore,
                    cached.remainingLifeDays, cached.condition, cached.confidenceScore, cached.bristleSpreading,
                    cached.bristleBending, cached.bristleDamage, cached.brushingFrequency,
                    cached.detectedIssues, cached.aiRecommendation, cached.scanDate,
                    cached.syncStatus, cached.syncError
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
                        scanDate = dto.scanDate ?: "",
                        syncStatus = "SYNCED",
                        syncError = null
                    )
                )
            }
            is Resource.Error -> Resource.Error(res.exception, res.message)
            is Resource.Loading -> Resource.Loading
        }
    }
}
