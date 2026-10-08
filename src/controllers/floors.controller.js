const { z } = require('zod');
const mongoose = require('mongoose');
const Floor = require('../models/floor.model');
const Section = require('../models/section.model');
const Table = require('../models/table.model');
const { AppError } = require('../middleware/errorHandler');

const createSchema = z.object({
  name: z.string().trim().min(2, 'Floor name is required').max(60),
  description: z.string().trim().max(200).optional(),
  displayOrder: z.number().int().min(0).max(999).optional(),
});

const updateSchema = createSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, { message: 'No fields to update' });

const publicFloor = (floor) => ({
  id: floor._id,
  name: floor.name,
  description: floor.description,
  displayOrder: floor.displayOrder,
  isActive: floor.isActive,
  createdAt: floor.createdAt,
});

const isValidId = (id) => mongoose.isValidObjectId(id);

// GET /api/v1/floors - list floors of the authenticated tenant
const list = async (req, res) => {
  const floors = await Floor.find({ tenantId: req.tenantId }).sort({ displayOrder: 1, name: 1 });
  res.json({ success: true, data: { floors: floors.map(publicFloor) } });
};

// GET /api/v1/floors/:id - scoped read; cross-tenant returns 404
const getOne = async (req, res, next) => {
  if (!isValidId(req.params.id)) {
    return next(new AppError('Floor not found', 404));
  }
  const floor = await Floor.findOne({ _id: req.params.id, tenantId: req.tenantId });
  if (!floor) {
    return next(new AppError('Floor not found', 404));
  }
  res.json({ success: true, data: { floor: publicFloor(floor) } });
};

// POST /api/v1/floors - create floor inside own tenant
const create = async (req, res, next) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return next(new AppError(parsed.error.issues[0].message, 400));
  }
  const floor = await Floor.create({ tenantId: req.tenantId, ...parsed.data });
  res.status(201).json({ success: true, data: { floor: publicFloor(floor) } });
};

// PATCH /api/v1/floors/:id - scoped update inside own tenant
const update = async (req, res, next) => {
  if (!isValidId(req.params.id)) {
    return next(new AppError('Floor not found', 404));
  }
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    return next(new AppError(parsed.error.issues[0].message, 400));
  }
  const floor = await Floor.findOne({ _id: req.params.id, tenantId: req.tenantId });
  if (!floor) {
    return next(new AppError('Floor not found', 404));
  }
  Object.assign(floor, parsed.data);
  await floor.save();
  res.json({ success: true, data: { floor: publicFloor(floor) } });
};

// DELETE /api/v1/floors/:id - blocked while sections/tables still reference it
const remove = async (req, res, next) => {
  if (!isValidId(req.params.id)) {
    return next(new AppError('Floor not found', 404));
  }
  const floor = await Floor.findOne({ _id: req.params.id, tenantId: req.tenantId });
  if (!floor) {
    return next(new AppError('Floor not found', 404));
  }
  const sections = await Section.countDocuments({ tenantId: req.tenantId, floorId: floor._id });
  const tables = await Table.countDocuments({ tenantId: req.tenantId, floorId: floor._id });
  if (sections > 0 || tables > 0) {
    return next(new AppError('Cannot delete a floor that still has sections or tables', 409));
  }
  await floor.deleteOne();
  res.json({ success: true, data: { id: floor._id } });
};

module.exports = { list, getOne, create, update, remove };
