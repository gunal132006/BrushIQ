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
    ANALYSIS_FAILED
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

    val processingSteps = listOf(
        "Loading Image",
        "Segmenting Bristles",
        "Detecting Bristle Spread",
        "Measuring Density",
        "Calculating Health Score",
        "Predicting Remaining Life",
        "Generating Recommendation"
    )

    fun onImageCaptured(uri: Uri) {
        _capturedImageUri.value = uri
        _scanState.value = ScanState.IMAGE_PREVIEW
        _errorState.value = null
    }

    fun retake() {
        _capturedImageUri.value = null
        _scanState.value = ScanState.CAMERA_PREVIEW
        _errorState.value = null
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
            _processingStep.value = 0
            _processingProgress.value = 0
            
            // 1. Retrieve captured URI
            val uri = _capturedImageUri.value
            if (uri == null) {
                _errorState.value = ScanErrorType.UPLOAD_FAILED
                return@launch
            }

            // Stage 0: Loading Image
            _processingStep.value = 0
            for (p in 0..15 step 5) {
                _processingProgress.value = p
                delay(100)
            }

            // Resolve file from URI
            val imageFile = uriToFile(context, uri)
            if (imageFile == null) {
                _errorState.value = ScanErrorType.UPLOAD_FAILED
                return@launch
            }

            // Stage 1: Segmenting Bristles
            _processingStep.value = 1
            for (p in 16..30 step 5) {
                _processingProgress.value = p
                delay(100)
            }

            // Stage 2: Detecting Bristle Spread (Perform Network Upload/Analysis)
            _processingStep.value = 2
            _processingProgress.value = 35

            // Call real backend API service
            val resultResource = scanRepository.analyzeScan(imageFile)

            // Animate progress up to 75% while awaiting/processing
            for (p in 36..75 step 5) {
                _processingProgress.value = p
                delay(150)
            }

            when (resultResource) {
                is Resource.Success -> {
                    // Complete AI analysis states progression
                    _processingStep.value = 3 // Measuring Density
                    delay(200)
                    _processingProgress.value = 80
                    
                    _processingStep.value = 4 // Calculating Health Score
                    delay(200)
                    _processingProgress.value = 90
                    
                    _processingStep.value = 5 // Predicting Remaining Life
                    delay(200)
                    _processingProgress.value = 95
                    
                    _processingStep.value = 6 // Generating Recommendation
                    delay(200)
                    _processingProgress.value = 100

                    _mockResult.value = resultResource.data
                    onComplete()
                }
                is Resource.Error -> {
                    // If server throws a 500 (e.g. Jimp failure or active analysis fail), show AI Diagnostic Error.
                    // Otherwise, show network upload failed error.
                    val isServerException = resultResource.exception is retrofit2.HttpException &&
                            (resultResource.exception as retrofit2.HttpException).code() == 500
                    if (isServerException) {
                        _errorState.value = ScanErrorType.ANALYSIS_FAILED
                    } else {
                        _errorState.value = ScanErrorType.UPLOAD_FAILED
                    }
                }
                is Resource.Loading -> {}
            }
        }
    }
}
