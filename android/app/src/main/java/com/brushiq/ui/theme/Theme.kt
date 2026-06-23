package com.brushiq.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.*
import androidx.compose.runtime.Composable

private val LightColorScheme = lightColorScheme(
    primary = PrimaryMain,
    onPrimary = LightSurface,
    primaryContainer = PrimaryAlpha10,
    onPrimaryContainer = PrimaryDark,
    secondary = SecondaryMain,
    onSecondary = LightSurface,
    secondaryContainer = SecondaryAlpha10,
    onSecondaryContainer = SecondaryDark,
    error = Error,
    onError = LightSurface,
    background = LightBg,
    onBackground = LightTextPrimary,
    surface = LightSurface,
    onSurface = LightTextPrimary,
    surfaceVariant = LightBorder,
    onSurfaceVariant = LightTextSecondary,
    outline = LightBorder
)

private val DarkColorScheme = darkColorScheme(
    primary = PrimaryMain,
    onPrimary = DarkTextPrimary,
    primaryContainer = PrimaryAlpha10,
    onPrimaryContainer = PrimaryLight,
    secondary = SecondaryMain,
    onSecondary = DarkTextPrimary,
    secondaryContainer = SecondaryAlpha10,
    onSecondaryContainer = SecondaryLight,
    error = Error,
    onError = DarkTextPrimary,
    background = DarkBg,
    onBackground = DarkTextPrimary,
    surface = DarkSurface,
    onSurface = DarkTextPrimary,
    surfaceVariant = DarkBorder,
    onSurfaceVariant = DarkTextSecondary,
    outline = DarkBorder
)

@Composable
fun BrushIQTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme

    MaterialTheme(
        colorScheme = colorScheme,
        typography = BrushIQTypography,
        shapes = BrushIQShapes,
        content = content
    )
}
