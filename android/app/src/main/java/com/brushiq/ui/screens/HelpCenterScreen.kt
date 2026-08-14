package com.brushiq.ui.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.brushiq.ui.components.AppHeader
import com.brushiq.ui.components.PrimaryButton
import com.brushiq.ui.theme.*

data class FaqItem(
    val id: String,
    val question: String,
    val answer: String,
    val category: String
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HelpCenterScreen(
    navController: NavController
) {
    var searchQuery by remember { mutableStateOf("") }
    var expandedFaqId by remember { mutableStateOf<String?>(null) }
    var selectedCategory by remember { mutableStateOf("All") }

    val faqItems = remember {
        listOf(
            FaqItem(
                id = "scan_howto",
                question = "How to scan a toothbrush",
                answer = "Center the toothbrush bristle head within the camera scanning frame under clear, direct lighting. Keep your phone steady for 3 seconds while BrushIQ captures bristle splay and wear geometry.",
                category = "Scanning"
            ),
            FaqItem(
                id = "internet_req",
                question = "Why is internet required for AI analysis?",
                answer = "BrushIQ utilizes advanced deep-neural vision models running on cloud servers to analyze bristle breakdown and wear density with high diagnostic accuracy. An active internet connection ensures rapid and accurate analysis.",
                category = "AI & System"
            ),
            FaqItem(
                id = "save_report",
                question = "How to save a diagnostic report",
                answer = "Every completed scan analysis is automatically saved to your Clinical History. Reports are permanently associated with the family member and toothbrush model selected before initiating the scan.",
                category = "Reports & History"
            ),
            FaqItem(
                id = "health_score",
                question = "How does toothbrush health scoring work?",
                answer = "BrushIQ analyzes bristle alignment, geometric splay, and structural wear to compute a comprehensive health score (0-100%). It categorizes wear status (e.g. Good, Moderate, Severe) and estimates remaining replacement days.",
                category = "AI & System"
            ),
            FaqItem(
                id = "family_mgmt",
                question = "How to manage family members",
                answer = "Tap the Family tab in the bottom navigation bar to view, add, or edit family member profiles. Each profile can maintain separate toothbrush assignments and clinical scan histories.",
                category = "Profiles"
            ),
            FaqItem(
                id = "offline_behavior",
                question = "What happens when the app is offline?",
                answer = "BrushIQ provides offline-first network monitoring. If internet connectivity is lost, the app will display a notification prompting you to connect before starting an AI scan, while allowing offline access to cached histories.",
                category = "AI & System"
            )
        )
    }

    val categories = listOf("All", "Scanning", "AI & System", "Reports & History", "Profiles")

    val filteredFaqs = faqItems.filter { item ->
        val matchesCategory = selectedCategory == "All" || item.category == selectedCategory
        val matchesQuery = searchQuery.isBlank() ||
                item.question.contains(searchQuery, ignoreCase = true) ||
                item.answer.contains(searchQuery, ignoreCase = true)
        matchesCategory && matchesQuery
    }

    val scrollState = rememberScrollState()

    Scaffold(
        topBar = {
            AppHeader(
                title = "Help Center",
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .background(MaterialTheme.colorScheme.background)
                .verticalScroll(scrollState)
                .padding(Dimensions.PaddingMedium)
        ) {
            // Search Input
            OutlinedTextField(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                label = { Text("Search help topics...") },
                leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, tint = PrimaryMain) },
                trailingIcon = {
                    if (searchQuery.isNotEmpty()) {
                        IconButton(onClick = { searchQuery = "" }) {
                            Icon(Icons.Default.Clear, contentDescription = "Clear search")
                        }
                    }
                },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                shape = BrushIQShapes.large
            )

            Spacer(modifier = Modifier.height(16.dp))

            // Category Filter Pills
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                categories.take(3).forEach { category ->
                    FilterChip(
                        selected = selectedCategory == category,
                        onClick = { selectedCategory = category },
                        label = { Text(category, style = MaterialTheme.typography.labelSmall) },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = PrimaryMain,
                            selectedLabelColor = Color.White
                        )
                    )
                }
            }

            Spacer(modifier = Modifier.height(20.dp))

            Text(
                text = "FREQUENTLY ASKED QUESTIONS",
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.padding(bottom = 8.dp)
            )

            if (filteredFaqs.isEmpty()) {
                Card(
                    modifier = Modifier.fillMaxWidth().padding(vertical = 24.dp),
                    shape = BrushIQShapes.large,
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                ) {
                    Column(
                        modifier = Modifier.fillMaxWidth().padding(24.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Icon(
                            Icons.Default.HelpOutline,
                            contentDescription = null,
                            modifier = Modifier.size(48.dp),
                            tint = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Spacer(modifier = Modifier.height(12.dp))
                        Text(
                            "No matching help topics found",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            "Try adjusting your search terms or view all topics.",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            } else {
                filteredFaqs.forEach { faq ->
                    val isExpanded = expandedFaqId == faq.id
                    FaqAccordionCard(
                        faq = faq,
                        isExpanded = isExpanded,
                        onToggle = {
                            expandedFaqId = if (isExpanded) null else faq.id
                        }
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Contact Support Banner
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = BrushIQShapes.large,
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                border = androidx.compose.foundation.BorderStroke(Dimensions.BorderWidth, PrimaryMain.copy(alpha = 0.3f))
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(20.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Icon(
                        Icons.Default.SupportAgent,
                        contentDescription = null,
                        modifier = Modifier.size(36.dp),
                        tint = PrimaryMain
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "Still have questions?",
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                    )
                    Text(
                        text = "Our support team is ready to help you with your BrushIQ AI scans.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.padding(bottom = 16.dp)
                    )
                    PrimaryButton(
                        text = "Contact Support",
                        onClick = { navController.navigate("contact_us") }
                    )
                }
            }

            Spacer(modifier = Modifier.height(40.dp))
        }
    }
}

@Composable
fun FaqAccordionCard(
    faq: FaqItem,
    isExpanded: Boolean,
    onToggle: () -> Unit
) {
    val rotationAngle by animateFloatAsState(
        targetValue = if (isExpanded) 180f else 0f,
        label = "arrowRotation"
    )

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onToggle() },
        shape = BrushIQShapes.large,
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = androidx.compose.foundation.BorderStroke(
            Dimensions.BorderWidth,
            if (isExpanded) PrimaryMain.copy(alpha = 0.5f) else MaterialTheme.colorScheme.outline
        )
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(
                    modifier = Modifier.weight(1f),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        Icons.Default.QuestionAnswer,
                        contentDescription = null,
                        modifier = Modifier.size(20.dp),
                        tint = PrimaryMain
                    )
                    Spacer(modifier = Modifier.width(12.dp))
                    Text(
                        text = faq.question,
                        style = MaterialTheme.typography.titleMedium.copy(
                            fontWeight = FontWeight.SemiBold,
                            fontSize = 15.sp
                        )
                    )
                }
                IconButton(onClick = onToggle) {
                    Icon(
                        Icons.Default.KeyboardArrowDown,
                        contentDescription = if (isExpanded) "Collapse" else "Expand",
                        modifier = Modifier.rotate(rotationAngle),
                        tint = PrimaryMain
                    )
                }
            }

            AnimatedVisibility(visible = isExpanded) {
                Column {
                    Spacer(modifier = Modifier.height(8.dp))
                    HorizontalDivider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.5f))
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(
                        text = faq.answer,
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        lineHeight = 20.sp
                    )
                }
            }
        }
    }
}
