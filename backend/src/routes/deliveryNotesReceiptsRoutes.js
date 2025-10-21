const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { body } = require('express-validator');
const { auth } = require('../middleware/auth');
const {
  getAllDeliveryNotesReceipts,
  getByTransactionId,
  getByStockItem,
  createDeliveryDocument,
  archiveDeliveryDocument,
  downloadDeliveryDocument,
  getDeliveryDocumentStats
} = require('../controllers/deliveryNotesReceiptsController');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads/delivery-documents');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Created delivery documents upload directory:', uploadsDir);
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Create unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, extension);
    cb(null, `${baseName}-${uniqueSuffix}${extension}`);
  }
});

// File filter for allowed file types
const fileFilter = (req, file, cb) => {
  // Allow common document and image formats
  const allowedMimeTypes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv'
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, images, Word, Excel, and text files are allowed.'), false);
  }
};

// Configure multer upload
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 1
  }
});

// Validation rules for creating delivery documents
const createDeliveryDocumentValidation = [
  body('stockItemId')
    .notEmpty()
  .withMessage('Stock item ID is required')
    .isMongoId()
  .withMessage('Invalid stock item ID'),
  
  body('transactionId')
    .optional()
    .isString()
    .withMessage('Transaction ID must be a string'),
  
  body('description')
    .optional()
    .isString()
    .isLength({ max: 500 })
    .withMessage('Description must be a string with maximum 500 characters'),
  
  body('quantity')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Quantity must be a non-negative integer'),
  
  body('costPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Cost price must be a non-negative number'),
  
  body('sellingPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Selling price must be a non-negative number'),
  
  body('deliveryNote')
    .optional()
    .isString()
    .isLength({ max: 1000 })
    .withMessage('Delivery note must be a string with maximum 1000 characters')
];

// @route   GET /api/delivery-notes-receipts
// @desc    Get all delivery notes and receipts (with pagination and filtering)
// @access  Private
router.get('/', auth, getAllDeliveryNotesReceipts);

// @route   GET /api/delivery-notes-receipts/stats
// @desc    Get delivery document statistics
// @access  Private
router.get('/stats', auth, getDeliveryDocumentStats);

// @route   GET /api/delivery-notes-receipts/transaction/:transactionId
// @desc    Get delivery notes and receipts by transaction ID
// @access  Private
router.get('/transaction/:transactionId', auth, getByTransactionId);

// @route   GET /api/delivery-notes-receipts/stock/:stockItemId
// @desc    Get delivery notes and receipts by stock item ID
// @access  Private
router.get('/stock/:stockItemId', auth, getByStockItem);

// @route   GET /api/delivery-notes-receipts/:id/download
// @desc    Download delivery document
// @access  Private
router.get('/:id/download', auth, downloadDeliveryDocument);

// @route   POST /api/delivery-notes-receipts
// @desc    Create new delivery note/receipt with file upload
// @access  Private
router.post('/', auth, upload.single('deliveryDocument'), createDeliveryDocumentValidation, createDeliveryDocument);

// @route   PATCH /api/delivery-notes-receipts/:id/archive
// @desc    Archive delivery document (soft delete)
// @access  Private
router.patch('/:id/archive', auth, archiveDeliveryDocument);

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 50MB.'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Only one file allowed per upload.'
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected file field. Use "deliveryDocument" as the field name.'
      });
    }
  }
  
  if (error.message && error.message.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  
  console.error('❌ Upload error:', error);
  res.status(500).json({
    success: false,
    message: 'File upload failed'
  });
});

module.exports = router;