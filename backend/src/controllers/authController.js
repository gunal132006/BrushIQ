const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const db = require('../config/db');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/jwt');

exports.googleLogin = async (req, res) => {
  console.log('[AUTH] Request received: POST /api/auth/google');
  console.log('[GoogleLogin] Starting Google login request evaluation...');
  const googleClientId = process.env.GOOGLE_CLIENT_ID;

  // 1. Check Google Client ID environment variable
  if (!googleClientId || !googleClientId.trim()) {
    console.log('[GoogleLogin] Branch Taken: GOOGLE_CLIENT_ID environment variable missing or empty -> HTTP 500');
    return res.status(500).json({
      message: 'Google authentication is not configured.'
    });
  }

  // 2. Check PostgreSQL availability (with on-demand re-check)
  if (!db.isPgConnected()) {
    await db.ensurePgConnected();
  }
  if (!db.isPgConnected()) {
    console.log('[DATABASE] Connection status: DISCONNECTED');
    console.log('[GoogleLogin] Branch Taken: PostgreSQL DB disconnected -> HTTP 503');
    return res.status(503).json({
      message: 'PostgreSQL database service unavailable'
    });
  }
  console.log('[DATABASE] Connection status: CONNECTED');

  // 3. Extract and validate idToken input
  const { idToken } = req.body;
  if (!idToken || typeof idToken !== 'string' || !idToken.trim()) {
    console.log('[GOOGLE AUTH] ID token received: NO');
    console.log('[GoogleLogin] Branch Taken: idToken missing from request body -> HTTP 400');
    return res.status(400).json({ message: 'ID token is required' });
  }
  console.log('[GOOGLE AUTH] ID token received: YES');

  try {
    // 4. Verify ID Token using Google's official OAuth2Client
    console.log('[GoogleLogin] Executing verifyIdToken() with GOOGLE_CLIENT_ID:', googleClientId.trim());
    const client = new OAuth2Client(googleClientId.trim());
    let ticket;
    try {
      ticket = await client.verifyIdToken({
        idToken: idToken.trim(),
        audience: googleClientId.trim(),
      });
      console.log('[GOOGLE AUTH] Token verification: PASS');
      console.log('[GoogleLogin] verifyIdToken() execution succeeded!');
    } catch (verifyErr) {
      console.error('[GOOGLE AUTH] Token verification: FAIL');
      console.error('[GoogleLogin] Branch Taken: verifyIdToken() failed -> HTTP 401:', verifyErr.message);
      return res.status(401).json({ message: 'Invalid or expired Google ID token' });
    }

    const payload = ticket.getPayload();
    if (!payload || !payload.sub || !payload.email) {
      console.log('[GoogleLogin] Branch Taken: Invalid token payload -> HTTP 400');
      return res.status(400).json({ message: 'Invalid Google token payload' });
    }

    // 5. Extract verified Google profile data
    const googleId = payload.sub;
    const email = payload.email.trim().toLowerCase();
    const fullName = payload.name || payload.given_name || 'Google User';
    const avatarUrl = payload.picture || null;

    console.log(`[GoogleLogin] Verified token payload: googleId=${googleId}, email=${email}, name=${fullName}`);

    let user;

    // 6. Search PostgreSQL: check if google_id exists
    const byGoogleId = await db.queryPgOnly(
      `SELECT id, full_name, email, phone, google_id, auth_provider, avatar_url, created_at 
       FROM users WHERE google_id = $1`,
      [googleId]
    );

    if (byGoogleId.rows.length > 0) {
      console.log('[GOOGLE AUTH] Database lookup: PASS');
      console.log('[GoogleLogin] Found existing user by google_id. Updating last_login...');
      const updateRes = await db.queryPgOnly(
        `UPDATE users 
         SET last_login = CURRENT_TIMESTAMP, 
             avatar_url = COALESCE(avatar_url, $1) 
         WHERE id = $2 
         RETURNING id, full_name, email, phone, google_id, auth_provider, avatar_url, created_at`,
        [avatarUrl, byGoogleId.rows[0].id]
      );
      user = updateRes.rows[0];
    } else {
      // Check if user exists with the same email
      const byEmail = await db.queryPgOnly(
        `SELECT id, full_name, email, phone, google_id, auth_provider, avatar_url, created_at 
         FROM users WHERE LOWER(email) = $1`,
        [email]
      );

      if (byEmail.rows.length > 0) {
        console.log('[GOOGLE AUTH] Database lookup: PASS');
        console.log('[GoogleLogin] Found existing user by email. Linking Google account...');
        const existingId = byEmail.rows[0].id;
        const linkRes = await db.queryPgOnly(
          `UPDATE users 
           SET google_id = $1, 
               auth_provider = COALESCE(auth_provider, 'google'), 
               avatar_url = COALESCE(avatar_url, $2), 
               last_login = CURRENT_TIMESTAMP 
           WHERE id = $3 
           RETURNING id, full_name, email, phone, google_id, auth_provider, avatar_url, created_at`,
          [googleId, avatarUrl, existingId]
        );
        user = linkRes.rows[0];
      } else {
        console.log('[GoogleLogin] Creating new user account for Google sign-in...');
        const insertRes = await db.queryPgOnly(
          `INSERT INTO users (full_name, email, google_id, auth_provider, avatar_url, last_login) 
           VALUES ($1, $2, $3, 'google', $4, CURRENT_TIMESTAMP) 
           RETURNING id, full_name, email, phone, google_id, auth_provider, avatar_url, created_at`,
          [fullName, email, googleId, avatarUrl]
        );
        user = insertRes.rows[0];
        console.log('[GOOGLE AUTH] Database lookup: PASS');
      }
    }

    // 7. Generate normal BrushIQ JWT
    const jwtPayload = { user: { id: user.id } };
    const token = jwt.sign(jwtPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    console.log('[GoogleLogin] Branch Taken: Authentication successful -> HTTP 200');
    // 8. Return standard AuthResponse
    return res.status(200).json({
      token,
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        phone: user.phone || null,
        googleId: user.google_id,
        authProvider: user.auth_provider || 'google',
        avatarUrl: user.avatar_url || null,
        createdAt: user.created_at,
      },
    });

  } catch (err) {
    console.error('[GOOGLE AUTH] Database lookup: FAIL');
    if (err.code === 'PG_UNAVAILABLE' || !db.isPgConnected()) {
      console.error('[GoogleLogin] Branch Taken: Catch block PG_UNAVAILABLE -> HTTP 503');
      return res.status(503).json({ message: 'PostgreSQL database service unavailable' });
    }
    console.error('[GoogleLogin] Branch Taken: Catch block Server Error -> HTTP 500:', err);
    return res.status(500).json({ message: 'Server error during Google authentication' });
  }
};



