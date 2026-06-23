package com.brushiq.domain.repository

import com.brushiq.util.Resource
import kotlinx.coroutines.flow.Flow
import java.io.File

interface ScanRepository {
    fun getScansHistory(toothbrushId: String): Flow<Resource<List<ScanReport>>>
    suspend fun syncScansHistory(toothbrushId: String): Resource<Unit>
    suspend fun analyzeScan(imageFile: File): Resource<ScanReport>
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
    ): Resource<ScanReport>
    suspend fun getScanDetails(id: String): Resource<ScanReport>
}
