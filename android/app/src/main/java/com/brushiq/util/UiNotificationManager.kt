package com.brushiq.util

import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import org.json.JSONObject
import java.util.UUID

enum class NotificationType {
    SUCCESS,
    ERROR,
    WARNING,
    INFO
}

data class NotificationData(
    val id: String = UUID.randomUUID().toString(),
    val type: NotificationType,
    val title: String,
    val message: String,
    val durationMs: Long = 3500L
)

object NotificationErrorMapper {

    fun mapErrorToNotification(rawErrorOrCode: String, fallbackType: NotificationType = NotificationType.ERROR): NotificationData {
        var input = rawErrorOrCode.trim()
        
        // Strip "Save Failed: " or "Error: " prefix if present
        if (input.startsWith("Save Failed:", ignoreCase = true)) {
            input = input.substringAfter(":").trim()
        } else if (input.startsWith("Error:", ignoreCase = true)) {
            input = input.substringAfter(":").trim()
        }

        var code = ""
        var detectedObject = ""
        var jsonMessage = ""

        // Try parsing JSON if raw error contains JSON object
        if (input.contains("{") && input.contains("}")) {
            val jsonStr = input.substring(input.indexOf("{"), input.lastIndexOf("}") + 1)
            try {
                val json = JSONObject(jsonStr)
                code = json.optString("code", "")
                detectedObject = json.optString("detectedObject", "")
                jsonMessage = json.optString("message", "")
            } catch (_: Exception) {
                // Ignore JSON parse errors
            }
        }

        if (code.isBlank()) {
            when {
                input.contains("TOOTHBRUSH_SELECTION_REQUIRED", ignoreCase = true) -> code = "TOOTHBRUSH_SELECTION_REQUIRED"
                input.contains("TOOTHBRUSH_NOT_DETECTED", ignoreCase = true) -> code = "TOOTHBRUSH_NOT_DETECTED"
                input.contains("MULTIPLE_TOOTHBRUSHES", ignoreCase = true) -> code = "MULTIPLE_TOOTHBRUSHES"
                input.contains("NON_TOOTHBRUSH_OBJECT", ignoreCase = true) -> code = "NON_TOOTHBRUSH_OBJECT"
                input.contains("NO_INTERNET", ignoreCase = true) || input.contains("NETWORK_ERROR", ignoreCase = true) -> code = "NETWORK_ERROR"
                input.contains("SAVE_SUCCESS", ignoreCase = true) -> code = "SAVE_SUCCESS"
                input.contains("OFFLINE_SAVE", ignoreCase = true) -> code = "OFFLINE_SAVE"
                input.contains("INVALID_CREDENTIALS", ignoreCase = true) || input.contains("invalid email or password", ignoreCase = true) -> code = "INVALID_CREDENTIALS"
            }
        }

        // Object detection string extraction if code is NON_TOOTHBRUSH_OBJECT
        if (code == "NON_TOOTHBRUSH_OBJECT" && detectedObject.isBlank()) {
            val lower = input.lowercase()
            when {
                lower.contains("laptop") -> detectedObject = "laptop"
                lower.contains("phone") || lower.contains("mobile") || lower.contains("cell") -> detectedObject = "phone"
                lower.contains("person") || lower.contains("human") -> detectedObject = "human"
                lower.contains("bottle") -> detectedObject = "bottle"
                lower.contains("plant") -> detectedObject = "plant"
            }
        }

        // Map code to user-friendly title and message
        return when (code) {
            "TOOTHBRUSH_SELECTION_REQUIRED" -> NotificationData(
                type = NotificationType.ERROR,
                title = "Toothbrush Required",
                message = "Please select a toothbrush before saving the report."
            )
            "TOOTHBRUSH_NOT_DETECTED" -> NotificationData(
                type = NotificationType.ERROR,
                title = "Toothbrush Not Detected",
                message = "Please scan only a toothbrush."
            )
            "MULTIPLE_TOOTHBRUSHES" -> NotificationData(
                type = NotificationType.WARNING,
                title = "Multiple Toothbrushes Detected",
                message = "Please scan only one toothbrush."
            )
            "NON_TOOTHBRUSH_OBJECT" -> {
                val objectTitle = when (detectedObject.lowercase()) {
                    "laptop" -> "Laptop Detected"
                    "phone", "mobile phone", "cell phone" -> "Phone Detected"
                    "human", "person" -> "Human Detected"
                    "bottle" -> "Bottle Detected"
                    "plant" -> "Plant Detected"
                    else -> if (detectedObject.isNotBlank()) "${detectedObject.replaceFirstChar { if (it.isLowerCase()) it.titlecase() else it.toString() }} Detected" else "Object Detected"
                }
                NotificationData(
                    type = NotificationType.WARNING,
                    title = objectTitle,
                    message = "Please scan only a toothbrush."
                )
            }
            "NETWORK_ERROR", "NO_INTERNET" -> NotificationData(
                type = NotificationType.ERROR,
                title = "No Internet Connection",
                message = "Check your internet connection and try again."
            )
            "SAVE_SUCCESS" -> NotificationData(
                type = NotificationType.SUCCESS,
                title = "Report Saved",
                message = "Your diagnostic report has been saved successfully."
            )
            "OFFLINE_SAVE" -> NotificationData(
                type = NotificationType.INFO,
                title = "Saved Locally",
                message = "Your report will sync automatically when internet returns."
            )
            "INVALID_CREDENTIALS" -> NotificationData(
                type = NotificationType.ERROR,
                title = "Login Failed",
                message = "Invalid email or password. Please try again."
            )
            else -> {
                // Network or IOException check
                if (input.contains("java.io.IOException") || input.contains("UnknownHostException") || input.contains("SocketTimeoutException") || input.contains("Connection error")) {
                    return NotificationData(
                        type = NotificationType.ERROR,
                        title = "No Internet Connection",
                        message = "Check your internet connection and try again."
                    )
                }

                // If jsonMessage exists and is not raw json, use it
                val cleanMsg = when {
                    jsonMessage.isNotBlank() -> jsonMessage
                    input.isNotBlank() && !input.contains("{") -> input
                    else -> "An unexpected error occurred. Please try again."
                }

                val title = when (fallbackType) {
                    NotificationType.ERROR -> "Action Failed"
                    NotificationType.WARNING -> "Attention Required"
                    NotificationType.SUCCESS -> "Operation Successful"
                    NotificationType.INFO -> "Information"
                }

                NotificationData(
                    type = fallbackType,
                    title = title,
                    message = cleanMsg
                )
            }
        }
    }
}

