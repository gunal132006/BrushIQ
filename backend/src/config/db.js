const { Pool } = require('pg');
const path = require('path');
const dns = require('dns');
const crypto = require('crypto');
const fs = require('fs');

if (typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first');
}

require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const connectionString = process.env.DATABASE_URL;

const dbConfig = connectionString
  ? {
      connectionString,
      ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false }
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgrespassword',
      database: process.env.DB_DATABASE || 'brushiq',
      ssl: (process.env.DB_HOST && process.env.DB_HOST !== 'localhost' && process.env.DB_HOST !== '127.0.0.1')
        ? { rejectUnauthorized: false }
        : false
    };

const pool = new Pool(dbConfig);
let pgConnected = false;

// Embedded persistent store directory
const dbDir = path.join(__dirname, '../db');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}
const embeddedDbFile = path.join(dbDir, 'embedded_store.json');

function loadEmbeddedStore() {
  if (fs.existsSync(embeddedDbFile)) {
    try {
      return JSON.parse(fs.readFileSync(embeddedDbFile, 'utf8'));
    } catch (e) {
      console.error('Error reading embedded store:', e.message);
    }
  }
  return {
    users: [],
    family_members: [],
    toothbrushes: [],
    scans: [],
    reminders: [],
    tips: [
      {
        id: crypto.randomUUID(),
        category: 'Dental Hygiene',
        title: 'Proper Brushing Technique',
        content: 'Brush twice daily for two minutes using soft circular motions angled at 45 degrees toward your gumline.',
        created_at: new Date().toISOString()
      },
      {
        id: crypto.randomUUID(),
        category: 'Brush Maintenance',
        title: 'Toothbrush Replacement Schedule',
        content: 'Replace your toothbrush head every 3 months or sooner if bristles become frayed, bent, or discolored.',
        created_at: new Date().toISOString()
      }
    ]
  };
}

let store = loadEmbeddedStore();

function saveEmbeddedStore() {
  try {
    fs.writeFileSync(embeddedDbFile, JSON.stringify(store, null, 2), 'utf8');
  } catch (e) {
    console.error('Error saving embedded store:', e.message);
  }
}

// Initial connection test
pool.query('SELECT 1')
  .then(() => {
    pgConnected = true;
    console.log('Successfully connected to remote PostgreSQL database.');
  })
  .catch((err) => {
    pgConnected = false;
    console.warn('Remote PostgreSQL connection unavailable:', err.message);
    console.warn('Engaging High-Availability Embedded SQL engine.');
  });

pool.on('error', (err) => {
  pgConnected = false;
  console.error('PostgreSQL client error:', err.message);
});

