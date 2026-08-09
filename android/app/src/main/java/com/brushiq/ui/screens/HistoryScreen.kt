package com.brushiq.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.FilterList
import androidx.compose.material.icons.filled.History
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
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
import com.brushiq.domain.repository.ScanReport
import com.brushiq.ui.components.*
import com.brushiq.ui.theme.*
import com.brushiq.ui.viewmodel.BrushIQViewModel
import kotlinx.coroutines.flow.MutableStateFlow

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HistoryScreen(
    navController: NavController,
    viewModel: BrushIQViewModel? = null
) {
    val dbScans by (viewModel?.scanHistory ?: MutableStateFlow(emptyList())).collectAsState()
    val loading by (viewModel?.loading ?: MutableStateFlow(false)).collectAsState()

    var searchQuery by remember { mutableStateOf("") }
    var selectedConditionFilter by remember { mutableStateOf("All") }

    LaunchedEffect(Unit) {
        viewModel?.fetchScansHistory("")
    }

    val historyItems = dbScans

    // 1. Calculate Analytics summary stats
    val totalScansCount = historyItems.size
    val averageScore = if (totalScansCount > 0) historyItems.map { it.healthScore }.average().toInt() else 0
    val bestScore = if (totalScansCount > 0) historyItems.map { it.healthScore }.maxOrNull()?.toInt() ?: 0 else 0
    val lowestScore = if (totalScansCount > 0) historyItems.map { it.healthScore }.minOrNull()?.toInt() ?: 0 else 0

    // 2. Apply Search & Condition Filters
    val filteredScans = historyItems.filter { scan ->
        val matchesSearch = scan.aiRecommendation.contains(searchQuery, ignoreCase = true) ||
                scan.condition.contains(searchQuery, ignoreCase = true) ||
                scan.scanDate.contains(searchQuery, ignoreCase = true)
        
        val matchesCondition = when (selectedConditionFilter) {
            "All" -> true
            "Good" -> scan.condition == "Good"
            "Moderate Wear" -> scan.condition == "Moderate Wear"
            "Replace Soon" -> scan.condition == "Replace Soon"
            "Replace Immediately" -> scan.condition == "Replace Immediately"
            else -> true
        }

        matchesSearch && matchesCondition
    }

    Scaffold(
        topBar = {
            AppHeader(title = "Clinical History")
        }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .background(MaterialTheme.colorScheme.background)
        ) {
            
            // Analytics Summary Panel
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 10.dp),
                shape = BrushIQShapes.medium,
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                border = androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.outline)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(12.dp),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.weight(1f)) {
                        Text("TOTAL SCANS", style = TextStyle(fontSize = 8.sp, color = MaterialTheme.colorScheme.onSurfaceVariant, fontWeight = FontWeight.Bold))
                        Spacer(modifier = Modifier.height(4.dp))
                        Text("$totalScansCount", style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Black))
                    }
                    Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.weight(1f)) {
                        Text("AVG SCORE", style = TextStyle(fontSize = 8.sp, color = MaterialTheme.colorScheme.onSurfaceVariant, fontWeight = FontWeight.Bold))
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(if (averageScore > 0) "$averageScore%" else "--", style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Black, color = if (averageScore >= 70) Success else Warning))
                    }
                    Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.weight(1f)) {
                        Text("BEST SCORE", style = TextStyle(fontSize = 8.sp, color = MaterialTheme.colorScheme.onSurfaceVariant, fontWeight = FontWeight.Bold))
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(if (bestScore > 0) "$bestScore%" else "--", style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Black, color = Success))
                    }
                    Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.weight(1f)) {
                        Text("LOWEST SCORE", style = TextStyle(fontSize = 8.sp, color = MaterialTheme.colorScheme.onSurfaceVariant, fontWeight = FontWeight.Bold))
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(if (lowestScore > 0) "$lowestScore%" else "--", style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Black, color = Error))
                    }
                }
            }

            // Search input (supports screen reader labels)
            OutlinedTextField(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 6.dp)
                    .semantics {
                        contentDescription = "Search input field to filter historical scans by recommendation, condition, or date."
                    },
                placeholder = { Text("Search scan records...") },
                leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, tint = PrimaryMain) },
                shape = BrushIQShapes.medium,
                singleLine = true
            )

            // Quick Filter Chips
            LazyRow(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                val filters = listOf("All", "Good", "Moderate Wear", "Replace Soon", "Replace Immediately")
                items(filters) { filter ->
                    FilterChip(
                        selected = selectedConditionFilter == filter,
                        onClick = { selectedConditionFilter = filter },
                        label = { Text(filter, style = TextStyle(fontSize = 11.sp, fontWeight = FontWeight.Bold)) },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = PrimaryAlpha10,
                            selectedLabelColor = PrimaryMain
                        )
                    )
                }
            }

            // Timeline Items
            if (loading && historyItems.isEmpty()) {
                LoadingScreen("Fetching clinical history...")
            } else if (filteredScans.isEmpty()) {
                HistoryEmptyState(onScanClick = { navController.navigate("scan") })
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(filteredScans) { scan ->
                        // RecentScanItem package points click events to ScanDetailsScreen
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable {
                                    // Save selected mock details or scanId in viewModel/navigation
                                    navController.navigate("scan_details/${scan.id}")
                                }
                        ) {
                            RecentScanItem(
                                name = "Diagnostic Scan (${if (scan.scanDate.length >= 10) scan.scanDate.substring(0, 10) else scan.scanDate})",
                                model = scan.condition,
                                score = scan.healthScore.toInt(),
                                condition = scan.condition
                            )
                        }
                    }
                    item { Spacer(modifier = Modifier.height(80.dp)) }
                }
            }
        }
    }
}

@Composable
fun HistoryEmptyState(
    onScanClick: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Box(
            modifier = Modifier
                .size(96.dp)
                .background(PrimaryMain.copy(alpha = 0.08f), CircleShape),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = Icons.Default.History,
                contentDescription = null,
                tint = PrimaryMain,
                modifier = Modifier.size(48.dp)
            )
        }

        Spacer(modifier = Modifier.height(24.dp))

        Text(
            text = "No Scans Available",
            style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold),
            color = MaterialTheme.colorScheme.onSurface,
            textAlign = TextAlign.Center
        )

        Spacer(modifier = Modifier.height(12.dp))

        Text(
            text = "Your previous AI bristle wear diagnostic scans will be logged here once you perform a scan.",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center,
            modifier = Modifier.padding(horizontal = 16.dp)
        )

        Spacer(modifier = Modifier.height(32.dp))

        PrimaryButton(
            text = "Start First Scan",
            onClick = onScanClick,
            modifier = Modifier.fillMaxWidth(0.8f)
        )
    }
}
