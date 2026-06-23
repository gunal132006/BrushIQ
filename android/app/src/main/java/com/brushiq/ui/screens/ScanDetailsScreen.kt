package com.brushiq.ui.screens

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import androidx.navigation.compose.rememberNavController
import com.brushiq.ui.components.AppHeader
import com.brushiq.ui.components.PrimaryButton
import com.brushiq.ui.components.SecondaryButton
import com.brushiq.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ScanDetailsScreen(
    scanId: String,
    navController: NavController
) {
    val scrollState = rememberScrollState()

    // Mock data for selected scan
    val scanData = remember {
        mapOf(
            "scan-101" to ScanDetailData(85.0, "Good", 96.0, 15.0, 8.0, 10.0, 4.0, "2x daily", listOf(), "Fibers are in good shape.", "2026-06-15", 72, "Oral-B iO Series 9", "Gunal S"),
            "scan-102" to ScanDetailData(78.0, "Moderate Wear", 95.0, 22.0, 12.0, 15.0, 6.0, "2x daily", listOf("Slight bending"), "Continue routine checks.", "2026-06-10", 64, "Philips Sonicare", "Sarah J"),
            "scan-103" to ScanDetailData(62.0, "Moderate Wear", 94.0, 38.0, 18.0, 24.0, 12.0, "2x daily", listOf("Elasticity Loss"), "Monitor closely.", "2026-05-28", 38, "Oral-B iO Series 9", "Gunal S"),
            "scan-104" to ScanDetailData(45.0, "Replace Soon", 97.0, 55.0, 28.0, 35.0, 18.0, "2x daily", listOf("Significant Splay", "Fraying"), "Recommend replacement within 2 weeks.", "2026-05-12", 15, "Philips Sonicare", "Sarah J"),
            "scan-105" to ScanDetailData(32.0, "Replace Immediately", 93.0, 68.0, 45.0, 52.0, 35.0, "2x daily", listOf("Extreme Splay", "Fibers broken"), "Replace toothbrush head immediately.", "2026-04-24", 0, "Colgate 360", "Child")
        )
    }

    val scan = scanData[scanId] ?: scanData.values.first()

    // Compare with previous scan mock data
    val previousScore = (scan.healthScore + (8..18).random()).coerceAtMost(100.0)
    val scoreDiff = scan.healthScore - previousScore

    var showDebugConsole by remember { mutableStateOf(false) }
    var selectedOverlayTab by remember { mutableIntStateOf(0) }
    val overlayTabs = listOf("Density Map", "AI Overlay", "Wear Grid")

    val conditionColor = when (scan.condition) {
        "Good" -> Success
        "Moderate Wear" -> Warning
        "Replace Soon" -> Alert
        "Replace Immediately" -> Error
        else -> LightTextMuted
    }

    Scaffold(
        topBar = {
            AppHeader(
                title = "Scan Details",
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                },
                actions = {
                    IconButton(onClick = { /* Share report */ }) {
                        Icon(Icons.Default.Share, contentDescription = "Share Report", tint = PrimaryMain)
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
                .verticalScroll(scrollState)
        ) {
            // Scan Image Placeholder with overlay tabs
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(260.dp)
                    .background(
                        brush = Brush.verticalGradient(
                            colors = listOf(
                                PrimaryMain.copy(alpha = 0.12f),
                                SecondaryMain.copy(alpha = 0.08f)
                            )
                        )
                    )
            ) {
                // Canvas overlay based on selected tab
                Canvas(
                    modifier = Modifier
                        .fillMaxSize()
                        .semantics {
                            contentDescription =
                                "AI diagnostic overlay showing bristle wear analysis with ${scan.condition} condition"
                        }
                ) {
                    val w = size.width
                    val h = size.height

                    when (selectedOverlayTab) {
                        0 -> {
                            // Density heatmap
                            for (i in 0..12) {
                                for (j in 0..8) {
                                    val cx = w * (i / 12f)
                                    val cy = h * (j / 8f)
                                    val intensity = (scan.wearPercentage / 100.0 * (1.0 - (i + j) / 20.0)).toFloat().coerceIn(0.05f, 0.6f)
                                    drawCircle(
                                        color = conditionColor.copy(alpha = intensity),
                                        radius = 18f,
                                        center = Offset(cx, cy)
                                    )
                                }
                            }
                        }
                        1 -> {
                            // AI detection boxes
                            val boxColor = conditionColor.copy(alpha = 0.4f)
                            drawRect(boxColor, topLeft = Offset(w * 0.15f, h * 0.2f), size = androidx.compose.ui.geometry.Size(w * 0.3f, h * 0.35f), style = Stroke(2f))
                            drawRect(boxColor, topLeft = Offset(w * 0.55f, h * 0.3f), size = androidx.compose.ui.geometry.Size(w * 0.3f, h * 0.3f), style = Stroke(2f))
                            drawLine(PrimaryMain.copy(alpha = 0.3f), Offset(0f, h * 0.5f), Offset(w, h * 0.5f), strokeWidth = 1f)
                            drawLine(PrimaryMain.copy(alpha = 0.3f), Offset(w * 0.5f, 0f), Offset(w * 0.5f, h), strokeWidth = 1f)
                        }
                        2 -> {
                            // Wear grid
                            val cols = 6
                            val rows = 4
                            for (i in 0 until cols) {
                                for (j in 0 until rows) {
                                    val cellW = w / cols
                                    val cellH = h / rows
                                    val wearLevel = (scan.wearPercentage / 100 * ((i + j + 1).toFloat() / (cols + rows))).toFloat()
                                    drawRect(
                                        color = conditionColor.copy(alpha = wearLevel.coerceIn(0.05f, 0.5f)),
                                        topLeft = Offset(i * cellW + 2, j * cellH + 2),
                                        size = androidx.compose.ui.geometry.Size(cellW - 4, cellH - 4)
                                    )
                                }
                            }
                        }
                    }
                }

                // Tab selector overlaid at bottom
                Row(
                    modifier = Modifier
                        .align(Alignment.BottomCenter)
                        .padding(12.dp)
                        .background(MaterialTheme.colorScheme.surface.copy(alpha = 0.85f), CircleShape)
                        .padding(horizontal = 4.dp, vertical = 4.dp),
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    overlayTabs.forEachIndexed { index, tab ->
                        Surface(
                            color = if (selectedOverlayTab == index) PrimaryMain else Color.Transparent,
                            shape = CircleShape,
                            onClick = { selectedOverlayTab = index }
                        ) {
                            Text(
                                text = tab,
                                modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                                style = TextStyle(fontSize = 10.sp, fontWeight = FontWeight.Bold),
                                color = if (selectedOverlayTab == index) Color.White else MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }

                // Scan date badge
                Surface(
                    modifier = Modifier
                        .align(Alignment.TopStart)
                        .padding(12.dp),
                    color = MaterialTheme.colorScheme.surface.copy(alpha = 0.8f),
                    shape = CircleShape
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(Icons.Default.DateRange, contentDescription = null, modifier = Modifier.size(12.dp), tint = PrimaryMain)
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(scan.scanDate, style = TextStyle(fontSize = 10.sp, fontWeight = FontWeight.Bold), color = MaterialTheme.colorScheme.onSurface)
                    }
                }

                // Member badge
                Surface(
                    modifier = Modifier
                        .align(Alignment.TopEnd)
                        .padding(12.dp),
                    color = MaterialTheme.colorScheme.surface.copy(alpha = 0.8f),
                    shape = CircleShape
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(Icons.Default.Person, contentDescription = null, modifier = Modifier.size(12.dp), tint = PrimaryMain)
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(scan.memberName, style = TextStyle(fontSize = 10.sp, fontWeight = FontWeight.Bold), color = MaterialTheme.colorScheme.onSurface)
                    }
                }
            }

            Column(modifier = Modifier.padding(Dimensions.PaddingMedium)) {

                // Health Score Section
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = BrushIQShapes.large,
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    border = androidx.compose.foundation.BorderStroke(Dimensions.BorderWidth, MaterialTheme.colorScheme.outline)
                ) {
                    Column(
                        modifier = Modifier.padding(Dimensions.PaddingMedium),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text("HEALTH SCORE", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        Spacer(modifier = Modifier.height(12.dp))

                        Box(contentAlignment = Alignment.Center, modifier = Modifier.size(100.dp)) {
                            val animatedProgress by animateFloatAsState(
                                targetValue = scan.healthScore.toFloat() / 100f,
                                animationSpec = tween(1000),
                                label = "ScanDetailProgress"
                            )
                            Canvas(modifier = Modifier.fillMaxSize()) {
                                drawCircle(conditionColor.copy(alpha = 0.1f), style = Stroke(width = 6.dp.toPx()))
                                drawArc(conditionColor, -90f, 360f * animatedProgress, false, style = Stroke(width = 6.dp.toPx(), cap = StrokeCap.Round))
                            }
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Text("${scan.healthScore.toInt()}", style = MaterialTheme.typography.displayLarge.copy(fontSize = 28.sp), color = conditionColor)
                                Text("HEALTH", style = TextStyle(fontSize = 8.sp, fontWeight = FontWeight.Bold), color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                        }

                        Spacer(modifier = Modifier.height(12.dp))

                        Surface(
                            color = conditionColor.copy(alpha = 0.1f),
                            shape = CircleShape,
                            border = androidx.compose.foundation.BorderStroke(1.dp, conditionColor.copy(alpha = 0.3f))
                        ) {
                            Text(
                                text = scan.condition.uppercase(),
                                modifier = Modifier.padding(horizontal = 12.dp, vertical = 4.dp),
                                style = MaterialTheme.typography.labelSmall,
                                color = conditionColor
                            )
                        }

                        Spacer(modifier = Modifier.height(8.dp))
                        Text("AI Confidence: ${scan.confidenceScore.toInt()}%", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Compare With Previous Scan
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = BrushIQShapes.large,
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    border = androidx.compose.foundation.BorderStroke(Dimensions.BorderWidth, MaterialTheme.colorScheme.outline)
                ) {
                    Column(modifier = Modifier.padding(Dimensions.PaddingMedium)) {
                        Text("COMPARE WITH PREVIOUS SCAN", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        Spacer(modifier = Modifier.height(12.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceEvenly
                        ) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Text("PREVIOUS", style = TextStyle(fontSize = 8.sp, fontWeight = FontWeight.Bold), color = MaterialTheme.colorScheme.onSurfaceVariant)
                                Spacer(modifier = Modifier.height(4.dp))
                                Text("${previousScore.toInt()}%", style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Black), color = MaterialTheme.colorScheme.onSurface)
                            }
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Text("CURRENT", style = TextStyle(fontSize = 8.sp, fontWeight = FontWeight.Bold), color = MaterialTheme.colorScheme.onSurfaceVariant)
                                Spacer(modifier = Modifier.height(4.dp))
                                Text("${scan.healthScore.toInt()}%", style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Black), color = conditionColor)
                            }
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Text("CHANGE", style = TextStyle(fontSize = 8.sp, fontWeight = FontWeight.Bold), color = MaterialTheme.colorScheme.onSurfaceVariant)
                                Spacer(modifier = Modifier.height(4.dp))
                                val changeColor = if (scoreDiff >= 0) Success else Error
                                Text(
                                    "${if (scoreDiff >= 0) "+" else ""}${scoreDiff.toInt()}",
                                    style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Black),
                                    color = changeColor
                                )
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Statistics Grid
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = BrushIQShapes.large,
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    border = androidx.compose.foundation.BorderStroke(Dimensions.BorderWidth, MaterialTheme.colorScheme.outline)
                ) {
                    Column(modifier = Modifier.padding(Dimensions.PaddingMedium)) {
                        Text("DIAGNOSTIC METRICS", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        Spacer(modifier = Modifier.height(12.dp))

                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            DetailMetricItem("Wear %", "${scan.wearPercentage.toInt()}%", Modifier.weight(1f))
                            DetailMetricItem("Remaining Life", "${scan.remainingLifeDays} days", Modifier.weight(1f))
                        }
                        Spacer(modifier = Modifier.height(10.dp))
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            DetailMetricItem("Spreading", "${scan.bristleSpreading.toInt()}%", Modifier.weight(1f))
                            DetailMetricItem("Bending", "${scan.bristleBending.toInt()}%", Modifier.weight(1f))
                        }
                        Spacer(modifier = Modifier.height(10.dp))
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            DetailMetricItem("Damage", "${scan.bristleDamage.toInt()}%", Modifier.weight(1f))
                            DetailMetricItem("Frequency", scan.brushingFrequency, Modifier.weight(1f))
                        }
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Detected Issues
                if (scan.detectedIssues.isNotEmpty()) {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = BrushIQShapes.large,
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        border = androidx.compose.foundation.BorderStroke(Dimensions.BorderWidth, MaterialTheme.colorScheme.outline)
                    ) {
                        Column(modifier = Modifier.padding(Dimensions.PaddingMedium)) {
                            Text("DETECTED ISSUES", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            Spacer(modifier = Modifier.height(8.dp))
                            scan.detectedIssues.forEach { issue ->
                                Row(
                                    modifier = Modifier.padding(vertical = 4.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Surface(
                                        modifier = Modifier.size(6.dp),
                                        color = conditionColor,
                                        shape = CircleShape
                                    ) {}
                                    Spacer(modifier = Modifier.width(10.dp))
                                    Text(issue, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurface)
                                }
                            }
                        }
                    }
                    Spacer(modifier = Modifier.height(16.dp))
                }

                // AI Recommendation
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = BrushIQShapes.large,
                    colors = CardDefaults.cardColors(containerColor = PrimaryAlpha10),
                    border = androidx.compose.foundation.BorderStroke(Dimensions.BorderWidth, PrimaryMain.copy(alpha = 0.2f))
                ) {
                    Column(modifier = Modifier.padding(Dimensions.PaddingMedium)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.AutoGraph, contentDescription = null, modifier = Modifier.size(16.dp), tint = PrimaryMain)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("AI RECOMMENDATION", style = MaterialTheme.typography.labelSmall, color = PrimaryMain)
                        }
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(scan.aiRecommendation, style = MaterialTheme.typography.bodyMedium, lineHeight = 22.sp)
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Toothbrush Info
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = BrushIQShapes.large,
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    border = androidx.compose.foundation.BorderStroke(Dimensions.BorderWidth, MaterialTheme.colorScheme.outline)
                ) {
                    Row(
                        modifier = Modifier.padding(Dimensions.PaddingMedium),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Surface(
                            modifier = Modifier.size(40.dp),
                            color = SecondaryAlpha10,
                            shape = BrushIQShapes.medium
                        ) {
                            Icon(Icons.Default.CleaningServices, contentDescription = null, modifier = Modifier.padding(10.dp), tint = SecondaryMain)
                        }
                        Spacer(modifier = Modifier.width(12.dp))
                        Column {
                            Text("TOOTHBRUSH", style = TextStyle(fontSize = 8.sp, fontWeight = FontWeight.Bold), color = MaterialTheme.colorScheme.onSurfaceVariant)
                            Text(scan.toothbrushModel, style = MaterialTheme.typography.bodyLarge.copy(fontWeight = FontWeight.Bold))
                        }
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Debug Console Toggle
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { showDebugConsole = !showDebugConsole },
                    shape = BrushIQShapes.large,
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    border = androidx.compose.foundation.BorderStroke(Dimensions.BorderWidth, MaterialTheme.colorScheme.outline)
                ) {
                    Column(modifier = Modifier.padding(Dimensions.PaddingMedium)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Default.Terminal, contentDescription = null, modifier = Modifier.size(16.dp), tint = PrimaryMain)
                                Spacer(modifier = Modifier.width(8.dp))
                                Text("AI DEBUG CONSOLE", style = MaterialTheme.typography.labelSmall, color = PrimaryMain)
                            }
                            Icon(
                                if (showDebugConsole) Icons.Default.ExpandLess else Icons.Default.ExpandMore,
                                contentDescription = "Toggle Debug Console",
                                tint = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }

                        if (showDebugConsole) {
                            Spacer(modifier = Modifier.height(12.dp))
                            Surface(
                                modifier = Modifier.fillMaxWidth(),
                                color = DarkBg,
                                shape = BrushIQShapes.medium
                            ) {
                                Column(modifier = Modifier.padding(12.dp)) {
                                    DebugLine("model", "brushiq-cnn-v2.4.1")
                                    DebugLine("inference_time", "247ms")
                                    DebugLine("confidence", "${scan.confidenceScore}%")
                                    DebugLine("wear_index", "${scan.wearPercentage}")
                                    DebugLine("health_score", "${scan.healthScore}")
                                    DebugLine("bristle_spread", "${scan.bristleSpreading}%")
                                    DebugLine("bristle_bend", "${scan.bristleBending}%")
                                    DebugLine("bristle_damage", "${scan.bristleDamage}%")
                                    DebugLine("condition", scan.condition)
                                    DebugLine("remaining_days", "${scan.remainingLifeDays}")
                                    DebugLine("scan_date", scan.scanDate)
                                }
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(24.dp))

                // Action Buttons
                PrimaryButton(
                    text = "Share Report",
                    onClick = { /* Share intent */ },
                    modifier = Modifier.fillMaxWidth()
                )

                Spacer(modifier = Modifier.height(12.dp))

                SecondaryButton(
                    text = "Export Summary",
                    onClick = { /* Export */ },
                    modifier = Modifier.fillMaxWidth()
                )

                Spacer(modifier = Modifier.height(80.dp))
            }
        }
    }
}

data class ScanDetailData(
    val healthScore: Double,
    val condition: String,
    val confidenceScore: Double,
    val wearPercentage: Double,
    val bristleSpreading: Double,
    val bristleBending: Double,
    val bristleDamage: Double,
    val brushingFrequency: String,
    val detectedIssues: List<String>,
    val aiRecommendation: String,
    val scanDate: String,
    val remainingLifeDays: Int,
    val toothbrushModel: String,
    val memberName: String
)

@Composable
fun DetailMetricItem(label: String, value: String, modifier: Modifier = Modifier) {
    Surface(
        modifier = modifier.padding(horizontal = 4.dp),
        color = MaterialTheme.colorScheme.background,
        shape = BrushIQShapes.medium
    ) {
        Column(
            modifier = Modifier.padding(10.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(label.uppercase(), style = TextStyle(fontSize = 8.sp, fontWeight = FontWeight.Bold, letterSpacing = 0.5.sp), color = MaterialTheme.colorScheme.onSurfaceVariant)
            Spacer(modifier = Modifier.height(4.dp))
            Text(value, style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Black), color = MaterialTheme.colorScheme.onSurface)
        }
    }
}

@Composable
fun DebugLine(key: String, value: String) {
    Row(modifier = Modifier.padding(vertical = 2.dp)) {
        Text("$key: ", style = TextStyle(fontSize = 11.sp, fontWeight = FontWeight.Bold, color = SecondaryMain))
        Text(value, style = TextStyle(fontSize = 11.sp, color = Color(0xFFA5B4FC)))
    }
}

@Preview(showBackground = true)
@Composable
fun PreviewScanDetailsScreen() {
    BrushIQTheme {
        ScanDetailsScreen(scanId = "scan-101", navController = rememberNavController())
    }
}
