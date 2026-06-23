package com.brushiq.domain.repository

import com.brushiq.util.Resource
import kotlinx.coroutines.flow.Flow

interface TipsRepository {
    fun getTips(): Flow<Resource<List<Tip>>>
    suspend fun syncTips(): Resource<Unit>
    suspend fun getPersonalizedTips(familyMemberId: String): Resource<List<Tip>>
    fun getBookmarkedTips(): Flow<Resource<List<Tip>>>
    suspend fun toggleBookmark(tip: Tip): Resource<Unit>
    fun isTipBookmarked(tipId: String): Flow<Boolean>
}
