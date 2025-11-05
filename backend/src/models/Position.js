const mongoose = require('mongoose');

const positionSchema = new mongoose.Schema({
  positionTitle: { type: String, required: true, trim: true, unique: true },
  positionCode: { type: String, required: true, trim: true, unique: true, uppercase: true },
  department: { type: String, default: 'General' },
  level: { type: String, default: 'Staff' },
  description: { type: String, default: '' },
  responsibilities: [{ type: String }],
  requirements: {
    education: [{ type: String }],
    experience: {
      minimum: { type: Number, default: 0 },
      preferred: { type: Number, default: 1 }
    },
    skills: [{ type: String }],
    certifications: [{ type: String }]
  },
  salary: {
    minimum: { type: Number, default: 30000 },
    maximum: { type: Number, default: 50000 },
    currency: { type: String, default: 'KES' },
    payFrequency: { type: String, default: 'Monthly' }
  },
  benefits: [{ type: String }],
  permissions: {
    sales: { 
      view: { type: Boolean, default: false },
      create: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
      add: { type: Boolean, default: false }
    },
    inventory: {
      view: { type: Boolean, default: false },
      create: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
      add: { type: Boolean, default: false }
    },
    hrm: {
      view: { type: Boolean, default: false },
      create: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
      add: { type: Boolean, default: false }
    },
    payroll: {
      view: { type: Boolean, default: false },
      create: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
      process: { type: Boolean, default: false },
      approve: { type: Boolean, default: false }
    },
    reports: {
      view: { type: Boolean, default: false },
      create: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
      generate: { type: Boolean, default: false },
      export: { type: Boolean, default: false }
    },
    settings: {
      view: { type: Boolean, default: false },
      create: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
      systemConfig: { type: Boolean, default: false }
    }
  },
  workSchedule: {
    type: { type: String, default: 'Full-time' },
    hoursPerWeek: { type: Number, default: 40 },
    shifts: [{ type: String }]
  },
  reportingStructure: {
    manages: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Position' }]
  },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  maxPositions: { type: Number, default: 1 },
  currentPositions: { type: Number, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

module.exports = mongoose.model('Position', positionSchema);
