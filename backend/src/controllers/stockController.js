const { validationResult } = require('express-validator');
const Stock = require('../models/Stock');
const Inventory = require('../models/Item');
const Category = require('../models/Item');

// @desc    Update stock item by MongoDB _id
// @route   PUT /api/stock/byid/:id
// @access  Private
const updateStockItemById = async (req, res) => {
  try {
    const id = req.params.id;
    if (!id || !String(id).match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ success: false, message: 'Invalid id' });
    }

    // Extract update fields from body
    const body = req.body || {};
    const orderQuantity = typeof body.orderQuantity !== 'undefined' ? Number(body.orderQuantity) : 0;
    const costPrice = typeof body.costPrice !== 'undefined' ? Number(body.costPrice) : undefined;
    const sellingPrice = typeof body.sellingPrice !== 'undefined' ? Number(body.sellingPrice) : undefined;
    const currentStockBody = typeof body.currentStock !== 'undefined' ? Number(body.currentStock) : undefined;
    const date = body.date;
    const supplierName = body.supplierName;
    const supplierContact = body.supplierContact;

    // Note: supplier and attachment persistence are intentionally handled via their
    // own endpoints (POST /api/suppliers and POST /api/attachments). This handler
    // focuses solely on updating the stock document by MongoDB _id.

    // If incoming orderQuantity > 0, perform atomic aggregation-pipeline update to increment currentStock
  const incomingQty = Number(orderQuantity) || 0;
  // Resolve date to be applied for this save action (use provided date or now)
  const dateObj = date ? new Date(date) : null; // if null, we'll use $$NOW in pipeline
    if (incomingQty > 0) {
      // Build aggregation pipeline update that:
      //  - computes newStock = currentStock + incomingQty
      //  - computes new costPrice and sellingPrice as weighted averages
      //  - sets currentStock = newStock, stockValue, projectedProfit and updates date/orderQuantity
      const incomingCost = typeof costPrice !== 'undefined' ? costPrice : 0;
      const incomingSell = typeof sellingPrice !== 'undefined' ? sellingPrice : 0;

  const dateTerm = dateObj ? dateObj : "$$NOW";
  const pipeline = [
        {
          $set: {
            newStock: { $add: [ { $ifNull: [ "$currentStock", 0 ] }, incomingQty ] }
          }
        },
        {
          $set: {
            costPrice: {
              $cond: [
                { $gt: ["$newStock", 0] },
                { $divide: [ { $add: [ { $multiply: [ { $ifNull: ["$costPrice", 0] }, { $ifNull: ["$currentStock", 0] } ] }, incomingQty * incomingCost ] }, "$newStock" ] },
                incomingCost
              ]
            },
            sellingPrice: {
              $cond: [
                { $gt: ["$newStock", 0] },
                { $divide: [ { $add: [ { $multiply: [ { $ifNull: ["$sellingPrice", 0] }, { $ifNull: ["$currentStock", 0] } ] }, incomingQty * incomingSell ] }, "$newStock" ] },
                incomingSell
              ]
            },
            currentStock: "$newStock"
          }
        },
        {
          $set: {
            stockValue: { $multiply: [ { $ifNull: ["$currentStock", 0] }, { $ifNull: ["$costPrice", 0] } ] },
            projectedProfit: { $multiply: [ { $ifNull: ["$currentStock", 0] }, { $subtract: [ { $ifNull: ["$sellingPrice", 0] }, { $ifNull: ["$costPrice", 0] } ] } ] },
            orderQuantity: incomingQty,
            date: dateTerm
          }
        },
        {
          $unset: ["newStock"]
        }
      ];

      // Perform atomic update and return the updated document
      const updated = await Stock.findOneAndUpdate({ _id: id }, pipeline, { new: true }).exec();

      // If a transactionId was provided, link any uploaded attachments to this stock
      let linkedAttachments = [];
      try {
        const Attachment = require('../models/Attachment');
        const tx = body.transactionId || body.transactionID || body.transaction;
        if (tx) {
          await Attachment.updateMany({ transactionId: tx, entityType: 'stock' }, { $set: { entityId: updated._id } }).exec();
          linkedAttachments = await Attachment.find({ transactionId: tx, entityType: 'stock' }).lean().exec();
        }
      } catch (attErr) {
        console.warn('Failed to link attachments after stock update:', attErr && attErr.message);
      }

      return res.status(200).json({ success: true, message: 'Stock item updated', data: { item: updated, attachments: linkedAttachments } });
    }

    // Fallback: direct set when incomingQty is zero but currentStockBody is provided
    // Fallback: direct set when incomingQty is zero but explicit fields are provided
    const updateSet = {};
    if (typeof currentStockBody !== 'undefined') updateSet.currentStock = currentStockBody;
    if (typeof costPrice !== 'undefined') updateSet.costPrice = costPrice;
    if (typeof sellingPrice !== 'undefined') updateSet.sellingPrice = sellingPrice;
    if (typeof body.orderQuantity !== 'undefined') updateSet.orderQuantity = Number(body.orderQuantity);
    // No supplier/attachment processing here. If no updatable fields provided, error.
    if (Object.keys(updateSet).length === 0) {
      return res.status(400).json({ success: false, message: 'No updatable fields provided' });
    }

    // Read existing document to compute derived fields correctly
    const existing = await Stock.findById(id).lean().exec();
    if (!existing) return res.status(404).json({ success: false, message: 'Stock item not found' });

    const final = { ...existing, ...updateSet };
    // Compute derived fields
    final.currentStock = typeof updateSet.currentStock !== 'undefined' ? Number(updateSet.currentStock) : (Number(existing.currentStock) || 0);
    final.costPrice = typeof updateSet.costPrice !== 'undefined' ? Number(updateSet.costPrice) : (Number(existing.costPrice) || 0);
    final.sellingPrice = typeof updateSet.sellingPrice !== 'undefined' ? Number(updateSet.sellingPrice) : (Number(existing.sellingPrice) || 0);
    final.stockValue = final.currentStock * final.costPrice;
    final.projectedProfit = final.currentStock * (final.sellingPrice - final.costPrice);
    final.date = dateObj ? dateObj : new Date();

    const updated = await Stock.findByIdAndUpdate(id, { $set: {
      currentStock: final.currentStock,
      costPrice: final.costPrice,
      sellingPrice: final.sellingPrice,
      stockValue: final.stockValue,
      projectedProfit: final.projectedProfit,
      orderQuantity: final.orderQuantity,
      date: final.date
    } }, { new: true, runValidators: true });

    return res.status(200).json({ success: true, message: 'Stock item updated', data: { item: updated } });
  } catch (error) {
    console.error('Update stock item by _id error:', error && error.message);
    if (error && error.stack) console.error(error.stack);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// @desc    Create stock item (removed) - return 405 to indicate unsupported
// @route   POST /api/stock
// @access  Private
const createStockItem = async (req, res) => {
  try {
    const body = req.body || {};
    const itemName = body.itemName && String(body.itemName).trim();
    const itemId = body.itemId && String(body.itemId).trim();
    if (!itemName || !itemId) return res.status(400).json({ success: false, message: 'itemName and itemId are required' });

    // Parse numeric fields with defaults to 0
    const orderQuantity = typeof body.orderQuantity !== 'undefined' ? Number(body.orderQuantity) : 0;
    const costPrice = typeof body.costPrice !== 'undefined' ? Number(body.costPrice) : 0;
    const sellingPrice = typeof body.sellingPrice !== 'undefined' ? Number(body.sellingPrice) : 0;
    const currentStock = typeof body.currentStock !== 'undefined' ? Number(body.currentStock) : 0;

    const stockValue = currentStock * costPrice;
    const projectedProfit = currentStock * (sellingPrice - costPrice);

    const newStock = new Stock({
      itemName,
      itemId,
      orderQuantity,
      costPrice,
      sellingPrice,
      currentStock,
      stockValue,
      projectedProfit,
      date: body.date ? new Date(body.date) : new Date()
    });

    const saved = await newStock.save();
    return res.status(201).json({ success: true, data: { item: saved } });
  } catch (error) {
    // Handle duplicate key error for unique itemId/itemName
    if (error && error.code === 11000) {
      const dupField = Object.keys(error.keyValue || {}).join(', ');
      return res.status(409).json({ success: false, message: `Duplicate key: ${dupField}` });
    }
    console.error('Create stock item error:', error && error.message);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// @desc Get all stock items (simple)
// @route GET /api/stock
const getAllStock = async (req, res) => {
  try {
    // Support optional filtering by query params (itemName or itemId)
    const { itemName, itemId, page = 1, limit = 1000 } = req.query;
    const filter = {};
    if (itemName) {
      // Exact or case-insensitive match for itemName
      filter.itemName = { $regex: `^${itemName}$`, $options: 'i' };
    }
    if (itemId) {
      filter.itemId = itemId;
    }
    const skip = (Number(page) - 1) * Number(limit);
    const items = await Stock.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit));
    res.json({ success: true, data: { items } });
  } catch (error) {
    console.error('Get all stock error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// @desc Get stock by _id or itemId
// @route GET /api/stock/:id
const getStockById = async (req, res) => {
  try {
    const id = req.params.id;
    let item = null;
    // Use lean() to get a plain object and avoid populate/runtime issues
    if (id && id.match(/^[0-9a-fA-F]{24}$/)) {
      item = await Stock.findById(id).lean().exec();
      console.log('getStockById: looked up by _id:', id, 'found:', !!item);
    }
    if (!item) {
      item = await Stock.findOne({ itemId: id }).lean().exec();
      console.log('getStockById: looked up by itemId:', id, 'found:', !!item);
    }
    if (!item) return res.status(404).json({ success: false, message: 'Stock item not found' });

    // We intentionally do not link supplierId on the stock document; return the plain item
    return res.json({ success: true, data: { item } });
  } catch (error) {
    console.error('Get stock by id error:', error && error.message);
    if (error && error.stack) console.error(error.stack);
    const resp = { success: false, message: 'Internal server error' };
    if (process.env.NODE_ENV !== 'production' && error && error.message) resp.error = error.message;
    return res.status(500).json(resp);
  }
};

// Update by itemId
const updateStockItemByItemId = async (req, res) => {
  try {
    const itemId = req.params.itemId;
    const updateFields = { ...req.body };
    delete updateFields._id;
    const allowedFields = ['itemName','costPrice','sellingPrice','currentStock','stockValue','projectedProfit','orderQuantity','date'];
    Object.keys(updateFields).forEach(key => { if (!allowedFields.includes(key)) delete updateFields[key]; });
    const updated = await Stock.findOneAndUpdate({ itemId }, { $set: updateFields }, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ success: false, message: 'Item not found' });
    res.json({ success: true, data: { item: updated } });
  } catch (error) {
    console.error('Update by itemId error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

  //   const item = new Stock({
  //     itemName,
  //     itemId,
  //     description,
  //     currentStock: parseInt(quantity) || 0,
  //     avgCostPrice: parseFloat(costPrice) || 0,
  //     avgSellingPrice: parseFloat(sellingPrice) || 0,
  //     totalPurchased: parseInt(quantity) || 0,
  //     attachments
  //   });

  // await item.save();

  //   // Refresh item to ensure calculated fields are included
  // const savedItem = await Stock.findById(item._id);

  // console.log('📊 Created stock item with calculated fields:');
  //   console.log('📦 Current Stock:', savedItem.currentStock);
  //   console.log('💰 Avg Cost Price:', savedItem.avgCostPrice);
  //   console.log('💵 Avg Selling Price:', savedItem.avgSellingPrice);
  //   console.log('📈 Total Purchased:', savedItem.totalPurchased);
  //   console.log('📊 Total Stock Value:', savedItem.totalStockValue);
  //   console.log('📈 Projected Profit:', savedItem.projectedProfit);
  //   console.log('🕒 Last Stock Update:', savedItem.lastStockUpdate);

  //   res.status(201).json({
  //     success: true,
  //     message: 'Stock item created successfully',
  //     data: { item: savedItem }
  //   });

    

// @desc    Update inventory item
// @route   PUT /api/stock/:id
// @access  Private (Admin/Manager only)
const updateInventoryItem = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const item = await Inventory.findOne({ itemId: req.params.id });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }


    const {
      itemName,
      description,
      currentStock
    } = req.body;

    // Build update object
    const updateFields = {
      itemName: itemName || item.itemName,
      description: description || item.description
    };
    if (currentStock !== undefined) {
      // Explicitly cast to number and log
      const parsedStock = Number(currentStock);
      console.log(`[Inventory Update] Received currentStock:`, currentStock, 'Parsed:', parsedStock);
      if (!isNaN(parsedStock)) {
        updateFields.currentStock = parsedStock;
      } else {
        console.warn(`[Inventory Update] Invalid currentStock value received:`, currentStock);
      }
    }

    // Update item
    const updatedItem = await Inventory.findOneAndUpdate(
      { itemId: req.params.id },
      updateFields,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Inventory item updated successfully',
      data: { item: updatedItem }
    });

  } catch (error) {
    console.error('Update inventory item error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// @desc    Delete stock item
// @route   DELETE /api/stock/:id
// @access  Private (Admin only)
const deleteStockItem = async (req, res) => {
  try {
    const itemId = req.params.id;
    // Find and delete by itemId field
    const deletedItem = await Stock.findOneAndDelete({ itemId });
    if (!deletedItem) {
      return res.status(404).json({ success: false, message: "Item not found" });
    }
    res.json({ success: true, message: "Item deleted", data: deletedItem });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// @desc    Update stock level
// @route   PATCH /api/stock/:id/stock
// @access  Private
const updateStock = async (req, res) => {
  try {
    const { quantity, action, notes, costPrice, sellingPrice } = req.body;

    if (!quantity || !action) {
      return res.status(400).json({
        success: false,
        message: 'Quantity and action are required'
      });
    }

    if (!['add', 'subtract'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Action must be either "add" or "subtract"'
      });
    }

    const item = await Inventory.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }

    const previousStock = item.currentStock;

    // Use the enhanced updateStock method
    const newStock = await item.updateStock(
      parseInt(quantity), 
      action, 
      action === 'add' ? parseFloat(costPrice) : null, 
      action === 'add' ? parseFloat(sellingPrice) : null
    );

    // Refresh the item from database to get all calculated fields
    await item.populate([]);
    const updatedItem = await item.constructor.findById(item._id);

    if (action === 'subtract' && newStock === 0 && item.currentStock > 0 && parseInt(quantity) > item.currentStock) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient stock available'
      });
    }

    console.log('📊 Updated inventory item fields:');
    console.log('📦 Current Stock:', updatedItem.currentStock);
    console.log('💰 Avg Cost Price:', updatedItem.avgCostPrice);
    console.log('💵 Avg Selling Price:', updatedItem.avgSellingPrice);
    console.log('📈 Total Purchased:', updatedItem.totalPurchased);
    console.log('📊 Total Stock Value:', updatedItem.totalStockValue);
    console.log('📈 Projected Profit:', updatedItem.projectedProfit);
    console.log('🕒 Last Stock Update:', updatedItem.lastStockUpdate);

    res.json({
      success: true,
      message: `Stock ${action}ed successfully`,
      data: { 
        item: updatedItem,
        stockMovement: {
          action,
          quantity,
          previousStock,
          newStock,
          notes,
          timestamp: new Date()
        }
      }
    });

  } catch (error) {
    console.error('Update stock error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}

// @desc    Get low stock items
// @route   GET /api/stock/alerts/low-stock
// @access  Private
const getLowStockItems = async (req, res) => {
  try {
    // Treat missing reorderLevel as default threshold (5)
    // Low stock items are stored in the Stock collection (server-authoritative)
    const lowStockItems = await Stock.find({
      $expr: {
        $lte: ['$currentStock', { $ifNull: ['$reorderLevel', 5] }]
      }
    }).sort({ currentStock: 1 });

    res.json({
      success: true,
      data: {
        items: lowStockItems,
        count: lowStockItems.length
      }
    });

  } catch (error) {
    console.error('Get low stock items error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// @desc    Get inventory statistics
// @route   GET /api/stock/stats
// @access  Private
const getInventoryStats = async (req, res) => {
  try {
    const [
      totalItems,
      totalValue,
      lowStockCount,
      categoryStats,
      topSellingItems
    ] = await Promise.all([
      Inventory.countDocuments(),
      Inventory.aggregate([
        {
          $group: {
            _id: null,
            totalValue: { $sum: { $multiply: ['$currentStock', '$costPrice'] } }
          }
        }
      ]),
      Stock.countDocuments({
        $expr: {
          $lte: ['$currentStock', { $ifNull: ['$reorderLevel', 5] }]
        }
      }),
      Inventory.aggregate([
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
            totalValue: { $sum: { $multiply: ['$currentStock', '$costPrice'] } }
          }
        },
        { $sort: { count: -1 } }
      ]),
      Inventory.find({})
        .sort({ totalSales: -1 })
        .limit(5)
        .select('itemName totalSales currentStock')
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalItems,
          totalValue: totalValue[0]?.totalValue || 0,
          lowStockCount
        },
        categoryStats,
        topSellingItems
      }
    });

  } catch (error) {
    console.error('Get inventory stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// @desc    Get available item categories
// @route   GET /api/stock/categories
// @access  Private
const getItemCategories = async (req, res) => {
  try {
    const categories = await Category.find({ type: 'item' })
      .sort({ name: 1 })
      .select('name categoryId description');

    res.json({
      success: true,
      data: { categories }
    });

  } catch (error) {
    console.error('Get item categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  createStockItem,
  getAllStock,
  getStockById,
  updateInventoryItem,
  updateStockItemByItemId,
  updateStockItemById,
  deleteStockItem,
  updateStock,
  getLowStockItems,
  getInventoryStats,
  getItemCategories
};
