const { z } = require('zod');
const Tenant = require('../models/tenant.model');
const { AppError } = require('../middleware/errorHandler');

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

const updateSchema = z
  .object({
    name: z.string().trim().min(2).max(120).optional(),
    logoUrl: z.string().trim().max(500).optional(),
    email: z.string().trim().toLowerCase().max(120).optional(),
    phone: z.string().trim().max(30).optional(),
    address: z.string().trim().max(300).optional(),
    gstNumber: z.string().trim().max(20).optional(),
    timezone: z.string().trim().max(60).optional(),
    hours: z
      .object({
        open: z.string().regex(timeRegex, 'Opening time must be HH:MM'),
        close: z.string().regex(timeRegex, 'Closing time must be HH:MM'),
      })
      .optional(),
    settings: z
      .object({
        currency: z.string().trim().min(3).max(6).optional(),
        taxRate: z.number().min(0).max(100).optional(),
        serviceChargeRate: z.number().min(0).max(100).optional(),
      })
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'No fields to update' });

const publicTenant = (tenant) => ({
  id: tenant._id,
  name: tenant.name,
  logoUrl: tenant.logoUrl,
  email: tenant.email,
  phone: tenant.phone,
  address: tenant.address,
  gstNumber: tenant.gstNumber,
  timezone: tenant.timezone,
  hours: tenant.hours,
  status: tenant.status,
  settings: tenant.settings,
  createdAt: tenant.createdAt,
});

// GET /api/v1/tenants/me - own restaurant profile (session-scoped)
const me = async (req, res, next) => {
  const tenant = await Tenant.findById(req.tenantId);
  if (!tenant) {
    return next(new AppError('Restaurant not found', 404));
  }
  res.json({ success: true, data: { tenant: publicTenant(tenant) } });
};

// PATCH /api/v1/tenants/me - update own restaurant profile (OWNER)
const updateMe = async (req, res, next) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    return next(new AppError(parsed.error.issues[0].message, 400));
  }

  const tenant = await Tenant.findById(req.tenantId);
  if (!tenant) {
    return next(new AppError('Restaurant not found', 404));
  }

  const { hours, settings, ...rest } = parsed.data;
  Object.assign(tenant, rest);
  if (hours) tenant.hours = { ...tenant.hours, ...hours };
  if (settings) tenant.settings = { ...tenant.settings, ...settings };

  await tenant.save();
  res.json({ success: true, data: { tenant: publicTenant(tenant) } });
};

module.exports = { me, updateMe };
