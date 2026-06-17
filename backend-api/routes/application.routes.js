const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { pool } = require('../config/db');
const s3Client = require('../config/s3'); 
const { PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const {getClientApplications}= require('../controllers/application.controller');
// --- REDIS UPGRADE START ---
// Establish connection to the message broker
const Redis = require('ioredis');
const redis = new Redis({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT || 6379,
});
// --- REDIS UPGRADE END ---

// --- RBAC UPGRADE START ---
const { requireAuth, requireRole } = require('../middlewares/auth.middleware'); 
// --- RBAC UPGRADE END ---

// 1. INITIALIZE ROUTE: Only sets up the DB and creates upload URLs. Does NOT wake Python.
router.post('/initialize', requireAuth, requireRole('CLIENT'), async (req, res) => {
    if (!pool || typeof pool.connect !== 'function') {
        return res.status(500).json({ success: false, message: "Database initialization mismatch." });
    }

    let client;
    try {
        client = await pool.connect();

        const { requestedAmount, documentManifest, cibilScore } = req.body; 
        
        const userId = req.user ? (req.user.id || req.user.userId || req.user._id) : null;

        if (!userId) {
            return res.status(401).json({ success: false, error: "Unauthorized: Valid user session payload could not be isolated." });
        }
        if (!cibilScore || cibilScore < 300 || cibilScore > 900) {
            return res.status(400).json({ success: false, error: "Invalid CIBIL bureau rating parameters. Values must fall between 300 and 900." });
        }
        if (!documentManifest || !Array.isArray(documentManifest) || documentManifest.length < 3) {
            return res.status(400).json({ success: false, error: "A comprehensive loan package requires a baseline verification manifest of at least 3 documents." });
        }

        const applicationId = `app_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

        await client.query('BEGIN');

        const appQuery = `
            INSERT INTO loan_applications (id, user_id, requested_amount, overall_status, cibil_score) 
            VALUES ($1, $2, $3, 'PENDING_DOCUMENTS', $4);
        `;
        await client.query(appQuery, [applicationId, userId, requestedAmount, cibilScore]);

        const provisionedManifest = [];
        for (const filename of documentManifest) {
            const jobId = `job_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
            const objectKey = `vault/${applicationId}/${jobId}_${filename}`;

            const command = new PutObjectCommand({
                Bucket: process.env.MINIO_BUCKET_NAME || 'finguard-documents',
                Key: objectKey,
                ContentType: 'application/pdf'
            });
            const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });

            const jobQuery = `
                INSERT INTO forensic_jobs (id, user_id, application_id, object_key, status) 
                VALUES ($1, $2, $3, $4, 'QUEUED');
            `;
            await client.query(jobQuery, [jobId, userId, applicationId, objectKey]);

            provisionedManifest.push({ jobId, filename, objectKey, uploadUrl });
        }

        await client.query('COMMIT');
        
        return res.status(201).json({ 
            success: true, 
            applicationId, 
            cibilScore, 
            bundleManifest: provisionedManifest 
        });

    } catch (error) {
        if (client) {
            await client.query('ROLLBACK');
        }
        console.error("❌ Transactional Package Assembly Aborted Detailed Error Stack:\n", error);
        return res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
    } finally {
        if (client) {
            client.release();
        }
    }
});

// 2. FINALIZE ROUTE: Called by frontend AFTER files are physically uploaded to MinIO.
router.post('/:id/finalize', requireAuth, requireRole('CLIENT'), async (req, res) => {
    const applicationId = req.params.id;
    const userId = req.user ? (req.user.id || req.user.userId || req.user._id) : null;

    if (!userId) {
        return res.status(401).json({ success: false, error: "Unauthorized: Valid user session payload could not be isolated." });
    }

    try {
        // Mark the application as ready for processing
        await pool.query(
            "UPDATE loan_applications SET overall_status = 'PROCESSING' WHERE id = $1 AND user_id = $2",
            [applicationId, userId]
        );

        // --- EVENT DISPATCH LAYER ---
        // Now that files are definitely in MinIO, wake up the Python worker
        await redis.lpush('forensic_tasks', JSON.stringify({ 
            applicationId: applicationId, 
            userId: userId, 
            timestamp: Date.now() 
        }));
        // ----------------------------

        return res.status(200).json({ 
            success: true, 
            message: "Application bundle locked and dispatched for forensic analysis." 
        });
    } catch (error) {
        console.error("❌ Finalize Dispatch Error:\n", error);
        return res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/me', requireAuth, requireRole('CLIENT'), getClientApplications);
module.exports = router;