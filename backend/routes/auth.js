// backend/routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db'); 

const router = express.Router();

//Registration route
router.post('/register', async (req, res) => {
  const {
    username,
    email,
    password
  } = req.body;

  try {
    const userCheck = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({
        error: 'User already exists'
      });
    }

    //Hashing passwords
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await db.query(
      'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email, role',
      [username, email, passwordHash]
    );

    const token = jwt.sign({
      id: newUser.rows[0].id,
      role: newUser.rows[0].role
    },
      process.env.JWT_SECRET, {
      expiresIn: '7d'
    }
    );

    res.json({
      token,
      user: newUser.rows[0]
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      error: 'Server error during registration'
    });
  }
});

//Login route
router.post('/login', async (req, res) => {
  const {
    email,
    password
  } = req.body;

  try {
    const userResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return res.status(400).json({
        error: 'Invalid credentials'
      });
    }
    const user = userResult.rows[0];

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({
        error: 'Invalid credentials'
      });
    }

    const token = jwt.sign({
      id: user.id,
      role: user.role
    },
      process.env.JWT_SECRET, {
      expiresIn: '7d'
    }
    );

    //Prevents hashed password to be sent to frontend
    delete user.password_hash;
    res.json({
      token,
      user
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      error: 'Server error during login'
    });
  }
});

module.exports = router;