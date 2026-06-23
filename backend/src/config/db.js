const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const dns = require('dns');

// Force IPv4 resolution preference in Node.js to avoid Render's lack of IPv6 egress support
if (typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first');
}

require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgrespassword',
  database: process.env.DB_DATABASE || 'brushiq',
  ssl: (process.env.DB_HOST && process.env.DB_HOST !== 'localhost' && process.env.DB_HOST !== '127.0.0.1')
    ? { rejectUnauthorized: false }
    : false
};

// Database mode: 'postgresql' or 'demo-json'
let dbMode = 'postgresql';
let pgPool = null;

// Initialize connection mode
const demoModeEnabled = process.env.DEMO_MODE === 'true' || !process.env.DB_HOST;

const dbFile = path.join(__dirname, '../db/local_db.json');

function loadDb() {
  if (!fs.existsSync(dbFile)) {
    const defaultData = {
      users: [],
      family_members: [],
      toothbrushes: [],
      scans: [],
      reminders: [],
      tips: []
    };
    fs.mkdirSync(path.dirname(dbFile), { recursive: true });
    fs.writeFileSync(dbFile, JSON.stringify(defaultData, null, 2), 'utf8');
    return defaultData;
  }
  try {
    const content = fs.readFileSync(dbFile, 'utf8');
    const parsed = JSON.parse(content);
    // Ensure all tables exist
    const tables = ['users', 'family_members', 'toothbrushes', 'scans', 'reminders', 'tips'];
    let changed = false;
    for (const t of tables) {
      if (!parsed[t]) {
        parsed[t] = [];
        changed = true;
      }
    }
    if (changed) {
      fs.writeFileSync(dbFile, JSON.stringify(parsed, null, 2), 'utf8');
    }
    return parsed;
  } catch (e) {
    const defaultData = {
      users: [],
      family_members: [],
      toothbrushes: [],
      scans: [],
      reminders: [],
      tips: []
    };
    fs.writeFileSync(dbFile, JSON.stringify(defaultData, null, 2), 'utf8');
    return defaultData;
  }
}

function saveDb(data) {
  fs.writeFileSync(dbFile, JSON.stringify(data, null, 2), 'utf8');
}

