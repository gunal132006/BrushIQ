package com.brushiq.ui.screens

import android.widget.Toast
import androidx.compose.animation.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavController
import androidx.navigation.compose.rememberNavController
import com.brushiq.domain.repository.FamilyMember
import com.brushiq.domain.repository.Reminder
import com.brushiq.domain.repository.ScanReport
import com.brushiq.domain.repository.Toothbrush
import com.brushiq.ui.components.*
import com.brushiq.ui.theme.*
import com.brushiq.ui.viewmodel.BrushIQViewModel
import kotlinx.coroutines.flow.MutableStateFlow

enum class ChartViewType {
    WEEKLY,
    MONTHLY,
    ALL_TIME
}

@Composable
fun MemberDossierScreen(
    memberId: String,
    navController: NavController,
    viewModel: BrushIQViewModel = hiltViewModel()
) {
    val context = LocalContext.current
    val scrollState = rememberScrollState()

    // Observe flows from ViewModel
    val familyMembers by viewModel.familyMembers.collectAsState()
    val toothbrushes by viewModel.toothbrushes.collectAsState()
    val reminders by viewModel.activeReminders.collectAsState()
    val tips by viewModel.tips.collectAsState()

    // Find current member
    val currentMember = familyMembers.find { it.id == memberId }

    // Modal Control
    var showAssignModal by remember { mutableStateOf(false) }
    var chartTab by remember { mutableStateOf(ChartViewType.MONTHLY) }

    LaunchedEffect(memberId) {
        viewModel.syncAllData()
    }

    if (currentMember == null) {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            CircularProgressIndicator(color = PrimaryMain)
        }
        return
    }

    val memberToothbrush = toothbrushes.find { it.familyMemberId == memberId }
    val memberReminders = reminders.filter { it.familyMemberId == memberId }
    
    // Member specific scans (or fallback mock list)
    val mockScanList = remember(currentMember.healthScore) {
        val health = currentMember.healthScore ?: 80.0
        listOf(
            ScanReport(
                id = "1", toothbrushId = "b1", imageUrl = "", wearPercentage = 100.0 - health,
                healthScore = health, remainingLifeDays = 45, condition = currentMember.toothbrushCondition ?: "Good",
                confidenceScore = 96.0, bristleSpreading = 12.0, bristleBending = 14.0, bristleDamage = 5.0,
                brushingFrequency = "2x daily", detectedIssues = emptyList(), aiRecommendation = "Optimal", scanDate = "Jun 14"
            ),
            ScanReport(
                id = "2", toothbrushId = "b1", imageUrl = "", wearPercentage = 15.0,
                healthScore = 85.0, remainingLifeDays = 60, condition = "Good",
                confidenceScore = 95.0, bristleSpreading = 8.0, bristleBending = 10.0, bristleDamage = 4.0,
                brushingFrequency = "2x daily", detectedIssues = emptyList(), aiRecommendation = "Optimal", scanDate = "Jun 01"
            )
        )
    }

    Scaffold(
        topBar = {
            AppHeader(
                title = "Profile Dossier",
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = MaterialTheme.colorScheme.onSurface)
                    }
                },
                actions = {
                    IconButton(onClick = { navController.navigate("edit_member/${currentMember.id}") }) {
                        Icon(Icons.Default.Edit, contentDescription = "Edit Profile", tint = PrimaryMain)
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
            verticalArrangement = Arrangement.spacedBy(24.dp)
        ) {
            // 1. Profile Header
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = BrushIQShapes.large,
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                border = androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.outline)
            ) {
                Row(
                    modifier = Modifier.padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier
                            .size(64.dp)
                            .clip(CircleShape)
                            .background(PrimaryAlpha10),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(Icons.Default.Person, contentDescription = null, tint = PrimaryMain, modifier = Modifier.size(32.dp))
                    }

                    Spacer(modifier = Modifier.width(16.dp))

                    Column(modifier = Modifier.weight(1f)) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Text(
                                text = currentMember.name,
                                style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold),
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                            Surface(color = PrimaryAlpha10, shape = CircleShape) {
                                Text(
                                    text = currentMember.relationship.uppercase(),
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp),
                                    style = TextStyle(fontSize = 8.sp, fontWeight = FontWeight.Black, letterSpacing = 0.5.sp),
                                    color = PrimaryMain
                                )
                            }
                        }
                        Text(
                            text = "${currentMember.age} Years • ${currentMember.gender.uppercase()}",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }

            // 2. Family Member Statistics Panel
            MemberStatsPanel(
                totalScans = mockScanList.size,
                avgHealthScore = currentMember.healthScore?.toInt() ?: 0,
                activeToothbrushes = if (memberToothbrush != null) 1 else 0,
                pendingReplacements = if (currentMember.healthScore != null && currentMember.healthScore!! < 50) 1 else 0
            )

            // 3. Custom Canvas Health Trend Chart with Accessibility semantics
            Text(
                text = "Clinical Health Trend",
                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
            )
            HealthTrendChartCard(chartTab = chartTab, onTabSelect = { chartTab = it })

            // 4. Assigned Toothbrush
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Assigned Toothbrush",
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                )
                if (memberToothbrush != null) {
                    TextButton(onClick = { showAssignModal = true }) {
                        Text("Reassign", color = PrimaryMain, fontWeight = FontWeight.Bold)
                    }
                }
            }

            if (memberToothbrush == null) {
                DossierEmptyState(
                    title = "No Toothbrush Assigned",
                    description = "Diagnose bristle wear patterns by linking a manual or electric brush.",
                    icon = Icons.Default.Cancel,
                    buttonText = "Assign Toothbrush",
                    onAction = { showAssignModal = true }
                )
            } else {
                BrushCard(
                    brand = memberToothbrush.brand,
                    model = memberToothbrush.model,
                    type = memberToothbrush.type,
                    memberName = currentMember.name,
                    color = memberToothbrush.color,
                    purchaseDate = memberToothbrush.purchaseDate,
                    onEdit = { showAssignModal = true },
                    onDelete = { viewModel.deleteToothbrush(memberToothbrush.id) }
                )
            }

            // 5. Recent Scan History
            Text(
                text = "Recent Scans",
                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
            )
            if (currentMember.healthScore == null) {
                DossierEmptyState(
                    title = "No Scan History",
                    description = "Perform a visual analysis to compile clinical wear reports.",
                    icon = Icons.Default.ImageSearch,
                    buttonText = "Scan Now",
                    onAction = { navController.navigate("scan") }
                )
            } else {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    mockScanList.forEach { reportItem ->
                        RecentScanItem(
                            name = currentMember.name,
                            model = memberToothbrush?.let { "${it.brand} ${it.model}" } ?: "Toothbrush",
                            score = reportItem.healthScore.toInt(),
                            condition = reportItem.condition
                        )
                    }
                }
            }

            // 6. Active Reminders
            Text(
                text = "Active Reminders",
                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
            )
            if (memberReminders.isEmpty()) {
                DossierEmptyState(
                    title = "No Active Reminders",
                    description = "Schedule routine diagnostic alerts to check for fiber wear.",
                    icon = Icons.Default.NotificationsNone,
                    buttonText = "Set Reminder",
                    onAction = { navController.navigate("reminders") }
                )
            } else {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    memberReminders.forEach { reminder ->
                        ReminderCard(
                            memberName = currentMember.name,
                            brushBrand = reminder.toothbrushBrand ?: "Toothbrush",
                            type = reminder.type,
                            message = reminder.message,
                            nextDate = reminder.nextReminderDate,
                            onComplete = { viewModel.completeReminder(reminder.id) }
                        )
                    }
                }
            }

            // 7. Personalized Tips
            if (tips.isNotEmpty()) {
                Text(
                    text = "Personalized Advice",
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                )
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 24.dp),
                    horizontalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    tips.take(2).forEach { tip ->
                        Box(modifier = Modifier.width(220.dp)) {
                            TipCard(
                                title = tip.title,
                                content = tip.content,
                                category = tip.category,
                                illustrationUrl = tip.illustrationUrl,
                                isBookmarked = false,
                                onToggleBookmark = {},
                                onReadMore = { navController.navigate("tip_detail/${tip.id}") }
                            )
                        }
                    }
                }
            }
        }

        // Toothbrush Assignment Dialog
        if (showAssignModal) {
            AssignToothbrushDialog(
                onDismiss = { showAssignModal = false },
                onAssign = { brand, model, color, type, date ->
                    viewModel.addToothbrush(
                        familyMemberId = memberId,
                        brand = brand,
                        model = model,
                        color = color,
                        type = type,
                        purchaseDate = date
                    )
                    Toast.makeText(context, "Toothbrush linked and states refreshed!", Toast.LENGTH_SHORT).show()
                    showAssignModal = false
                }
            )
        }
    }
}

