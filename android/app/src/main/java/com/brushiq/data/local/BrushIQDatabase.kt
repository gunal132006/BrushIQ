package com.brushiq.data.local

import androidx.room.*
import kotlinx.coroutines.flow.Flow

// ------------------------------------
// Entities
// ------------------------------------

@Entity(tableName = "users")
data class UserEntity(
    @PrimaryKey val id: String,
    val fullName: String,
    val email: String?,
    val phone: String?,
    val createdAt: String
)

@Entity(tableName = "family_members")
data class FamilyMemberEntity(
    @PrimaryKey val id: String,
    val name: String,
    val age: Int,
    val gender: String,
    val relationship: String,
    val profilePhotoUrl: String?,
    val toothbrushId: String?,
    val toothbrushBrand: String?,
    val toothbrushModel: String?,
    val toothbrushType: String?,
    val toothbrushPurchaseDate: String?,
    val healthScore: Double?,
    val toothbrushCondition: String?,
    val lastScanDate: String?
)

@Entity(tableName = "toothbrushes")
data class ToothbrushEntity(
    @PrimaryKey val id: String,
    val familyMemberId: String,
    val brand: String,
    val model: String,
    val color: String,
    val type: String,
    val purchaseDate: String,
    val memberName: String?
)

@Entity(tableName = "scans")
data class ScanEntity(
    @PrimaryKey val id: String,
    val toothbrushId: String,
    val imageUrl: String,
    val wearPercentage: Double,
    val healthScore: Double,
    val remainingLifeDays: Int,
    val condition: String,
    val confidenceScore: Double,
    val bristleSpreading: Double,
    val bristleBending: Double,
    val bristleDamage: Double,
    val brushingFrequency: String,
    val detectedIssues: List<String>, // Stored as JSON using TypeConverter
    val aiRecommendation: String,
    val scanDate: String
)

@Entity(tableName = "reminders")
data class ReminderEntity(
    @PrimaryKey val id: String,
    val familyMemberId: String,
    val toothbrushId: String,
    val scanId: String?,
    val type: String,
    val nextReminderDate: String,
    val message: String,
    val isCompleted: Boolean,
    val memberName: String?,
    val toothbrushBrand: String?,
    val toothbrushModel: String?
)

@Entity(tableName = "tips")
data class TipEntity(
    @PrimaryKey val id: String,
    val category: String,
    val title: String,
    val content: String,
    val illustrationUrl: String?
)

@Entity(tableName = "bookmarked_tips")
data class BookmarkedTipEntity(
    @PrimaryKey val id: String,
    val category: String,
    val title: String,
    val content: String,
    val illustrationUrl: String?
)

// ------------------------------------
// DAOs
// ------------------------------------

@Dao
interface UserDao {
    @Query("SELECT * FROM users LIMIT 1")
    fun getUserFlow(): Flow<UserEntity?>

    @Query("SELECT * FROM users LIMIT 1")
    suspend fun getUser(): UserEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(user: UserEntity)

    @Query("DELETE FROM users")
    suspend fun clear()
}

@Dao
interface FamilyMemberDao {
    @Query("SELECT * FROM family_members")
    fun getAll(): Flow<List<FamilyMemberEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(members: List<FamilyMemberEntity>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(member: FamilyMemberEntity)

    @Query("DELETE FROM family_members WHERE id = :id")
    suspend fun deleteById(id: String)

    @Query("DELETE FROM family_members")
    suspend fun clearAll()
}

@Dao
interface ToothbrushDao {
    @Query("SELECT * FROM toothbrushes")
    fun getAll(): Flow<List<ToothbrushEntity>>

    @Query("SELECT * FROM toothbrushes WHERE familyMemberId = :familyMemberId")
    fun getByMember(familyMemberId: String): Flow<List<ToothbrushEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(brushes: List<ToothbrushEntity>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(brush: ToothbrushEntity)

    @Query("DELETE FROM toothbrushes WHERE id = :id")
    suspend fun deleteById(id: String)

    @Query("DELETE FROM toothbrushes")
    suspend fun clearAll()
}

@Dao
interface ScanDao {
    @Query("SELECT * FROM scans WHERE toothbrushId = :toothbrushId ORDER BY scanDate DESC")
    fun getByToothbrush(toothbrushId: String): Flow<List<ScanEntity>>

    @Query("SELECT * FROM scans WHERE id = :id")
    suspend fun getById(id: String): ScanEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(scans: List<ScanEntity>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(scan: ScanEntity)

    @Query("DELETE FROM scans")
    suspend fun clearAll()
}

@Dao
interface ReminderDao {
    @Query("SELECT * FROM reminders WHERE isCompleted = 0 ORDER BY nextReminderDate ASC")
    fun getActive(): Flow<List<ReminderEntity>>

    @Query("SELECT * FROM reminders WHERE familyMemberId = :familyMemberId AND isCompleted = 0 ORDER BY nextReminderDate ASC")
    fun getActiveByMember(familyMemberId: String): Flow<List<ReminderEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(reminders: List<ReminderEntity>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(reminder: ReminderEntity)

    @Query("UPDATE reminders SET isCompleted = 1 WHERE id = :id")
    suspend fun markAsCompleted(id: String)

    @Query("DELETE FROM reminders")
    suspend fun clearAll()
}

@Dao
interface TipDao {
    @Query("SELECT * FROM tips")
    fun getAll(): Flow<List<TipEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(tips: List<TipEntity>)

    @Query("DELETE FROM tips")
    suspend fun clearAll()
}

@Dao
interface BookmarkedTipDao {
    @Query("SELECT * FROM bookmarked_tips")
    fun getAll(): Flow<List<BookmarkedTipEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(tip: BookmarkedTipEntity)

    @Query("DELETE FROM bookmarked_tips WHERE id = :id")
    suspend fun deleteById(id: String)

    @Query("SELECT EXISTS(SELECT 1 FROM bookmarked_tips WHERE id = :id)")
    suspend fun isBookmarked(id: String): Boolean

    @Query("SELECT EXISTS(SELECT 1 FROM bookmarked_tips WHERE id = :id)")
    fun isBookmarkedFlow(id: String): Flow<Boolean>
}

// ------------------------------------
// Database Wrapper
// ------------------------------------

@Database(
    entities = [
        UserEntity::class,
        FamilyMemberEntity::class,
        ToothbrushEntity::class,
        ScanEntity::class,
        ReminderEntity::class,
        TipEntity::class,
        BookmarkedTipEntity::class
    ],
    version = 3,
    exportSchema = false
)
@TypeConverters(Converters::class)
abstract class BrushIQDatabase : RoomDatabase() {
    abstract fun userDao(): UserDao
    abstract fun familyMemberDao(): FamilyMemberDao
    abstract fun toothbrushDao(): ToothbrushDao
    abstract fun scanDao(): ScanDao
    abstract fun reminderDao(): ReminderDao
    abstract fun tipDao(): TipDao
    abstract fun bookmarkedTipDao(): BookmarkedTipDao
}
