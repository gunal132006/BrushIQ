package com.brushiq.ui

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.brushiq.ui.components.BottomNavigationBar
import com.brushiq.ui.components.NavigationItem
import com.brushiq.ui.screens.*
import com.brushiq.ui.theme.BrushIQTheme
import com.brushiq.ui.viewmodel.AuthViewModel
import com.brushiq.ui.viewmodel.BrushIQViewModel
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        setContent {
            val authViewModel: AuthViewModel = hiltViewModel()
            val brushIQViewModel: BrushIQViewModel = hiltViewModel()

            val isDarkTheme = remember { mutableStateOf(false) }

            BrushIQTheme(darkTheme = isDarkTheme.value) {
                val navController = rememberNavController()
                val navBackStackEntry by navController.currentBackStackEntryAsState()
                val currentRoute = navBackStackEntry?.destination?.route

                val scanViewModel: com.brushiq.ui.viewmodel.ScanViewModel = hiltViewModel()

                // Determine if we should show bottom navigation bar
                val showBottomBar = currentRoute in listOf(
                    NavigationItem.Dashboard.route,
                    NavigationItem.Family.route,
                    NavigationItem.Scan.route,
                    NavigationItem.History.route,
                    NavigationItem.Settings.route,
                    "toothbrush",
                    "reminders",
                    "tips"
                )

                Scaffold(
                    bottomBar = {
                        if (showBottomBar) {
                            BottomNavigationBar(navController, currentRoute)
                        }
                    }
                ) { innerPadding ->
                    NavHost(
                        navController = navController,
                        startDestination = "splash",
                        modifier = Modifier.padding(innerPadding)
                    ) {
                        // Auth Screens
                        composable("splash") {
                            SplashScreen(navController = navController, authViewModel = authViewModel)
                        }
                        composable("login") {
                            LoginScreen(navController = navController, viewModel = authViewModel)
                        }
                        composable("register") {
                            RegisterScreen(navController = navController, viewModel = authViewModel)
                        }
                        composable("forgot_password") {
                            ForgotPasswordScreen(navController = navController, viewModel = authViewModel)
                        }

                        // Dashboard
                        composable("dashboard") {
                            DashboardScreen(
                                navController = navController,
                                viewModel = brushIQViewModel,
                                authViewModel = authViewModel
                            )
                        }

                        // Family Module
                        composable("family") {
                            FamilyScreen(navController = navController, viewModel = brushIQViewModel)
                        }
                        composable("member_dossier/{memberId}") { backStackEntry ->
                            val memberId = backStackEntry.arguments?.getString("memberId") ?: ""
                            MemberDossierScreen(memberId = memberId, navController = navController)
                        }
                        composable("add_member") {
                            AddEditMemberScreen(navController = navController)
                        }
                        composable("edit_member/{memberId}") { backStackEntry ->
                            val memberId = backStackEntry.arguments?.getString("memberId")
                            AddEditMemberScreen(memberId = memberId, navController = navController)
                        }
                        composable("toothbrush") {
                            ToothbrushScreen(navController = navController, viewModel = brushIQViewModel)
                        }

                        // Scan Module
                        composable("scan") {
                            ScanScreen(navController = navController, viewModel = scanViewModel)
                        }
                        composable("preview") {
                            ImagePreviewScreen(navController = navController, viewModel = scanViewModel)
                        }
                        composable("processing") {
                            AnalysisLoadingScreen(navController = navController, viewModel = scanViewModel)
                        }
                        composable("result") {
                            ResultScreen(navController = navController, scanViewModel = scanViewModel)
                        }

                        // History Module
                        composable("history") {
                            HistoryScreen(navController = navController, viewModel = brushIQViewModel)
                        }
                        composable("scan_details/{scanId}") { backStackEntry ->
                            val scanId = backStackEntry.arguments?.getString("scanId") ?: ""
                            ScanDetailsScreen(scanId = scanId, navController = navController)
                        }

                        // Reminders
                        composable("reminders") {
                            ReminderScreen(navController = navController, viewModel = brushIQViewModel)
                        }

                        // Tips Module
                        composable("tips") {
                            TipsScreen(navController = navController, viewModel = brushIQViewModel)
                        }
                        composable("tip_detail/{tipId}") { backStackEntry ->
                            val tipId = backStackEntry.arguments?.getString("tipId") ?: ""
                            TipDetailScreen(tipId = tipId, navController = navController, viewModel = brushIQViewModel)
                        }

                        // Profile
                        composable("profile") {
                            ProfileScreen(navController = navController, viewModel = authViewModel)
                        }

                        // Settings
                        composable("settings") {
                            SettingsScreen(
                                navController = navController,
                                viewModel = brushIQViewModel,
                                authViewModel = authViewModel,
                                isDarkTheme = isDarkTheme
                            )
                        }

                        // Legal & About
                        composable("about") {
                            AboutScreen(navController = navController)
                        }
                        composable("privacy_policy") {
                            PrivacyPolicyScreen(navController = navController)
                        }
                        composable("terms_conditions") {
                            TermsConditionsScreen(navController = navController)
                        }
                    }
                }
            }
        }
    }
}
