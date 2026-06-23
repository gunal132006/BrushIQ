package com.brushiq.di

import com.brushiq.data.repository.*
import com.brushiq.domain.repository.*
import dagger.Binds
import dagger.Module
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
abstract class RepositoryModule {

    @Binds
    @Singleton
    abstract fun bindBrushIQRepository(
        impl: BrushIQRepositoryImpl
    ): BrushIQRepository

    @Binds
    @Singleton
    abstract fun bindAuthRepository(
        impl: AuthRepositoryImpl
    ): AuthRepository

    @Binds
    @Singleton
    abstract fun bindFamilyRepository(
        impl: FamilyRepositoryImpl
    ): FamilyRepository

    @Binds
    @Singleton
    abstract fun bindToothbrushRepository(
        impl: ToothbrushRepositoryImpl
    ): ToothbrushRepository

    @Binds
    @Singleton
    abstract fun bindScanRepository(
        impl: ScanRepositoryImpl
    ): ScanRepository

    @Binds
    @Singleton
    abstract fun bindTipsRepository(
        impl: TipsRepositoryImpl
    ): TipsRepository

    @Binds
    @Singleton
    abstract fun bindProfileRepository(
        impl: ProfileRepositoryImpl
    ): ProfileRepository
}
