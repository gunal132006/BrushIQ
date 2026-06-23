package com.brushiq.data.remote

import retrofit2.http.*

data class ToothbrushRequest(
    val familyMemberId: String,
    val brand: String,
    val model: String,
    val color: String,
    val type: String,
    val purchaseDate: String
)

interface ToothbrushApi {
    @GET("toothbrushes")
    suspend fun getToothbrushes(@Query("familyMemberId") familyMemberId: String?): List<ToothbrushDto>

    @POST("toothbrushes")
    suspend fun addToothbrush(@Body request: ToothbrushRequest): ToothbrushDto

    @PUT("toothbrushes/{id}")
    suspend fun updateToothbrush(@Path("id") id: String, @Body request: ToothbrushRequest): ToothbrushDto

    @DELETE("toothbrushes/{id}")
    suspend fun deleteToothbrush(@Path("id") id: String): GenericMessageResponse
}
