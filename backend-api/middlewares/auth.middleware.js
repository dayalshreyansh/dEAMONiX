const jwt = require('jsonwebtoken');

const requireAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Access denied. Missing or invalid token.' });
    }

    // Extract the token (format is "Bearer <token>")
    const token = authHeader.split(' ')[1];

    // Verify the token against our secret
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Attach the user info to the request so the controllers know who is uploading
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: 'Session expired or invalid.' });
  }
};

// --- NEW ROLE GATEKEEPER ---
const requireRole = (requiredRole) => {
  return (req, res, next) => {
    // If the token doesn't exist, or the decoded role doesn't match the required clearance
    if (!req.user || req.user.role !== requiredRole) {
      return res.status(403).json({ 
        success: false, 
        error: `Security Override Denied: Endpoint requires ${requiredRole} clearance.` 
      });
    }
    next();
  };
};

module.exports = { requireAuth, requireRole };