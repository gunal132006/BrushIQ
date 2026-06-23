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
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import androidx.navigation.compose.rememberNavController
import com.brushiq.ui.components.*
import com.brushiq.ui.theme.*
import com.brushiq.ui.viewmodel.BrushIQViewModel
import kotlinx.coroutines.flow.MutableStateFlow

data class MockTip(
    val id: String,
    val title: String,
    val content: String,
    val category: String,
    val isBookmarked: Boolean
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TipsScreen(
    navController: NavController,
    viewModel: BrushIQViewModel? = null
) {
    val tips by (viewModel?.tips ?: MutableStateFlow(emptyList())).collectAsState()
    val bookmarkedTips by (viewModel?.bookmarkedTips ?: MutableStateFlow(emptyList())).collectAsState()
    val loading by (viewModel?.loading ?: MutableStateFlow(false)).collectAsState()

    // Mock tips data
    val mockTips = remember {
        listOf(
            MockTip("tip-1", "The 2-Minute Rule", "Brushing for at least two minutes ensures thorough plaque removal and cleaner teeth.", "Technique", false),
            MockTip("tip-2", "Proper Flossing Guide", "Learn the correct technique to maximize gum health and prevent interdental decay.", "Hygiene", true),
            MockTip("tip-3", "Choosing the Right Bristles", "Soft bristles are recommended by dentists for most adults to avoid enamel damage.", "Products", false),
            MockTip("tip-4", "Kids Brushing Habits", "Start supervising brushing until age 7-8 to build lasting oral care habits.", "Kids", true),
            MockTip("tip-5", "Tongue Cleaning Benefits", "Cleaning your tongue removes bacteria and improves breath freshness significantly.", "Hygiene", false),
            MockTip("tip-6", "Electric vs Manual Brushes", "Studies show electric toothbrushes remove up to 21% more plaque than manual ones.", "Products", false),
            MockTip("tip-7", "Brushing Angle Technique", "Hold your brush at a 45-degree angle to gums for optimal plaque disruption.", "Technique", true),
            MockTip("tip-8", "When to Replace Your Brush", "Replace every 3 months or when bristles begin to fray, whichever comes first.", "Products", false)
        )
    }

    val displayTips = if (tips.isNotEmpty()) {
        tips.map { MockTip(it.id, it.title, it.content, it.category, bookmarkedTips.any { b -> b.id == it.id }) }
    } else {
        mockTips
    }

    val categories = listOf("All", "Technique", "Hygiene", "Products", "Kids", "Saved")
    var selectedCategory by remember { mutableStateOf("All") }
    var searchQuery by remember { mutableStateOf("") }

    // Recently viewed (mock)
    val recentlyViewed = remember { mutableStateListOf("tip-1", "tip-5") }

    // Filter logic
    val filteredTips = displayTips.filter { tip ->
        val matchesCategory = when (selectedCategory) {
            "All" -> true
            "Saved" -> tip.isBookmarked
            else -> tip.category == selectedCategory
        }
        val matchesSearch = tip.title.contains(searchQuery, ignoreCase = true) ||
                tip.content.contains(searchQuery, ignoreCase = true)
        matchesCategory && matchesSearch
    }

    val savedTips = displayTips.filter { it.isBookmarked }
    val popularTips = displayTips.sortedByDescending { it.title.length }.take(4) // mock popularity
    val recentTips = displayTips.filter { it.id in recentlyViewed }

    LaunchedEffect(Unit) {
        viewModel?.syncAllData()
    }

    Scaffold(
        topBar = {
            AppHeader(title = "Oral Care Tips")
        }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .background(MaterialTheme.colorScheme.background)
        ) {
            // Search Bar
            OutlinedTextField(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = Dimensions.PaddingMedium, vertical = 8.dp)
                    .semantics {
                        contentDescription = "Search oral care tips by title or content"
                    },
                placeholder = { Text("Search oral care advice...") },
                leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, tint = PrimaryMain) },
                shape = BrushIQShapes.large,
                singleLine = true,
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = PrimaryMain,
                    unfocusedBorderColor = MaterialTheme.colorScheme.outline
                )
            )

            // Category Tabs
            LazyRow(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = Dimensions.PaddingMedium),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                contentPadding = PaddingValues(bottom = 8.dp)
            ) {
                items(categories) { category ->
                    FilterChip(
                        selected = selectedCategory == category,
                        onClick = { selectedCategory = category },
                        label = {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                if (category == "Saved") {
                                    Icon(Icons.Default.Favorite, contentDescription = null, modifier = Modifier.size(12.dp), tint = if (selectedCategory == category) PrimaryMain else MaterialTheme.colorScheme.onSurfaceVariant)
                                    Spacer(modifier = Modifier.width(4.dp))
                                }
                                Text(category)
                            }
                        },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = PrimaryAlpha10,
                            selectedLabelColor = PrimaryMain
                        )
                    )
                }
            }

            // Content
            if (loading && tips.isEmpty() && displayTips == mockTips) {
                LoadingScreen("Fetching oral health insights...")
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(horizontal = Dimensions.PaddingMedium),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    // Saved Tips tab
                    if (selectedCategory == "Saved") {
                        if (savedTips.isEmpty()) {
                            item {
                                SavedTipsEmptyState()
                            }
                        } else {
                            item {
                                Text(
                                    "SAVED TIPS (${savedTips.size})",
                                    style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                    modifier = Modifier.padding(vertical = 8.dp)
                                )
                            }
                            items(savedTips) { tip ->
                                TipListItem(
                                    tip = tip,
                                    onToggleBookmark = { viewModel?.toggleBookmark(tips.first { t -> t.id == tip.id }) },
                                    onClick = {
                                        if (tip.id !in recentlyViewed) recentlyViewed.add(tip.id)
                                        navController.navigate("tip_detail/${tip.id}")
                                    }
                                )
                            }
                        }
                    } else {
                        // Featured Tips Carousel (Only on All tab)
                        if (selectedCategory == "All" && searchQuery.isEmpty()) {
                            item {
                                Text(
                                    "FEATURED",
                                    style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                    modifier = Modifier.padding(vertical = 8.dp)
                                )
                            }
                            item {
                                LazyRow(
                                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                                    contentPadding = PaddingValues(end = 16.dp)
                                ) {
                                    items(displayTips.take(3)) { tip ->
                                        FeaturedTipCard(
                                            tip = tip,
                                            isBookmarked = tip.isBookmarked,
                                            onToggleBookmark = { viewModel?.toggleBookmark(tips.firstOrNull { t -> t.id == tip.id } ?: return@FeaturedTipCard) },
                                            onClick = {
                                                if (tip.id !in recentlyViewed) recentlyViewed.add(tip.id)
                                                navController.navigate("tip_detail/${tip.id}")
                                            }
                                        )
                                    }
                                }
                            }

                            // Recently Viewed
                            if (recentTips.isNotEmpty()) {
                                item {
                                    Spacer(modifier = Modifier.height(8.dp))
                                    Text(
                                        "RECENTLY VIEWED",
                                        style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                                        modifier = Modifier.padding(vertical = 8.dp)
                                    )
                                }
                                items(recentTips) { tip ->
                                    TipListItem(
                                        tip = tip,
                                        onToggleBookmark = { viewModel?.toggleBookmark(tips.firstOrNull { t -> t.id == tip.id } ?: return@TipListItem) },
                                        onClick = { navController.navigate("tip_detail/${tip.id}") }
                                    )
                                }
                            }

                            // Most Popular
                            item {
                                Spacer(modifier = Modifier.height(8.dp))
                                Text(
                                    "MOST POPULAR",
                                    style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                    modifier = Modifier.padding(vertical = 8.dp)
                                )
                            }
                            items(popularTips) { tip ->
                                TipListItem(
                                    tip = tip,
                                    onToggleBookmark = { viewModel?.toggleBookmark(tips.firstOrNull { t -> t.id == tip.id } ?: return@TipListItem) },
                                    onClick = {
                                        if (tip.id !in recentlyViewed) recentlyViewed.add(tip.id)
                                        navController.navigate("tip_detail/${tip.id}")
                                    }
                                )
                            }
                        } else {
                            // Category-filtered list
                            if (filteredTips.isEmpty()) {
                                item {
                                    EmptyState(
                                        icon = Icons.Default.Info,
                                        title = "No Tips Found",
                                        description = "No tips match your current filter. Try a different category or search term."
                                    )
                                }
                            } else {
                                item {
                                    Text(
                                        "${selectedCategory.uppercase()} TIPS (${filteredTips.size})",
                                        style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                                        modifier = Modifier.padding(vertical = 8.dp)
                                    )
                                }
                                items(filteredTips) { tip ->
                                    TipListItem(
                                        tip = tip,
                                        onToggleBookmark = { viewModel?.toggleBookmark(tips.firstOrNull { t -> t.id == tip.id } ?: return@TipListItem) },
                                        onClick = {
                                            if (tip.id !in recentlyViewed) recentlyViewed.add(tip.id)
                                            navController.navigate("tip_detail/${tip.id}")
                                        }
                                    )
                                }
                            }
                        }
                    }

                    item { Spacer(modifier = Modifier.height(80.dp)) }
                }
            }
        }
    }
}

