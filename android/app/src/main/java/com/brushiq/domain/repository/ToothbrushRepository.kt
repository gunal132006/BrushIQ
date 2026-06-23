package com.brushiq.domain.repository

import com.brushiq.util.Resource
import kotlinx.coroutines.flow.Flow

interface ToothbrushRepository {
    fun getToothbrushes(familyMemberId: String? = null): Flow<Resource<List<Toothbrush>>>
    suspend fun syncToothbrushes(familyMemberId: String? = null): Resource<Unit>
    suspend fun addToothbrush(familyMemberId: String, brand: String, model: String, color: String, type: String, purchaseDate: String): Resource<Toothbrush>
    suspend fun updateToothbrush(id: String, brand: String, model: String, color: String, type: String, purchaseDate: String): Resource<Toothbrush>
    suspend fun deleteToothbrush(id: String): Resource<Unit>
}
