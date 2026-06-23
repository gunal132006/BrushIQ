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
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import androidx.navigation.compose.rememberNavController
import com.brushiq.ui.components.AppHeader
import com.brushiq.ui.components.SecondaryButton
import com.brushiq.ui.theme.*
import com.brushiq.ui.viewmodel.AuthViewModel

@Composable
fun ProfileScreen(
    navController: NavController,
    viewModel: AuthViewModel? = null
) {
    val scrollState = rememberScrollState()
    var showLogoutDialog by remember { mutableStateOf(false) }

    // Mock achievement data
    val totalScans = 12
    val avgHealthScore = 82
    val bestHealthScore = 96
    val currentStreak = 7

    Scaffold(
        topBar = {
            AppHeader(
                title = "My Profile",
                actions = {
                    IconButton(onClick = { navController.navigate("settings") }) {
                        Icon(Icons.Default.Settings, contentDescription = "Settings", tint = PrimaryMain)
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
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Profile Header
            Box(
                modifier = Modifier
                    .size(100.dp)
                    .clip(CircleShape)
                    .background(PrimaryAlpha10),
                contentAlignment = Alignment.Center
            ) {
                Icon(Icons.Default.Person, contentDescription = null, modifier = Modifier.size(60.dp), tint = PrimaryMain)
            }

            Spacer(modifier = Modifier.height(16.dp))

            Text(
                text = "Gunal S",
                style = MaterialTheme.typography.headlineMedium.copy(fontWeight = FontWeight.Black)
            )
            Text(
                text = "gunal.s@brushiq.com",
                style = MaterialTheme.typography.bodyLarge,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )

            Spacer(modifier = Modifier.height(24.dp))

            // Achievement Statistics
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = BrushIQShapes.large,
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                border = androidx.compose.foundation.BorderStroke(Dimensions.BorderWidth, MaterialTheme.colorScheme.outline)
            ) {
                Column(modifier = Modifier.padding(Dimensions.PaddingMedium)) {
                    Text(
                        "ACHIEVEMENT STATISTICS",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Spacer(modifier = Modifier.height(16.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        AchievementStat(
                            label = "Total Scans",
                            value = "$totalScans",
                            icon = Icons.Default.CameraAlt,
                            iconColor = PrimaryMain,
                            modifier = Modifier.weight(1f)
                        )
                        AchievementStat(
                            label = "Avg Score",
                            value = "$avgHealthScore%",
                            icon = Icons.Default.TrendingUp,
                            iconColor = Success,
                            modifier = Modifier.weight(1f)
                        )
                    }
                    Spacer(modifier = Modifier.height(12.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        AchievementStat(
                            label = "Best Score",
                            value = "$bestHealthScore%",
                            icon = Icons.Default.EmojiEvents,
                            iconColor = Warning,
                            modifier = Modifier.weight(1f)
                        )
                        AchievementStat(
                            label = "Current Streak",
                            value = "$currentStreak days",
                            icon = Icons.Default.LocalFireDepartment,
                            iconColor = Alert,
                            modifier = Modifier.weight(1f)
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Account Information Section
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = BrushIQShapes.large,
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                border = androidx.compose.foundation.BorderStroke(Dimensions.BorderWidth, MaterialTheme.colorScheme.outline)
            ) {
                Column(modifier = Modifier.padding(Dimensions.PaddingMedium)) {
                    Text(
                        text = "ACCOUNT INFORMATION",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Spacer(modifier = Modifier.height(16.dp))

                    ProfileInfoRow(label = "Full Name", value = "Gunal S", icon = Icons.Default.Person)
                    Divider(modifier = Modifier.padding(vertical = 12.dp), color = MaterialTheme.colorScheme.outline.copy(alpha = 0.5f))
                    ProfileInfoRow(label = "Email", value = "gunal.s@brushiq.com", icon = Icons.Default.Email)
                    Divider(modifier = Modifier.padding(vertical = 12.dp), color = MaterialTheme.colorScheme.outline.copy(alpha = 0.5f))
                    ProfileInfoRow(label = "Phone", value = "+1 (555) 123-4567", icon = Icons.Default.Phone)
                    Divider(modifier = Modifier.padding(vertical = 12.dp), color = MaterialTheme.colorScheme.outline.copy(alpha = 0.5f))
                    ProfileInfoRow(label = "Password", value = "••••••••••••", icon = Icons.Default.Lock)
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Data Export Section
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = BrushIQShapes.large,
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                border = androidx.compose.foundation.BorderStroke(Dimensions.BorderWidth, MaterialTheme.colorScheme.outline)
            ) {
                Column(modifier = Modifier.padding(Dimensions.PaddingMedium)) {
                    Text(
                        "DATA EXPORT",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Spacer(modifier = Modifier.height(12.dp))

                    DataExportRow(
                        label = "Export Scan History",
                        description = "Download all scan results as CSV",
                        icon = Icons.Default.History,
                        onClick = { /* Mock export */ }
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    DataExportRow(
                        label = "Export Family Data",
                        description = "Download family member information",
                        icon = Icons.Default.Group,
                        onClick = { /* Mock export */ }
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    DataExportRow(
                        label = "Export Toothbrush Data",
                        description = "Download toothbrush inventory data",
                        icon = Icons.Default.CleaningServices,
                        onClick = { /* Mock export */ }
                    )
                }
            }

            Spacer(modifier = Modifier.height(32.dp))

            // Sign Out Button
            TextButton(
                onClick = { showLogoutDialog = true },
                colors = ButtonDefaults.textButtonColors(contentColor = Error)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.ExitToApp, contentDescription = null)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("SIGN OUT", style = MaterialTheme.typography.labelMedium)
                }
            }

            Spacer(modifier = Modifier.height(80.dp))
        }
    }

    // Logout Confirmation Dialog
    if (showLogoutDialog) {
        AlertDialog(
            onDismissRequest = { showLogoutDialog = false },
            title = {
                Text("Sign Out", style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold))
            },
            text = {
                Text("Are you sure you want to sign out of BrushIQ? You will need to log in again to access your data.")
            },
            confirmButton = {
                TextButton(
                    onClick = {
                        showLogoutDialog = false
                        viewModel?.logout {
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
fun AchievementStat(
    label: String,
    value: String,
    icon: ImageVector,
    iconColor: Color,
    modifier: Modifier = Modifier
) {
    Surface(
        modifier = modifier,
        color = iconColor.copy(alpha = 0.06f),
        shape = BrushIQShapes.medium
    ) {
        Column(
            modifier = Modifier.padding(12.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Surface(
                modifier = Modifier.size(36.dp),
                color = iconColor.copy(alpha = 0.12f),
                shape = CircleShape
            ) {
                Icon(icon, contentDescription = null, modifier = Modifier.padding(8.dp), tint = iconColor)
            }
            Spacer(modifier = Modifier.height(8.dp))
            Text(value, style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Black))
            Text(
                label,
                style = TextStyle(fontSize = 9.sp, fontWeight = FontWeight.Bold),
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

@Composable
fun DataExportRow(
    label: String,
    description: String,
    icon: ImageVector,
    onClick: () -> Unit
) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        color = MaterialTheme.colorScheme.background,
        shape = BrushIQShapes.medium,
        onClick = onClick
    ) {
        Row(
            modifier = Modifier.padding(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Surface(
                modifier = Modifier.size(36.dp),
                color = PrimaryAlpha10,
                shape = BrushIQShapes.small
            ) {
                Icon(icon, contentDescription = null, modifier = Modifier.padding(8.dp), tint = PrimaryMain)
            }
            Spacer(modifier = Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(label, style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold))
                Text(description, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            Icon(Icons.Default.Download, contentDescription = null, modifier = Modifier.size(18.dp), tint = PrimaryMain)
        }
    }
}

@Composable
fun ProfileStatItem(label: String, value: String, icon: ImageVector, modifier: Modifier = Modifier) {
    Card(
        modifier = modifier,
        shape = BrushIQShapes.medium,
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = androidx.compose.foundation.BorderStroke(Dimensions.BorderWidth, MaterialTheme.colorScheme.outline)
    ) {
        Column(
            modifier = Modifier.padding(12.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Icon(icon, contentDescription = null, modifier = Modifier.size(20.dp), tint = PrimaryMain)
            Spacer(modifier = Modifier.height(4.dp))
            Text(value, style = MaterialTheme.typography.titleMedium)
            Text(label, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}

@Composable
fun ProfileInfoRow(label: String, value: String, icon: ImageVector) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Icon(icon, contentDescription = null, modifier = Modifier.size(18.dp), tint = PrimaryMain)
        Spacer(modifier = Modifier.width(16.dp))
        Column {
            Text(label, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            Text(value, style = MaterialTheme.typography.bodyLarge)
        }
    }
}

@Preview(showBackground = true)
@Composable
fun PreviewProfileScreen() {
    BrushIQTheme {
        ProfileScreen(navController = rememberNavController())
    }
}
