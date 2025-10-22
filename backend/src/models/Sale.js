const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
  transactionId: {
    type: String,
     unique: true, // Removed index: true to resolve duplicate index warnings
    required: true
  },
  itemName: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true
  },
  itemId: {
    type: String,
    required: [true, 'Item ID is required']
  },
  sellingPrice: {
    type: Number,
    required: [true, 'Selling price is required'],
    min: [0, 'Selling price cannot be negative']
  },
  costPrice: {
    type: Number,
    required: false,
    min: [0, 'Cost price cannot be negative'],
    default: 0
  },
  quantitySold: {
    type: Number,
    required: [true, 'Quantity sold is required'],
    min: [1, 'Quantity must be at least 1']
  },
  totalAmount: {
    type: Number,
    required: true
  },
  paymentMode: {
    type: String,
    required: [true, 'Payment mode is required'],
    enum: ['Cash', 'Credit', 'Mobile Transfer']
  },
  customer: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true
  },
  customerMobile: {
    type: String,
    required: function() {
      return this.paymentMode === 'Credit';
    },
    trim: true
  },
  dateSold: {
    type: Date,
    required: [true, 'Sale date is required'],
    default: Date.now
  },
  isPaid: {
    type: Boolean,
    default: function() {
      return this.paymentMode === 'Cash' || this.paymentMode === 'Mobile Transfer';
    }
  },
  paymentDate: {
    type: Date,
    default: function() {
      return (this.paymentMode === 'Cash' || this.paymentMode === 'Mobile Transfer') ? this.dateSold : null;
    }
  },
  proofOfPayment: {
    type: String, // File path or URL
    default: null
  },
  cashier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Made optional for unauthenticated/test sales
  },
  stockId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Stock',
    required: false
  },
  // ...existing code...
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Pre-save middleware to calculate total and generate transaction ID
saleSchema.pre('save', function(next) {
  // Calculate total amount
  this.totalAmount = this.sellingPrice * this.quantitySold;
  // Generate transaction ID if not provided
  if (!this.transactionId) {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.transactionId = `TXN${timestamp}${random}`;
  }
  next();
});

// Virtual for payment status
saleSchema.virtual('paymentStatus').get(function() {
  if (this.paymentMode === 'Cash' || this.paymentMode === 'Mobile Transfer') return 'Paid';
  if (this.isPaid) return 'Paid';
  
  // Check if overdue (more than 30 days)
  const daysSinceSale = Math.floor((new Date() - this.dateSold) / (1000 * 60 * 60 * 24));
  if (daysSinceSale > 30) return 'Overdue';
  return 'Pending';
});

// Virtual for days since sale
saleSchema.virtual('daysSinceSale').get(function() {
  return Math.floor((new Date() - this.dateSold) / (1000 * 60 * 60 * 24));
});

// Indexes for better performance
saleSchema.index({ dateSold: -1 });
saleSchema.index({ paymentMode: 1 });
saleSchema.index({ isPaid: 1 });
saleSchema.index({ cashier: 1 });
// transactionId is declared `unique: true` on the field; the single-field index
// below was removed to avoid duplicate-index warnings. Keep composite/other
// indexes defined via schema.index(...) where needed.

module.exports = mongoose.model('Sale', saleSchema);
