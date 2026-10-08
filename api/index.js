require('dotenv').config();
const app = require('../src/app');
const { connectDB } = require('../src/config/db');

let connected = false;

module.exports = async (req, res) => {
  if (!connected) {
    try {
      await connectDB();
      connected = true;
    } catch (error) {
      console.error('MongoDB connection error:', error.message);
      res.status(503).json({
        success: false,
        error: { code: 503, message: 'Service unavailable: database connection failed' },
      });
      return;
    }
  }
  return app(req, res);
};
