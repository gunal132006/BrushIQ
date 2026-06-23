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
fun TermsConditionsScreen(
    navController: NavController
) {
    val scrollState = rememberScrollState()

    Scaffold(
        topBar = {
            AppHeader(
                title = "Terms & Conditions",
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
                    Icon(Icons.Default.Description, contentDescription = null, modifier = Modifier.size(24.dp), tint = PrimaryMain)
                    Spacer(modifier = Modifier.width(12.dp))
                    Column {
                        Text("Terms & Conditions", style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold))
                        Text("Effective: June 15, 2026", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Medical Disclaimer Banner
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = BrushIQShapes.large,
                colors = CardDefaults.cardColors(containerColor = WarningAlpha10),
                border = androidx.compose.foundation.BorderStroke(Dimensions.BorderWidth, Warning.copy(alpha = 0.3f))
            ) {
                Row(
                    modifier = Modifier.padding(Dimensions.PaddingMedium),
                    verticalAlignment = Alignment.Top
                ) {
                    Icon(Icons.Default.Warning, contentDescription = null, modifier = Modifier.size(20.dp), tint = Warning)
                    Spacer(modifier = Modifier.width(12.dp))
                    Column {
                        Text("Medical Disclaimer", style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold), color = Warning)
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            "BrushIQ provides informational oral care guidance and is not a substitute for professional dental advice. " +
                                    "Always consult a qualified dental professional for diagnosis and treatment of oral health conditions.",
                            style = MaterialTheme.typography.bodySmall,
                            lineHeight = 20.sp,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            Text(
                "By using BrushIQ, you agree to the following terms and conditions. Please read them carefully.",
                style = MaterialTheme.typography.bodyMedium,
                lineHeight = 22.sp,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )

            Spacer(modifier = Modifier.height(24.dp))

            // Section 1: Acceptance of Terms
            TermsSection(
                icon = Icons.Default.CheckCircle,
                title = "1. Acceptance of Terms",
                content = "By downloading, installing, or using BrushIQ, you agree to be bound by these Terms & Conditions. " +
                        "If you do not agree, please do not use the application.\n\n" +
                        "These terms apply to all users, including family members whose data is managed through the app."
            )

            // Section 2: Description of Service
            TermsSection(
                icon = Icons.Default.AppSettingsAlt,
                title = "2. Description of Service",
                content = "BrushIQ is an AI-powered mobile application that:\n\n" +
                        "• Analyzes toothbrush bristle wear using computer vision and machine learning.\n\n" +
                        "• Provides health scores and condition assessments for toothbrushes.\n\n" +
                        "• Offers oral care tips and personalized recommendations.\n\n" +
                        "• Allows family-wide toothbrush management and tracking.\n\n" +
                        "The accuracy of AI analysis depends on image quality, lighting conditions, and toothbrush model."
            )

            // Section 3: User Responsibilities
            TermsSection(
                icon = Icons.Default.Person,
                title = "3. User Responsibilities",
                content = "As a user of BrushIQ, you agree to:\n\n" +
                        "• Provide accurate account information during registration.\n\n" +
                        "• Maintain the confidentiality of your account credentials.\n\n" +
                        "• Use the app only for its intended purpose of oral care monitoring.\n\n" +
                        "• Not attempt to reverse-engineer, modify, or distribute the application.\n\n" +
                        "• Report any security vulnerabilities or unauthorized access immediately."
            )

            // Section 4: Intellectual Property
            TermsSection(
                icon = Icons.Default.Copyright,
                title = "4. Intellectual Property",
                content = "All content, AI models, algorithms, designs, logos, and trademarks within BrushIQ are the intellectual property of BrushIQ and its licensors.\n\n" +
                        "• You may not copy, reproduce, or distribute any part of the application.\n\n" +
                        "• User-generated data (scan images, family data) remains your property.\n\n" +
                        "• BrushIQ retains a license to use anonymized data for AI model improvement."
            )

            // Section 5: Limitation of Liability
            TermsSection(
                icon = Icons.Default.Shield,
                title = "5. Limitation of Liability",
                content = "BrushIQ is provided \"as is\" without warranties of any kind.\n\n" +
                        "• BrushIQ is not liable for any decisions made based on AI analysis results.\n\n" +
                        "• We do not guarantee the accuracy of bristle wear assessments.\n\n" +
                        "• Maximum liability is limited to the amount paid for the service.\n\n" +
                        "• BrushIQ is not responsible for device damage from app usage."
            )

            // Section 6: Termination
            TermsSection(
                icon = Icons.Default.Block,
                title = "6. Termination",
                content = "We reserve the right to suspend or terminate your account if:\n\n" +
                        "• You violate these Terms & Conditions.\n\n" +
                        "• You engage in fraudulent or abusive behavior.\n\n" +
                        "• We discontinue the service with reasonable notice.\n\n" +
                        "Upon termination, your data will be handled according to our Privacy Policy."
            )

            // Section 7: Changes to Terms
            TermsSection(
                icon = Icons.Default.Update,
                title = "7. Changes to Terms",
                content = "BrushIQ reserves the right to update these Terms & Conditions at any time. " +
                        "We will notify you of significant changes via email or in-app notification. " +
                        "Continued use after changes constitutes acceptance of the updated terms."
            )

            // Section 8: Contact
            TermsSection(
                icon = Icons.Default.ContactMail,
                title = "8. Contact",
                content = "For questions about these Terms & Conditions:\n\n" +
                        "• Email: legal@brushiq.com\n\n" +
                        "• Support: support@brushiq.com\n\n" +
                        "• Website: https://www.brushiq.com/terms"
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
fun TermsSection(
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
fun PreviewTermsConditionsScreen() {
    BrushIQTheme {
        TermsConditionsScreen(navController = rememberNavController())
    }
}
