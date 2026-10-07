const { z } = require('zod');
const User = require('../models/user.model');
const Tenant = require('../models/tenant.model');
const { AppError } = require('../middleware/errorHandler');
const { signAccessToken, createRefreshToken, hashToken } = require('../utils/tokenUtils');

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Valid email is required'),
  password: z.string().min(1, 'Password is required'),
});

const registerSchema = z.object({
  restaurantName: z.string().trim().min(2, 'Restaurant name is required').max(120),
  name: z.string().trim().min(2, 'Name is required').max(80),
  email: z.string().trim().toLowerCase().email('Valid email is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(10, 'Refresh token is required'),
});

const publicUser = (user) => ({
  id: user._id,
  tenantId: user.tenantId,
  name: user.name,
  email: user.email,
  role: user.role,
  isActive: user.isActive,
  tenant: user.tenant ? { id: user.tenant._id, name: user.tenant.name, status: user.tenant.status } : undefined,
});

const issueTokens = async (user) => {
  const refresh = createRefreshToken();
  await User.findByIdAndUpdate(user._id, {
    refreshTokenHash: refresh.hash,
    refreshTokenExpiresAt: refresh.expiresAt,
  });
  return { accessToken: signAccessToken(user), refreshToken: refresh.token };
};

// POST /api/v1/auth/login
const login = async (req, res, next) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return next(new AppError(parsed.error.issues[0].message, 400));
  }
  const { email, password } = parsed.data;

  const user = await User.findOne({ email })
    .select('+password')
    .populate('tenantId', 'name status');

  if (!user || !(await user.comparePassword(password))) {
    return next(new AppError('Invalid email or password', 401));
  }
  if (!user.isActive) {
    return next(new AppError('Account is deactivated. Contact your manager.', 403));
  }
  if (user.tenantId && user.tenantId.status !== 'ACTIVE') {
    return next(new AppError('Restaurant account is suspended', 403));
  }

  const tokens = await issueTokens(user);
  user.tenant = user.tenantId;
  res.json({ success: true, data: { user: publicUser(user), ...tokens } });
};

// POST /api/v1/auth/register - first user/tenant setup (creates restaurant + OWNER)
const register = async (req, res, next) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return next(new AppError(parsed.error.issues[0].message, 400));
  }
  const { restaurantName, name, email, password } = parsed.data;

  const existing = await User.findOne({ email });
  if (existing) {
    return next(new AppError('An account with this email already exists', 409));
  }

  const tenant = await Tenant.create({ name: restaurantName });
  const user = await User.create({ tenantId: tenant._id, name, email, password, role: 'OWNER' });

  const tokens = await issueTokens(user);
  user.tenant = tenant;
  res.status(201).json({ success: true, data: { user: publicUser(user), ...tokens } });
};

// POST /api/v1/auth/refresh - rotate refresh token, issue new access token
const refresh = async (req, res, next) => {
  const parsed = refreshSchema.safeParse(req.body);
  if (!parsed.success) {
    return next(new AppError('Refresh token is required', 400));
  }
  const hash = hashToken(parsed.data.refreshToken);

  const user = await User.findOne({
    refreshTokenHash: hash,
    refreshTokenExpiresAt: { $gt: new Date() },
  }).populate('tenantId', 'name status');

  if (!user || !user.isActive) {
    return next(new AppError('Invalid or expired refresh token', 401));
  }

  const tokens = await issueTokens(user);
  user.tenant = user.tenantId;
  res.json({ success: true, data: { user: publicUser(user), ...tokens } });
};

// POST /api/v1/auth/logout - revoke refresh token
const logout = async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.userId, {
    $unset: { refreshTokenHash: '', refreshTokenExpiresAt: '' },
  });
  res.json({ success: true, data: { message: 'Logged out' } });
};

// GET /api/v1/auth/me
const me = async (req, res, next) => {
  const user = await User.findById(req.user.userId).populate('tenantId', 'name status');
  if (!user) {
    return next(new AppError('User not found', 404));
  }
  user.tenant = user.tenantId;
  res.json({ success: true, data: { user: publicUser(user) } });
};

module.exports = { login, register, refresh, logout, me };
