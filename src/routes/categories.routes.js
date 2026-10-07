const express = require('express');
const router = express.Router();

router.get('/', (req, res) => res.json({ message: 'route stub' }));
router.post('/', (req, res) => res.json({ message: 'route stub' }));

module.exports = router;