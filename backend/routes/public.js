const express = require('express');
const router = express.Router();
const db = require('../db');

// Fetch all available games
router.get('/games', async (req, res) => {
  try {
    const games = await db.query(`
      SELECT g.id, g.name, g.image_url, 
             COUNT(c.id) AS coach_count
      FROM games g
      LEFT JOIN coaches c ON g.id = c.game_id 
      GROUP BY g.id, g.name, g.image_url
      ORDER BY coach_count DESC, g.name ASC;
    `);
    res.json(games.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Fetch all coaches, joining their usernames and calculating average ratings
router.get('/coaches', async (req, res) => {
  try {
    const coaches = await db.query(`
      SELECT c.id AS coach_id, c.hourly_rate, u.username,
             COALESCE(ROUND(AVG(r.rating), 1), 0) AS rating,
             COUNT(r.id) AS review_count
      FROM coaches c
      JOIN users u ON c.user_id = u.id
      LEFT JOIN reviews r ON c.id = r.coach_id
      GROUP BY c.id, u.username
    `);
    res.json(coaches.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});
// GET a single coach profile by ID
router.get('/coaches/:id', async (req, res) => {
  try {
    const coach = await db.query(`
      SELECT c.id AS coach_id, c.hourly_rate, u.username,
             COALESCE(ROUND(AVG(r.rating), 1), 0) AS rating,
             COUNT(r.id) AS review_count
      FROM coaches c
      JOIN users u ON c.user_id = u.id
      LEFT JOIN reviews r ON c.id = r.coach_id
      WHERE c.id = $1
      GROUP BY c.id, u.username
    `, [req.params.id]);

    if (coach.rows.length === 0) return res.status(404).json({ error: 'Coach not found' });
    res.json(coach.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

const { getAvailableSlots } = require('../utils/bookingHelper');

// GET available time slots for a specific coach on a specific date
router.get('/coaches/:id/availability', async (req, res) => {
  const { date } = req.query; // Expects format: YYYY-MM-DD
  
  if (!date) return res.status(400).json({ error: 'Date is required' });

  try {
    const slots = await getAvailableSlots(req.params.id, date);
    res.json(slots);
  } catch (err) {
    console.error('Error fetching availability:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Fetch coaches filtered by a specific game ID
router.get('/games/:id/coaches', async (req, res) => {
  try {
    const coaches = await db.query(`
      SELECT c.id AS coach_id, c.hourly_rate, u.username, g.name AS game_name,
             COALESCE(ROUND(AVG(r.rating), 1), 0) AS rating,
             COUNT(r.id) AS review_count
      FROM coaches c
      JOIN users u ON c.user_id = u.id
      JOIN games g ON c.game_id = g.id
      LEFT JOIN reviews r ON c.id = r.coach_id
      WHERE c.game_id = $1
      GROUP BY c.id, u.username, g.name
    `, [req.params.id]);
    
    res.json(coaches.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;