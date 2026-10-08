const { z } = require('zod');
const mongoose = require('mongoose');
const Floor = require('../models/floor.model');
const Section = require('../models/section.model');
const Table = require('../models/table.model');
const { AppError } = require('../middleware/errorHandler');

// docs/specs/state-machines.md - table status flow with allowed roles per transition
const TRANSITIONS = {
  AVAILABLE: {
    OCCUPIED: ['WAITER', 'MANAGER', 'OWNER'],
    RESERVED: ['MANAGER', 'OWNER'],
    OUT_OF_SERVICE: ['MANAGER', 'OWNER'],
  },
  RESERVED: {
    OCCUPIED: ['WAITER', 'MANAGER', 'OWNER'],
    AVAILABLE: ['MANAGER', 'OWNER'],
    OUT_OF_SERVICE: ['MANAGER', 'OWNER'],
  },
  OCCUPIED: {
    BILLING: ['WAITER', 'CASHIER', 'MANAGER', 'OWNER'],
    OUT_OF_SERVICE: ['MANAGER', 'OWNER'],
  },
  BILLING: {
    AVAILABLE: ['CASHIER', 'MANAGER', 'OWNER'],
    OCCUPIED: ['CASHIER', 'MANAGER', 'OWNER'],
  },
  OUT_OF_SERVICE: {
    AVAILABLE: ['MANAGER', 'OWNER'],
  },
};

const objectId = (label) =>
  z.string().trim().refine((v) => mongoose.isValidObjectId(v), `Invalid ${label}`);

const createSchema = z.object({
  floorId: objectId('floor'),
  sectionId: objectId('section').optional().nullable(),
  tableNumber: z.string().trim().min(1, 'Table number is required').max(20),
  capacity: z.number().int().min(1, 'Capacity must be at least 1').max(50),
});

const updateSchema = createSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, { message: 'No fields to update' });

const statusSchema = z.object({
  status: z.enum(Object.keys(TRANSITIONS), { message: 'Invalid table status' }),
});

const publicTable = (table) => ({
  id: table._id,
  floorId: table.floorId,
  sectionId: table.sectionId,
  tableNumber: table.tableNumber,
  capacity: table.capacity,
  status: table.status,
  currentOrderId: table.currentOrderId,
  isActive: table.isActive,
  createdAt: table.createdAt,
});

const isValidId = (id) => mongoose.isValidObjectId(id);

const assertFloorAndSection = async (req, data, next) => {
  if (data.floorId) {
    const floor = await Floor.findOne({ _id: data.floorId, tenantId: req.tenantId });
    if (!floor) {
      next(new AppError('Floor not found', 404));
      return false;
    }
  }
  if (data.sectionId) {
    const section = await Section.findOne({ _id: data.sectionId, tenantId: req.tenantId });
    if (!section) {
      next(new AppError('Section not found', 404));
      return false;
    }
    if (data.floorId && String(section.floorId) !== String(data.floorId)) {
      next(new AppError('Section does not belong to this floor', 400));
      return false;
    }
  }
  return true;
};

const mapDuplicate = (err, next) => {
  if (err.code === 11000) {
    return next(new AppError('A table with this number already exists', 409));
  }
  throw err;
};

// GET /api/v1/tables - list tables (grid view) of the authenticated tenant
const list = async (req, res, next) => {
  const query = { tenantId: req.tenantId };
  if (req.query.floorId) {
    if (!isValidId(req.query.floorId)) {
      return next(new AppError('Invalid floor id', 400));
    }
    query.floorId = req.query.floorId;
  }
  const tables = await Table.find(query);
  tables.sort((a, b) => a.tableNumber.localeCompare(b.tableNumber, undefined, { numeric: true }));
  res.json({ success: true, data: { tables: tables.map(publicTable) } });
};

// GET /api/v1/tables/:id - scoped read; cross-tenant returns 404
const getOne = async (req, res, next) => {
  if (!isValidId(req.params.id)) {
    return next(new AppError('Table not found', 404));
  }
  const table = await Table.findOne({ _id: req.params.id, tenantId: req.tenantId });
  if (!table) {
    return next(new AppError('Table not found', 404));
  }
  res.json({ success: true, data: { table: publicTable(table) } });
};

// POST /api/v1/tables - create table inside own tenant
const create = async (req, res, next) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return next(new AppError(parsed.error.issues[0].message, 400));
  }
  if (!(await assertFloorAndSection(req, parsed.data, next))) {
    return;
  }
  try {
    const table = await Table.create({ tenantId: req.tenantId, ...parsed.data });
    res.status(201).json({ success: true, data: { table: publicTable(table) } });
  } catch (err) {
    mapDuplicate(err, next);
  }
};

// PATCH /api/v1/tables/:id - scoped update inside own tenant
const update = async (req, res, next) => {
  if (!isValidId(req.params.id)) {
    return next(new AppError('Table not found', 404));
  }
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    return next(new AppError(parsed.error.issues[0].message, 400));
  }
  const table = await Table.findOne({ _id: req.params.id, tenantId: req.tenantId });
  if (!table) {
    return next(new AppError('Table not found', 404));
  }
  const nextFloor = parsed.data.floorId !== undefined ? parsed.data.floorId : String(table.floorId);
  const nextSection =
    parsed.data.sectionId !== undefined ? parsed.data.sectionId : table.sectionId
      ? String(table.sectionId)
      : null;
  const merged = { floorId: nextFloor, sectionId: nextSection };
  if (!(await assertFloorAndSection(req, merged, next))) {
    return;
  }
  Object.assign(table, parsed.data);
  try {
    await table.save();
  } catch (err) {
    return mapDuplicate(err, next);
  }
  res.json({ success: true, data: { table: publicTable(table) } });
};

// DELETE /api/v1/tables/:id - only free tables can be removed
const remove = async (req, res, next) => {
  if (!isValidId(req.params.id)) {
    return next(new AppError('Table not found', 404));
  }
  const table = await Table.findOne({ _id: req.params.id, tenantId: req.tenantId });
  if (!table) {
    return next(new AppError('Table not found', 404));
  }
  if (table.currentOrderId || table.status === 'OCCUPIED' || table.status === 'BILLING') {
    return next(new AppError('Table is in use and cannot be deleted', 409));
  }
  await table.deleteOne();
  res.json({ success: true, data: { id: table._id } });
};

// PATCH /api/v1/tables/:id/status - validated status transition for the caller's role
const updateStatus = async (req, res, next) => {
  if (!isValidId(req.params.id)) {
    return next(new AppError('Table not found', 404));
  }
  const parsed = statusSchema.safeParse(req.body);
  if (!parsed.success) {
    return next(new AppError(parsed.error.issues[0].message, 400));
  }
  const table = await Table.findOne({ _id: req.params.id, tenantId: req.tenantId });
  if (!table) {
    return next(new AppError('Table not found', 404));
  }
  const target = parsed.data.status;
  if (table.status === target) {
    return res.json({ success: true, data: { table: publicTable(table) } });
  }
  const allowedRoles = TRANSITIONS[table.status]?.[target];
  if (!allowedRoles) {
    return next(new AppError(`Cannot change table status from ${table.status} to ${target}`, 400));
  }
  if (!allowedRoles.includes(req.user.role)) {
    return next(new AppError('Your role cannot perform this status change', 403));
  }
  table.status = target;
  await table.save();
  res.json({ success: true, data: { table: publicTable(table) } });
};

module.exports = { list, getOne, create, update, remove, updateStatus };
