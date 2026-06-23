package com.brushiq.ui.screens

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavController
import androidx.navigation.compose.rememberNavController
import com.brushiq.ui.components.*
import com.brushiq.ui.theme.*
import com.brushiq.ui.viewmodel.BrushIQViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddEditMemberScreen(
    memberId: String? = null,
    navController: NavController,
    viewModel: BrushIQViewModel = hiltViewModel()
) {
    val isEdit = memberId != null
    val scrollState = rememberScrollState()
    val context = LocalContext.current

    val familyMembers by viewModel.familyMembers.collectAsState()

    var name by remember { mutableStateOf("") }
    var relationship by remember { mutableStateOf("Child") }
    var age by remember { mutableStateOf("") }
    var gender by remember { mutableStateOf("Male") }

    // Dropdown States
    var relMenuExpanded by remember { mutableStateOf(false) }
    var genMenuExpanded by remember { mutableStateOf(false) }

    val relationshipsList = listOf("Dad", "Mom", "Spouse", "Child", "Sibling", "Grandparent", "Other")
    val gendersList = listOf("Male", "Female", "Other")

    // Load data if editing
    LaunchedEffect(memberId, familyMembers) {
        if (isEdit && memberId != null) {
            val member = familyMembers.find { it.id == memberId }
            if (member != null) {
                name = member.name
                relationship = member.relationship
                age = member.age.toString()
                gender = member.gender
            }
        }
    }

    Scaffold(
        topBar = {
            AppHeader(
                title = if (isEdit) "Edit Clinical Profile" else "Add Family Profile",
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = MaterialTheme.colorScheme.onSurface)
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
            verticalArrangement = Arrangement.spacedBy(20.dp)
        ) {
            // Profile photo placeholder
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 12.dp),
                contentAlignment = Alignment.Center
            ) {
                Box(
                    modifier = Modifier
                        .size(96.dp)
                        .clip(CircleShape)
                        .background(PrimaryAlpha10),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.CameraAlt,
                        contentDescription = "Change photo placeholder",
                        tint = PrimaryMain,
                        modifier = Modifier.size(32.dp)
                    )
                }
            }

            // Input Fields
            Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                // Name Input
                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("Profile Name") },
                    placeholder = { Text("e.g. Sarah Jennings") },
                    modifier = Modifier.fillMaxWidth(),
                    shape = BrushIQShapes.medium,
                    singleLine = true
                )

                // Relationship Dropdown
                ExposedDropdownMenuBox(
                    expanded = relMenuExpanded,
                    onExpandedChange = { relMenuExpanded = !relMenuExpanded }
                ) {
                    OutlinedTextField(
                        value = relationship,
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("Relationship to Primary Account") },
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = relMenuExpanded) },
                        modifier = Modifier
                            .fillMaxWidth()
                            .menuAnchor(),
                        shape = BrushIQShapes.medium
                    )
                    ExposedDropdownMenu(
                        expanded = relMenuExpanded,
                        onDismissRequest = { relMenuExpanded = false }
                    ) {
                        relationshipsList.forEach { option ->
                            DropdownMenuItem(
                                text = { Text(option) },
                                onClick = {
                                    relationship = option
                                    relMenuExpanded = false
                                }
                            )
                        }
                    }
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    // Age Input
                    OutlinedTextField(
                        value = age,
                        onValueChange = { age = it },
                        label = { Text("Age (Years)") },
                        modifier = Modifier.weight(1f),
                        shape = BrushIQShapes.medium,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        singleLine = true
                    )

                    // Gender Dropdown
                    ExposedDropdownMenuBox(
                        expanded = genMenuExpanded,
                        onExpandedChange = { genMenuExpanded = !genMenuExpanded },
                        modifier = Modifier.weight(1f)
                    ) {
                        OutlinedTextField(
                            value = gender,
                            onValueChange = {},
                            readOnly = true,
                            label = { Text("Gender") },
                            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = genMenuExpanded) },
                            modifier = Modifier
                                .fillMaxWidth()
                                .menuAnchor(),
                            shape = BrushIQShapes.medium
                        )
                        ExposedDropdownMenu(
                            expanded = genMenuExpanded,
                            onDismissRequest = { genMenuExpanded = false }
                        ) {
                            gendersList.forEach { option ->
                                DropdownMenuItem(
                                    text = { Text(option) },
                                    onClick = {
                                        gender = option
                                        genMenuExpanded = false
                                    }
                                )
                            }
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(32.dp))

            // CTA Submit Button
            PrimaryButton(
                text = if (isEdit) "Update Profile" else "Create Profile",
                onClick = {
                    val ageVal = age.toIntOrNull()
                    if (name.isBlank()) {
                        Toast.makeText(context, "Please enter a profile name.", Toast.LENGTH_SHORT).show()
                    } else if (ageVal == null || ageVal <= 0 || ageVal > 125) {
                        Toast.makeText(context, "Please enter a valid age.", Toast.LENGTH_SHORT).show()
                    } else {
                        if (isEdit && memberId != null) {
                            viewModel.updateFamilyMember(
                                id = memberId,
                                name = name.trim(),
                                age = ageVal,
                                gender = gender,
                                relationship = relationship,
                                profilePhotoUrl = null
                            )
                            Toast.makeText(context, "Clinical profile updated successfully!", Toast.LENGTH_SHORT).show()
                        } else {
                            viewModel.addFamilyMember(
                                name = name.trim(),
                                age = ageVal,
                                gender = gender,
                                relationship = relationship,
                                profilePhotoUrl = null
                            )
                            Toast.makeText(context, "Family profile created successfully!", Toast.LENGTH_SHORT).show()
                        }
                        navController.popBackStack()
                    }
                }
            )

            if (isEdit) {
                SecondaryButton(
                    text = "Go Back",
                    onClick = { navController.popBackStack() }
                )
            }
        }
    }
}
