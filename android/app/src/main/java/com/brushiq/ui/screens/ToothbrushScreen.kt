package com.brushiq.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.DeleteOutline
import androidx.compose.material.icons.filled.Info
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.navigation.NavController
import androidx.navigation.compose.rememberNavController
import com.brushiq.domain.repository.FamilyMember
import com.brushiq.domain.repository.Toothbrush
import com.brushiq.ui.components.*
import com.brushiq.ui.theme.*
import com.brushiq.ui.viewmodel.BrushIQViewModel
import kotlinx.coroutines.flow.MutableStateFlow

@Composable
fun ToothbrushScreen(
    navController: NavController,
    viewModel: BrushIQViewModel? = null
) {
    val toothbrushes by (viewModel?.toothbrushes ?: MutableStateFlow(emptyList())).collectAsState()
    val familyMembers by (viewModel?.familyMembers ?: MutableStateFlow(emptyList())).collectAsState()
    val loading by (viewModel?.loading ?: MutableStateFlow(false)).collectAsState()
    val isOnline by (viewModel?.isOnline ?: MutableStateFlow(true)).collectAsState()

    var showAddDialog by remember { mutableStateOf(false) }
    var toothbrushToEdit by remember { mutableStateOf<Toothbrush?>(null) }
    var toothbrushToDelete by remember { mutableStateOf<Toothbrush?>(null) }

    LaunchedEffect(Unit) {
        viewModel?.syncToothbrushes()
    }

    Scaffold(
        topBar = {
            AppHeader(
                title = "My Toothbrushes",
                actions = {
                    IconButton(onClick = { showAddDialog = true; toothbrushToEdit = null; toothbrushToDelete = null }) {
                        Icon(Icons.Default.Add, contentDescription = "Add Toothbrush", tint = PrimaryMain)
                    }
                }
            )
        },
        floatingActionButton = {
            FloatingActionButton(
                onClick = { showAddDialog = true; toothbrushToEdit = null; toothbrushToDelete = null },
                containerColor = PrimaryMain,
                contentColor = Color.White,
                shape = BrushIQShapes.large
            ) {
                Icon(Icons.Default.Add, contentDescription = "Add Toothbrush")
            }
        }
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
            if (loading && toothbrushes.isEmpty() && isOnline) {
                LoadingScreen("Fetching registered toothbrushes...")
            } else if (toothbrushes.isEmpty()) {
                EmptyState(
                    icon = Icons.Default.Info,
                    title = "No Brushes Found",
                    description = "Register your clinical cleaning tools to start analyzing their bristle wear index.",
                    action = {
                        PrimaryButton(text = "Add Toothbrush", onClick = { showAddDialog = true }, modifier = Modifier.width(200.dp))
                    }
                )
            } else {
                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(MaterialTheme.colorScheme.background),
                    contentPadding = PaddingValues(Dimensions.PaddingMedium),
                    verticalArrangement = Arrangement.spacedBy(Dimensions.PaddingMedium)
                ) {
                    items(toothbrushes) { brush ->
                        BrushCard(
                            brand = brush.brand,
                            model = brush.model,
                            type = brush.type,
                            memberName = brush.memberName ?: "Unknown",
                            color = brush.color,
                            purchaseDate = brush.purchaseDate,
                            onEdit = { toothbrushToEdit = brush; showAddDialog = false; toothbrushToDelete = null },
                            onDelete = { toothbrushToDelete = brush; showAddDialog = false; toothbrushToEdit = null }
                        )
                    }
                    item { Spacer(modifier = Modifier.height(80.dp)) }
                }
            }
        }

        // Add Toothbrush Dialog
        if (showAddDialog && toothbrushToEdit == null && toothbrushToDelete == null) {
            AddEditToothbrushDialog(
                initialToothbrush = null,
                familyMembers = familyMembers,
                onDismiss = { showAddDialog = false },
                onSave = { familyMemberId, brand, model, color, type, purchaseDate ->
                    viewModel?.addToothbrush(familyMemberId, brand, model, color, type, purchaseDate)
                    showAddDialog = false
                }
            )
        }

        // Edit Toothbrush Dialog
        if (toothbrushToEdit != null && !showAddDialog && toothbrushToDelete == null) {
            val brush = toothbrushToEdit!!
            AddEditToothbrushDialog(
                initialToothbrush = brush,
                familyMembers = familyMembers,
                onDismiss = { toothbrushToEdit = null },
                onSave = { _, brand, model, color, type, purchaseDate ->
                    viewModel?.updateToothbrush(brush.id, brand, model, color, type, purchaseDate)
                    toothbrushToEdit = null
                }
            )
        }

        // Delete Confirmation Dialog
        if (toothbrushToDelete != null && !showAddDialog && toothbrushToEdit == null) {
            val brush = toothbrushToDelete!!
            AlertDialog(
                onDismissRequest = { toothbrushToDelete = null },
                icon = { Icon(Icons.Default.DeleteOutline, contentDescription = null, tint = Error) },
                title = { Text("Delete Toothbrush?") },
                text = {
                    Text(
                        text = "Are you sure you want to delete ${brush.brand} ${brush.model}? This action cannot be undone.",
                        style = MaterialTheme.typography.bodyMedium
                    )
                },
                confirmButton = {
                    Button(
                        onClick = {
                            viewModel?.deleteToothbrush(brush.id)
                            toothbrushToDelete = null
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = Error)
                    ) {
                        Text("Delete", color = Color.White)
                    }
                },
                dismissButton = {
                    TextButton(onClick = { toothbrushToDelete = null }) {
                        Text("Cancel", color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                }
            )
        }
    }
}

