package com.brushiq.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Info
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.navigation.NavController
import androidx.navigation.compose.rememberNavController
import com.brushiq.ui.components.*
import com.brushiq.ui.theme.*
import com.brushiq.ui.viewmodel.BrushIQViewModel

@Composable
fun ReminderScreen(
    navController: NavController,
    viewModel: BrushIQViewModel? = null
) {
    // Mock Data
    val reminders = listOf(
        MockReminder("1", "Gunal S", "Oral-B Pro 1000", "Daily", "Morning clinical brushing session", "Today"),
        MockReminder("2", "Sarah J", "Philips Sonicare", "Daily", "Evening fluoride application", "Today"),
        MockReminder("3", "Junior", "Colgate Kids", "Weekly", "Deep clean & gum check", "Oct 25")
    )

    var selectedMember by remember { mutableStateOf("All") }
    val members = listOf("All", "Gunal S", "Sarah J", "Junior")

    Scaffold(
        topBar = {
            AppHeader(title = "Clinical Reminders")
        }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .background(MaterialTheme.colorScheme.background)
        ) {
            // Filter
            LazyRow(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(Dimensions.PaddingMedium),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(members) { member ->
                    FilterChip(
                        selected = selectedMember == member,
                        onClick = { selectedMember = member },
                        label = { Text(member) },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = PrimaryAlpha10,
                            selectedLabelColor = PrimaryMain
                        )
                    )
                }
            }

            if (reminders.isEmpty()) {
                EmptyState(
                    icon = Icons.Default.Info,
                    title = "No Active Reminders",
                    description = "Stay on top of your oral hygiene. Your scheduled clinical reminders will appear here."
                )
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(Dimensions.PaddingMedium),
                    verticalArrangement = Arrangement.spacedBy(Dimensions.PaddingMedium)
                ) {
                    items(reminders) { reminder ->
                        ReminderCard(
                            memberName = reminder.memberName,
                            brushBrand = reminder.brushBrand,
                            type = reminder.type,
                            message = reminder.message,
                            nextDate = reminder.nextDate,
                            onComplete = { /* Complete Logic */ }
                        )
                    }
                    item { Spacer(modifier = Modifier.height(80.dp)) }
                }
            }
        }
    }
}

data class MockReminder(
    val id: String,
    val memberName: String,
    val brushBrand: String,
    val type: String,
    val message: String,
    val nextDate: String
)

@Preview(showBackground = true)
@Composable
fun PreviewReminderScreen() {
    BrushIQTheme {
        ReminderScreen(navController = rememberNavController())
    }
}
