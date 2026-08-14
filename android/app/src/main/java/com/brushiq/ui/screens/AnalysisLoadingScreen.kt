package com.brushiq.ui.screens

import android.net.Uri
import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.CloudOff
import androidx.compose.material.icons.filled.ErrorOutline
import androidx.compose.material.icons.filled.NoPhotography
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import coil.compose.AsyncImage
import com.brushiq.ui.components.AppHeader
import com.brushiq.ui.components.PrimaryButton
import com.brushiq.ui.components.SecondaryButton
import com.brushiq.ui.theme.*
import com.brushiq.ui.viewmodel.ScanErrorType
import com.brushiq.ui.viewmodel.ScanViewModel

fun formatDetectedObjectTitle(detectedObj: String?): String {
    if (detectedObj.isNullOrBlank()) return "Object Detected"
    val clean = detectedObj.lowercase().trim()
    val name = when {
        clean == "cell phone" || clean == "mobile phone" || clean == "phone" -> "Phone"
        clean == "potted plant" || clean == "plant" -> "Plant"
        clean == "laptop" -> "Laptop"
        clean == "person" || clean == "human" -> "Person"
        clean == "bottle" -> "Bottle"
        clean == "keyboard" -> "Keyboard"
        clean == "book" -> "Book"
        clean == "chair" -> "Chair"
        else -> clean.replaceFirstChar { if (it.isLowerCase()) it.titlecase() else it.toString() }
    }
    return "$name Detected"
}

