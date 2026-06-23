package com.brushiq.data.remote

import okhttp3.MultipartBody
import retrofit2.http.*

data class SaveScanRequest(
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
    val aiRecommendation: String
)

interface ScanApi {
    @Multipart
    @POST("scans/analyze")
    suspend fun analyzeScan(@Part image: MultipartBody.Part): ScanDto

    @POST("scans")
    suspend fun saveScan(@Body request: SaveScanRequest): ScanDto

    @GET("scans")
    suspend fun getScansHistory(@Query("toothbrushId") toothbrushId: String): List<ScanDto>

    @GET("scans/{id}")
    suspend fun getScanDetails(@Path("id") id: String): ScanDto
}
