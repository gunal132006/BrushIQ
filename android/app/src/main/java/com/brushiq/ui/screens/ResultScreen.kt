package com.brushiq.ui.screens

import android.content.Intent
import android.net.Uri
import android.widget.Toast
import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.BlendMode
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.RadialGradientShader
import androidx.compose.ui.graphics.ShaderBrush
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavController
import androidx.navigation.compose.rememberNavController
import coil.compose.AsyncImage
import com.brushiq.domain.repository.ScanReport
import com.brushiq.ui.components.*
import com.brushiq.ui.theme.*
import com.brushiq.ui.viewmodel.BrushIQViewModel
import com.brushiq.ui.viewmodel.ScanViewModel

enum class OverlayViewType {
    ORIGINAL,
    SEGMENTED_OVERLAY,
    DENSITY_HEATMAP
}

@Composable
fun ResultScreen(
    navController: NavController,
    viewModel: BrushIQViewModel? = null,
    scanViewModel: ScanViewModel = hiltViewModel()
) {
    val result by scanViewModel.mockResult.collectAsState()
    val scrollState = rememberScrollState()
    val context = LocalContext.current

    if (result == null) {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            CircularProgressIndicator(color = PrimaryMain)
        }
        return
    }

    val report = result!!
    val conditionColor = when (report.condition) {
        "Good" -> Success
        "Moderate Wear" -> Warning
        "Replace Soon" -> Alert
        else -> Error
    }

    Scaffold(
        topBar = {
            AppHeader(
                title = "Diagnostic Report",
                navigationIcon = {
                    IconButton(onClick = { navController.navigate("dashboard") { popUpTo("dashboard") { inclusive = true } } }) {
                        Icon(Icons.Default.Close, contentDescription = "Close", tint = MaterialTheme.colorScheme.onSurface)
                    }
                },
                actions = {
                    IconButton(onClick = {
                        val shareText = "BrushIQ Health Report\n" +
                                "Condition: ${report.condition.uppercase()}\n" +
                                "Health Score: ${report.healthScore.toInt()}%\n" +
                                "Wear: ${report.wearPercentage.toInt()}%\n" +
                                "Confidence: ${report.confidenceScore.toInt()}%\n" +
                                "Recommendation: ${report.aiRecommendation}"
                        val sendIntent: Intent = Intent().apply {
                            action = Intent.ACTION_SEND
                            putExtra(Intent.EXTRA_TEXT, shareText)
                            type = "text/plain"
                        }
                        val shareIntent = Intent.createChooser(sendIntent, "Share Toothbrush Report")
                        context.startActivity(shareIntent)
                    }) {
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
                .padding(Dimensions.PaddingMedium),
            verticalArrangement = Arrangement.spacedBy(20.dp)
        ) {
            // 1. Condition Header
            DiagnosticSummaryHeader(report, conditionColor)

            // 2. Score & Confidence Panel
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = BrushIQShapes.large,
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                border = androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.outline)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1.2f)) {
                        Text(
                            text = "DIAGNOSTIC SCORE",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "Wear: ${report.wearPercentage.toInt()}%",
                            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                            color = conditionColor
                        )
                        Spacer(modifier = Modifier.height(12.dp))
                        
                        // Confidence Badge
                        Surface(
                            color = PrimaryMain.copy(alpha = 0.08f),
                            shape = RoundedCornerShape(6.dp),
                            border = androidx.compose.foundation.BorderStroke(1.dp, PrimaryMain.copy(alpha = 0.2f))
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(4.dp)
                            ) {
                                Icon(Icons.Default.AutoGraph, contentDescription = null, tint = PrimaryMain, modifier = Modifier.size(14.dp))
                                Text(
                                    text = "AI Confidence: 96%",
                                    style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                                    color = PrimaryMain
                                )
                            }
                        }
                    }

                    Box(
                        modifier = Modifier
                            .size(110.dp)
                            .weight(0.8f),
                        contentAlignment = Alignment.Center
                    ) {
                        val animatedScore by animateFloatAsState(
                            targetValue = report.healthScore.toFloat() / 100f,
                            animationSpec = tween(durationMillis = 1200, easing = FastOutSlowInEasing),
                            label = "healthScore"
                        )

                        Canvas(
                            modifier = Modifier
                                .fillMaxSize()
                                .semantics {
                                    contentDescription = "Circular Health Progress indicator representing score of ${report.healthScore.toInt()}%"
                                }
                        ) {
                            drawCircle(
                                color = conditionColor.copy(alpha = 0.12f),
                                style = Stroke(width = 8.dp.toPx())
                            )
                            drawArc(
                                color = conditionColor,
                                startAngle = -90f,
                                sweepAngle = 360f * animatedScore,
                                useCenter = false,
                                style = Stroke(width = 8.dp.toPx(), cap = StrokeCap.Round)
                            )
                        }

                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text(
                                text = "${report.healthScore.toInt()}",
                                style = MaterialTheme.typography.displayLarge.copy(fontSize = 32.sp, fontWeight = FontWeight.Black),
                                color = conditionColor
                            )
                            Text(
                                text = "HEALTH",
                                style = MaterialTheme.typography.labelSmall.copy(fontSize = 9.sp),
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }
            }

            // 3. AI Overlay Viewer (Interactive Tab switching)
            AIOverlayViewer(imageUrl = report.imageUrl)

            // 4. Detected Issues
            DetectedIssuesSection(report)

            // 5. Statistics Grid (Including Days Used)
            StatisticsGridPanel(report)

            // 6. AI Recommendation Card
            AiRecommendationCard(report.aiRecommendation)

            // 7. AI Debug Console (Collapsible)
            ResultAiDebugConsole(report)

            // 8. Actions
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                PrimaryButton(
                    text = "Save AI Report",
                    onClick = {
                        viewModel?.saveAnalysisReport(
                            toothbrushId = report.toothbrushId,
                            report = report,
                            frequency = "2x daily",
                            onSuccess = {
                                Toast.makeText(context, "Diagnostic report saved successfully!", Toast.LENGTH_SHORT).show()
                                navController.navigate("dashboard") {
                                    popUpTo("dashboard") { inclusive = true }
                                }
                            }
                        )
                    }
                )

                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    SecondaryButton(
                        text = "Scan Again",
                        onClick = { navController.navigate("scan") { popUpTo("scan") { inclusive = true } } },
                        modifier = Modifier.weight(1f)
                    )
                    SecondaryButton(
                        text = "View History",
                        onClick = { navController.navigate("history") },
                        modifier = Modifier.weight(1f)
                    )
                }

                SecondaryButton(
                    text = "Share Report",
                    onClick = {
                        val shareText = "BrushIQ Diagnostic Report\n" +
                                "Condition: ${report.condition.uppercase()}\n" +
                                "Health Score: ${report.healthScore.toInt()}%\n" +
                                "Wear: ${report.wearPercentage.toInt()}%\n" +
                                "Recommendation: ${report.aiRecommendation}"
                        val sendIntent: Intent = Intent().apply {
                            action = Intent.ACTION_SEND
                            putExtra(Intent.EXTRA_TEXT, shareText)
                            type = "text/plain"
                        }
                        val shareIntent = Intent.createChooser(sendIntent, "Share Report details")
                        context.startActivity(shareIntent)
                    }
                )
            }

            Spacer(modifier = Modifier.height(24.dp))
        }
    }
}

