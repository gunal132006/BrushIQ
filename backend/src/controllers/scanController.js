const path = require('path');
const fs = require('fs');
const db = require('../config/db');
const { analyzeToothbrushImage } = require('../services/ai/analyzer');

// Multer is configured in routes, this controller handles request processing

exports.analyzeScan = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      code: 'TOOTHBRUSH_NOT_DETECTED',
      message: 'Toothbrush not detected. Please scan only a single toothbrush.'
    });
  }

  try {
    const filePath = req.file.path;
    const relativeUrl = `/uploads/${req.file.filename}`;

    // Perform AI Analysis using the analyzer service
    const analysisResult = await analyzeToothbrushImage(filePath);

    res.json({
      imageUrl: relativeUrl,
      ...analysisResult,
    });
  } catch (err) {
    console.error('[AI VALIDATION] Error in scan analysis:', err.message);

    if (err.message && err.message.startsWith('TOOTHBRUSH_NOT_DETECTED:')) {
      return res.status(400).json({
        code: 'TOOTHBRUSH_NOT_DETECTED',
        message: 'Toothbrush not detected. Please scan only a single toothbrush.'
      });
    }

    if (err.message && err.message.startsWith('MULTIPLE_TOOTHBRUSHES:')) {
      return res.status(400).json({
        code: 'MULTIPLE_TOOTHBRUSHES',
        message: 'Multiple toothbrushes detected. Please scan a single toothbrush.'
      });
    }

    if (err.message && err.message.startsWith('CV_ERROR:')) {
      return res.status(400).json({
        code: 'IMAGE_QUALITY_ERROR',
        message: err.message.substring(9)
      });
    }

    res.status(500).json({ message: 'Error processing toothbrush scan' });
  }
};

