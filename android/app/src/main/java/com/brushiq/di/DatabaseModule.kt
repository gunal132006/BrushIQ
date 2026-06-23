package com.brushiq.di

import android.content.Context
import androidx.room.Room
import com.brushiq.data.local.BrushIQDatabase
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object DatabaseModule {

    @Provides
    @Singleton
    fun provideAppDatabase(@ApplicationContext context: Context): BrushIQDatabase {
        return Room.databaseBuilder(
            context,
            BrushIQDatabase::class.java,
            "brushiq_db"
        ).fallbackToDestructiveMigration().build()
    }

    @Provides
    fun provideUserDao(database: BrushIQDatabase) = database.userDao()

    @Provides
    fun provideScanDao(database: BrushIQDatabase) = database.scanDao()

    @Provides
    fun provideToothbrushDao(database: BrushIQDatabase) = database.toothbrushDao()

    @Provides
    fun provideFamilyMemberDao(database: BrushIQDatabase) = database.familyMemberDao()

    @Provides
    fun provideReminderDao(database: BrushIQDatabase) = database.reminderDao()

    @Provides
    fun provideTipDao(database: BrushIQDatabase) = database.tipDao()

    @Provides
    fun provideBookmarkedTipDao(database: BrushIQDatabase) = database.bookmarkedTipDao()
}