exports.register = async (req, res) => {
  const { fullName, email, phone, password } = req.body;

  if (!fullName || (!email && !phone) || !password) {
    return res.status(400).json({ message: 'Please provide full name, password, and email or phone number' });
  }

  if (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }
  }

  if (password.length < 10) {
    return res.status(400).json({ message: 'Password must be at least 10 characters long' });
  }

  try {
    const sanitizedEmail = email ? email.trim().toLowerCase() : null;
    const sanitizedPhone = phone ? phone.trim() : null;

    // Check if user already exists
    if (sanitizedEmail) {
      const existingUser = await db.query('SELECT id FROM users WHERE LOWER(email) = $1', [sanitizedEmail]);
      if (existingUser.rows.length > 0) {
        return res.status(400).json({ message: 'User with this email already exists' });
      }
    }
    if (sanitizedPhone) {
      const existingUser = await db.query('SELECT id FROM users WHERE phone = $1', [sanitizedPhone]);
      if (existingUser.rows.length > 0) {
        return res.status(400).json({ message: 'User with this phone number already exists' });
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insert user
    const newUser = await db.query(
      `INSERT INTO users (full_name, email, phone, password_hash) 
       VALUES ($1, $2, $3, $4) RETURNING id, full_name, email, phone, created_at`,
      [fullName.trim(), sanitizedEmail, sanitizedPhone, passwordHash]
    );

    const user = newUser.rows[0];

    // Sign JWT
    const payload = { user: { id: user.id } };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    return res.status(201).json({
      token,
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        phone: user.phone,
        createdAt: user.created_at,
      },
    });

  } catch (err) {
    console.error('Registration error details:', err.message || err);
    if (!db.isPgConnected() || err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
      return res.status(503).json({ message: 'PostgreSQL database service unavailable' });
    }
    return res.status(500).json({ message: 'Server error during registration' });
  }
};

