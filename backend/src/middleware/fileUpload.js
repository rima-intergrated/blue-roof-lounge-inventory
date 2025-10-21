const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

// Ensure upload directory exists
const uploadDir = process.env.UPLOAD_PATH || './uploads';
const inventoryUploadDir = path.join(uploadDir, 'inventory');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

if (!fs.existsSync(inventoryUploadDir)) {
  fs.mkdirSync(inventoryUploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    try {
      // Determine entityType in a robust way. Prefer query param (available before multipart parsing),
      // then fall back to parsed body, otherwise default to 'inventory'. This avoids cases where multer
      // processes file parts before form fields and req.body.entityType is not yet present.
      const entityType = (req.query && req.query.entityType) ? String(req.query.entityType).trim() : ((req.body && req.body.entityType) ? String(req.body.entityType).trim() : 'inventory');
      const entityDir = path.join(uploadDir, entityType);
      if (!fs.existsSync(entityDir)) {
        fs.mkdirSync(entityDir, { recursive: true });
      }
      cb(null, entityDir);
    } catch (err) {
      // Fallback to inventory directory on any error
      cb(null, inventoryUploadDir);
    }
  },
  filename: function (req, file, cb) {
    // Generate a MongoDB ObjectId for this file and use it as the filename.
    // This ensures the saved file name can be used as the Attachment._id later.
    try {
      const ext = path.extname(file.originalname) || '';
      const generatedId = mongoose.Types.ObjectId().toString();
      // Attach the generated id to the file object so downstream code can use it
      file.generatedId = generatedId;
      cb(null, `${generatedId}${ext}`);
    } catch (e) {
      // Fallback to timestamp-based name on error
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      const name = path.basename(file.originalname, ext);
      cb(null, `${name}-${uniqueSuffix}${ext}`);
    }
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/gif,application/pdf').split(',');
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed. Allowed types: ${allowedTypes.join(', ')}`), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB default
    files: 5 // Maximum 5 files per request
  },
  fileFilter: fileFilter
});

// Middleware for single file upload
const uploadSingle = (fieldName = 'attachment') => {
  return upload.single(fieldName);
};

// Middleware for multiple file upload
const uploadMultiple = (fieldName = 'attachments', maxCount = 5) => {
  return upload.array(fieldName, maxCount);
};

// Error handling middleware
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large',
        error: `Maximum file size is ${(parseInt(process.env.MAX_FILE_SIZE) || 10485760) / (1024 * 1024)}MB`
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files',
        error: 'Maximum 5 files allowed'
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected field name',
        error: err.message
      });
    }
  }
  
  if (err.message.includes('File type')) {
    return res.status(400).json({
      success: false,
      message: 'Invalid file type',
      error: err.message
    });
  }
  
  next(err);
};

// Helper function to delete uploaded files
const deleteFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
  } catch (error) {
    console.error('Error deleting file:', error);
  }
  return false;
};

// Helper function to get file URL
const getFileUrl = (filePath) => {
  if (!filePath) return null;
  try {
    const dirName = path.basename(path.dirname(filePath));
    return `/uploads/${dirName}/${path.basename(filePath)}`;
  } catch (e) {
    return `/uploads/inventory/${path.basename(filePath)}`;
  }
};

module.exports = {
  uploadSingle,
  uploadMultiple,
  handleUploadError,
  deleteFile,
  getFileUrl,
  inventoryUploadDir
};