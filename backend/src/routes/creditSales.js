const express = require('express');
const router = express.Router();
const multer = require('multer');
const { auth } = require('../middleware/auth');
const creditSalesController = require('../controllers/creditSalesController');

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPG, PNG, GIF, and PDF files are allowed.'), false);
    }
  }
});

// Middleware to handle both JSON and form-data
const parseRequestData = (req, res, next) => {
  // For multipart requests, convert numeric strings to numbers
  if (req.is('multipart/form-data') || req.file) {
    console.log('📋 Processing multipart form data for credit sale');
    // Convert numeric strings to numbers
    if (req.body.quantitySold) {
      req.body.quantitySold = parseInt(req.body.quantitySold);
    }
    if (req.body.sellingPrice) {
      req.body.sellingPrice = parseFloat(req.body.sellingPrice);
    }
    if (req.body.totalAmount) {
      req.body.totalAmount = parseFloat(req.body.totalAmount);
    }
    if (req.body.costPrice) {
      req.body.costPrice = parseFloat(req.body.costPrice);
    }
  }
  next();
};

// Routes
router.get('/', auth, creditSalesController.getAllCreditSales);
router.get('/stats', auth, creditSalesController.getCreditSalesStats);
router.get('/:id', auth, creditSalesController.getCreditSaleById);

// POST route for creating credit sales (handles both JSON and form-data)
router.post('/', auth, upload.single('proofOfPayment'), parseRequestData, creditSalesController.createCreditSale);

// PUT route for updating credit sales
router.put('/:id', auth, creditSalesController.updateCreditSale);

// PATCH route for marking as paid
router.patch('/:id/mark-paid', auth, creditSalesController.markAsPaid);

// DELETE route
router.delete('/:id', auth, creditSalesController.deleteCreditSale);

module.exports = router;