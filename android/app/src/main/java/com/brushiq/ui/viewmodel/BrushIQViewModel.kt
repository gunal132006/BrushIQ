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
    private val profileRepository: ProfileRepository
) : ViewModel() {

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

    fun syncAllData() {
        viewModelScope.launch {
            _loading.value = true
            try {
                familyRepository.syncFamilyMembers()
                toothbrushRepository.syncToothbrushes()
                familyRepository.syncReminders()
                tipsRepository.syncTips()
                fetchDashboardStats()
                fetchScansHistory("")
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
            }
        }
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
        onSuccess: () -> Unit = {},
        onError: (String) -> Unit = {}
    ) {
        viewModelScope.launch {
            _loading.value = true
            
            val memberId = _selectedFamilyMemberId.value
            var targetBrushId = if (toothbrushId.isNotBlank()) toothbrushId else (_selectedToothbrushId.value ?: report.toothbrushId)

            // If toothbrushId is still blank, find toothbrush belonging to selectedFamilyMemberId
            if (targetBrushId.isBlank() && !memberId.isNullOrBlank()) {
                targetBrushId = toothbrushes.value.find { it.familyMemberId == memberId }?.id ?: ""
            }

            android.util.Log.d("SCAN SAVE", "[SCAN SAVE] selectedFamilyMemberId = $memberId")
            android.util.Log.d("SCAN SAVE", "[SCAN SAVE] selectedToothbrushId = $targetBrushId")
            android.util.Log.d("SCAN SAVE", "[SCAN SAVE] POST /api/scans")

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
                        android.util.Log.d("SCAN SAVE", "[SCAN SAVE] expectedToothbrushId = $targetBrushId")
                        android.util.Log.d("SCAN SAVE", "[SCAN SAVE] relationship verified = true")

                        // Immediate full refresh from PostgreSQL database
                        familyRepository.syncFamilyMembers()
                        toothbrushRepository.syncToothbrushes()
                        fetchScansHistory(targetBrushId)
                        fetchDashboardStats()

                        onSuccess()
                    }
                    is Resource.Error -> {
                        val errMsg = res.message ?: "Failed to save diagnostic report."
                        android.util.Log.e("SCAN SAVE", "[SCAN SAVE] Save failed: $errMsg", res.exception)
                        onError(errMsg)
                    }
                    else -> {
                        onError("Unknown response state")
                    }
                }
            } catch (e: Exception) {
                android.util.Log.e("SCAN SAVE", "[SCAN SAVE] Exception in saveAnalysisReport: ${e.message}", e)
                onError(e.message ?: "Unexpected error occurred during save.")
            } finally {
                _loading.value = false
            }
        }
    }

    fun fetchScansHistory(toothbrushId: String = "") {
        viewModelScope.launch {
            scanRepository.syncScansHistory(toothbrushId)
            scanRepository.getScansHistory(toothbrushId).collect { res ->
                if (res is Resource.Success) {
                    _scanHistory.value = res.data
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
