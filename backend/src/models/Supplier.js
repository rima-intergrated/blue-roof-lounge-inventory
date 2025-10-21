const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
  supplierName: {
    type: String,
    required: [true, 'Supplier name is required'],
    trim: true,
    unique: true
  },
  phoneNumber: {
    type: String,
    required: false,
    trim: true,
    default: ''
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ...existing code...

module.exports = mongoose.model('Supplier', supplierSchema);
