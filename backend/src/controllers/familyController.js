const db = require('../config/db');

exports.getFamilyMembers = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT 
         f.id, 
         f.name, 
         f.age, 
         f.gender, 
         f.relationship, 
         f.profile_photo_url as "profilePhotoUrl", 
         f.created_at as "createdAt",
         t.id as "toothbrushId",
         t.brand as "toothbrushBrand",
         t.model as "toothbrushModel",
         t.color as "toothbrushColor",
         t.type as "toothbrushType",
         t.purchase_date as "toothbrushPurchaseDate",
         s.health_score as "healthScore",
         s.condition as "toothbrushCondition",
         s.scan_date as "lastScanDate"
       FROM family_members f
       LEFT JOIN LATERAL (
         SELECT id, brand, model, color, type, purchase_date
         FROM toothbrushes
         WHERE family_member_id = f.id
         ORDER BY created_at DESC
         LIMIT 1
       ) t ON TRUE
       LEFT JOIN LATERAL (
         SELECT health_score, condition, scan_date
         FROM scans
         WHERE toothbrush_id = t.id
         ORDER BY scan_date DESC
         LIMIT 1
       ) s ON TRUE
       WHERE f.user_id = $1
       ORDER BY f.created_at ASC`,
      [req.user.id]
    );

    const formattedRows = result.rows.map(row => ({
      ...row,
      healthScore: row.healthScore ? parseFloat(row.healthScore) : null
    }));

    // Retrieve global count of toothbrushes for this user's family members
    const toothbrushCountRes = await db.query(
      `SELECT count(*)::int as count 
       FROM toothbrushes t 
       JOIN family_members f ON t.family_member_id = f.id 
       WHERE f.user_id = $1`, 
      [req.user.id]
    );
    const toothbrushCount = toothbrushCountRes.rows[0].count;
    const familyMemberCount = formattedRows.length;
    const assignedToothbrushCount = formattedRows.filter(r => r.toothbrushId).length;
    const missingAssignments = familyMemberCount - assignedToothbrushCount;

    console.log('=============================================');
    console.log('      BUSHIQ SERVER FAMILY DIAGNOSTICS      ');
    console.log('=============================================');
    console.log(`Authenticated User ID:     ${req.user.id}`);
    console.log(`Family Member Count:       ${familyMemberCount}`);
    console.log(`Toothbrush Count:          ${toothbrushCount}`);
    console.log(`Assigned Toothbrush Count: ${assignedToothbrushCount}`);
    console.log(`Missing Assignments:       ${missingAssignments}`);
    if (missingAssignments > 0) {
      const missingNames = formattedRows.filter(r => !r.toothbrushId).map(r => r.name).join(', ');
      console.log(`Members Missing Brushes:   ${missingNames}`);
    }
    console.log('=============================================');

    res.json(formattedRows);
  } catch (err) {
    console.error('Error fetching family members:', err.message);
    res.status(500).json({ message: 'Server error fetching family profiles' });
  }
};


exports.addFamilyMember = async (req, res) => {
  const { name, age, gender, relationship, profilePhotoUrl } = req.body;

  if (!name || age === undefined || !gender || !relationship) {
    return res.status(400).json({ message: 'Name, age, gender, and relationship are required' });
  }

  try {
    const result = await db.query(
      `INSERT INTO family_members (user_id, name, age, gender, relationship, profile_photo_url) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING id, name, age, gender, relationship, profile_photo_url as "profilePhotoUrl", created_at as "createdAt"`,
      [req.user.id, name, parseInt(age), gender, relationship, profilePhotoUrl || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error adding family member:', err.message);
    res.status(500).json({ message: 'Server error creating family profile' });
  }
};

exports.updateFamilyMember = async (req, res) => {
  const { id } = req.params;
  const { name, age, gender, relationship, profilePhotoUrl } = req.body;

  if (!name || age === undefined || !gender || !relationship) {
    return res.status(400).json({ message: 'Name, age, gender, and relationship are required' });
  }

  try {
    // Ensure the profile belongs to the authenticated user
    const checkProfile = await db.query(
      'SELECT id FROM family_members WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (checkProfile.rows.length === 0) {
      return res.status(404).json({ message: 'Family member profile not found or access denied' });
    }

    const result = await db.query(
      `UPDATE family_members 
       SET name = $1, age = $2, gender = $3, relationship = $4, profile_photo_url = $5, updated_at = CURRENT_TIMESTAMP
       WHERE id = $6 AND user_id = $7
       RETURNING id, name, age, gender, relationship, profile_photo_url as "profilePhotoUrl", updated_at as "updatedAt"`,
      [name, parseInt(age), gender, relationship, profilePhotoUrl || null, id, req.user.id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating family member:', err.message);
    res.status(500).json({ message: 'Server error updating family profile' });
  }
};

exports.deleteFamilyMember = async (req, res) => {
  const { id } = req.params;

  try {
    // Ensure the profile belongs to the authenticated user
    const checkProfile = await db.query(
      'SELECT id FROM family_members WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (checkProfile.rows.length === 0) {
      return res.status(404).json({ message: 'Family member profile not found or access denied' });
    }

    await db.query(
      'DELETE FROM family_members WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    res.json({ message: 'Family member profile deleted successfully' });
  } catch (err) {
    console.error('Error deleting family member:', err.message);
    res.status(500).json({ message: 'Server error deleting family profile' });
  }
};
