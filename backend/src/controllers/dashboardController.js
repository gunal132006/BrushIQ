const db = require('../config/db');

exports.getDashboardData = async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication token missing user context'
      }
    });
  }

  try {
    // 1. Total Family Members
    const membersCountRes = await db.query(
      'SELECT COUNT(*)::int as count FROM family_members WHERE user_id = $1',
      [userId]
    );
    const totalMembers = parseInt(membersCountRes.rows[0]?.count || 0, 10);

    // 2. Total Toothbrushes
    const toothbrushesCountRes = await db.query(
      `SELECT COUNT(*)::int as count 
       FROM toothbrushes t
       JOIN family_members f ON t.family_member_id = f.id
       WHERE f.user_id = $1`,
      [userId]
    );
    const totalToothbrushes = parseInt(toothbrushesCountRes.rows[0]?.count || 0, 10);

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
    const rawAvg = avgHealthRes.rows[0]?.avg_health;
    const avgHealthScore = rawAvg !== null && rawAvg !== undefined ? parseFloat(rawAvg) : 100.0;

    // 4. Pending Replacements
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
    const pendingReplacements = parseInt(pendingReplacementsRes.rows[0]?.count || 0, 10);

    // 5. Recent Scans (last 5 scans)
    const recentScansRes = await db.query(
      `SELECT s.id, s.image_url as "imageUrl", 
              s.wear_percentage::float as "wearPercentage", 
              s.health_score::float as "healthScore", 
              s.condition, s.scan_date as "scanDate",
              t.brand, t.model, f.name as "memberName"
       FROM scans s
       JOIN toothbrushes t ON s.toothbrush_id = t.id
       JOIN family_members f ON t.family_member_id = f.id
       WHERE f.user_id = $1
       ORDER BY s.scan_date DESC
       LIMIT 5`,
      [userId]
    );
    const recentScans = recentScansRes.rows.map(row => ({
      id: row.id,
      imageUrl: row.imageUrl,
      wearPercentage: parseFloat(row.wearPercentage || 0),
      healthScore: parseFloat(row.healthScore || 0),
      condition: row.condition,
      scanDate: row.scanDate,
      brand: row.brand,
      model: row.model,
      memberName: row.memberName
    }));

    return res.json({
      totalMembers,
      totalToothbrushes,
      avgHealthScore,
      pendingReplacements,
      recentScans,
    });

  } catch (err) {
    console.error('[DASHBOARD ERROR DIAGNOSTICS]');
    console.error('  Request URL: GET /api/dashboard');
    console.error('  User ID:', userId);
    console.error('  Controller: dashboardController.getDashboardData');
    console.error('  DB Error Code:', err.code || 'N/A');
    console.error('  Error Message:', err.message);

    if (err.code === 'ECONNREFUSED' || err.code === 'PG_UNAVAILABLE' || !db.isPgConnected()) {
      return res.status(503).json({
        error: {
          code: 'DATABASE_UNAVAILABLE',
          message: 'PostgreSQL database service unavailable'
        }
      });
    }

    return res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: 'Server error compiling dashboard metrics: ' + err.message
      }
    });
  }
};
