const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true,
    maxlength: [100, 'Item name cannot exceed 100 characters'],
    unique: true
  },
  itemId: {
    type: String,
    required: [true, 'Item ID is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  type: {
    type: String,
    required: [true, 'Item type is required'],
    default: 'item'
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
itemSchema.index({ name: 1, type: 1 });
itemSchema.index({ itemId: 1 });
itemSchema.index({ type: 1, isActive: 1 });
itemSchema.index({ createdBy: 1 });

// Virtual for item display name
itemSchema.virtual('displayName').get(function() {
  return `${this.itemId} - ${this.name}`;
});
itemSchema.statics.getNextAvailableId = async function(type) {
  const prefix = type === 'expense' ? 'BRL' : 'BR';
  const existingItems = await this.find({ type }).select('itemId');
  const usedNumbers = existingItems
    .map(item => parseInt(item.itemId.replace(prefix, '')))
    .filter(num => !isNaN(num))
    .sort((a, b) => a - b);

  // Find first available number (starting from 001)
  for (let i = 1; i <= 999; i++) {
    const paddedNum = i.toString().padStart(3, '0');
    if (!usedNumbers.includes(i)) {
      return `${prefix}${paddedNum}`;
    }
  }
  
  throw new Error(`No available IDs for ${type} items`);
};

// Pre-save middleware to generate itemId if not provided
itemSchema.pre('save', async function(next) {
  if (!this.itemId && this.isNew) {
    try {
      this.itemId = await this.constructor.getNextAvailableId(this.type);
    } catch (error) {
      return next(error);
    }
  }
  next();
});

module.exports = mongoose.model('Item', itemSchema);