const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  uploadAttachment,
  getAttachmentsByEntity,
  getAllAttachments,
  downloadAttachment,
  updateAttachment,
  deleteAttachment,
  cleanupOrphanedFiles
} = require('../controllers/attachmentController');
const { auth } = require('../middleware/auth');
const { uploadMultiple, handleUploadError } = require('../middleware/fileUpload');

// Validation middleware
const validateAttachmentUpload = [
  body('entityType')
    // allow both 'inventory' and the frontend 'stock' alias
    .isIn(['inventory', 'stock', 'staff', 'payroll', 'sales', 'suppliers', 'expense', 'general'])
    .withMessage('Invalid entity type'),
  // entityId may be empty when attachments are uploaded before an entity exists
  body('entityId')
    .optional({ checkFalsy: true })
    .isMongoId()
    .withMessage('Invalid entity ID'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('tags')
    .optional()
    .isString()
    .withMessage('Tags must be a comma-separated string')
];

const validateAttachmentUpdate = [
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('tags')
    .optional()
    .isString()
    .withMessage('Tags must be an array or comma-separated string'),
  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic must be a boolean')
];

// Routes

// Upload attachments
router.post('/', 
  auth, 
  uploadMultiple('attachments', 10), 
  validateAttachmentUpload, 
  handleUploadError, 
  uploadAttachment
);

// Get all attachments with filtering/pagination
router.get('/', auth, getAllAttachments);

// Get attachments for specific entity
router.get('/:entityType/:entityId', auth, getAttachmentsByEntity);

// Download/view attachment (public access for file viewing)
router.get('/download/:id', downloadAttachment);

// Update attachment metadata
router.put('/:id', auth, validateAttachmentUpdate, updateAttachment);

// Delete attachment
router.delete('/:id', auth, deleteAttachment);

// Cleanup orphaned files (admin only)
router.post('/cleanup', auth, cleanupOrphanedFiles);

module.exports = router;