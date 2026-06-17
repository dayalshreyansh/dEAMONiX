const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

exports.register = async (req, res, next) => {
  try {
    const { email, password, deviceFingerprint } = req.body; // Remove 'role' from here
    
    const userCheck = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userCheck.rows.length > 0) {
      return res.status(409).json({ success: false, error: 'Identity already registered.' });
    }

    // SECURITY FIX: Every new registration is forced to be a 'CLIENT'
    const userRole = 'CLIENT'; 

    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    const insertQuery = `
      INSERT INTO users (email, password_hash, device_fingerprint, ip_address, role) 
      VALUES ($1, $2, $3, $4, $5) RETURNING id, email, role, created_at
    `;
    const newUser = await db.query(insertQuery, [email, passwordHash, deviceFingerprint, ipAddress, userRole]);

    return res.status(201).json({ success: true, user: newUser.rows[0] });
  } catch (error) { next(error); }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password, deviceFingerprint } = req.body;

    // Fetch user including the new 'role' column
    const result = await db.query('SELECT id, email, password_hash, device_fingerprint, role FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials.' });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ success: false, error: 'Invalid credentials.' });
    }

    // Generate JWT using the role retrieved directly from the DB
    const token = jwt.sign(
      { userId: user.id, email: user.email, fingerprint: deviceFingerprint, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    return res.status(200).json({
      success: true,
      token,
      role: user.role, // Returned directly from the DB
      user: { id: user.id, email: user.email }
    });
  } catch (error) {
    next(error);
  }
};