@Composable
fun MemberStatsPanel(
    totalScans: Int,
    avgHealthScore: Int,
    activeToothbrushes: Int,
    pendingReplacements: Int
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = BrushIQShapes.medium,
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.outline)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.weight(1f)) {
                Text(text = "SCANS", style = TextStyle(fontSize = 9.sp, color = MaterialTheme.colorScheme.onSurfaceVariant, fontWeight = FontWeight.Bold))
                Spacer(modifier = Modifier.height(4.dp))
                Text(text = "$totalScans", style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Black))
            }
            Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.weight(1f)) {
                Text(text = "AVG HEALTH", style = TextStyle(fontSize = 9.sp, color = MaterialTheme.colorScheme.onSurfaceVariant, fontWeight = FontWeight.Bold))
                Spacer(modifier = Modifier.height(4.dp))
                Text(text = if (avgHealthScore > 0) "$avgHealthScore%" else "--", style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Black, color = if (avgHealthScore > 50) Success else Alert))
            }
            Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.weight(1f)) {
                Text(text = "BRUSHES", style = TextStyle(fontSize = 9.sp, color = MaterialTheme.colorScheme.onSurfaceVariant, fontWeight = FontWeight.Bold))
                Spacer(modifier = Modifier.height(4.dp))
                Text(text = "$activeToothbrushes", style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Black))
            }
            Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.weight(1f)) {
                Text(text = "REPLACEMENTS", style = TextStyle(fontSize = 9.sp, color = MaterialTheme.colorScheme.onSurfaceVariant, fontWeight = FontWeight.Bold))
                Spacer(modifier = Modifier.height(4.dp))
                Text(text = "$pendingReplacements", style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Black, color = if (pendingReplacements > 0) Error else MaterialTheme.colorScheme.onSurface))
            }
        }
    }
}

