const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { auth, optionalAuth } = require('../middleware/auth');
const {
  getTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  deleteMultipleTransactions,
  getTransactionStats
} = require('../controllers/transactionController');

// Validation middleware
const validateTransaction = [
  body('type')
    .optional()
    .isIn(['purchase', 'inventory_add', 'stock_adjustment', 'return'])
    .withMessage('Invalid transaction type'),
  body('status')
    .optional()
    .isIn(['pending', 'completed', 'cancelled'])
    .withMessage('Invalid transaction status'),
  body('items')
    .isArray({ min: 1 })
    .withMessage('Items array is required and must contain at least one item'),
  body('items.*.itemName')
    .trim()
    .notEmpty()
    .withMessage('Item name is required'),
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer'),
  body('items.*.unitPrice')
    .isFloat({ min: 0 })
    .withMessage('Unit price must be a non-negative number'),
  body('items.*.totalPrice')
    .isFloat({ min: 0 })
    .withMessage('Total price must be a non-negative number'),
  body('items.*.supplier')
    .optional()
    .trim(),
  body('dateOrdered')
    .optional()
    .isISO8601()
    .withMessage('Date ordered must be a valid date'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters')
];

const validateTransactionUpdate = [
  body('type')
    .optional()
    .isIn(['purchase', 'inventory_add', 'stock_adjustment', 'return'])
    .withMessage('Invalid transaction type'),
  body('status')
    .optional()
    .isIn(['pending', 'completed', 'cancelled'])
    .withMessage('Invalid transaction status'),
  body('items')
    .optional()
    .isArray({ min: 1 })
    .withMessage('Items array must contain at least one item'),
  body('items.*.itemName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Item name cannot be empty'),
  body('items.*.quantity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer'),
  body('items.*.unitPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Unit price must be a non-negative number'),
  body('items.*.totalPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Total price must be a non-negative number'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters')
];

// Routes

// GET /api/transactions/stats - Get transaction statistics
router.get('/stats', optionalAuth, getTransactionStats);

// GET /api/transactions/:id - Get single transaction by ID
router.get('/:id', optionalAuth, getTransactionById);

// GET /api/transactions - Get all transactions with filtering and pagination
router.get('/', optionalAuth, getTransactions);

// POST /api/transactions - Create new transaction
router.post('/', optionalAuth, validateTransaction, createTransaction);

// PUT /api/transactions/:id - Update transaction
router.put('/:id', auth, validateTransactionUpdate, updateTransaction);

// DELETE /api/transactions/bulk - Delete multiple transactions
router.delete('/bulk', auth, deleteMultipleTransactions);

// DELETE /api/transactions/:id - Delete single transaction
router.delete('/:id', auth, deleteTransaction);

module.exports = router;