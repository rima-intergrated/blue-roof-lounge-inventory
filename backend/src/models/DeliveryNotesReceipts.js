const mongoose = require('mongoose');

/**
 * Delivery Notes and Receipts Schema
 * 
 * This collection stores all delivery notes and receipts uploaded
 * when creating inventory items, providing a centralized document
 * management system for delivery documentation.
 */

const deliveryNotesReceiptsSchema = new mongoose.Schema({
  // Reference to the stock item this document belongs to
  stockItemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Stock',
    required: true,
    // index declared later via deliveryNotesReceiptsSchema.index(...)
  },
  
  // Basic stock item information for quick reference
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
  
  // Transaction/Reference ID for grouping related documents
  transactionId: {
    type: String,
    required: true,
    // index declared later via deliveryNotesReceiptsSchema.index(...)
    trim: true
  },
  
  // File information
  fileName: {
    type: String,
    required: true
  },
  
  originalName: {
    type: String,
    required: true
  },
  
  filePath: {
    type: String,
    required: true
  },
  
  fileSize: {
    type: Number,
    required: true,
    min: 0
  },
  
  mimeType: {
    type: String,
    required: true
  },
  
  // Document description/notes
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters'],
    default: 'Delivery receipt/note'
  },
  
  // User who uploaded the document
  uploadedBy: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    userName: {
      type: String,
      required: true
    },
    userEmail: {
      type: String,
      required: true
    }
  },
  
  // Order/delivery information
  orderDetails: {
    quantity: {
      type: Number,
      required: true,
      min: 0
    },
    costPrice: {
      type: Number,
      required: true,
      min: 0
    },
    sellingPrice: {
      type: Number,
      required: true,
      min: 0
    },
    deliveryDate: {
      type: Date,
      default: Date.now
    },
    deliveryNote: {
      type: String,
      maxlength: [1000, 'Delivery note cannot exceed 1000 characters']
    }
  },
  
  // Document status
  status: {
    type: String,
    enum: ['active', 'archived', 'deleted'],
    default: 'active'
  },
  
  // Metadata
  tags: [{
    type: String,
    trim: true
  }],
  
  // Archive information
  archivedAt: Date,
  archivedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for efficient querying
deliveryNotesReceiptsSchema.index({ transactionId: 1, createdAt: -1 });
deliveryNotesReceiptsSchema.index({ stockItemId: 1, createdAt: -1 });
deliveryNotesReceiptsSchema.index({ itemName: 1 });
deliveryNotesReceiptsSchema.index({ 'uploadedBy.userId': 1, createdAt: -1 });
deliveryNotesReceiptsSchema.index({ status: 1, createdAt: -1 });

// Virtual for file URL
deliveryNotesReceiptsSchema.virtual('fileUrl').get(function() {
  if (this.filePath) {
    // Construct the proper URL for file access
    let urlPath = this.filePath.replace(/\\/g, '/');
    if (urlPath.startsWith('uploads/')) {
      urlPath = urlPath.substring(8);
    }
    return `http://127.0.0.1:5000/uploads/${urlPath}`;
  }
  return null;
});

// Virtual for file size in KB
deliveryNotesReceiptsSchema.virtual('fileSizeKB').get(function() {
  return this.fileSize ? (this.fileSize / 1024).toFixed(1) : '0.0';
});

// Virtual for formatted upload date
deliveryNotesReceiptsSchema.virtual('uploadDate').get(function() {
  return this.createdAt ? this.createdAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }) : 'Unknown Date';
});

// Static method to get documents by transaction ID
deliveryNotesReceiptsSchema.statics.getByTransactionId = function(transactionId) {
  return this.find({ transactionId, status: 'active' })
    .populate('stockItemId', 'itemName itemId currentStock')
    .populate('uploadedBy.userId', 'name email')
    .sort({ createdAt: -1 });
};

// Static method to get documents by stock item
deliveryNotesReceiptsSchema.statics.getByStockItem = function(stockItemId) {
  return this.find({ stockItemId, status: 'active' })
    .populate('uploadedBy.userId', 'name email')
    .sort({ createdAt: -1 });
};

// Static method to get all active documents with pagination
deliveryNotesReceiptsSchema.statics.getAllActive = function(page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  return this.find({ status: 'active' })
    .populate('stockItemId', 'itemName itemId currentStock')
    .populate('uploadedBy.userId', 'name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Instance method to archive document
deliveryNotesReceiptsSchema.methods.archive = function(userId) {
  this.status = 'archived';
  this.archivedAt = new Date();
  this.archivedBy = userId;
  return this.save();
};

module.exports = mongoose.model('DeliveryNotesReceipts', deliveryNotesReceiptsSchema);
