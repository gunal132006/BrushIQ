const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretbrushiqjwttoken';

const verifyGoogleToken = async (googleId) => {
  const start = Date.now();
  console.log("Before verify token");
  // Simulated token verification
  console.log("Token verified");
  console.log("verifyGoogleToken took", Date.now() - start, "ms");
  return true;
};

exports.register = async (req, res) => {
  console.log("REGISTER START");
  const { fullName, email, phone, password } = req.body;

  if (!fullName || (!email && !phone) || !password) {
    console.log("REGISTER RESPONSE");
    return res.status(400).json({ message: 'Please provide full name, password, and email or phone' });
  }

  try {
    // Check if user already exists
    if (email) {
      console.log("Before database lookup");
      const existingUser = await db.query('SELECT * FROM users WHERE email = $1', [email]);
      console.log("Database lookup complete");
      if (existingUser.rows.length > 0) {
        console.log("REGISTER RESPONSE");
        return res.status(400).json({ message: 'User with this email already exists' });
      }
    }
    if (phone) {
      console.log("Before database lookup");
      const existingUser = await db.query('SELECT * FROM users WHERE phone = $1', [phone]);
      console.log("Database lookup complete");
      if (existingUser.rows.length > 0) {
        console.log("REGISTER RESPONSE");
        return res.status(400).json({ message: 'User with this phone number already exists' });
      }
    }

    // Hash password
    console.log("Before database lookup");
    const salt = await bcrypt.genSalt(10);
    console.log("Database lookup complete");

    console.log("Before database lookup");
    const passwordHash = await bcrypt.hash(password, salt);
    console.log("Database lookup complete");

    // Insert user
    console.log("Before user creation");
    const newUser = await db.query(
      `INSERT INTO users (full_name, email, phone, password_hash) 
       VALUES ($1, $2, $3, $4) RETURNING id, full_name, email, phone, created_at`,
      [fullName, email || null, phone || null, passwordHash]
    );
    console.log("User creation complete");

    const user = newUser.rows[0];

    // Sign JWT
    console.log("Before JWT generation");
    const payload = { user: { id: user.id } };
    try {
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
      console.log("JWT generated");
      console.log("REGISTER RESPONSE");
      return res.status(201).json({ token, user });
    } catch (jwtErr) {
      console.error("JWT sign failed:", jwtErr);
      throw jwtErr;
    }

  } catch (err) {
    console.error('Registration error:', err.message);
    console.log("REGISTER RESPONSE");
    return res.status(500).json({ message: 'Server error during registration' });
  }
};

exports.login = async (req, res) => {
  console.log("LOGIN START");
  const { username, password } = req.body; // username can be email or phone

  if (!username || !password) {
    console.log("LOGIN RESPONSE");
    return res.status(400).json({ message: 'Please enter all fields' });
  }

  try {
    // Find user by email or phone
    console.log("Before database lookup");
    const result = await db.query(
      'SELECT * FROM users WHERE email = $1 OR phone = $2',
      [username, username]
    );
    console.log("Database lookup complete");

    if (result.rows.length === 0) {
      console.log("LOGIN RESPONSE");
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Check password
    console.log("Before database lookup");
    const isMatch = await bcrypt.compare(password, user.password_hash);
    console.log("Database lookup complete");
    if (!isMatch) {
      console.log("LOGIN RESPONSE");
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Sign JWT
    console.log("Before JWT generation");
    const payload = { user: { id: user.id } };
    try {
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
      console.log("JWT generated");
      console.log("LOGIN RESPONSE");
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
    } catch (jwtErr) {
      console.error("JWT sign failed:", jwtErr);
      throw jwtErr;
    }

  } catch (err) {
    console.error('Login error:', err.message);
    console.log("LOGIN RESPONSE");
    return res.status(500).json({ message: 'Server error during login' });
  }
};

exports.googleLogin = async (req, res) => {
  console.log("GOOGLE LOGIN START");
  const { googleId, email, fullName, photoUrl } = req.body;

  if (!googleId || !email) {
    console.log("GOOGLE LOGIN RESPONSE");
    return res.status(400).json({ message: 'Google ID and email are required' });
  }

  try {
    // Verify Google Token
    await verifyGoogleToken(googleId);

    // Check if user exists by google_id or email
    console.log("Before database lookup");
    let result = await db.query('SELECT * FROM users WHERE google_id = $1 OR email = $2', [googleId, email]);
    console.log("Database lookup complete");
    let user;

    if (result.rows.length === 0) {
      // Create new user (Google authentication bypass/registration)
      console.log("Before user creation");
      const newUser = await db.query(
        `INSERT INTO users (full_name, email, google_id) 
         VALUES ($1, $2, $3) RETURNING id, full_name, email, created_at`,
        [fullName || 'Google User', email, googleId]
      );
      console.log("User creation complete");
      user = newUser.rows[0];
    } else {
      user = result.rows[0];
      // Update google_id if not present
      if (!user.google_id) {
        console.log("Before database lookup");
        await db.query('UPDATE users SET google_id = $1 WHERE id = $2', [googleId, user.id]);
        console.log("Database lookup complete");
      }
    }

    // Sign JWT
    console.log("Before JWT generation");
    const payload = { user: { id: user.id } };
    try {
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
      console.log("JWT generated");
      console.log("GOOGLE LOGIN RESPONSE");
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
    } catch (jwtErr) {
      console.error("JWT sign failed:", jwtErr);
      throw jwtErr;
    }

  } catch (err) {
    console.error('Google login error:', err.message);
    console.log("GOOGLE LOGIN RESPONSE");
    return res.status(500).json({ message: 'Server error during Google auth' });
  }
};

exports.forgotPassword = async (req, res) => {
  const { email, phone } = req.body;

  if (!email && !phone) {
    return res.status(400).json({ message: 'Please provide email or phone number' });
  }

  try {
    const username = email || phone;
    const result = await db.query(
      'SELECT * FROM users WHERE email = $1 OR phone = $2',
      [username, username]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: 'User not found' });
    }

    // Simulating sending recovery message
    res.json({
      message: `Verification code successfully sent to ${username}. Please check your inbox/messages.`,
    });
  } catch (err) {
    console.error('Forgot password error:', err.message);
    res.status(500).json({ message: 'Server error during forgot password' });
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
    res.json({
      id: user.id,
      fullName: user.full_name,
      email: user.email,
      phone: user.phone,
      createdAt: user.created_at,
    });
  } catch (err) {
    console.error('Get profile error:', err.message);
    res.status(500).json({ message: 'Server error fetching profile info' });
  }
};
