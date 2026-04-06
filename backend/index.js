const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL, 
  credentials: true, // Required if you are sending cookies/authorization headers
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

// Stripe Routes
const stripeRoutes = require('./routes/stripe');
app.use('/api/stripe', stripeRoutes);

// Public routes
const publicRoutes = require('./routes/public');
app.use('/api/public', publicRoutes);

// Import Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
app.use('/api/users', userRoutes);

// Google routes
const calendarRoutes = require('./routes/calendar');
app.use('/api/calendar', calendarRoutes);

// Session routes
const sessionRoutes = require('./routes/sessions');
app.use('/api/sessions', sessionRoutes);

// Mount routes
app.use('/api/auth', authRoutes);

// Basic health check route
app.get('/', (req, res) => {
  res.send('coach.gg API is running');
});

// Review routes
const reviewRoutes = require('./routes/reviews');
app.use('/api/reviews', reviewRoutes);

// Admin routes
const adminRoutes = require('./routes/admin');
app.use('/api/admin', adminRoutes);

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});