const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  getAllPayroll,
  getPayrollById,
  createPayroll,
  updatePayroll,
  markAsPaid,
  getPayrollStats,
  getEmployeePayrollHistory
} = require('../controllers/payrollController');
const { auth } = require('../middleware/auth');

// Validation middleware
const validatePayroll = [
  body('employee')
    .isMongoId()
    .withMessage('Valid employee ID is required'),
  body('payPeriod.startDate')
    .isISO8601()
    .withMessage('Valid start date is required'),
  body('payPeriod.endDate')
    .isISO8601()
    .withMessage('Valid end date is required'),
  body('basicSalary')
    .isFloat({ min: 0 })
    .withMessage('Basic salary must be a positive number'),
  body('allowances')
    .optional()
    .isObject()
    .withMessage('Allowances must be an object'),
  body('deductions')
    .optional()
    .isObject()
    .withMessage('Deductions must be an object'),
  body('workingDays.expected')
    .optional()
    .isInt({ min: 1, max: 31 })
    .withMessage('Expected working days must be between 1 and 31'),
  body('workingDays.actual')
    .optional()
    .isInt({ min: 0, max: 31 })
    .withMessage('Actual working days must be between 0 and 31')
];

const validatePaymentDetails = [
  body('paymentMethod')
    .optional()
    .isIn(['Bank Transfer', 'Cash', 'Cheque', 'Mobile Money'])
    .withMessage('Invalid payment method'),
  body('paidDate')
    .optional()
    .isISO8601()
    .withMessage('Valid paid date is required')
];

// Routes
router.get('/', auth, getAllPayroll);
router.get('/stats', auth, getPayrollStats);
router.get('/employee/:employeeId', auth, getEmployeePayrollHistory);
router.get('/:id', auth, getPayrollById);

router.post('/', auth, validatePayroll, createPayroll);
router.put('/:id', auth, validatePayroll, updatePayroll);
router.patch('/:id/pay', auth, validatePaymentDetails, markAsPaid);

module.exports = router;
