
const {auth} = require('../middleware/auth');
const express = require('express');
const router = express.Router();
const db = require('../db');

// @route   GET /api/users/me
// @desc    Get current logged in user's profile
// @access  Private (Notice the 'auth' middleware passed in below)
router.get('/me', auth, async (req, res) => {
  try {
    // req.user.id comes from the decoded JWT in the middleware
    const userResult = await db.query(
      'SELECT id, username, email, role, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(userResult.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/users/me/coach-status
// @desc    Check if the logged-in user is a coach and has connected their calendar
// @access  Private
router.get('/me/coach-status', auth, async (req, res) => {
  try {
    const userRes = await db.query('SELECT username, role FROM users WHERE id = $1', [req.user.id]);
    const coachRes = await db.query('SELECT hourly_rate, availability, timezone FROM coaches WHERE user_id = $1', [req.user.id]);
    
    // Check if they have a pending application
    const appRes = await db.query("SELECT status FROM coach_applications WHERE user_id = $1 AND status = 'pending'", [req.user.id]);

    const isCalendarConnected = !!userRes.rows[0]?.gcal_token;

    res.json({ 
      username: userRes.rows[0]?.username,
      role: userRes.rows[0]?.role,
      isCoach: coachRes.rows.length > 0, 
      hasPendingApplication: appRes.rows.length > 0, // NEW FIELD
      isCalendarConnected,
      hourlyRate: coachRes.rows[0]?.hourly_rate,
      availability: coachRes.rows[0]?.availability,
      timezone: coachRes.rows[0]?.timezone
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/become-coach', auth, async (req, res) => {
  const { hourlyRate } = req.body;
  try {
    // 1. Create the coach profile
    await db.query(
      'INSERT INTO coaches (user_id, hourly_rate) VALUES ($1, $2)',
      [req.user.id, hourlyRate]
    );
    
    // 2. Upgrade the user's role
    await db.query("UPDATE users SET role = 'coach' WHERE id = $1", [req.user.id]);
    
    res.json({ message: 'Successfully upgraded to coach!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/me/availability', auth, async (req, res) => {
  const { availability, timezone, gameId, hourlyRate } = req.body;  
  try {
    await db.query(
      `UPDATE coaches 
       SET availability = $1, timezone = $2, game_id = $3, hourly_rate = $4 
       WHERE user_id = $5`,
      [availability, timezone, gameId, hourlyRate, req.user.id]
    );
    res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Submit a coach application
// Submit a coach application
// Submit a coach application
router.post('/apply', auth, async (req, res) => {
  console.log("1. Backend received application request!"); // <--- LOG 1
  
  const { gameId, certificationUrl, fullName, email, phone } = req.body;
  
  // 1. Validate inputs
  if (!gameId || !certificationUrl || !fullName || !email || !phone) {
    console.log("2. FAILED: Missing fields."); // <--- LOG 2
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    console.log("3. Attempting database insert for user:", req.user.id); // <--- LOG 3
    
    // 2. Insert to database
    await db.query(
      `INSERT INTO coach_applications 
      (user_id, game_id, certification_url, full_name, email, phone) 
      VALUES ($1, $2, $3, $4, $5, $6)`,
      [req.user.id, gameId, certificationUrl, fullName, email, phone]
    );
    
    console.log("4. Database insert SUCCESS!"); // <--- LOG 4
    return res.json({ message: 'Application submitted' });

  } catch (err) {
    console.log("5. Database ERROR caught:", err.message); // <--- LOG 5
    return res.status(500).json({ error: 'You already have a pending application or server error.' });
  }
});
module.exports = router;