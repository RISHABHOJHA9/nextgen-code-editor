// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ msg: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id };  // Only expose what's needed
    next();
  } catch (err) {
    console.error('JWT verification error:', err.message);
    return res.status(401).json({ msg: 'Invalid or expired token' });
  }
};

module.exports = authMiddleware;
