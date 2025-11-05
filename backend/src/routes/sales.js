const express = require('express');
const router = express.Router();
const {
  getAllSales,
  getSaleById,
  createSale,
  updateSale,
  deleteSale,
  markAsPaid,
  getSalesStats,
  getOverdueSales
} = require('../controllers/salesController');
const { auth, checkPermission } = require('../middleware/auth');
const {
  validateSale,
  validateMongoId,
  validatePagination
} = require('../middleware/validation');

// Apply authentication to all routes
router.use(auth);

// Sales viewing routes
router.get('/stats', checkPermission('sales', 'view'), getSalesStats);
router.get('/overdue', checkPermission('sales', 'view'), getOverdueSales);
router.get('/', [validatePagination, checkPermission('sales', 'view')], getAllSales);
router.get('/:id', [validateMongoId, checkPermission('sales', 'view')], getSaleById);

// Sales creation and modification routes
router.post('/', [validateSale, checkPermission('sales', 'add')], createSale);
router.put('/:id', [validateMongoId, checkPermission('sales', 'edit')], updateSale);
router.put('/:id/pay', [validateMongoId, checkPermission('sales', 'edit')], markAsPaid);
router.delete('/:id', [validateMongoId, checkPermission('sales', 'delete')], deleteSale);

module.exports = router;