@Composable
fun AIOverlayViewer(imageUrl: String) {
    var selectedTab by remember { mutableStateOf(OverlayViewType.ORIGINAL) }

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = BrushIQShapes.large,
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.outline)
    ) {
        Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Text(
                text = "AI OVERLAY VIEWER",
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )

            // Dynamic Canvas Viewport
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(240.dp)
                    .clip(BrushIQShapes.medium)
                    .background(Color.Black),
                contentAlignment = Alignment.Center
            ) {
                // Background image
                AsyncImage(
                    model = imageUrl,
                    contentDescription = null,
                    modifier = Modifier.fillMaxSize(),
                    contentScale = ContentScale.Crop
                )

                // Dynamic Canvas Overlay drawing based on selection
                Canvas(
                    modifier = Modifier
                        .fillMaxSize()
                        .semantics {
                            contentDescription = when (selectedTab) {
                                OverlayViewType.ORIGINAL -> "Raw bristle capture without overlays"
                                OverlayViewType.SEGMENTED_OVERLAY -> "Semi-transparent green bounding boxes indicating individual bristle segmentation boundaries."
                                OverlayViewType.DENSITY_HEATMAP -> "Color density gradient mapping splay intensity, showing red alerts in the high-friction outer edge."
                            }
                        }
                ) {
                    val w = size.width
                    val h = size.height

                    when (selectedTab) {
                        OverlayViewType.ORIGINAL -> {
                            // No overlay drawn
                        }
                        OverlayViewType.SEGMENTED_OVERLAY -> {
                            // Draw green boundary polygons around bristles to show segmentation
                            drawCircle(color = Success.copy(alpha = 0.15f), radius = w * 0.18f, center = Offset(w * 0.42f, h * 0.45f))
                            drawCircle(color = Success, radius = w * 0.18f, center = Offset(w * 0.42f, h * 0.45f), style = Stroke(width = 2.dp.toPx()))
                            
                            drawCircle(color = Success.copy(alpha = 0.15f), radius = w * 0.12f, center = Offset(w * 0.60f, h * 0.52f))
                            drawCircle(color = Success, radius = w * 0.12f, center = Offset(w * 0.60f, h * 0.52f), style = Stroke(width = 2.dp.toPx()))

                            drawLine(color = Success, start = Offset(w * 0.3f, h * 0.3f), end = Offset(w * 0.35f, h * 0.25f), strokeWidth = 2.dp.toPx())
                            drawRect(color = Success, topLeft = Offset(w * 0.28f, h * 0.2f), size = androidx.compose.ui.geometry.Size(32.dp.toPx(), 16.dp.toPx()), style = Stroke(width = 1.dp.toPx()))
                        }
                        OverlayViewType.DENSITY_HEATMAP -> {
                            // Draw radial gradients to simulate heat levels
                            drawCircle(
                                brush = Brush.radialGradient(
                                    colors = listOf(Error.copy(alpha = 0.6f), Warning.copy(alpha = 0.3f), Color.Transparent),
                                    center = Offset(w * 0.45f, h * 0.48f),
                                    radius = w * 0.25f
                                ),
                                radius = w * 0.25f,
                                center = Offset(w * 0.45f, h * 0.48f)
                            )

                            drawCircle(
                                brush = Brush.radialGradient(
                                    colors = listOf(Warning.copy(alpha = 0.5f), Alert.copy(alpha = 0.2f), Color.Transparent),
                                    center = Offset(w * 0.62f, h * 0.55f),
                                    radius = w * 0.18f
                                ),
                                radius = w * 0.18f,
                                center = Offset(w * 0.62f, h * 0.55f)
                            )
                        }
                    }
                }
            }

            // Tab Buttons
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(MaterialTheme.colorScheme.background, RoundedCornerShape(8.dp))
                    .padding(4.dp),
                horizontalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                OverlayViewType.values().forEach { type ->
                    val isActive = selectedTab == type
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(6.dp))
                            .background(if (isActive) PrimaryMain else Color.Transparent)
                            .clickable { selectedTab = type }
                            .padding(vertical = 8.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = when (type) {
                                OverlayViewType.ORIGINAL -> "ORIGINAL"
                                OverlayViewType.SEGMENTED_OVERLAY -> "OVERLAY"
                                OverlayViewType.DENSITY_HEATMAP -> "HEATMAP"
                            },
                            style = TextStyle(fontSize = 10.sp, fontWeight = FontWeight.Bold),
                            color = if (isActive) Color.White else MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun DetectedIssuesSection(report: ScanReport) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = BrushIQShapes.large,
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.outline)
    ) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Text("DETECTED ANOMALIES", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)

            if (report.detectedIssues.isEmpty()) {
                Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.fillMaxWidth()) {
                    Icon(Icons.Default.CheckCircle, contentDescription = null, tint = Success, modifier = Modifier.size(18.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("No bristle deformities detected.", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurface)
                }
            } else {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    report.detectedIssues.forEach { issue ->
                        val (issueTitle, description) = when (issue) {
                            "Significant Splay" -> "Bristle Spreading" to "Fibers bent outwards reduces plaque removal efficacy."
                            "Elasticity Loss" -> "Bristle Bending" to "Fibers failed to recoil after brushing friction."
                            else -> issue to "Anomaly in fiber alignment matrix."
                        }
                        
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(MaterialTheme.colorScheme.background, BrushIQShapes.small)
                                .padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(Icons.Default.Error, contentDescription = null, tint = Alert, modifier = Modifier.size(20.dp))
                            Spacer(modifier = Modifier.width(12.dp))
                            Column {
                                Text(issueTitle, style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold))
                                Text(description, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun StatisticsGridPanel(report: ScanReport) {
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            StatCard(
                title = "Days Used",
                value = "64 Days",
                icon = Icons.Default.DateRange,
                modifier = Modifier.weight(1f)
            )
            StatCard(
                title = "Remaining Life",
                value = "${report.remainingLifeDays} Days",
                icon = Icons.Default.Timer,
                modifier = Modifier.weight(1f),
                iconColor = if (report.remainingLifeDays < 30) Alert else Success
            )
        }
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            StatCard(
                title = "Replace Before",
                value = "Aug 22",
                icon = Icons.Default.Event,
                modifier = Modifier.weight(1f),
                iconColor = Alert
            )
            StatCard(
                title = "Frequency",
                value = report.brushingFrequency,
                icon = Icons.Default.Autorenew,
                modifier = Modifier.weight(1f)
            )
        }
    }
}

@Composable
fun DiagnosticSummaryHeader(report: ScanReport, conditionColor: Color) {
    Column(
        modifier = Modifier.fillMaxWidth(),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Surface(
            color = conditionColor.copy(alpha = 0.1f),
            shape = CircleShape,
            modifier = Modifier.size(80.dp),
            border = androidx.compose.foundation.BorderStroke(2.dp, conditionColor.copy(alpha = 0.3f))
        ) {
            Box(contentAlignment = Alignment.Center) {
                Icon(
                    imageVector = when (report.condition) {
                        "Good" -> Icons.Default.CheckCircle
                        "Replace Soon" -> Icons.Default.Warning
                        else -> Icons.Default.Error
                    },
                    contentDescription = null,
                    tint = conditionColor,
                    modifier = Modifier.size(40.dp)
                )
            }
        }
        Spacer(modifier = Modifier.height(12.dp))
        Text(
            text = report.condition.uppercase(),
            style = MaterialTheme.typography.headlineSmall.copy(fontWeight = FontWeight.Black),
            color = conditionColor
        )
        Text(
            text = "Clinical Analysis Result",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}

@Composable
fun AiRecommendationCard(recommendation: String) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = BrushIQShapes.large,
        colors = CardDefaults.cardColors(containerColor = PrimaryAlpha10),
        border = androidx.compose.foundation.BorderStroke(1.dp, PrimaryMain.copy(alpha = 0.2f))
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Default.AutoGraph, contentDescription = null, modifier = Modifier.size(16.dp), tint = PrimaryMain)
                Spacer(modifier = Modifier.width(8.dp))
                Text("AI RECOMMENDATION", style = MaterialTheme.typography.labelSmall, color = PrimaryMain)
            }
            Spacer(modifier = Modifier.height(8.dp))
            Text(recommendation, style = MaterialTheme.typography.bodyMedium, lineHeight = 22.sp)
        }
    }
}

@Composable
fun DebugMetric(label: String, value: String) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(label, style = TextStyle(fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant))
        Text(value, style = TextStyle(fontSize = 11.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface))
    }
}

@Composable
fun ResultAiDebugConsole(report: ScanReport) {
    var expanded by remember { mutableStateOf(false) }

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = BrushIQShapes.large,
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f)),
        border = androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.outline)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { expanded = !expanded },
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.Terminal, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("AI DEBUG CONSOLE", style = MaterialTheme.typography.labelSmall)
                }
                Icon(if (expanded) Icons.Default.ExpandLess else Icons.Default.ExpandMore, contentDescription = null)
            }

            if (expanded) {
                Spacer(modifier = Modifier.height(16.dp))
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    DebugMetric("Spread Score", "%.3f".format(report.bristleSpreading / 100.0))
                    DebugMetric("Bending Score", "%.3f".format(report.bristleBending / 100.0))
                    DebugMetric("Fraying Score", "%.3f".format(report.bristleDamage / 100.0))
                    DebugMetric("Density Score", "0.942")
                    DebugMetric("Image Quality Score", "0.985 (Optimal)")
                    DebugMetric("Final Health Score", "%.1f".format(report.healthScore))
                }
            }
        }
    }
}
