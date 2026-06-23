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
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.GoogleAuthProvider
import androidx.credentials.CredentialManager
import androidx.credentials.GetCredentialRequest
import androidx.credentials.exceptions.GetCredentialException
import com.google.android.libraries.identity.googleid.GetGoogleIdOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException
import kotlinx.coroutines.suspendCancellableCoroutine
import com.brushiq.R

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

    fun loginWithGoogle(googleId: String, email: String, fullName: String, photoUrl: String?) {
        viewModelScope.launch {
            _authState.value = AuthState.Loading
            val res = authRepository.googleLogin(googleId, email, fullName, photoUrl)
            when (res) {
                is Resource.Success -> {
                    _isUserLoggedIn.value = true
                    _authState.value = AuthState.Success(res.data)
                }
                is Resource.Error -> {
                    _authState.value = AuthState.Error(res.message ?: "Google Login failed")
                }
                is Resource.Loading -> {
                    _authState.value = AuthState.Loading
                }
            }
        }
    }

    fun loginWithGoogleInteractive(context: Context) {
        viewModelScope.launch {
            _authState.value = AuthState.Loading
            try {
                android.util.Log.d("AuthFlow", "loginWithGoogleInteractive: Initializing Credential Manager...")
                val credentialManager = CredentialManager.create(context)
                val googleIdOption = GetGoogleIdOption.Builder()
                    .setFilterByAuthorizedAccounts(false)
                    .setServerClientId(context.getString(R.string.google_web_client_id).trim())
                    .setAutoSelectEnabled(false)
                    .build()
                
                val request = GetCredentialRequest.Builder()
                    .addCredentialOption(googleIdOption)
                    .build()
                
                android.util.Log.d("AuthFlow", "loginWithGoogleInteractive: Launching Google sign-in picker...")
                val result = credentialManager.getCredential(context, request)
                android.util.Log.d("AuthFlow", "loginWithGoogleInteractive: Received Credential Manager response")
                
                val credential = GoogleIdTokenCredential.createFrom(result.credential.data)
                val idToken = credential.idToken
                
                // Sign in to Firebase Auth
                val authCredential = GoogleAuthProvider.getCredential(idToken, null)
                val authResult = FirebaseAuth.getInstance().signInWithCredential(authCredential).awaitTask()
                val firebaseUser = authResult.user
                
                if (firebaseUser != null) {
                    val googleId = firebaseUser.uid
                    val email = firebaseUser.email ?: ""
                    val fullName = firebaseUser.displayName ?: firebaseUser.email ?: "Google User"
                    val photoUrl = firebaseUser.photoUrl?.toString()
                    
                    android.util.Log.d("AuthFlow", "loginWithGoogleInteractive: Firebase Auth success. Syncing with backend...")
                    val backendRes = authRepository.googleLogin(googleId, email, fullName, photoUrl)
                    when (backendRes) {
                        is Resource.Success -> {
                            _isUserLoggedIn.value = true
                            _authState.value = AuthState.Success(backendRes.data)
                        }
                        is Resource.Error -> {
                            _authState.value = AuthState.Error(backendRes.message ?: "Failed to sync user with BrushIQ backend")
                        }
                        is Resource.Loading -> {
                            _authState.value = AuthState.Loading
                        }
                    }
                } else {
                    _authState.value = AuthState.Error("Firebase Auth failed: user is null")
                }
            } catch (e: GetCredentialException) {
                android.util.Log.e("AuthFlow", "loginWithGoogleInteractive: Credential Manager exception", e)
                _authState.value = AuthState.Error("Google Sign-In canceled or failed")
            } catch (e: Exception) {
                android.util.Log.e("AuthFlow", "loginWithGoogleInteractive: Unexpected error during Google Sign-In", e)
                _authState.value = AuthState.Error(e.message ?: "Google Sign-In failed")
            }
        }
    }

    suspend fun silentSignIn(context: Context): Boolean {
        val clientId = try {
            context.getString(R.string.google_web_client_id).trim()
        } catch (e: Exception) {
            "unknown"
        }
        android.util.Log.d("AuthFlow", "silentSignIn: Started. google_web_client_id is '$clientId'")
        
        try {
            val firebaseAuth = FirebaseAuth.getInstance()
            val firebaseUser = firebaseAuth.currentUser
            if (firebaseUser != null) {
                android.util.Log.d("AuthFlow", "silentSignIn: Firebase current user found (uid=${firebaseUser.uid}). Refreshing token...")
                try {
                    val tokenResult = firebaseUser.getIdToken(false).awaitTask()
                    val idToken = tokenResult.token
                    if (idToken != null) {
                        val googleId = firebaseUser.uid
                        val email = firebaseUser.email ?: ""
                        val fullName = firebaseUser.displayName ?: firebaseUser.email ?: "Google User"
                        val photoUrl = firebaseUser.photoUrl?.toString()
                        
                        android.util.Log.d("AuthFlow", "silentSignIn: Logging in to BrushIQ backend...")
                        val backendRes = authRepository.googleLogin(googleId, email, fullName, photoUrl)
                        if (backendRes is Resource.Success) {
                            android.util.Log.d("AuthFlow", "silentSignIn: Backend login success via Firebase session")
                            _isUserLoggedIn.value = true
                            _authState.value = AuthState.Success(backendRes.data)
                            return true
                        } else {
                            val msg = (backendRes as? Resource.Error)?.message
                            android.util.Log.e("AuthFlow", "silentSignIn: Backend login failed: $msg")
                        }
                    } else {
                        android.util.Log.e("AuthFlow", "silentSignIn: Firebase idToken is null")
                    }
                } catch (e: Exception) {
                    android.util.Log.e("AuthFlow", "silentSignIn: Firebase token refresh failed", e)
                }
            } else {
                android.util.Log.d("AuthFlow", "silentSignIn: No Firebase current user found")
            }
            
            android.util.Log.d("AuthFlow", "silentSignIn: Attempting silent Credential Manager sign-in...")
            val credentialManager = CredentialManager.create(context)
            val googleIdOption = GetGoogleIdOption.Builder()
                .setFilterByAuthorizedAccounts(true)
                .setServerClientId(clientId)
                .setAutoSelectEnabled(true)
                .build()
            
            val request = GetCredentialRequest.Builder()
                .addCredentialOption(googleIdOption)
                .build()
            
            val result = credentialManager.getCredential(context, request)
            android.util.Log.d("AuthFlow", "silentSignIn: Credential Manager silent check returned success")
            val credential = GoogleIdTokenCredential.createFrom(result.credential.data)
            val idToken = credential.idToken
            
            android.util.Log.d("AuthFlow", "silentSignIn: Credential Manager token obtained. Signing in to Firebase...")
            val authCredential = GoogleAuthProvider.getCredential(idToken, null)
            val authResult = firebaseAuth.signInWithCredential(authCredential).awaitTask()
            val firebaseUser2 = authResult.user
            
            if (firebaseUser2 != null) {
                val googleId = firebaseUser2.uid
                val email = firebaseUser2.email ?: ""
                val fullName = firebaseUser2.displayName ?: firebaseUser2.email ?: "Google User"
                val photoUrl = firebaseUser2.photoUrl?.toString()
                
                android.util.Log.d("AuthFlow", "silentSignIn: Firebase sign-in success. Logging in to backend...")
                val backendRes = authRepository.googleLogin(googleId, email, fullName, photoUrl)
                if (backendRes is Resource.Success) {
                    android.util.Log.d("AuthFlow", "silentSignIn: Backend login success (Credential Manager)")
                    _isUserLoggedIn.value = true
                    _authState.value = AuthState.Success(backendRes.data)
                    return true
                } else {
                    val msg = (backendRes as? Resource.Error)?.message
                    android.util.Log.e("AuthFlow", "silentSignIn: Backend login failed (Credential Manager): $msg")
                }
            } else {
                android.util.Log.e("AuthFlow", "silentSignIn: Firebase sign-in returned null user (Credential Manager)")
            }
        } catch (e: GetCredentialException) {
            android.util.Log.e("AuthFlow", "silentSignIn: Credential Manager exception of type ${e.javaClass.name}: ${e.message}", e)
            return false
        } catch (e: Exception) {
            android.util.Log.e("AuthFlow", "silentSignIn: Silent sign-in encountered an exception of type ${e.javaClass.name}: ${e.message}", e)
        }
        
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
            try {
                FirebaseAuth.getInstance().signOut()
            } catch (e: Exception) {
                android.util.Log.e("AuthFlow", "Firebase signOut failed", e)
            }
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

private suspend fun <T> com.google.android.gms.tasks.Task<T>.awaitTask(): T {
    return suspendCancellableCoroutine { cont ->
        addOnCompleteListener { task ->
            if (task.isSuccessful) {
                cont.resume(task.result)
            } else {
                cont.resumeWithException(task.exception ?: Exception("Task failed"))
            }
        }
    }
}
