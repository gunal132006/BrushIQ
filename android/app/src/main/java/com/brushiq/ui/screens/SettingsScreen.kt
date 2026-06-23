package com.brushiq.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import androidx.navigation.compose.rememberNavController
import com.brushiq.ui.components.AppHeader
import com.brushiq.ui.theme.*
import com.brushiq.ui.viewmodel.AuthViewModel
import com.brushiq.ui.viewmodel.BrushIQViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(
    navController: NavController,
    viewModel: BrushIQViewModel? = null,
    authViewModel: AuthViewModel? = null,
    isDarkTheme: MutableState<Boolean> = mutableStateOf(false)
) {
    val scrollState = rememberScrollState()

    // Granular settings state
    var notificationsEnabled by remember { mutableStateOf(true) }
    var aiRecommendations by remember { mutableStateOf(true) }
    var showLogoutDialog by remember { mutableStateOf(false) }

    // Theme selection
    var showThemeDialog by remember { mutableStateOf(false) }
    val themeOptions = listOf("System Default", "Light", "Dark")
    var selectedTheme by remember { mutableStateOf(if (isDarkTheme.value) "Dark" else "Light") }

    // Notification frequency
    var showNotificationDialog by remember { mutableStateOf(false) }
    val notificationOptions = listOf("Every Scan", "Daily Summary", "Weekly Summary", "Important Only")
    var selectedNotification by remember { mutableStateOf("Daily Summary") }

    // Reminder time
    var showReminderDialog by remember { mutableStateOf(false) }
    val reminderOptions = listOf("6:00 AM", "7:00 AM", "8:00 AM", "9:00 AM", "10:00 AM", "12:00 PM", "8:00 PM", "9:00 PM", "10:00 PM")
    var selectedReminderTime by remember { mutableStateOf("8:00 AM") }

    // Language
    var showLanguageDialog by remember { mutableStateOf(false) }
    val languageOptions = listOf("English", "Spanish", "French", "German", "Hindi", "Japanese", "Chinese", "Arabic")
    var selectedLanguage by remember { mutableStateOf("English") }

    Scaffold(
        topBar = {
            AppHeader(
                title = "Settings",
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
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
                .padding(Dimensions.PaddingMedium)
        ) {
            // Appearance Section
            SettingsSection(title = "APPEARANCE") {
                SettingsActionRow(
                    label = "Theme",
                    icon = Icons.Default.Palette,
                    trailingText = selectedTheme,
                    onClick = { showThemeDialog = true }
                )
                SettingsActionRow(
                    label = "Language",
                    icon = Icons.Default.Language,
                    trailingText = selectedLanguage,
                    onClick = { showLanguageDialog = true }
                )
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Notifications Section
            SettingsSection(title = "NOTIFICATIONS") {
                SettingsToggleRow(
                    label = "Push Notifications",
                    icon = Icons.Default.Notifications,
                    checked = notificationsEnabled,
                    onCheckedChange = { notificationsEnabled = it }
                )
                SettingsActionRow(
                    label = "Notification Frequency",
                    icon = Icons.Default.Schedule,
                    trailingText = selectedNotification,
                    onClick = { showNotificationDialog = true }
                )
                SettingsActionRow(
                    label = "Reminder Time",
                    icon = Icons.Default.Alarm,
                    trailingText = selectedReminderTime,
                    onClick = { showReminderDialog = true }
                )
            }

            Spacer(modifier = Modifier.height(24.dp))

            // AI & Analysis Section
            SettingsSection(title = "AI & ANALYSIS") {
                SettingsToggleRow(
                    label = "AI Recommendations",
                    icon = Icons.Default.AutoGraph,
                    checked = aiRecommendations,
                    onCheckedChange = { aiRecommendations = it }
                )
                SettingsToggleRow(
                    label = "Debug Console",
                    icon = Icons.Default.Terminal,
                    checked = true,
                    onCheckedChange = { }
                )
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Support Section
            SettingsSection(title = "SUPPORT & LEGAL") {
                SettingsActionRow(label = "About BrushIQ", icon = Icons.Default.Info) {
                    navController.navigate("about")
                }
                SettingsActionRow(label = "Privacy Policy", icon = Icons.Default.PrivacyTip) {
                    navController.navigate("privacy_policy")
                }
                SettingsActionRow(label = "Terms & Conditions", icon = Icons.Default.Description) {
                    navController.navigate("terms_conditions")
                }
                SettingsActionRow(label = "Help Center", icon = Icons.Default.HelpCenter) { }
                SettingsActionRow(label = "Contact Us", icon = Icons.Default.ContactSupport) { }
            }

            Spacer(modifier = Modifier.height(24.dp))

            // App Info Section
            SettingsSection(title = "APP INFO") {
                SettingsValueRow(label = "App Version", value = "1.0.0 (Build 2405)", icon = Icons.Default.Info)
                SettingsValueRow(label = "Diagnostic Engine", value = "v2.4.1", icon = Icons.Default.Science)
            }

            Spacer(modifier = Modifier.height(32.dp))

            // Logout
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { showLogoutDialog = true },
                shape = BrushIQShapes.large,
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                border = androidx.compose.foundation.BorderStroke(Dimensions.BorderWidth, Error.copy(alpha = 0.3f))
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.Center
                ) {
                    Icon(Icons.Default.Logout, contentDescription = null, tint = Error)
                    Spacer(modifier = Modifier.width(12.dp))
                    Text("SIGN OUT OF BRUSHIQ", style = MaterialTheme.typography.labelMedium, color = Error)
                }
            }

            Spacer(modifier = Modifier.height(80.dp))
        }
    }

    // Theme Selection Dialog
    if (showThemeDialog) {
        SettingsSelectionDialog(
            title = "Select Theme",
            options = themeOptions,
            selectedOption = selectedTheme,
            onSelect = { selected ->
                selectedTheme = selected
                isDarkTheme.value = selected == "Dark"
                showThemeDialog = false
            },
            onDismiss = { showThemeDialog = false }
        )
    }

    // Notification Frequency Dialog
    if (showNotificationDialog) {
        SettingsSelectionDialog(
            title = "Notification Frequency",
            options = notificationOptions,
            selectedOption = selectedNotification,
            onSelect = { selected ->
                selectedNotification = selected
                showNotificationDialog = false
            },
            onDismiss = { showNotificationDialog = false }
        )
    }

    // Reminder Time Dialog
    if (showReminderDialog) {
        SettingsSelectionDialog(
            title = "Reminder Time",
            options = reminderOptions,
            selectedOption = selectedReminderTime,
            onSelect = { selected ->
                selectedReminderTime = selected
                showReminderDialog = false
            },
            onDismiss = { showReminderDialog = false }
        )
    }

    // Language Dialog
    if (showLanguageDialog) {
        SettingsSelectionDialog(
            title = "Select Language",
            options = languageOptions,
            selectedOption = selectedLanguage,
            onSelect = { selected ->
                selectedLanguage = selected
                showLanguageDialog = false
            },
            onDismiss = { showLanguageDialog = false }
        )
    }

    // Logout Dialog
    if (showLogoutDialog) {
        AlertDialog(
            onDismissRequest = { showLogoutDialog = false },
            title = {
                Text("Sign Out", style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold))
            },
            text = {
                Text("Are you sure you want to sign out of BrushIQ?")
            },
            confirmButton = {
                TextButton(
                    onClick = {
                        showLogoutDialog = false
                        authViewModel?.logout {
                            navController.navigate("login") {
                                popUpTo(0) { inclusive = true }
                            }
                        }
                    },
                    colors = ButtonDefaults.textButtonColors(contentColor = Error)
                ) {
                    Text("SIGN OUT")
                }
            },
            dismissButton = {
                TextButton(onClick = { showLogoutDialog = false }) {
                    Text("CANCEL")
                }
            }
        )
    }
}