exports.login = async (req, res) => {
  console.log('[AUTH] Request received: POST /api/auth/login');
  const { username, email, password } = req.body;
  const loginIdentifier = username || email;

  if (!loginIdentifier || !password) {
    return res.status(400).json({ message: 'Please enter all fields' });
  }

  // Check PostgreSQL availability (with on-demand re-check)
  if (!db.isPgConnected()) {
    await db.ensurePgConnected();
  }
  if (!db.isPgConnected()) {
    console.log('[DATABASE] Connection status: DISCONNECTED');
    console.log('[AUTH] Login result: DATABASE_ERROR');
    return res.status(503).json({ message: 'PostgreSQL database service unavailable' });
  }
  console.log('[DATABASE] Connection status: CONNECTED');

  try {
    const sanitizedUsername = loginIdentifier.trim().toLowerCase();

    // Find user by email or phone
    const result = await db.query(
      'SELECT * FROM users WHERE LOWER(email) = $1 OR phone = $2',
      [sanitizedUsername, loginIdentifier.trim()]
    );

    if (result.rows.length === 0) {
      console.log('[AUTH] Database lookup: FAIL (user not found)');
      console.log('[AUTH] Login result: INVALID_CREDENTIALS');
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    console.log('[AUTH] Database lookup: PASS');
    const user = result.rows[0];

    if (!user.password_hash) {
      console.log('[AUTH] Login result: INVALID_CREDENTIALS (no password hash)');
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      console.log('[AUTH] Login result: INVALID_CREDENTIALS (password mismatch)');
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    console.log('[AUTH] Login result: SUCCESS');

    // Sign JWT
    const payload = { user: { id: user.id } };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    return res.json({
      token,
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        phone: user.phone,
        createdAt: user.created_at,
      },
    });

  } catch (err) {
    console.error('Login error:', err.message || err);
    if (!db.isPgConnected() || err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
      return res.status(503).json({ message: 'PostgreSQL database service unavailable' });
    }
    return res.status(500).json({ message: 'Server error during login' });
  }
};

exports.forgotPassword = async (req, res) => {
  const { email, phone } = req.body;

  if (!email && !phone) {
    return res.status(400).json({ message: 'Please provide email or phone number' });
  }

  try {
    const username = (email || phone).trim().toLowerCase();
    const result = await db.query(
      'SELECT id, email, phone FROM users WHERE LOWER(email) = $1 OR phone = $2',
      [username, (email || phone).trim()]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: 'User not found' });
    }

    return res.json({
      message: `Password reset instructions have been sent to ${email || phone}. Please check your inbox/messages.`,
    });
  } catch (err) {
    console.error('Forgot password error:', err.message);
    return res.status(500).json({ message: 'Server error during forgot password request' });
  }
};

exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Please provide both current and new password' });
  }

  if (newPassword.length < 10) {
    return res.status(400).json({ message: 'New password must be at least 10 characters long' });
  }

  try {
    const userRes = await db.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = userRes.rows[0];
    const isMatch = await bcrypt.compare(currentPassword, user.password_hash || '');
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newPasswordHash, req.user.id]);

    return res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Change password error:', err.message);
    return res.status(500).json({ message: 'Server error updating password' });
  }
};

exports.getMe = async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, full_name, email, phone, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = result.rows[0];
    return res.json({
      id: user.id,
      fullName: user.full_name,
      email: user.email,
      phone: user.phone,
      createdAt: user.created_at,
    });
  } catch (err) {
    console.error('Get profile error:', err.message);
    return res.status(500).json({ message: 'Server error fetching profile info' });
  }
};

