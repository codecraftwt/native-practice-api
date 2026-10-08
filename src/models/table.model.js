const mongoose = require('mongoose');

const TABLE_STATUSES = [
  'AVAILABLE',
  'OCCUPIED',
  'RESERVED',
  'BILLING',
  'OUT_OF_SERVICE',
];

const tableSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    floorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Floor',
      required: [true, 'Floor is required'],
    },
    sectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Section',
      default: null,
    },
    tableNumber: {
      type: String,
      required: [true, 'Table number is required'],
      trim: true,
      maxlength: 20,
    },
    capacity: {
      type: Number,
      required: [true, 'Capacity is required'],
      min: [1, 'Capacity must be at least 1'],
      max: 50,
    },
    status: {
      type: String,
      enum: TABLE_STATUSES,
      default: 'AVAILABLE',
    },
    currentOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      default: null,
    },
    qrCode: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

tableSchema.index({ tenantId: 1, status: 1 });
tableSchema.index({ tenantId: 1, floorId: 1 });
tableSchema.index({ tenantId: 1, tableNumber: 1 }, { unique: true });

module.exports = mongoose.model('Table', tableSchema);
