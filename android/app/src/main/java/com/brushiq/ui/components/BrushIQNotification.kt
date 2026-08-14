package com.brushiq.ui.components

import androidx.compose.animation.*
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Error
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.brushiq.ui.theme.*
import com.brushiq.util.NotificationData
import com.brushiq.util.NotificationType
import com.brushiq.util.UiNotificationManager
import kotlinx.coroutines.delay

@Composable
fun BrushIQNotificationCard(
    notification: NotificationData,
    onDismiss: () -> Unit,
    modifier: Modifier = Modifier
) {
    val accentColor = when (notification.type) {
        NotificationType.SUCCESS -> Color(0xFF10B981) // Clean clinical green
        NotificationType.ERROR -> Color(0xFFEF4444)   // Clean clinical red
        NotificationType.WARNING -> Color(0xFFF59E0B) // Amber/Orange
        NotificationType.INFO -> Color(0xFF3B82F6)    // Clinical blue
    }

    val iconVector = when (notification.type) {
        NotificationType.SUCCESS -> Icons.Default.CheckCircle
        NotificationType.ERROR -> Icons.Default.Error
        NotificationType.WARNING -> Icons.Default.Warning
        NotificationType.INFO -> Icons.Default.Info
    }

    val contentDesc = when (notification.type) {
        NotificationType.SUCCESS -> "Success Notification"
        NotificationType.ERROR -> "Error Notification"
        NotificationType.WARNING -> "Warning Notification"
        NotificationType.INFO -> "Information Notification"
    }

    Surface(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp)
            .shadow(elevation = 8.dp, shape = RoundedCornerShape(20.dp))
            .border(
                width = 1.dp,
                color = accentColor.copy(alpha = 0.35f),
                shape = RoundedCornerShape(20.dp)
            )
            .semantics {
                this.contentDescription = "$contentDesc: ${notification.title}. ${notification.message}"
            },
        shape = RoundedCornerShape(20.dp),
        color = MaterialTheme.colorScheme.surface,
        tonalElevation = 6.dp
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 14.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            // Icon Badge
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .clip(CircleShape)
                    .background(accentColor.copy(alpha = 0.14f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = iconVector,
                    contentDescription = null,
                    tint = accentColor,
                    modifier = Modifier.size(24.dp)
                )
            }

            // Title & Message
            Column(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(2.dp)
            ) {
                Text(
                    text = notification.title,
                    style = MaterialTheme.typography.titleMedium.copy(
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                )
                Text(
                    text = notification.message,
                    style = MaterialTheme.typography.bodyMedium.copy(
                        fontSize = 13.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                )
            }

            // Dismiss Button (48dp minimum touch target for accessibility)
            Box(
                modifier = Modifier
                    .size(48.dp)
                    .clip(CircleShape)
                    .clickable(onClick = onDismiss)
                    .semantics { contentDescription = "Dismiss notification" },
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Default.Close,
                    contentDescription = "Close",
                    tint = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f),
                    modifier = Modifier.size(20.dp)
                )
            }
        }
    }
}

/**
 * Centralized floating notification host component.
 * Positioned cleanly above navigation bars and action buttons without obscuring UI elements.
 */
@Composable
fun BrushIQNotificationHost(
    modifier: Modifier = Modifier,
    showBottomBar: Boolean = false
) {
    val notificationState by UiNotificationManager.currentNotification.collectAsState()

    // Auto dismiss after duration
    LaunchedEffect(notificationState?.id) {
        val current = notificationState
        if (current != null) {
            delay(current.durationMs)
            UiNotificationManager.dismiss()
        }
    }

    // Calculate dynamic bottom padding to float cleanly above bottom bar / system bar
    val extraBottomSpacing = if (showBottomBar) 84.dp else 20.dp

    Box(
        modifier = modifier
            .fillMaxWidth()
            .windowInsetsPadding(WindowInsets.navigationBars)
            .padding(bottom = extraBottomSpacing),
        contentAlignment = Alignment.BottomCenter
    ) {
        AnimatedVisibility(
            visible = notificationState != null,
            enter = slideInVertically(
                animationSpec = tween(durationMillis = 300),
                initialOffsetY = { fullHeight -> fullHeight }
            ) + fadeIn(animationSpec = tween(durationMillis = 300)),
            exit = slideOutVertically(
                animationSpec = tween(durationMillis = 300),
                targetOffsetY = { fullHeight -> fullHeight }
            ) + fadeOut(animationSpec = tween(durationMillis = 300))
        ) {
            notificationState?.let { data ->
                BrushIQNotificationCard(
                    notification = data,
                    onDismiss = { UiNotificationManager.dismiss() }
                )
            }
        }
    }
}