@Composable
fun HealthTrendChartCard(
    chartTab: ChartViewType,
    onTabSelect: (ChartViewType) -> Unit
) {
    // Generate Accessibility Text Descriptions
    val accessibilityDescription = when (chartTab) {
        ChartViewType.WEEKLY -> "Brushing wear chart: weekly view showing steady health score decline from 88 percent down to 85 percent over the last 3 scans."
        ChartViewType.MONTHLY -> "Brushing wear chart: monthly view showing health score decline from 95 percent to 83 percent over the last 5 scans."
        ChartViewType.ALL_TIME -> "Brushing wear chart: all time view showing health score progression from 98 percent down to 45 percent wear threshold across 9 scans."
    }

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = BrushIQShapes.large,
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.outline)
    ) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
            // Segmented Toggles
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(MaterialTheme.colorScheme.background, RoundedCornerShape(8.dp))
                    .padding(3.dp),
                horizontalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                ChartViewType.values().forEach { tab ->
                    val isActive = chartTab == tab
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(6.dp))
                            .background(if (isActive) PrimaryMain else Color.Transparent)
                            .clickable { onTabSelect(tab) }
                            .padding(vertical = 6.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = when (tab) {
                                ChartViewType.WEEKLY -> "Weekly"
                                ChartViewType.MONTHLY -> "Monthly"
                                ChartViewType.ALL_TIME -> "All Time"
                            },
                            style = TextStyle(fontSize = 10.sp, fontWeight = FontWeight.Bold),
                            color = if (isActive) Color.White else MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }

            // Canvas drawing line plot
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(130.dp)
                    .semantics { contentDescription = accessibilityDescription }
            ) {
                Canvas(modifier = Modifier.fillMaxSize()) {
                    val w = size.width
                    val h = size.height
                    
                    // 1. Draw horizontal guidelines
                    val gridSteps = 4
                    for (i in 0..gridSteps) {
                        val y = h * i / gridSteps
                        drawLine(
                            color = Color.LightGray.copy(alpha = 0.3f),
                            start = Offset(0f, y),
                            end = Offset(w, y),
                            strokeWidth = 1.dp.toPx()
                        )
                    }

                    // 2. Map Data Points based on Timeframe
                    val dataPoints = when (chartTab) {
                        ChartViewType.WEEKLY -> listOf(88f, 86f, 85f)
                        ChartViewType.MONTHLY -> listOf(95f, 92f, 89f, 86f, 83f)
                        ChartViewType.ALL_TIME -> listOf(98f, 95f, 90f, 88f, 82f, 75f, 65f, 50f, 45f)
                    }

                    val pointsCount = dataPoints.size
                    if (pointsCount > 1) {
                        val path = Path()
                        val fillPath = Path()
                        
                        val xOffset = w / (pointsCount - 1)
                        
                        dataPoints.forEachIndexed { index, score ->
                            // Map score 0-100 to height h-0
                            val pct = (100f - score) / 100f
                            val y = h * pct * 0.8f + (h * 0.1f) // leaves margin
                            val x = index * xOffset
                            
                            if (index == 0) {
                                path.moveTo(x, y)
                                fillPath.moveTo(x, h)
                                fillPath.lineTo(x, y)
                            } else {
                                path.lineTo(x, y)
                                fillPath.lineTo(x, y)
                            }
                            
                            if (index == pointsCount - 1) {
                                fillPath.lineTo(x, h)
                                fillPath.close()
                            }
                        }

                        // Draw Gradient fill
                        drawPath(
                            path = fillPath,
                            brush = Brush.verticalGradient(
                                colors = listOf(PrimaryMain.copy(alpha = 0.15f), Color.Transparent)
                            )
                        )

                        // Draw Line Path
                        drawPath(
                            path = path,
                            color = PrimaryMain,
                            style = Stroke(width = 3.dp.toPx())
                        )

                        // Draw Nodes
                        dataPoints.forEachIndexed { index, score ->
                            val pct = (100f - score) / 100f
                            val y = h * pct * 0.8f + (h * 0.1f)
                            val x = index * xOffset
                            drawCircle(color = Color.White, radius = 5.dp.toPx(), center = Offset(x, y))
                            drawCircle(color = PrimaryMain, radius = 3.dp.toPx(), center = Offset(x, y))
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun DossierEmptyState(
    title: String,
    description: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    buttonText: String,
    onAction: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = BrushIQShapes.large,
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface.copy(alpha = 0.5f)),
        border = androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.5f))
    ) {
        Column(
            modifier = Modifier.padding(20.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.5f),
                modifier = Modifier.size(36.dp)
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = title,
                style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold),
                color = MaterialTheme.colorScheme.onSurface
            )
            Text(
                text = description,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center,
                modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp)
            )
            Spacer(modifier = Modifier.height(14.dp))
            Button(
                onClick = onAction,
                colors = ButtonDefaults.buttonColors(containerColor = PrimaryMain),
                shape = BrushIQShapes.small,
                modifier = Modifier.height(36.dp)
            ) {
                Text(buttonText, color = Color.White, style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold))
            }
        }
    }
}

