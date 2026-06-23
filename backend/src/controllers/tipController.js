const db = require('../config/db');

exports.getTips = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, category, title, content, illustration_url as "illustrationUrl", created_at as "createdAt"
       FROM tips
       ORDER BY category, created_at ASC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching tips:', err.message);
    res.status(500).json({ message: 'Server error fetching oral care tips' });
  }
};

exports.getPersonalizedTips = async (req, res) => {
  const { familyMemberId } = req.query;

  if (!familyMemberId) {
    return res.status(400).json({ message: 'familyMemberId query parameter is required' });
  }

  try {
    // Validate family member belongs to user
    const checkMember = await db.query(
      'SELECT id, name FROM family_members WHERE id = $1 AND user_id = $2',
      [familyMemberId, req.user.id]
    );

    if (checkMember.rows.length === 0) {
      return res.status(404).json({ message: 'Family member profile not found or access denied' });
    }

    const memberName = checkMember.rows[0].name;

    // Fetch the full scan history for any toothbrush owned by this family member
    const scansHistory = await db.query(
      `SELECT s.condition, s.wear_percentage as "wearPercentage", s.health_score as "healthScore", 
              s.brushing_frequency as "brushingFrequency", s.scan_date as "scanDate", t.brand, t.model
       FROM scans s
       JOIN toothbrushes t ON s.toothbrush_id = t.id
       WHERE t.family_member_id = $1
       ORDER BY s.scan_date DESC`,
      [familyMemberId]
    );

    let personalizedTips = [];

    if (scansHistory.rows.length === 0) {
      // If no scans yet, return a tip suggesting the first scan
      personalizedTips.push({
        id: 'tip-first-scan',
        category: 'AI Personalized Tips',
        title: `Welcome, ${memberName}! Ready for your first scan?`,
        content: `Start by capturing an image of your toothbrush. Our AI analyzer will check your bristles for bending, spreading, or micro-damage and calculate your toothbrush health score!`,
        illustrationUrl: '/illustrations/start_scan.png',
      });
    } else {
      const latestScan = scansHistory.rows[0];
      const wear = parseFloat(latestScan.wearPercentage);
      const health = parseFloat(latestScan.healthScore);
      const frequency = latestScan.brushingFrequency || '2x daily';
      const lastScanDate = new Date(latestScan.scanDate);
      const daysSinceLastScan = (Date.now() - lastScanDate.getTime()) / (1000 * 60 * 60 * 24);

      // 1. Wear Level Recommendation
      if (wear >= 70) {
        personalizedTips.push({
          id: 'tip-wear-critical',
          category: 'AI Personalized Tips',
          title: `Replace Brush Immediately! (${latestScan.brand} ${latestScan.model})`,
          content: `Hi ${memberName}, our AI detected critical bristle wear of ${wear}% (Health Score: ${health}%). Severely splayed bristles lose up to 60% of cleaning efficiency and can damage your gums. Please replace this brush immediately.`,
          illustrationUrl: '/illustrations/splay_warning.png',
        });
      } else if (wear >= 40) {
        personalizedTips.push({
          id: 'tip-wear-warn',
          category: 'AI Personalized Tips',
          title: `Brush Replacement Warning (${latestScan.brand} ${latestScan.model})`,
          content: `Hi ${memberName}, our AI detected moderate bristle wear of ${wear}% (Health Score: ${health}%). Bristles are starting to splay outwards. Plan to replace this brush within the next 2-3 weeks to maintain optimal plaque removal.`,
          illustrationUrl: '/illustrations/splay_warning.png',
        });
      } else {
        personalizedTips.push({
          id: 'tip-wear-optimal',
          category: 'AI Personalized Tips',
          title: 'Bristles in Optimal Condition',
          content: `Great job, ${memberName}! Your ${latestScan.brand} bristles are in excellent shape (Health Score: ${health}%). Continue checking every 2 weeks to stay ahead of bacterial build-up and wear.`,
          illustrationUrl: '/illustrations/drying.png',
        });
      }

      // 2. Brushing Frequency Recommendation
      const isLowFrequency = frequency.includes('1x') || frequency.toLowerCase().includes('occasion') || frequency.toLowerCase().includes('once');
      if (isLowFrequency) {
        personalizedTips.push({
          id: 'tip-freq-low',
          category: 'AI Personalized Tips',
          title: 'Boost Brushing to 2x Daily',
          content: `We noticed you're brushing ${frequency}. Dental associations recommend brushing for 2 minutes twice a day (morning and night). Brushing before bed is especially critical as saliva flow decreases, leaving teeth vulnerable to acid-producing bacteria.`,
          illustrationUrl: '/illustrations/timer.png',
        });
      } else {
        personalizedTips.push({
          id: 'tip-freq-optimal',
          category: 'AI Personalized Tips',
          title: 'Fantastic Brushing Habits!',
          content: `Brushing ${frequency} is excellent for controlling dental plaque! To protect your gums, ensure you're using a soft-bristled brush and cleaning at a 45-degree angle.`,
          illustrationUrl: '/illustrations/angle.png',
        });
      }

      // 3. Scan History & Pattern Recognition
      if (daysSinceLastScan >= 30) {
        personalizedTips.push({
          id: 'tip-history-stale',
          category: 'AI Personalized Tips',
          title: 'Toothbrush Scan is Overdue',
          content: `It has been ${Math.round(daysSinceLastScan)} days since your last AI bristle check. Brush wear can accelerate based on brushing force. Capture a new photo today to calibrate remaining lifespan!`,
          illustrationUrl: '/illustrations/start_scan.png',
        });
      } else if (scansHistory.rows.length >= 3) {
        const oldestScan = scansHistory.rows[scansHistory.rows.length - 1];
        const scoreDrop = parseFloat(oldestScan.healthScore) - health;
        const daysDiff = (new Date(latestScan.scanDate).getTime() - new Date(oldestScan.scanDate).getTime()) / (1000 * 60 * 60 * 24);

        if (scoreDrop >= 15 && daysDiff <= 45) {
          personalizedTips.push({
            id: 'tip-history-rapid-wear',
            category: 'AI Personalized Tips',
            title: 'Rapid Wear Alert: Heavy Brushing?',
            content: `Your toothbrush health score dropped by ${Math.round(scoreDrop)}% in just ${Math.round(daysDiff)} days. Rapid wear is typically caused by applying excessive pressure. Remember to let the bristles do the work, or consider a brush with a pressure sensor.`,
            illustrationUrl: '/illustrations/pressure_warning.png',
          });
        } else {
          personalizedTips.push({
            id: 'tip-history-consistent',
            category: 'AI Personalized Tips',
            title: 'Consistent Wear Profile',
            content: `Your scan history shows a steady, healthy wear progression over the last ${Math.round(daysDiff)} days. Your brushing pressure is perfectly balanced. Keep it up!`,
            illustrationUrl: '/illustrations/drying.png',
          });
        }
      } else {
        personalizedTips.push({
          id: 'tip-history-build',
          category: 'AI Personalized Tips',
          title: 'Build Your Health Profile',
          content: `Keep scanning your toothbrush regularly! Once you have at least 3 scans, our AI will automatically chart your health trend and analyze your wear rate for custom pressure feedback.`,
          illustrationUrl: '/illustrations/start_scan.png',
        });
      }
    }

    res.json(personalizedTips);
  } catch (err) {
    console.error('Error compiling personalized tips:', err.message);
    res.status(500).json({ message: 'Server error generating personalized tips' });
  }
};
