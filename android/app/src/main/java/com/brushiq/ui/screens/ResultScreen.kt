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
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavController
import coil.compose.AsyncImage
import com.brushiq.domain.repository.ScanReport
import com.brushiq.ui.components.*
import com.brushiq.ui.theme.*
import com.brushiq.ui.viewmodel.BrushIQViewModel
import com.brushiq.ui.viewmodel.ScanViewModel

@Composable
fun ResultScreen(
    navController: NavController,
    viewModel: BrushIQViewModel = hiltViewModel(),
    scanViewModel: ScanViewModel = hiltViewModel()
) {
    val result by scanViewModel.mockResult.collectAsState()
    val scrollState = rememberScrollState()
    val context = LocalContext.current
    var isSaving by remember { mutableStateOf(false) }
    var isSaved by remember { mutableStateOf(false) }

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
                                    text = "AI Confidence: ${report.confidenceScore.toInt()}%",
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

            // 3. Detected Issues
            DetectedIssuesSection(report)

            // 4. Statistics Grid (Including Days Used)
            StatisticsGridPanel(report)

            // 5. AI Recommendation Card
            AiRecommendationCard(report.aiRecommendation)

            // 6. AI Debug Console (Collapsible)
            ResultAiDebugConsole(report)

            // 7. Actions
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                PrimaryButton(
                    text = if (isSaving) "Saving to Database..." else if (isSaved) "Report Saved!" else "Save AI Report",
                    onClick = {
                        if (isSaving || isSaved) return@PrimaryButton
                        isSaving = true
                        android.util.Log.d("SAVE", "[SAVE] Button clicked. Preparing request...")
                        
                        val vm = viewModel
                        if (vm == null) {
                            isSaving = false
                            android.util.Log.e("SAVE", "[SAVE] Exception = BrushIQViewModel is null!")
                            Toast.makeText(context, "Save Failed: ViewModel not initialized", Toast.LENGTH_LONG).show()
                            return@PrimaryButton
                        }

                        android.util.Log.d("SAVE", "[SAVE] toothbrushId = '${report.toothbrushId}', healthScore = ${report.healthScore}")
                        vm.saveAnalysisReport(
                            toothbrushId = report.toothbrushId,
                            report = report,
                            frequency = "2x daily",
                            onSuccess = {
                                isSaving = false
                                isSaved = true
                                android.util.Log.d("SAVE", "[SAVE] Save successful confirmed by backend!")
                                Toast.makeText(context, "Diagnostic report saved successfully!", Toast.LENGTH_SHORT).show()
                                navController.navigate("dashboard") {
                                    popUpTo("dashboard") { inclusive = true }
                                }
                            },
                            onError = { err ->
                                isSaving = false
                                android.util.Log.e("SAVE", "[SAVE] Save failed: $err")
                                Toast.makeText(context, "Save Failed: $err", Toast.LENGTH_LONG).show()
                            }
                        )
                    },
                    enabled = !isSaving
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
fun DiagnosticSummaryHeader(report: ScanReport, conditionColor: Color) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = BrushIQShapes.large,
        colors = CardDefaults.cardColors(containerColor = conditionColor.copy(alpha = 0.08f)),
        border = androidx.compose.foundation.BorderStroke(1.dp, conditionColor.copy(alpha = 0.25f))
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(48.dp)
                    .clip(CircleShape)
                    .background(conditionColor.copy(alpha = 0.15f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = when (report.condition) {
                        "Good" -> Icons.Default.CheckCircle
                        "Moderate Wear" -> Icons.Default.Warning
                        "Replace Soon" -> Icons.Default.Error
                        else -> Icons.Default.ReportProblem
                    },
                    contentDescription = null,
                    tint = conditionColor,
                    modifier = Modifier.size(26.dp)
                )
            }
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = "STATUS: ${report.condition.uppercase()}",
                    style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Black),
                    color = conditionColor
                )
                Spacer(modifier = Modifier.height(2.dp))
                Text(
                    text = if (report.healthScore >= 70) "Toothbrush bristles are in effective condition." else "Bristle degradation detected. Consider replacement.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurface
                )
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
            Text(
                text = "DETECTED ANOMALIES",
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )

            if (report.detectedIssues.isEmpty()) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Icon(Icons.Default.CheckCircle, contentDescription = null, tint = Success, modifier = Modifier.size(18.dp))
                    Text("No structural defects or severe bristle splaying detected.", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurface)
                }
            } else {
                report.detectedIssues.forEach { issue ->
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Icon(Icons.Default.ErrorOutline, contentDescription = null, tint = Warning, modifier = Modifier.size(18.dp))
                        Text(issue, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurface)
                    }
                }
            }
        }
    }
}

@Composable
fun StatisticsGridPanel(report: ScanReport) {
    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
        Card(
            modifier = Modifier.weight(1f),
            shape = BrushIQShapes.medium,
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
        ) {
            Column(modifier = Modifier.padding(14.dp)) {
                Text("REMAINING LIFE", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                Spacer(modifier = Modifier.height(4.dp))
                Text("${report.remainingLifeDays} Days", style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold), color = PrimaryMain)
            }
        }

        Card(
            modifier = Modifier.weight(1f),
            shape = BrushIQShapes.medium,
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
        ) {
            Column(modifier = Modifier.padding(14.dp)) {
                Text("WEAR LEVEL", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                Spacer(modifier = Modifier.height(4.dp))
                Text("${report.wearPercentage.toInt()}%", style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold), color = SecondaryMain)
            }
        }
    }
}

@Composable
fun AiRecommendationCard(recommendation: String) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = BrushIQShapes.large,
        colors = CardDefaults.cardColors(containerColor = PrimaryMain.copy(alpha = 0.06f)),
        border = androidx.compose.foundation.BorderStroke(1.dp, PrimaryMain.copy(alpha = 0.15f))
    ) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Icon(Icons.Default.Lightbulb, contentDescription = null, tint = PrimaryMain, modifier = Modifier.size(20.dp))
                Text("AI RECOMMENDATION", style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold), color = PrimaryMain)
            }
            Text(recommendation, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurface)
        }
    }
}

@Composable
fun ResultAiDebugConsole(report: ScanReport) {
    var expanded by remember { mutableStateOf(false) }

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = BrushIQShapes.medium,
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f))
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { expanded = !expanded },
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("Technical Diagnostic Details", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                Icon(if (expanded) Icons.Default.ExpandLess else Icons.Default.ExpandMore, contentDescription = null, tint = MaterialTheme.colorScheme.onSurfaceVariant)
            }

            if (expanded) {
                Spacer(modifier = Modifier.height(8.dp))
                Text("Scan ID: ${report.id}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurface)
                Text("Toothbrush ID: ${report.toothbrushId}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurface)
                Text("Confidence Score: ${report.confidenceScore}%", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurface)
                Text("Bristle Spreading: ${report.bristleSpreading}%", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurface)
                Text("Bristle Bending: ${report.bristleBending}%", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurface)
                Text("Bristle Damage: ${report.bristleDamage}%", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurface)
            }
        }
    }
}
