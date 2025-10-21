const DeliveryNotesReceipts = require('../models/DeliveryNotesReceipts');
// const Inventory = require('../models/Inventory');
const { validationResult } = require('express-validator');
const path = require('path');
const fs = require('fs');

// @desc    Get all delivery notes and receipts
// @route   GET /api/delivery-notes-receipts
// @access  Private
const getAllDeliveryNotesReceipts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const transactionId = req.query.transactionId;
    const inventoryItemId = req.query.inventoryItemId;

    let query = { status: 'active' };
    
    // Filter by transaction ID if provided
    if (transactionId) {
      query.transactionId = transactionId;
    }
    
    // Filter by inventory item if provided
    if (inventoryItemId) {
      query.inventoryItemId = inventoryItemId;
    }

    const documents = await DeliveryNotesReceipts.find(query)
      .populate('inventoryItemId', 'itemName itemId currentStock avgCostPrice avgSellingPrice')
      .populate('uploadedBy.userId', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await DeliveryNotesReceipts.countDocuments(query);

    console.log(`📋 Retrieved ${documents.length} delivery documents (page ${page}/${Math.ceil(total / limit)})`);

    res.json({
      success: true,
      data: {
        documents,
        pagination: {
          current: page,
          total: Math.ceil(total / limit),
          count: documents.length,
          totalDocuments: total
        }
      }
    });
  } catch (error) {
    console.error('❌ Error fetching delivery notes and receipts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch delivery notes and receipts'
    });
  }
};

// @desc    Get delivery notes and receipts by transaction ID
// @route   GET /api/delivery-notes-receipts/transaction/:transactionId
// @access  Private
const getByTransactionId = async (req, res) => {
  try {
    const { transactionId } = req.params;

    const documents = await DeliveryNotesReceipts.getByTransactionId(transactionId);

    console.log(`📋 Retrieved ${documents.length} documents for transaction: ${transactionId}`);

    res.json({
      success: true,
      data: { documents }
    });
  } catch (error) {
    console.error('❌ Error fetching documents by transaction ID:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch documents for transaction'
    });
  }
};

// @desc    Get delivery notes and receipts by inventory item
// @route   GET /api/delivery-notes-receipts/inventory/:inventoryItemId
// @access  Private
const getByInventoryItem = async (req, res) => {
  try {
    const { inventoryItemId } = req.params;

    const documents = await DeliveryNotesReceipts.getByInventoryItem(inventoryItemId);

    console.log(`📋 Retrieved ${documents.length} documents for inventory item: ${inventoryItemId}`);

    res.json({
      success: true,
      data: { documents }
    });
  } catch (error) {
    console.error('❌ Error fetching documents by inventory item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch documents for inventory item'
    });
  }
};

// @desc    Create delivery note/receipt
// @route   POST /api/delivery-notes-receipts
// @access  Private
const createDeliveryDocument = async (req, res) => {
  try {
    console.log('📄 Creating delivery document...');
    console.log('📋 Request body:', req.body);
    console.log('📎 Uploaded file:', req.file);
    console.log('👤 JWT User (req.user):', req.user);
    console.log('👤 Full User (req.userDetails):', req.userDetails ? { id: req.userDetails._id, name: req.userDetails.name, email: req.userDetails.email } : 'No userDetails');

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      inventoryItemId,
      itemName,
      itemId,
      transactionId,
      description,
      quantity,
      costPrice,
      sellingPrice,
      deliveryNote
    } = req.body;

    console.log('📋 Parsed fields:', {
      inventoryItemId,
      itemName,
      itemId,
      transactionId,
      hasFile: !!req.file
    });

    // Verify stock item exists
    const stockItem = await Stock.findById(stockItemId);
    if (!stockItem) {
      console.log('❌ Stock item not found:', stockItemId);
      return res.status(404).json({
        success: false,
        message: 'Stock item not found'
      });
    }
    
    console.log('✅ Stock item found:', stockItem.itemName);

    // Verify file was uploaded
    if (!req.file) {
      console.log('❌ No file uploaded');
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }
    
    console.log('✅ File uploaded:', req.file.filename);

    // Get user information from the correct source
    const userId = req.userDetails?._id || req.user?.userId;
    const userName = req.userDetails?.name || req.userDetails?.username || 'Unknown User';
    const userEmail = req.userDetails?.email || 'unknown@email.com';

    console.log('👤 Using user data:', { userId, userName, userEmail });

    // Create delivery document
    const deliveryDocument = new DeliveryNotesReceipts({
      stockItemId,
      itemName: itemName || stockItem.itemName,
      itemId: itemId || stockItem.itemId,
      transactionId,
      fileName: req.file.filename,
      originalName: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      description: description || 'Delivery receipt/note',
      uploadedBy: {
        userId: userId,
        userName: userName,
        userEmail: userEmail
      },
      orderDetails: {
        quantity: parseInt(quantity) || 0,
        costPrice: parseFloat(costPrice) || 0,
        sellingPrice: parseFloat(sellingPrice) || 0,
        deliveryDate: new Date(),
        deliveryNote: deliveryNote || ''
      }
    });

    console.log('💾 Saving delivery document...');
    await deliveryDocument.save();
    console.log('✅ Delivery document saved with ID:', deliveryDocument._id);

    // Populate the saved document
    await deliveryDocument.populate('inventoryItemId', 'itemName itemId currentStock');
    await deliveryDocument.populate('uploadedBy.userId', 'name email');

    console.log('✅ Delivery document created successfully:', deliveryDocument._id);

    res.status(201).json({
      success: true,
      message: 'Delivery document created successfully',
      data: { document: deliveryDocument }
    });

  } catch (error) {
    console.error('❌ Error creating delivery document:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create delivery document',
      error: error.message
    });
  }
};