@Composable
fun FeaturedTipCard(
    tip: MockTip,
    isBookmarked: Boolean,
    onToggleBookmark: () -> Unit,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .width(260.dp)
            .clickable { onClick() },
        shape = BrushIQShapes.large,
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = androidx.compose.foundation.BorderStroke(Dimensions.BorderWidth, MaterialTheme.colorScheme.outline)
    ) {
        Column {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(130.dp)
                    .background(
                        Brush.linearGradient(
                            colors = listOf(PrimaryAlpha10, SecondaryAlpha10)
                        )
                    ),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    "BrushIQ",
                    style = MaterialTheme.typography.displayLarge.copy(fontSize = 20.sp, color = PrimaryMain.copy(alpha = 0.15f))
                )

                Surface(
                    modifier = Modifier
                        .align(Alignment.TopStart)
                        .padding(10.dp),
                    color = PrimaryMain,
                    shape = CircleShape
                ) {
                    Text(
                        text = tip.category.uppercase(),
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                        style = TextStyle(fontSize = 8.sp, fontWeight = FontWeight.Black, letterSpacing = 1.sp),
                        color = Color.White
                    )
                }

                Surface(
                    modifier = Modifier
                        .align(Alignment.TopEnd)
                        .padding(10.dp)
                        .size(30.dp),
                    color = Color.White.copy(alpha = 0.6f),
                    shape = CircleShape,
                    onClick = onToggleBookmark
                ) {
                    Icon(
                        imageVector = if (isBookmarked) Icons.Default.Favorite else Icons.Default.FavoriteBorder,
                        contentDescription = "Bookmark",
                        modifier = Modifier.padding(7.dp),
                        tint = if (isBookmarked) Error else LightTextSecondary
                    )
                }
            }

            Column(modifier = Modifier.padding(12.dp)) {
                Text(
                    tip.title,
                    style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Black),
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                Text(
                    tip.content,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis,
                    modifier = Modifier.padding(top = 4.dp)
                )
            }
        }
    }
}

