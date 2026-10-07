const mongoose = require('mongoose');

const tenantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Restaurant name is required'],
      trim: true,
      maxlength: 120,
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
