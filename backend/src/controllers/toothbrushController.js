const db = require('../config/db');

exports.getToothbrushes = async (req, res) => {
  const { familyMemberId } = req.query;

  try {
    let result;
    if (familyMemberId) {
      // Fetch toothbrushes for a specific family member (validating family member belongs to user)
      result = await db.query(
        `SELECT t.id, t.family_member_id as "familyMemberId", t.brand, t.model, t.color, t.type, 
                t.purchase_date as "purchaseDate", t.created_at as "createdAt"
         FROM toothbrushes t
         JOIN family_members f ON t.family_member_id = f.id
         WHERE f.user_id = $1 AND t.family_member_id = $2
         ORDER BY t.created_at DESC`,
        [req.user.id, familyMemberId]
      );
    } else {
      // Fetch all toothbrushes across all family members of this user
      result = await db.query(
        `SELECT t.id, t.family_member_id as "familyMemberId", t.brand, t.model, t.color, t.type, 
                t.purchase_date as "purchaseDate", t.created_at as "createdAt", f.name as "memberName"
         FROM toothbrushes t
         JOIN family_members f ON t.family_member_id = f.id
         WHERE f.user_id = $1
         ORDER BY t.created_at DESC`,
        [req.user.id]
      );
    }

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching toothbrushes:', err.message);
    res.status(500).json({ message: 'Server error fetching toothbrush data' });
  }
};

exports.addToothbrush = async (req, res) => {
  const { familyMemberId, brand, model, color, type, purchaseDate } = req.body;

  if (!familyMemberId || !brand || !model || !color || !type || !purchaseDate) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    // Validate family member ownership
    const checkMember = await db.query(
      'SELECT id FROM family_members WHERE id = $1 AND user_id = $2',
      [familyMemberId, req.user.id]
    );

    if (checkMember.rows.length === 0) {
      return res.status(404).json({ message: 'Family member profile not found' });
    }

    const result = await db.query(
      `INSERT INTO toothbrushes (family_member_id, brand, model, color, type, purchase_date)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, family_member_id as "familyMemberId", brand, model, color, type, 
                 purchase_date as "purchaseDate", created_at as "createdAt"`,
      [familyMemberId, brand, model, color, type, purchaseDate]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error adding toothbrush:', err.message);
    res.status(500).json({ message: 'Server error creating toothbrush record' });
  }
};

exports.updateToothbrush = async (req, res) => {
  const { id } = req.params;
  const { brand, model, color, type, purchaseDate } = req.body;

  if (!brand || !model || !color || !type || !purchaseDate) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    // Verify toothbrush belongs to a family member owned by the user
    const checkBrush = await db.query(
      `SELECT t.id FROM toothbrushes t
       JOIN family_members f ON t.family_member_id = f.id
       WHERE t.id = $1 AND f.user_id = $2`,
      [id, req.user.id]
    );

    if (checkBrush.rows.length === 0) {
      return res.status(404).json({ message: 'Toothbrush not found or access denied' });
    }

    const result = await db.query(
      `UPDATE toothbrushes
       SET brand = $1, model = $2, color = $3, type = $4, purchase_date = $5, updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING id, family_member_id as "familyMemberId", brand, model, color, type, 
                 purchase_date as "purchaseDate", updated_at as "updatedAt"`,
      [brand, model, color, type, purchaseDate, id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating toothbrush:', err.message);
    res.status(500).json({ message: 'Server error updating toothbrush record' });
  }
};

exports.deleteToothbrush = async (req, res) => {
  const { id } = req.params;

  try {
    // Verify toothbrush belongs to user
    const checkBrush = await db.query(
      `SELECT t.id FROM toothbrushes t
       JOIN family_members f ON t.family_member_id = f.id
       WHERE t.id = $1 AND f.user_id = $2`,
      [id, req.user.id]
    );

    if (checkBrush.rows.length === 0) {
      return res.status(404).json({ message: 'Toothbrush not found or access denied' });
    }

    await db.query('DELETE FROM toothbrushes WHERE id = $1', [id]);

    res.json({ message: 'Toothbrush removed successfully' });
  } catch (err) {
    console.error('Error deleting toothbrush:', err.message);
    res.status(500).json({ message: 'Server error removing toothbrush record' });
  }
};
