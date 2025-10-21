const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  getAllItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
  getItemsByType
} = require('../controllers/itemController');
const { auth } = require('../middleware/auth');

// Validation middleware
const createItemValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Item name is required')
    .isLength({ max: 100 })
    .withMessage('Item name cannot exceed 100 characters'),
  body('type')
    .isIn(['expense', 'item'])
    .withMessage('Type must be either "expense" or "item"'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('itemId')
    .optional()
    .trim()
    .isLength({ min: 3, max: 10 })
    .withMessage('Item ID must be between 3 and 10 characters')
];

const updateItemValidation = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Item name cannot be empty')
    .isLength({ max: 100 })
    .withMessage('Item name cannot exceed 100 characters'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters')
];

// Apply auth middleware to all routes
router.use(auth);

// Routes
router.get('/', getAllItems);
router.get('/type/:type', getItemsByType);
router.get('/:id', getItemById);
router.post('/', createItemValidation, createItem);
router.put('/:id', updateItemValidation, updateItem);
router.delete('/:id', deleteItem);

module.exports = router;