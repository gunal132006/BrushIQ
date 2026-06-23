package com.brushiq.data.remote

import retrofit2.http.GET

interface ProfileApi {
    @GET("auth/me")
    suspend fun getMe(): UserDto

    @GET("dashboard")
    suspend fun getDashboardData(): DashboardResponse
}
