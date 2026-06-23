const db = require('../config/db');

exports.getDashboardData = async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Total Family Members
    const membersCountRes = await db.query(
      'SELECT COUNT(*)::int as count FROM family_members WHERE user_id = $1',
      [userId]
    );
    const totalMembers = membersCountRes.rows[0].count;

    // 2. Total Toothbrushes
    const toothbrushesCountRes = await db.query(
      `SELECT COUNT(*)::int as count 
       FROM toothbrushes t
       JOIN family_members f ON t.family_member_id = f.id
       WHERE f.user_id = $1`,
      [userId]
    );
    const totalToothbrushes = toothbrushesCountRes.rows[0].count;

    // 3. Average Health Score (from the latest scan of each scanned toothbrush)
    const avgHealthRes = await db.query(
      `WITH latest_scans AS (
         SELECT DISTINCT ON (s.toothbrush_id) s.health_score
         FROM scans s
         JOIN toothbrushes t ON s.toothbrush_id = t.id
         JOIN family_members f ON t.family_member_id = f.id
         WHERE f.user_id = $1
         ORDER BY s.toothbrush_id, s.scan_date DESC
       )
       SELECT AVG(health_score)::numeric(5,1) as avg_health
       FROM latest_scans`,
      [userId]
    );
    const avgHealthScore = avgHealthRes.rows[0].avg_health ? parseFloat(avgHealthRes.rows[0].avg_health) : 100.0;

    // 4. Pending Replacements
    // A toothbrush is pending replacement if its latest scan condition is 'Replace Soon' or 'Replace Immediately'
    // OR if it has been used for more than 90 days and has never been scanned.
    const pendingReplacementsRes = await db.query(
      `WITH latest_scans AS (
         SELECT DISTINCT ON (s.toothbrush_id) s.condition, s.toothbrush_id
         FROM scans s
         JOIN toothbrushes t ON s.toothbrush_id = t.id
         JOIN family_members f ON t.family_member_id = f.id
         WHERE f.user_id = $1
         ORDER BY s.toothbrush_id, s.scan_date DESC
       ),
       scanned_pending AS (
         SELECT toothbrush_id FROM latest_scans WHERE condition IN ('Replace Soon', 'Replace Immediately')
       ),
       unscanned_old AS (
         SELECT t.id 
         FROM toothbrushes t
         JOIN family_members f ON t.family_member_id = f.id
         LEFT JOIN scans s ON s.toothbrush_id = t.id
         WHERE f.user_id = $1 
           AND s.id IS NULL 
           AND t.purchase_date <= CURRENT_DATE - INTERVAL '90 days'
       )
       SELECT (SELECT COUNT(*) FROM scanned_pending) + (SELECT COUNT(*) FROM unscanned_old) as count`,
      [userId]
    );
    const pendingReplacements = pendingReplacementsRes.rows[0].count;

    // 5. Recent Scans (last 5 scans)
    const recentScansRes = await db.query(
      `SELECT s.id, s.image_url as "imageUrl", s.wear_percentage as "wearPercentage", 
              s.health_score as "healthScore", s.condition, s.scan_date as "scanDate",
              t.brand, t.model, f.name as "memberName"
       FROM scans s
       JOIN toothbrushes t ON s.toothbrush_id = t.id
       JOIN family_members f ON t.family_member_id = f.id
       WHERE f.user_id = $1
       ORDER BY s.scan_date DESC
       LIMIT 5`,
      [userId]
    );
    const recentScans = recentScansRes.rows;

    res.json({
      totalMembers,
      totalToothbrushes,
      avgHealthScore,
      pendingReplacements,
      recentScans,
    });

  } catch (err) {
    console.error('Error fetching dashboard stats:', err.message);
    res.status(500).json({ message: 'Server error compiling dashboard metrics' });
  }
};
