package com.brushiq.ui.components

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.brushiq.ui.theme.*

// ------------------------------------
// HealthScoreCard
// ------------------------------------

@Composable
fun HealthScoreCard(
    healthScore: Float,
    condition: String,
    confidenceScore: Int? = null,
    modifier: Modifier = Modifier
) {
    val conditionColor = when (condition) {
        "Good" -> Success
        "Moderate Wear" -> Warning
        "Replace Soon" -> Alert
        "Replace Immediately" -> Error
        else -> LightTextMuted
    }

    val conditionBg = conditionColor.copy(alpha = 0.1f)

    Card(
        modifier = modifier.fillMaxWidth(),
        shape = BrushIQShapes.large,
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = androidx.compose.foundation.BorderStroke(Dimensions.BorderWidth, MaterialTheme.colorScheme.outline)
    ) {
        Column(
            modifier = Modifier.padding(Dimensions.PaddingMedium),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Text(
                text = "OVERALL SCORE",
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )

            Spacer(modifier = Modifier.height(Dimensions.PaddingMedium))

            Box(contentAlignment = Alignment.Center, modifier = Modifier.size(120.dp)) {
                val animatedProgress by animateFloatAsState(
                    targetValue = healthScore / 100f,
                    animationSpec = tween(durationMillis = 1000),
                    label = "HealthProgress"
                )

                Canvas(modifier = Modifier.fillMaxSize()) {
                    drawCircle(
                        color = if (conditionColor == LightTextMuted) Color.LightGray.copy(alpha = 0.2f) else conditionColor.copy(alpha = 0.1f),
                        style = Stroke(width = 8.dp.toPx())
                    )
                    drawArc(
                        color = conditionColor,
                        startAngle = -90f,
                        sweepAngle = 360f * animatedProgress,
                        useCenter = false,
                        style = Stroke(width = 8.dp.toPx(), cap = StrokeCap.Round)
                    )
                }
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        text = "${healthScore.toInt()}",
                        style = MaterialTheme.typography.displayLarge.copy(fontSize = 32.sp),
                        color = conditionColor
                    )
                    Text(
                        text = "HEALTH",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            Spacer(modifier = Modifier.height(Dimensions.PaddingMedium))

            Surface(
                color = conditionBg,
                shape = CircleShape,
                border = androidx.compose.foundation.BorderStroke(1.dp, conditionColor.copy(alpha = 0.3f))
            ) {
                Text(
                    text = condition.uppercase(),
                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 4.dp),
                    style = MaterialTheme.typography.labelSmall,
                    color = conditionColor
                )
            }

            if (confidenceScore != null) {
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "AI Confidence: $confidenceScore%",
                    style = MaterialTheme.typography.labelSmall.copy(letterSpacing = 0.sp),
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

// ------------------------------------
// StatCard
// ------------------------------------

@Composable
fun StatCard(
    title: String,
    value: String,
    icon: ImageVector,
    modifier: Modifier = Modifier,
    iconColor: Color = PrimaryMain,
    footerText: String? = null
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        shape = BrushIQShapes.large,
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = androidx.compose.foundation.BorderStroke(Dimensions.BorderWidth, MaterialTheme.colorScheme.outline)
    ) {
        Row(
            modifier = Modifier.padding(Dimensions.PaddingMedium),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = title.uppercase(),
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Text(
                    text = value,
                    style = MaterialTheme.typography.headlineMedium,
                    color = MaterialTheme.colorScheme.onSurface
                )
                if (footerText != null) {
                    Text(
                        text = footerText,
                        style = MaterialTheme.typography.labelSmall.copy(letterSpacing = 0.sp),
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
            Surface(
                modifier = Modifier.size(48.dp),
                color = iconColor.copy(alpha = 0.1f),
                shape = BrushIQShapes.medium
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    modifier = Modifier.padding(12.dp),
                    tint = iconColor
                )
            }
        }
    }
}

// ------------------------------------
// FamilyMemberCard
// ------------------------------------

@Composable
fun FamilyMemberCard(
    name: String,
    relationship: String,
    age: Int,
    gender: String,
    healthScore: Int?,
    toothbrushName: String?,
    profilePhotoUrl: String?,
    onClick: () -> Unit,
    onEdit: () -> Unit,
    onDelete: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier
            .fillMaxWidth()
            .clickable { onClick() },
        shape = BrushIQShapes.large,
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = androidx.compose.foundation.BorderStroke(Dimensions.BorderWidth, MaterialTheme.colorScheme.outline)
    ) {
        Column(modifier = Modifier.padding(Dimensions.PaddingMedium)) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween,
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.weight(1f)) {
                    Box(
                        modifier = Modifier
                            .size(48.dp)
                            .clip(BrushIQShapes.medium)
                            .background(PrimaryAlpha10)
                            .border(1.dp, MaterialTheme.colorScheme.outline, BrushIQShapes.medium),
                        contentAlignment = Alignment.Center
                    ) {
                        if (profilePhotoUrl != null) {
                            AsyncImage(
                                model = profilePhotoUrl,
                                contentDescription = name,
                                contentScale = ContentScale.Crop,
                                modifier = Modifier.fillMaxSize()
                            )
                        } else {
                            Icon(Icons.Default.Person, contentDescription = null, tint = PrimaryMain)
                        }
                    }
                    Spacer(modifier = Modifier.width(12.dp))
                    Column {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                text = name,
                                style = MaterialTheme.typography.titleMedium,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Surface(
                                color = PrimaryAlpha10,
                                shape = CircleShape
                            ) {
                                Text(
                                    text = relationship.uppercase(),
                                    modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp),
                                    style = TextStyle(fontSize = 8.sp, fontWeight = FontWeight.Black, letterSpacing = 0.5.sp),
                                    color = PrimaryMain
                                )
                            }
                        }
                        Text(
                            text = "$age YRS • ${gender.uppercase()}",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
                Row {
                    IconButton(onClick = onEdit) {
                        Icon(Icons.Default.Edit, contentDescription = "Edit", modifier = Modifier.size(16.dp), tint = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                    IconButton(onClick = onDelete) {
                        Icon(Icons.Default.Delete, contentDescription = "Delete", modifier = Modifier.size(16.dp), tint = Error)
                    }
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            Surface(
                modifier = Modifier.fillMaxWidth(),
                color = MaterialTheme.colorScheme.background.copy(alpha = 0.5f),
                shape = BrushIQShapes.medium
            ) {
                Row(
                    modifier = Modifier.padding(12.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "ACTIVE TOOTHBRUSH",
                            style = TextStyle(fontSize = 8.sp, fontWeight = FontWeight.Bold, letterSpacing = 0.5.sp),
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Text(
                            text = toothbrushName ?: "No toothbrush assigned",
                            style = MaterialTheme.typography.bodySmall.copy(fontWeight = FontWeight.Bold),
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    }
                    Column(horizontalAlignment = Alignment.End) {
                        Text(
                            text = "HEALTH SCORE",
                            style = TextStyle(fontSize = 8.sp, fontWeight = FontWeight.Bold, letterSpacing = 0.5.sp),
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        val scoreColor = when {
                            healthScore == null -> LightTextMuted
                            healthScore >= 80 -> Success
                            healthScore >= 50 -> Warning
                            else -> Error
                        }
                        Surface(
                            color = scoreColor.copy(alpha = 0.1f),
                            shape = CircleShape,
                            border = androidx.compose.foundation.BorderStroke(0.5.dp, scoreColor.copy(alpha = 0.3f))
                        ) {
                            Text(
                                text = healthScore?.let { "$it%" } ?: "NO SCANS",
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp),
                                style = TextStyle(fontSize = 10.sp, fontWeight = FontWeight.Black),
                                color = scoreColor
                            )
                        }
                    }
                }
            }
        }
    }
}

// ------------------------------------
// BrushCard
// ------------------------------------

@Composable
fun BrushCard(
    brand: String,
    model: String,
    type: String,
    memberName: String,
    color: String,
    purchaseDate: String,
    onEdit: () -> Unit,
    onDelete: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier.fillMaxWidth(),
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
                Surface(
                    color = MaterialTheme.colorScheme.surfaceVariant,
                    shape = BrushIQShapes.extraSmall
                ) {
                    Text(
                        text = type.uppercase(),
                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp),
                        style = TextStyle(fontSize = 8.sp, fontWeight = FontWeight.Bold),
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.Person, contentDescription = null, modifier = Modifier.size(12.dp), tint = MaterialTheme.colorScheme.onSurfaceVariant)
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = memberName.uppercase(),
                        style = TextStyle(fontSize = 9.sp, fontWeight = FontWeight.Bold),
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            Text(
                text = "$brand $model",
                style = MaterialTheme.typography.titleMedium,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )

            Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(top = 8.dp)) {
                Text(
                    text = "COLOR:",
                    style = TextStyle(fontSize = 9.sp, fontWeight = FontWeight.Bold),
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Spacer(modifier = Modifier.width(8.dp))
                // Color Circle
                val colorObj = try { Color(android.graphics.Color.parseColor(color)) } catch (e: Exception) { Color.Gray }
                Box(
                    modifier = Modifier
                        .size(14.dp)
                        .clip(CircleShape)
                        .background(colorObj)
                        .border(0.5.dp, MaterialTheme.colorScheme.outline, CircleShape)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = color,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            Spacer(modifier = Modifier.height(12.dp))
            Divider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.5f))
            Spacer(modifier = Modifier.height(8.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.DateRange, contentDescription = null, modifier = Modifier.size(14.dp), tint = MaterialTheme.colorScheme.onSurfaceVariant)
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = purchaseDate,
                        style = TextStyle(fontSize = 9.sp, fontWeight = FontWeight.Bold),
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                Row {
                    IconButton(onClick = onEdit, modifier = Modifier.size(24.dp)) {
                        Icon(Icons.Default.Edit, contentDescription = "Edit", modifier = Modifier.size(14.dp), tint = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                    IconButton(onClick = onDelete, modifier = Modifier.size(24.dp)) {
                        Icon(Icons.Default.Delete, contentDescription = "Delete", modifier = Modifier.size(14.dp), tint = Error)
                    }
                }
            }
        }
    }
}

// ------------------------------------
// ReminderCard
// ------------------------------------

@Composable
fun ReminderCard(
    memberName: String,
    brushBrand: String,
    type: String,
    message: String,
    nextDate: String,
    onComplete: () -> Unit,
    modifier: Modifier = Modifier
) {
    val typeColor = when (type) {
        "Daily" -> Error
        "Every 3 Days" -> Warning
        "Weekly" -> PrimaryMain
        else -> LightTextSecondary
    }

    Card(
        modifier = modifier.fillMaxWidth(),
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
                color = typeColor.copy(alpha = 0.1f),
                shape = BrushIQShapes.medium
            ) {
                Icon(
                    imageVector = Icons.Default.Notifications,
                    contentDescription = null,
                    modifier = Modifier.padding(10.dp),
                    tint = typeColor
                )
            }
            Spacer(modifier = Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f)) {
                Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.fillMaxWidth()) {
                    Text(
                        text = memberName,
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Text(
                        text = " • ",
                        style = TextStyle(fontSize = 10.sp),
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = brushBrand,
                        style = MaterialTheme.typography.labelSmall.copy(letterSpacing = 0.sp, fontWeight = FontWeight.Bold),
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                        modifier = Modifier.weight(1f, fill = false)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Surface(
                        color = typeColor.copy(alpha = 0.1f),
                        shape = RoundedCornerShape(4.dp),
                        border = androidx.compose.foundation.BorderStroke(0.5.dp, typeColor.copy(alpha = 0.3f))
                    ) {
                        Text(
                            text = type.uppercase(),
                            modifier = Modifier.padding(horizontal = 4.dp, vertical = 2.dp),
                            style = TextStyle(fontSize = 8.sp, fontWeight = FontWeight.Bold),
                            color = typeColor
                        )
                    }
                }
                Text(
                    text = message,
                    style = MaterialTheme.typography.bodySmall.copy(fontWeight = FontWeight.SemiBold),
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(top = 4.dp)
                )
                Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(top = 8.dp)) {
                    Icon(Icons.Default.DateRange, contentDescription = null, modifier = Modifier.size(12.dp), tint = MaterialTheme.colorScheme.onSurfaceVariant)
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = "DUE: $nextDate",
                        style = TextStyle(fontSize = 9.sp, fontWeight = FontWeight.Bold, letterSpacing = 0.5.sp),
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
            Spacer(modifier = Modifier.width(12.dp))
            IconButton(
                onClick = onComplete,
                modifier = Modifier
                    .size(40.dp)
                    .clip(BrushIQShapes.medium)
                    .background(SecondaryAlpha10)
                    .border(1.dp, SecondaryMain.copy(alpha = 0.3f), BrushIQShapes.medium)
            ) {
                Icon(Icons.Default.Check, contentDescription = "Complete", tint = SecondaryMain)
            }
        }
    }
}

// ------------------------------------
// TipCard
// ------------------------------------

@Composable
fun TipCard(
    title: String,
    content: String,
    category: String,
    illustrationUrl: String?,
    isBookmarked: Boolean,
    onToggleBookmark: () -> Unit,
    onReadMore: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier
            .width(280.dp)
            .clickable { onReadMore() },
        shape = BrushIQShapes.large,
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = androidx.compose.foundation.BorderStroke(Dimensions.BorderWidth, MaterialTheme.colorScheme.outline)
    ) {
        Column {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(140.dp)
                    .background(
                        Brush.linearGradient(
                            colors = listOf(PrimaryAlpha10, SecondaryAlpha10)
                        )
                    )
            ) {
                if (illustrationUrl != null) {
                    AsyncImage(
                        model = illustrationUrl,
                        contentDescription = title,
                        contentScale = ContentScale.Crop,
                        modifier = Modifier.fillMaxSize()
                    )
                } else {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        Text(
                            text = "BrushIQ",
                            style = MaterialTheme.typography.displayLarge.copy(fontSize = 24.sp, color = Color.White.copy(alpha = 0.3f))
                        )
                    }
                }

                Surface(
                    modifier = Modifier.padding(12.dp),
                    color = PrimaryMain,
                    shape = CircleShape
                ) {
                    Text(
                        text = category.uppercase(),
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                        style = TextStyle(fontSize = 8.sp, fontWeight = FontWeight.Black, letterSpacing = 1.sp),
                        color = Color.White
                    )
                }

                Surface(
                    modifier = Modifier
                        .align(Alignment.TopEnd)
                        .padding(12.dp)
                        .size(32.dp),
                    color = Color.White.copy(alpha = 0.6f),
                    shape = CircleShape,
                    onClick = onToggleBookmark
                ) {
                    Icon(
                        imageVector = if (isBookmarked) Icons.Default.Favorite else Icons.Default.FavoriteBorder,
                        contentDescription = "Bookmark",
                        modifier = Modifier.padding(8.dp),
                        tint = if (isBookmarked) Error else LightTextSecondary
                    )
                }
            }

            Column(modifier = Modifier.padding(Dimensions.PaddingMedium)) {
                Text(
                    text = title,
                    style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Black),
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                Text(
                    text = content,
                    style = MaterialTheme.typography.bodySmall.copy(fontWeight = FontWeight.SemiBold),
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis,
                    modifier = Modifier.padding(top = 6.dp)
                )
                Spacer(modifier = Modifier.height(10.dp))
                Divider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.3f))
                Spacer(modifier = Modifier.height(10.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "READ ARTICLE",
                        style = TextStyle(fontSize = 9.sp, fontWeight = FontWeight.Black, letterSpacing = 1.sp),
                        color = PrimaryMain
                    )
                    Icon(Icons.Default.ArrowForward, contentDescription = null, modifier = Modifier.size(14.dp), tint = PrimaryMain)
                }
            }
        }
    }
}

