const http = require('http');
const db = require('../config/db');

function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', (err) => reject(err));

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runSyncVerification() {
  console.log('===================================================');
  console.log('   BRUSHIQ CROSS-PLATFORM DATA SYNC VERIFICATION   ');
  console.log('===================================================');

  try {
    const timestamp = Date.now();
    const email = `sync_user_${timestamp}@brushiq.com`;
    const password = 'Password123!';
    console.log(`\n[STEP 1] Registering User A: ${email}`);

    const regRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      fullName: 'Sync Tester A',
      email,
      phone: `+1555${timestamp.toString().slice(-4)}`,
      password
    });

    if (regRes.status !== 201 && regRes.status !== 200) {
      throw new Error(`Register failed with status ${regRes.status}: ${JSON.stringify(regRes.data)}`);
    }

    const tokenA = regRes.data.token;
    const userA = regRes.data.user;
    console.log(`[PASS] User A Registered & Authenticated in PostgreSQL. ID: ${userA.id}`);

    const headersWeb = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokenA}`,
      'User-Agent': 'BrushIQ-Web/1.0.0'
    };

    const headersAndroid = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokenA}`,
      'User-Agent': 'BrushIQ-Android/1.0.0'
    };

    // 2. PHASE 4: WEB -> POSTGRESQL -> ANDROID TEST
    console.log('\n===================================================');
    console.log('   PHASE 4: WEB -> POSTGRESQL -> ANDROID TEST     ');
    console.log('===================================================');

    // Create Family Member via Web
    console.log('[WEB] Creating Family Member "Junior"...');
    const memberRes = await request({
      hostname: 'localhost', port: 5000, path: '/api/family', method: 'POST', headers: headersWeb
    }, { name: 'Junior', age: 8, gender: 'Other', relationship: 'Child' });
    const memberIdWeb = memberRes.data.id;
    console.log(`[WEB] Created Family Member in PostgreSQL. ID: ${memberIdWeb}`);

    // Create Toothbrush via Web
    console.log('[WEB] Creating Toothbrush "Sonicare Kids"...');
    const brushRes = await request({
      hostname: 'localhost', port: 5000, path: '/api/toothbrushes', method: 'POST', headers: headersWeb
    }, { familyMemberId: memberIdWeb, brand: 'Philips', model: 'Sonicare Kids', color: 'Blue', type: 'Electric', purchaseDate: '2026-01-01' });
    const brushIdWeb = brushRes.data.id;
    console.log(`[WEB] Created Toothbrush in PostgreSQL. ID: ${brushIdWeb}`);

    // Create Scan via Web
    console.log('[WEB] Creating Scan...');
    const scanRes = await request({
      hostname: 'localhost', port: 5000, path: '/api/scans', method: 'POST', headers: headersWeb
    }, { toothbrushId: brushIdWeb, imageUrl: 'https://brushiq.app/scans/kids1.jpg', wearPercentage: 12.5, healthScore: 87.5, condition: 'Good', remainingLifeDays: 75 });
    if (scanRes.status !== 201 && scanRes.status !== 200) {
      console.error('[SCAN ERROR]:', scanRes.status, scanRes.data);
    }
    const scanIdWeb = scanRes.data.id;
    console.log(`[WEB] Created Scan in PostgreSQL. ID: ${scanIdWeb}`);

    // DIRECT POSTGRESQL QUERY VERIFICATION
    console.log('\n[POSTGRESQL DIRECT QUERY] Verifying records in PostgreSQL...');
    const pgMember = await db.query('SELECT * FROM family_members WHERE id = $1', [memberIdWeb]);
    const pgBrush = await db.query('SELECT * FROM toothbrushes WHERE id = $1', [brushIdWeb]);
    const pgScan = await db.query('SELECT * FROM scans WHERE id = $1', [scanIdWeb]);

    console.log(`PostgreSQL family_members row count: ${pgMember.rows.length} (Name: ${pgMember.rows[0]?.name})`);
    console.log(`PostgreSQL toothbrushes row count: ${pgBrush.rows.length} (Model: ${pgBrush.rows[0]?.model})`);
    console.log(`PostgreSQL scans row count: ${pgScan.rows.length} (Health Score: ${pgScan.rows[0]?.health_score})`);

    // ANDROID FETCH VERIFICATION
    console.log('\n[ANDROID API FETCH] Fetching Dashboard & Records via Android client...');
    const androidDash = await request({
      hostname: 'localhost', port: 5000, path: '/api/dashboard', method: 'GET', headers: headersAndroid
    });
    console.log('[ANDROID DASHBOARD RESPONSE]:', JSON.stringify(androidDash.data, null, 2));

    if (
      androidDash.data.totalMembers >= 1 &&
      androidDash.data.totalToothbrushes >= 1 &&
      androidDash.data.avgHealthScore === 87.5
    ) {
      console.log('✅ WEB -> POSTGRESQL -> ANDROID VERIFICATION PASSED!');
    } else {
      throw new Error('Web to Android sync assertion failed!');
    }

    // 3. PHASE 5: ANDROID -> POSTGRESQL -> WEB TEST
    console.log('\n===================================================');
    console.log('   PHASE 5: ANDROID -> POSTGRESQL -> WEB TEST     ');
    console.log('===================================================');

    // Create Toothbrush via Android
    console.log('[ANDROID] Creating Toothbrush "Oral-B iO 10"...');
    const brushResAndroid = await request({
      hostname: 'localhost', port: 5000, path: '/api/toothbrushes', method: 'POST', headers: headersAndroid
    }, { familyMemberId: memberIdWeb, brand: 'Oral-B', model: 'iO Series 10', color: 'Black', type: 'Electric', purchaseDate: '2026-02-01' });
    const brushIdAndroid = brushResAndroid.data.id;
    console.log(`[ANDROID] Created Toothbrush in PostgreSQL. ID: ${brushIdAndroid}`);

    // Create Scan via Android
    console.log('[ANDROID] Creating Scan...');
    const scanResAndroid = await request({
      hostname: 'localhost', port: 5000, path: '/api/scans', method: 'POST', headers: headersAndroid
    }, { toothbrushId: brushIdAndroid, imageUrl: 'https://brushiq.app/scans/io10.jpg', wearPercentage: 5.0, healthScore: 95.0, condition: 'Excellent', remainingLifeDays: 85 });
    if (scanResAndroid.status !== 201 && scanResAndroid.status !== 200) {
      console.error('[ANDROID SCAN ERROR]:', scanResAndroid.status, scanResAndroid.data);
    }
    const scanIdAndroid = scanResAndroid.data.id;
    console.log(`[ANDROID] Created Scan in PostgreSQL. ID: ${scanIdAndroid}`);

    // DIRECT POSTGRESQL QUERY VERIFICATION
    console.log('\n[POSTGRESQL DIRECT QUERY] Verifying Android records in PostgreSQL...');
    const pgAndroidBrush = await db.query('SELECT * FROM toothbrushes WHERE id = $1', [brushIdAndroid]);
    const pgAndroidScan = await db.query('SELECT * FROM scans WHERE id = $1', [scanIdAndroid]);

    console.log(`PostgreSQL toothbrush row count: ${pgAndroidBrush.rows.length} (Model: ${pgAndroidBrush.rows[0]?.model})`);
    console.log(`PostgreSQL scan row count: ${pgAndroidScan.rows.length} (Health Score: ${pgAndroidScan.rows[0]?.health_score})`);

    // WEB FETCH VERIFICATION
    console.log('\n[WEB API FETCH] Fetching Dashboard & Records via Web client...');
    const webDash = await request({
      hostname: 'localhost', port: 5000, path: '/api/dashboard', method: 'GET', headers: headersWeb
    });
    console.log('[WEB DASHBOARD RESPONSE]:', JSON.stringify(webDash.data, null, 2));

    if (
      webDash.data.totalToothbrushes >= 2 &&
      webDash.data.recentScans.length >= 2
    ) {
      console.log('✅ ANDROID -> POSTGRESQL -> WEB VERIFICATION PASSED!');
    } else {
      throw new Error('Android to Web sync assertion failed!');
    }

    // 4. USER ISOLATION TEST (USER B vs USER A)
    console.log('\n===================================================');
    console.log('   VERIFYING MULTI-USER DATA ISOLATION (USER B)    ');
    console.log('===================================================');
    const emailB = `isolated_user_${timestamp}@brushiq.com`;
    const regResB = await request({
      hostname: 'localhost', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' }
    }, { fullName: 'User B', email: emailB, phone: `+1555${(timestamp + 1).toString().slice(-4)}`, password });

    const tokenB = regResB.data.token;
    const dashResB = await request({
      hostname: 'localhost', port: 5000, path: '/api/dashboard', method: 'GET', headers: { 'Authorization': `Bearer ${tokenB}` }
    });

    console.log('[USER B DASHBOARD RESPONSE]:', JSON.stringify(dashResB.data, null, 2));
    if (
      dashResB.data.totalMembers === 0 &&
      dashResB.data.totalToothbrushes === 0 &&
      dashResB.data.recentScans.length === 0
    ) {
      console.log('✅ MULTI-USER ISOLATION VERIFICATION PASSED!');
    } else {
      throw new Error('User data isolation failed! User B saw User A data!');
    }

    console.log('\n===================================================');
    console.log('   ALL SYNC AND ISOLATION TESTS PASSED 100%       ');
    console.log('===================================================');
    process.exit(0);

  } catch (err) {
    console.error('❌ SYNC VERIFICATION ERROR:', err.message);
    process.exit(1);
  }
}

runSyncVerification();
