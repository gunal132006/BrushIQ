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
        Resource.Error(e, "Connection timeout or no internet. Please check your network connection.")
    } catch (e: retrofit2.HttpException) {
        val msg = when (e.code()) {
            401 -> "Unauthorized. Please log in again."
            403 -> "Access denied."
            404 -> "Requested resource not found on server."
            500 -> "Server error. Our team is working on it."
            else -> "Network error: ${e.message()}"
        }
        Resource.Error(e, msg)
    } catch (e: Exception) {
        Resource.Error(e, e.localizedMessage ?: "An unknown error occurred.")
    }
}
