const { z } = require('zod');
const mongoose = require('mongoose');
const Floor = require('../models/floor.model');
const Section = require('../models/section.model');
const Table = require('../models/table.model');
const { AppError } = require('../middleware/errorHandler');

const objectId = (label) =>
  z.string().trim().refine((v) => mongoose.isValidObjectId(v), `Invalid ${label}`);

const createSchema = z.object({
  floorId: objectId('floor'),
  name: z.string().trim().min(2, 'Section name is required').max(60),
  displayOrder: z.number().int().min(0).max(999).optional(),
});

const updateSchema = createSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, { message: 'No fields to update' });

const publicSection = (section) => ({
  id: section._id,
  floorId: section.floorId,
  name: section.name,
  displayOrder: section.displayOrder,
  isActive: section.isActive,
  createdAt: section.createdAt,
});

const isValidId = (id) => mongoose.isValidObjectId(id);

// GET /api/v1/sections - list sections (?floorId=) of the authenticated tenant
const list = async (req, res, next) => {
  const query = { tenantId: req.tenantId };
  if (req.query.floorId) {
    if (!isValidId(req.query.floorId)) {
      return next(new AppError('Invalid floor id', 400));
    }
    query.floorId = req.query.floorId;
  }
  const sections = await Section.find(query).sort({ displayOrder: 1, name: 1 });
  res.json({ success: true, data: { sections: sections.map(publicSection) } });
};

// GET /api/v1/sections/:id - scoped read; cross-tenant returns 404
const getOne = async (req, res, next) => {
  if (!isValidId(req.params.id)) {
    return next(new AppError('Section not found', 404));
  }
  const section = await Section.findOne({ _id: req.params.id, tenantId: req.tenantId });
  if (!section) {
    return next(new AppError('Section not found', 404));
  }
  res.json({ success: true, data: { section: publicSection(section) } });
};

// POST /api/v1/sections - create section on own floor
const create = async (req, res, next) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return next(new AppError(parsed.error.issues[0].message, 400));
  }
  const floor = await Floor.findOne({ _id: parsed.data.floorId, tenantId: req.tenantId });
  if (!floor) {
    return next(new AppError('Floor not found', 404));
  }
  const section = await Section.create({ tenantId: req.tenantId, ...parsed.data });
  res.status(201).json({ success: true, data: { section: publicSection(section) } });
};

// PATCH /api/v1/sections/:id - scoped update inside own tenant
const update = async (req, res, next) => {
  if (!isValidId(req.params.id)) {
    return next(new AppError('Section not found', 404));
  }
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    return next(new AppError(parsed.error.issues[0].message, 400));
  }
  const section = await Section.findOne({ _id: req.params.id, tenantId: req.tenantId });
  if (!section) {
    return next(new AppError('Section not found', 404));
  }
  if (parsed.data.floorId) {
    const floor = await Floor.findOne({ _id: parsed.data.floorId, tenantId: req.tenantId });
    if (!floor) {
      return next(new AppError('Floor not found', 404));
    }
  }
  Object.assign(section, parsed.data);
  await section.save();
  res.json({ success: true, data: { section: publicSection(section) } });
};

// DELETE /api/v1/sections/:id - blocked while tables still reference it
const remove = async (req, res, next) => {
  if (!isValidId(req.params.id)) {
    return next(new AppError('Section not found', 404));
  }
  const section = await Section.findOne({ _id: req.params.id, tenantId: req.tenantId });
  if (!section) {
    return next(new AppError('Section not found', 404));
  }
  const tables = await Table.countDocuments({ tenantId: req.tenantId, sectionId: section._id });
  if (tables > 0) {
    return next(new AppError('Cannot delete a section that still has tables', 409));
  }
  await section.deleteOne();
  res.json({ success: true, data: { id: section._id } });
};

module.exports = { list, getOne, create, update, remove };
