package com.brushiq.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.DeleteOutline
import androidx.compose.material.icons.filled.Group
import androidx.compose.material.icons.filled.Info
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import androidx.navigation.compose.rememberNavController
import com.brushiq.domain.repository.FamilyMember
import com.brushiq.ui.components.*
import com.brushiq.ui.theme.*
import com.brushiq.ui.viewmodel.BrushIQViewModel
import kotlinx.coroutines.flow.MutableStateFlow

@Composable
fun FamilyScreen(
    navController: NavController,
    viewModel: BrushIQViewModel? = null
) {
    val familyMembers by (viewModel?.familyMembers ?: MutableStateFlow(emptyList())).collectAsState()
    val loading by (viewModel?.loading ?: MutableStateFlow(false)).collectAsState()

    var memberToDelete by remember { mutableStateOf<FamilyMember?>(null) }

    LaunchedEffect(Unit) {
        viewModel?.syncAllData()
    }

    Scaffold(
        topBar = {
            AppHeader(
                title = "Family Profiles",
                actions = {
                    if (familyMembers.isNotEmpty()) {
                        IconButton(onClick = { navController.navigate("add_member") }) {
                            Icon(Icons.Default.Add, contentDescription = "Add Member", tint = PrimaryMain)
                        }
                    }
                }
            )
        },
        floatingActionButton = {
            if (familyMembers.isNotEmpty()) {
                FloatingActionButton(
                    onClick = { navController.navigate("add_member") },
                    containerColor = PrimaryMain,
                    contentColor = Color.White,
                    shape = BrushIQShapes.large
                ) {
                    Icon(Icons.Default.Add, contentDescription = "Add Member")
                }
            }
        }
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .background(MaterialTheme.colorScheme.background)
        ) {
            when {
                loading && familyMembers.isEmpty() -> {
                    LoadingScreen("Fetching family clinical profiles...")
                }
                familyMembers.isEmpty() -> {
                    FamilyEmptyState(
                        onAddClick = { navController.navigate("add_member") }
                    )
                }
                else -> {
                    LazyColumn(
                        modifier = Modifier.fillMaxSize(),
                        contentPadding = PaddingValues(16.dp),
                        verticalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        item {
                            Text(
                                text = "Track dental hygiene diagnostic histories and manage toothbrush wear levels for each family member.",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                modifier = Modifier.padding(bottom = 4.dp)
                            )
                        }

                        items(familyMembers) { member ->
                            FamilyMemberCard(
                                name = member.name,
                                relationship = member.relationship,
                                age = member.age,
                                gender = member.gender,
                                healthScore = member.healthScore?.toInt(),
                                toothbrushName = member.toothbrushBrand?.let { "$it ${member.toothbrushModel}" },
                                profilePhotoUrl = member.profilePhotoUrl,
                                onClick = { navController.navigate("member_dossier/${member.id}") },
                                onEdit = { navController.navigate("edit_member/${member.id}") },
                                onDelete = { memberToDelete = member }
                            )
                        }

                        item { Spacer(modifier = Modifier.height(80.dp)) }
                    }
                }
            }

            // Delete Confirmation Alert Dialog
            if (memberToDelete != null) {
                AlertDialog(
                    onDismissRequest = { memberToDelete = null },
                    icon = { Icon(Icons.Default.DeleteOutline, contentDescription = null, tint = Error) },
                    title = { Text("Delete Family Profile?") },
                    text = {
                        Text(
                            text = "This will remove all toothbrushes, scans, reminders, and history associated with ${memberToDelete?.name}.",
                            style = MaterialTheme.typography.bodyMedium
                        )
                    },
                    confirmButton = {
                        Button(
                            onClick = {
                                memberToDelete?.let {
                                    viewModel?.deleteFamilyMember(it.id)
                                }
                                memberToDelete = null
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = Error)
                        ) {
                            Text("Delete Profile", color = Color.White)
                        }
                    },
                    dismissButton = {
                        TextButton(onClick = { memberToDelete = null }) {
                            Text("Cancel", color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                    },
                    shape = BrushIQShapes.large
                )
            }
        }
    }
}

@Composable
fun FamilyEmptyState(
    onAddClick: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        // High fidelity illustration mockup inside a card
        Box(
            modifier = Modifier
                .size(110.dp)
                .background(PrimaryMain.copy(alpha = 0.08f), CircleShape),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = Icons.Default.Group,
                contentDescription = null,
                tint = PrimaryMain,
                modifier = Modifier.size(54.dp)
            )
        }

        Spacer(modifier = Modifier.height(24.dp))

        Text(
            text = "Create Family Circle",
            style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold),
            color = MaterialTheme.colorScheme.onSurface,
            textAlign = TextAlign.Center
        )

        Spacer(modifier = Modifier.height(12.dp))

        Text(
            text = "Add profiles for your children, spouse, or parents to track their toothbrush bristle health and oral hygiene schedules together.",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center,
            modifier = Modifier.padding(horizontal = 16.dp)
        )

        Spacer(modifier = Modifier.height(36.dp))

        PrimaryButton(
            text = "Add First Member",
            onClick = onAddClick,
            modifier = Modifier.fillMaxWidth(0.8f)
        )
    }
}
