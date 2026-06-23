package com.brushiq.data.remote

import retrofit2.http.GET
import retrofit2.http.Query

interface TipsApi {
    @GET("tips")
    suspend fun getTips(): List<TipDto>

    @GET("tips/personalized")
    suspend fun getPersonalizedTips(@Query("familyMemberId") familyMemberId: String): List<TipDto>
}
