const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name: { type: String, trim: true, default: '' },
  mobile: { type: String, required: true, unique: true, trim: true },
  email: { type: String, trim: true, default: '' },
  address: { type: String, trim: true, default: '' }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

customerSchema.index({ mobile: 1 });

module.exports = mongoose.model('Customer', customerSchema);
