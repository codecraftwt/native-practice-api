const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/', authorize('menu:read'), (req, res) => res.json({ message: 'route stub' }));
router.post('/', authorize('menu:crud'), (req, res) => res.json({ message: 'route stub' }));

module.exports = router;
