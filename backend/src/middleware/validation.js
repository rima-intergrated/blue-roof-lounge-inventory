const { body, param, query } = require('express-validator');

// User/Auth validation rules
const validateRegister = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  
  body('role')
    .optional()
    .isIn(['Administrator', 'Manager', 'Cashier'])
    .withMessage('Invalid role specified'),
  
  body('staffId')
    .optional()
    .isMongoId()
    .withMessage('Invalid staff ID format')
];

const validateLogin = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email or username is required'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const validateChangePassword = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one lowercase letter, one uppercase letter, and one number')
];

// Staff validation rules
const validateStaff = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Staff name is required')
    .isLength({ max: 100 })
    .withMessage('Name cannot exceed 100 characters'),
  
  body('gender')
    .notEmpty()
    .withMessage('Gender is required')
    .isIn(['Male', 'Female'])
    .withMessage('Gender must be Male or Female'),
  
  body('contact')
    .trim()
    .notEmpty()
    .withMessage('Contact number is required')
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Please enter a valid phone number'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  
  body('position')
    .trim()
    .notEmpty()
    .withMessage('Position is required'),
  
  body('address')
    .trim()
    .notEmpty()
    .withMessage('Address is required')
    .isLength({ max: 200 })
    .withMessage('Address cannot exceed 200 characters'),
  
  body('salary')
    .isFloat({ min: 0 })
    .withMessage('Salary must be a positive number'),
  
  body('emergencyContact.name')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Emergency contact name must be a valid string'),
    
  body('emergencyContact.phone')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Emergency contact phone must be a valid string'),
    
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters')
];

// Sales validation rules
const validateSale = [
  body('itemName')
    .trim()
    .notEmpty()
    .withMessage('Item name is required'),
  // Accept either stockId (preferred) or itemId for backward compatibility
  body('stockId')
    .optional()
    .isMongoId()
    .withMessage('stockId must be a valid Mongo ID'),
  body('itemId')
    .optional()
    .trim()
    .custom((value, { req }) => {
      // If stockId is not provided, itemId becomes required
      if (!req.body.stockId && (!value || value.toString().trim() === '')) {
        throw new Error('Either stockId or itemId is required');
      }
      return true;
    }),
  
  body('sellingPrice')
    .isNumeric()
    .withMessage('Selling price must be a number')
    .custom(value => {
      if (value <= 0) {
        throw new Error('Selling price must be greater than 0');
      }
      return true;
    }),
  
  body('costPrice')
    .optional()
    .isNumeric()
    .withMessage('Cost price must be a number')
    .custom(value => {
      if (value < 0) {
        throw new Error('Cost price cannot be negative');
      }
      return true;
    }),
  
  body('quantitySold')
    .isInt({ min: 1 })
    .withMessage('Quantity sold must be at least 1'),
  
  body('paymentMode')
    .isIn(['Cash', 'Credit', 'Mobile Transfer'])
    .withMessage('Payment mode must be Cash, Credit, or Mobile Transfer'),
  
  body('customer')
    .trim()
    .notEmpty()
    .withMessage('Customer name is required'),
  
  body('customerMobile')
    .optional()
    .matches(/^(\+254|0)[7-9]\d{8}$/)
    .withMessage('Please provide a valid Kenyan phone number'),
  
  body('discount')
    .optional()
    .isNumeric()
    .custom(value => {
      if (value < 0) {
        throw new Error('Discount cannot be negative');
      }
      return true;
    }),
  
  body('tax')
    .optional()
    .isNumeric()
    .custom(value => {
      if (value < 0) {
        throw new Error('Tax cannot be negative');
      }
      return true;
    })
];

// Inventory validation rules
const validateInventory = [
  body('itemName')
    .trim()
    .notEmpty()
    .withMessage('Item name is required')
    .isLength({ max: 100 })
    .withMessage('Item name cannot exceed 100 characters'),
  
  body('itemId')
    .trim()
    .notEmpty()
    .withMessage('Item ID is required'),
  
  body('category')
    .isIn(['Beer', 'Wine', 'Spirits', 'Soft Drinks', 'Snacks', 'Food', 'Accessories', 'Other'])
    .withMessage('Invalid category'),
  
  body('brand')
    .trim()
    .notEmpty()
    .withMessage('Brand is required'),
  
  body('unitOfMeasure')
    .isIn(['Bottle', 'Can', 'Glass', 'Piece', 'Pack', 'Carton', 'Liter', 'Kg', 'Other'])
    .withMessage('Invalid unit of measure'),
  
  body('costPrice')
    .isNumeric()
    .withMessage('Cost price must be a number')
    .custom(value => {
      if (value < 0) {
        throw new Error('Cost price cannot be negative');
      }
      return true;
    }),
  
  body('sellingPrice')
    .isNumeric()
    .withMessage('Selling price must be a number')
    .custom((value, { req }) => {
      if (value <= 0) {
        throw new Error('Selling price must be greater than 0');
      }
      if (value <= req.body.costPrice) {
        throw new Error('Selling price must be greater than cost price');
      }
      return true;
    }),
  
  body('currentStock')
    .isInt({ min: 0 })
    .withMessage('Current stock cannot be negative'),
  
  body('minimumStock')
    .isInt({ min: 0 })
    .withMessage('Minimum stock cannot be negative'),
  
  body('maximumStock')
    .isInt({ min: 1 })
    .withMessage('Maximum stock must be at least 1')
    .custom((value, { req }) => {
      if (value <= req.body.minimumStock) {
        throw new Error('Maximum stock must be greater than minimum stock');
      }
      return true;
    }),
  
  body('reorderLevel')
    .isInt({ min: 0 })
    .withMessage('Reorder level cannot be negative'),
  
  body('expiryDate')
    .optional()
    .isISO8601()
    .toDate()
    .custom(value => {
      if (new Date(value) <= new Date()) {
        throw new Error('Expiry date must be in the future');
      }
      return true;
    })
];

// Position validation rules
const validatePosition = [
  body('positionTitle')
    .trim()
    .notEmpty()
    .withMessage('Position title is required')
    .isLength({ max: 100 })
    .withMessage('Position title cannot exceed 100 characters'),
  
  body('department')
    .isIn(['Management', 'Sales', 'Bar/Service', 'Kitchen', 'Security', 'Cleaning', 'Administration', 'Other'])
    .withMessage('Invalid department'),
  
  body('level')
    .isIn(['Executive', 'Management', 'Supervisory', 'Senior Staff', 'Junior Staff', 'Entry Level'])
    .withMessage('Invalid position level'),
  
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Position description is required')
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
  
  body('salary.minimum')
    .isNumeric()
    .withMessage('Minimum salary must be a number')
    .custom(value => {
      if (value < 0) {
        throw new Error('Minimum salary cannot be negative');
      }
      return true;
    }),
  
  body('salary.maximum')
    .isNumeric()
    .withMessage('Maximum salary must be a number')
    .custom((value, { req }) => {
      if (value < req.body.salary?.minimum) {
        throw new Error('Maximum salary must be greater than or equal to minimum salary');
      }
      return true;
    }),
  
  body('maxPositions')
    .isInt({ min: 1 })
    .withMessage('Maximum positions must be at least 1')
];

// Common validation rules
const validateMongoId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid ID format')
];

const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

module.exports = {
  validateRegister,
  validateLogin,
  validateChangePassword,
  validateStaff,
  validateSale,
  validateInventory,
  validatePosition,
  validateMongoId,
  validatePagination
};
