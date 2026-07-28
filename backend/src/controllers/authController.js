const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretbrushiqjwttoken';

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

  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters long' });
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
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

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
    console.error('Registration error:', err.message);
    return res.status(500).json({ message: 'Server error during registration' });
  }
};

exports.login = async (req, res) => {
  const { username, password } = req.body; // username can be email or phone

  if (!username || !password) {
    return res.status(400).json({ message: 'Please enter all fields' });
  }

  try {
    const sanitizedUsername = username.trim().toLowerCase();

    // Find user by email or phone
    const result = await db.query(
      'SELECT * FROM users WHERE LOWER(email) = $1 OR phone = $2',
      [sanitizedUsername, username.trim()]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const user = result.rows[0];

    if (!user.password_hash) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Sign JWT
    const payload = { user: { id: user.id } };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

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
    console.error('Login error:', err.message);
    return res.status(500).json({ message: 'Server error during login' });
  }
};

exports.googleLogin = async (req, res) => {
  return res.status(400).json({ 
    message: 'Google Sign-In is not enabled on this environment. Please sign in with your email and password.' 
  });
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

  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'New password must be at least 6 characters long' });
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

