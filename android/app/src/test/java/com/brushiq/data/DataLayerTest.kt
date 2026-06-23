package com.brushiq.data

import com.brushiq.domain.repository.User
import com.brushiq.domain.repository.FamilyMember
import com.brushiq.domain.repository.Toothbrush
import com.brushiq.domain.repository.ScanReport
import com.brushiq.data.local.UserEntity
import com.brushiq.data.local.FamilyMemberEntity
import com.brushiq.data.local.ToothbrushEntity
import com.brushiq.data.local.ScanEntity
import org.junit.Assert.assertEquals
import org.junit.Test

class DataLayerTest {

    @Test
    fun testUserEntityMapping() {
        val entity = UserEntity(
            id = "user123",
            fullName = "John Doe",
            email = "john@example.com",
            phone = "1234567890",
            createdAt = "2026-06-18"
        )
        
        val domain = User(
            id = entity.id,
            fullName = entity.fullName,
            email = entity.email,
            phone = entity.phone,
            createdAt = entity.createdAt
        )

        assertEquals("user123", domain.id)
        assertEquals("John Doe", domain.fullName)
        assertEquals("john@example.com", domain.email)
    }

    @Test
    fun testFamilyMemberMapping() {
        val entity = FamilyMemberEntity(
            id = "mem1",
            name = "Jane Doe",
            age = 12,
            gender = "Female",
            relationship = "Daughter",
            profilePhotoUrl = null,
            toothbrushId = "brush1",
            toothbrushBrand = "BrandA",
            toothbrushModel = "ModelX",
            toothbrushType = "Sonic",
            toothbrushPurchaseDate = "2026-01-01",
            healthScore = 88.0,
            toothbrushCondition = "Good",
            lastScanDate = "2026-06-18"
        )

        val domain = FamilyMember(
            entity.id, entity.name, entity.age, entity.gender, entity.relationship, entity.profilePhotoUrl,
            entity.toothbrushId, entity.toothbrushBrand, entity.toothbrushModel, entity.toothbrushType, entity.toothbrushPurchaseDate,
            entity.healthScore, entity.toothbrushCondition, entity.lastScanDate
        )

        assertEquals("mem1", domain.id)
        assertEquals("Jane Doe", domain.name)
        assertEquals(88.0, domain.healthScore)
    }

    @Test
    fun testToothbrushMapping() {
        val entity = ToothbrushEntity(
            id = "brush1",
            familyMemberId = "mem1",
            brand = "BrandA",
            model = "ModelX",
            color = "Blue",
            type = "Sonic",
            purchaseDate = "2026-01-01",
            memberName = "Jane Doe"
        )

        val domain = Toothbrush(
            entity.id, entity.familyMemberId, entity.brand, entity.model, entity.color, entity.type, entity.purchaseDate, entity.memberName
        )

        assertEquals("brush1", domain.id)
        assertEquals("BrandA", domain.brand)
    }

    @Test
    fun testScanEntityMapping() {
        val entity = ScanEntity(
            id = "scan1",
            toothbrushId = "brush1",
            imageUrl = "http://localhost/scan1.jpg",
            wearPercentage = 15.0,
            healthScore = 85.0,
            remainingLifeDays = 75,
            condition = "Good",
            confidenceScore = 96.0,
            bristleSpreading = 0.1,
            bristleBending = 0.05,
            bristleDamage = 0.0,
            brushingFrequency = "Daily",
            detectedIssues = listOf("Bristle Spreading"),
            aiRecommendation = "Everything looks good, continue brushing.",
            scanDate = "2026-06-18"
        )

        val domain = ScanReport(
            entity.id, entity.toothbrushId, entity.imageUrl, entity.wearPercentage, entity.healthScore,
            entity.remainingLifeDays, entity.condition, entity.confidenceScore, entity.bristleSpreading,
            entity.bristleBending, entity.bristleDamage, entity.brushingFrequency,
            entity.detectedIssues, entity.aiRecommendation, entity.scanDate
        )

        assertEquals("scan1", domain.id)
        assertEquals("Bristle Spreading", domain.detectedIssues[0])
    }
}
