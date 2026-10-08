const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dineflow';

const getCached = () => {
  if (!global.__mongoose) {
    global.__mongoose = { conn: null, promise: null };
  }
  return global.__mongoose;
};

const connectDB = async () => {
  const cached = getCached();
  if (cached.conn) {
    return cached.conn;
  }
  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI)
      .then((conn) => {
        cached.conn = conn;
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        return conn;
      })
      .catch((error) => {
        cached.promise = null;
        throw error;
      });
  }
  return cached.promise;
};

module.exports = { connectDB };