/**
 * Global lifecycle-safe notification state manager.
 * Holds zero references to Activity, Context, Composable, View, NavController, or Fragment.
 * Pure Kotlin StateFlow state holder.
 */
object UiNotificationManager {

    private val _currentNotification = MutableStateFlow<NotificationData?>(null)
    val currentNotification: StateFlow<NotificationData?> = _currentNotification.asStateFlow()

    private var lastTitle: String = ""
    private var lastMessage: String = ""
    private var lastShowTimeMs: Long = 0L

    private fun isDuplicate(title: String, message: String): Boolean {
        val now = System.currentTimeMillis()
        if (title == lastTitle && message == lastMessage && (now - lastShowTimeMs < 2500L)) {
            return true
        }
        lastTitle = title
        lastMessage = message
        lastShowTimeMs = now
        return false
    }

    fun showSuccess(title: String, message: String, durationMs: Long = 3500L) {
        if (isDuplicate(title, message)) return
        _currentNotification.value = NotificationData(
            type = NotificationType.SUCCESS,
            title = title,
            message = message,
            durationMs = durationMs
        )
    }

    fun showError(title: String, message: String, durationMs: Long = 3500L) {
        if (isDuplicate(title, message)) return
        _currentNotification.value = NotificationData(
            type = NotificationType.ERROR,
            title = title,
            message = message,
            durationMs = durationMs
        )
    }

    /**
     * Parses raw error strings or backend error codes into a friendly NotificationData card.
     */
    fun showError(rawErrorOrCode: String, durationMs: Long = 3500L) {
        val mapped = NotificationErrorMapper.mapErrorToNotification(rawErrorOrCode, NotificationType.ERROR)
        if (isDuplicate(mapped.title, mapped.message)) return
        _currentNotification.value = mapped.copy(durationMs = durationMs)
    }

    fun showWarning(title: String, message: String, durationMs: Long = 3500L) {
        if (isDuplicate(title, message)) return
        _currentNotification.value = NotificationData(
            type = NotificationType.WARNING,
            title = title,
            message = message,
            durationMs = durationMs
        )
    }

    fun showInfo(title: String, message: String, durationMs: Long = 3500L) {
        if (isDuplicate(title, message)) return
        _currentNotification.value = NotificationData(
            type = NotificationType.INFO,
            title = title,
            message = message,
            durationMs = durationMs
        )
    }

    fun show(data: NotificationData) {
        if (isDuplicate(data.title, data.message)) return
        _currentNotification.value = data
    }

    fun dismiss() {
        _currentNotification.value = null
    }
}
