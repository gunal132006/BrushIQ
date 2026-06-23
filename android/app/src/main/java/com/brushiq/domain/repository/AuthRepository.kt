package com.brushiq.domain.repository

import com.brushiq.util.Resource
import kotlinx.coroutines.flow.Flow

interface AuthRepository {
    suspend fun register(fullName: String, email: String?, phone: String?, password: String): Resource<User>
    suspend fun login(username: String, password: String): Resource<User>
    suspend fun googleLogin(googleId: String, email: String, fullName: String, photoUrl: String?): Resource<User>
    suspend fun forgotPassword(email: String?, phone: String?): Resource<String>
    suspend fun logout(): Resource<Unit>
    fun getSessionToken(): Flow<String?>
    fun isLoggedIn(): Flow<Boolean>
    suspend fun checkHealth(): Resource<String>
}
