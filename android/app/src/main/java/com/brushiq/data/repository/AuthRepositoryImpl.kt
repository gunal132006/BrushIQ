package com.brushiq.data.repository

import com.brushiq.data.local.UserDao
import com.brushiq.data.local.UserEntity
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
    private val preferenceManager: PreferenceManager
) : AuthRepository {

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
            authApi.login(LoginRequest(username, password))
        }
        android.util.Log.d("AuthFlow", "AuthRepositoryImpl.login: received response result: $res")
        return when (res) {
            is Resource.Success -> {
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

    override suspend fun googleLogin(
        googleId: String,
        email: String,
        fullName: String,
        photoUrl: String?
    ): Resource<User> {
        val res = safeApiCall {
            authApi.googleLogin(GoogleLoginRequest(googleId, email, fullName, photoUrl))
        }
        return when (res) {
            is Resource.Success -> {
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
        val res = safeApiCall {
            authApi.forgotPassword(ForgotPasswordRequest(email, phone))
        }
        return when (res) {
            is Resource.Success -> Resource.Success(res.data.message)
            is Resource.Error -> Resource.Error(res.exception, res.message)
            is Resource.Loading -> Resource.Loading
        }
    }

    override suspend fun logout(): Resource<Unit> {
        userDao.clear()
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
        val res = safeApiCall { authApi.healthCheck() }
        return when (res) {
            is Resource.Success -> Resource.Success(res.data.message)
            is Resource.Error -> Resource.Error(res.exception, res.message)
            is Resource.Loading -> Resource.Loading
        }
    }
}
