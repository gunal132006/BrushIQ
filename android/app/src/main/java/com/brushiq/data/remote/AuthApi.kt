package com.brushiq.data.remote

import retrofit2.http.Body
import retrofit2.http.POST

data class LoginRequest(val username: String, val password: String)
data class RegisterRequest(val fullName: String, val email: String?, val phone: String?, val password: String)
data class GoogleLoginRequest(val googleId: String, val email: String, val fullName: String, val photoUrl: String?)
data class ForgotPasswordRequest(val email: String?, val phone: String?)

data class AuthResponse(
    val token: String,
    val refreshToken: String?, // support refresh tokens
    val user: UserDto
)

interface AuthApi {
    @POST("auth/register")
    suspend fun register(@Body request: RegisterRequest): AuthResponse

    @POST("auth/login")
    suspend fun login(@Body request: LoginRequest): AuthResponse

    @POST("auth/google")
    suspend fun googleLogin(@Body request: GoogleLoginRequest): AuthResponse

    @POST("auth/forgot-password")
    suspend fun forgotPassword(@Body request: ForgotPasswordRequest): GenericMessageResponse

    @retrofit2.http.GET("health")
    suspend fun healthCheck(): GenericMessageResponse
}
