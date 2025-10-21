const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  getAllSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  updateSupplierStatus,
  addProductToSupplier,
  getSupplierStats
} = require('../controllers/supplierController');
const { createSimpleSupplier } = require('../controllers/supplierController');
const { auth } = require('../middleware/auth');

// Validation middleware
const validateSupplier = [
  body('supplierName')
    .trim()
    .notEmpty()
    .withMessage('Supplier name is required')
    .isLength({ max: 100 })
    .withMessage('Supplier name cannot exceed 100 characters'),
  body('supplierId')
    .trim()
    .notEmpty()
    .withMessage('Supplier ID is required'),
  body('contactPerson.firstName')
    .trim()
    .notEmpty()
    .withMessage('Contact person first name is required'),
  body('contactPerson.lastName')
    .trim()
    .notEmpty()
    .withMessage('Contact person last name is required'),
  body('contactInformation.phoneNumber')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required'),
  body('contactInformation.email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('address.street')
    .trim()
    .notEmpty()
    .withMessage('Street address is required'),
  body('address.city')
    .trim()
    .notEmpty()
    .withMessage('City is required'),
  body('address.state')
    .trim()
    .notEmpty()
    .withMessage('State is required'),
  body('address.postalCode')
    .trim()
    .notEmpty()
    .withMessage('Postal code is required'),
  body('address.country')
    .trim()
    .notEmpty()
    .withMessage('Country is required'),
  body('businessDetails.registrationNumber')
    .optional()
    .trim(),
  body('businessDetails.taxNumber')
    .optional()
    .trim(),
  body('paymentTerms.creditDays')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Credit days must be a non-negative integer'),
  body('paymentTerms.discountPercentage')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Discount percentage must be between 0 and 100')
];

const validateSupplierStatus = [
  body('status')
    .isIn(['Active', 'Inactive', 'Suspended'])
    .withMessage('Status must be Active, Inactive, or Suspended'),
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Reason cannot exceed 500 characters')
];

const validateProduct = [
  body('productName')
    .trim()
    .notEmpty()
    .withMessage('Product name is required'),
  body('productCode')
    .trim()
    .notEmpty()
    .withMessage('Product code is required'),
  body('unitPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Unit price must be a positive number')
];

// Routes
router.get('/', auth, getAllSuppliers);
router.get('/stats', auth, getSupplierStats);
router.get('/:id', auth, getSupplierById);

router.post('/', auth, validateSupplier, createSupplier);
router.post('/simple', auth, createSimpleSupplier);
router.put('/:id', auth, validateSupplier, updateSupplier);
router.patch('/:id/status', auth, validateSupplierStatus, updateSupplierStatus);
router.post('/:id/products', auth, validateProduct, addProductToSupplier);
router.delete('/:id', auth, deleteSupplier);

module.exports = router;
