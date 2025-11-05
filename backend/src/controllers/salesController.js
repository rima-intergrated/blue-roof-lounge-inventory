const { validationResult } = require('express-validator');
const Sale = require('../models/Sale');
const Stock = require('../models/Stock');
const Customer = require('../models/Customer');

// @desc    Get all sales
// @route   GET /api/sales
// @access  Private
const getAllSales = async (req, res) => {
  try {
    console.log('📋 GET /api/sales called with query:', req.query);
    
    const {
      page = 1,
      limit = 10,
      paymentMode,
      isPaid,
      dateFrom,
      dateTo,
      search,
      sortBy = 'dateSold',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (paymentMode) {
      console.log('💰 PaymentMode filter:', paymentMode, 'Type:', typeof paymentMode);
      // Handle array of payment modes (for Cash + Mobile Transfer queries)
      if (Array.isArray(paymentMode)) {
        filter.paymentMode = { $in: paymentMode };
        console.log('📋 Using array filter:', filter.paymentMode);
      } else {
        filter.paymentMode = paymentMode;
        console.log('📋 Using single filter:', filter.paymentMode);
      }
    }
    if (isPaid !== undefined) filter.isPaid = isPaid === 'true';
    
    // Date range filter
    if (dateFrom || dateTo) {
      filter.dateSold = {};
      if (dateFrom) filter.dateSold.$gte = new Date(dateFrom);
      if (dateTo) filter.dateSold.$lte = new Date(dateTo);
    }
    
    if (search) {
      filter.$or = [
        { transactionId: { $regex: search, $options: 'i' } },
        { itemName: { $regex: search, $options: 'i' } },
        { customer: { $regex: search, $options: 'i' } },
        { customerMobile: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    // Execute query
    console.log('🔍 Final filter object:', JSON.stringify(filter, null, 2));
    const [sales, total] = await Promise.all([
      Sale.find(filter)
        .populate('cashier', 'username email')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      Sale.countDocuments(filter)
    ]);

    console.log(`📊 Found ${sales.length} sales matching filter`);
    console.log('📊 Sales payment modes:', sales.map(s => s.paymentMode));

    res.json({
      success: true,
      message: 'Sales retrieved successfully',
      data: {
        sales,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          itemsPerPage: parseInt(limit),
          hasNextPage: parseInt(page) < Math.ceil(total / parseInt(limit)),
          hasPrevPage: parseInt(page) > 1
        }
      }
    });

  } catch (error) {
    console.error('Get all sales error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get sale by ID
// @route   GET /api/sales/:id
// @access  Private
const getSaleById = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id)
      .populate('cashier', 'username email');

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Sale not found'
      });
    }

    res.json({
      success: true,
      message: 'Sale retrieved successfully',
      data: { sale }
    });

  } catch (error) {
    console.error('Get sale by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// @desc    Create new sale
// @route   POST /api/sales
// @access  Private
const createSale = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('Validation failed:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      itemName,
      itemId,
      sellingPrice,
      costPrice,
      quantitySold,
      paymentMode,
      customer,
      customerMobile,
      notes,
      discount = 0,
      tax = 0,
      dateSold,
      transactionId
    } = req.body;

    // Generate transactionId if not provided
    const finalTransactionId = transactionId || `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Coerce numeric/date fields safely
    const parsedQty = typeof quantitySold === 'string' ? parseInt(quantitySold, 10) : quantitySold;
    const parsedPrice = typeof sellingPrice === 'string' ? parseFloat(sellingPrice) : sellingPrice;
    const parsedCostPrice = typeof costPrice === 'string' ? parseFloat(costPrice) : (costPrice || 0);
    const parsedDiscount = typeof discount === 'string' ? parseFloat(discount) : discount;
    const parsedTax = typeof tax === 'string' ? parseFloat(tax) : tax;
    const parsedDateSold = dateSold ? new Date(dateSold) : undefined;

    // Option 1 enforcement: do not allow creating credit sales via /api/sales.
    // Clients should use the dedicated /api/credit-sales endpoint for credit transactions.
    if (paymentMode === 'Credit') {
      console.warn('Attempt to create credit sale via /api/sales blocked.');
      return res.status(400).json({
        success: false,
        message: "Credit sales must be created via the /api/credit-sales endpoint. Please POST to /api/credit-sales instead."
      });
    }

    // Resolve stock document - prefer stockId (Mongo _id) when provided
    let stockDoc = null;
    if (req.body.stockId && String(req.body.stockId).match(/^[0-9a-fA-F]{24}$/)) {
      stockDoc = await Stock.findById(req.body.stockId).exec();
    }
    // Fallback: try itemId or itemName against stocks
    if (!stockDoc && itemId) {
      stockDoc = await Stock.findOne({ itemId }).exec();
    }
    if (!stockDoc && itemName) {
      stockDoc = await Stock.findOne({ itemName }).exec();
    }

    if (!stockDoc) {
      console.error('Item not found in stocks:', req.body.stockId || itemId || itemName);
      return res.status(400).json({ success: false, message: 'Item not found in stocks' });
    }

    // Ensure currentStock is a number
    const availableQty = typeof stockDoc.currentStock === 'number' ? stockDoc.currentStock : (Number(stockDoc.currentStock) || 0);
    if (availableQty < parsedQty) {
      console.error(`Insufficient stock for item ${stockDoc._id}. Requested: ${parsedQty}, Available: ${availableQty}`);
      return res.status(400).json({ success: false, message: `Insufficient stock. Available: ${availableQty}` });
    }

    // Validate customer mobile for credit sales and find/create customer record
    let customerRecord = null;
    if (paymentMode === 'Credit') {
      if (!customerMobile) {
        console.error('Customer mobile number is required for credit sales.');
        return res.status(400).json({ success: false, message: 'Customer mobile number is required for credit sales' });
      }
      customerRecord = await Customer.findOne({ mobile: customerMobile }).exec();
      if (!customerRecord) {
        try {
          customerRecord = new Customer({ name: customer || '', mobile: customerMobile });
          await customerRecord.save();
        } catch (custErr) {
          console.warn('Could not create customer record:', custErr && custErr.message);
        }
      }
    }

    // Calculate total amount
    const totalAmount = (parsedPrice * parsedQty) - parsedDiscount + parsedTax;

    // Create sale using stock canonical values where possible
    const sale = new Sale({
      transactionId: finalTransactionId,
      itemName: stockDoc.itemName || itemName,
      itemId: stockDoc.itemId || itemId || '',
      sellingPrice: parsedPrice,
      costPrice: typeof parsedCostPrice === 'number' && parsedCostPrice > 0 ? parsedCostPrice : (stockDoc.costPrice || 0),
      quantitySold: parsedQty,
      totalAmount,
      paymentMode,
      customer: customer || (customerRecord ? customerRecord.name : 'Walk-in'),
      customerMobile: customerMobile || (customerRecord ? customerRecord.mobile : ''),
      cashier: (req.user && (req.user.userId || req.user.id)) || (req.userDetails && req.userDetails._id),
      notes,
      discount: parsedDiscount,
      tax: parsedTax,
      ...(parsedDateSold ? { dateSold: parsedDateSold } : {}),
      stockId: stockDoc._id
    });

    // Save sale first
    try {
      await sale.save();
    } catch (err) {
      console.error('Error saving sale:', err, 'Sale data:', sale);
      throw err;
    }

    // Atomically decrement stock currentStock using conditional update to avoid races
    try {
      const updatedStock = await Stock.findOneAndUpdate(
        { _id: stockDoc._id, currentStock: { $gte: parsedQty } },
        { $inc: { currentStock: -parsedQty } },
        { new: true }
      ).exec();
      if (!updatedStock) {
        // Rollback: remove the sale we just created to maintain consistency
        await Sale.findByIdAndDelete(sale._id).catch(() => {});
        return res.status(409).json({ success: false, message: 'Insufficient stock (concurrent update). Sale aborted.' });
      }

      // Recalculate derived fields on stock (stockValue, projectedProfit) if needed
      try {
        const cost = Number(updatedStock.costPrice || 0);
        const sell = Number(updatedStock.sellingPrice || 0);
        updatedStock.stockValue = Number(updatedStock.currentStock || 0) * cost;
        updatedStock.projectedProfit = Number(updatedStock.currentStock || 0) * (sell - cost);
        await updatedStock.save();
      } catch (derivedErr) {
        console.warn('Could not update derived stock fields:', derivedErr && derivedErr.message);
      }

    } catch (err) {
      console.error('Error updating stock after sale:', err);
      // Attempt rollback of sale
      await Sale.findByIdAndDelete(sale._id).catch(() => {});
      throw err;
    }

    // Link attachments uploaded with transactionId to this sale (use entityType 'sales')
    try {
      const Attachment = require('../models/Attachment');
      const tx = finalTransactionId;
      if (tx) {
        await Attachment.updateMany({ transactionId: tx, entityType: 'sales' }, { $set: { entityId: sale._id } }).exec();
      }
    } catch (attErr) {
      console.warn('Failed to link attachments after sale creation:', attErr && attErr.message);
    }

    // Populate cashier data for response
    await sale.populate('cashier', 'username email');

    res.status(201).json({
      success: true,
      message: 'Sale recorded successfully',
      data: { sale }
    });

  } catch (error) {
    console.error('Create sale error:', error, 'Request body:', req.body);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
      requestBody: req.body
    });
  }
};

// @desc    Update sale
// @route   PUT /api/sales/:id
// @access  Private
const updateSale = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const sale = await Sale.findById(req.params.id);
    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Sale not found'
      });
    }

    const { customer, customerMobile, notes } = req.body;

    // Update only allowed fields
    sale.customer = customer || sale.customer;
    sale.customerMobile = customerMobile || sale.customerMobile;
    sale.notes = notes || sale.notes;

    await sale.save();
    await sale.populate('cashier', 'username email');

    res.json({
      success: true,
      message: 'Sale updated successfully',
      data: { sale }
    });

  } catch (error) {
    console.error('Update sale error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// @desc    Mark credit sale as paid
// @route   PUT /api/sales/:id/pay
// @access  Private
const markAsPaid = async (req, res) => {
  try {
    const { proofOfPayment } = req.body;
    
    const sale = await Sale.findById(req.params.id);
    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Sale not found'
      });
    }

    if (sale.paymentMode !== 'Credit') {
      return res.status(400).json({
        success: false,
        message: 'Only credit sales can be marked as paid'
      });
    }

    if (sale.isPaid) {
      return res.status(400).json({
        success: false,
        message: 'Sale is already marked as paid'
      });
    }

    sale.isPaid = true;
    sale.paymentDate = new Date();
    if (proofOfPayment) {
      sale.proofOfPayment = proofOfPayment;
    }

    await sale.save();
    await sale.populate('cashier', 'username email');

    res.json({
      success: true,
      message: 'Sale marked as paid successfully',
      data: { sale }
    });

  } catch (error) {
    console.error('Mark as paid error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// @desc    Get sales statistics
// @route   GET /api/sales/stats
// @access  Private
const getSalesStats = async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;
    
    // Build date filter
    const dateFilter = {};
    if (dateFrom || dateTo) {
      dateFilter.dateSold = {};
      if (dateFrom) dateFilter.dateSold.$gte = new Date(dateFrom);
      if (dateTo) dateFilter.dateSold.$lte = new Date(dateTo);
    } else {
      // Default to current month
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);
      dateFilter.dateSold = { $gte: startOfMonth, $lte: endOfMonth };
    }

    const [
      totalSales,
      cashSales,
      creditSales,
      paidCreditSales,
      unpaidCreditSales,
      totalRevenue,
      topItems,
      dailySales
    ] = await Promise.all([
      Sale.countDocuments(dateFilter),
      Sale.countDocuments({ ...dateFilter, paymentMode: 'Cash' }),
      Sale.countDocuments({ ...dateFilter, paymentMode: 'Credit' }),
      Sale.countDocuments({ ...dateFilter, paymentMode: 'Credit', isPaid: true }),
      Sale.countDocuments({ ...dateFilter, paymentMode: 'Credit', isPaid: false }),
      
      Sale.aggregate([
        { $match: dateFilter },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      
      Sale.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: '$itemName',
            totalSold: { $sum: '$quantitySold' },
            totalRevenue: { $sum: '$totalAmount' },
            count: { $sum: 1 }
          }
        },
  { $sort: { totalSold: -1 } },
        { $limit: 10 }
      ]),
      
      Sale.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$dateSold' } },
            totalSales: { $sum: 1 },
            totalRevenue: { $sum: '$totalAmount' }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);

    res.json({
      success: true,
      message: 'Sales statistics retrieved successfully',
      data: {
        summary: {
          totalSales,
          cashSales,
          creditSales,
          paidCreditSales,
          unpaidCreditSales,
          totalRevenue: totalRevenue[0]?.total || 0
        },
        topItems,
        dailySales
      }
    });

  } catch (error) {
    console.error('Get sales stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// @desc    Get overdue credit sales
// @route   GET /api/sales/overdue
// @access  Private
const getOverdueSales = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const overdueSales = await Sale.find({
      paymentMode: 'Credit',
      isPaid: false,
      dateSold: { $lt: thirtyDaysAgo }
    })
    .populate('cashier', 'username email')
    .sort({ dateSold: 1 });

    res.json({
      success: true,
      message: 'Overdue sales retrieved successfully',
      data: { overdueSales }
    });

  } catch (error) {
    console.error('Get overdue sales error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// @desc    Get sales report by date range
// @route   GET /api/sales/reports/date-range
// @access  Private
const getSalesReportByDateRange = async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    let groupFormat;
    switch (groupBy) {
      case 'hour':
        groupFormat = { $dateToString: { format: "%Y-%m-%d %H:00", date: "$dateSold" } };
        break;
      case 'day':
        groupFormat = { $dateToString: { format: "%Y-%m-%d", date: "$dateSold" } };
        break;
      case 'week':
        groupFormat = { $week: "$dateSold" };
        break;
      case 'month':
        groupFormat = { $dateToString: { format: "%Y-%m", date: "$dateSold" } };
        break;
      default:
        groupFormat = { $dateToString: { format: "%Y-%m-%d", date: "$dateSold" } };
    }

    const salesReport = await Sale.aggregate([
      {
        $match: {
          dateSold: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          }
        }
      },
      {
        $group: {
          _id: groupFormat,
          totalSales: { $sum: '$totalAmount' },
          totalTransactions: { $sum: 1 },
          totalQuantity: { $sum: '$quantitySold' },
          avgTransactionValue: { $avg: '$totalAmount' },
          cashSales: {
            $sum: {
              $cond: [{ $eq: ['$paymentMode', 'Cash'] }, '$totalAmount', 0]
            }
          },
          creditSales: {
            $sum: {
              $cond: [{ $eq: ['$paymentMode', 'Credit'] }, '$totalAmount', 0]
            }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const totalSummary = await Sale.aggregate([
      {
        $match: {
          dateSold: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
          totalTransactions: { $sum: 1 },
          totalItems: { $sum: '$quantitySold' },
          avgTransactionValue: { $avg: '$totalAmount' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        period: { startDate, endDate, groupBy },
        summary: totalSummary[0] || {},
        breakdown: salesReport
      }
    });

  } catch (error) {
    console.error('Get sales report by date range error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// @desc    Get top selling items report
// @route   GET /api/sales/reports/top-items
// @access  Private
const getTopSellingItemsReport = async (req, res) => {
  try {
    const { limit = 10, startDate, endDate } = req.query;

    const matchStage = {};
    if (startDate && endDate) {
      matchStage.dateSold = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const topItems = await Sale.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            itemName: '$itemName',
            itemId: '$itemId'
          },
          totalQuantity: { $sum: '$quantitySold' },
          totalRevenue: { $sum: '$totalAmount' },
          totalTransactions: { $sum: 1 },
          avgPrice: { $avg: '$sellingPrice' }
        }
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: parseInt(limit) },
      {
        $project: {
          itemName: '$_id.itemName',
          itemId: '$_id.itemId',
          totalQuantity: 1,
          totalRevenue: 1,
          totalTransactions: 1,
          avgPrice: { $round: ['$avgPrice', 2] },
          _id: 0
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        topSellingItems: topItems,
        period: startDate && endDate ? { startDate, endDate } : 'All time'
      }
    });

  } catch (error) {
    console.error('Get top selling items report error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// @desc    Get daily summary report
// @route   GET /api/sales/reports/daily-summary
// @access  Private
const getDailySummaryReport = async (req, res) => {
  try {
    const { date = new Date().toISOString().split('T')[0] } = req.query;
    
    const startOfDay = new Date(date);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const [dailySummary, hourlyBreakdown, topItemsToday] = await Promise.all([
      Sale.aggregate([
        {
          $match: {
            dateSold: {
              $gte: startOfDay,
              $lte: endOfDay
            }
          }
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$totalAmount' },
            totalTransactions: { $sum: 1 },
            totalItems: { $sum: '$quantitySold' },
            avgTransactionValue: { $avg: '$totalAmount' },
            cashSales: {
              $sum: {
                $cond: [{ $eq: ['$paymentMode', 'Cash'] }, '$totalAmount', 0]
              }
            },
            creditSales: {
              $sum: {
                $cond: [{ $eq: ['$paymentMode', 'Credit'] }, '$totalAmount', 0]
              }
            }
          }
        }
      ]),

      Sale.aggregate([
        {
          $match: {
            dateSold: {
              $gte: startOfDay,
              $lte: endOfDay
            }
          }
        },
        {
          $group: {
            _id: { $hour: '$dateSold' },
            totalRevenue: { $sum: '$totalAmount' },
            totalTransactions: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),

      Sale.aggregate([
        {
          $match: {
            dateSold: {
              $gte: startOfDay,
              $lte: endOfDay
            }
          }
        },
        {
          $group: {
            _id: '$itemName',
            totalQuantity: { $sum: '$quantitySold' },
            totalRevenue: { $sum: '$totalAmount' }
          }
        },
        { $sort: { totalQuantity: -1 } },
        { $limit: 5 }
      ])
    ]);

    res.json({
      success: true,
      data: {
        date,
        summary: dailySummary[0] || {},
        hourlyBreakdown,
        topItemsToday
      }
    });

  } catch (error) {
    console.error('Get daily summary report error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// @desc    Delete a sale
// @route   DELETE /api/sales/:id
// @access  Private
const deleteSale = async (req, res) => {
  try {
    console.log('🗑️ DELETE /api/sales/:id called with ID:', req.params.id);

    const sale = await Sale.findById(req.params.id);

    if (!sale) {
      console.log('❌ Sale not found');
      return res.status(404).json({
        success: false,
        message: 'Sale not found'
      });
    }

    // Log the sale being deleted for audit purposes
    console.log('📝 Deleting sale:', {
      id: sale._id,
      transactionId: sale.transactionId,
      paymentMode: sale.paymentMode,
      amount: sale.sellingPrice * sale.quantitySold,
      deletedBy: req.user?.username || req.user?.email || 'Unknown'
    });

    // If it's a cash/mobile transfer sale, we should restore stock
    if (sale.paymentMode === 'Cash' || sale.paymentMode === 'Mobile Transfer') {
      try {
        // Try to restore stock if the item still exists
        if (sale.itemId) {
          const stock = await Stock.findById(sale.itemId);
          if (stock) {
            stock.currentStock += sale.quantitySold;
            await stock.save();
            console.log(`📦 Restored ${sale.quantitySold} units to stock for item: ${stock.itemName}`);
          }
        }
      } catch (stockError) {
        console.log('⚠️ Warning: Could not restore stock:', stockError.message);
        // Don't fail the deletion if stock restoration fails
      }
    }

    await Sale.findByIdAndDelete(req.params.id);

    console.log('✅ Sale deleted successfully');
    res.json({
      success: true,
      message: 'Sale deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting sale:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  getAllSales,
  getSaleById,
  createSale,
  updateSale,
  deleteSale,
  markAsPaid,
  getSalesStats,
  getOverdueSales,
  getSalesReportByDateRange,
  getTopSellingItemsReport,
  getDailySummaryReport
};
