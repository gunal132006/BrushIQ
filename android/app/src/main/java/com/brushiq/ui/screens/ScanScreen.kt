package com.brushiq.ui.screens

import android.Manifest
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.provider.Settings
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageCapture
import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavController
import com.brushiq.ui.components.CameraPreview
import com.brushiq.ui.theme.*
import com.brushiq.ui.viewmodel.ScanErrorType
import com.brushiq.ui.viewmodel.ScanViewModel

@OptIn(ExperimentalAnimationApi::class)
@Composable
fun ScanScreen(
    navController: NavController,
    viewModel: ScanViewModel = hiltViewModel()
) {
    val context = LocalContext.current
    val errorState by viewModel.errorState.collectAsState()

    // Permissions State
    var cameraPermissionGranted by remember {
        mutableStateOf(
            ContextCompat.checkSelfPermission(context, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED
        )
    }

    var showGalleryPermissionExplainer by remember { mutableStateOf(false) }

    val galleryPermission = if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.TIRAMISU) {
        Manifest.permission.READ_MEDIA_IMAGES
    } else {
        Manifest.permission.READ_EXTERNAL_STORAGE
    }

    var galleryPermissionGranted by remember {
        mutableStateOf(
            ContextCompat.checkSelfPermission(context, galleryPermission) == PackageManager.PERMISSION_GRANTED
        )
    }

    // Permission Launchers
    val cameraPermissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        cameraPermissionGranted = isGranted
        if (!isGranted) {
            viewModel.setCameraError()
        } else {
            viewModel.clearCameraError()
        }
    }

    val galleryPermissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        galleryPermissionGranted = isGranted
        showGalleryPermissionExplainer = false
    }

    val galleryLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.GetContent()
    ) { uri ->
        uri?.let {
            viewModel.onImageCaptured(it)
            navController.navigate("preview")
        }
    }

    // Launch initial camera permission request if not granted
    LaunchedEffect(Unit) {
        if (!cameraPermissionGranted) {
            cameraPermissionLauncher.launch(Manifest.permission.CAMERA)
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black)
    ) {
        // UI Decision Tree
        when {
            errorState == ScanErrorType.CAMERA_INITIALIZATION -> {
                CameraFailureUI(
                    onRetry = {
                        viewModel.clearCameraError()
                        cameraPermissionLauncher.launch(Manifest.permission.CAMERA)
                    },
                    onBack = { navController.popBackStack() }
                )
            }
            !cameraPermissionGranted -> {
                PermissionExplanationScreen(
                    title = "Camera Permission Required",
                    description = "BrushIQ needs access to your camera to scan and analyze the wear of your toothbrush bristles using AI.",
                    icon = Icons.Default.PhotoCamera,
                    iconColor = PrimaryMain,
                    buttonText = "Grant Camera Access",
                    onGrantClick = {
                        cameraPermissionLauncher.launch(Manifest.permission.CAMERA)
                    },
                    onBackClick = { navController.popBackStack() }
                )
            }
            showGalleryPermissionExplainer -> {
                PermissionExplanationScreen(
                    title = "Gallery Permission Required",
                    description = "BrushIQ needs storage access to select a pre-captured photo of your toothbrush bristles from your device library.",
                    icon = Icons.Default.PhotoLibrary,
                    iconColor = SecondaryMain,
                    buttonText = "Grant Gallery Access",
                    onGrantClick = {
                        galleryPermissionLauncher.launch(galleryPermission)
                    },
                    onBackClick = { showGalleryPermissionExplainer = false }
                )
            }
            else -> {
                // Active Scanner View
                var cameraSelector by remember { mutableStateOf(CameraSelector.DEFAULT_BACK_CAMERA) }
                var flashMode by remember { mutableIntStateOf(ImageCapture.FLASH_MODE_OFF) }
                var captureTrigger by remember { mutableStateOf(false) }

                // Full-screen camera viewport
                CameraPreview(
                    modifier = Modifier.fillMaxSize(),
                    cameraSelector = cameraSelector,
                    flashMode = flashMode,
                    captureTrigger = captureTrigger,
                    onImageCaptured = { uri ->
                        viewModel.onImageCaptured(uri)
                        navController.navigate("preview")
                    },
                    onCaptureProcessed = { captureTrigger = false }
                )

                // Circular Toothbrush Alignment Overlay
                ScanningOverlays(
                    flashMode = flashMode,
                    onFlashToggle = {
                        flashMode = if (flashMode == ImageCapture.FLASH_MODE_OFF) {
                            ImageCapture.FLASH_MODE_ON
                        } else {
                            ImageCapture.FLASH_MODE_OFF
                        }
                    },
                    onCameraSwitch = {
                        cameraSelector = if (cameraSelector == CameraSelector.DEFAULT_BACK_CAMERA) {
                            CameraSelector.DEFAULT_FRONT_CAMERA
                        } else {
                            CameraSelector.DEFAULT_BACK_CAMERA
                        }
                    },
                    onGalleryClick = {
                        if (galleryPermissionGranted) {
                            galleryLauncher.launch("image/*")
                        } else {
                            showGalleryPermissionExplainer = true
                        }
                    },
                    onCaptureClick = { captureTrigger = true },
                    onBackClick = { navController.popBackStack() }
                )
            }
        }
    }
}

