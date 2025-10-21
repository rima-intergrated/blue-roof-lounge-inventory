const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema({
  fileName: {
    type: String,
    required: [true, 'File name is required'],
    trim: true
  },
  originalName: {
    type: String,
    required: [true, 'Original file name is required'],
    trim: true
  },
  filePath: {
    type: String,
    required: [true, 'File path is required']
  },
  fileSize: {
    type: Number,
    required: [true, 'File size is required'],
    min: [0, 'File size cannot be negative']
  },
  mimeType: {
    type: String,
    required: [true, 'MIME type is required']
  },
  // Reference to the related entity (inventory item, staff, etc.)
  entityType: {
    type: String,
    required: [true, 'Entity type is required'],
  enum: ['stock', 'staff', 'payroll', 'sales', 'suppliers', 'expense', 'general']
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: false,
    refPath: 'entityType',
    default: null
  },
  // Optional metadata
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  tags: [{
    type: String,
    trim: true
  }],
  // Transaction ID (REFID-ISO-timestamp)
  transactionId: {
    type: String,
    required: true,
    index: true
  },
  // Who uploaded it
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Status and visibility
  isActive: {
    type: Boolean,
    default: true
  },
  isPublic: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for file URL
attachmentSchema.virtual('fileUrl').get(function() {
  return `/uploads/${this.entityType}/${this.fileName}`;
});

// Virtual for human-readable file size
attachmentSchema.virtual('fileSizeFormatted').get(function() {
  const bytes = this.fileSize;
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
});

// Indexes for better performance
attachmentSchema.index({ entityType: 1, entityId: 1 });
attachmentSchema.index({ uploadedBy: 1 });
attachmentSchema.index({ mimeType: 1 });
attachmentSchema.index({ isActive: 1 });
attachmentSchema.index({ createdAt: -1 });

// Pre-remove middleware to delete physical file
attachmentSchema.pre('deleteOne', { document: true, query: false }, function(next) {
  const fs = require('fs');
  const path = require('path');
  
  try {
    if (fs.existsSync(this.filePath)) {
      fs.unlinkSync(this.filePath);
      console.log(`🗑️ Deleted file: ${this.filePath}`);
    }
  } catch (error) {
    console.error('Error deleting file:', error);
  }
  
  next();
});

// Static method to find attachments by entity
attachmentSchema.statics.findByEntity = function(entityType, entityId) {
  return this.find({ 
    entityType, 
    entityId, 
    isActive: true 
  }).sort({ createdAt: -1 });
};

// Static method to cleanup orphaned files
attachmentSchema.statics.cleanupOrphanedFiles = async function() {
  const fs = require('fs');
  const path = require('path');
  
  try {
    const attachments = await this.find({ isActive: true });
    const dbFiles = new Set(attachments.map(att => att.fileName));
    
    const uploadDir = path.join(__dirname, '../../../uploads');
  const entityTypes = ['stock', 'staff', 'payroll', 'sales', 'suppliers', 'general'];
    
    let deletedCount = 0;
    
    for (const entityType of entityTypes) {
      const entityDir = path.join(uploadDir, entityType);
      if (fs.existsSync(entityDir)) {
        const files = fs.readdirSync(entityDir);
        
        for (const file of files) {
          if (!dbFiles.has(file)) {
            fs.unlinkSync(path.join(entityDir, file));
            deletedCount++;
            console.log(`🗑️ Cleaned up orphaned file: ${file}`);
          }
        }
      }
    }
    
    return { deletedCount };
  } catch (error) {
    console.error('Error during cleanup:', error);
    throw error;
  }
};

module.exports = mongoose.model('Attachment', attachmentSchema);