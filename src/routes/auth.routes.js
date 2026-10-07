const express = require('express');
const router = express.Router();
const { login, register, refresh, logout, me } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');

router.post('/login', login);
router.post('/register', register);
router.post('/refresh', refresh);
router.post('/logout', protect, logout);
router.get('/me', protect, me);

module.exports = router;
