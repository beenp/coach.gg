// backend/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  // 1. Get the token from the header
  // Standard format is: "Authorization: Bearer <token>"
  const authHeader = req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token, authorization denied' });
  }

  // Extract the actual token string
  const token = authHeader.split(' ')[1];
console.log("Secret is:", process.env.JWT_SECRET);
  try {
    // 2. Verify the token using your secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Attach the decoded payload (user ID and role) to the request object
    req.user = decoded;
    
    // 4. Move on to the next function/route
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token is not valid' });
  }
};