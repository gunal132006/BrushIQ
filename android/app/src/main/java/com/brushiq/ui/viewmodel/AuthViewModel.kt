package com.brushiq.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.brushiq.domain.repository.AuthRepository
import com.brushiq.domain.repository.ProfileRepository
import com.brushiq.domain.repository.User
import com.brushiq.util.Resource
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.launch
import javax.inject.Inject
import android.content.Context
import androidx.credentials.CredentialManager
import androidx.credentials.GetCredentialRequest
import com.google.android.libraries.identity.googleid.GetGoogleIdOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import com.brushiq.R
import androidx.credentials.exceptions.GetCredentialException

sealed class AuthState {
    object Idle : AuthState()
    object Loading : AuthState()
    data class Success(val user: User) : AuthState()
    data class Error(val message: String) : AuthState()
}

@HiltViewModel
class AuthViewModel @Inject constructor(
    private val authRepository: AuthRepository,
    private val profileRepository: ProfileRepository
) : ViewModel() {

    private val _authState = MutableStateFlow<AuthState>(AuthState.Idle)
    val authState: StateFlow<AuthState> = _authState

    private val _isUserLoggedIn = MutableStateFlow(false)
    val isUserLoggedIn: StateFlow<Boolean> = _isUserLoggedIn

    init {
        checkUserLoggedIn()
        performDiagnostics()
    }

    private fun performDiagnostics() {
        viewModelScope.launch {
            android.util.Log.d("NetworkDiag", "Starting connectivity diagnostics...")
            val health = authRepository.checkHealth()
            android.util.Log.d("NetworkDiag", "Health check result: $health")
            
            val dbStatus = authRepository.checkDatabaseStatus()
            android.util.Log.d("NetworkDiag", "Database status result: $dbStatus")
        }
    }

    private fun checkUserLoggedIn() {
        viewModelScope.launch {
            // Retrieve first state or collect
            val token = authRepository.getSessionToken().firstOrNull()
            if (token != null) {
                _isUserLoggedIn.value = true
                fetchProfile()
            } else {
                _isUserLoggedIn.value = false
            }
        }
    }

    private fun fetchProfile() {
        viewModelScope.launch {
            _authState.value = AuthState.Loading
            profileRepository.getUserProfile().collect { res ->
                when (res) {
                    is Resource.Success -> {
                        _authState.value = AuthState.Success(res.data)
                    }
                    is Resource.Error -> {
                        // Cache failed, try pulling from server
                        val remoteRes = profileRepository.fetchUserProfile()
                        if (remoteRes is Resource.Success) {
                            _authState.value = AuthState.Success(remoteRes.data)
                        } else if (remoteRes is Resource.Error) {
                            authRepository.logout()
                            _isUserLoggedIn.value = false
                            _authState.value = AuthState.Error(remoteRes.message ?: "Session expired")
                        }
                    }
                    is Resource.Loading -> {
                        _authState.value = AuthState.Loading
                    }
                }
            }
        }
    }

    fun login(username: String, password: CharSequence) {
        android.util.Log.d("AuthFlow", "AuthViewModel.login called: username=$username")
        viewModelScope.launch {
            _authState.value = AuthState.Loading
            val res = authRepository.login(username, password.toString())
            android.util.Log.d("AuthFlow", "AuthViewModel.login result: $res")
            when (res) {
                is Resource.Success -> {
                    _isUserLoggedIn.value = true
                    _authState.value = AuthState.Success(res.data)
                }
                is Resource.Error -> {
                    _authState.value = AuthState.Error(res.message ?: "Invalid login credentials")
                }
                is Resource.Loading -> {
                    _authState.value = AuthState.Loading
                }
            }
        }
    }

    fun register(fullName: String, email: String?, phone: String?, password: CharSequence) {
        android.util.Log.d("AuthFlow", "AuthViewModel.register called: fullName=$fullName, email=$email, phone=$phone")
        viewModelScope.launch {
            _authState.value = AuthState.Loading
            val res = authRepository.register(fullName, email, phone, password.toString())
            android.util.Log.d("AuthFlow", "AuthViewModel.register result: $res")
            when (res) {
                is Resource.Success -> {
                    _isUserLoggedIn.value = true
                    _authState.value = AuthState.Success(res.data)
                }
                is Resource.Error -> {
                    _authState.value = AuthState.Error(res.message ?: "Registration failed")
                }
                is Resource.Loading -> {
                    _authState.value = AuthState.Loading
                }
            }
        }
    }

    fun resetAuthState() {
        android.util.Log.d("AuthFlow", "AuthViewModel.resetAuthState called")
        _authState.value = AuthState.Idle
    }

    fun loginWithGoogle(context: Context) {
        viewModelScope.launch {
            _authState.value = AuthState.Loading
            try {
                val credentialManager = CredentialManager.create(context)
                val googleIdOption = GetGoogleIdOption.Builder()
                    .setFilterByAuthorizedAccounts(false)
                    .setServerClientId(context.getString(R.string.google_web_client_id).trim())
                    .setAutoSelectEnabled(false)
                    .build()

                val request = GetCredentialRequest.Builder()
                    .addCredentialOption(googleIdOption)
                    .build()

                val result = credentialManager.getCredential(context, request)
                val credential = GoogleIdTokenCredential.createFrom(result.credential.data)
                val idToken = credential.idToken

                val res = authRepository.googleLogin(idToken)
                when (res) {
                    is Resource.Success -> {
                        _isUserLoggedIn.value = true
                        _authState.value = AuthState.Success(res.data)
                    }
                    is Resource.Error -> {
                        _authState.value = AuthState.Error(res.message ?: "Google Sign-In failed")
                    }
                    is Resource.Loading -> {
                        _authState.value = AuthState.Loading
                    }
                }
            } catch (e: GetCredentialException) {
                android.util.Log.e("AuthFlow", "Google Sign-In cancelled or failed", e)
                _authState.value = AuthState.Error("Google Sign-In cancelled")
            } catch (e: Exception) {
                android.util.Log.e("AuthFlow", "Unexpected error during Google Sign-In", e)
                _authState.value = AuthState.Error(e.localizedMessage ?: "An unexpected error occurred")
            }
        }
    }

    suspend fun silentSignIn(context: Context): Boolean {
        // CredentialManager is not initialized automatically on startup.
        return false
    }

    fun forgotPassword(email: String?, phone: String?, onResult: (String) -> Unit) {
        viewModelScope.launch {
            val res = authRepository.forgotPassword(email, phone)
            when (res) {
                is Resource.Success -> onResult(res.data)
                is Resource.Error -> onResult(res.message ?: "Request failed")
                is Resource.Loading -> { /* do nothing */ }
            }
        }
    }

    fun logout(onComplete: () -> Unit) {
        viewModelScope.launch {
            authRepository.logout()
            _isUserLoggedIn.value = false
            _authState.value = AuthState.Idle
            onComplete()
        }
    }

    suspend fun checkServerHealth(): Boolean {
        android.util.Log.d("AuthFlow", "AuthViewModel.checkServerHealth: Checking backend health...")
        val res = authRepository.checkHealth()
        android.util.Log.d("AuthFlow", "AuthViewModel.checkServerHealth result: $res")
        return res is Resource.Success
    }
}
