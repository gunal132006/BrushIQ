package com.brushiq.ui.viewmodel

import android.content.Context
import android.net.Uri
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.brushiq.domain.repository.ScanReport
import com.brushiq.domain.repository.ScanRepository
import com.brushiq.util.Resource
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import org.json.JSONObject
import java.io.File
import javax.inject.Inject

enum class ScanState {
    CAMERA_PREVIEW,
    IMAGE_PREVIEW,
    AI_PROCESSING
}

enum class ScanErrorType {
    CAMERA_INITIALIZATION,
    UPLOAD_FAILED,
    ANALYSIS_FAILED,
    TOOTHBRUSH_NOT_DETECTED,
    MULTIPLE_TOOTHBRUSHES,
    IMAGE_QUALITY_ERROR
}

data class ApiErrorPayload(
    val code: String = "",
    val message: String = "",
    val rawBody: String = ""
)

@HiltViewModel
class ScanViewModel @Inject constructor(
    private val scanRepository: ScanRepository
) : ViewModel() {

    private val _scanState = MutableStateFlow(ScanState.CAMERA_PREVIEW)
    val scanState: StateFlow<ScanState> = _scanState

    private val _capturedImageUri = MutableStateFlow<Uri?>(null)
    val capturedImageUri: StateFlow<Uri?> = _capturedImageUri

    private val _processingStep = MutableStateFlow(0)
    val processingStep: StateFlow<Int> = _processingStep

    private val _processingProgress = MutableStateFlow(0)
    val processingProgress: StateFlow<Int> = _processingProgress

    private val _mockResult = MutableStateFlow<ScanReport?>(null)
    val mockResult: StateFlow<ScanReport?> = _mockResult

    private val _errorState = MutableStateFlow<ScanErrorType?>(null)
    val errorState: StateFlow<ScanErrorType?> = _errorState

    private val _errorMessage = MutableStateFlow<String?>(null)
    val errorMessage: StateFlow<String?> = _errorMessage

    val processingSteps = listOf(
        "Loading Image",
        "Validating Image Quality",
        "Running Object Detection",
        "Verifying Toothbrush Count",
        "Segmenting Bristles",
        "Measuring Wear Metrics",
        "Generating Recommendation"
    )

    fun onImageCaptured(uri: Uri) {
        _capturedImageUri.value = uri
        _scanState.value = ScanState.IMAGE_PREVIEW
        _errorState.value = null
        _errorMessage.value = null
        _mockResult.value = null
    }

    fun retake() {
        _capturedImageUri.value = null
        _scanState.value = ScanState.CAMERA_PREVIEW
        _errorState.value = null
        _errorMessage.value = null
        _mockResult.value = null
    }

    fun setCameraError() {
        _errorState.value = ScanErrorType.CAMERA_INITIALIZATION
    }

    fun clearCameraError() {
        if (_errorState.value == ScanErrorType.CAMERA_INITIALIZATION) {
            _errorState.value = null
        }
    }

    private fun uriToFile(context: Context, uri: Uri): File? {
        return try {
            val contentResolver = context.contentResolver
            val file = File(context.cacheDir, "temp_scan_${System.currentTimeMillis()}.jpg")
            contentResolver.openInputStream(uri)?.use { input ->
                file.outputStream().use { output ->
                    input.copyTo(output)
                }
            }
            file
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }

    private fun parseApiErrorPayload(exception: Throwable?, rawMessage: String?): ApiErrorPayload {
        var code = ""
        var message = ""
        var bodyStr = rawMessage ?: ""

        if (exception is retrofit2.HttpException) {
            try {
                val body = exception.response()?.errorBody()?.string()
                if (!body.isNullOrBlank()) {
                    bodyStr = body
                }
            } catch (_: Exception) {}
        }

        if (bodyStr.isNotBlank()) {
            try {
                val cleanJson = if (bodyStr.startsWith("Bad Request: ")) {
                    bodyStr.substringAfter("Bad Request: ").trim()
                } else {
                    bodyStr.trim()
                }

                if (cleanJson.startsWith("{")) {
                    val json = JSONObject(cleanJson)
                    if (json.has("code")) {
                        code = json.optString("code", "")
                    }
                    if (json.has("message")) {
                        message = json.optString("message", "")
                    }
                }
            } catch (_: Exception) {}
        }

        if (code.isBlank()) {
            when {
                bodyStr.contains("TOOTHBRUSH_NOT_DETECTED") -> code = "TOOTHBRUSH_NOT_DETECTED"
                bodyStr.contains("MULTIPLE_TOOTHBRUSHES") -> code = "MULTIPLE_TOOTHBRUSHES"
                bodyStr.contains("IMAGE_QUALITY_ERROR") || bodyStr.contains("blurry") || bodyStr.contains("dark") || bodyStr.contains("overexposed") -> code = "IMAGE_QUALITY_ERROR"
            }
        }

        return ApiErrorPayload(code = code, message = message, rawBody = bodyStr)
    }

    fun startAiAnalysis(context: Context, onComplete: () -> Unit) {
        viewModelScope.launch {
            _scanState.value = ScanState.AI_PROCESSING
            _errorState.value = null
            _errorMessage.value = null
            _mockResult.value = null
            _processingStep.value = 0
            _processingProgress.value = 0
            
            val uri = _capturedImageUri.value
            if (uri == null) {
                _errorState.value = ScanErrorType.UPLOAD_FAILED
                return@launch
            }

            // Stage 0: Loading Image
            _processingStep.value = 0
            for (p in 0..15 step 5) {
                _processingProgress.value = p
                delay(80)
            }

            val imageFile = uriToFile(context, uri)
            if (imageFile == null) {
                _errorState.value = ScanErrorType.UPLOAD_FAILED
                return@launch
            }

            // Stage 1: Validating Image Quality
            _processingStep.value = 1
            for (p in 16..30 step 5) {
                _processingProgress.value = p
                delay(80)
            }

            // Stage 2: Object Detection (Network request)
            _processingStep.value = 2
            _processingProgress.value = 35

            val resultResource = scanRepository.analyzeScan(imageFile)

            for (p in 36..60 step 5) {
                _processingProgress.value = p
                delay(100)
            }

            when (resultResource) {
                is Resource.Success -> {
                    _processingStep.value = 3 // Verifying Toothbrush Count
                    delay(150)
                    _processingProgress.value = 75
                    
                    _processingStep.value = 4 // Segmenting Bristles
                    delay(150)
                    _processingProgress.value = 85
                    
                    _processingStep.value = 5 // Measuring Wear Metrics
                    delay(150)
                    _processingProgress.value = 95
                    
                    _processingStep.value = 6 // Generating Recommendation
                    delay(150)
                    _processingProgress.value = 100

                    _mockResult.value = resultResource.data
                    onComplete()
                }
                is Resource.Error -> {
                    val rawMsg = resultResource.message ?: ""
                    val exception = resultResource.exception
                    val httpCode = (exception as? retrofit2.HttpException)?.code() ?: 0

                    val payload = parseApiErrorPayload(exception, rawMsg)

                    android.util.Log.d("SCAN ERROR", "[SCAN ERROR] HTTP status = $httpCode")
                    android.util.Log.d("SCAN ERROR", "[SCAN ERROR] response body = ${payload.rawBody}")
                    android.util.Log.d("SCAN ERROR", "[SCAN ERROR] parsed code = ${payload.code}")

                    val mappedType = when {
                        // 1. Explicit validation error codes (HTTP 400 validation failures)
                        payload.code == "TOOTHBRUSH_NOT_DETECTED" || rawMsg.contains("TOOTHBRUSH_NOT_DETECTED") -> {
                            _errorMessage.value = if (payload.message.isNotBlank()) payload.message else "Toothbrush not detected. Please scan only a toothbrush."
                            ScanErrorType.TOOTHBRUSH_NOT_DETECTED
                        }
                        payload.code == "MULTIPLE_TOOTHBRUSHES" || rawMsg.contains("MULTIPLE_TOOTHBRUSHES") -> {
                            _errorMessage.value = if (payload.message.isNotBlank()) payload.message else "Multiple toothbrushes detected. Please scan only one toothbrush."
                            ScanErrorType.MULTIPLE_TOOTHBRUSHES
                        }
                        payload.code == "IMAGE_QUALITY_ERROR" || rawMsg.contains("IMAGE_QUALITY_ERROR") || rawMsg.contains("blurry") || rawMsg.contains("dark") -> {
                            _errorMessage.value = if (payload.message.isNotBlank()) payload.message else "Image quality check failed. Please ensure proper lighting and focus."
                            ScanErrorType.IMAGE_QUALITY_ERROR
                        }
                        // 2. HTTP 400 catch-all (Any HTTP 400 Bad Request MUST map to validation error, NEVER to upload failure!)
                        httpCode == 400 -> {
                            _errorMessage.value = if (payload.message.isNotBlank()) payload.message else "Toothbrush not detected. Please scan only a toothbrush."
                            ScanErrorType.TOOTHBRUSH_NOT_DETECTED
                        }
                        // 3. HTTP 500 Server Error
                        httpCode >= 500 -> {
                            _errorMessage.value = "Server error during AI analysis. Please try again later."
                            ScanErrorType.ANALYSIS_FAILED
                        }
                        // 4. Genuine Network/IO infrastructure failure (no internet, timeout, connection refused)
                        exception is java.io.IOException || exception is java.net.SocketTimeoutException || exception is java.net.UnknownHostException -> {
                            _errorMessage.value = "BrushIQ could not upload your image to the diagnostics engine. Please check your internet connection and try again."
                            ScanErrorType.UPLOAD_FAILED
                        }
                        // 5. Catch-all fallback
                        else -> {
                            _errorMessage.value = "Analysis failed. Please try again."
                            ScanErrorType.ANALYSIS_FAILED
                        }
                    }

                    _errorState.value = mappedType
                    android.util.Log.d("SCAN ERROR", "[SCAN ERROR] mapped error type = $mappedType")
                }
                is Resource.Loading -> {}
            }
        }
    }
}