@Composable
fun ScanningOverlays(
    flashMode: Int,
    onFlashToggle: () -> Unit,
    onCameraSwitch: () -> Unit,
    onGalleryClick: () -> Unit,
    onCaptureClick: () -> Unit,
    onBackClick: () -> Unit
) {
    // Continuous Breathing/Pulsing Animation for the Guide borders
    val infiniteTransition = rememberInfiniteTransition(label = "pulse")
    val pulseScale by infiniteTransition.animateFloat(
        initialValue = 1.0f,
        targetValue = 1.05f,
        animationSpec = infiniteRepeatable(
            animation = tween(1200, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "pulseScale"
    )
    val laserPos by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(2500, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "laserPos"
    )
    val textAlpha by infiniteTransition.animateFloat(
        initialValue = 0.6f,
        targetValue = 1.0f,
        animationSpec = infiniteRepeatable(
            animation = tween(1000, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "textAlpha"
    )

    Box(modifier = Modifier.fillMaxSize()) {
        
        // 1. Transparent Header Controls Overlay
        Row(
            modifier = Modifier
                .align(Alignment.TopCenter)
                .fillMaxWidth()
                .statusBarsPadding()
                .padding(horizontal = 16.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            IconButton(
                onClick = onBackClick,
                modifier = Modifier.background(Color.Black.copy(alpha = 0.5f), CircleShape)
            ) {
                Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = Color.White)
            }

            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                IconButton(
                    onClick = onFlashToggle,
                    modifier = Modifier.background(Color.Black.copy(alpha = 0.5f), CircleShape)
                ) {
                    Icon(
                        imageVector = if (flashMode == ImageCapture.FLASH_MODE_ON) Icons.Default.FlashOn else Icons.Default.FlashOff,
                        contentDescription = "Flash Toggle",
                        tint = if (flashMode == ImageCapture.FLASH_MODE_ON) Color.Yellow else Color.White
                    )
                }

                IconButton(
                    onClick = onCameraSwitch,
                    modifier = Modifier.background(Color.Black.copy(alpha = 0.5f), CircleShape)
                ) {
                    Icon(Icons.Default.FlipCameraAndroid, contentDescription = "Switch Camera", tint = Color.White)
                }
            }
        }

        // 2. Scrim Overlay outside the focus area
        // Centers a 260dp circle cut-out
        Canvas(modifier = Modifier.fillMaxSize()) {
            val canvasWidth = size.width
            val canvasHeight = size.height
            val circleRadius = 120.dp.toPx()

            // Draw translucent black scrim over the entire screen except focus circle
            drawRect(
                color = Color.Black.copy(alpha = 0.45f)
            )
        }

        // 3. Central Circular & Dashed Guide Guides
        Box(
            modifier = Modifier
                .align(Alignment.Center)
                .size(260.dp),
            contentAlignment = Alignment.Center
        ) {
            // Dashed Border Scan Frame
            Canvas(
                modifier = Modifier
                    .fillMaxSize()
                    .scale(pulseScale)
            ) {
                drawCircle(
                    color = PrimaryMain,
                    style = Stroke(
                        width = 3.dp.toPx(),
                        pathEffect = PathEffect.dashPathEffect(floatArrayOf(25f, 15f), 0f)
                    )
                )
            }

            // Solid White Inner Alignment Guide
            Box(
                modifier = Modifier
                    .size(190.dp)
                    .border(2.dp, Color.White.copy(alpha = 0.7f), CircleShape)
            )

            // Animated Scanning Laser Line
            Box(
                modifier = Modifier
                    .width(220.dp)
                    .height(2.5.dp)
                    .offset(y = (laserPos * 200 - 100).dp)
                    .background(
                        Brush.horizontalGradient(
                            listOf(Color.Transparent, SecondaryMain, PrimaryMain, SecondaryMain, Color.Transparent)
                        )
                    )
            )
        }

        // 4. Instructional Text Overlay
        Text(
            text = "Align toothbrush head inside guide",
            modifier = Modifier
                .align(Alignment.Center)
                .offset(y = 170.dp)
                .alpha(textAlpha)
                .background(Color.Black.copy(alpha = 0.65f), CircleShape)
                .padding(horizontal = 20.dp, vertical = 8.dp),
            style = MaterialTheme.typography.bodyMedium.copy(
                fontWeight = FontWeight.Bold,
                letterSpacing = 0.5.sp
            ),
            color = Color.White,
            textAlign = TextAlign.Center
        )

        // 5. Bottom Control Container
        Row(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .navigationBarsPadding()
                .padding(bottom = 36.dp)
                .fillMaxWidth()
                .padding(horizontal = 32.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Gallery Picker Button
            IconButton(
                onClick = onGalleryClick,
                modifier = Modifier
                    .size(54.dp)
                    .background(Color.Black.copy(alpha = 0.6f), CircleShape)
                    .border(1.dp, Color.White.copy(alpha = 0.2f), CircleShape)
            ) {
                Icon(Icons.Default.PhotoLibrary, contentDescription = "Pick Image", tint = Color.White, modifier = Modifier.size(24.dp))
            }

            // Capture Button (Double Ring Breathing)
            Box(
                modifier = Modifier
                    .size(88.dp)
                    .background(Color.White.copy(alpha = 0.15f), CircleShape)
                    .clickable(onClick = onCaptureClick)
                    .padding(8.dp),
                contentAlignment = Alignment.Center
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(Color.White, CircleShape)
                        .border(4.dp, PrimaryMain.copy(alpha = 0.4f), CircleShape)
                )
            }

            // Spacer for UI balance
            Spacer(modifier = Modifier.size(54.dp))
        }
    }
}

@Composable
fun PermissionExplanationScreen(
    title: String,
    description: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    iconColor: Color,
    buttonText: String,
    onGrantClick: () -> Unit,
    onBackClick: () -> Unit
) {
    val context = LocalContext.current

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(DarkBg)
            .statusBarsPadding()
            .navigationBarsPadding()
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.SpaceBetween
    ) {
        // Back Button
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.Start
        ) {
            IconButton(
                onClick = onBackClick,
                modifier = Modifier.background(DarkSurface, CircleShape)
            ) {
                Icon(Icons.Default.Close, contentDescription = "Close", tint = DarkTextPrimary)
            }
        }

        // Explainer Content Card
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.fillMaxWidth(),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(120.dp)
                    .background(iconColor.copy(alpha = 0.15f), CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = iconColor,
                    modifier = Modifier.size(64.dp)
                )
            }

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = title,
                style = MaterialTheme.typography.headlineMedium.copy(
                    fontWeight = FontWeight.Bold,
                    color = DarkTextPrimary
                ),
                textAlign = TextAlign.Center
            )

            Text(
                text = description,
                style = MaterialTheme.typography.bodyMedium.copy(
                    lineHeight = 22.sp,
                    color = DarkTextSecondary
                ),
                textAlign = TextAlign.Center,
                modifier = Modifier.padding(horizontal = 16.dp)
            )
        }

        // Action Buttons
        Column(
            modifier = Modifier.fillMaxWidth(),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Button(
                onClick = onGrantClick,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(54.dp),
                shape = BrushIQShapes.medium,
                colors = ButtonDefaults.buttonColors(containerColor = PrimaryMain)
            ) {
                Text(
                    text = buttonText,
                    style = MaterialTheme.typography.titleMedium.copy(
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                )
            }

            TextButton(
                onClick = {
                    val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
                        data = Uri.fromParts("package", context.packageName, null)
                    }
                    context.startActivity(intent)
                },
                modifier = Modifier.fillMaxWidth()
            ) {
                Text(
                    text = "Open System Settings",
                    color = SecondaryMain,
                    fontWeight = FontWeight.Bold,
                    style = MaterialTheme.typography.bodyMedium
                )
            }
        }
    }
}

