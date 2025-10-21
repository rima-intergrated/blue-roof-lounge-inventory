const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const {
  getAllExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
  approveExpense,
  getExpenseSummary,
  getMonthlySummary
} = require('../controllers/expenseController');
const { auth } = require('../middleware/auth');

// Validation rules
const expenseValidation = [
  body('category')
    .trim()
    .notEmpty()
    .withMessage('Category is required')
    .isLength({ max: 100 })
    .withMessage('Category must be less than 100 characters'),
  
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
  
  body('amount')
    .isNumeric()
    .withMessage('Amount must be a number')
    .isFloat({ min: 0 })
    .withMessage('Amount cannot be negative'),
  
  body('expenseDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format'),
  
  body('paymentMethod')
    .optional()
    .isIn(['Cash', 'Card', 'Bank Transfer', 'Mobile Money', 'Cheque'])
    .withMessage('Invalid payment method'),
  
  body('vendor')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Vendor name must be less than 200 characters'),
  
  body('department')
    .optional()
    .isIn(['Kitchen', 'Bar', 'Administration', 'Maintenance', 'Marketing', 'General'])
    .withMessage('Invalid department'),
  
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must be less than 500 characters'),
  
  body('isRecurring')
    .optional()
    .isBoolean()
    .withMessage('isRecurring must be a boolean'),
  
  body('recurringFrequency')
    .optional()
    .isIn(['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Yearly'])
    .withMessage('Invalid recurring frequency')
];

// @route   GET /api/expenses
// @desc    Get all expenses with filtering and pagination
// @access  Private
router.get('/', auth, getAllExpenses);

// @route   GET /api/expenses/summary/range
// @desc    Get expense summary by date range
// @access  Private
router.get('/summary/range', auth, getExpenseSummary);

// @route   GET /api/expenses/summary/monthly
// @desc    Get monthly expense summary
// @access  Private
router.get('/summary/monthly', auth, getMonthlySummary);

// @route   GET /api/expenses/:id
// @desc    Get expense by ID
// @access  Private
router.get('/:id', auth, getExpenseById);

// @route   POST /api/expenses
// @desc    Create new expense
// @access  Private
router.post('/', auth, expenseValidation, createExpense);

// @route   PUT /api/expenses/:id
// @desc    Update expense
// @access  Private
router.put('/:id', auth, expenseValidation, updateExpense);

// @route   PATCH /api/expenses/:id/approve
// @desc    Approve expense
// @access  Private
router.patch('/:id/approve', auth, approveExpense);

// @route   DELETE /api/expenses/:id
// @desc    Delete expense
// @access  Private
router.delete('/:id', auth, deleteExpense);

module.exports = router;