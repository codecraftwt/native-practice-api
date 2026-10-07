const express = require('express');
const router = express.Router();

// Stub routes - will be implemented in later phases
router.use('/auth', require('./auth.routes'));
router.use('/tenants', require('./tenants.routes'));
router.use('/users', require('./users.routes'));
router.use('/floors', require('./floors.routes'));
router.use('/sections', require('./sections.routes'));
router.use('/tables', require('./tables.routes'));
router.use('/categories', require('./categories.routes'));
router.use('/menu', require('./menu.routes'));
router.use('/orders', require('./orders.routes'));
router.use('/kitchen', require('./kitchen.routes'));
router.use('/billing', require('./billing.routes'));
router.use('/payments', require('./payments.routes'));
router.use('/reports', require('./reports.routes'));

module.exports = router;