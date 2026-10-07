const jwt = require('jsonwebtoken');
const { AppError } = require('./errorHandler');

const protect = (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return next(new AppError('Not authorized, no token', 401));
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = decoded;
    req.tenantId = decoded.tenantId;
    next();
  } catch (error) {
    return next(new AppError('Not authorized, token failed', 401));
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || (roles.length && !roles.includes(req.user.role))) {
      return next(new AppError('Not authorized to access this route', 403));
    }
    next();
  };
};

module.exports = { protect, authorize };