// Custom mock query execution engine
async function mockQuery(text, params = []) {
  const data = loadDb();
  let writeNeeded = false;
  let rows = [];

  const sql = text.replace(/\s+/g, ' ').trim();
  const sqlLower = sql.toLowerCase();

  // 1. Schema Commands (init.js)
  if (sqlLower.startsWith('drop table') || sqlLower.startsWith('create table') || sqlLower.startsWith('create extension') || sqlLower.startsWith('create index')) {
    if (sqlLower.includes('drop table if exists users') || sqlLower.includes('users (')) {
      data.users = [];
      writeNeeded = true;
    }
    if (sqlLower.includes('drop table if exists family_members') || sqlLower.includes('family_members (')) {
      data.family_members = [];
      writeNeeded = true;
    }
    if (sqlLower.includes('drop table if exists toothbrushes') || sqlLower.includes('toothbrushes (')) {
      data.toothbrushes = [];
      writeNeeded = true;
    }
    if (sqlLower.includes('drop table if exists scans') || sqlLower.includes('scans (')) {
      data.scans = [];
      writeNeeded = true;
    }
    if (sqlLower.includes('drop table if exists reminders') || sqlLower.includes('reminders (')) {
      data.reminders = [];
      writeNeeded = true;
    }
    if (sqlLower.includes('drop table if exists tips') || sqlLower.includes('tips (')) {
      data.tips = [];
      writeNeeded = true;
    }
    return { rows: [] };
  }

  // 2. Inserts from seed.sql (tips table)
  if (sqlLower.startsWith('insert into tips')) {
    const valuesPart = sql.substring(sqlLower.indexOf('values') + 6).trim();
    let idx = 0;
    while (idx < valuesPart.length) {
      if (valuesPart[idx] === '(') {
        idx++;
        let currentTuple = [];
        while (idx < valuesPart.length && valuesPart[idx] !== ')') {
          if (valuesPart[idx] === "'") {
            idx++; // skip opening quote
            let str = '';
            while (idx < valuesPart.length) {
              if (valuesPart[idx] === "'" && valuesPart[idx+1] === "'") {
                str += "'";
                idx += 2;
              } else if (valuesPart[idx] === "'") {
                idx++; // skip closing quote
                break;
              } else {
                str += valuesPart[idx];
                idx++;
              }
            }
            currentTuple.push(str);
          } else if (valuesPart[idx] === ',' || /\s/.test(valuesPart[idx])) {
            idx++;
          } else {
            // numeric/boolean/null
            let val = '';
            while (idx < valuesPart.length && valuesPart[idx] !== ',' && valuesPart[idx] !== ')') {
              val += valuesPart[idx];
              idx++;
            }
            val = val.trim();
            if (val.toLowerCase() === 'true') currentTuple.push(true);
            else if (val.toLowerCase() === 'false') currentTuple.push(false);
            else if (val.toLowerCase() === 'null') currentTuple.push(null);
            else if (!isNaN(val)) currentTuple.push(Number(val));
            else currentTuple.push(val);
          }
        }
        if (currentTuple.length > 0) {
          const newTip = {
            id: uuidv4(),
            category: currentTuple[0],
            title: currentTuple[1],
            content: currentTuple[2],
            illustration_url: currentTuple[3],
            created_at: new Date().toISOString()
          };
          data.tips.push(newTip);
          rows.push(newTip);
        }
      }
      idx++;
    }
    writeNeeded = true;
    return { rows };
  }

  // 3. User Inserts (RETURNING id, full_name, email, phone)
  if (sqlLower.startsWith('insert into users')) {
    const newUser = {
      id: uuidv4(),
      full_name: params[0],
      email: params[1],
      phone: params[2],
      password_hash: params[3],
      google_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    data.users.push(newUser);
    rows = [newUser];
    writeNeeded = true;
  }
  // 4. Family Member Inserts
  else if (sqlLower.startsWith('insert into family_members')) {
    const newMember = {
      id: uuidv4(),
      user_id: params[0],
      name: params[1],
      age: parseInt(params[2]),
      gender: params[3],
      relationship: params[4],
      profile_photo_url: params[5],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    data.family_members.push(newMember);
    rows = [newMember];
    writeNeeded = true;
  }
  // 5. Toothbrush Inserts
  else if (sqlLower.startsWith('insert into toothbrushes')) {
    const newBrush = {
      id: uuidv4(),
      family_member_id: params[0],
      brand: params[1],
      model: params[2],
      color: params[3],
      type: params[4],
      purchase_date: params[5],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    data.toothbrushes.push(newBrush);
    rows = [newBrush];
    writeNeeded = true;
  }
  // 6. Scan Inserts
  else if (sqlLower.startsWith('insert into scans')) {
    const newScan = {
      id: uuidv4(),
      toothbrush_id: params[0],
      image_url: params[1],
      wear_percentage: parseFloat(params[2]),
      health_score: parseFloat(params[3]),
      remaining_life_days: parseInt(params[4]),
      condition: params[5],
      confidence_score: parseFloat(params[6]),
      bristle_spreading: parseFloat(params[7]),
      bristle_bending: parseFloat(params[8]),
      bristle_damage: parseFloat(params[9]),
      brushing_frequency: params[10] || '2x daily',
      detected_issues: params[11] || [],
      ai_recommendation: params[12],
      scan_date: params[13] || new Date().toISOString(),
      created_at: new Date().toISOString()
    };
    data.scans.push(newScan);
    rows = [newScan];
    writeNeeded = true;
  }
  // 7. Reminder Inserts
  else if (sqlLower.startsWith('insert into reminders')) {
    const newReminder = {
      id: uuidv4(),
      family_member_id: params[0],
      toothbrush_id: params[1],
      scan_id: null,
      type: params[2],
      next_reminder_date: params[3],
      message: params[4],
      is_completed: params[5] === true || params[5] === 'true' || false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    data.reminders.push(newReminder);
    rows = [newReminder];
    writeNeeded = true;
  }
  // DELETE Queries
  else if (sqlLower.startsWith('delete from users')) {
    if (sqlLower.includes("email = 'demo@brushiq.com'")) {
      data.users = data.users.filter(u => u.email !== 'demo@brushiq.com');
      writeNeeded = true;
    }
  }
  else if (sqlLower.startsWith('delete from family_members')) {
    const id = params[0];
    const userId = params[1];
    data.family_members = data.family_members.filter(m => !(m.id === id && m.user_id === userId));
    writeNeeded = true;
  }
  else if (sqlLower.startsWith('delete from toothbrushes')) {
    const id = params[0];
    data.toothbrushes = data.toothbrushes.filter(b => b.id !== id);
    writeNeeded = true;
  }
  // UPDATE Queries
  else if (sqlLower.startsWith('update users')) {
    if (sqlLower.includes('set google_id = $1 where id = $2')) {
      const u = data.users.find(x => x.id === params[1]);
      if (u) {
        u.google_id = params[0];
        u.updated_at = new Date().toISOString();
        rows = [u];
        writeNeeded = true;
      }
    } else if (sqlLower.includes('set full_name = $1, phone = $2 where id = $3')) {
      const u = data.users.find(x => x.id === params[2]);
      if (u) {
        u.full_name = params[0];
        u.phone = params[1];
        u.updated_at = new Date().toISOString();
        rows = [u];
        writeNeeded = true;
      }
    }
  }
  else if (sqlLower.startsWith('update family_members')) {
    const m = data.family_members.find(x => x.id === params[5] && x.user_id === params[6]);
    if (m) {
      m.name = params[0];
      m.age = parseInt(params[1]);
      m.gender = params[2];
      m.relationship = params[3];
      m.profile_photo_url = params[4];
      m.updated_at = new Date().toISOString();
      rows = [m];
      writeNeeded = true;
    }
  }
  else if (sqlLower.startsWith('update reminders')) {
    const r = data.reminders.find(x => x.id === params[1]);
    if (r) {
      r.is_completed = params[0] === true || params[0] === 'true';
      r.updated_at = new Date().toISOString();
      rows = [r];
      writeNeeded = true;
    }
  }
  // SELECT Queries
  else if (sqlLower.startsWith('select')) {
    // COUNT counts
    if (sqlLower.startsWith('select count(*)::int as count')) {
      if (sqlLower.includes('from family_members')) {
        const count = data.family_members.filter(m => m.user_id === params[0]).length;
        rows = [{ count }];
      } else if (sqlLower.includes('from toothbrushes t')) {
        const userMembers = data.family_members.filter(m => m.user_id === params[0]);
        const count = data.toothbrushes.filter(b => userMembers.some(m => m.id === b.family_member_id)).length;
        rows = [{ count }];
      } else if (sqlLower.includes('from tips')) {
        const count = data.tips.length;
        rows = [{ count }];
      }
    }
    // Users
    else if (sqlLower.includes('from users')) {
      if (sqlLower.includes('email = $1')) {
        rows = data.users.filter(u => u.email === params[0]);
      } else if (sqlLower.includes('phone = $1')) {
        rows = data.users.filter(u => u.phone === params[0]);
      } else if (sqlLower.includes('google_id = $1 or email = $2')) {
        rows = data.users.filter(u => u.google_id === params[0] || u.email === params[1]);
      } else if (sqlLower.includes('where id = $1')) {
        rows = data.users.filter(u => u.id === params[0]);
      }
    }
    // Family members
    else if (sqlLower.includes('from family_members')) {
      if (sqlLower.includes('user_id = $1')) {
        const unfilteredRows = data.family_members.filter(m => m.user_id === params[0]);
        rows = unfilteredRows.map(m => {
          // Find latest toothbrush
          const memberBrushes = data.toothbrushes.filter(b => b.family_member_id === m.id);
          memberBrushes.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
          const latestBrush = memberBrushes[0] || null;

          // Find latest scan
          let latestScan = null;
          if (latestBrush) {
            const brushScans = data.scans.filter(s => s.toothbrush_id === latestBrush.id);
            brushScans.sort((a, b) => new Date(b.scan_date) - new Date(a.scan_date));
            latestScan = brushScans[0] || null;
          }

          return {
            id: m.id,
            user_id: m.user_id,
            name: m.name,
            age: m.age,
            gender: m.gender,
            relationship: m.relationship,
            profilePhotoUrl: m.profile_photo_url,
            createdAt: m.created_at,
            toothbrushId: latestBrush ? latestBrush.id : null,
            toothbrushBrand: latestBrush ? latestBrush.brand : null,
            toothbrushModel: latestBrush ? latestBrush.model : null,
            toothbrushColor: latestBrush ? latestBrush.color : null,
            toothbrushType: latestBrush ? latestBrush.type : null,
            toothbrushPurchaseDate: latestBrush ? latestBrush.purchase_date : null,
            healthScore: latestScan ? latestScan.health_score : null,
            toothbrushCondition: latestScan ? latestScan.condition : null,
            lastScanDate: latestScan ? latestScan.scan_date : null
          };
        });
        if (sqlLower.includes('order by name asc')) {
          rows.sort((a, b) => a.name.localeCompare(b.name));
        }
      } else if (sqlLower.includes('id = $1 and user_id = $2')) {
        const unfilteredRows = data.family_members.filter(m => m.id === params[0] && m.user_id === params[1]);
        rows = unfilteredRows.map(m => {
          // Find latest toothbrush
          const memberBrushes = data.toothbrushes.filter(b => b.family_member_id === m.id);
          memberBrushes.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
          const latestBrush = memberBrushes[0] || null;

          // Find latest scan
          let latestScan = null;
          if (latestBrush) {
            const brushScans = data.scans.filter(s => s.toothbrush_id === latestBrush.id);
            brushScans.sort((a, b) => new Date(b.scan_date) - new Date(a.scan_date));
            latestScan = brushScans[0] || null;
          }

          return {
            id: m.id,
            user_id: m.user_id,
            name: m.name,
            age: m.age,
            gender: m.gender,
            relationship: m.relationship,
            profilePhotoUrl: m.profile_photo_url,
            createdAt: m.created_at,
            toothbrushId: latestBrush ? latestBrush.id : null,
            toothbrushBrand: latestBrush ? latestBrush.brand : null,
            toothbrushModel: latestBrush ? latestBrush.model : null,
            toothbrushColor: latestBrush ? latestBrush.color : null,
            toothbrushType: latestBrush ? latestBrush.type : null,
            toothbrushPurchaseDate: latestBrush ? latestBrush.purchase_date : null,
            healthScore: latestScan ? latestScan.health_score : null,
            toothbrushCondition: latestScan ? latestScan.condition : null,
            lastScanDate: latestScan ? latestScan.scan_date : null
          };
        });
      }
    }
    // Toothbrushes with Joins
    else if (sqlLower.includes('from toothbrushes t')) {
      const brushesJoined = data.toothbrushes.map(t => {
        const f = data.family_members.find(fm => fm.id === t.family_member_id);
        return {
          ...t,
          family_member_name: f ? f.name : '',
          user_id: f ? f.user_id : null
        };
      });

      if (sqlLower.includes('f.user_id = $1')) {
        rows = brushesJoined.filter(b => b.user_id === params[0]);
        if (sqlLower.includes('order by t.created_at desc')) {
          rows.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        }
      } else if (sqlLower.includes('t.id = $1 and f.user_id = $2')) {
        rows = brushesJoined.filter(b => b.id === params[0] && b.user_id === params[1]);
      }
    }
    // Scans with Joins
    else if (sqlLower.includes('from scans s')) {
      const scansJoined = data.scans.map(s => {
        const t = data.toothbrushes.find(tb => tb.id === s.toothbrush_id);
        const f = t ? data.family_members.find(fm => fm.id === t.family_member_id) : null;
        return {
          ...s,
          brand: t ? t.brand : '',
          model: t ? t.model : '',
          family_member_id: t ? t.family_member_id : null,
          family_member_name: f ? f.name : '',
          memberName: f ? f.name : '',
          user_id: f ? f.user_id : null,
          imageUrl: s.image_url,
          wearPercentage: s.wear_percentage,
          healthScore: s.health_score,
          scanDate: s.scan_date
        };
      });

      if (sqlLower.includes('f.user_id = $1')) {
        rows = scansJoined.filter(s => s.user_id === params[0]);
        if (sqlLower.includes('order by s.scan_date desc')) {
          rows.sort((a, b) => new Date(b.scan_date) - new Date(a.scan_date));
        }
        if (sqlLower.includes('limit 5')) {
          rows = rows.slice(0, 5);
        }
      } else if (sqlLower.includes('s.id = $1 and f.user_id = $2')) {
        rows = scansJoined.filter(s => s.id === params[0] && s.user_id === params[1]);
      } else if (sqlLower.includes('t.family_member_id = $1')) {
        rows = scansJoined.filter(s => s.family_member_id === params[0]);
        if (sqlLower.includes('order by s.scan_date desc')) {
          rows.sort((a, b) => new Date(b.scan_date) - new Date(a.scan_date));
        }
        if (sqlLower.includes('limit 1')) {
          rows = rows.slice(0, 1);
        }
      }
    }
    // Reminders with Joins
    else if (sqlLower.includes('from reminders r')) {
      const remindersJoined = data.reminders.map(r => {
        const f = data.family_members.find(fm => fm.id === r.family_member_id);
        const t = data.toothbrushes.find(tb => tb.id === r.toothbrush_id);
        return {
          ...r,
          family_member_name: f ? f.name : '',
          user_id: f ? f.user_id : null,
          brand: t ? t.brand : '',
          model: t ? t.model : ''
        };
      });

      if (sqlLower.includes('f.user_id = $1')) {
        rows = remindersJoined.filter(r => r.user_id === params[0]);
        if (sqlLower.includes('order by r.next_reminder_date asc')) {
          rows.sort((a, b) => new Date(a.next_reminder_date) - new Date(b.next_reminder_date));
        }
      } else if (sqlLower.includes('r.id = $1 and f.user_id = $2')) {
        rows = remindersJoined.filter(r => r.id === params[0] && r.user_id === params[1]);
      }
    }
    // Tips
    else if (sqlLower.includes('from tips')) {
      rows = [...data.tips];
      if (sqlLower.includes('order by created_at desc')) {
        rows.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      }
    }
  }
  // CTE WITH dashboard calculations
  else if (sqlLower.startsWith('with')) {
    // Average health score
    if (sqlLower.includes('avg(health_score)')) {
      const userMembers = data.family_members.filter(m => m.user_id === params[0]);
      const userBrushes = data.toothbrushes.filter(b => userMembers.some(m => m.id === b.family_member_id));
      let totalHealth = 0;
      let count = 0;
      for (const brush of userBrushes) {
        const brushScans = data.scans.filter(s => s.toothbrush_id === brush.id);
        if (brushScans.length > 0) {
          brushScans.sort((a, b) => new Date(b.scan_date) - new Date(a.scan_date));
          totalHealth += parseFloat(brushScans[0].health_score);
          count++;
        }
      }
      const avg = count > 0 ? (totalHealth / count).toFixed(1) : null;
      rows = [{ avg_health: avg }];
    }
    // Pending replacements
    else if (sqlLower.includes('scanned_pending') && sqlLower.includes('unscanned_old')) {
      const userMembers = data.family_members.filter(m => m.user_id === params[0]);
      const userBrushes = data.toothbrushes.filter(b => userMembers.some(m => m.id === b.family_member_id));

      let pendingCount = 0;
      for (const brush of userBrushes) {
        const brushScans = data.scans.filter(s => s.toothbrush_id === brush.id);
        if (brushScans.length > 0) {
          brushScans.sort((a, b) => new Date(b.scan_date) - new Date(a.scan_date));
          const latestCond = brushScans[0].condition;
          if (latestCond === 'Replace Soon' || latestCond === 'Replace Immediately') {
            pendingCount++;
          }
        } else {
          // Check if used for > 90 days and never scanned
          const purchaseDate = new Date(brush.purchase_date);
          const limitDate = new Date();
          limitDate.setDate(limitDate.getDate() - 90);
          if (purchaseDate <= limitDate) {
            pendingCount++;
          }
        }
      }
      rows = [{ count: pendingCount }];
    }
  }

  if (writeNeeded) {
    saveDb(data);
  }

  return { rows };
}

// Setup real PG Pool if not bypassed
if (!demoModeEnabled) {
  console.log('=============================================');
  console.log('   Database Connection Diagnostics');
  console.log('   Node.js Version:', process.version);
  console.log('   DB_HOST:', dbConfig.host);
  console.log('   DB_PORT:', dbConfig.port);
  console.log('   DB_DATABASE:', dbConfig.database);
  console.log('   DB_USER:', dbConfig.user);
  console.log('   DNS defaultResultOrder preference: ipv4first');
  
  // Resolve IPv4 DNS
  dns.resolve4(dbConfig.host, (err, ipv4s) => {
    if (err) {
      console.warn('   IPv4 DNS Resolution failed:', err.message);
    } else {
      console.log('   Resolved IPv4 Addresses:', ipv4s);
    }
  });

  // Resolve IPv6 DNS
  dns.resolve6(dbConfig.host, (err, ipv6s) => {
    if (err) {
      console.warn('   IPv6 DNS Resolution failed (possibly none):', err.message);
    } else {
      console.log('   Resolved IPv6 Addresses:', ipv6s);
    }
  });

  // Perform standard lookup
  dns.lookup(dbConfig.host, (err, address, family) => {
    if (err) {
      console.warn('   Primary DNS Lookup failed:', err.message);
    } else {
      console.log(`   Node.js Selected Primary IP: ${address} (IPv${family})`);
    }
  });
  console.log('=============================================');

  try {
    pgPool = new Pool(dbConfig);
    // Simple verification check asynchronously
    pgPool.query('SELECT 1').then(() => {
      console.log('=============================================');
      console.log('   BrushIQ Connected to PostgreSQL Database');
      console.log('=============================================');
      dbMode = 'postgresql';
    }).catch((err) => {
      console.warn('=============================================');
      console.warn('   PostgreSQL Connection Failed! Redirecting to local JSON DB');
      console.warn('   Error:', err.message);
      console.warn('=============================================');
      dbMode = 'demo-json';
    });
  } catch (err) {
    console.warn('Failed to build PG Pool. Operating in local JSON mode.');
    dbMode = 'demo-json';
  }
} else {
  console.log('=============================================');
  console.log('   BrushIQ running in DEMO MODE');
  console.log('   Using local JSON Database');
  console.log('=============================================');
  dbMode = 'demo-json';
}

const mockClient = {
  query: mockQuery,
  release: () => {}
};

module.exports = {
  query: async (text, params) => {
    if (dbMode === 'demo-json') {
      return mockQuery(text, params);
    }
    try {
      return await pgPool.query(text, params);
    } catch (err) {
      console.error('PG query failed, falling back to local JSON db:', err.message);
      dbMode = 'demo-json';
      return mockQuery(text, params);
    }
  },
  pool: {
    connect: async () => {
      if (dbMode === 'demo-json') {
        return mockClient;
      }
      try {
        return await pgPool.connect();
      } catch (err) {
        console.error('PG pool.connect failed, falling back to local JSON db client:', err.message);
        dbMode = 'demo-json';
        return mockClient;
      }
    },
    on: (event, handler) => {
      if (pgPool) {
        pgPool.on(event, handler);
      }
    }
  },
  getDbMode: () => dbMode,
  setDbMode: (mode) => { dbMode = mode; }
};
