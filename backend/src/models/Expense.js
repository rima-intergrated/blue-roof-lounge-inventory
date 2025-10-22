const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  transactionId: {
    type: String,
     unique: true,
    required: true
  },
  category: {
    type: String,
    required: [true, 'Expense category is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Expense description is required'],
    trim: true
  },
  amount: {
    type: Number,
    required: [true, 'Expense amount is required'],
    min: [0, 'Amount cannot be negative']
  },
  expenseDate: {
    type: Date,
    required: [true, 'Expense date is required'],
    default: Date.now
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Card', 'Bank Transfer', 'Mobile Money', 'Cheque'],
    default: 'Cash'
  },
  vendor: {
    type: String,
    trim: true
  },
  receiptNumber: {
    type: String,
    trim: true
  },
  proofOfExpense: {
    type: String, // File path or URL for receipt/invoice
    default: null
  },
  isApproved: {
    type: Boolean,
    default: true // Auto-approve for now, can be changed for approval workflow
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  department: {
    type: String,
    enum: ['Kitchen', 'Bar', 'Administration', 'Maintenance', 'Marketing', 'General'],
    default: 'General'
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringFrequency: {
    type: String,
    enum: ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Yearly'],
    required: function() {
      return this.isRecurring;
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for better query performance
expenseSchema.index({ expenseDate: -1 });
expenseSchema.index({ category: 1 });
expenseSchema.index({ recordedBy: 1 });
// transactionId is declared `unique: true` on the field; single-field index
// removed to avoid duplicate-index warnings.

// Pre-validate middleware to generate transaction ID so it's available during validation
expenseSchema.pre('validate', function(next) {
  if (!this.transactionId) {
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
    const timeStr = date.getTime().toString().slice(-6);
    this.transactionId = `EXP-${dateStr}-${timeStr}`;
  }
  next();
});

// Virtual for formatted amount (app-wide currency format: prefix 'K')
expenseSchema.virtual('formattedAmount').get(function() {
  const num = Number(this.amount || 0);
  return `K${num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
});

// Virtual for days since expense
expenseSchema.virtual('daysAgo').get(function() {
  const today = new Date();
  const expenseDate = new Date(this.expenseDate);
  const diffTime = Math.abs(today - expenseDate);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Static method to get expenses by date range
expenseSchema.statics.getByDateRange = function(startDate, endDate) {
  return this.find({
    expenseDate: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  }).populate('recordedBy', 'username email').sort({ expenseDate: -1 });
};

// Static method to get expenses by category
expenseSchema.statics.getByCategory = function(category) {
  return this.find({ category: category })
    .populate('recordedBy', 'username email')
    .sort({ expenseDate: -1 });
};

// Static method to get monthly summary
expenseSchema.statics.getMonthlySummary = function(year, month) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);
  
  return this.aggregate([
    {
      $match: {
        expenseDate: { $gte: startDate, $lte: endDate },
        isApproved: true
      }
    },
    {
      $group: {
        _id: '$category',
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 },
        avgAmount: { $avg: '$amount' }
      }
    },
    {
      $sort: { totalAmount: -1 }
    }
  ]);
};

module.exports = mongoose.model('Expense', expenseSchema);