@Composable
fun TipListItem(
    tip: MockTip,
    onToggleBookmark: () -> Unit,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() },
        shape = BrushIQShapes.large,
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = androidx.compose.foundation.BorderStroke(Dimensions.BorderWidth, MaterialTheme.colorScheme.outline)
    ) {
        Row(
            modifier = Modifier.padding(Dimensions.PaddingMedium),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Surface(
                modifier = Modifier.size(44.dp),
                color = PrimaryAlpha10,
                shape = BrushIQShapes.medium
            ) {
                Icon(
                    imageVector = when (tip.category) {
                        "Technique" -> Icons.Default.TouchApp
                        "Hygiene" -> Icons.Default.CleaningServices
                        "Products" -> Icons.Default.ShoppingCart
                        "Kids" -> Icons.Default.ChildCare
                        else -> Icons.Default.Lightbulb
                    },
                    contentDescription = null,
                    modifier = Modifier.padding(10.dp),
                    tint = PrimaryMain
                )
            }

            Spacer(modifier = Modifier.width(12.dp))

            Column(modifier = Modifier.weight(1f)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        tip.title,
                        style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                        modifier = Modifier.weight(1f, fill = false)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Surface(
                        color = PrimaryAlpha10,
                        shape = CircleShape
                    ) {
                        Text(
                            tip.category.uppercase(),
                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp),
                            style = TextStyle(fontSize = 7.sp, fontWeight = FontWeight.Black, letterSpacing = 0.5.sp),
                            color = PrimaryMain
                        )
                    }
                }
                Text(
                    tip.content,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    modifier = Modifier.padding(top = 2.dp)
                )
            }

            IconButton(onClick = onToggleBookmark, modifier = Modifier.size(32.dp)) {
                Icon(
                    imageVector = if (tip.isBookmarked) Icons.Default.Favorite else Icons.Default.FavoriteBorder,
                    contentDescription = "Bookmark",
                    modifier = Modifier.size(18.dp),
                    tint = if (tip.isBookmarked) Error else LightTextMuted
                )
            }
        }
    }
}

@Composable
fun SavedTipsEmptyState() {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 64.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Box(
            modifier = Modifier
                .size(80.dp)
                .background(PrimaryAlpha10, CircleShape),
            contentAlignment = Alignment.Center
        ) {
            Icon(Icons.Default.FavoriteBorder, contentDescription = null, modifier = Modifier.size(40.dp), tint = PrimaryMain)
        }

        Spacer(modifier = Modifier.height(20.dp))

        Text(
            "No Saved Tips Yet",
            style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold),
            textAlign = TextAlign.Center
        )

        Spacer(modifier = Modifier.height(8.dp))

        Text(
            "Tap the heart icon on any tip to save it here for quick access.",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center,
            modifier = Modifier.padding(horizontal = 32.dp)
        )
    }
}

@Preview(showBackground = true)
@Composable
fun PreviewTipsScreen() {
    BrushIQTheme {
        TipsScreen(navController = rememberNavController())
    }
}
