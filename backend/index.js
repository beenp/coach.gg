const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors()); 
app.use(express.json()); 

// Import Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
app.use('/api/users', userRoutes);

// Google routes
const calendarRoutes = require('./routes/calendar');
app.use('/api/calendar', calendarRoutes);

// Mount Routes
app.use('/api/auth', authRoutes);

// Basic health check route
app.get('/', (req, res) => {
  res.send('coach.gg API is running');
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});