// ------------------------------------
// Previews
// ------------------------------------

@Preview(showBackground = true, name = "Light Mode")
@Composable
fun PreviewCardsLight() {
    BrushIQTheme(darkTheme = false) {
        PreviewContent()
    }
}

@Preview(showBackground = true, name = "Dark Mode")
@Composable
fun PreviewCardsDark() {
    BrushIQTheme(darkTheme = true) {
        PreviewContent()
    }
}

@Composable
fun PreviewContent() {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        HealthScoreCard(healthScore = 85f, condition = "Good", confidenceScore = 98)
        StatCard(title = "Total Scans", value = "24", icon = Icons.Default.CheckCircle, footerText = "Last 30 days")
        FamilyMemberCard(
            name = "John Doe", relationship = "Dad", age = 42, gender = "Male", 
            healthScore = 82, toothbrushName = "Oral-B iO Series 9", profilePhotoUrl = null,
            onClick = {}, onEdit = {}, onDelete = {}
        )
        BrushCard(
            brand = "Oral-B", model = "iO Series 9", type = "Electric", 
            memberName = "John Doe", color = "Black", purchaseDate = "Jan 12, 2024",
            onEdit = {}, onDelete = {}
        )
        ReminderCard(
            memberName = "Jane", brushBrand = "Philips Sonicare", type = "Daily",
            message = "Morning brushing session with fluoridated paste", nextDate = "Today",
            onComplete = {}
        )
        TipCard(
            title = "The 2-Minute Rule",
            content = "Brushing for at least two minutes is essential for removing plaque effectively.",
            category = "Technique",
            illustrationUrl = null,
            isBookmarked = true,
            onToggleBookmark = {},
            onReadMore = {}
        )
    }
}
