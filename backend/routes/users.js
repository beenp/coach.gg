// backend/routes/users.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware'); // Import our guard
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

module.exports = router;