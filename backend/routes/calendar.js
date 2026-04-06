//For coaches to create/book meetings with clients
const express = require('express');
const { google } = require('googleapis');
const db = require('../db');
const {auth} = require('../middleware/auth'); 

const router = express.Router();

// Initialize the Google OAuth Client
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'http://localhost:5000/api/calendar/auth/google/callback' 
);

// @route   GET /api/calendar/connect
// @desc    Generates the Google Login URL for a coach
// @access  Private (Requires JWT token)
router.get('/connect', auth, (req, res) => {
  try {
    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline', 
      prompt: 'consent', 
      scope: ['https://www.googleapis.com/auth/calendar.events'],
      state: req.user.id 
    });

    res.json({ url });
  } catch (err) {
    console.error('Error generating Google URL:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/calendar/auth/google/callback
// @desc    redirects here after the user clicks "Allow"
// @access  Public 
router.get('/auth/google/callback', async (req, res) => {
  const { code, state } = req.query; 
  const userId = state;

  try {
    const { tokens } = await oauth2Client.getToken(code);
    const tokensString = JSON.stringify(tokens);

    // Save the token to the USERS table, not the coaches table
    await db.query('UPDATE users SET gcal_token = $1 WHERE id = $2', [tokensString, userId]);

    res.redirect('http://localhost:5173/dashboard?sync=success');
  } catch (err) {
    console.error('Error exchanging code for tokens:', err);
    res.redirect('http://localhost:5173/dashboard?sync=failed');
  }
})

module.exports = router;