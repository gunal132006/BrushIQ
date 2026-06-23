package com.brushiq.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import androidx.navigation.compose.rememberNavController
import com.brushiq.ui.components.AppHeader
import com.brushiq.ui.theme.*

@Composable
fun AboutScreen(
    navController: NavController
) {
    val scrollState = rememberScrollState()

    Scaffold(
        topBar = {
            AppHeader(
                title = "About BrushIQ",
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .background(MaterialTheme.colorScheme.background)
                .verticalScroll(scrollState),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Logo Section
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(200.dp)
                    .background(
                        brush = Brush.verticalGradient(
                            colors = listOf(PrimaryMain, SecondaryMain)
                        )
                    ),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Box(
                        modifier = Modifier
                            .size(80.dp)
                            .clip(CircleShape)
                            .background(Color.White.copy(alpha = 0.15f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            "B",
                            style = MaterialTheme.typography.displayLarge.copy(
                                fontSize = 36.sp,
                                fontWeight = FontWeight.Black,
                                color = Color.White
                            )
                        )
                    }
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(
                        "BrushIQ",
                        style = MaterialTheme.typography.headlineMedium.copy(
                            fontWeight = FontWeight.Black,
                            color = Color.White
                        )
                    )
                    Text(
                        "AI-Powered Oral Care Intelligence",
                        style = MaterialTheme.typography.bodyMedium,
                        color = Color.White.copy(alpha = 0.8f)
                    )
                }
            }

            Column(modifier = Modifier.padding(Dimensions.PaddingMedium)) {
                // App Info Card
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = BrushIQShapes.large,
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    border = androidx.compose.foundation.BorderStroke(Dimensions.BorderWidth, MaterialTheme.colorScheme.outline)
                ) {
                    Column(modifier = Modifier.padding(Dimensions.PaddingMedium)) {
                        Text("APPLICATION", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        Spacer(modifier = Modifier.height(12.dp))

                        AboutInfoRow("Version", "1.0.0")
                        Divider(modifier = Modifier.padding(vertical = 10.dp), color = MaterialTheme.colorScheme.outline.copy(alpha = 0.3f))
                        AboutInfoRow("Build Number", "2405")
                        Divider(modifier = Modifier.padding(vertical = 10.dp), color = MaterialTheme.colorScheme.outline.copy(alpha = 0.3f))
                        AboutInfoRow("Last Updated", "June 15, 2026")
                        Divider(modifier = Modifier.padding(vertical = 10.dp), color = MaterialTheme.colorScheme.outline.copy(alpha = 0.3f))
                        AboutInfoRow("AI Engine", "v2.4.1 (CNN-based)")
                        Divider(modifier = Modifier.padding(vertical = 10.dp), color = MaterialTheme.colorScheme.outline.copy(alpha = 0.3f))
                        AboutInfoRow("Platform", "Android")
                        Divider(modifier = Modifier.padding(vertical = 10.dp), color = MaterialTheme.colorScheme.outline.copy(alpha = 0.3f))
                        AboutInfoRow("Min SDK", "API 26 (Android 8.0)")
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Description Card
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = BrushIQShapes.large,
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    border = androidx.compose.foundation.BorderStroke(Dimensions.BorderWidth, MaterialTheme.colorScheme.outline)
                ) {
                    Column(modifier = Modifier.padding(Dimensions.PaddingMedium)) {
                        Text("ABOUT", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        Spacer(modifier = Modifier.height(12.dp))
                        Text(
                            "BrushIQ uses advanced AI and computer vision to analyze toothbrush bristle wear and provide personalized oral care recommendations. " +
                                    "Our mission is to help families maintain optimal oral hygiene through intelligent monitoring and timely replacement guidance.\n\n" +
                                    "BrushIQ provides informational oral care guidance and is not a substitute for professional dental advice.",
                            style = MaterialTheme.typography.bodyMedium,
                            lineHeight = 24.sp,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Open Source Licenses
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = BrushIQShapes.large,
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    border = androidx.compose.foundation.BorderStroke(Dimensions.BorderWidth, MaterialTheme.colorScheme.outline)
                ) {
                    Column(modifier = Modifier.padding(Dimensions.PaddingMedium)) {
                        Text("OPEN SOURCE LICENSES", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        Spacer(modifier = Modifier.height(12.dp))

                        LicenseItem("Jetpack Compose", "Apache License 2.0")
                        LicenseItem("Kotlin", "Apache License 2.0")
                        LicenseItem("Hilt (Dagger)", "Apache License 2.0")
                        LicenseItem("Retrofit", "Apache License 2.0")
                        LicenseItem("OkHttp", "Apache License 2.0")
                        LicenseItem("Coil", "Apache License 2.0")
                        LicenseItem("Room", "Apache License 2.0")
                        LicenseItem("CameraX", "Apache License 2.0")
                        LicenseItem("Navigation Compose", "Apache License 2.0")
                    }
                }

                Spacer(modifier = Modifier.height(24.dp))

                Text(
                    "© 2026 BrushIQ. All rights reserved.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.fillMaxWidth(),
                    textAlign = TextAlign.Center
                )

                Spacer(modifier = Modifier.height(80.dp))
            }
        }
    }
}

@Composable
fun AboutInfoRow(label: String, value: String) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(label, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
        Text(value, style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold))
    }
}

@Composable
fun LicenseItem(library: String, license: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 6.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(library, style = MaterialTheme.typography.bodySmall.copy(fontWeight = FontWeight.Bold), color = MaterialTheme.colorScheme.onSurface)
        Surface(
            color = PrimaryAlpha10,
            shape = CircleShape
        ) {
            Text(
                license,
                modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp),
                style = TextStyle(fontSize = 8.sp, fontWeight = FontWeight.Bold),
                color = PrimaryMain
            )
        }
    }
}

@Preview(showBackground = true)
@Composable
fun PreviewAboutScreen() {
    BrushIQTheme {
        AboutScreen(navController = rememberNavController())
    }
}