@Composable
fun SettingsSelectionDialog(
    title: String,
    options: List<String>,
    selectedOption: String,
    onSelect: (String) -> Unit,
    onDismiss: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Text(title, style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold))
        },
        text = {
            Column {
                options.forEach { option ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { onSelect(option) }
                            .padding(vertical = 12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        RadioButton(
                            selected = option == selectedOption,
                            onClick = { onSelect(option) },
                            colors = RadioButtonDefaults.colors(selectedColor = PrimaryMain)
                        )
                        Spacer(modifier = Modifier.width(12.dp))
                        Text(option, style = MaterialTheme.typography.bodyLarge)
                    }
                }
            }
        },
        confirmButton = {
            TextButton(onClick = onDismiss) {
                Text("CANCEL")
            }
        }
    )
}

@Composable
fun SettingsSection(title: String, content: @Composable ColumnScope.() -> Unit) {
    Column {
        Text(
            text = title,
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.padding(bottom = 8.dp)
        )
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = BrushIQShapes.large,
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            border = androidx.compose.foundation.BorderStroke(Dimensions.BorderWidth, MaterialTheme.colorScheme.outline)
        ) {
            Column {
                content()
            }
        }
    }
}

@Composable
fun SettingsToggleRow(label: String, icon: ImageVector, checked: Boolean, onCheckedChange: (Boolean) -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(icon, contentDescription = null, modifier = Modifier.size(20.dp), tint = PrimaryMain)
            Spacer(modifier = Modifier.width(16.dp))
            Text(label, style = MaterialTheme.typography.bodyLarge)
        }
        Switch(
            checked = checked,
            onCheckedChange = onCheckedChange,
            colors = SwitchDefaults.colors(
                checkedThumbColor = Color.White,
                checkedTrackColor = PrimaryMain
            )
        )
    }
}

@Composable
fun SettingsActionRow(
    label: String,
    icon: ImageVector,
    trailingText: String? = null,
    onClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() }
            .padding(16.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.weight(1f)) {
            Icon(icon, contentDescription = null, modifier = Modifier.size(20.dp), tint = PrimaryMain)
            Spacer(modifier = Modifier.width(16.dp))
            Text(label, style = MaterialTheme.typography.bodyLarge)
        }
        Row(verticalAlignment = Alignment.CenterVertically) {
            if (trailingText != null) {
                Text(trailingText, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                Spacer(modifier = Modifier.width(4.dp))
            }
            Icon(Icons.Default.ChevronRight, contentDescription = null, tint = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}

@Composable
fun SettingsValueRow(label: String, value: String, icon: ImageVector) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(icon, contentDescription = null, modifier = Modifier.size(20.dp), tint = PrimaryMain)
            Spacer(modifier = Modifier.width(16.dp))
            Text(label, style = MaterialTheme.typography.bodyLarge)
        }
        Text(value, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
    }
}

@Preview(showBackground = true)
@Composable
fun PreviewSettingsScreen() {
    BrushIQTheme {
        SettingsScreen(navController = rememberNavController())
    }
}
