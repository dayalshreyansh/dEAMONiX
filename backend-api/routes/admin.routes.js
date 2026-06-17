const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');

// --- RBAC SECURITY LAYER ---
const { requireAuth, requireRole } = require('../middlewares/auth.middleware');

// 🔒 Apply the gatekeeper middleware to ALL routes in this file
// This ensures ONLY users with the 'ADMIN' role in their JWT can execute these
router.use(requireAuth);
router.use(requireRole('ADMIN'));
// ---------------------------

// Route: Fetches the live list of applications for the dashboard sidebar
router.get('/queue', adminController.getQueue);

// Secure route parameter passing for pulling localized application profiles
router.get('/applications/:id/forensics', adminController.getApplicationForensicSummary);

// Route: Submits the final Approved/Rejected underwriting decision
router.post('/verdict', adminController.submitVerdict);

router.post('/promote', adminController.promoteToAdmin);

module.exports = router;