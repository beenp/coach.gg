const express = require('express');
const router = express.Router();
const db = require('../db');
const {auth} = require('../middleware/auth');

// POST: Submit a review
router.post('/', auth, async (req, res) => {
  const { sessionId, coachId, rating, comment } = req.body;
  const clientId = req.user.id;

  try {
    const newReview = await db.query(
      `INSERT INTO reviews (session_id, client_id, coach_id, rating, comment) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [sessionId, clientId, coachId, rating, comment]
    );

    res.json(newReview.rows[0]);
  } catch (err) {
    // Catch the specific PostgreSQL error for violating the UNIQUE constraint
    if (err.code === '23505') {
      return res.status(400).json({ error: 'You have already reviewed this session.' });
    }
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET: calculate the average for a specific coach
router.get('/coach/:coachId', async (req, res) => {
  try {
    const reviews = await db.query(
      `SELECT r.rating, r.comment, r.created_at, u.username 
       FROM reviews r 
       JOIN users u ON r.client_id = u.id 
       WHERE r.coach_id = $1 
       ORDER BY r.created_at DESC`,
      [req.params.coachId]
    );
    
    const average = reviews.rows.length 
      ? (reviews.rows.reduce((sum, r) => sum + r.rating, 0) / reviews.rows.length).toFixed(1) 
      : 0;

    res.json({ average, total: reviews.rows.length, reviews: reviews.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;