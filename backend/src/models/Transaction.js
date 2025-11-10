const mongoose = require('mongoose');

const transactionItemSchema = new mongoose.Schema({
  itemName: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true
  },
  itemId: {
    type: String,
    required: false,
    trim: true
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1']
  },
  unitPrice: {
    type: Number,
    required: [true, 'Unit price is required'],
    min: [0, 'Unit price cannot be negative']
  },
  totalPrice: {
    type: Number,
    required: [true, 'Total price is required'],
    min: [0, 'Total price cannot be negative']
  },
  supplier: {
    type: String,
    required: false,
    trim: true
  },
  sellingPrice: {
    type: Number,
    required: false,
    min: [0, 'Selling price cannot be negative']
  }
}, {
  _id: false // Don't create separate _id for subdocuments
});

const transactionSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    unique: true,
    required: false, // Changed to false to prevent validation errors
    index: true,
    default: function() {
      const timestamp = Date.now().toString();
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      return `TXN-${timestamp}-${random}`;
    }
  },
  type: {
    type: String,
    enum: ['purchase', 'inventory_add', 'stock_adjustment', 'return'],
    default: 'inventory_add',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled'],
    default: 'completed',
    required: true
  },
  items: [transactionItemSchema],
  totalItems: {
    type: Number,
    required: false, // Changed to false to prevent validation errors
    min: [0, 'Total items cannot be negative'],
    default: 0
  },
  totalValue: {
    type: Number,
    required: false, // Changed to false to prevent validation errors
    min: [0, 'Total value cannot be negative'],
    default: 0
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true
  },
  dateOrdered: {
    type: Date,
    required: false
  },
  notes: {
    type: String,
    trim: true,
    maxLength: [500, 'Notes cannot exceed 500 characters']
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  username: {
    type: String,
    required: false,
    trim: true
  },
  // Reference to related records
  stockIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Stock'
  }],
  attachments: [{
    type: String // File paths or URLs
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Pre-save middleware to generate transaction ID and calculate totals
transactionSchema.pre('save', function(next) {
  console.log('🔍 Transaction pre-save middleware triggered');
  console.log('📊 Current transaction data:', this.toObject());
  
  // Always ensure we have a transaction ID
  if (!this.transactionId || this.transactionId === undefined || this.transactionId === null) {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.transactionId = `TXN-${timestamp}-${random}`;
    console.log('🆔 Generated transaction ID:', this.transactionId);
  }
  
  // Always recalculate totals from items to ensure accuracy
  if (this.items && Array.isArray(this.items) && this.items.length > 0) {
    this.totalItems = this.items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
    this.totalValue = this.items.reduce((sum, item) => sum + (Number(item.totalPrice) || 0), 0);
    console.log('📈 Calculated totals from items - Items:', this.totalItems, 'Value:', this.totalValue);
  } else {
    // Set defaults if no items
    this.totalItems = this.totalItems || 0;
    this.totalValue = this.totalValue || 0;
    console.log('⚠️ No items or using existing totals - Items:', this.totalItems, 'Value:', this.totalValue);
  }
  
  // Ensure these fields are never undefined
  this.totalItems = this.totalItems !== undefined ? this.totalItems : 0;
  this.totalValue = this.totalValue !== undefined ? this.totalValue : 0;
  
  console.log('✅ Final transaction data before save:', {
    transactionId: this.transactionId,
    totalItems: this.totalItems,
    totalValue: this.totalValue,
    itemsCount: this.items ? this.items.length : 0
  });
  
  next();
});

// Indexes for better query performance
transactionSchema.index({ timestamp: -1 });
transactionSchema.index({ type: 1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ userId: 1 });
transactionSchema.index({ 'items.itemName': 'text' });

// Virtual for formatted transaction ID
transactionSchema.virtual('formattedId').get(function() {
  return `#${this.transactionId}`;
});

// Instance method to add item
transactionSchema.methods.addItem = function(itemData) {
  this.items.push(itemData);
  this.totalItems = this.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  this.totalValue = this.items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
};

// Static method to get recent transactions
transactionSchema.statics.getRecent = function(limit = 10) {
  return this.find()
    .sort({ timestamp: -1 })
    .limit(limit)
    .populate('userId', 'username email');
};

// Static method to get transactions by date range
transactionSchema.statics.getByDateRange = function(startDate, endDate) {
  return this.find({
    timestamp: {
      $gte: startDate,
      $lte: endDate
    }
  }).sort({ timestamp: -1 });
};

module.exports = mongoose.model('Transaction', transactionSchema);