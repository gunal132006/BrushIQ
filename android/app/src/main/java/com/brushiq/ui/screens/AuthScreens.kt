package com.brushiq.ui.screens

import androidx.compose.animation.*
import androidx.compose.foundation.Image
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
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import androidx.navigation.compose.rememberNavController
import com.brushiq.ui.components.*
import com.brushiq.ui.theme.*
import com.brushiq.ui.viewmodel.AuthState
import com.brushiq.ui.viewmodel.AuthViewModel
import kotlinx.coroutines.launch
import androidx.compose.ui.platform.LocalContext
import com.brushiq.R

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LoginScreen(
    navController: NavController,
    viewModel: AuthViewModel? = null
) {
    var username by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    
    var usernameError by remember { mutableStateOf<String?>(null) }
    var passwordError by remember { mutableStateOf<String?>(null) }
    
    val authState by (viewModel?.authState ?: remember { kotlinx.coroutines.flow.MutableStateFlow<AuthState>(AuthState.Idle) }).collectAsState()
    
    val scrollState = rememberScrollState()
    val snackbarHostState = remember { SnackbarHostState() }
    val scope = rememberCoroutineScope()
    val context = LocalContext.current

    LaunchedEffect(Unit) {
        viewModel?.resetAuthState()
    }

    LaunchedEffect(authState) {
        when (authState) {
            is AuthState.Success -> {
                android.util.Log.d("AuthFlow", "Login success, navigating to dashboard")
                navController.navigate("dashboard") {
                    popUpTo("login") { inclusive = true }
                }
            }
            is AuthState.Error -> {
                val errorMsg = (authState as AuthState.Error).message
                android.util.Log.e("AuthFlow", "Login error: $errorMsg")
                scope.launch {
                    snackbarHostState.showSnackbar(errorMsg)
                }
            }
            else -> {}
        }
    }

    Scaffold(
        snackbarHost = { SnackbarHost(hostState = snackbarHostState) }
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .background(MaterialTheme.colorScheme.background)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(scrollState)
                    .padding(Dimensions.PaddingExtraLarge),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Spacer(modifier = Modifier.height(48.dp))

                // Logo Header
                Surface(
                    modifier = Modifier.size(80.dp),
                    color = PrimaryMain,
                    shape = BrushIQShapes.large,
                    tonalElevation = 4.dp
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Text("B", color = Color.White, style = MaterialTheme.typography.displayLarge.copy(fontSize = 44.sp))
                    }
                }
                
                Spacer(modifier = Modifier.height(24.dp))
                
                Text(
                    text = "Welcome Back",
                    style = MaterialTheme.typography.displayLarge.copy(fontSize = 32.sp)
                )
                Text(
                    text = "Sign in to continue your clinical routine",
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    style = MaterialTheme.typography.bodyLarge,
                    textAlign = TextAlign.Center
                )
                
                Spacer(modifier = Modifier.height(40.dp))

                // Input Fields
                OutlinedTextField(
                    value = username,
                    onValueChange = { 
                        username = it
                        if (usernameError != null) usernameError = null
                    },
                    label = { Text("Email or Phone Number") },
                    placeholder = { Text("Enter your credentials") },
                    leadingIcon = { Icon(Icons.Default.Email, contentDescription = null, tint = PrimaryMain) },
                    isError = usernameError != null,
                    supportingText = {
                        usernameError?.let {
                            Text(text = it, color = MaterialTheme.colorScheme.error)
                        }
                    },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    shape = BrushIQShapes.large,
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = PrimaryMain,
                        unfocusedBorderColor = MaterialTheme.colorScheme.outline
                    )
                )
                
                Spacer(modifier = Modifier.height(16.dp))

                OutlinedTextField(
                    value = password,
                    onValueChange = { 
                        password = it
                        if (passwordError != null) passwordError = null
                    },
                    label = { Text("Password") },
                    placeholder = { Text("Enter your password") },
                    leadingIcon = { Icon(Icons.Default.Lock, contentDescription = null, tint = PrimaryMain) },
                    visualTransformation = PasswordVisualTransformation(),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                    isError = passwordError != null,
                    supportingText = {
                        passwordError?.let {
                            Text(text = it, color = MaterialTheme.colorScheme.error)
                        }
                    },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    shape = BrushIQShapes.large,
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = PrimaryMain,
                        unfocusedBorderColor = MaterialTheme.colorScheme.outline
                    )
                )
                
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 12.dp),
                    contentAlignment = Alignment.CenterEnd
                ) {
                    Text(
                        text = "Forgot Password?",
                        color = PrimaryMain,
                        style = MaterialTheme.typography.labelMedium,
                        modifier = Modifier.clickable { navController.navigate("forgot_password") }
                    )
                }
                
                Spacer(modifier = Modifier.height(32.dp))

                // Sign In Button
                PrimaryButton(
                    text = "Sign In",
                    isLoading = authState is AuthState.Loading,
                    onClick = {
                        usernameError = null
                        passwordError = null
                        var isValid = true

                        if (username.trim().isEmpty()) {
                            usernameError = "Email or Phone is required"
                            isValid = false
                        }
                        if (password.isEmpty()) {
                            passwordError = "Password is required"
                            isValid = false
                        }

                        if (isValid) {
                            android.util.Log.d("AuthFlow", "Login button clicked: username=$username")
                            viewModel?.login(username.trim(), password)
                            if (viewModel == null) navController.navigate("dashboard")
                        } else {
                            android.util.Log.d("AuthFlow", "Login form validation failed")
                        }
                    }
                )

                Spacer(modifier = Modifier.height(20.dp))

                // Google Button (Interactive Sign-In)
                OutlinedButton(
                    onClick = { 
                        viewModel?.loginWithGoogleInteractive(context)
                    },
                    enabled = authState !is AuthState.Loading,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(Dimensions.ButtonHeight),
                    shape = BrushIQShapes.large,
                    border = androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.outline)
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Image(
                            painter = painterResource(id = R.drawable.ic_google),
                            contentDescription = "Google Logo",
                            modifier = Modifier.size(20.dp)
                        )
                        Spacer(modifier = Modifier.width(12.dp))
                        Text(
                            text = "Sign in with Google",
                            style = MaterialTheme.typography.titleMedium.copy(color = MaterialTheme.colorScheme.onSurfaceVariant)
                        )
                    }
                }

                Spacer(modifier = Modifier.weight(1f))
                Spacer(modifier = Modifier.height(32.dp))

                Row(horizontalArrangement = Arrangement.Center) {
                    Text(
                        "Don't have an account? ",
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        style = MaterialTheme.typography.bodyMedium
                    )
                    Text(
                        text = "Sign Up",
                        color = PrimaryMain,
                        style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Black),
                        modifier = Modifier.clickable { navController.navigate("register") }
                    )
                }
                Spacer(modifier = Modifier.height(16.dp))
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RegisterScreen(
    navController: NavController,
    viewModel: AuthViewModel? = null
) {
    var fullName by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var phone by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var confirmPassword by remember { mutableStateOf("") }
    
    var fullNameError by remember { mutableStateOf<String?>(null) }
    var emailError by remember { mutableStateOf<String?>(null) }
    var phoneError by remember { mutableStateOf<String?>(null) }
    var passwordError by remember { mutableStateOf<String?>(null) }
    var confirmPasswordError by remember { mutableStateOf<String?>(null) }
    
    val authState by (viewModel?.authState ?: remember { kotlinx.coroutines.flow.MutableStateFlow<AuthState>(AuthState.Idle) }).collectAsState()
    val scrollState = rememberScrollState()
    val snackbarHostState = remember { SnackbarHostState() }
    val scope = rememberCoroutineScope()

    LaunchedEffect(Unit) {
        viewModel?.resetAuthState()
    }

    LaunchedEffect(authState) {
        when (authState) {
            is AuthState.Success -> {
                android.util.Log.d("AuthFlow", "Register success, navigating to dashboard")
                navController.navigate("dashboard") {
                    popUpTo("login") { inclusive = true }
                }
            }
            is AuthState.Error -> {
                val errorMsg = (authState as AuthState.Error).message
                android.util.Log.e("AuthFlow", "Register error: $errorMsg")
                scope.launch {
                    snackbarHostState.showSnackbar(errorMsg)
                }
            }
            else -> {}
        }
    }

    Scaffold(
        snackbarHost = { SnackbarHost(hostState = snackbarHostState) }
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .background(MaterialTheme.colorScheme.background)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(scrollState)
                    .padding(Dimensions.PaddingExtraLarge),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Spacer(modifier = Modifier.height(32.dp))

                Text(
                    text = "Create Account",
                    style = MaterialTheme.typography.displayLarge.copy(fontSize = 32.sp)
                )
                Text(
                    text = "Join the AI-powered oral healthcare revolution",
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    style = MaterialTheme.typography.bodyLarge,
                    textAlign = TextAlign.Center
                )
                
                Spacer(modifier = Modifier.height(40.dp))

                OutlinedTextField(
                    value = fullName,
                    onValueChange = { 
                        fullName = it
                        if (fullNameError != null) fullNameError = null
                    },
                    label = { Text("Full Name") },
                    leadingIcon = { Icon(Icons.Default.Person, contentDescription = null, tint = PrimaryMain) },
                    isError = fullNameError != null,
                    supportingText = {
                        fullNameError?.let {
                            Text(text = it, color = MaterialTheme.colorScheme.error)
                        }
                    },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    shape = BrushIQShapes.large
                )
                Spacer(modifier = Modifier.height(16.dp))

                OutlinedTextField(
                    value = email,
                    onValueChange = { 
                        email = it
                        if (emailError != null) {
                            emailError = null
                            phoneError = null
                        }
                    },
                    label = { Text("Email Address") },
                    leadingIcon = { Icon(Icons.Default.Email, contentDescription = null, tint = PrimaryMain) },
                    isError = emailError != null,
                    supportingText = {
                        emailError?.let {
                            Text(text = it, color = MaterialTheme.colorScheme.error)
                        }
                    },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    shape = BrushIQShapes.large
                )
                Spacer(modifier = Modifier.height(16.dp))

                OutlinedTextField(
                    value = phone,
                    onValueChange = { 
                        phone = it
                        if (phoneError != null) {
                            phoneError = null
                            emailError = null
                        }
                    },
                    label = { Text("Phone Number") },
                    leadingIcon = { Icon(Icons.Default.Phone, contentDescription = null, tint = PrimaryMain) },
                    isError = phoneError != null,
                    supportingText = {
                        phoneError?.let {
                            Text(text = it, color = MaterialTheme.colorScheme.error)
                        }
                    },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    shape = BrushIQShapes.large
                )
                Spacer(modifier = Modifier.height(16.dp))

                OutlinedTextField(
                    value = password,
                    onValueChange = { 
                        password = it
                        if (passwordError != null) passwordError = null
                    },
                    label = { Text("Password") },
                    leadingIcon = { Icon(Icons.Default.Lock, contentDescription = null, tint = PrimaryMain) },
                    visualTransformation = PasswordVisualTransformation(),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                    isError = passwordError != null,
                    supportingText = {
                        passwordError?.let {
                            Text(text = it, color = MaterialTheme.colorScheme.error)
                        }
                    },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    shape = BrushIQShapes.large
                )
                Spacer(modifier = Modifier.height(16.dp))

                OutlinedTextField(
                    value = confirmPassword,
                    onValueChange = { 
                        confirmPassword = it
                        if (confirmPasswordError != null) confirmPasswordError = null
                    },
                    label = { Text("Confirm Password") },
                    leadingIcon = { Icon(Icons.Default.Lock, contentDescription = null, tint = PrimaryMain) },
                    visualTransformation = PasswordVisualTransformation(),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                    isError = confirmPasswordError != null,
                    supportingText = {
                        confirmPasswordError?.let {
                            Text(text = it, color = MaterialTheme.colorScheme.error)
                        }
                    },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    shape = BrushIQShapes.large
                )
                
                Spacer(modifier = Modifier.height(40.dp))

                PrimaryButton(
                    text = "Create Account",
                    isLoading = authState is AuthState.Loading,
                    onClick = {
                        fullNameError = null
                        emailError = null
                        phoneError = null
                        passwordError = null
                        confirmPasswordError = null

                        var isValid = true

                        if (fullName.trim().isEmpty()) {
                            fullNameError = "Full Name is required"
                            isValid = false
                        }

                        if (email.trim().isEmpty() && phone.trim().isEmpty()) {
                            emailError = "Provide either Email or Phone Number"
                            phoneError = "Provide either Email or Phone Number"
                            isValid = false
                        } else {
                            if (email.trim().isNotEmpty() && !android.util.Patterns.EMAIL_ADDRESS.matcher(email.trim()).matches()) {
                                emailError = "Invalid email format"
                                isValid = false
                            }
                            if (phone.trim().isNotEmpty() && phone.trim().length < 8) {
                                phoneError = "Invalid phone format (min 8 digits)"
                                isValid = false
                            }
                        }

                        if (password.isEmpty()) {
                            passwordError = "Password is required"
                            isValid = false
                        } else if (password.length < 6) {
                            passwordError = "Password must be at least 6 characters"
                            isValid = false
                        }

                        if (confirmPassword.isEmpty()) {
                            confirmPasswordError = "Please confirm your password"
                            isValid = false
                        } else if (password != confirmPassword) {
                            confirmPasswordError = "Passwords do not match"
                            isValid = false
                        }

                        if (isValid) {
                            android.util.Log.d("AuthFlow", "Register button clicked: name=$fullName, email=$email")
                            viewModel?.register(
                                fullName = fullName.trim(),
                                email = email.trim().ifEmpty { null },
                                phone = phone.trim().ifEmpty { null },
                                password = password
                            )
                        } else {
                            android.util.Log.d("AuthFlow", "Register form validation failed")
                        }
                    }
                )

                Spacer(modifier = Modifier.height(24.dp))
                
                Row(horizontalArrangement = Arrangement.Center) {
                    Text(
                        "Already have an account? ",
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        style = MaterialTheme.typography.bodyMedium
                    )
                    Text(
                        text = "Sign In",
                        color = PrimaryMain,
                        style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Black),
                        modifier = Modifier.clickable { navController.navigate("login") }
                    )
                }
                Spacer(modifier = Modifier.height(32.dp))
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ForgotPasswordScreen(
    navController: NavController,
    viewModel: AuthViewModel? = null
) {
    var username by remember { mutableStateOf("") }
    var sent by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            AppHeader(
                title = "Recover Password",
                navigationIcon = {
                    IconButton(onClick = { navController.navigateUp() }) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(Dimensions.PaddingExtraLarge),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            if (!sent) {
                Text(
                    text = "Enter your registered credentials to recover your account.",
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    style = MaterialTheme.typography.bodyLarge,
                    textAlign = TextAlign.Center
                )
                
                Spacer(modifier = Modifier.height(40.dp))

                OutlinedTextField(
                    value = username,
                    onValueChange = { username = it },
                    label = { Text("Email or Phone") },
                    leadingIcon = { Icon(Icons.Default.Email, contentDescription = null, tint = PrimaryMain) },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    shape = BrushIQShapes.large
                )
                
                Spacer(modifier = Modifier.height(32.dp))

                PrimaryButton(
                    text = "Reset Password",
                    onClick = { sent = true }
                )
            } else {
                Box(
                    modifier = Modifier.size(80.dp).background(SuccessAlpha10, CircleShape),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(Icons.Default.Check, contentDescription = null, tint = Success, modifier = Modifier.size(40.dp))
                }
                Spacer(modifier = Modifier.height(24.dp))
                Text(
                    text = "Recovery Link Sent",
                    style = MaterialTheme.typography.titleLarge
                )
                Text(
                    text = "Please check your inbox for instructions to reset your password.",
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    style = MaterialTheme.typography.bodyLarge,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.padding(top = 8.dp)
                )
                Spacer(modifier = Modifier.height(40.dp))
                SecondaryButton(
                    text = "Back to Login",
                    onClick = { navController.navigate("login") }
                )
            }
        }
    }
}

@Preview(showBackground = true, name = "Login Light")
@Composable
fun PreviewLoginLight() {
    BrushIQTheme(darkTheme = false) {
        LoginScreen(navController = rememberNavController())
    }
}

@Preview(showBackground = true, name = "Login Dark")
@Composable
fun PreviewLoginDark() {
    BrushIQTheme(darkTheme = true) {
        LoginScreen(navController = rememberNavController())
    }
}

@Preview(showBackground = true, name = "Register Light")
@Composable
fun PreviewRegisterLight() {
    BrushIQTheme(darkTheme = false) {
        RegisterScreen(navController = rememberNavController())
    }
}