exports.saveScan = async (req, res) => {
  const {
    toothbrushId: inputToothbrushId,
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

  console.log('[SAVE REPORT] request received:');
  console.log('  userId:', req.user ? req.user.id : 'UNAUTHENTICATED');
  console.log('  inputToothbrushId:', inputToothbrushId || '(none)');
  console.log('  imageUrl:', imageUrl || '(none)');
  console.log('  wearPercentage:', wearPercentage);
  console.log('  healthScore:', healthScore);

  if (!imageUrl) {
    console.log('[SAVE REPORT] validation result: FAILED (missing imageUrl)');
    return res.status(400).json({ message: 'Missing required scan image URL' });
  }

  try {
    let toothbrushId = inputToothbrushId;
    let familyMemberId = null;

    // 1. Verify input toothbrushId if provided
    if (toothbrushId && toothbrushId.trim() !== '') {
      const checkBrush = await db.query(
        `SELECT t.id, t.family_member_id FROM toothbrushes t
         JOIN family_members f ON t.family_member_id = f.id
         WHERE t.id = $1 AND f.user_id = $2`,
        [toothbrushId, req.user.id]
      );

      if (checkBrush.rows.length > 0) {
        familyMemberId = checkBrush.rows[0].family_member_id;
      } else {
        console.log(`[SAVE REPORT] Provided toothbrushId ${toothbrushId} not found for user. Finding fallback.`);
        toothbrushId = null;
      }
    }

    // 2. Fallback: Lookup any existing toothbrush for user if input was missing or invalid
    if (!toothbrushId) {
      const existingBrush = await db.query(
        `SELECT t.id, t.family_member_id FROM toothbrushes t
         JOIN family_members f ON t.family_member_id = f.id
         WHERE f.user_id = $1
         ORDER BY t.created_at ASC LIMIT 1`,
        [req.user.id]
      );

      if (existingBrush.rows.length > 0) {
        toothbrushId = existingBrush.rows[0].id;
        familyMemberId = existingBrush.rows[0].family_member_id;
        console.log(`[SAVE REPORT] Auto-selected existing user toothbrushId: ${toothbrushId}`);
      } else {
        // 3. Auto-create primary family member and toothbrush if user has none
        console.log('[SAVE REPORT] User has no family member/toothbrush. Auto-creating defaults.');
        let memberRes = await db.query(
          `SELECT id FROM family_members WHERE user_id = $1 ORDER BY created_at ASC LIMIT 1`,
          [req.user.id]
        );
        
        if (memberRes.rows.length === 0) {
          memberRes = await db.query(
            `INSERT INTO family_members (user_id, name, age, gender, relationship)
             VALUES ($1, 'Primary Member', 25, 'Unspecified', 'Self')
             RETURNING id`,
            [req.user.id]
          );
        }
        familyMemberId = memberRes.rows[0].id;

        const newBrushRes = await db.query(
          `INSERT INTO toothbrushes (family_member_id, brand, model, color, type, purchase_date)
           VALUES ($1, 'Oral-B', 'Pro Series', 'Blue', 'Electric', CURRENT_DATE)
           RETURNING id`,
          [familyMemberId]
        );
        toothbrushId = newBrushRes.rows[0].id;
        console.log(`[SAVE REPORT] Created default toothbrushId: ${toothbrushId} for familyMemberId: ${familyMemberId}`);
      }
    }

    // Sanitize numerical metrics to prevent PostgreSQL NOT NULL or NaN violations
    const safeWearPercentage = Number.isFinite(Number(wearPercentage)) ? Number(wearPercentage) : 0.0;
    const safeHealthScore = Number.isFinite(Number(healthScore)) ? Number(healthScore) : 100.0;
    const safeRemainingLifeDays = (remainingLifeDays !== undefined && remainingLifeDays !== null && Number.isInteger(Number(remainingLifeDays)))
      ? Number(remainingLifeDays)
      : Math.max(1, Math.round((safeHealthScore / 100) * 90));
    const safeCondition = condition || (safeHealthScore >= 80 ? 'Good' : safeHealthScore >= 50 ? 'Moderate Wear' : safeHealthScore >= 30 ? 'Replace Soon' : 'Replace Immediately');
    const safeConfidenceScore = Number.isFinite(Number(confidenceScore)) ? Number(confidenceScore) : 95.0;
    const safeBristleSpreading = Number.isFinite(Number(bristleSpreading)) ? Number(bristleSpreading) : 0.0;
    const safeBristleBending = Number.isFinite(Number(bristleBending)) ? Number(bristleBending) : 0.0;
    const safeBristleDamage = Number.isFinite(Number(bristleDamage)) ? Number(bristleDamage) : 0.0;
    const safeBrushingFrequency = brushingFrequency || '2x daily';
    const safeDetectedIssues = Array.isArray(detectedIssues) ? detectedIssues : [];
    const safeAiRecommendation = aiRecommendation || 'Routine check recommended. Maintain proper 2-minute brushing twice daily.';

    console.log('[SAVE REPORT] validation result: PASSED');
    console.log('[SAVE REPORT] final parameters:', {
      toothbrushId,
      familyMemberId,
      imageUrl,
      wearPercentage: safeWearPercentage,
      healthScore: safeHealthScore,
      remainingLifeDays: safeRemainingLifeDays,
      condition: safeCondition,
      confidenceScore: safeConfidenceScore
    });

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
        safeWearPercentage,
        safeHealthScore,
        safeRemainingLifeDays,
        safeCondition,
        safeConfidenceScore,
        safeBristleSpreading,
        safeBristleBending,
        safeBristleDamage,
        safeBrushingFrequency,
        safeDetectedIssues,
        safeAiRecommendation,
      ]
    );

    const savedScan = result.rows[0];
    console.log('[SAVE REPORT] database result: SUCCESS');
    console.log('[SAVE REPORT] saved record ID:', savedScan.id);

    // Auto-create/update reminder
    let reminderType = 'Weekly';
    let nextDays = 7;
    let reminderMessage = 'Keep up the good work! Time for your weekly toothbrush hygiene check-in.';

    if (safeCondition === 'Moderate Wear') {
      reminderType = 'Every 3 Days';
      nextDays = 3;
      reminderMessage = 'Your brush is showing moderate wear. Check your bristle condition again in 3 days.';
    } else if (safeCondition === 'Replace Soon' || safeCondition === 'Replace Immediately') {
      reminderType = 'Daily';
      nextDays = 1;
      reminderMessage = `ALERT: Your toothbrush is in "${safeCondition}" condition. Please replace it to maintain proper oral hygiene.`;
    }

    const nextReminderDate = new Date();
    nextReminderDate.setDate(nextReminderDate.getDate() + nextDays);

    await db.query(
      'UPDATE reminders SET is_completed = TRUE WHERE toothbrush_id = $1 AND is_completed = FALSE',
      [toothbrushId]
    );

    if (familyMemberId) {
      await db.query(
        `INSERT INTO reminders (family_member_id, toothbrush_id, scan_id, type, next_reminder_date, message)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [familyMemberId, toothbrushId, savedScan.id, reminderType, nextReminderDate, reminderMessage]
      );
    }

    res.status(201).json(savedScan);
  } catch (err) {
    console.error('[SAVE REPORT] database result: ERROR', err);
    res.status(500).json({ message: 'Server error saving scan result', error: err.message });
  }
};

exports.getScansHistory = async (req, res) => {
  const { toothbrushId } = req.query;

  try {
    let query = `
      SELECT s.id, s.toothbrush_id as "toothbrushId", s.image_url as "imageUrl", 
             s.wear_percentage as "wearPercentage", s.health_score as "healthScore", 
             s.remaining_life_days as "remainingLifeDays", s.condition, s.confidence_score as "confidenceScore",
             s.bristle_spreading as "bristleSpreading", s.bristle_bending as "bristleBending", 
             s.bristle_damage as "bristleDamage", s.brushing_frequency as "brushingFrequency",
             s.detected_issues as "detectedIssues", s.ai_recommendation as "aiRecommendation", 
             s.scan_date as "scanDate"
      FROM scans s
      JOIN toothbrushes t ON s.toothbrush_id = t.id
      JOIN family_members f ON t.family_member_id = f.id
      WHERE f.user_id = $1
    `;
    const params = [req.user.id];

    if (toothbrushId && toothbrushId.trim() !== '') {
      query += ` AND s.toothbrush_id = $2`;
      params.push(toothbrushId);
    }

    query += ` ORDER BY s.scan_date DESC`;

    const result = await db.query(query, params);
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

