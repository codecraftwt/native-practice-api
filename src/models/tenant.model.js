const mongoose = require('mongoose');

const tenantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Restaurant name is required'],
      trim: true,
      maxlength: 120,
    },
    logoUrl: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 120,
      default: '',
    },
    phone: {
      type: String,
      trim: true,
      maxlength: 30,
      default: '',
    },
    address: {
      type: String,
      trim: true,
      maxlength: 300,
      default: '',
    },
    gstNumber: {
      type: String,
      trim: true,
      maxlength: 20,
      default: '',
    },
    timezone: {
      type: String,
      default: 'Asia/Kolkata',
      maxlength: 60,
    },
    hours: {
      open: { type: String, default: '09:00', maxlength: 5 },
      close: { type: String, default: '23:00', maxlength: 5 },
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'SUSPENDED'],
      default: 'ACTIVE',
    },
    settings: {
      currency: { type: String, default: 'INR' },
      taxRate: { type: Number, default: 0 },
      serviceChargeRate: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Tenant || mongoose.model('Tenant', tenantSchema);
