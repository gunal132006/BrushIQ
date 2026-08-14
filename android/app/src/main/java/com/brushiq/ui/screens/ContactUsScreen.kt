package com.brushiq.ui.screens

import android.content.ActivityNotFoundException
import android.content.Intent
import android.net.Uri
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.navigation.NavController
import com.brushiq.config.AppConfig
import com.brushiq.ui.components.AppHeader
import com.brushiq.ui.components.PrimaryButton
import com.brushiq.ui.theme.*
import com.brushiq.util.UiNotificationManager

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ContactUsScreen(
    navController: NavController
) {
    val context = LocalContext.current
    val scrollState = rememberScrollState()

    var subject by remember { mutableStateOf("") }
    var messageText by remember { mutableStateOf("") }

    Scaffold(
        topBar = {
            AppHeader(
                title = "Contact Us",
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
            // Heading & Subtitle
            Text(
                text = "Contact BrushIQ Support",
                style = MaterialTheme.typography.headlineSmall.copy(fontWeight = FontWeight.Bold),
                color = MaterialTheme.colorScheme.onSurface
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = "Have questions, feedback, or need assistance with your AI scans? Our support team is dedicated to providing quick help.",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )

            Spacer(modifier = Modifier.height(24.dp))

            // Support Channel Card
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable {
                        launchEmailIntent(
                            context = context,
                            subject = subject,
                            body = messageText
                        )
                    },
                shape = BrushIQShapes.large,
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                border = androidx.compose.foundation.BorderStroke(Dimensions.BorderWidth, MaterialTheme.colorScheme.outline)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier
                            .size(48.dp)
                            .background(PrimaryMain.copy(alpha = 0.1f), BrushIQShapes.medium),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            Icons.Default.Email,
                            contentDescription = "Support Email",
                            tint = PrimaryMain,
                            modifier = Modifier.size(24.dp)
                        )
                    }
                    Spacer(modifier = Modifier.width(16.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "Email Support",
                            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                        )
                        Text(
                            text = AppConfig.SUPPORT_EMAIL,
                            style = MaterialTheme.typography.bodyMedium,
                            color = PrimaryMain
                        )
                    }
                    Icon(
                        Icons.Default.ChevronRight,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            Spacer(modifier = Modifier.height(28.dp))

            Text(
                text = "SEND US A MESSAGE",
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.padding(bottom = 8.dp)
            )

            // Form inputs
            OutlinedTextField(
                value = subject,
                onValueChange = { subject = it },
                label = { Text("Subject (Optional)") },
                placeholder = { Text("e.g. Scanning Question") },
                leadingIcon = { Icon(Icons.Default.Subject, contentDescription = null, tint = PrimaryMain) },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                shape = BrushIQShapes.large
            )

            Spacer(modifier = Modifier.height(16.dp))

            OutlinedTextField(
                value = messageText,
                onValueChange = { messageText = it },
                label = { Text("Describe your issue or feedback") },
                placeholder = { Text("Enter your message here...") },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(140.dp),
                maxLines = 5,
                shape = BrushIQShapes.large
            )

            Spacer(modifier = Modifier.height(24.dp))

            // Email Support Action Button
            PrimaryButton(
                text = "Email Support",
                onClick = {
                    launchEmailIntent(
                        context = context,
                        subject = subject,
                        body = messageText
                    )
                }
            )

            Spacer(modifier = Modifier.height(24.dp))

            // Response Time Note
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = BrushIQShapes.large,
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface.copy(alpha = 0.5f))
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        Icons.Default.Schedule,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.size(20.dp)
                    )
                    Spacer(modifier = Modifier.width(12.dp))
                    Text(
                        text = "We typically respond to support inquiries within 24 business hours.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            Spacer(modifier = Modifier.height(40.dp))
        }
    }
}

private fun launchEmailIntent(
    context: android.content.Context,
    subject: String,
    body: String
) {
    val defaultSubject = if (subject.isNotBlank()) subject.trim() else "BrushIQ Support Request"
    val uriString = "mailto:${AppConfig.SUPPORT_EMAIL}?subject=${Uri.encode(defaultSubject)}&body=${Uri.encode(body.trim())}"
    val intent = Intent(Intent.ACTION_SENDTO, Uri.parse(uriString))

    try {
        context.startActivity(intent)
    } catch (e: ActivityNotFoundException) {
        UiNotificationManager.showError(
            title = "Email App Not Available",
            message = "Please configure an email application on your device to contact BrushIQ Support."
        )
    } catch (e: Exception) {
        UiNotificationManager.showError(
            title = "Email App Not Available",
            message = "Please configure an email application on your device to contact BrushIQ Support."
        )
    }
}
