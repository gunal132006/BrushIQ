package com.brushiq.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import androidx.navigation.compose.rememberNavController
import com.brushiq.ui.components.AppHeader
import com.brushiq.ui.theme.*

@Composable
fun PrivacyPolicyScreen(
    navController: NavController
) {
    val scrollState = rememberScrollState()

    Scaffold(
        topBar = {
            AppHeader(
                title = "Privacy Policy",
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
            // Header
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = BrushIQShapes.large,
                colors = CardDefaults.cardColors(containerColor = PrimaryAlpha10),
                border = androidx.compose.foundation.BorderStroke(Dimensions.BorderWidth, PrimaryMain.copy(alpha = 0.2f))
            ) {
                Row(
                    modifier = Modifier.padding(Dimensions.PaddingMedium),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(Icons.Default.PrivacyTip, contentDescription = null, modifier = Modifier.size(24.dp), tint = PrimaryMain)
                    Spacer(modifier = Modifier.width(12.dp))
                    Column {
                        Text("BrushIQ Privacy Policy", style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold))
                        Text("Last Updated: June 15, 2026", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            Text(
                "Your privacy is important to us. This Privacy Policy describes how BrushIQ collects, uses, stores, and protects your personal information.",
                style = MaterialTheme.typography.bodyMedium,
                lineHeight = 22.sp,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )

            Spacer(modifier = Modifier.height(24.dp))

            // Section 1: Data Collection
            PrivacySection(
                icon = Icons.Default.DataUsage,
                title = "1. Data Collection",
                content = "BrushIQ collects the following types of information:\n\n" +
                        "• Account Information: Name, email address, phone number, and password (encrypted) when you create an account.\n\n" +
                        "• Scan Data: Images of toothbrush bristles captured through the app's camera feature for AI analysis.\n\n" +
                        "• Usage Data: App interaction patterns, feature usage statistics, and diagnostic logs.\n\n" +
                        "• Device Information: Device model, operating system version, and unique device identifiers.\n\n" +
                        "• Family Data: Family member names, ages, gender, and relationship information you voluntarily provide."
            )

            // Section 2: Image Storage
            PrivacySection(
                icon = Icons.Default.Photo,
                title = "2. Image Storage",
                content = "Toothbrush images captured during scans are:\n\n" +
                        "• Processed using our AI engine to generate bristle wear analysis results.\n\n" +
                        "• Stored securely on our servers with industry-standard encryption (AES-256).\n\n" +
                        "• Used solely for providing scan results and improving our AI models.\n\n" +
                        "• Never shared with third parties for advertising or unrelated purposes.\n\n" +
                        "• Retained for the duration of your account unless you request deletion."
            )

            // Section 3: User Rights
            PrivacySection(
                icon = Icons.Default.Security,
                title = "3. User Rights",
                content = "You have the following rights regarding your personal data:\n\n" +
                        "• Access: Request a copy of all data we hold about you.\n\n" +
                        "• Correction: Request correction of inaccurate personal information.\n\n" +
                        "• Deletion: Request permanent deletion of your data at any time.\n\n" +
                        "• Export: Download your scan history, family data, and toothbrush records.\n\n" +
                        "• Opt-Out: Disable non-essential data collection features through Settings.\n\n" +
                        "• Portability: Receive your data in a structured, machine-readable format."
            )

            // Section 4: Account Deletion
            PrivacySection(
                icon = Icons.Default.DeleteForever,
                title = "4. Account Deletion",
                content = "You may delete your BrushIQ account at any time:\n\n" +
                        "• Navigate to Profile > Settings > Account > Delete Account.\n\n" +
                        "• Upon deletion, all personal data, scan history, family member data, and toothbrush records will be permanently removed from our servers within 30 days.\n\n" +
                        "• This action is irreversible and cannot be undone.\n\n" +
                        "• Anonymized, aggregated data used to improve our AI models may be retained."
            )

            // Section 5: Contact Information
            PrivacySection(
                icon = Icons.Default.ContactMail,
                title = "5. Contact Information",
                content = "For questions about this Privacy Policy or to exercise your data rights:\n\n" +
                        "• Email: privacy@brushiq.com\n\n" +
                        "• Support: support@brushiq.com\n\n" +
                        "• Website: https://www.brushiq.com/privacy\n\n" +
                        "We aim to respond to all inquiries within 48 hours."
            )

            Spacer(modifier = Modifier.height(24.dp))

            Text(
                "© 2026 BrushIQ. All rights reserved.",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.fillMaxWidth(),
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(80.dp))
        }
    }
}

@Composable
fun PrivacySection(
    icon: ImageVector,
    title: String,
    content: String
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(bottom = 16.dp),
        shape = BrushIQShapes.large,
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = androidx.compose.foundation.BorderStroke(Dimensions.BorderWidth, MaterialTheme.colorScheme.outline)
    ) {
        Column(modifier = Modifier.padding(Dimensions.PaddingMedium)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Surface(
                    modifier = Modifier.size(32.dp),
                    color = PrimaryAlpha10,
                    shape = CircleShape
                ) {
                    Icon(icon, contentDescription = null, modifier = Modifier.padding(6.dp), tint = PrimaryMain)
                }
                Spacer(modifier = Modifier.width(12.dp))
                Text(title, style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold))
            }
            Spacer(modifier = Modifier.height(12.dp))
            Text(
                content,
                style = MaterialTheme.typography.bodyMedium,
                lineHeight = 22.sp,
                color = MaterialTheme.colorScheme.onSurface
            )
        }
    }
}

@Preview(showBackground = true)
@Composable
fun PreviewPrivacyPolicyScreen() {
    BrushIQTheme {
        PrivacyPolicyScreen(navController = rememberNavController())
    }
}
