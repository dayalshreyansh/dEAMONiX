const express = require('express');
const router = express.Router();
const documentController = require('../controllers/document.controller');

// Destructure both gatekeepers
const { requireAuth, requireRole } = require('../middlewares/auth.middleware');

// 🔒 The React frontend calls this when the user clicks "Run Compliance Analysis"
router.post('/analyze', requireAuth, documentController.queueForAnalysis);

module.exports = router;