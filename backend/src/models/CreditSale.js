const mongoose = require('mongoose');

const creditSaleSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  itemName: {
    type: String,
    required: true,
    trim: true
  },
  itemId: {
    type: String,
    required: true,
    trim: true
  },
  quantitySold: {
    type: Number,
    required: true,
    min: 1
  },
  sellingPrice: {
    type: Number,
    required: true,
    min: 0
  },
  costPrice: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  dateSold: {
    type: Date,
    required: true,
    default: Date.now
  },
  customerName: {
    type: String,
    required: true,
    trim: true
  },
  customerContact: {
    type: String,
    required: true,
    trim: true
  },
  isPaid: {
    type: Boolean,
    default: false
  },
  datePaid: {
    type: Date,
    default: null
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Mobile Transfer', 'Bank Transfer'],
    default: null
  },
  soldBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  proofOfPayment: {
    type: String,
    default: null
  },
  attachment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Attachment',
    default: null
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for formatted date
creditSaleSchema.virtual('formattedDateSold').get(function() {
  return this.dateSold ? this.dateSold.toLocaleDateString() : '';
});

// Virtual for formatted payment date
creditSaleSchema.virtual('formattedDatePaid').get(function() {
  return this.datePaid ? this.datePaid.toLocaleDateString() : '';
});

// Index for better query performance
creditSaleSchema.index({ transactionId: 1 });
creditSaleSchema.index({ itemId: 1 });
creditSaleSchema.index({ customerName: 1 });
creditSaleSchema.index({ dateSold: -1 });
creditSaleSchema.index({ isPaid: 1 });
creditSaleSchema.index({ soldBy: 1 });

// Static method to get unpaid credit sales
creditSaleSchema.statics.getUnpaidSales = function() {
  return this.find({ isPaid: false }).sort({ dateSold: -1 });
};

// Static method to get paid credit sales
creditSaleSchema.statics.getPaidSales = function() {
  return this.find({ isPaid: true }).sort({ datePaid: -1 });
};

// Instance method to mark as paid
creditSaleSchema.methods.markAsPaid = function(paymentMethod, datePaid = new Date()) {
  this.isPaid = true;
  this.datePaid = datePaid;
  this.paymentMethod = paymentMethod;
  return this.save();
};

const CreditSale = mongoose.model('CreditSale', creditSaleSchema);

module.exports = CreditSale;