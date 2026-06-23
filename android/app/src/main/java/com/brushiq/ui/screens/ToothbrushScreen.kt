package com.brushiq.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Info
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.navigation.NavController
import androidx.navigation.compose.rememberNavController
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
    val loading by (viewModel?.loading ?: MutableStateFlow(false)).collectAsState()

    LaunchedEffect(Unit) {
        viewModel?.syncToothbrushes()
    }

    Scaffold(
        topBar = {
            AppHeader(
                title = "My Toothbrushes",
                actions = {
                    IconButton(onClick = { /* Add logic */ }) {
                        Icon(Icons.Default.Add, contentDescription = "Add Toothbrush", tint = PrimaryMain)
                    }
                }
            )
        },
        floatingActionButton = {
            FloatingActionButton(
                onClick = { /* Add logic */ },
                containerColor = PrimaryMain,
                contentColor = Color.White,
                shape = BrushIQShapes.large
            ) {
                Icon(Icons.Default.Add, contentDescription = "Add Toothbrush")
            }
        }
    ) { innerPadding ->
        if (loading && toothbrushes.isEmpty()) {
            LoadingScreen("Fetching registered toothbrushes...")
        } else if (toothbrushes.isEmpty()) {
            EmptyState(
                icon = Icons.Default.Info,
                title = "No Brushes Found",
                description = "Register your clinical cleaning tools to start analyzing their bristle wear index.",
                action = {
                    PrimaryButton(text = "Add Toothbrush", onClick = { }, modifier = Modifier.width(200.dp))
                }
            )
        } else {
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(innerPadding)
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
                        onEdit = { },
                        onDelete = { viewModel?.deleteToothbrush(brush.id) }
                    )
                }
                item { Spacer(modifier = Modifier.height(80.dp)) }
            }
        }
    }
}

data class MockBrush(
    val id: String,
    val brand: String,
    val model: String,
    val type: String,
    val memberName: String,
    val color: String,
    val purchaseDate: String
)

@Preview(showBackground = true)
@Composable
fun PreviewToothbrushScreen() {
    BrushIQTheme {
        ToothbrushScreen(navController = rememberNavController())
    }
}
