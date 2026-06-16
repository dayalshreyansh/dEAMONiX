const db = require('../config/db');

// 1. Fetch the Live Queue for the Admin Dashboard
exports.getQueue = async (req, res, next) => {
  try {
    const queryText = `
      SELECT 
        id, 
        user_id, 
        requested_amount, 
        overall_status, 
        overall_risk_matrix, 
        cibil_score, 
        composite_credit_score,
        created_at 
      FROM loan_applications 
      ORDER BY created_at DESC;
    `;
    const result = await db.query(queryText);
    
    return res.status(200).json({ 
      success: true, 
      count: result.rows.length,
      queue: result.rows 
    });
  } catch (error) {
    console.error("❌ Database Error (Admin Queue):", error);
    next(error);
  }
};

// 2. Fetch Deep Forensics for a Single Application (Your Existing Route)
exports.getApplicationForensicSummary = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Execute a relational JOIN to stitch the parent application with all child jobs
    const queryText = `
      SELECT 
        la.id as application_id,
        la.cibil_score,
        la.requested_amount,
        la.overall_status,
        la.overall_risk_matrix,
        la.composite_credit_score,
        la.created_at as submitted_at,
        fj.id as job_id,
        fj.object_key,
        fj.inferred_document_type,
        fj.status as job_status,
        fj.math_status,
        fj.math_analysis_log,
        fj.visual_tamper_score,
        fj.proof_url
      FROM loan_applications la
      LEFT JOIN forensic_jobs fj ON la.id = fj.application_id
      WHERE la.id = $1;
    `;

    const result = await db.query(queryText, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Target application package not found in ledger."
      });
    }

    // Format the flat SQL rows into a clean, nested JSON profile structure
    const firstRow = result.rows[0];
    const summary = {
      applicationId: firstRow.application_id,
      bureauCibilScore: firstRow.cibil_score,
      requestedAmount: firstRow.requested_amount,
      overallStatus: firstRow.overall_status,
      overallRiskMatrix: firstRow.overall_risk_matrix,
      compositeCreditScore: firstRow.composite_credit_score,
      submittedAt: firstRow.submitted_at,
      documentsAnalyzed: []
    };

    // Map the child jobs array dynamically
    result.rows.forEach(row => {
      if (row.job_id) {
        summary.documentsAnalyzed.push({
          jobId: row.job_id,
          storagePath: row.object_key,
          inferredType: row.inferred_document_type,
          processingStatus: row.job_status,
          complianceMathStatus: row.math_status,
          auditLog: row.math_analysis_log,
          visualTamperScore: parseFloat(row.visual_tamper_score || 0).toFixed(2),
          // Construct an internal path pointer to the MinIO ELA verification heatmap
          elaProofKey: row.proof_url
        });
      }
    });

    return res.status(200).json({
      success: true,
      data: summary
    });

  } catch (error) {
    next(error);
  }
};

// 3. Execute the Final Underwriter Decision
exports.submitVerdict = async (req, res, next) => {
  try {
    const { applicationId, finalDecision } = req.body;

    if (!applicationId || !['APPROVED', 'REJECTED'].includes(finalDecision)) {
      return res.status(400).json({ success: false, error: "Invalid payload parameters. Must specify a valid application ID and judgment decision." });
    }

    const updateQuery = `
      UPDATE loan_applications 
      SET overall_status = $1, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $2 RETURNING id;
    `;
    const result = await db.query(updateQuery, [finalDecision, applicationId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, error: "Target loan application bundle not found." });
    }

    return res.status(200).json({
      success: true,
      message: `Underwriting policy updated successfully. Application locked as: ${finalDecision}`
    });

  } catch (error) {
    console.error("❌ Database Error (Verdict Submission):", error);
    next(error);
  }
};