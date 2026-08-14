package com.brushiq.data.repository

import com.brushiq.data.local.UserDao
import com.brushiq.data.local.UserEntity
import com.brushiq.data.local.FamilyMemberDao
import com.brushiq.data.local.ToothbrushDao
import com.brushiq.data.local.ScanDao
import com.brushiq.data.local.ReminderDao
import com.brushiq.data.remote.AuthApi
import com.brushiq.data.remote.LoginRequest
import com.brushiq.data.remote.RegisterRequest
import com.brushiq.data.remote.GoogleLoginRequest
import com.brushiq.data.remote.ForgotPasswordRequest
import com.brushiq.domain.repository.AuthRepository
import com.brushiq.domain.repository.User
import com.brushiq.util.PreferenceManager
import com.brushiq.util.Resource
import com.brushiq.util.safeApiCall
import com.google.firebase.auth.FirebaseAuth
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AuthRepositoryImpl @Inject constructor(
    private val authApi: AuthApi,
    private val userDao: UserDao,
    private val familyMemberDao: FamilyMemberDao,
    private val toothbrushDao: ToothbrushDao,
    private val scanDao: ScanDao,
    private val reminderDao: ReminderDao,
    private val preferenceManager: PreferenceManager
) : AuthRepository {

    private suspend fun clearLocalCache() {
        userDao.clear()
        familyMemberDao.clearAll()
        toothbrushDao.clearAll()
        scanDao.clearAll()
        reminderDao.clearAll()
    }

    override suspend fun register(
        fullName: String,
        email: String?,
        phone: String?,
        password: String
    ): Resource<User> {
        android.util.Log.d("AuthFlow", "AuthRepositoryImpl.register: sending request to API for user '$fullName'")
        val res = safeApiCall {
            authApi.register(RegisterRequest(fullName, email, phone, password))
        }
        android.util.Log.d("AuthFlow", "AuthRepositoryImpl.register: received response result: $res")
        return when (res) {
            is Resource.Success -> {
                clearLocalCache()
                val authRes = res.data
                preferenceManager.saveToken(authRes.token)
                authRes.refreshToken?.let { preferenceManager.saveRefreshToken(it) }
                
                val userDto = authRes.user
                preferenceManager.saveUserSession(userDto.id)
                
                val userEntity = UserEntity(userDto.id, userDto.fullName, userDto.email, userDto.phone, userDto.createdAt)
                userDao.insert(userEntity)
                
                Resource.Success(User(userDto.id, userDto.fullName, userDto.email, userDto.phone, userDto.createdAt))
            }
            is Resource.Error -> Resource.Error(res.exception, res.message)
            is Resource.Loading -> Resource.Loading
        }
    }

    override suspend fun login(username: String, password: String): Resource<User> {
        android.util.Log.d("AuthFlow", "AuthRepositoryImpl.login: sending request to API for username '$username'")
        val res = safeApiCall {
            authApi.login(LoginRequest(username = username, email = username, password = password))
        }
        android.util.Log.d("AuthFlow", "AuthRepositoryImpl.login: received response result: $res")
        return when (res) {
            is Resource.Success -> {
                clearLocalCache()
                val authRes = res.data
                preferenceManager.saveToken(authRes.token)
                authRes.refreshToken?.let { preferenceManager.saveRefreshToken(it) }
                
                val userDto = authRes.user
                preferenceManager.saveUserSession(userDto.id)
                
                val userEntity = UserEntity(userDto.id, userDto.fullName, userDto.email, userDto.phone, userDto.createdAt)
                userDao.insert(userEntity)
                
                Resource.Success(User(userDto.id, userDto.fullName, userDto.email, userDto.phone, userDto.createdAt))
            }
            is Resource.Error -> Resource.Error(res.exception, res.message)
            is Resource.Loading -> Resource.Loading
        }
    }

    override suspend fun googleLogin(idToken: String): Resource<User> {
        val res = safeApiCall {
            authApi.googleLogin(GoogleLoginRequest(idToken))
        }
        return when (res) {
            is Resource.Success -> {
                clearLocalCache()
                val authRes = res.data
                preferenceManager.saveToken(authRes.token)
                authRes.refreshToken?.let { preferenceManager.saveRefreshToken(it) }

                val userDto = authRes.user
                preferenceManager.saveUserSession(userDto.id)

                val userEntity = UserEntity(userDto.id, userDto.fullName, userDto.email, userDto.phone, userDto.createdAt)
                userDao.insert(userEntity)

                Resource.Success(User(userDto.id, userDto.fullName, userDto.email, userDto.phone, userDto.createdAt))
            }
            is Resource.Error -> Resource.Error(res.exception, res.message)
            is Resource.Loading -> Resource.Loading
        }
    }

    override suspend fun forgotPassword(email: String?, phone: String?): Resource<String> {
        val activeBaseUrl = com.brushiq.config.NetworkConfig.getActiveBaseUrl()
        android.util.Log.d("AUTH", "[AUTH] Forgot password request started")
        android.util.Log.d("AUTH", "[AUTH] Base URL host = brushiq-backend.onrender.com")
        val res = safeApiCall {
            authApi.forgotPassword(ForgotPasswordRequest(email, phone))
        }
        return when (res) {
            is Resource.Success -> {
                android.util.Log.d("AUTH", "[AUTH] Forgot password request completed")
                android.util.Log.d("AUTH", "[AUTH] HTTP status = 200")
                Resource.Success(res.data.message ?: "If an account exists for this email, a password reset link has been sent.")
            }
            is Resource.Error -> {
                val isTimeout = res.exception is java.net.SocketTimeoutException || res.message?.lowercase()?.contains("timeout") == true
                android.util.Log.e("AUTH", "[AUTH] Forgot password request failed")
                android.util.Log.e("AUTH", "[AUTH] Error type = ${if (isTimeout) "timeout" else res.exception.javaClass.simpleName}")
                Resource.Error(res.exception, res.message)
            }
            is Resource.Loading -> Resource.Loading
        }
    }

    override suspend fun logout(): Resource<Unit> {
        userDao.clear()
        familyMemberDao.clearAll()
        toothbrushDao.clearAll()
        scanDao.clearAll()
        reminderDao.clearAll()
        preferenceManager.clearAll()
        try {
            FirebaseAuth.getInstance().signOut()
        } catch (e: Exception) {
            android.util.Log.e("AuthFlow", "Firebase signOut in AuthRepositoryImpl failed", e)
        }
        return Resource.Success(Unit)
    }

    override fun getSessionToken(): Flow<String?> = preferenceManager.userToken

    override fun isLoggedIn(): Flow<Boolean> = preferenceManager.userToken.map { it != null }

    override suspend fun checkHealth(): Resource<String> {
        val activeBaseUrl = com.brushiq.config.NetworkConfig.getActiveBaseUrl()
        android.util.Log.d("BrushIQ Startup", "[BrushIQ Startup] Starting health check")
        android.util.Log.d("BrushIQ Network", "[BrushIQ Network] Base URL: $activeBaseUrl")
        android.util.Log.d("BrushIQ Network", "[BrushIQ Network] Health URL: ${activeBaseUrl}health")

        val res = safeApiCall { authApi.healthCheck() }
        return when (res) {
            is Resource.Success -> {
                val dto = res.data
                android.util.Log.d("BrushIQ Network", "[BrushIQ Network] Response parsed - status: ${dto.status}, database: ${dto.database}, message: ${dto.message}")
                val isHealthy = dto.status?.equals("UP", ignoreCase = true) == true ||
                                dto.database?.equals("CONNECTED", ignoreCase = true) == true ||
                                !dto.message.isNullOrBlank()
                if (isHealthy) {
                    android.util.Log.d("BrushIQ Startup", "[BrushIQ Startup] Health check SUCCESS")
                    Resource.Success(dto.status ?: "UP")
                } else {
                    android.util.Log.e("BrushIQ Startup", "[BrushIQ Startup] Health check FAILED: status=${dto.status}")
                    Resource.Error(Exception("Server status: ${dto.status}"), "Server unhealthy")
                }
            }
            is Resource.Error -> {
                android.util.Log.e("BrushIQ Startup", "[BrushIQ Startup] Health check FAILED: ${res.message}", res.exception)
                Resource.Error(res.exception, res.message)
            }
            is Resource.Loading -> Resource.Loading
        }
    }

    override suspend fun checkDatabaseStatus(): Resource<String> {
        val res = safeApiCall { authApi.getDatabaseStatus() }
        return when (res) {
            is Resource.Success -> Resource.Success(res.data.message ?: "CONNECTED")
            is Resource.Error -> Resource.Error(res.exception, res.message)
            is Resource.Loading -> Resource.Loading
        }
    }
}
