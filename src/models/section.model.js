const mongoose = require('mongoose');

const sectionSchema = new mongoose.Schema(
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
    name: {
      type: String,
      required: [true, 'Section name is required'],
      trim: true,
      maxlength: 60,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

sectionSchema.index({ tenantId: 1, floorId: 1 });

module.exports = mongoose.model('Section', sectionSchema);