@Composable
fun AnalysisLoadingScreen(
    navController: NavController,
    viewModel: ScanViewModel
) {
    val imageUri by viewModel.capturedImageUri.collectAsState()
    val stepIndex by viewModel.processingStep.collectAsState()
    val progressPercent by viewModel.processingProgress.collectAsState()
    val errorState by viewModel.errorState.collectAsState()
    val errorMessage by viewModel.errorMessage.collectAsState()
    val detectedObject by viewModel.detectedObject.collectAsState()
    
    val scrollState = rememberScrollState()
    val context = LocalContext.current

    // Start analysis sequence when screen enters
    LaunchedEffect(Unit) {
        viewModel.startAiAnalysis(context) {
            navController.navigate("result") {
                // Ensure we pop the scan screens when viewing results
                popUpTo("scan") { inclusive = false }
            }
        }
    }

    Scaffold(
        topBar = {
            AppHeader(
                title = when (errorState) {
                    ScanErrorType.NON_TOOTHBRUSH_OBJECT -> formatDetectedObjectTitle(detectedObject)
                    ScanErrorType.TOOTHBRUSH_NOT_DETECTED -> "Toothbrush Not Detected"
                    ScanErrorType.MULTIPLE_TOOTHBRUSHES -> "Multiple Toothbrushes"
                    ScanErrorType.IMAGE_QUALITY_ERROR -> "Image Quality Issue"
                    ScanErrorType.UPLOAD_FAILED -> "Upload Error"
                    ScanErrorType.ANALYSIS_FAILED -> "Analysis Error"
                    else -> "AI Diagnostic Sequence"
                }
            )
        }
    ) { padding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .background(MaterialTheme.colorScheme.background)
        ) {
            when (errorState) {
                ScanErrorType.NON_TOOTHBRUSH_OBJECT -> {
                    ValidationFailureUI(
                        title = formatDetectedObjectTitle(detectedObject),
                        message = "Please scan only a toothbrush.",
                        icon = Icons.Default.NoPhotography,
                        onTryAgain = {
                            viewModel.retake()
                            navController.navigate("scan") {
                                popUpTo("scan") { inclusive = true }
                            }
                        },
                        onGoBack = {
                            viewModel.retake()
                            navController.popBackStack()
                        }
                    )
                }
                ScanErrorType.TOOTHBRUSH_NOT_DETECTED -> {
                    ValidationFailureUI(
                        title = "Toothbrush Not Detected",
                        message = errorMessage ?: "Toothbrush not detected. Please scan only a toothbrush.",
                        icon = Icons.Default.NoPhotography,
                        onTryAgain = {
                            viewModel.retake()
                            navController.navigate("scan") {
                                popUpTo("scan") { inclusive = true }
                            }
                        },
                        onGoBack = {
                            viewModel.retake()
                            navController.popBackStack()
                        }
                    )
                }
                ScanErrorType.MULTIPLE_TOOTHBRUSHES -> {
                    ValidationFailureUI(
                        title = "Multiple Toothbrushes Detected",
                        message = errorMessage ?: "Multiple toothbrushes detected. Please scan only one toothbrush.",
                        icon = Icons.Default.Warning,
                        onTryAgain = {
                            viewModel.retake()
                            navController.navigate("scan") {
                                popUpTo("scan") { inclusive = true }
                            }
                        },
                        onGoBack = {
                            viewModel.retake()
                            navController.popBackStack()
                        }
                    )
                }
                ScanErrorType.IMAGE_QUALITY_ERROR -> {
                    ValidationFailureUI(
                        title = "Image Quality Issue",
                        message = errorMessage ?: "Image quality check failed. Please ensure proper lighting and focus.",
                        icon = Icons.Default.Warning,
                        onTryAgain = {
                            viewModel.retake()
                            navController.navigate("scan") {
                                popUpTo("scan") { inclusive = true }
                            }
                        },
                        onGoBack = {
                            viewModel.retake()
                            navController.popBackStack()
                        }
                    )
                }
                ScanErrorType.UPLOAD_FAILED -> {
                    UploadFailureUI(
                        title = "No Internet Connection",
                        message = errorMessage ?: "Check your internet connection and try again.",
                        onRetry = {
                            viewModel.startAiAnalysis(context) {
                                navController.navigate("result") {
                                    popUpTo("scan") { inclusive = false }
                                }
                            }
                        },
                        onBack = { navController.popBackStack() }
                    )
                }
                ScanErrorType.ANALYSIS_FAILED -> {
                    AnalysisFailureUI(
                        title = "Analysis Service Unavailable",
                        message = errorMessage ?: "The diagnostic service is temporarily unavailable. Please try again.",
                        onRetry = {
                            viewModel.startAiAnalysis(context) {
                                navController.navigate("result") {
                                    popUpTo("scan") { inclusive = false }
                                }
                            }
                        },
                        onRetake = {
                            viewModel.retake()
                            navController.navigate("scan") {
                                popUpTo("scan") { inclusive = true }
                            }
                        }
                    )
                }
                else -> {
                    // Normal Loading UI
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .verticalScroll(scrollState)
                            .padding(24.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(24.dp)
                    ) {
                        
                        // 1. Thumbnail viewport with vertical Laser scan
                        Box(
                            modifier = Modifier
                                .size(170.dp)
                                .clip(BrushIQShapes.large)
                                .background(Color.Black)
                                .border(2.dp, PrimaryMain.copy(alpha = 0.4f), BrushIQShapes.large),
                            contentAlignment = Alignment.Center
                        ) {
                            AsyncImage(
                                model = imageUri,
                                contentDescription = null,
                                modifier = Modifier
                                    .fillMaxSize()
                                    .alpha(0.65f),
                                contentScale = ContentScale.Crop
                            )

                            // Animating Laser line
                            val infiniteTransition = rememberInfiniteTransition(label = "laser")
                            val laserY by infiniteTransition.animateFloat(
                                initialValue = 0f,
                                targetValue = 170f,
                                animationSpec = infiniteRepeatable(
                                    animation = tween(1200, easing = LinearEasing),
                                    repeatMode = RepeatMode.Reverse
                                ),
                                label = "laserY"
                            )

                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(3.dp)
                                    .offset(y = (laserY - 85).dp)
                                    .background(
                                        Brush.horizontalGradient(
                                            listOf(Color.Transparent, SecondaryMain, PrimaryMain, SecondaryMain, Color.Transparent)
                                        )
                                    )
                            )
                        }

                        // 2. Numerical Percentage & Progress Text
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.spacedBy(4.dp)
                        ) {
                            Text(
                                text = "$progressPercent%",
                                style = MaterialTheme.typography.displayMedium.copy(
                                    fontWeight = FontWeight.Black,
                                    color = PrimaryMain,
                                    letterSpacing = (-1).sp
                                )
                            )
                            Text(
                                text = if (stepIndex < viewModel.processingSteps.size) {
                                    "${viewModel.processingSteps[stepIndex]}..."
                                } else {
                                    "Finishing Up..."
                                },
                                style = MaterialTheme.typography.titleMedium.copy(
                                    fontWeight = FontWeight.Bold,
                                    color = MaterialTheme.colorScheme.onSurface
                                ),
                                textAlign = TextAlign.Center
                            )
                        }

                        // 3. Linear Progress Bar
                        LinearProgressIndicator(
                            progress = progressPercent / 100f,
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(8.dp)
                                .clip(CircleShape),
                            color = PrimaryMain,
                            trackColor = PrimaryMain.copy(alpha = 0.1f)
                        )

                        Spacer(modifier = Modifier.height(8.dp))

                        // 4. Progress Steps List (1 to 7 stages)
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            shape = BrushIQShapes.medium,
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                            border = androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.outline)
                        ) {
                            Column(
                                modifier = Modifier.padding(16.dp),
                                verticalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                viewModel.processingSteps.forEachIndexed { index, step ->
                                    val isActive = index == stepIndex
                                    val isCompleted = index < stepIndex

                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        modifier = Modifier.fillMaxWidth()
                                    ) {
                                        Box(
                                            modifier = Modifier.size(24.dp),
                                            contentAlignment = Alignment.Center
                                        ) {
                                            when {
                                                isCompleted -> {
                                                    Icon(
                                                        imageVector = Icons.Default.CheckCircle,
                                                        contentDescription = "Step Complete",
                                                        tint = Success,
                                                        modifier = Modifier.size(20.dp)
                                                    )
                                                }
                                                isActive -> {
                                                    CircularProgressIndicator(
                                                        modifier = Modifier.size(16.dp),
                                                        strokeWidth = 2.dp,
                                                        color = PrimaryMain
                                                    )
                                                }
                                                else -> {
                                                    Box(
                                                        modifier = Modifier
                                                            .size(16.dp)
                                                            .border(
                                                                1.5.dp,
                                                                MaterialTheme.colorScheme.outline.copy(alpha = 0.6f),
                                                                CircleShape
                                                            )
                                                    )
                                                }
                                            }
                                        }

                                        Spacer(modifier = Modifier.width(12.dp))

                                        Text(
                                            text = step,
                                            style = MaterialTheme.typography.bodyMedium.copy(
                                                fontWeight = if (isActive) FontWeight.Bold else FontWeight.Normal,
                                                color = if (isActive) {
                                                    MaterialTheme.colorScheme.onSurface
                                                } else if (isCompleted) {
                                                    MaterialTheme.colorScheme.onSurface.copy(alpha = 0.8f)
                                                } else {
                                                    MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f)
                                                }
                                            )
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun ValidationFailureUI(
    title: String,
    message: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    onTryAgain: () -> Unit,
    onGoBack: (() -> Unit)? = null
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Box(
            modifier = Modifier
                .size(90.dp)
                .background(Error.copy(alpha = 0.12f), CircleShape),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = Error,
                modifier = Modifier.size(48.dp)
            )
        }

        Spacer(modifier = Modifier.height(24.dp))

        Text(
            text = title,
            style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold),
            color = MaterialTheme.colorScheme.onSurface,
            textAlign = TextAlign.Center
        )

        Spacer(modifier = Modifier.height(12.dp))

        Text(
            text = message,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center,
            modifier = Modifier.padding(horizontal = 16.dp)
        )

        Spacer(modifier = Modifier.height(40.dp))

        PrimaryButton(
            text = "TRY AGAIN",
            onClick = onTryAgain
        )

        if (onGoBack != null) {
            Spacer(modifier = Modifier.height(12.dp))
            SecondaryButton(
                text = "GO BACK",
                onClick = onGoBack
            )
        }
    }
}

@Composable
fun UploadFailureUI(
    title: String = "No Internet Connection",
    message: String = "Check your internet connection and try again.",
    onRetry: () -> Unit,
    onBack: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Box(
            modifier = Modifier
                .size(90.dp)
                .background(Error.copy(alpha = 0.12f), CircleShape),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = Icons.Default.CloudOff,
                contentDescription = null,
                tint = Error,
                modifier = Modifier.size(48.dp)
            )
        }

        Spacer(modifier = Modifier.height(24.dp))

        Text(
            text = title,
            style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold),
            color = MaterialTheme.colorScheme.onSurface,
            textAlign = TextAlign.Center
        )

        Spacer(modifier = Modifier.height(12.dp))

        Text(
            text = message,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center,
            modifier = Modifier.padding(horizontal = 16.dp)
        )

        Spacer(modifier = Modifier.height(40.dp))

        PrimaryButton(
            text = "Try Again",
            onClick = onRetry
        )

        Spacer(modifier = Modifier.height(12.dp))

        SecondaryButton(
            text = "Go Back",
            onClick = onBack
        )
    }
}

@Composable
fun AnalysisFailureUI(
    title: String = "Analysis Service Unavailable",
    message: String = "The diagnostic service is temporarily unavailable. Please try again.",
    onRetry: () -> Unit,
    onRetake: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Box(
            modifier = Modifier
                .size(90.dp)
                .background(Error.copy(alpha = 0.12f), CircleShape),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = Icons.Default.ErrorOutline,
                contentDescription = null,
                tint = Error,
                modifier = Modifier.size(48.dp)
            )
        }

        Spacer(modifier = Modifier.height(24.dp))

        Text(
            text = title,
            style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold),
            color = MaterialTheme.colorScheme.onSurface,
            textAlign = TextAlign.Center
        )

        Spacer(modifier = Modifier.height(12.dp))

        Text(
            text = message,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center,
            modifier = Modifier.padding(horizontal = 16.dp)
        )

        Spacer(modifier = Modifier.height(40.dp))

        PrimaryButton(
            text = "Retry Analysis",
            onClick = onRetry
        )

        Spacer(modifier = Modifier.height(12.dp))

        SecondaryButton(
            text = "Retake Photo",
            onClick = onRetake
        )
    }
}
