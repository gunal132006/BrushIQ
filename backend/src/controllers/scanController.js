const path = require('path');
const fs = require('fs');
const db = require('../config/db');
const { analyzeToothbrushImage } = require('../services/ai/analyzer');

// Multer is configured in routes, this controller handles request processing

exports.analyzeScan = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No toothbrush image file uploaded' });
  }

  try {
    const filePath = req.file.path;
    // Format the URL path to be relative and accessible via static server
    const relativeUrl = `/uploads/${req.file.filename}`;

    // Perform AI Analysis using the analyzer service
    const analysisResult = await analyzeToothbrushImage(filePath);

    res.json({
      imageUrl: relativeUrl,
      ...analysisResult,
    });
  } catch (err) {
    console.error('Error in scan analysis:', err.message);
    res.status(500).json({ message: 'Error processing toothbrush scan' });
  }
};

exports.saveScan = async (req, res) => {
  const {
    toothbrushId,
    imageUrl,
    wearPercentage,
    healthScore,
    remainingLifeDays,
    condition,
    confidenceScore,
    bristleSpreading,
    bristleBending,
    bristleDamage,
    brushingFrequency,
    detectedIssues,
    aiRecommendation,
  } = req.body;

  if (!toothbrushId || !imageUrl || wearPercentage === undefined || healthScore === undefined) {
    return res.status(400).json({ message: 'Missing required scan metrics or toothbrush association' });
  }

  try {
    // Validate toothbrush ownership
    const checkBrush = await db.query(
      `SELECT t.id, t.family_member_id FROM toothbrushes t
       JOIN family_members f ON t.family_member_id = f.id
       WHERE t.id = $1 AND f.user_id = $2`,
      [toothbrushId, req.user.id]
    );

    if (checkBrush.rows.length === 0) {
      return res.status(404).json({ message: 'Toothbrush profile not found or access denied' });
    }

    const familyMemberId = checkBrush.rows[0].family_member_id;

    // Save scan to database
    const result = await db.query(
      `INSERT INTO scans (
        toothbrush_id, image_url, wear_percentage, health_score, remaining_life_days, 
        condition, confidence_score, bristle_spreading, bristle_bending, bristle_damage, 
        brushing_frequency, detected_issues, ai_recommendation
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING id, toothbrush_id as "toothbrushId", image_url as "imageUrl", 
                wear_percentage as "wearPercentage", health_score as "healthScore", 
                remaining_life_days as "remainingLifeDays", condition, confidence_score as "confidenceScore",
                bristle_spreading as "bristleSpreading", bristle_bending as "bristleBending", 
                bristle_damage as "bristleDamage", brushing_frequency as "brushingFrequency",
                detected_issues as "detectedIssues", ai_recommendation as "aiRecommendation", 
                scan_date as "scanDate"`,
      [
        toothbrushId,
        imageUrl,
        wearPercentage,
        healthScore,
        remainingLifeDays,
        condition,
        confidenceScore,
        bristleSpreading,
        bristleBending,
        bristleDamage,
        brushingFrequency || '2x daily',
        detectedIssues || [],
        aiRecommendation,
      ]
    );

    const savedScan = result.rows[0];

    // Trigger auto-creation of a reminder based on the toothbrush wear condition
    // Standard rule: 
    // Good: Weekly reminder
    // Moderate Wear: Every 3 Days reminder
    // Replace Soon / Replace Immediately: Daily reminder
    let reminderType = 'Weekly';
    let nextDays = 7;
    let reminderMessage = 'Keep up the good work! Time for your weekly toothbrush hygiene check-in.';

    if (condition === 'Moderate Wear') {
      reminderType = 'Every 3 Days';
      nextDays = 3;
      reminderMessage = 'Your brush is showing moderate wear. Check your bristle condition again in 3 days.';
    } else if (condition === 'Replace Soon' || condition === 'Replace Immediately') {
      reminderType = 'Daily';
      nextDays = 1;
      reminderMessage = `ALERT: Your toothbrush is in "${condition}" condition. Please replace it to maintain proper oral hygiene.`;
    }

    const nextReminderDate = new Date();
    nextReminderDate.setDate(nextReminderDate.getDate() + nextDays);

    // Delete any old pending reminders for this toothbrush to avoid duplicates
    await db.query(
      'UPDATE reminders SET is_completed = TRUE WHERE toothbrush_id = $1 AND is_completed = FALSE',
      [toothbrushId]
    );

    // Insert the new reminder
    await db.query(
      `INSERT INTO reminders (family_member_id, toothbrush_id, scan_id, type, next_reminder_date, message)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [familyMemberId, toothbrushId, savedScan.id, reminderType, nextReminderDate, reminderMessage]
    );

    res.status(201).json(savedScan);
  } catch (err) {
    console.error('Error saving scan:', err.message);
    res.status(500).json({ message: 'Server error saving scan result' });
  }
};

exports.getScansHistory = async (req, res) => {
  const { toothbrushId } = req.query;

  if (!toothbrushId) {
    return res.status(400).json({ message: 'toothbrushId parameter is required' });
  }

  try {
    // Validate toothbrush ownership
    const checkBrush = await db.query(
      `SELECT t.id FROM toothbrushes t
       JOIN family_members f ON t.family_member_id = f.id
       WHERE t.id = $1 AND f.user_id = $2`,
      [toothbrushId, req.user.id]
    );

    if (checkBrush.rows.length === 0) {
      return res.status(404).json({ message: 'Toothbrush not found or access denied' });
    }

    // Get scans ordered by date
    const result = await db.query(
      `SELECT id, toothbrush_id as "toothbrushId", image_url as "imageUrl", 
              wear_percentage as "wearPercentage", health_score as "healthScore", 
              remaining_life_days as "remainingLifeDays", condition, confidence_score as "confidenceScore",
              bristle_spreading as "bristleSpreading", bristle_bending as "bristleBending", 
              bristle_damage as "bristleDamage", brushing_frequency as "brushingFrequency",
              detected_issues as "detectedIssues", ai_recommendation as "aiRecommendation", 
              scan_date as "scanDate"
       FROM scans
       WHERE toothbrush_id = $1
       ORDER BY scan_date DESC`,
      [toothbrushId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching scans history:', err.message);
    res.status(500).json({ message: 'Server error fetching scan history' });
  }
};

exports.getScanById = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query(
      `SELECT s.id, s.toothbrush_id as "toothbrushId", s.image_url as "imageUrl", 
              s.wear_percentage as "wearPercentage", s.health_score as "healthScore", 
              s.remaining_life_days as "remainingLifeDays", s.condition, s.confidence_score as "confidenceScore",
              s.bristle_spreading as "bristleSpreading", s.bristle_bending as "bristleBending", 
              s.bristle_damage as "bristleDamage", s.brushing_frequency as "brushingFrequency",
              s.detected_issues as "detectedIssues", s.ai_recommendation as "aiRecommendation", 
              s.scan_date as "scanDate"
       FROM scans s
       JOIN toothbrushes t ON s.toothbrush_id = t.id
       JOIN family_members f ON t.family_member_id = f.id
       WHERE s.id = $1 AND f.user_id = $2`,
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Scan report not found or access denied' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching scan report:', err.message);
    res.status(500).json({ message: 'Server error fetching scan details' });
  }
};
