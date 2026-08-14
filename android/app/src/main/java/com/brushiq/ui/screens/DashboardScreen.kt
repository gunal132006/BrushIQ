package com.brushiq.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import androidx.navigation.compose.rememberNavController
import com.brushiq.ui.components.*
import com.brushiq.ui.theme.*
import com.brushiq.ui.viewmodel.AuthViewModel
import com.brushiq.ui.viewmodel.BrushIQViewModel
import kotlinx.coroutines.flow.MutableStateFlow

private fun getUserInitials(name: String?): String {
    val trimmed = name?.trim() ?: ""
    if (trimmed.isEmpty()) return "U"
    val parts = trimmed.split("\\s+".toRegex()).filter { it.isNotEmpty() }
    return when {
        parts.size == 1 -> parts[0].take(1).uppercase()
        parts.size >= 2 -> "${parts.first().take(1)}${parts.last().take(1)}".uppercase()
        else -> "U"
    }
}

@Composable
fun DashboardScreen(
    navController: NavController,
    viewModel: BrushIQViewModel? = null,
    authViewModel: AuthViewModel? = null
) {
    val stats by (viewModel?.dashboardStats ?: MutableStateFlow(null)).collectAsState()
    val loading by (viewModel?.loading ?: MutableStateFlow(false)).collectAsState()
    val authState by (authViewModel?.authState ?: MutableStateFlow(com.brushiq.ui.viewmodel.AuthState.Idle)).collectAsState()

    val familyMembers by (viewModel?.familyMembers ?: kotlinx.coroutines.flow.MutableStateFlow(emptyList())).collectAsState()
    val toothbrushes by (viewModel?.toothbrushes ?: kotlinx.coroutines.flow.MutableStateFlow(emptyList())).collectAsState()

    val isOnline by (viewModel?.isOnline ?: MutableStateFlow(true)).collectAsState()

    // Trigger sync on dashboard load
    LaunchedEffect(Unit) {
        viewModel?.syncAllData()
    }

    if (loading && stats == null && isOnline) {
        LoadingScreen("Syncing with clinical engine...")
        return
    }

    val dbScanHistory by (viewModel?.scanHistory ?: MutableStateFlow(emptyList())).collectAsState()

    val userFullName = if (authState is com.brushiq.ui.viewmodel.AuthState.Success) {
        (authState as com.brushiq.ui.viewmodel.AuthState.Success).user.fullName
    } else {
        ""
    }
    
    val greetingName = if (userFullName.isNotBlank()) userFullName.split("\\s+".toRegex())[0] else "User"
    val userInitials = getUserInitials(userFullName)

    val avgHealthScore = stats?.avgHealthScore?.toFloat() ?: 0f
    val totalScans = maxOf(stats?.totalScans ?: 0, dbScanHistory.size)
    val registeredBrushes = stats?.totalToothbrushes ?: toothbrushes.size
    val recentScans = stats?.recentScans ?: emptyList()

    Scaffold(
        topBar = {
            AppHeader(
                title = "BrushIQ",
                actions = {
                    IconButton(onClick = { }) {
                        Icon(Icons.Default.Notifications, contentDescription = "Notifications", tint = PrimaryMain)
                    }
                }
            )
        }
    ) { innerPadding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .background(MaterialTheme.colorScheme.background),
            contentPadding = PaddingValues(Dimensions.PaddingMedium),
            verticalArrangement = Arrangement.spacedBy(Dimensions.PaddingMedium)
        ) {
            // Offline Status Banner
            if (!isOnline) {
                item {
                    Surface(
                        modifier = Modifier.fillMaxWidth(),
                        color = Warning.copy(alpha = 0.15f),
                        shape = BrushIQShapes.medium,
                        border = androidx.compose.foundation.BorderStroke(1.dp, Warning.copy(alpha = 0.3f))
                    ) {
                        Row(
                            modifier = Modifier.padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Icon(Icons.Default.CloudOff, contentDescription = null, tint = Warning, modifier = Modifier.size(20.dp))
                            Text(
                                text = "Offline — showing last synchronized data",
                                style = MaterialTheme.typography.bodySmall.copy(fontWeight = FontWeight.Bold),
                                color = MaterialTheme.colorScheme.onSurface
                            )
                        }
                    }
                }
            }
            // 1. Welcome Header Section
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(
                            brush = Brush.horizontalGradient(listOf(PrimaryMain, SecondaryMain)),
                            shape = BrushIQShapes.extraLarge
                        )
                        .padding(24.dp)
                ) {
                    Column {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Surface(
                                modifier = Modifier.size(44.dp),
                                shape = CircleShape,
                                color = Color.White.copy(alpha = 0.2f)
                            ) {
                                Box(contentAlignment = Alignment.Center) {
                                    Text(userInitials, color = Color.White, fontWeight = FontWeight.Black, fontSize = 16.sp)
                                }
                            }
                            Spacer(modifier = Modifier.width(12.dp))
                            Column {
                                Text(
                                    "Hello, $greetingName! 👋",
                                    color = Color.White,
                                    style = MaterialTheme.typography.titleLarge
                                )
                                Text(
                                    "Your clinical workspace is active",
                                    color = Color.White.copy(alpha = 0.8f),
                                    style = MaterialTheme.typography.labelMedium
                                )
                            }
                        }
                        
                        Spacer(modifier = Modifier.height(24.dp))
                        
                        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                            Surface(
                                modifier = Modifier
                                    .weight(1f)
                                    .clickable {
                                        val firstMem = familyMembers.firstOrNull()
                                        val firstBrush = toothbrushes.firstOrNull { it.familyMemberId == firstMem?.id } ?: toothbrushes.firstOrNull()
                                        viewModel?.setSelectedContext(familyMemberId = firstMem?.id, toothbrushId = firstBrush?.id)
                                        navController.navigate("scan")
                                    },
                                color = Color.White,
                                shape = BrushIQShapes.medium
                            ) {
                                Row(
                                    modifier = Modifier.padding(vertical = 12.dp, horizontal = 16.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.Center
                                ) {
                                    Icon(Icons.Default.PlayArrow, contentDescription = null, tint = PrimaryMain, modifier = Modifier.size(18.dp))
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text("SCAN BRISTLES", color = PrimaryMain, style = MaterialTheme.typography.labelMedium)
                                }
                            }
                            
                            Surface(
                                modifier = Modifier
                                    .weight(1f)
                                    .clickable { navController.navigate("family") },
                                color = Color.White.copy(alpha = 0.2f),
                                shape = BrushIQShapes.medium
                            ) {
                                Row(
                                    modifier = Modifier.padding(vertical = 12.dp, horizontal = 16.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.Center
                                ) {
                                    Icon(Icons.Default.Add, contentDescription = null, tint = Color.White, modifier = Modifier.size(18.dp))
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text("ADD PROFILE", color = Color.White, style = MaterialTheme.typography.labelMedium)
                                }
                            }
                        }
                    }
                }
            }

            // 2. Health & Statistics Row
            item {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(IntrinsicSize.Max),
                    horizontalArrangement = Arrangement.spacedBy(Dimensions.PaddingMedium)
                ) {
                    HealthScoreCard(
                        healthScore = avgHealthScore,
                        condition = "Moderate Wear",
                        modifier = Modifier.weight(1f)
                    )
                    StatCard(
                        title = "TOTAL SCANS",
                        value = totalScans.toString(),
                        icon = Icons.Default.CheckCircle,
                        iconColor = SecondaryMain,
                        modifier = Modifier
                            .weight(1f)
                            .fillMaxHeight()
                    )
                }
            }

            // 3. Active Toothbrush Section
            val activeBrush = toothbrushes.firstOrNull()
            item {
                Text(
                    text = "Active Toothbrush",
                    style = MaterialTheme.typography.titleLarge
                )
                Spacer(modifier = Modifier.height(12.dp))
                if (activeBrush != null) {
                    BrushCard(
                        brand = activeBrush.brand,
                        model = activeBrush.model,
                        type = activeBrush.type,
                        memberName = activeBrush.memberName ?: (if (userFullName.isNotBlank()) userFullName else "User"),
                        color = activeBrush.color,
                        purchaseDate = activeBrush.purchaseDate,
                        onEdit = { navController.navigate("toothbrush") },
                        onDelete = {}
                    )
                } else {
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { navController.navigate("toothbrush") },
                        shape = BrushIQShapes.large,
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        border = androidx.compose.foundation.BorderStroke(Dimensions.BorderWidth, MaterialTheme.colorScheme.outline)
                    ) {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(20.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Text("No active toothbrush registered", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            Spacer(modifier = Modifier.height(8.dp))
                            Text("Tap to register a toothbrush", style = MaterialTheme.typography.labelMedium, color = PrimaryMain, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }

            // 4. Section Headers
            item {
                SectionHeader(title = "Recent Scans", onActionClick = { navController.navigate("history") })
            }

            // 5. Recent Scans List
            if (recentScans.isEmpty()) {
                item {
                    Text(
                        "No scans recorded yet.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.padding(vertical = 12.dp)
                    )
                }
            } else {
                items(recentScans.take(3)) { scan ->
                    RecentScanItem(
                        name = scan.memberName ?: "Member",
                        model = "${scan.toothbrushBrand ?: "Toothbrush"} ${scan.toothbrushModel ?: ""}".trim(),
                        score = scan.healthScore.toInt(),
                        condition = scan.condition
                    )
                }
            }

            // 6. Family Profiles Header
            item {
                SectionHeader(title = "Family Summary", onActionClick = { navController.navigate("family") })
            }

            // 6. Horizontal Family Scroll
            item {
                if (familyMembers.isEmpty()) {
                    Text(
                        "No family profiles added yet.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.padding(vertical = 12.dp)
                    )
                } else {
                    LazyRow(
                        horizontalArrangement = Arrangement.spacedBy(12.dp),
                        contentPadding = PaddingValues(bottom = 8.dp)
                    ) {
                        items(familyMembers) { member ->
                            val memberScore = member.healthScore?.toInt() ?: 100
                            FamilyMemberMiniCard(member.name, memberScore, member.profilePhotoUrl)
                        }
                    }
                }
            }
            
            item { Spacer(modifier = Modifier.height(64.dp)) }
        }
    }
}

@Composable
fun SectionHeader(title: String, onActionClick: () -> Unit) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = title,
            style = MaterialTheme.typography.titleLarge
        )
        Text(
            text = "VIEW ALL",
            style = MaterialTheme.typography.labelMedium,
            color = PrimaryMain,
            modifier = Modifier.clickable { onActionClick() }
        )
    }
}

