package com.brushiq.util

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.*
import androidx.datastore.preferences.preferencesDataStore
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "brushiq_prefs")

@Singleton
class PreferenceManager @Inject constructor(@ApplicationContext context: Context) {
    private val dataStore = context.dataStore

    // JWT Access Token Flow
    val userToken: Flow<String?> = dataStore.data.map { preferences ->
        preferences[TOKEN_KEY]
    }

    // Refresh Token Flow
    val refreshToken: Flow<String?> = dataStore.data.map { preferences ->
        preferences[REFRESH_TOKEN_KEY]
    }

    // User Session Profile Flow (Stored as a JSON String or serialized string)
    val userSession: Flow<String?> = dataStore.data.map { preferences ->
        preferences[USER_SESSION_KEY]
    }

    // Theme Preference Flow ("Light", "Dark", "System")
    val themePreference: Flow<String> = dataStore.data.map { preferences ->
        preferences[THEME_KEY] ?: "System"
    }

    // Language Preference Flow ("English", "Spanish", "French")
    val languagePreference: Flow<String> = dataStore.data.map { preferences ->
        preferences[LANGUAGE_KEY] ?: "English"
    }

    // Dark Mode helper flow (backward compatibility)
    val isDarkMode: Flow<Boolean> = dataStore.data.map { preferences ->
        val theme = preferences[THEME_KEY] ?: "System"
        theme == "Dark"
    }

    suspend fun saveToken(token: String) {
        dataStore.edit { preferences ->
            preferences[TOKEN_KEY] = token
        }
    }

    suspend fun saveRefreshToken(token: String) {
        dataStore.edit { preferences ->
            preferences[REFRESH_TOKEN_KEY] = token
        }
    }

    suspend fun saveUserSession(sessionJson: String) {
        dataStore.edit { preferences ->
            preferences[USER_SESSION_KEY] = sessionJson
        }
    }

    suspend fun saveThemePreference(theme: String) {
        dataStore.edit { preferences ->
            preferences[THEME_KEY] = theme
        }
    }

    suspend fun saveLanguagePreference(language: String) {
        dataStore.edit { preferences ->
            preferences[LANGUAGE_KEY] = language
        }
    }

    suspend fun setDarkMode(enabled: Boolean) {
        dataStore.edit { preferences ->
            preferences[THEME_KEY] = if (enabled) "Dark" else "Light"
        }
    }

    suspend fun clearToken() {
        dataStore.edit { preferences ->
            preferences.remove(TOKEN_KEY)
        }
    }

    suspend fun clearAll() {
        dataStore.edit { preferences ->
            preferences.remove(TOKEN_KEY)
            preferences.remove(REFRESH_TOKEN_KEY)
            preferences.remove(USER_SESSION_KEY)
        }
    }

    companion object {
        private val TOKEN_KEY = stringPreferencesKey("user_token")
        private val REFRESH_TOKEN_KEY = stringPreferencesKey("refresh_token")
        private val USER_SESSION_KEY = stringPreferencesKey("user_session")
        private val THEME_KEY = stringPreferencesKey("theme_pref")
        private val LANGUAGE_KEY = stringPreferencesKey("language_pref")
    }
}
