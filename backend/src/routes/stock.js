
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const Stock = require('../models/Stock');
const stockController = require('../controllers/stockController'); // renamed controller uses Stock model
const { auth } = require('../middleware/auth');

// Update stock item by itemId
router.put('/:itemId', auth, stockController.updateStockItemByItemId);
// Update stock item by MongoDB _id
router.put('/byid/:id', auth, stockController.updateStockItemById);
// Create a new stock item
router.post('/', auth, stockController.createStockItem);

// Note: POST /api/stock has been removed. All "Save to Inventory" actions must call
// PUT /api/stock/byid/:id and (if needed) POST to /api/suppliers and POST to /api/attachments
// for supplier and file persistence respectively.

// Get all stock items
router.get('/', auth, stockController.getAllStock);

// Get low stock alerts
router.get('/alerts/low-stock', auth, stockController.getLowStockItems);

// Get single stock item by itemId or _id
router.get('/:id', auth, stockController.getStockById);

// Delete stock item by itemId
router.delete('/:id', auth, stockController.deleteStockItem);

module.exports = router;
