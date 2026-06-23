package com.brushiq.ui.theme

import androidx.compose.ui.graphics.Color

// Primary Branding
val PrimaryMain = Color(0xFF1565D8)
val PrimaryLight = Color(0xFF3B82F6)
val PrimaryDark = Color(0xFF0F4DB2)

// Secondary Branding (Teal/Emerald)
val SecondaryMain = Color(0xFF14B8A6)
val SecondaryLight = Color(0xFF2DD4BF)
val SecondaryDark = Color(0xFF0F8F81)

// Semantic Colors
val Success = Color(0xFF10B981)
val Warning = Color(0xFFF59E0B)
val Info = Color(0xFF3B82F6)
val Error = Color(0xFFF43F5E)
val Alert = Color(0xFFF97316)

// Neutral / Background Colors
val LightBg = Color(0xFFF8FAFC)
val LightSurface = Color(0xFFFFFFFF)
val LightBorder = Color(0xFFF1F5F9)
val LightTextPrimary = Color(0xFF0F172A)
val LightTextSecondary = Color(0xFF64748B)
val LightTextMuted = Color(0xFF94A3B8)

val DarkBg = Color(0xFF0F172A)
val DarkSurface = Color(0xFF1E293B)
val DarkBorder = Color(0xFF334155)
val DarkTextPrimary = Color(0xFFF8FAFC)
val DarkTextSecondary = Color(0xFF94A3B8)
val DarkTextMuted = Color(0xFF475569)

// Transparent Colors
val PrimaryAlpha10 = PrimaryMain.copy(alpha = 0.1f)
val SecondaryAlpha10 = SecondaryMain.copy(alpha = 0.1f)
val ErrorAlpha10 = Error.copy(alpha = 0.1f)
val SuccessAlpha10 = Success.copy(alpha = 0.1f)
val WarningAlpha10 = Warning.copy(alpha = 0.1f)
