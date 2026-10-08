const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

const DB_STATES = ['disconnected', 'connected', 'connecting', 'disconnecting'];

router.get('/health', (req, res) => {
  const db = DB_STATES[mongoose.connection.readyState] || 'unknown';
  res.json({
    success: true,
    data: {
      status: db === 'connected' ? 'ok' : 'degraded',
      db,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    },
  });
});

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