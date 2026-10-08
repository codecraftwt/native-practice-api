const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/', authorize('tables:view'), (req, res) => res.json({ message: 'route stub' }));
router.post('/', authorize('tables:manage'), (req, res) => res.json({ message: 'route stub' }));

module.exports = router;
