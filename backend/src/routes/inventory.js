const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { auth } = require('../middleware/auth');
const { uploadMultiple, handleUploadError } = require('../middleware/fileUpload');
const {
  getAllInventory,
  getInventoryById,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  updateStock,
  getLowStockItems,
  getInventoryStats,
  getItemCategories
} = require('../controllers/inventoryController');
router.get('/categories', auth, getItemCategories);
router.get('/stats', auth, getInventoryStats);
router.get('/alerts/low-stock', auth, getLowStockItems);
router.get('/:id', auth, getInventoryById);
router.get('/', auth, getAllInventory);

router.post('/', auth, uploadMultiple, handleUploadError, createInventoryItem);
router.put('/:id', auth, updateInventoryItem);
router.patch('/:id/stock', auth, updateStock);
router.delete('/:id', auth, deleteInventoryItem);

module.exports = router;
