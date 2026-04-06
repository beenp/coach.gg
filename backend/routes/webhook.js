const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const db = require('../db');
const { createMeetLink } = require('../utils/googleCalendar');
const router = express.Router();

router.post('/', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { clientId, coachId, gameId, startTime, endTime } = session.metadata;

    try {
      // 1. Create the session in the database
      const newSession = await db.query(
        `INSERT INTO sessions (client_id, coach_id, game_id, start_time, end_time, status) 
         VALUES ($1, $2, $3, $4, $5, 'confirmed') RETURNING id`,
        [clientId, coachId, gameId, startTime, endTime]
      );

      const sessionId = newSession.rows[0].id;

      const coachData = await db.query(
        `SELECT u.gcal_token, u.email 
         FROM coaches c JOIN users u ON c.user_id = u.id 
         WHERE c.id = $1`, [coachId]
      );
      
      const clientData = await db.query('SELECT email FROM users WHERE id = $1', [clientId]);

      const token = coachData.rows[0].gcal_token;
      const coachEmail = coachData.rows[0].email;
      const clientEmail = clientData.rows[0].email;

      // Generate the link
      if (token) {
        const meetLink = await createMeetLink(token, startTime, endTime, clientEmail, coachEmail);
        
        // Save the link to the session
        await db.query(
          'UPDATE sessions SET meet_link = $1 WHERE id = $2',
          [meetLink, sessionId]
        );
      }

      console.log('Booking saved and Meet link generated!');

      // 2. Log the transaction
      await db.query(
        `INSERT INTO transactions (session_id, amount, stripe_payment_id, status) 
         VALUES ($1, $2, $3, 'completed')`,
        [sessionId, session.amount_total / 100, session.id]
      );

      console.log('Booking saved successfully!');
    } catch (err) {
      console.error('Database error saving booking:', err);
      // Still return 200 to Stripe so it doesn't retry
    }
  }

  res.json({ received: true });
});

module.exports = router;