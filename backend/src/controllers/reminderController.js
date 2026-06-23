const db = require('../config/db');

exports.getReminders = async (req, res) => {
  const { familyMemberId } = req.query;

  try {
    let result;
    if (familyMemberId) {
      result = await db.query(
        `SELECT r.id, r.family_member_id as "familyMemberId", r.toothbrush_id as "toothbrushId", 
                r.scan_id as "scanId", r.type, r.next_reminder_date as "nextReminderDate", 
                r.message, r.is_completed as "isCompleted", r.created_at as "createdAt"
         FROM reminders r
         JOIN family_members f ON r.family_member_id = f.id
         WHERE f.user_id = $1 AND r.family_member_id = $2 AND r.is_completed = FALSE
         ORDER BY r.next_reminder_date ASC`,
        [req.user.id, familyMemberId]
      );
    } else {
      result = await db.query(
        `SELECT r.id, r.family_member_id as "familyMemberId", r.toothbrush_id as "toothbrushId", 
                r.scan_id as "scanId", r.type, r.next_reminder_date as "nextReminderDate", 
                r.message, r.is_completed as "isCompleted", r.created_at as "createdAt",
                f.name as "memberName", t.brand as "toothbrushBrand", t.model as "toothbrushModel"
         FROM reminders r
         JOIN family_members f ON r.family_member_id = f.id
         JOIN toothbrushes t ON r.toothbrush_id = t.id
         WHERE f.user_id = $1 AND r.is_completed = FALSE
         ORDER BY r.next_reminder_date ASC`,
        [req.user.id]
      );
    }

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching reminders:', err.message);
    res.status(500).json({ message: 'Server error fetching reminders' });
  }
};

exports.createReminder = async (req, res) => {
  const { familyMemberId, toothbrushId, type, nextReminderDate, message } = req.body;

  if (!familyMemberId || !toothbrushId || !type || !nextReminderDate || !message) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    // Validate family member and toothbrush ownership
    const checkOwnership = await db.query(
      `SELECT f.id FROM family_members f
       JOIN toothbrushes t ON t.family_member_id = f.id
       WHERE f.id = $1 AND t.id = $2 AND f.user_id = $3`,
      [familyMemberId, toothbrushId, req.user.id]
    );

    if (checkOwnership.rows.length === 0) {
      return res.status(404).json({ message: 'Invalid family member or toothbrush reference' });
    }

    const result = await db.query(
      `INSERT INTO reminders (family_member_id, toothbrush_id, type, next_reminder_date, message)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, family_member_id as "familyMemberId", toothbrush_id as "toothbrushId", 
                 type, next_reminder_date as "nextReminderDate", message, is_completed as "isCompleted"`,
      [familyMemberId, toothbrushId, type, nextReminderDate, message]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating reminder:', err.message);
    res.status(500).json({ message: 'Server error creating reminder' });
  }
};

exports.completeReminder = async (req, res) => {
  const { id } = req.params;

  try {
    // Verify ownership
    const checkReminder = await db.query(
      `SELECT r.id FROM reminders r
       JOIN family_members f ON r.family_member_id = f.id
       WHERE r.id = $1 AND f.user_id = $2`,
      [id, req.user.id]
    );

    if (checkReminder.rows.length === 0) {
      return res.status(404).json({ message: 'Reminder not found or access denied' });
    }

    const result = await db.query(
      `UPDATE reminders
       SET is_completed = TRUE, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING id, is_completed as "isCompleted", updated_at as "updatedAt"`,
      [id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error completing reminder:', err.message);
    res.status(500).json({ message: 'Server error completing reminder' });
  }
};
