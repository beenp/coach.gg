const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  const authHeader = req.header('Authorization');
  if (!authHeader) return res.status(401).json({ msg: 'No token, denied' });

  const token = authHeader.split(' ')[1] || authHeader;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user || decoded; 
    next();
  } catch (err) {
    return res.status(401).json({ msg: 'Token invalid' });
  }
};

const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ error: 'Admins only' });
  }
};

// CRITICAL: This must be at the VERY bottom. 
// Ensure there are NO other module.exports lines above this.
module.exports = { auth, admin };