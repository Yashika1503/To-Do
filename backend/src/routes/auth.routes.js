const express = require('express');
const router = express.Router();
const passport = require('../config/passport');
const jwt = require('jsonwebtoken');
const { register, login } = require('../controllers/auth.controller');

// Existing JWT routes
router.post('/register', register);
router.post('/login', login);

// ── Google OAuth ──────────────────────────────────────────────────────────────

// Step 1: Redirect user to Google
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Step 2: Google redirects back here
router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/auth/login-failed' }),
  (req, res) => {
    const token = jwt.sign(
      { userId: req.user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    const { password, ...safeUser } = req.user;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/oauth-callback?token=${token}&user=${encodeURIComponent(JSON.stringify(safeUser))}`);
  }
);

router.get('/login-failed', (req, res) => {
  res.status(401).json({ error: 'Google OAuth failed' });
});

module.exports = router;