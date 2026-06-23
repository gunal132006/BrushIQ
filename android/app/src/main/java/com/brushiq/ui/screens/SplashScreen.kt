package com.brushiq.ui.screens

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import androidx.navigation.compose.rememberNavController
import com.brushiq.ui.theme.*
import com.brushiq.ui.viewmodel.AuthViewModel
import kotlinx.coroutines.delay
import kotlinx.coroutines.withTimeoutOrNull
import androidx.compose.ui.platform.LocalContext

@Composable
fun SplashScreen(
    navController: NavController,
    authViewModel: AuthViewModel? = null
) {
    var startAnimation by remember { mutableStateOf(false) }
    val progressMessage = remember { mutableStateOf("Initializing clinical workspace...") }
    var isServerUnreachable by remember { mutableStateOf(false) }
    var retryCount by remember { mutableStateOf(0) }
    val context = LocalContext.current
    
    val scale = animateFloatAsState(
        targetValue = if (startAnimation) 1f else 0.8f,
        animationSpec = tween(durationMillis = 1000, easing = OvershootInterpolator().toEasing()),
        label = "LogoScale"
    )

    LaunchedEffect(key1 = retryCount) {
        android.util.Log.d("AuthFlow", "Splash: Started (retryCount = $retryCount)")
        if (retryCount == 0) {
            startAnimation = true
            delay(1000)
        }
        isServerUnreachable = false
        progressMessage.value = "Connecting to BrushIQ server..."
        
        val isDebug = (context.applicationInfo.flags and android.content.pm.ApplicationInfo.FLAG_DEBUGGABLE) != 0
        android.util.Log.d("AuthFlow", "Splash: Running health check (isDebug = $isDebug)...")
        
        val isHealthy = try {
            withTimeoutOrNull(3000) {
                authViewModel?.checkServerHealth()
            } ?: false
        } catch (e: Exception) {
            android.util.Log.e("AuthFlow", "Splash: Health check exception", e)
            false
        }
        
        android.util.Log.d("AuthFlow", "Splash: Health check success/failure = $isHealthy")
        
        if (!isHealthy) {
            android.util.Log.e("AuthFlow", "Splash: Startup check: BrushIQ server unreachable")
            isServerUnreachable = true
            
            if (isDebug) {
                android.util.Log.d("AuthFlow", "Splash: Bypassing health-check failure in debug build")
            } else {
                android.widget.Toast.makeText(
                    context, 
                    "BrushIQ server is unreachable. Some features may be offline.", 
                    android.widget.Toast.LENGTH_LONG
                ).show()
                delay(1500)
            }
        } else {
            android.util.Log.d("AuthFlow", "Splash: BrushIQ server reachable. Verifying credentials...")
            progressMessage.value = "Verifying credentials..."
            delay(800)
        }
        
        // Verify credentials with local storage or silent sign-in
        val isLoggedIn = authViewModel?.isUserLoggedIn?.value ?: false
        android.util.Log.d("AuthFlow", "Splash: Local session isLoggedIn = $isLoggedIn")
        
        if (isLoggedIn) {
            android.util.Log.d("AuthFlow", "Splash: Local session active. Navigating to Dashboard...")
            navController.navigate("dashboard") {
                popUpTo("splash") { inclusive = true }
            }
        } else {
            android.util.Log.d("AuthFlow", "Splash: No active local session. Attempting silent sign-in...")
            progressMessage.value = "Attempting silent sign-in..."
            
            val silentSuccess = try {
                withTimeoutOrNull(2000) {
                    authViewModel?.silentSignIn(context)
                } ?: false
            } catch (e: Exception) {
                android.util.Log.e("AuthFlow", "Splash: Silent sign-in exception", e)
                false
            }
            
            android.util.Log.d("AuthFlow", "Splash: Silent sign-in success = $silentSuccess")
            
            if (silentSuccess) {
                android.util.Log.d("AuthFlow", "Splash: Silent sign-in success. Navigating to Dashboard...")
                progressMessage.value = "Welcome back!"
                delay(500)
                navController.navigate("dashboard") {
                    popUpTo("splash") { inclusive = true }
                }
            } else {
                android.util.Log.d("AuthFlow", "Splash: Silent sign-in failed/timeout. Navigating to LoginScreen...")
                navController.navigate("login") {
                    popUpTo("splash") { inclusive = true }
                }
            }
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                brush = Brush.verticalGradient(
                    colors = listOf(PrimaryMain, PrimaryDark)
                )
            ),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            // Logo
            Surface(
                modifier = Modifier
                    .size(100.dp)
                    .scale(scale.value),
                color = Color.White,
                shape = BrushIQShapes.extraLarge,
                tonalElevation = 8.dp
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Text(
                        text = "B",
                        color = PrimaryMain,
                        style = MaterialTheme.typography.displayLarge.copy(
                            fontSize = 56.sp,
                            fontWeight = FontWeight.Black
                        )
                    )
                }
            }
            
            Spacer(modifier = Modifier.height(24.dp))
            
            Text(
                text = "BrushIQ",
                color = Color.White,
                style = MaterialTheme.typography.displayLarge.copy(
                    fontSize = 40.sp,
                    letterSpacing = 1.sp
                )
            )
            
            Spacer(modifier = Modifier.height(8.dp))
            
            Text(
                text = "AI-Powered Oral Healthcare",
                color = Color.White.copy(alpha = 0.7f),
                style = MaterialTheme.typography.bodyLarge.copy(
                    fontWeight = FontWeight.Bold
                )
            )
            
            Spacer(modifier = Modifier.height(64.dp))
            
            if (isServerUnreachable) {
                Button(
                    onClick = { retryCount++ },
                    colors = ButtonDefaults.buttonColors(containerColor = Color.White),
                    shape = BrushIQShapes.large
                ) {
                    Text("RETRY", color = PrimaryMain, fontWeight = FontWeight.Bold)
                }
            } else {
                CircularProgressIndicator(
                    color = Color.White,
                    modifier = Modifier.size(24.dp),
                    strokeWidth = 2.dp
                )
            }
            
            Spacer(modifier = Modifier.height(16.dp))
            
            AnimatedContent(
                targetState = progressMessage.value,
                transitionSpec = {
                    fadeIn(animationSpec = tween(300)) togetherWith fadeOut(animationSpec = tween(300))
                },
                label = "ProgressMessage"
            ) { text ->
                Text(
                    text = text,
                    color = Color.White.copy(alpha = 0.6f),
                    style = MaterialTheme.typography.labelMedium.copy(
                        fontWeight = FontWeight.Medium
                    )
                )
            }
        }
        
        Text(
            text = "v1.0.0",
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(bottom = 32.dp),
            color = Color.White.copy(alpha = 0.3f),
            style = MaterialTheme.typography.labelSmall
        )
    }
}

// Simple easing helper
private fun android.view.animation.Interpolator.toEasing() = androidx.compose.animation.core.Easing { x ->
    getInterpolation(x)
}

private class OvershootInterpolator(private val tension: Float = 2f) : android.view.animation.Interpolator {
    override fun getInterpolation(input: Float): Float {
        val t = input - 1f
        return t * t * ((tension + 1f) * t + tension) + 1f
    }
}

@Preview
@Composable
fun PreviewSplashScreen() {
    BrushIQTheme {
        SplashScreen(navController = rememberNavController())
    }
}
