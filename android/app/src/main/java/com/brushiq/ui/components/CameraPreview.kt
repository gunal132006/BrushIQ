package com.brushiq.ui.components

import android.content.Context
import android.net.Uri
import android.util.Log
import androidx.camera.core.*
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import java.io.File
import java.text.SimpleDateFormat
import java.util.*
import java.util.concurrent.Executor
import kotlin.coroutines.resume
import kotlin.coroutines.suspendCoroutine

@Composable
fun CameraPreview(
    modifier: Modifier = Modifier,
    cameraSelector: CameraSelector = CameraSelector.DEFAULT_BACK_CAMERA,
    onImageCaptured: (Uri) -> Unit,
    flashMode: Int = ImageCapture.FLASH_MODE_OFF,
    captureTrigger: Boolean,
    onCaptureProcessed: () -> Unit
) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    val previewView = remember { PreviewView(context) }
    val imageCapture = remember { ImageCapture.Builder().setFlashMode(flashMode).build() }

    LaunchedEffect(cameraSelector, flashMode) {
        val cameraProvider = context.getCameraProvider()
        val preview = Preview.Builder().build()
        
        preview.setSurfaceProvider(previewView.surfaceProvider)
        imageCapture.flashMode = flashMode

        try {
            cameraProvider.unbindAll()
            cameraProvider.bindToLifecycle(
                lifecycleOwner,
                cameraSelector,
                preview,
                imageCapture
            )
        } catch (e: Exception) {
            Log.e("CameraPreview", "Binding failed", e)
        }
    }

    LaunchedEffect(captureTrigger) {
        if (captureTrigger) {
            takePhoto(
                context = context,
                imageCapture = imageCapture,
                executor = ContextCompat.getMainExecutor(context),
                onImageCaptured = onImageCaptured
            )
            onCaptureProcessed()
        }
    }

    AndroidView(
        factory = { previewView },
        modifier = modifier
    )
}

private suspend fun Context.getCameraProvider(): ProcessCameraProvider = suspendCoroutine { continuation ->
    ProcessCameraProvider.getInstance(this).also { future ->
        future.addListener({
            continuation.resume(future.get())
        }, ContextCompat.getMainExecutor(this))
    }
}

private fun takePhoto(
    context: Context,
    imageCapture: ImageCapture,
    executor: Executor,
    onImageCaptured: (Uri) -> Unit
) {
    val outputOptions = ImageCapture.OutputFileOptions.Builder(
        File(context.cacheDir, "scan_${System.currentTimeMillis()}.jpg")
    ).build()

    imageCapture.takePicture(
        outputOptions,
        executor,
        object : ImageCapture.OnImageSavedCallback {
            override fun onImageSaved(output: ImageCapture.OutputFileResults) {
                output.savedUri?.let { onImageCaptured(it) }
            }

            override fun onError(exception: ImageCaptureException) {
                Log.e("CameraPreview", "Capture failed", exception)
            }
        }
    )
}
