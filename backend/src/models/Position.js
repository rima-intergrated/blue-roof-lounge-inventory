const mongoose = require('mongoose');

const positionSchema = new mongoose.Schema({
  positionTitle: { type: String, required: true, trim: true, unique: true },
  positionCode: { type: String, required: true, trim: true, unique: true, uppercase: true },
  permissions: {
    sales: { type: Object, default: {} },
  stock: { type: Object, default: {} },
    hrm: { type: Object, default: {} },
    payroll: { type: Object, default: {} },
    reports: { type: Object, default: {} },
    settings: { type: Object, default: {} }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

module.exports = mongoose.model('Position', positionSchema);
