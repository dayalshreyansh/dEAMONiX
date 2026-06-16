const Redis = require('ioredis');
const db = require('../config/db');

// Connect directly to Redis to push the jobs
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379')
});

exports.queueForAnalysis = async (req, res, next) => {
  try {
    const { applicationId } = req.body;
    
    // Fallback logic to safely grab the userId from the JWT
    const userId = req.user ? (req.user.userId || req.user.id || req.user._id) : null;

    if (!applicationId) {
      return res.status(400).json({ success: false, error: "Missing applicationId in payload." });
    }

    // 1. Fetch all 3 documents associated with this specific application
    const trackingRecords = await db.query(
      `SELECT id, object_key FROM forensic_jobs WHERE application_id = $1`,
      [applicationId]
    );

    if (trackingRecords.rows.length === 0) {
      return res.status(404).json({ success: false, error: "No documents found for this application bundle." });
    }

    // 2. Lock the parent application status to 'PROCESSING'
    await db.query(
      `UPDATE loan_applications SET overall_status = 'PROCESSING' WHERE id = $1`, 
      [applicationId]
    );

    // 3. Loop through and dispatch each document to the Python worker via Redis
    for (const record of trackingRecords.rows) {
      const jobId = record.id;
      const objectKey = record.object_key;

      // Mark the child job as queued
      await db.query(`UPDATE forensic_jobs SET status = 'QUEUED' WHERE id = $1`, [jobId]);
      
      // Dispatch to the Python Engine
      const payload = JSON.stringify({ jobId, userId, objectKey });
      await redis.rpush('finguard_forensic_jobs', payload);
    }

    return res.status(202).json({
      success: true,
      message: "Application bundle locked and dispatched to Python forensics pipeline."
    });
  } catch (error) {
    console.error("❌ Forensics Queue Error:", error);
    next(error);
  }
};