const express = require('express');
const router = express.Router();
const db = require('../db');
const {auth} = require('../middleware/auth');

router.get('/me', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Fetch sessions where the logged-in user is either the client OR the coach
    const result = await db.query(`
     SELECT s.id, s.start_time, s.end_time, s.meet_link, s.status,
             client.username AS client_name,
             coach_user.username AS coach_name,
             c.id AS coach_id,
             g.name AS game_name
      FROM sessions s
      JOIN users client ON s.client_id = client.id
      JOIN coaches c ON s.coach_id = c.id
      JOIN users coach_user ON c.user_id = coach_user.id
      LEFT JOIN games g ON s.game_id = g.id
      WHERE s.client_id = $1 OR c.user_id = $1
      ORDER BY s.start_time ASC
    `, [userId]);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;