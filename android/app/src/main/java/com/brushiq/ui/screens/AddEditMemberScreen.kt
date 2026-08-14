package com.brushiq.ui.screens

import android.Manifest
import android.content.pm.PackageManager
import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import androidx.core.content.FileProvider
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavController
import coil.compose.AsyncImage
import com.brushiq.ui.components.*
import com.brushiq.ui.theme.*
import com.brushiq.ui.viewmodel.BrushIQViewModel
import java.io.File

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

    // Profile photo states
    var photoUri by remember { mutableStateOf<Uri?>(null) }
    var currentPhotoUrl by remember { mutableStateOf<String?>(null) }
    var showSourceDialog by remember { mutableStateOf(false) }
    var tempCameraUri by remember { mutableStateOf<Uri?>(null) }

    // Dropdown States
    var relMenuExpanded by remember { mutableStateOf(false) }
    var genMenuExpanded by remember { mutableStateOf(false) }

    val relationshipsList = listOf("Dad", "Mom", "Spouse", "Child", "Sibling", "Grandparent", "Other")
    val gendersList = listOf("Male", "Female", "Other")

    // Activity Launchers for Photo Picker & Camera
    val galleryLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.PickVisualMedia()
    ) { uri: Uri? ->
        if (uri != null) {
            photoUri = uri
        }
    }

    val takePictureLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.TakePicture()
    ) { success ->
        if (success && tempCameraUri != null) {
            photoUri = tempCameraUri
        }
    }

    fun launchCamera() {
        try {
            val tempFile = File.createTempFile("profile_capture_", ".jpg", context.cacheDir).apply {
                createNewFile()
            }
            val uri = FileProvider.getUriForFile(
                context,
                "${context.packageName}.fileprovider",
                tempFile
            )
            tempCameraUri = uri
            takePictureLauncher.launch(uri)
        } catch (e: Exception) {
            e.printStackTrace()
            com.brushiq.util.UiNotificationManager.showWarning("Camera Error", "Unable to open camera.")
        }
    }

    val cameraPermissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        if (isGranted) {
            launchCamera()
        } else {
            com.brushiq.util.UiNotificationManager.showWarning(
                "Permission Denied",
                "Camera permission is required to capture a photo."
            )
        }
    }

    fun checkAndLaunchCamera() {
        val permissionCheck = ContextCompat.checkSelfPermission(context, Manifest.permission.CAMERA)
        if (permissionCheck == PackageManager.PERMISSION_GRANTED) {
            launchCamera()
        } else {
            cameraPermissionLauncher.launch(Manifest.permission.CAMERA)
        }
    }

    // Helper to persist Uri locally
    fun saveUriToLocalFile(uri: Uri): String? {
        return try {
            val inputStream = context.contentResolver.openInputStream(uri) ?: return null
            val file = File(context.filesDir, "profile_${System.currentTimeMillis()}.jpg")
            file.outputStream().use { output ->
                inputStream.copyTo(output)
            }
            file.absolutePath
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }

    // Load data if editing
    LaunchedEffect(memberId, familyMembers) {
        if (isEdit && memberId != null) {
            val member = familyMembers.find { it.id == memberId }
            if (member != null) {
                name = member.name
                relationship = member.relationship
                age = member.age.toString()
                gender = member.gender
                currentPhotoUrl = member.profilePhotoUrl
            }
        }
    }

    // Photo Source Choice Dialog
    if (showSourceDialog) {
        AlertDialog(
            onDismissRequest = { showSourceDialog = false },
            title = { Text("Profile Photo", fontWeight = FontWeight.Bold) },
            text = { Text("Select photo source for family profile") },
            confirmButton = {
                TextButton(
                    onClick = {
                        showSourceDialog = false
                        checkAndLaunchCamera()
                    }
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.PhotoCamera, contentDescription = null, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Take Photo")
                    }
                }
            },
            dismissButton = {
                Row {
                    TextButton(
                        onClick = {
                            showSourceDialog = false
                            galleryLauncher.launch(
                                PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly)
                            )
                        }
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.PhotoLibrary, contentDescription = null, modifier = Modifier.size(18.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Choose from Gallery")
                        }
                    }
                    TextButton(onClick = { showSourceDialog = false }) {
                        Text("Cancel")
                    }
                }
            }
        )
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
            // Profile photo picker avatar
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 12.dp),
                contentAlignment = Alignment.Center
            ) {
                Box(
                    modifier = Modifier
                        .size(96.dp)
                        .clickable { showSourceDialog = true }
                ) {
                    Box(
                        modifier = Modifier
                            .size(96.dp)
                            .clip(CircleShape)
                            .background(PrimaryAlpha10)
                            .border(2.dp, PrimaryMain.copy(alpha = 0.3f), CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        val displayPhoto = photoUri ?: currentPhotoUrl
                        if (displayPhoto != null) {
                            AsyncImage(
                                model = displayPhoto,
                                contentDescription = "Profile Photo",
                                contentScale = ContentScale.Crop,
                                modifier = Modifier.fillMaxSize()
                            )
                        } else {
                            Icon(
                                imageVector = Icons.Default.CameraAlt,
                                contentDescription = "Change photo placeholder",
                                tint = PrimaryMain,
                                modifier = Modifier.size(36.dp)
                            )
                        }
                    }

                    // Edit badge overlay
                    Surface(
                        modifier = Modifier
                            .size(30.dp)
                            .align(Alignment.BottomEnd),
                        shape = CircleShape,
                        color = PrimaryMain,
                        shadowElevation = 4.dp
                    ) {
                        Icon(
                            imageVector = if (photoUri != null || !currentPhotoUrl.isNullOrBlank()) Icons.Default.Edit else Icons.Default.Add,
                            contentDescription = "Edit photo",
                            tint = Color.White,
                            modifier = Modifier.padding(6.dp)
                        )
                    }
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
                        com.brushiq.util.UiNotificationManager.showWarning("Name Required", "Please enter a profile name.")
                    } else if (ageVal == null || ageVal <= 0 || ageVal > 125) {
                        com.brushiq.util.UiNotificationManager.showWarning("Invalid Age", "Please enter a valid age.")
                    } else {
                        val finalPhotoUrl = if (photoUri != null) {
                            saveUriToLocalFile(photoUri!!) ?: currentPhotoUrl
                        } else {
                            currentPhotoUrl
                        }

                        if (isEdit && memberId != null) {
                            viewModel.updateFamilyMember(
                                id = memberId,
                                name = name.trim(),
                                age = ageVal,
                                gender = gender,
                                relationship = relationship,
                                profilePhotoUrl = finalPhotoUrl
                            )
                            com.brushiq.util.UiNotificationManager.showSuccess("Profile Updated", "Clinical profile updated successfully!")
                        } else {
                            viewModel.addFamilyMember(
                                name = name.trim(),
                                age = ageVal,
                                gender = gender,
                                relationship = relationship,
                                profilePhotoUrl = finalPhotoUrl
                            )
                            com.brushiq.util.UiNotificationManager.showSuccess("Profile Created", "Family profile created successfully!")
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
