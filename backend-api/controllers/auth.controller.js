const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

exports.register = async (req, res, next) => {
  try {
    const { email, password, deviceFingerprint } = req.body;

    // 1. Check if user already exists
    const userCheck = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userCheck.rows.length > 0) {
      return res.status(409).json({ success: false, error: 'Identity already registered.' });
    }

    // 2. Hash password securely
    const saltRounds = 12; // High compute cost for financial security
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 3. Extract basic network telemetry
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    // 4. Save to PostgreSQL
    const insertQuery = `
      INSERT INTO users (email, password_hash, device_fingerprint, ip_address) 
      VALUES ($1, $2, $3, $4) RETURNING id, email, created_at
    `;
    const newUser = await db.query(insertQuery, [email, passwordHash, deviceFingerprint, ipAddress]);

    return res.status(201).json({
      success: true,
      message: 'Identity securely registered.',
      user: newUser.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password, deviceFingerprint } = req.body;

    // 1. Fetch user
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials.' });
    }

    // 2. Verify cryptographic hash
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ success: false, error: 'Invalid credentials.' });
    }

    // 3. Telemetry/Fingerprint Check (Active Security)
    if (deviceFingerprint && user.device_fingerprint && deviceFingerprint !== user.device_fingerprint) {
      console.warn(`⚠️ [Security Alert] New device fingerprint detected for user ${user.id}`);
      // In a full production system, this triggers an email alert or MFA challenge
    }

    // --- RBAC INJECTION START ---
    // Assign role dynamically. In the future, this can be pulled directly from a DB column.
    let role = 'CLIENT';
    if (email.includes('admin') || email.includes('officer')) {
        role = 'ADMIN';
    }
    // --- RBAC INJECTION END ---

    // 4. Generate Stateful JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, fingerprint: deviceFingerprint, role: role },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    return res.status(200).json({
      success: true,
      token,
      role, // Pass the role back to the client for React routing
      user: { id: user.id, email: user.email }
    });
  } catch (error) {
    next(error);
  }
};