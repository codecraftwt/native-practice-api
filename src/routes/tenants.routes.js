const express = require('express');
const router = express.Router();
const { me, updateMe } = require('../controllers/tenants.controller');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/me', me);
router.patch('/me', authorize('settings:update'), updateMe);

module.exports = router;
