// backend/routes/calendar.js
const express = require('express');
const { google } = require('googleapis');
const db = require('../db');
const auth = require('../middleware/authMiddleware'); // Our trusty bouncer

const router = express.Router();

// Initialize the Google OAuth Client
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'http://localhost:5000/api/calendar/auth/google/callback' // Must match Google Console exactly!
);

// @route   GET /api/calendar/connect
// @desc    Generates the Google Login URL for a coach
// @access  Private (Requires JWT token)
router.get('/connect', auth, (req, res) => {
  try {
    // Generate the URL that asks for Calendar access
    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline', // Crucial: This gets us a Refresh Token so they stay logged in
      prompt: 'consent', // Forces Google to show the consent screen
      scope: ['https://www.googleapis.com/auth/calendar.events'],
      state: req.user.id // We hide the user's ID here so Google passes it back to us later
    });

    res.json({ url });
  } catch (err) {
    console.error('Error generating Google URL:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/calendar/auth/google/callback
// @desc    Google redirects here after the user clicks "Allow"
// @access  Public (Hit by Google, not your frontend app directly)
router.get('/auth/google/callback', async (req, res) => {
  const { code, state } = req.query; // Google gives us the auth 'code' and our hidden 'state' (user ID)
  const userId = state; 

  try {
    // 1. Exchange the code for the actual access/refresh tokens
    const { tokens } = await oauth2Client.getToken(code);
    const tokensString = JSON.stringify(tokens);

    // 2. Check if this user already has a 'coach' profile
    const coachCheck = await db.query('SELECT * FROM coaches WHERE user_id = $1', [userId]);

    if (coachCheck.rows.length === 0) {
      // If they aren't a coach yet, create their coach profile and save the token
      await db.query(
        'INSERT INTO coaches (user_id, hourly_rate, gcal_token) VALUES ($1, $2, $3)',
        [userId, 25.00, tokensString] // Defaulting rate to $25/hr for now
      );
      
      // Update their user role to 'coach'
      await db.query("UPDATE users SET role = 'coach' WHERE id = $1", [userId]);
    } else {
      // If they are already a coach, just update the token
      await db.query(
        'UPDATE coaches SET gcal_token = $1 WHERE user_id = $2',
        [tokensString, userId]
      );
    }

    // 3. Redirect the user back to the React frontend dashboard with a success flag
    res.redirect('http://localhost:5173/dashboard?sync=success');

  } catch (err) {
    console.error('Error exchanging code for tokens:', err);
    res.redirect('http://localhost:5173/dashboard?sync=failed');
  }
});

module.exports = router;