@Composable
fun AddEditToothbrushDialog(
    initialToothbrush: Toothbrush?,
    familyMembers: List<FamilyMember>,
    onDismiss: () -> Unit,
    onSave: (familyMemberId: String, brand: String, model: String, color: String, type: String, purchaseDate: String) -> Unit
) {
    var brand by remember(initialToothbrush) { mutableStateOf(initialToothbrush?.brand ?: "") }
    var model by remember(initialToothbrush) { mutableStateOf(initialToothbrush?.model ?: "") }
    var color by remember(initialToothbrush) { mutableStateOf(initialToothbrush?.color ?: "#1565D8") }
    var selectedType by remember(initialToothbrush) { mutableStateOf(initialToothbrush?.type ?: "Electric") }
    var purchaseDate by remember(initialToothbrush) { mutableStateOf(initialToothbrush?.purchaseDate ?: "2026-08-14") }

    var selectedMemberId by remember(initialToothbrush) {
        mutableStateOf(
            initialToothbrush?.familyMemberId
                ?: familyMembers.firstOrNull()?.id
                ?: "1"
        )
    }

    Dialog(onDismissRequest = onDismiss) {
        Card(
            shape = BrushIQShapes.large,
            modifier = Modifier
                .fillMaxWidth()
                .padding(8.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
        ) {
            Column(
                modifier = Modifier.padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Text(
                    text = if (initialToothbrush == null) "Add Toothbrush" else "Edit Toothbrush",
                    style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold)
                )

                if (initialToothbrush == null && familyMembers.isNotEmpty()) {
                    Column {
                        Text(
                            text = "ASSIGN TO MEMBER",
                            style = TextStyle(fontSize = 10.sp, fontWeight = FontWeight.Bold),
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Spacer(modifier = Modifier.height(6.dp))
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(MaterialTheme.colorScheme.background, RoundedCornerShape(8.dp))
                                .padding(3.dp),
                            horizontalArrangement = Arrangement.spacedBy(4.dp)
                        ) {
                            familyMembers.forEach { member ->
                                val active = selectedMemberId == member.id
                                Box(
                                    modifier = Modifier
                                        .weight(1f)
                                        .clip(RoundedCornerShape(6.dp))
                                        .background(if (active) PrimaryMain else Color.Transparent)
                                        .clickable { selectedMemberId = member.id }
                                        .padding(vertical = 8.dp),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        text = member.name,
                                        color = if (active) Color.White else MaterialTheme.colorScheme.onSurfaceVariant,
                                        style = TextStyle(fontSize = 10.sp, fontWeight = FontWeight.Bold)
                                    )
                                }
                            }
                        }
                    }
                }

                OutlinedTextField(
                    value = brand,
                    onValueChange = { brand = it },
                    label = { Text("Brand (e.g. Oral-B, Philips)") },
                    modifier = Modifier.fillMaxWidth(),
                    shape = BrushIQShapes.medium
                )

                OutlinedTextField(
                    value = model,
                    onValueChange = { model = it },
                    label = { Text("Model (e.g. iO Series 9, Sonicare)") },
                    modifier = Modifier.fillMaxWidth(),
                    shape = BrushIQShapes.medium
                )

                OutlinedTextField(
                    value = color,
                    onValueChange = { color = it },
                    label = { Text("Color Code (e.g. #FFFFFF)") },
                    modifier = Modifier.fillMaxWidth(),
                    shape = BrushIQShapes.medium
                )

                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(MaterialTheme.colorScheme.background, RoundedCornerShape(8.dp))
                        .padding(3.dp),
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    listOf("Electric", "Manual").forEach { t ->
                        val active = selectedType.equals(t, ignoreCase = true)
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .clip(RoundedCornerShape(6.dp))
                                .background(if (active) PrimaryMain else Color.Transparent)
                                .clickable { selectedType = t }
                                .padding(vertical = 8.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = t,
                                color = if (active) Color.White else MaterialTheme.colorScheme.onSurfaceVariant,
                                style = TextStyle(fontSize = 10.sp, fontWeight = FontWeight.Bold)
                            )
                        }
                    }
                }

                OutlinedTextField(
                    value = purchaseDate,
                    onValueChange = { purchaseDate = it },
                    label = { Text("Purchase Date (YYYY-MM-DD)") },
                    modifier = Modifier.fillMaxWidth(),
                    shape = BrushIQShapes.medium,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number)
                )

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.End,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    TextButton(onClick = onDismiss) {
                        Text("Cancel", color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                    Spacer(modifier = Modifier.width(8.dp))
                    Button(
                        onClick = {
                            if (brand.isNotBlank() && model.isNotBlank()) {
                                onSave(selectedMemberId, brand, model, color, selectedType, purchaseDate)
                            }
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = PrimaryMain)
                    ) {
                        Text(if (initialToothbrush == null) "Save Brush" else "Save Changes", color = Color.White)
                    }
                }
            }
        }
    }
}

@Preview(showBackground = true)
@Composable
fun PreviewToothbrushScreen() {
    BrushIQTheme {
        ToothbrushScreen(navController = rememberNavController())
    }
}
