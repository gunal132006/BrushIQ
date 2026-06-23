package com.brushiq.ui.screens

import androidx.compose.foundation.background
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
import com.brushiq.ui.components.*
import com.brushiq.ui.theme.*
import com.brushiq.ui.viewmodel.BrushIQViewModel
import kotlinx.coroutines.flow.MutableStateFlow

@Composable
fun TipDetailScreen(
    tipId: String,
    navController: NavController,
    viewModel: BrushIQViewModel? = null
) {
    val scrollState = rememberScrollState()
    val bookmarkedTips by (viewModel?.bookmarkedTips ?: MutableStateFlow(emptyList())).collectAsState()
    val allTips by (viewModel?.tips ?: MutableStateFlow(emptyList())).collectAsState()

    // Mock data catalog
    val mockCatalog = remember {
        mapOf(
            "tip-1" to TipContent("The 2-Minute Rule", "Technique", "3 min read",
                "Brushing for at least two minutes is essential for removing plaque effectively.",
                "Clinical studies consistently demonstrate that spending a full two minutes brushing significantly improves oral hygiene outcomes. Most people overestimate their brushing time, often spending less than 45 seconds.\n\nBy using a timer or an electric toothbrush with a built-in sensor, you ensure that every quadrant of your mouth receives adequate attention.\n\nThe American Dental Association recommends dividing your mouth into four quadrants and spending 30 seconds on each:\n\n• Upper right\n• Upper left\n• Lower right\n• Lower left\n\nThis practice helps in removing the maximum amount of plaque, preventing tartar buildup, and reducing the risk of gingivitis and cavities. Remember to use a soft-bristled brush and fluoride toothpaste for the best results."
            ),
            "tip-2" to TipContent("Proper Flossing Guide", "Hygiene", "4 min read",
                "Learn the correct technique to maximize gum health and prevent interdental decay.",
                "Flossing is an essential part of oral care that many people skip. It removes plaque and food particles from between teeth where your toothbrush cannot reach.\n\nUse about 18 inches of floss, winding most of it around your middle fingers. Gently guide the floss between teeth using a rubbing motion. Curve the floss into a C-shape against one tooth and gently slide it under the gumline.\n\nKey points to remember:\n\n• Use a clean section of floss for each tooth\n• Be gentle to avoid damaging your gums\n• Floss at least once daily, preferably before bedtime\n• Consider floss picks or water flossers as alternatives\n\nConsistent flossing reduces the risk of gum disease and cavities between teeth."
            ),
            "tip-3" to TipContent("Choosing the Right Bristles", "Products", "2 min read",
                "Soft bristles are recommended by dentists for most adults to avoid enamel damage.",
                "The type of bristles on your toothbrush plays a crucial role in your oral hygiene routine. Contrary to popular belief, harder bristles do not clean better — they can actually damage enamel and irritate gums.\n\nSoft-bristled toothbrushes are recommended by the majority of dental professionals. They effectively remove plaque while being gentle on tooth enamel and gum tissue.\n\nWhen selecting a toothbrush:\n\n• Choose soft or extra-soft bristles\n• Look for the ADA Seal of Acceptance\n• Replace every 3 months or when bristles fray\n• Consider rounded bristle tips for extra protection\n\nFor children, use age-appropriate brushes with extra-soft bristles and small heads."
            ),
            "tip-4" to TipContent("Kids Brushing Habits", "Kids", "3 min read",
                "Start supervising brushing until age 7-8 to build lasting oral care habits.",
                "Establishing good oral care habits early is one of the best gifts you can give your child. Children should begin brushing as soon as their first tooth appears.\n\nAge-specific guidelines:\n\n• Under 3: Use a rice-grain sized amount of fluoride toothpaste\n• Ages 3-6: Use a pea-sized amount of fluoride toothpaste\n• Ages 6-8: Supervise brushing and help with technique\n• Ages 8+: Continue monitoring but encourage independence\n\nMake brushing fun:\n\n• Use a timer or play a 2-minute song\n• Let them choose their toothbrush\n• Brush together as a family\n• Use positive reinforcement\n\nRegular dental checkups should begin by age 1 or when the first tooth appears."
            ),
            "tip-5" to TipContent("Tongue Cleaning Benefits", "Hygiene", "2 min read",
                "Cleaning your tongue removes bacteria and improves breath freshness significantly.",
                "Your tongue harbors a significant amount of bacteria that contributes to bad breath and oral health issues. Regular tongue cleaning should be part of your daily oral hygiene routine.\n\nBenefits of tongue cleaning:\n\n• Reduces bacteria that cause bad breath\n• Improves taste perception\n• Contributes to overall oral health\n• Helps prevent oral thrush\n\nYou can clean your tongue with your toothbrush or a dedicated tongue scraper. Gently brush or scrape from the back of the tongue forward, rinsing after each stroke."
            ),
            "tip-6" to TipContent("Electric vs Manual Brushes", "Products", "4 min read",
                "Studies show electric toothbrushes remove up to 21% more plaque than manual ones.",
                "The debate between electric and manual toothbrushes has been settled by multiple clinical studies. While both can effectively clean teeth when used properly, electric toothbrushes offer several advantages.\n\nElectric toothbrush benefits:\n\n• Remove 21% more plaque on average\n• Built-in timers ensure 2-minute brushing\n• Pressure sensors prevent over-brushing\n• Better for those with limited dexterity\n• Oscillating-rotating heads are most effective\n\nManual toothbrush advantages:\n\n• More affordable\n• No charging required\n• Travel-friendly\n• Available everywhere\n\nRegardless of your choice, proper technique and consistency matter most."
            ),
            "tip-7" to TipContent("Brushing Angle Technique", "Technique", "2 min read",
                "Hold your brush at a 45-degree angle to gums for optimal plaque disruption.",
                "The angle at which you hold your toothbrush significantly impacts cleaning effectiveness. The modified Bass technique, recommended by most dentists, involves holding the brush at a 45-degree angle to the gumline.\n\nStep-by-step technique:\n\n• Place bristles at a 45-degree angle to the gums\n• Use short, gentle back-and-forth strokes\n• Brush outer, inner, and chewing surfaces\n• For inner front teeth, tilt brush vertically\n• Use gentle up-and-down strokes\n\nAvoid sawing motions which can damage gums and enamel. Light pressure is sufficient — let the bristles do the work."
            ),
            "tip-8" to TipContent("When to Replace Your Brush", "Products", "2 min read",
                "Replace every 3 months or when bristles begin to fray, whichever comes first.",
                "Using a worn toothbrush significantly reduces cleaning effectiveness. The ADA recommends replacing your toothbrush or brush head every 3-4 months.\n\nSigns it's time to replace:\n\n• Bristles are frayed or splayed\n• Bristles have lost their flexibility\n• Discoloration or unusual wear patterns\n• After recovering from illness\n\nBrushIQ helps you track bristle wear through AI analysis, ensuring you always know when it's time for a replacement. Regular scanning can detect early signs of wear that may not be visible to the naked eye."
            )
        )
    }

    val tipContent = mockCatalog[tipId] ?: mockCatalog.values.first()
    val isBookmarked = bookmarkedTips.any { it.id == tipId }

    Scaffold(
        topBar = {
            AppHeader(
                title = "Tip Detail",
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                },
                actions = {
                    IconButton(onClick = {
                        val tip = allTips.firstOrNull { it.id == tipId }
                        if (tip != null) viewModel?.toggleBookmark(tip)
                    }) {
                        Icon(
                            if (isBookmarked) Icons.Default.Favorite else Icons.Default.FavoriteBorder,
                            contentDescription = "Bookmark",
                            tint = if (isBookmarked) Error else PrimaryMain
                        )
                    }
                    IconButton(onClick = { /* Share */ }) {
                        Icon(Icons.Default.Share, contentDescription = "Share", tint = PrimaryMain)
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
            // Hero Banner
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(220.dp)
                    .background(
                        brush = Brush.verticalGradient(
                            colors = listOf(PrimaryMain, SecondaryMain)
                        )
                    ),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    "BrushIQ",
                    style = MaterialTheme.typography.displayLarge.copy(fontSize = 32.sp, color = Color.White.copy(alpha = 0.15f))
                )

                // Reading time badge
                Surface(
                    modifier = Modifier
                        .align(Alignment.BottomEnd)
                        .padding(12.dp),
                    color = Color.White.copy(alpha = 0.2f),
                    shape = CircleShape
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(Icons.Default.Timer, contentDescription = null, modifier = Modifier.size(12.dp), tint = Color.White)
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(tipContent.readingTime, style = TextStyle(fontSize = 10.sp, fontWeight = FontWeight.Bold), color = Color.White)
                    }
                }
            }

            Column(modifier = Modifier.padding(Dimensions.PaddingLarge)) {
                // Category Badge
                Surface(
                    color = PrimaryMain,
                    shape = CircleShape
                ) {
                    Text(
                        text = tipContent.category.uppercase(),
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 4.dp),
                        style = TextStyle(fontSize = 10.sp, fontWeight = FontWeight.Black, letterSpacing = 1.sp),
                        color = Color.White
                    )
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Title
                Text(
                    text = tipContent.title,
                    style = MaterialTheme.typography.headlineLarge.copy(fontWeight = FontWeight.Black)
                )

                Spacer(modifier = Modifier.height(8.dp))

                // Subtitle
                Text(
                    text = tipContent.subtitle,
                    style = MaterialTheme.typography.bodyLarge,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    lineHeight = 24.sp
                )

                Spacer(modifier = Modifier.height(24.dp))

                Divider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.3f))

                Spacer(modifier = Modifier.height(24.dp))

                // Full Article Content
                Text(
                    text = tipContent.body,
                    style = MaterialTheme.typography.bodyLarge,
                    lineHeight = 28.sp,
                    color = MaterialTheme.colorScheme.onSurface
                )

                Spacer(modifier = Modifier.height(48.dp))

                Divider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.5f))

                Spacer(modifier = Modifier.height(24.dp))

                // Feedback Section
                Text(
                    text = "Was this advice helpful?",
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                    modifier = Modifier.fillMaxWidth(),
                    textAlign = TextAlign.Center
                )

                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 16.dp),
                    horizontalArrangement = Arrangement.Center,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Button(
                        onClick = {},
                        modifier = Modifier.weight(1f),
                        shape = BrushIQShapes.medium,
                        colors = ButtonDefaults.buttonColors(containerColor = Success)
                    ) {
                        Icon(Icons.Default.ThumbUp, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("YES")
                    }
                    Spacer(modifier = Modifier.width(16.dp))
                    OutlinedButton(
                        onClick = {},
                        modifier = Modifier.weight(1f),
                        shape = BrushIQShapes.medium
                    ) {
                        Icon(Icons.Default.ThumbDown, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("NO")
                    }
                }
            }

            Spacer(modifier = Modifier.height(80.dp))
        }
    }
}

data class TipContent(
    val title: String,
    val category: String,
    val readingTime: String,
    val subtitle: String,
    val body: String
)

@Preview(showBackground = true)
@Composable
fun PreviewTipDetail() {
    BrushIQTheme {
        TipDetailScreen(tipId = "tip-1", navController = rememberNavController())
    }
}
