const { auth, admin } = require('../middleware/auth');
const express = require('express');
const router = express.Router();
const db = require('../db');



router.get('/stats', auth, admin, async (req, res) => {
  
  if (!db) {
    return res.status(500).json({ error: "Database module not found" });
  }

  try {

    const result = await db.query('SELECT COUNT(*) as total FROM coach_applications');

    const totalApps = result.rows[0].total;

    res.json({
      totalApplications: parseInt(totalApps) || 0,
      pendingReviews: 0, 
      activeCoaches: 0
    });

  } catch (err) {
    console.error("SQL EXECUTION ERROR:", err.message);
    res.status(500).json({ error: "Query failed", details: err.message });
  }
});

// POST a new game to the marketplace
router.post('/games', auth, admin, async (req, res) => {
  console.log("!!! GAME POST ROUTE HIT !!!"); // Check your terminal for this!
  console.log("Body received:", req.body);
  const { name, image_url } = req.body;
  try {
    const newGame = await db.query(
      'INSERT INTO games (name, image_url) VALUES ($1, $2) RETURNING *',
      [name, image_url]
    );
    res.json(newGame.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

//Get all pending applications
router.get('/applications', auth, admin, async (req, res) => {
  try {
    const apps = await db.query(`
      SELECT a.id, a.certification_url, a.created_at, u.username, u.email, g.name AS game_name
      FROM coach_applications a
      JOIN users u ON a.user_id = u.id
      JOIN games g ON a.game_id = g.id
      WHERE a.status = 'pending'
      ORDER BY a.created_at ASC
    `);
    res.json(apps.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

//Approve or Reject an application
router.put('/applications/:id', auth, admin, async (req, res) => {
  const { action } = req.body; 
  
  try {
    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    
    // Update the application status
    const appRes = await db.query(
      'UPDATE coach_applications SET status = $1 WHERE id = $2 RETURNING *',
      [newStatus, req.params.id]
    );
    
    const app = appRes.rows[0];

    if (newStatus === 'approved') {
      await db.query(
        'INSERT INTO coaches (user_id, game_id, hourly_rate) VALUES ($1, $2, $3)',
        [app.user_id, app.game_id, 25] 
      );
    }

    res.json({ message: `Application ${newStatus}` });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET all approved coaches
// GET all coaches using db.query
router.get('/coaches', auth, admin, async (req, res) => {
    try {
        
        // Use "fullName" if your column is camelCase, or full_name if snake_case
        const result = await db.query(
            'SELECT id, username FROM users WHERE role = $1', 
            ['coach']
        );
        res.json(result.rows);

    } catch (err) {
        // This will print the EXACT reason for the 500 error in your terminal
        console.error("DATABASE ERROR:", err.message);
        res.status(500).json({ error: "Database query failed", details: err.message });
    }
});
module.exports = router;