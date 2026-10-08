const { z } = require('zod');
const mongoose = require('mongoose');
const User = require('../models/user.model');
const { AppError } = require('../middleware/errorHandler');
const { hasPermission } = require('../config/permissions');

const STAFF_ROLES = ['MANAGER', 'WAITER', 'CASHIER', 'KITCHEN'];

const createSchema = z.object({
  name: z.string().trim().min(2, 'Name is required').max(80),
  email: z.string().trim().toLowerCase().email('Valid email is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(STAFF_ROLES, { message: 'Invalid staff role' }),
});

const updateSchema = z
  .object({
    name: z.string().trim().min(2).max(80).optional(),
    role: z.string().trim().optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'No fields to update' });

const publicUser = (user) => ({
  id: user._id,
  tenantId: user.tenantId,
  name: user.name,
  email: user.email,
  role: user.role,
  isActive: user.isActive,
  createdAt: user.createdAt,
});

const isValidId = (id) => mongoose.isValidObjectId(id);

// GET /api/v1/users - list staff of the authenticated tenant only
const list = async (req, res) => {
  const users = await User.find({ tenantId: req.tenantId }).sort({ name: 1 });
  res.json({ success: true, data: { users: users.map(publicUser) } });
};

// GET /api/v1/users/:id - scoped read; cross-tenant returns 404
const getOne = async (req, res, next) => {
  if (!isValidId(req.params.id)) {
    return next(new AppError('User not found', 404));
  }
  const user = await User.findOne({ _id: req.params.id, tenantId: req.tenantId });
  if (!user) {
    return next(new AppError('User not found', 404));
  }
  res.json({ success: true, data: { user: publicUser(user) } });
};

// POST /api/v1/users - create staff inside own tenant
const create = async (req, res, next) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return next(new AppError(parsed.error.issues[0].message, 400));
  }
  const { name, email, password, role } = parsed.data;

  if (role === 'OWNER' && !hasPermission(req.user.role, 'staff:role')) {
    return next(new AppError('Not allowed to assign this role', 403));
  }

  const existing = await User.findOne({ email });
  if (existing) {
    return next(new AppError('An account with this email already exists', 409));
  }

  try {
    const user = await User.create({ tenantId: req.tenantId, name, email, password, role });
    res.status(201).json({ success: true, data: { user: publicUser(user) } });
  } catch (err) {
    if (err.code === 11000) {
      return next(new AppError('An account with this email already exists', 409));
    }
    throw err;
  }
};

// PATCH /api/v1/users/:id - scoped update inside own tenant
const update = async (req, res, next) => {
  if (!isValidId(req.params.id)) {
    return next(new AppError('User not found', 404));
  }
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    return next(new AppError(parsed.error.issues[0].message, 400));
  }
  const { name, role, isActive } = parsed.data;

  const user = await User.findOne({ _id: req.params.id, tenantId: req.tenantId });
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  const isSelf = String(user._id) === req.user.userId;

  if (isSelf && (role !== undefined || isActive === false)) {
    return next(new AppError('You cannot change your own role or deactivate yourself', 400));
  }
  if (role !== undefined) {
    if (!hasPermission(req.user.role, 'staff:role')) {
      return next(new AppError('Only the owner can change roles', 403));
    }
    if (!User.schema.path('role').enumValues.includes(role)) {
      return next(new AppError('Invalid role', 400));
    }
    user.role = role;
  }
  if (name !== undefined) user.name = name;
  if (isActive !== undefined) user.isActive = isActive;

  await user.save();
  res.json({ success: true, data: { user: publicUser(user) } });
};

// DELETE /api/v1/users/:id - soft-deactivate inside own tenant
const remove = async (req, res, next) => {
  if (!isValidId(req.params.id)) {
    return next(new AppError('User not found', 404));
  }
  const user = await User.findOne({ _id: req.params.id, tenantId: req.tenantId });
  if (!user) {
    return next(new AppError('User not found', 404));
  }
  if (String(user._id) === req.user.userId) {
    return next(new AppError('You cannot deactivate yourself', 400));
  }

  user.isActive = false;
  user.refreshTokenHash = undefined;
  user.refreshTokenExpiresAt = undefined;
  await user.save();

  res.json({ success: true, data: { user: publicUser(user) } });
};

module.exports = { list, getOne, create, update, remove };