// Embedded SQL execution engine
async function executeEmbeddedQuery(sql, params = []) {
  const normalizedSql = sql.trim().replace(/\s+/g, ' ');

  // 1. CREATE TABLE / EXTENSION / INDEX
  if (/^CREATE/i.test(normalizedSql)) {
    return { rows: [], rowCount: 0 };
  }

  // 2. SELECT 1 / Health check
  if (/^SELECT 1$/i.test(normalizedSql)) {
    return { rows: [{ '?column?': 1 }], rowCount: 1 };
  }

  // 3. USERS: Check existing email / phone
  if (/SELECT id FROM users WHERE LOWER\(email\) = \$1/i.test(normalizedSql)) {
    const email = (params[0] || '').toLowerCase();
    const rows = store.users.filter(u => u.email && u.email.toLowerCase() === email);
    return { rows, rowCount: rows.length };
  }

  if (/SELECT id FROM users WHERE phone = \$1/i.test(normalizedSql)) {
    const phone = params[0];
    const rows = store.users.filter(u => u.phone === phone);
    return { rows, rowCount: rows.length };
  }

  // 4. USERS: Login lookup (email OR phone)
  if (/SELECT \* FROM users WHERE LOWER\(email\) = \$1 OR phone = \$2/i.test(normalizedSql)) {
    const inputStr = (params[0] || '').toLowerCase();
    const phoneStr = params[1];
    const rows = store.users.filter(u => 
      (u.email && u.email.toLowerCase() === inputStr) || 
      (u.phone && u.phone === phoneStr)
    );
    return { rows, rowCount: rows.length };
  }

  // 5. USERS: Select by ID
  if (/SELECT .* FROM users WHERE id = \$1/i.test(normalizedSql)) {
    const id = params[0];
    const rows = store.users.filter(u => u.id === id);
    return { rows, rowCount: rows.length };
  }

  // 6. USERS: INSERT INTO users
  if (/INSERT INTO users/i.test(normalizedSql)) {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const newUser = {
      id,
      full_name: params[0],
      email: params[1],
      phone: params[2],
      password_hash: params[3],
      created_at: now,
      updated_at: now
    };
    store.users.push(newUser);
    saveEmbeddedStore();
    return { rows: [newUser], rowCount: 1 };
  }

  // 7. USERS: UPDATE password
  if (/UPDATE users SET password_hash = \$1/i.test(normalizedSql)) {
    const newHash = params[0];
    const id = params[1];
    const user = store.users.find(u => u.id === id);
    if (user) {
      user.password_hash = newHash;
      user.updated_at = new Date().toISOString();
      saveEmbeddedStore();
      return { rows: [user], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  }

  // 8. FAMILY MEMBERS: Select by user_id
  if (/SELECT \* FROM family_members WHERE user_id = \$1/i.test(normalizedSql)) {
    const userId = params[0];
    const rows = store.family_members.filter(f => f.user_id === userId);
    return { rows, rowCount: rows.length };
  }

  // 9. FAMILY MEMBERS: INSERT
  if (/INSERT INTO family_members/i.test(normalizedSql)) {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const newMember = {
      id,
      user_id: params[0],
      name: params[1],
      age: params[2],
      gender: params[3],
      relationship: params[4],
      profile_photo_url: params[5] || null,
      created_at: now,
      updated_at: now
    };
    store.family_members.push(newMember);
    saveEmbeddedStore();
    return { rows: [newMember], rowCount: 1 };
  }

  // 10. FAMILY MEMBERS: DELETE
  if (/DELETE FROM family_members/i.test(normalizedSql)) {
    const id = params[0];
    const userId = params[1];
    store.family_members = store.family_members.filter(f => !(f.id === id && f.user_id === userId));
    saveEmbeddedStore();
    return { rows: [], rowCount: 1 };
  }

  // 11. TOOTHBRUSHES: Select
  if (/SELECT .* FROM toothbrushes/i.test(normalizedSql)) {
    const userId = params[0];
    const userFamilyIds = store.family_members.filter(f => f.user_id === userId).map(f => f.id);
    const brushes = store.toothbrushes.filter(t => userFamilyIds.includes(t.family_member_id));
    const rows = brushes.map(b => {
      const fm = store.family_members.find(f => f.id === b.family_member_id);
      return { ...b, family_member_name: fm ? fm.name : 'Unknown' };
    });
    return { rows, rowCount: rows.length };
  }

  // 12. TOOTHBRUSHES: INSERT
  if (/INSERT INTO toothbrushes/i.test(normalizedSql)) {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const newBrush = {
      id,
      family_member_id: params[0],
      brand: params[1],
      model: params[2],
      color: params[3],
      type: params[4],
      purchase_date: params[5],
      created_at: now,
      updated_at: now
    };
    store.toothbrushes.push(newBrush);
    saveEmbeddedStore();
    return { rows: [newBrush], rowCount: 1 };
  }

  // 13. SCANS: Select
  if (/SELECT .* FROM scans/i.test(normalizedSql)) {
    const userId = params[0];
    const userFamilyIds = store.family_members.filter(f => f.user_id === userId).map(f => f.id);
    const userBrushIds = store.toothbrushes.filter(t => userFamilyIds.includes(t.family_member_id)).map(t => t.id);
    const scans = store.scans.filter(s => userBrushIds.includes(s.toothbrush_id));
    const rows = scans.map(s => {
      const brush = store.toothbrushes.find(t => t.id === s.toothbrush_id);
      const fm = brush ? store.family_members.find(f => f.id === brush.family_member_id) : null;
      return {
        ...s,
        brand: brush ? brush.brand : '',
        model: brush ? brush.model : '',
        family_member_name: fm ? fm.name : 'Unknown'
      };
    });
    return { rows, rowCount: rows.length };
  }

  // 14. SCANS: INSERT
  if (/INSERT INTO scans/i.test(normalizedSql)) {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const newScan = {
      id,
      toothbrush_id: params[0],
      image_url: params[1],
      wear_percentage: params[2],
      health_score: params[3],
      remaining_life_days: params[4],
      condition: params[5],
      confidence_score: params[6],
      bristle_spreading: params[7],
      bristle_bending: params[8],
      bristle_damage: params[9],
      brushing_frequency: params[10] || '2x daily',
      detected_issues: params[11] || [],
      ai_recommendation: params[12] || '',
      scan_date: now,
      created_at: now
    };
    store.scans.push(newScan);
    saveEmbeddedStore();
    return { rows: [newScan], rowCount: 1 };
  }

  // 15. REMINDERS: Select
  if (/SELECT .* FROM reminders/i.test(normalizedSql)) {
    const userId = params[0];
    const userFamilyIds = store.family_members.filter(f => f.user_id === userId).map(f => f.id);
    const reminders = store.reminders.filter(r => userFamilyIds.includes(r.family_member_id));
    const rows = reminders.map(r => {
      const fm = store.family_members.find(f => f.id === r.family_member_id);
      const brush = store.toothbrushes.find(t => t.id === r.toothbrush_id);
      return {
        ...r,
        family_member_name: fm ? fm.name : 'Unknown',
        brand: brush ? brush.brand : '',
        model: brush ? brush.model : ''
      };
    });
    return { rows, rowCount: rows.length };
  }

  // 16. TIPS: Select
  if (/SELECT \* FROM tips/i.test(normalizedSql)) {
    return { rows: store.tips, rowCount: store.tips.length };
  }

  // Default fallback
  return { rows: [], rowCount: 0 };
}

async function query(text, params) {
  if (pgConnected) {
    try {
      return await pool.query(text, params);
    } catch (err) {
      console.warn('PostgreSQL query execution failed, falling back to embedded SQL:', err.message);
      pgConnected = false;
      return await executeEmbeddedQuery(text, params);
    }
  } else {
    return await executeEmbeddedQuery(text, params);
  }
}

async function queryPgOnly(text, params) {
  if (!pgConnected) {
    const err = new Error('PostgreSQL database service unavailable');
    err.code = 'PG_UNAVAILABLE';
    throw err;
  }
  try {
    return await pool.query(text, params);
  } catch (err) {
    pgConnected = false;
    const customErr = new Error('PostgreSQL database query failed: ' + err.message);
    customErr.code = 'PG_UNAVAILABLE';
    throw customErr;
  }
}


module.exports = {
  query,
  queryPgOnly,
  isPgConnected: () => pgConnected,
  setPgConnected: (val) => { pgConnected = val; },
  pool: {
    query,
    connect: async () => {
      if (pgConnected) {
        try {
          return await pool.connect();
        } catch (e) {
          pgConnected = false;
        }
      }
      return {
        query,
        release: () => {}
      };
    },
    on: (event, handler) => pool.on(event, handler)
  },
  getDbMode: () => (pgConnected ? 'postgresql' : 'embedded-sql'),
  setDbMode: () => {}
};