// @desc    Archive delivery document
// @route   PATCH /api/delivery-notes-receipts/:id/archive
// @access  Private
const archiveDeliveryDocument = async (req, res) => {
  try {
    const { id } = req.params;

    const document = await DeliveryNotesReceipts.findById(id);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Delivery document not found'
      });
    }

    await document.archive(req.user.id || req.user._id);

    console.log('📁 Delivery document archived:', id);

    res.json({
      success: true,
      message: 'Delivery document archived successfully',
      data: { document }
    });

  } catch (error) {
    console.error('❌ Error archiving delivery document:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to archive delivery document'
    });
  }
};

// @desc    Download delivery document
// @route   GET /api/delivery-notes-receipts/:id/download
// @access  Private
const downloadDeliveryDocument = async (req, res) => {
  try {
    const { id } = req.params;

    const document = await DeliveryNotesReceipts.findById(id);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Delivery document not found'
      });
    }

    const filePath = path.resolve(document.filePath);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found on server'
      });
    }

    console.log('📥 Downloading delivery document:', document.originalName);

    // Set appropriate headers
    res.setHeader('Content-Disposition', `attachment; filename="${document.originalName}"`);
    res.setHeader('Content-Type', document.mimeType);

    // Send file
    res.sendFile(filePath);

  } catch (error) {
    console.error('❌ Error downloading delivery document:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download delivery document'
    });
  }
};

// @desc    Get delivery document statistics
// @route   GET /api/delivery-notes-receipts/stats
// @access  Private
const getDeliveryDocumentStats = async (req, res) => {
  try {
    const totalDocuments = await DeliveryNotesReceipts.countDocuments({ status: 'active' });
    const archivedDocuments = await DeliveryNotesReceipts.countDocuments({ status: 'archived' });
    
    // Get documents by month for the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const monthlyStats = await DeliveryNotesReceipts.aggregate([
      {
        $match: {
          status: 'active',
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 },
          totalSize: { $sum: '$fileSize' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Get top inventory items by document count
    const topItems = await DeliveryNotesReceipts.aggregate([
      {
        $match: { status: 'active' }
      },
      {
        $group: {
          _id: '$itemName',
          count: { $sum: 1 },
          totalSize: { $sum: '$fileSize' }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10
      }
    ]);

    console.log('📊 Retrieved delivery document statistics');

    res.json({
      success: true,
      data: {
        totalDocuments,
        archivedDocuments,
        monthlyStats,
        topItems
      }
    });

  } catch (error) {
    console.error('❌ Error fetching delivery document stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch delivery document statistics'
    });
  }
};


// @desc    Get delivery notes and receipts by stock item
// @route   GET /api/delivery-notes-receipts/stock/:stockItemId
// @access  Private
const getByStockItem = async (req, res) => {
  try {
    const { stockItemId } = req.params;
    const documents = await DeliveryNotesReceipts.getByStockItem(stockItemId);
    console.log(`📋 Retrieved ${documents.length} documents for stock item: ${stockItemId}`);
    res.json({
      success: true,
      data: { documents }
    });
  } catch (error) {
    console.error('❌ Error fetching documents by stock item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch documents for stock item'
    });
  }
};



module.exports = {
  getAllDeliveryNotesReceipts,
  getByTransactionId,
  getByStockItem,
  createDeliveryDocument,
  archiveDeliveryDocument,
  downloadDeliveryDocument,
  getDeliveryDocumentStats
};


