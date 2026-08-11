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
                    val msg = resultResource.message ?: ""
                    android.util.Log.e("AI_SCAN_ERROR", "Analysis failed with message: $msg", resultResource.exception)

                    if (msg.contains("TOOTHBRUSH_NOT_DETECTED")) {
                        _errorState.value = ScanErrorType.TOOTHBRUSH_NOT_DETECTED
                        _errorMessage.value = "Toothbrush not detected. Please scan only a toothbrush."
                    } else if (msg.contains("MULTIPLE_TOOTHBRUSHES")) {
                        _errorState.value = ScanErrorType.MULTIPLE_TOOTHBRUSHES
                        _errorMessage.value = "Multiple toothbrushes detected. Please scan only one toothbrush."
                    } else if (msg.contains("IMAGE_QUALITY_ERROR") || msg.contains("blurry") || msg.contains("dark") || msg.contains("overexposed")) {
                        _errorState.value = ScanErrorType.IMAGE_QUALITY_ERROR
                        _errorMessage.value = msg.substringAfter("Bad Request: ")
                    } else {
                        val isServerException = resultResource.exception is retrofit2.HttpException &&
                                (resultResource.exception as retrofit2.HttpException).code() == 500
                        if (isServerException) {
                            _errorState.value = ScanErrorType.ANALYSIS_FAILED
                        } else {
                            _errorState.value = ScanErrorType.UPLOAD_FAILED
                        }
                    }
                }
                is Resource.Loading -> {}
            }
        }
    }
}