@Composable
fun AssignToothbrushDialog(
    onDismiss: () -> Unit,
    onAssign: (brand: String, model: String, color: String, type: String, date: String) -> Unit
) {
    var brand by remember { mutableStateOf("") }
    var model by remember { mutableStateOf("") }
    var color by remember { mutableStateOf("#1565D8") }
    var selectedType by remember { mutableStateOf("Electric") }
    var purchaseDate by remember { mutableStateOf("2026-06-18") }

    Dialog(onDismissRequest = onDismiss) {
        Card(
            shape = BrushIQShapes.large,
            modifier = Modifier
                .fillMaxWidth()
                .padding(8.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
        ) {
            Column(
                modifier = Modifier.padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Text(
                    text = "Assign Toothbrush",
                    style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold)
                )

                OutlinedTextField(
                    value = brand,
                    onValueChange = { brand = it },
                    label = { Text("Brand (e.g. Oral-B, Philips)") },
                    modifier = Modifier.fillMaxWidth(),
                    shape = BrushIQShapes.medium
                )

                OutlinedTextField(
                    value = model,
                    onValueChange = { model = it },
                    label = { Text("Model (e.g. iO Series 9, Sonicare)") },
                    modifier = Modifier.fillMaxWidth(),
                    shape = BrushIQShapes.medium
                )

                OutlinedTextField(
                    value = color,
                    onValueChange = { color = it },
                    label = { Text("Color Code (e.g. #FFFFFF)") },
                    modifier = Modifier.fillMaxWidth(),
                    shape = BrushIQShapes.medium
                )

                // Type select
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(MaterialTheme.colorScheme.background, RoundedCornerShape(8.dp))
                        .padding(3.dp),
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    listOf("Electric", "Manual").forEach { t ->
                        val active = selectedType == t
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .clip(RoundedCornerShape(6.dp))
                                .background(if (active) PrimaryMain else Color.Transparent)
                                .clickable { selectedType = t }
                                .padding(vertical = 8.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(t, color = if (active) Color.White else MaterialTheme.colorScheme.onSurfaceVariant, style = TextStyle(fontSize = 10.sp, fontWeight = FontWeight.Bold))
                        }
                    }
                }

                OutlinedTextField(
                    value = purchaseDate,
                    onValueChange = { purchaseDate = it },
                    label = { Text("Purchase Date (YYYY-MM-DD)") },
                    modifier = Modifier.fillMaxWidth(),
                    shape = BrushIQShapes.medium,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number)
                )

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.End,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    TextButton(onClick = onDismiss) {
                        Text("Cancel", color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                    Spacer(modifier = Modifier.width(8.dp))
                    Button(
                        onClick = {
                            if (brand.isNotEmpty() && model.isNotEmpty()) {
                                onAssign(brand, model, color, selectedType, purchaseDate)
                            }
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = PrimaryMain)
                    ) {
                        Text("Link Brush", color = Color.White)
                    }
                }
            }
        }
    }
}
