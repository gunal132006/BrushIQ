const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// Helper to get past dates
function getPastDateString(daysAgo) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0];
}

function getPastDateTimeString(daysAgo) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString();
}

async function runSeeding(db) {
  console.log('Seeding demo data...');

  // 1. Hash password
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('password123', salt);

  // 2. Clear existing demo data
  await db.query("DELETE FROM users WHERE email = 'demo@brushiq.com'");
  await db.query("DELETE FROM tips");


  // 3. Insert Demo User
  const userRes = await db.query(
    `INSERT INTO users (full_name, email, phone, password_hash)
     VALUES ($1, $2, $3, $4) RETURNING id`,
    ['Gunal S', 'demo@brushiq.com', '1234567890', passwordHash]
  );
  const userId = userRes.rows[0].id;
  console.log(`Demo User created with ID: ${userId}`);

  // 4. Insert 5 Family Members
  const membersData = [
    { name: 'Gunal', age: 22, gender: 'Male', relationship: 'Self', photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150' },
    { name: 'Father', age: 54, gender: 'Male', relationship: 'Parent', photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150' },
    { name: 'Mother', age: 48, gender: 'Female', relationship: 'Parent', photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150' },
    { name: 'Brother', age: 17, gender: 'Male', relationship: 'Sibling', photo: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=150' },
    { name: 'Sister', age: 14, gender: 'Female', relationship: 'Sibling', photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150' }
  ];

  const members = [];
  for (const m of membersData) {
    const res = await db.query(
      `INSERT INTO family_members (user_id, name, age, gender, relationship, profile_photo_url)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name`,
      [userId, m.name, m.age, m.gender, m.relationship, m.photo]
    );
    members.push(res.rows[0]);
  }
  console.log(`Seeded ${members.length} family members.`);

  // 5. Insert 5 Toothbrushes (one per family member)
  const brushesData = [
    { memberIdx: 0, brand: 'Oral-B', model: 'iO Series 9', color: 'Black Onyx', type: 'Electric', purchaseDate: getPastDateString(20) }, 
    { memberIdx: 1, brand: 'Colgate', model: 'Hum Smart Brush', color: 'Ocean Blue', type: 'Electric', purchaseDate: getPastDateString(30) },
    { memberIdx: 2, brand: 'Sensodyne', model: 'Pronamel Soft', color: 'White/Green', type: 'Manual', purchaseDate: getPastDateString(35) },
    { memberIdx: 3, brand: 'Philips Sonicare', model: 'ProtectiveClean 4300', color: 'Pastel Pink', type: 'Sonic', purchaseDate: getPastDateString(15) },
    { memberIdx: 4, brand: 'Colgate', model: 'Pulse Electric', color: 'Mint Green', type: 'Electric', purchaseDate: getPastDateString(10) }
  ];

  const brushes = [];
  for (const b of brushesData) {
    const member = members[b.memberIdx];
    const res = await db.query(
      `INSERT INTO toothbrushes (family_member_id, brand, model, color, type, purchase_date)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, brand, model`,
      [member.id, b.brand, b.model, b.color, b.type, b.purchaseDate]
    );
    brushes.push(res.rows[0]);
  }
  console.log(`Seeded ${brushes.length} toothbrushes.`);

  // 6. Insert 20 Scan Records (chronological progression, matching requested scores)
  // Scan 1: Health 95, Wear 5
  // Scan 2: Health 88, Wear 12
  // Scan 3: Health 80, Wear 20
  // Scan 4: Health 70, Wear 30
  // Scan 5: Health 55, Wear 45
  // Scan 6: Health 25, Wear 75 (For Mother's Replace Immediately)

  const scanTimeline = [
    // Gunal (Self) (idx 0): 4 scans -> Condition 'Moderate Wear' (Health 70)
    {
      memberIdx: 0,
      scans: [
        { daysAgo: 20, health: 95, wear: 5, cond: 'Good', remaining: 85, rec: 'Brush is in perfect condition.', spread: 1.1, bend: 1.0, damage: 1.0, issues: [] },
        { daysAgo: 14, health: 88, wear: 12, cond: 'Good', remaining: 75, rec: 'Healthy bristles. Keep brushing.', spread: 2.3, bend: 1.8, damage: 1.5, issues: [] },
        { daysAgo: 8, health: 80, wear: 20, cond: 'Good', remaining: 65, rec: 'Bristles in good shape.', spread: 3.5, bend: 2.9, damage: 2.2, issues: ['Subtle border bristle bending'] },
        { daysAgo: 2, health: 70, wear: 30, cond: 'Moderate Wear', remaining: 50, rec: 'Moderate wear detected. Check periodically.', spread: 5.8, bend: 4.5, damage: 3.8, issues: ['Bristle splaying in outer rows'] }
      ]
    },
    // Father (idx 1): 5 scans -> Condition 'Replace Soon' (Health 55)
    {
      memberIdx: 1,
      scans: [
        { daysAgo: 30, health: 95, wear: 5, cond: 'Good', remaining: 85, rec: 'Excellent bristle structure.', spread: 1.0, bend: 0.9, damage: 1.0, issues: [] },
        { daysAgo: 22, health: 88, wear: 12, cond: 'Good', remaining: 75, rec: 'Minor wear. Maintain hygiene.', spread: 2.2, bend: 1.7, damage: 1.6, issues: [] },
        { daysAgo: 15, health: 80, wear: 20, cond: 'Good', remaining: 65, rec: 'Good condition. Keep scanning.', spread: 3.8, bend: 3.0, damage: 2.4, issues: [] },
        { daysAgo: 8, health: 70, wear: 30, cond: 'Moderate Wear', remaining: 50, rec: 'Bristles show moderate wear.', spread: 5.6, bend: 4.8, damage: 4.0, issues: ['Bristle splaying in outer rows'] },
        { daysAgo: 1, health: 55, wear: 45, cond: 'Replace Soon', remaining: 25, rec: 'Replace soon: wear is reaching threshold.', spread: 8.5, bend: 6.9, damage: 5.8, issues: ['Bristle spreading at margins', 'Reduced plaque clearing efficiency'] }
      ]
    },
    // Mother (idx 2): 6 scans -> Condition 'Replace Immediately' (Health 25)
    {
      memberIdx: 2,
      scans: [
        { daysAgo: 35, health: 95, wear: 5, cond: 'Good', remaining: 85, rec: 'Perfect condition.', spread: 1.2, bend: 1.1, damage: 1.0, issues: [] },
        { daysAgo: 28, health: 88, wear: 12, cond: 'Good', remaining: 75, rec: 'Minor wear. Safe to use.', spread: 2.5, bend: 1.9, damage: 1.5, issues: [] },
        { daysAgo: 21, health: 80, wear: 20, cond: 'Good', remaining: 65, rec: 'Normal wear progression.', spread: 3.9, bend: 3.2, damage: 2.6, issues: [] },
        { daysAgo: 14, health: 70, wear: 30, cond: 'Moderate Wear', remaining: 50, rec: 'Moderate bristle splaying.', spread: 5.9, bend: 4.9, damage: 4.2, issues: ['Bristle splaying in outer rows'] },
        { daysAgo: 7, health: 55, wear: 45, cond: 'Replace Soon', remaining: 25, rec: 'Replace soon: wear is reaching threshold.', spread: 8.9, bend: 7.2, damage: 6.1, issues: ['Bristle spreading at margins', 'Fading indicator color'] },
        { daysAgo: 0, health: 25, wear: 75, cond: 'Replace Immediately', remaining: 0, rec: 'ALERT: Replace toothbrush immediately to avoid gum bleeding and tooth decay.', spread: 14.5, bend: 12.8, damage: 10.5, issues: ['Severe bristle spreading', 'Flat tuft compression', 'Bacterial contamination risk'] }
      ]
    },
    // Brother (idx 3): 3 scans -> Condition 'Good' (Health 80)
    {
      memberIdx: 3,
      scans: [
        { daysAgo: 15, health: 95, wear: 5, cond: 'Good', remaining: 85, rec: 'Excellent shape.', spread: 1.0, bend: 1.0, damage: 1.0, issues: [] },
        { daysAgo: 9, health: 88, wear: 12, cond: 'Good', remaining: 75, rec: 'Healthy bristles.', spread: 2.1, bend: 1.6, damage: 1.4, issues: [] },
        { daysAgo: 3, health: 80, wear: 20, cond: 'Good', remaining: 65, rec: 'Good condition.', spread: 3.4, bend: 2.8, damage: 2.1, issues: [] }
      ]
    },
    // Sister (idx 4): 2 scans -> Condition 'Good' (Health 88)
    {
      memberIdx: 4,
      scans: [
        { daysAgo: 10, health: 95, wear: 5, cond: 'Good', remaining: 85, rec: 'Perfect condition.', spread: 1.1, bend: 1.0, damage: 1.0, issues: [] },
        { daysAgo: 4, health: 88, wear: 12, cond: 'Good', remaining: 75, rec: 'Bristles in great shape.', spread: 2.2, bend: 1.7, damage: 1.5, issues: [] }
      ]
    }
  ];

  let totalScans = 0;
  for (const group of scanTimeline) {
    const brush = brushes[group.memberIdx];
    for (const s of group.scans) {
      const isSplayWarning = s.wear >= 45;
      const imageUrl = isSplayWarning ? '/illustrations/splay_warning.png' : '/illustrations/drying.png';
      
      await db.query(
        `INSERT INTO scans (
          toothbrush_id, image_url, wear_percentage, health_score, remaining_life_days, 
          condition, confidence_score, bristle_spreading, bristle_bending, bristle_damage, 
          brushing_frequency, detected_issues, ai_recommendation, scan_date
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        [
          brush.id,
          imageUrl,
          s.wear,
          s.health,
          s.remaining,
          s.cond,
          96.4, // Confidence Score
          s.spread,
          s.bend,
          s.damage,
          '2x daily',
          s.issues,
          s.rec,
          getPastDateTimeString(s.daysAgo)
        ]
      );
      totalScans++;
    }
  }
  console.log(`Seeded ${totalScans} progressive scan records.`);

  // 7. Insert Reminders / Notifications (Replace Soon, Replace Immediately, Weekly Scan Reminder)
  const remindersData = [
    { memberIdx: 0, brushIdx: 0, type: 'Weekly', nextDate: getPastDateString(-7), msg: 'Weekly Scan Reminder: Time to run an AI scan check-in on Gunal\'s Black Onyx brush.', completed: false },
    { memberIdx: 1, brushIdx: 1, type: 'Daily', nextDate: getPastDateString(-1), msg: 'Replace Soon Warning: Father\'s Hum Smart Brush health is at 55%. Prepare to replace soon.', completed: false },
    { memberIdx: 2, brushIdx: 2, type: 'Daily', nextDate: getPastDateString(-1), msg: 'Replace Immediately Alert: Mother\'s Pronamel Soft brush health is at 25%. Swap it for a new one immediately.', completed: false },
    { memberIdx: 3, brushIdx: 3, type: 'Weekly', nextDate: getPastDateString(-7), msg: 'Weekly Scan Reminder: Monitor brother\'s ProtectiveClean brush wear with a scan.', completed: false },
    { memberIdx: 4, brushIdx: 4, type: 'Weekly', nextDate: getPastDateString(-7), msg: 'Weekly Scan Reminder: Schedule a check-in for sister\'s Mint Green Pulse brush.', completed: false }
  ];

  let totalReminders = 0;
  for (const r of remindersData) {
    const member = members[r.memberIdx];
    const brush = brushes[r.brushIdx];
    await db.query(
      `INSERT INTO reminders (family_member_id, toothbrush_id, type, next_reminder_date, message, is_completed)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [member.id, brush.id, r.type, r.nextDate, r.msg, r.completed]
    );
    totalReminders++;
  }
  console.log(`Seeded ${totalReminders} reminder/notification records.`);

  // 8. Re-seed default oral care tips (from seed.sql values if empty)
  // Let's verify if tips need to be inserted. Since we cleared everything if using mock, let's seed them.
  // In postgres, database-reset clears everything so let's run tip queries.
  const tipsCountRes = await db.query('SELECT COUNT(*)::int as count FROM tips');
  if (tipsCountRes.rows[0].count === 0) {
    const tipsList = [
      ['Dental Hygiene', 'The Golden Rule of Flossing', 'Floss at least once a day to remove food particles and plaque between teeth where your toothbrush bristles cannot reach. Gentle, vertical sliding motion prevents gum trauma.', '/illustrations/flossing.png'],
      ['Dental Hygiene', 'Stay Hydrated for Saliva Production', 'Saliva is your mouth\'s natural defense against tooth decay. It washes away food debris and neutralizes acids produced by bacteria. Drink plenty of water throughout the day.', '/illustrations/hydration.png'],
      ['Dental Hygiene', 'Limit Sugary and Acidic Foods', 'Sugary snacks and acidic drinks feed harmful bacteria in your mouth, which create acids that eat away at your enamel. Opt for calcium-rich cheeses, nuts, and leafy greens instead.', '/illustrations/diet.png'],
      ['Brushing Techniques', 'The 45-Degree Angle Rule', 'Hold your toothbrush at a 45-degree angle to your gums. Use gentle, circular strokes rather than sawing back and forth. This cleans both the tooth surface and the critical gum line.', '/illustrations/angle.png'],
      ['Brushing Techniques', 'The Two-Minute Duration', 'Always brush for at least 2 full minutes. Divide your mouth into four quadrants (top-left, top-right, bottom-left, bottom-right) and spend 30 seconds on each quadrant. Use a timer!', '/illustrations/timer.png'],
      ['Brushing Techniques', 'Don\'t Forget Your Tongue!', 'Bacteria accumulates on the surface of your tongue, causing bad breath and transferring back onto your teeth. Gently brush your tongue or use a tongue scraper from back to front.', '/illustrations/tongue.png'],
      ['Brush Maintenance', 'Rinse and Dry Thoroughly', 'After brushing, rinse your toothbrush head thoroughly with tap water to remove remaining toothpaste and debris. Store it upright in an open area to air-dry. Damp bristles promote bacterial growth.', '/illustrations/drying.png'],
      ['Brush Maintenance', 'Keep it Separate', 'Avoid storing multiple toothbrushes in the same holder where their heads touch. This prevents cross-contamination of bacteria and viral particles between family members.', '/illustrations/separate.png'],
      ['Brush Maintenance', 'Avoid Closed Containers', 'Storing your toothbrush in a travel cap or closed cabinet keeps the bristles moist for too long, creating a breeding ground for mold and bacteria. Use travel caps only for dry travel.', '/illustrations/closed_caps.png'],
      ['Kids Oral Care', 'Make Brushing Fun and Engaging', 'Brush together as a family, play their favorite song for 2 minutes, or use a sticker chart to reward consistency. Establishing positive associations with brushing early prevents childhood tooth decay.', '/illustrations/kids.png'],
      ['Kids Oral Care', 'Correct Toothpaste Amount', 'Use a tiny smear (size of a rice grain) of fluoride toothpaste for children under 3. For kids aged 3 to 6, use a pea-sized amount. Supervise children while brushing to ensure they spit out the foam.', '/illustrations/toothpaste_kids.png'],
      ['Senior Oral Care', 'Combat Dry Mouth & Enamel Decay', 'Aging and medications can reduce protective saliva flow. Sip water frequently, chew sugar-free gum to stimulate saliva, and use alcohol-free fluoride mouthwashes to protect vulnerable root surfaces.', '/illustrations/senior.png'],
      ['Senior Oral Care', 'Daily Denture Care Practices', 'Clean dentures daily using a soft-bristled brush and non-abrasive denture cleanser. Store them in water or a mild denture soaking solution overnight to maintain their shape and prevent bacterial buildup.', '/illustrations/denture_care.png']
    ];

    for (const t of tipsList) {
      await db.query(
        `INSERT INTO tips (category, title, content, illustration_url) VALUES ($1, $2, $3, $4)`,
        t
      );
    }
    console.log(`Seeded ${tipsList.length} tips.`);
  }

  console.log('Seeding completed successfully.');
}

module.exports = {
  runSeeding
};
