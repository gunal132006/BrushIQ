package com.brushiq.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.brushiq.domain.repository.*
import com.brushiq.util.Resource
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.io.File
import javax.inject.Inject

@HiltViewModel
class BrushIQViewModel @Inject constructor(
    private val familyRepository: FamilyRepository,
    private val toothbrushRepository: ToothbrushRepository,
    private val scanRepository: ScanRepository,
    private val tipsRepository: TipsRepository,
    private val profileRepository: ProfileRepository,
    private val networkMonitor: com.brushiq.util.NetworkMonitor
) : ViewModel() {

    val isOnline: StateFlow<Boolean> = networkMonitor.isOnline

    // ------------------------------------
    // State Definitions (Flow Mapping)
    // ------------------------------------
    val familyMembers: StateFlow<List<FamilyMember>> = familyRepository.getFamilyMembers()
        .map { resource ->
            when (resource) {
                is Resource.Success -> resource.data
                else -> emptyList()
            }
        }
        .stateIn(viewModelScope, SharingStarted.Lazily, emptyList())

    val toothbrushes: StateFlow<List<Toothbrush>> = toothbrushRepository.getToothbrushes()
        .map { resource ->
            when (resource) {
                is Resource.Success -> resource.data
                else -> emptyList()
            }
        }
        .stateIn(viewModelScope, SharingStarted.Lazily, emptyList())

    val activeReminders: StateFlow<List<Reminder>> = familyRepository.getActiveReminders()
        .map { resource ->
            when (resource) {
                is Resource.Success -> resource.data
                else -> emptyList()
            }
        }
        .stateIn(viewModelScope, SharingStarted.Lazily, emptyList())

    val tips: StateFlow<List<Tip>> = tipsRepository.getTips()
        .map { resource ->
            when (resource) {
                is Resource.Success -> resource.data
                else -> emptyList()
            }
        }
        .stateIn(viewModelScope, SharingStarted.Lazily, emptyList())

    val bookmarkedTips: StateFlow<List<Tip>> = tipsRepository.getBookmarkedTips()
        .map { resource ->
            when (resource) {
                is Resource.Success -> resource.data
                else -> emptyList()
            }
        }
        .stateIn(viewModelScope, SharingStarted.Lazily, emptyList())

    // App preferences reactively mapped
    val themePreference: StateFlow<String> = profileRepository.getThemePreference()
        .stateIn(viewModelScope, SharingStarted.Lazily, "System")

    val languagePreference: StateFlow<String> = profileRepository.getLanguagePreference()
        .stateIn(viewModelScope, SharingStarted.Lazily, "English")

    private val _dashboardStats = MutableStateFlow<DashboardStats?>(null)
    val dashboardStats: StateFlow<DashboardStats?> = _dashboardStats

    private val _scanHistory = MutableStateFlow<List<ScanReport>>(emptyList())
    val scanHistory: StateFlow<List<ScanReport>> = _scanHistory

    private val _personalizedTips = MutableStateFlow<List<Tip>>(emptyList())
    val personalizedTips: StateFlow<List<Tip>> = _personalizedTips

    private val _loading = MutableStateFlow(false)
    val loading: StateFlow<Boolean> = _loading

    private val _scanReport = MutableStateFlow<ScanReport?>(null)
    val scanReport: StateFlow<ScanReport?> = _scanReport

    private val _selectedFamilyMemberId = MutableStateFlow<String?>(null)
    val selectedFamilyMemberId: StateFlow<String?> = _selectedFamilyMemberId

    private val _selectedToothbrushId = MutableStateFlow<String?>(null)
    val selectedToothbrushId: StateFlow<String?> = _selectedToothbrushId

    fun setSelectedContext(familyMemberId: String?, toothbrushId: String?) {
        _selectedFamilyMemberId.value = familyMemberId
        _selectedToothbrushId.value = toothbrushId
        android.util.Log.d("SCAN SAVE", "[SCAN SAVE] setSelectedContext: familyMemberId=$familyMemberId, toothbrushId=$toothbrushId")
    }

    init {
        syncAllData()
        observeNetworkChanges()
    }

    private fun observeNetworkChanges() {
        viewModelScope.launch {
            var wasOffline = !networkMonitor.isOnline.value
            networkMonitor.isOnline.collect { online ->
                if (online && wasOffline) {
                    android.util.Log.d("SYNC", "[SYNC] Network transition OFFLINE -> ONLINE detected. Triggering auto sync...")
                    syncPendingScans()
                    syncAllData()
                }
                wasOffline = !online
            }
        }
    }

    fun syncPendingScans() {
        viewModelScope.launch {
            try {
                val res = scanRepository.syncPendingScans()
                if (res is com.brushiq.util.Resource.Success && res.data > 0) {
                    com.brushiq.util.UiNotificationManager.showSuccess(
                        title = "Sync Complete",
                        message = "Your offline reports have been synchronized."
                    )
                }
                fetchScansHistory("")
                fetchDashboardStats()
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    fun syncToothbrushes() {
        viewModelScope.launch {
            _loading.value = true
            try {
                toothbrushRepository.syncToothbrushes()
            } catch (e: Exception) {
                e.printStackTrace()
            } finally {
                _loading.value = false
            }
        }
    }

    fun clearUserData() {
        _dashboardStats.value = null
        _scanHistory.value = emptyList()
        _personalizedTips.value = emptyList()
        _scanReport.value = null
        _selectedFamilyMemberId.value = null
        _selectedToothbrushId.value = null
    }

    fun syncAllData() {
        viewModelScope.launch {
            _loading.value = true
            _dashboardStats.value = null
            _scanHistory.value = emptyList()
            try {
                familyRepository.syncFamilyMembers()
                toothbrushRepository.syncToothbrushes()
                familyRepository.syncReminders()
                tipsRepository.syncTips()
                fetchScansHistory("")
                fetchDashboardStats()
                syncPendingScans()
            } catch (e: Exception) {
                e.printStackTrace()
            } finally {
                _loading.value = false
            }
        }
    }

    // ------------------------------------
    // Dashboard Stats
    // ------------------------------------
    fun fetchDashboardStats() {
        viewModelScope.launch {
            val res = profileRepository.getDashboardData()
            if (res is Resource.Success) {
                _dashboardStats.value = res.data
            } else {
                updateOfflineDashboardStats()
            }
        }
    }

    private fun updateOfflineDashboardStats() {
        val mems = familyMembers.value
        val brushes = toothbrushes.value
        val scans = scanHistory.value
        val avgScore = if (scans.isNotEmpty()) scans.map { it.healthScore }.average() else 0.0
        val pendingAlerts = brushes.count { b ->
            val bScans = scans.filter { s -> s.toothbrushId == b.id }
            val lastScan = bScans.maxByOrNull { it.scanDate }
            val score = lastScan?.healthScore ?: 100.0
            val cond = lastScan?.condition ?: "Good"
            score < 50.0 || cond == "Replace Soon" || cond == "Replace Immediately"
        }
        _dashboardStats.value = DashboardStats(
            totalMembers = mems.size,
            totalToothbrushes = brushes.size,
            totalScans = scans.size,
            avgHealthScore = avgScore,
            pendingReplacements = pendingAlerts,
            recentScans = scans.take(5)
        )
    }

    // ------------------------------------
    // Family Members CRUD
    // ------------------------------------
    fun addFamilyMember(name: String, age: Int, gender: String, relationship: String, profilePhotoUrl: String?) {
        viewModelScope.launch {
            _loading.value = true
            val res = familyRepository.addFamilyMember(name, age, gender, relationship, profilePhotoUrl)
            if (res is Resource.Success) {
                familyRepository.syncFamilyMembers()
                fetchDashboardStats()
            }
            _loading.value = false
        }
    }

    fun updateFamilyMember(id: String, name: String, age: Int, gender: String, relationship: String, profilePhotoUrl: String?) {
        viewModelScope.launch {
            _loading.value = true
            val res = familyRepository.updateFamilyMember(id, name, age, gender, relationship, profilePhotoUrl)
            if (res is Resource.Success) {
                familyRepository.syncFamilyMembers()
                fetchDashboardStats()
            }
            _loading.value = false
        }
    }

    fun deleteFamilyMember(id: String) {
        viewModelScope.launch {
            _loading.value = true
            val res = familyRepository.deleteFamilyMember(id)
            if (res is Resource.Success) {
                familyRepository.syncFamilyMembers()
                fetchDashboardStats()
            }
            _loading.value = false
        }
    }

    // ------------------------------------
    // Toothbrush CRUD
    // ------------------------------------
    fun addToothbrush(familyMemberId: String, brand: String, model: String, color: String, type: String, purchaseDate: String) {
        viewModelScope.launch {
            _loading.value = true
            val res = toothbrushRepository.addToothbrush(familyMemberId, brand, model, color, type, purchaseDate)
            if (res is Resource.Success) {
                toothbrushRepository.syncToothbrushes()
                familyRepository.syncFamilyMembers()
                fetchDashboardStats()
            }
            _loading.value = false
        }
    }

    fun updateToothbrush(id: String, brand: String, model: String, color: String, type: String, purchaseDate: String) {
        viewModelScope.launch {
            _loading.value = true
            val res = toothbrushRepository.updateToothbrush(id, brand, model, color, type, purchaseDate)
            if (res is Resource.Success) {
                toothbrushRepository.syncToothbrushes()
                familyRepository.syncFamilyMembers()
                fetchDashboardStats()
            }
            _loading.value = false
        }
    }

    fun deleteToothbrush(id: String) {
        viewModelScope.launch {
            _loading.value = true
            val res = toothbrushRepository.deleteToothbrush(id)
            if (res is Resource.Success) {
                toothbrushRepository.syncToothbrushes()
                familyRepository.syncFamilyMembers()
                fetchDashboardStats()
            }
            _loading.value = false
        }
    }

    // ------------------------------------
    // Camera Scan & AI Analysis
    // ------------------------------------
    fun analyzeImageFile(imageFile: File, onComplete: (ScanReport?) -> Unit) {
        viewModelScope.launch {
            _loading.value = true
            val res = scanRepository.analyzeScan(imageFile)
            if (res is Resource.Success) {
                _scanReport.value = res.data
                onComplete(res.data)
            } else {
                onComplete(null)
            }
            _loading.value = false
        }
    }

    fun saveAnalysisReport(
        toothbrushId: String = "",
        report: ScanReport,
        frequency: String = "2x daily",
        onSuccess: (isOffline: Boolean) -> Unit = {},
        onError: (String) -> Unit = {}
    ) {
        viewModelScope.launch {
            _loading.value = true
            
            val selectedMemberId = _selectedFamilyMemberId.value
            var targetBrushId = if (toothbrushId.isNotBlank()) toothbrushId else (_selectedToothbrushId.value ?: report.toothbrushId)

            val matchedBrush = toothbrushes.value.find { it.id == targetBrushId }
            val memberId = matchedBrush?.familyMemberId ?: selectedMemberId

            // If toothbrushId is still blank, find toothbrush belonging to memberId
            if (targetBrushId.isBlank() && !memberId.isNullOrBlank()) {
                targetBrushId = toothbrushes.value.find { it.familyMemberId == memberId }?.id ?: ""
            }

            android.util.Log.d("SCAN SAVE", "[SCAN SAVE] resolvedMemberId = $memberId")
            android.util.Log.d("SCAN SAVE", "[SCAN SAVE] selectedToothbrushId = $targetBrushId")

            val online = networkMonitor.isOnline.value
            if (online) {
                android.util.Log.d("SCAN SAVE", "[SCAN SAVE] POST /api/scans (Online)")
                try {
                    val res = scanRepository.saveScan(
                        toothbrushId = targetBrushId,
                        familyMemberId = memberId,
                        imageUrl = report.imageUrl,
                        wearPercentage = report.wearPercentage,
                        healthScore = report.healthScore,
                        remainingLifeDays = report.remainingLifeDays,
                        condition = report.condition,
                        confidenceScore = report.confidenceScore,
                        bristleSpreading = report.bristleSpreading,
                        bristleBending = report.bristleBending,
                        bristleDamage = report.bristleDamage,
                        brushingFrequency = frequency,
                        detectedIssues = report.detectedIssues,
                        aiRecommendation = report.aiRecommendation
                    )
                    when (res) {
                        is Resource.Success -> {
                            val saved = res.data
                            android.util.Log.d("SCAN SAVE", "[SCAN SAVE] response status = 201")
                            android.util.Log.d("SCAN SAVE", "[SCAN SAVE] savedScanId = ${saved.id}")
                            android.util.Log.d("SCAN SAVE", "[SCAN SAVE] savedToothbrushId = ${saved.toothbrushId}")

                            familyRepository.syncFamilyMembers()
                            toothbrushRepository.syncToothbrushes()
                            fetchScansHistory("")
                            fetchDashboardStats()

                            onSuccess(false)
                        }
                        is Resource.Error -> {
                            // Fallback to offline save if network error
                            if (res.exception is java.io.IOException) {
                                savePendingLocally(targetBrushId, memberId, report, frequency, onSuccess, onError)
                            } else {
                                val errMsg = res.message ?: "Failed to save diagnostic report."
                                android.util.Log.e("SCAN SAVE", "[SCAN SAVE] Save failed: $errMsg", res.exception)
                                onError(errMsg)
                            }
                        }
                        else -> onError("Unknown response state")
                    }
                } catch (e: Exception) {
                    if (e is java.io.IOException) {
                        savePendingLocally(targetBrushId, memberId, report, frequency, onSuccess, onError)
                    } else {
                        android.util.Log.e("SCAN SAVE", "[SCAN SAVE] Exception in saveAnalysisReport: ${e.message}", e)
                        onError(e.message ?: "Unexpected error occurred during save.")
                    }
                } finally {
                    _loading.value = false
                }
            } else {
                savePendingLocally(targetBrushId, memberId, report, frequency, onSuccess, onError)
                _loading.value = false
            }
        }
    }

    private suspend fun savePendingLocally(
        targetBrushId: String,
        memberId: String?,
        report: ScanReport,
        frequency: String,
        onSuccess: (isOffline: Boolean) -> Unit,
        onError: (String) -> Unit
    ) {
        val res = scanRepository.saveScanLocallyPending(
            toothbrushId = targetBrushId,
            familyMemberId = memberId,
            imageUrl = report.imageUrl,
            wearPercentage = report.wearPercentage,
            healthScore = report.healthScore,
            remainingLifeDays = report.remainingLifeDays,
            condition = report.condition,
            confidenceScore = report.confidenceScore,
            bristleSpreading = report.bristleSpreading,
            bristleBending = report.bristleBending,
            bristleDamage = report.bristleDamage,
            brushingFrequency = frequency,
            detectedIssues = report.detectedIssues,
            aiRecommendation = report.aiRecommendation
        )
        if (res is Resource.Success) {
            fetchScansHistory("")
            updateOfflineDashboardStats()
            onSuccess(true)
        } else {
            onError("Failed to save report locally.")
        }
    }

    fun fetchScansHistory(toothbrushId: String = "") {
        viewModelScope.launch {
            try {
                if (networkMonitor.isOnline.value) {
                    scanRepository.syncScansHistory(toothbrushId)
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
            scanRepository.getScansHistory(toothbrushId).collect { res ->
                if (res is Resource.Success) {
                    _scanHistory.value = res.data
                    if (toothbrushId.isBlank()) {
                        val currentStats = _dashboardStats.value
                        if (currentStats == null || currentStats.totalScans < res.data.size) {
                            updateOfflineDashboardStats()
                        }
                    }
                }
            }
        }
    }

    // ------------------------------------
    // Reminders Actions
    // ------------------------------------
    fun completeReminder(id: String) {
        viewModelScope.launch {
            _loading.value = true
            val res = familyRepository.completeReminder(id)
            if (res is Resource.Success) {
                familyRepository.syncReminders()
            }
            _loading.value = false
        }
    }

    // ------------------------------------
    // Personalized Tips & Bookmarks
    // ------------------------------------
    fun fetchPersonalizedTips(familyMemberId: String) {
        viewModelScope.launch {
            val res = tipsRepository.getPersonalizedTips(familyMemberId)
            if (res is Resource.Success) {
                _personalizedTips.value = res.data
            }
        }
    }

    fun toggleBookmark(tip: Tip) {
        viewModelScope.launch {
            tipsRepository.toggleBookmark(tip)
        }
    }

    // ------------------------------------
    // Settings Preferences & Data Export
    // ------------------------------------
    fun saveThemePreference(theme: String) {
        viewModelScope.launch {
            profileRepository.saveThemePreference(theme)
        }
    }

    fun saveLanguagePreference(language: String) {
        viewModelScope.launch {
            profileRepository.saveLanguagePreference(language)
        }
    }

    fun exportScanHistoryData(onResult: (String) -> Unit) {
        viewModelScope.launch {
            val res = profileRepository.exportScanHistory()
            if (res is Resource.Success) {
                onResult(res.data)
            } else if (res is Resource.Error) {
                onResult(res.message ?: "Export failed.")
            }
        }
    }

    fun exportFamilyProfilesData(onResult: (String) -> Unit) {
        viewModelScope.launch {
            val res = profileRepository.exportFamilyData()
            if (res is Resource.Success) {
                onResult(res.data)
            } else if (res is Resource.Error) {
                onResult(res.message ?: "Export failed.")
            }
        }
    }

    fun exportToothbrushProfilesData(onResult: (String) -> Unit) {
        viewModelScope.launch {
            val res = profileRepository.exportToothbrushData()
            if (res is Resource.Success) {
                onResult(res.data)
            } else if (res is Resource.Error) {
                onResult(res.message ?: "Export failed.")
            }
        }
    }
}
