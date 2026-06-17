const db = require('../config/db'); 


const getClientApplications = async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId || req.user._id; 

    const result = await db.query(
      `SELECT id, requested_amount, overall_status, created_at 
       FROM loan_applications 
       WHERE user_id = $1 
       ORDER BY created_at DESC`, 
      [userId]
    );

    res.status(200).json({ success: true, applications: result.rows });
  } catch (error) {
    console.error("❌ History fetch error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch history." });
  }
};

module.exports = { getClientApplications };