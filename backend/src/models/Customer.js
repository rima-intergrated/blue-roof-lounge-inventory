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

// mobile is declared `unique: true` on the field so a single-field index
// declaration here would duplicate it; removed to silence Mongoose warnings.

module.exports = mongoose.model('Customer', customerSchema);
