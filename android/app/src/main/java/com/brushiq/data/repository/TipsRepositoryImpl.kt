package com.brushiq.data.repository

import com.brushiq.data.local.BookmarkedTipDao
import com.brushiq.data.local.BookmarkedTipEntity
import com.brushiq.data.local.TipDao
import com.brushiq.data.local.TipEntity
import com.brushiq.data.remote.TipsApi
import com.brushiq.domain.repository.Tip
import com.brushiq.domain.repository.TipsRepository
import com.brushiq.util.Resource
import com.brushiq.util.safeApiCall
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class TipsRepositoryImpl @Inject constructor(
    private val tipsApi: TipsApi,
    private val tipDao: TipDao,
    private val bookmarkedTipDao: BookmarkedTipDao
) : TipsRepository {

    override fun getTips(): Flow<Resource<List<Tip>>> {
        return tipDao.getAll().map { list ->
            val domainList = list.map { Tip(it.id, it.category, it.title, it.content, it.illustrationUrl) }
            Resource.Success(domainList) as Resource<List<Tip>>
        }.catch { emit(Resource.Error(it)) }
    }

    override suspend fun syncTips(): Resource<Unit> {
        val res = safeApiCall { tipsApi.getTips() }
        return when (res) {
            is Resource.Success -> {
                val dtoList = res.data
                val entities = dtoList.map { TipEntity(it.id, it.category, it.title, it.content, it.illustrationUrl) }
                tipDao.clearAll()
                tipDao.insertAll(entities)
                Resource.Success(Unit)
            }
            is Resource.Error -> Resource.Error(res.exception, res.message)
            is Resource.Loading -> Resource.Loading
        }
    }

    override suspend fun getPersonalizedTips(familyMemberId: String): Resource<List<Tip>> {
        val res = safeApiCall { tipsApi.getPersonalizedTips(familyMemberId) }
        return when (res) {
            is Resource.Success -> {
                val domainList = res.data.map { Tip(it.id, it.category, it.title, it.content, it.illustrationUrl) }
                Resource.Success(domainList)
            }
            is Resource.Error -> Resource.Error(res.exception, res.message)
            is Resource.Loading -> Resource.Loading
        }
    }

    override fun getBookmarkedTips(): Flow<Resource<List<Tip>>> {
        return bookmarkedTipDao.getAll().map { list ->
            val domainList = list.map { Tip(it.id, it.category, it.title, it.content, it.illustrationUrl) }
            Resource.Success(domainList) as Resource<List<Tip>>
        }.catch { emit(Resource.Error(it)) }
    }

    override suspend fun toggleBookmark(tip: Tip): Resource<Unit> {
        return try {
            val exists = bookmarkedTipDao.isBookmarked(tip.id)
            if (exists) {
                bookmarkedTipDao.deleteById(tip.id)
            } else {
                bookmarkedTipDao.insert(
                    BookmarkedTipEntity(tip.id, tip.category, tip.title, tip.content, tip.illustrationUrl)
                )
            }
            Resource.Success(Unit)
        } catch (e: Exception) {
            Resource.Error(e, e.localizedMessage)
        }
    }

    override fun isTipBookmarked(tipId: String): Flow<Boolean> {
        return bookmarkedTipDao.isBookmarkedFlow(tipId)
    }
}
