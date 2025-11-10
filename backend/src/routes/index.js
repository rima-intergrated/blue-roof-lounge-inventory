const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth');
const staffRoutes = require('./staff');
const salesRoutes = require('./sales');
const creditSalesRoutes = require('./creditSales');
const expenseRoutes = require('./expenses');
const expenseCategoryRoutes = require('./expenseCategory');
const payrollRoutes = require('./payroll');
const supplierRoutes = require('./suppliers');
const attachmentRoutes = require('./attachments');
const customersRoutes = require('./customers');
const deliveryNotesReceiptsRoutes = require('./deliveryNotesReceiptsRoutes');
const passwordSetupRoutes = require('./passwordSetup');
const itemRoutes = require('./items');
const testRoutes = require('./test');
const stockRoutes = require('./stock');
const transactionRoutes = require('./transactions');

// API health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Blue Roof Lounge API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/staff', staffRoutes);
router.use('/sales', salesRoutes);
router.use('/credit-sales', creditSalesRoutes);
router.use('/expenses', expenseRoutes);
router.use('/expense-categories', expenseCategoryRoutes);
router.use('/payroll', payrollRoutes);
router.use('/suppliers', supplierRoutes);
router.use('/password-setup', passwordSetupRoutes);
router.use('/attachments', attachmentRoutes);
router.use('/customers', customersRoutes);
router.use('/delivery-notes-receipts', deliveryNotesReceiptsRoutes);
router.use('/items', itemRoutes);
router.use('/test', testRoutes);
router.use('/stock', stockRoutes);
router.use('/transactions', transactionRoutes);

// Handle 404 for API routes
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.originalUrl
  });
});

module.exports = router;
