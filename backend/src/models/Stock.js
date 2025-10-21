const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema({
  itemName: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true,
    unique: true
  },
  itemId: {
    type: String,
    required: [true, 'Item ID is required'],
    unique: true,
    trim: true
  },
  orderQuantity: {
    type: Number,
    default: 0
  },
  costPrice: {
    type: Number,
    default: 0
  },
  sellingPrice: {
    type: Number,
    default: 0
  },
  currentStock: {
    type: Number,
    default: 0
  },
  stockValue: {
    type: Number,
    default: 0
  },
  projectedProfit: {
    type: Number,
    default: 0
  },
  date: {
    type: Date,
    default: Date.now,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Stock', stockSchema);
