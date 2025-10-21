const CreditSale = require('../models/CreditSale');
const Stock = require('../models/Stock');

const creditSalesController = {
  // Create a new credit sale
  createCreditSale: async (req, res) => {
    try {
      console.log('📝 Creating credit sale with data:', req.body);
      console.log('📎 File attached:', req.file ? req.file.originalname : 'No file');
      console.log('👤 User from token:', req.user);
      console.log('👤 User details:', req.userDetails ? { id: req.userDetails._id, email: req.userDetails.email } : 'No user details');
      
      const {
        itemName,
        itemId,
        quantitySold,
        sellingPrice,
        costPrice,
        totalAmount,
        dateSold,
        customerName,
        customerContact,
        proofOfPayment,
        notes
      } = req.body;

      // Validate required fields
      if (!itemName || !quantitySold || !sellingPrice || !customerName || !customerContact) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: itemName, quantitySold, sellingPrice, customerName, customerContact'
        });
      }

      // Calculate total amount if not provided
      const calculatedTotal = totalAmount || (sellingPrice * quantitySold);

      // Generate a transaction ID
      const transactionId = `CREDIT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Find stock item to get canonical itemId and prices
      let stockItem = null;
      if (itemId) {
        stockItem = await Stock.findOne({ itemId }).exec();
      }
      if (!stockItem && itemName) {
        stockItem = await Stock.findOne({ itemName }).exec();
      }

      if (!stockItem) {
        return res.status(400).json({
          success: false,
          message: 'Item not found in stocks'
        });
      }

      // Get cost price from stock (use provided costPrice or stock.costPrice)
      const finalCostPrice = parseFloat(costPrice) || Number(stockItem.costPrice || 0);

      // Create sale data
      const creditSaleData = {
        transactionId,
        itemName,
        itemId: stockItem.itemId, // Use the actual itemId from stock
        quantitySold: parseInt(quantitySold),
        sellingPrice: parseFloat(sellingPrice),
        costPrice: parseFloat(finalCostPrice),
        totalAmount: calculatedTotal,
        dateSold: dateSold ? new Date(dateSold) : new Date(),
        customerName,
        customerContact, // Use customerContact instead of customerMobile
        soldBy: (req.user && (req.user.userId || req.user.id)) || (req.userDetails && req.userDetails._id),
        proofOfPayment: proofOfPayment || null,
        notes: notes || ''
      };

      // Handle file upload if present
      if (req.file) {
        // For now, just store the filename, later we can implement proper file storage
        creditSaleData.proofOfPayment = req.file.originalname;
        console.log('📎 File uploaded:', req.file.originalname);
      }

      // Create the credit sale
      const creditSale = new CreditSale(creditSaleData);
      await creditSale.save();

      // Atomically decrement stock.currentStock to avoid races
      try {
        console.log(`📦 Attempting atomic decrement for stock ${stockItem._id}: subtract ${parseInt(quantitySold)}`);
        const updated = await Stock.findOneAndUpdate(
          { _id: stockItem._id, currentStock: { $gte: parseInt(quantitySold) } },
          { $inc: { currentStock: -parseInt(quantitySold) } },
          { new: true }
        ).exec();
        if (!updated) {
          console.warn('❌ Could not decrement stock (insufficient stock or concurrent update)');
        } else {
          // Recalculate derived fields
          try {
            const cost = Number(updated.costPrice || 0);
            const sell = Number(updated.sellingPrice || 0);
            updated.stockValue = Number(updated.currentStock || 0) * cost;
            updated.projectedProfit = Number(updated.currentStock || 0) * (sell - cost);
            await updated.save();
            console.log(`📦 Stock updated for ${updated.itemName}: currentStock=${updated.currentStock}`);
          } catch (innerErr) {
            console.warn('Could not update derived stock fields for credit sale:', innerErr && innerErr.message);
          }
        }
      } catch (invError) {
        console.error('❌ Stock update failed:', invError && invError.message);
      }

      console.log('✅ Credit sale created successfully:', creditSale._id);

      res.status(201).json({
        success: true,
        message: 'Credit sale recorded successfully',
        data: creditSale
      });

    } catch (error) {
      console.error('❌ Error creating credit sale:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create credit sale',
        error: error.message
      });
    }
  },

  // Get all credit sales with filtering and pagination
  getAllCreditSales: async (req, res) => {
    try {
      console.log('📋 Fetching credit sales with filters:', req.query);
      
      const {
        page = 1,
        limit = 10,
        isPaid,
        customerName,
        itemName,
        dateFrom,
        dateTo,
        soldBy
      } = req.query;

      // Build filter object
      const filter = {};

      if (isPaid !== undefined) {
        filter.isPaid = isPaid === 'true';
      }

      if (customerName) {
        filter.customerName = { $regex: customerName, $options: 'i' };
      }

      if (itemName) {
        filter.itemName = { $regex: itemName, $options: 'i' };
      }

      if (soldBy) {
        filter.soldBy = soldBy;
      }

      // Date filtering
      if (dateFrom || dateTo) {
        filter.dateSold = {};
        if (dateFrom) filter.dateSold.$gte = new Date(dateFrom);
        if (dateTo) filter.dateSold.$lte = new Date(dateTo);
      }

      // Calculate pagination
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const skip = (pageNum - 1) * limitNum;

      // Execute query with pagination
      const [creditSales, totalCount] = await Promise.all([
        CreditSale.find(filter)
          .populate('soldBy', 'firstName lastName email')
          .populate('attachment')
          .sort({ dateSold: -1 })
          .skip(skip)
          .limit(limitNum),
        CreditSale.countDocuments(filter)
      ]);

      console.log(`✅ Found ${creditSales.length} credit sales (${totalCount} total)`);

      // For existing credit sales that don't have costPrice, populate it from Stock
      for (let sale of creditSales) {
        if (!sale.costPrice || sale.costPrice === 0) {
          try {
            const stockItem = await Stock.findOne({ itemId: sale.itemId }).exec();
            if (stockItem && (stockItem.costPrice || stockItem.costPrice === 0)) {
              sale.costPrice = Number(stockItem.costPrice || 0);
              // Optionally save to database to avoid future lookups
              // await sale.save();
            }
          } catch (err) {
            console.warn(`Could not populate cost price for credit sale ${sale._id}:`, err.message);
          }
        }
        // Attach related attachments (by entityId OR by transactionId) so clients see attachments on reload
        try {
          const Attachment = require('../models/Attachment');
          const attachments = await Attachment.find({
            $and: [
              { isActive: true },
              { entityType: 'sales' },
              { $or: [ { entityId: sale._id }, { transactionId: sale.transactionId } ] }
            ]
          }).lean().exec();

          const base = req && req.protocol && req.get ? `${req.protocol}://${req.get('host')}` : '';
          sale.attachments = attachments.map(a => ({
            _id: a._id,
            originalName: a.originalName,
            mimeType: a.mimeType,
            size: a.fileSize || a.size || 0,
            downloadUrl: base ? `${base}/api/attachments/download/${a._id}` : `/api/attachments/download/${a._id}`
          }));
        } catch (attErr) {
          console.warn('Could not fetch attachments for credit sale', sale._id, attErr && attErr.message);
          sale.attachments = sale.attachments || [];
        }
      }

      res.json({
        success: true,
        message: 'Credit sales retrieved successfully',
        data: {
          creditSales,
          pagination: {
            currentPage: pageNum,
            totalPages: Math.ceil(totalCount / limitNum),
            totalRecords: totalCount,
            hasNext: pageNum < Math.ceil(totalCount / limitNum),
            hasPrev: pageNum > 1
          }
        }
      });

    } catch (error) {
      console.error('❌ Error fetching credit sales:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch credit sales',
        error: error.message
      });
    }
  },

  // Get credit sale by ID
  getCreditSaleById: async (req, res) => {
    try {
      const { id } = req.params;
      
      const creditSale = await CreditSale.findById(id)
        .populate('soldBy', 'firstName lastName email')
        .populate('attachment');

      if (!creditSale) {
        return res.status(404).json({
          success: false,
          message: 'Credit sale not found'
        });
      }

      // Also include related attachments
      try {
        const Attachment = require('../models/Attachment');
        const attachments = await Attachment.find({
          $and: [
            { isActive: true },
            { entityType: 'sales' },
            { $or: [ { entityId: creditSale._id }, { transactionId: creditSale.transactionId } ] }
          ]
        }).lean().exec();

        const base = req && req.protocol && req.get ? `${req.protocol}://${req.get('host')}` : '';
        creditSale._doc = creditSale._doc || creditSale.toObject();
        creditSale._doc.attachments = attachments.map(a => ({
          _id: a._id,
          originalName: a.originalName,
          mimeType: a.mimeType,
          size: a.fileSize || a.size || 0,
          downloadUrl: base ? `${base}/api/attachments/download/${a._id}` : `/api/attachments/download/${a._id}`
        }));
      } catch (attErr) {
        console.warn('Could not fetch attachments for credit sale', id, attErr && attErr.message);
      }

      res.json({
        success: true,
        message: 'Credit sale retrieved successfully',
        data: creditSale
      });

    } catch (error) {
      console.error('❌ Error fetching credit sale:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch credit sale',
        error: error.message
      });
    }
  },

  // Mark credit sale as paid
  markAsPaid: async (req, res) => {
    try {
      const { id } = req.params;
      const { paymentMethod, datePaid, notes } = req.body;

      if (!paymentMethod) {
        return res.status(400).json({
          success: false,
          message: 'Payment method is required'
        });
      }

      const creditSale = await CreditSale.findById(id);
      
      if (!creditSale) {
        return res.status(404).json({
          success: false,
          message: 'Credit sale not found'
        });
      }

      if (creditSale.isPaid) {
        return res.status(400).json({
          success: false,
          message: 'Credit sale is already marked as paid'
        });
      }

      // Mark as paid
      await creditSale.markAsPaid(paymentMethod, datePaid ? new Date(datePaid) : new Date());

      if (notes) {
        creditSale.notes = notes;
        await creditSale.save();
      }

      // Create a canonical Sale record for the paid credit (persist as cash sale)
      try {
        const Sale = require('../models/Sale');
        const Stock = require('../models/Stock');

        const parsedQty = Number(creditSale.quantitySold || 0);
        const parsedSelling = Number(creditSale.sellingPrice || 0);
        const parsedCost = Number(creditSale.costPrice || 0);

        // Lookup stock by itemId
        let stockDoc = await Stock.findOne({ itemId: creditSale.itemId }).exec();

        const saleData = {
          transactionId: `TXN-PAID-${Date.now()}-${Math.random().toString(36).substr(2,6)}`,
          itemName: creditSale.itemName,
          itemId: creditSale.itemId,
          sellingPrice: parsedSelling,
          costPrice: parsedCost,
          quantitySold: parsedQty,
          totalAmount: parsedSelling * parsedQty,
          paymentMode: paymentMethod || 'Cash',
          customer: creditSale.customerName || 'Credit Customer',
          customerMobile: creditSale.customerContact || '',
          dateSold: datePaid ? new Date(datePaid) : new Date(),
          isPaid: true,
          paymentDate: datePaid ? new Date(datePaid) : new Date(),
          proofOfPayment: creditSale.proofOfPayment || null,
          cashier: (req.user && (req.user.userId || req.user.id)) || (req.userDetails && req.userDetails._id),
          stockId: stockDoc ? stockDoc._id : undefined
        };

        const sale = new Sale(saleData);
        await sale.save();

        // Atomically decrement stock if stock exists
        if (stockDoc) {
          const updatedStock = await Stock.findOneAndUpdate(
            { _id: stockDoc._id, currentStock: { $gte: parsedQty } },
            { $inc: { currentStock: -parsedQty } },
            { new: true }
          ).exec();

          if (updatedStock) {
            try {
              const cost = Number(updatedStock.costPrice || 0);
              const sell = Number(updatedStock.sellingPrice || 0);
              updatedStock.stockValue = Number(updatedStock.currentStock || 0) * cost;
              updatedStock.projectedProfit = Number(updatedStock.currentStock || 0) * (sell - cost);
              await updatedStock.save();
            } catch (innerErr) {
              console.warn('Could not update derived stock fields after marking credit paid:', innerErr && innerErr.message);
            }
          } else {
            // If stock decrement failed (concurrent), rollback sale to keep consistency
            await Sale.findByIdAndDelete(sale._id).catch(() => {});
            // Also revert creditSale.isPaid to false to reflect failure
            creditSale.isPaid = false;
            await creditSale.save().catch(() => {});
            return res.status(409).json({ success: false, message: 'Insufficient stock to finalize payment. Operation aborted.' });
          }
        }

        // Link attachments by transactionId
        try {
          const Attachment = require('../models/Attachment');
          const tx = creditSale.transactionId;
          if (tx) {
            await Attachment.updateMany({ transactionId: tx, entityType: 'sales' }, { $set: { entityId: sale._id } }).exec();
          }
        } catch (attErr) {
          console.warn('Failed to link attachments for paid credit sale:', attErr && attErr.message);
        }

        console.log(`✅ Credit sale ${id} marked as paid and Sale ${sale._id} created`);

        return res.json({
          success: true,
          message: 'Credit sale marked as paid and Sale created successfully',
          data: { creditSale, sale }
        });

      } catch (err) {
        console.error('Error creating Sale for paid credit:', err);
        // Return the creditSale result (it is marked as paid) but warn client
        return res.json({ success: true, message: 'Credit sale marked as paid, but failed to create Sale record', data: { creditSale } });
      }

    } catch (error) {
      console.error('❌ Error marking credit sale as paid:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark credit sale as paid',
        error: error.message
      });
    }
  },

  // Update credit sale
  updateCreditSale: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const creditSale = await CreditSale.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );

      if (!creditSale) {
        return res.status(404).json({
          success: false,
          message: 'Credit sale not found'
        });
      }

      console.log(`✅ Credit sale ${id} updated successfully`);

      res.json({
        success: true,
        message: 'Credit sale updated successfully',
        data: creditSale
      });

    } catch (error) {
      console.error('❌ Error updating credit sale:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update credit sale',
        error: error.message
      });
    }
  },

  // Delete credit sale
  deleteCreditSale: async (req, res) => {
    try {
      const { id } = req.params;
      
      const creditSale = await CreditSale.findByIdAndDelete(id);

      if (!creditSale) {
        return res.status(404).json({
          success: false,
          message: 'Credit sale not found'
        });
      }

      console.log(`✅ Credit sale ${id} deleted successfully`);

      res.json({
        success: true,
        message: 'Credit sale deleted successfully'
      });

    } catch (error) {
      console.error('❌ Error deleting credit sale:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete credit sale',
        error: error.message
      });
    }
  },

  // Get credit sales statistics
  getCreditSalesStats: async (req, res) => {
    try {
      const { dateFrom, dateTo } = req.query;

      // Build date filter
      let dateFilter = {};
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
        totalCreditSales,
        paidCreditSales,
        unpaidCreditSales,
        totalCreditAmount,
        paidCreditAmount,
        unpaidCreditAmount,
        topCustomers
      ] = await Promise.all([
        CreditSale.countDocuments(dateFilter),
        CreditSale.countDocuments({ ...dateFilter, isPaid: true }),
        CreditSale.countDocuments({ ...dateFilter, isPaid: false }),
        
        CreditSale.aggregate([
          { $match: dateFilter },
          { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]),
        
        CreditSale.aggregate([
          { $match: { ...dateFilter, isPaid: true } },
          { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]),
        
        CreditSale.aggregate([
          { $match: { ...dateFilter, isPaid: false } },
          { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]),
        
        CreditSale.aggregate([
          { $match: dateFilter },
          {
            $group: {
              _id: '$customerName',
              totalPurchases: { $sum: '$totalAmount' },
              transactionCount: { $sum: 1 },
              unpaidAmount: {
                $sum: { $cond: [{ $eq: ['$isPaid', false] }, '$totalAmount', 0] }
              }
            }
          },
          { $sort: { totalPurchases: -1 } },
          { $limit: 10 }
        ])
      ]);

      res.json({
        success: true,
        message: 'Credit sales statistics retrieved successfully',
        data: {
          summary: {
            totalCreditSales,
            paidCreditSales,
            unpaidCreditSales,
            totalCreditAmount: totalCreditAmount[0]?.total || 0,
            paidCreditAmount: paidCreditAmount[0]?.total || 0,
            unpaidCreditAmount: unpaidCreditAmount[0]?.total || 0
          },
          topCustomers
        }
      });

    } catch (error) {
      console.error('❌ Error fetching credit sales statistics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch credit sales statistics',
        error: error.message
      });
    }
  }
};

module.exports = creditSalesController;