@Composable
fun RecentScanItem(name: String, model: String, score: Int, condition: String) {
    val condColor = when(condition) {
        "Good" -> Success
        "Moderate Wear" -> Warning
        "Replace Soon" -> Alert
        "Replace Immediately" -> Error
        else -> Warning
    }
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
                shape = CircleShape,
                color = PrimaryAlpha10
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Icon(Icons.Default.Refresh, contentDescription = null, tint = PrimaryMain, modifier = Modifier.size(20.dp))
                }
            }
            Spacer(modifier = Modifier.width(16.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(name, style = MaterialTheme.typography.titleSmall)
                Text(model, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            Column(horizontalAlignment = Alignment.End) {
                Text("$score%", style = MaterialTheme.typography.titleMedium, color = condColor)
                Text(condition.uppercase(), style = MaterialTheme.typography.labelSmall, color = condColor)
            }
        }
    }
}

@Composable
fun FamilyMemberMiniCard(name: String, health: Int, profilePhotoUrl: String? = null) {
    val scoreColor = if (health >= 80) Success else if (health >= 50) Warning else Error
    Card(
        modifier = Modifier.width(100.dp),
        shape = BrushIQShapes.medium,
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = androidx.compose.foundation.BorderStroke(Dimensions.BorderWidth, MaterialTheme.colorScheme.outline)
    ) {
        Column(
            modifier = Modifier.padding(12.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Surface(
                modifier = Modifier.size(40.dp),
                shape = CircleShape,
                color = PrimaryAlpha10
            ) {
                if (!profilePhotoUrl.isNullOrBlank()) {
                    coil.compose.AsyncImage(
                        model = profilePhotoUrl,
                        contentDescription = name,
                        contentScale = androidx.compose.ui.layout.ContentScale.Crop,
                        modifier = Modifier.fillMaxSize()
                    )
                } else {
                    Icon(Icons.Default.Person, contentDescription = null, tint = PrimaryMain, modifier = Modifier.padding(8.dp))
                }
            }
            Spacer(modifier = Modifier.height(8.dp))
            Text(name, style = MaterialTheme.typography.labelMedium, maxLines = 1)
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                "$health%", 
                style = MaterialTheme.typography.labelSmall, 
                color = scoreColor,
                fontWeight = FontWeight.Black
            )
        }
    }
}

@Preview(showBackground = true, name = "Dashboard Light")
@Composable
fun PreviewDashboardLight() {
    BrushIQTheme(darkTheme = false) {
        DashboardScreen(navController = rememberNavController())
    }
}

@Preview(showBackground = true, name = "Dashboard Loading")
@Composable
fun PreviewDashboardLoading() {
    BrushIQTheme {
        LoadingScreen("Syncing with clinical engine...")
    }
}

@Preview(showBackground = true, name = "Dashboard Empty Scans")
@Composable
fun PreviewDashboardEmpty() {
    BrushIQTheme {
        EmptyState(
            icon = Icons.Default.Info,
            title = "No Scans Recorded",
            description = "Start your first AI bristle analysis to see your oral health metrics here.",
            action = {
                PrimaryButton(text = "Start First Scan", onClick = {}, modifier = Modifier.width(200.dp))
            }
        )
    }
}

@Preview(showBackground = true, name = "Dashboard Error")
@Composable
fun PreviewDashboardError() {
    BrushIQTheme {
        ErrorState(
            message = "Unable to connect to the BrushIQ diagnostic server. Please check your internet connection.",
            onRetry = {}
        )
    }
}
