const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ error: 'Invalid token.' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token.' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin only.' });
  }
  next();
};

const designerOrAdmin = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'designer') {
    return res.status(403).json({ error: 'Access denied.' });
  }
  next();
};

const adminOrAtelier = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'atelier') {
    return res.status(403).json({ error: 'Access denied. Admin or Atelier only.' });
  }
  next();
};

module.exports = { authMiddleware, adminOnly, designerOrAdmin, adminOrAtelier };