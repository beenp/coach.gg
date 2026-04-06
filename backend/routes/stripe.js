const express = require('express');
const db = require('../db');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);  
const {auth} = require('../middleware/auth')
const router = express.Router();

router.post('/create-checkout-session', auth, async (req, res) => {
  const { coachId, gameId, startTime, endTime } = req.body;

  try {
    const coachResult = await db.query('SELECT hourly_rate FROM coaches WHERE id = $1', [coachId]);
    if (coachResult.rows.length === 0) return res.status(404).json({ error: 'Coach not found' });
    
    const hourlyRate = coachResult.rows[0].hourly_rate;
    
    const amountInCents = Math.round(hourlyRate * 100);

    // Create the Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: '1-on-1 Coaching Session',
              description: `Gaming coaching session.`, 
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      // We pass our internal IDs as metadata so we know what to do when payment succeeds
      metadata: {
        clientId: req.user.id,
        coachId,
        gameId,
        startTime,
        endTime
      },
      // Where Stripe sends the user after the transaction
      success_url: `http://localhost:5173/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `http://localhost:5173/dashboard`,
    });

    // Return the Stripe-hosted URL to the frontend
    res.json({ url: session.url });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Stripe error' });
  }
});

module.exports = router;