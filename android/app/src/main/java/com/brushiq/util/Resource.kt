package com.brushiq.util

sealed class Resource<out T> {
    data class Success<out T>(val data: T) : Resource<T>()
    data class Error(val exception: Throwable, val message: String? = null) : Resource<Nothing>()
    object Loading : Resource<Nothing>()
}

suspend inline fun <T> safeApiCall(crossinline call: suspend () -> T): Resource<T> {
    return try {
        Resource.Success(call())
    } catch (e: java.io.IOException) {
        android.util.Log.e("NetworkDiag", "IOException in safeApiCall: ${e.javaClass.simpleName} - ${e.message}", e)
        Resource.Error(e, "Connection error: ${e.message ?: "timeout or no internet"}")
    } catch (e: retrofit2.HttpException) {
        val errorBody = try {
            e.response()?.errorBody()?.string()
        } catch (ex: Exception) {
            null
        }
        val code = e.code()
        val url = e.response()?.raw()?.request?.url
        val method = e.response()?.raw()?.request?.method
        
        val diagnosticMsg = "HTTP $code $method $url\nResponse: $errorBody"
        android.util.Log.e("NetworkDiag", diagnosticMsg, e)

        val userMsg = if (!errorBody.isNullOrBlank()) {
            errorBody
        } else {
            when (code) {
                400 -> "Bad Request"
                401 -> "Unauthorized. Please log in again."
                403 -> "Access denied."
                404 -> "Not Found: $url"
                500 -> "Server error. Our team is working on it."
                else -> "Network error ($code): ${e.message()}"
            }
        }
        Resource.Error(e, userMsg)
    } catch (e: Exception) {
        android.util.Log.e("NetworkDiag", "Unknown exception in safeApiCall", e)
        Resource.Error(e, e.localizedMessage ?: "An unknown error occurred.")
    }
}