@Composable
fun CameraFailureUI(
    onRetry: () -> Unit,
    onBack: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(DarkBg)
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Box(
            modifier = Modifier
                .size(100.dp)
                .background(Error.copy(alpha = 0.15f), CircleShape),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = Icons.Default.VideocamOff,
                contentDescription = null,
                tint = Error,
                modifier = Modifier.size(54.dp)
            )
        }

        Spacer(modifier = Modifier.height(24.dp))

        Text(
            text = "Camera Initialization Failed",
            style = MaterialTheme.typography.titleLarge.copy(
                fontWeight = FontWeight.Bold,
                color = DarkTextPrimary
            ),
            textAlign = TextAlign.Center
        )

        Spacer(modifier = Modifier.height(12.dp))

        Text(
            text = "BrushIQ could not connect to your camera hardware. Please check your permissions or restart the app.",
            style = MaterialTheme.typography.bodyMedium.copy(
                color = DarkTextSecondary
            ),
            textAlign = TextAlign.Center,
            modifier = Modifier.padding(horizontal = 16.dp)
        )

        Spacer(modifier = Modifier.height(48.dp))

        Button(
            onClick = onRetry,
            colors = ButtonDefaults.buttonColors(containerColor = Error),
            shape = BrushIQShapes.medium,
            modifier = Modifier
                .fillMaxWidth(0.8f)
                .height(50.dp)
        ) {
            Text("Retry Camera", color = Color.White, fontWeight = FontWeight.Bold)
        }

        Spacer(modifier = Modifier.height(16.dp))

        TextButton(onClick = onBack) {
            Text("Go Back", color = SecondaryMain, fontWeight = FontWeight.Bold)
        }
    }
}
