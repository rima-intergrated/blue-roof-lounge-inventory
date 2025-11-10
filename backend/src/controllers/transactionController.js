const Transaction = require('../models/Transaction');
const { validationResult } = require('express-validator');

// Get all transactions with pagination, filtering, and search
const getTransactions = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      type,
      status,
      dateFrom,
      dateTo,
      sortBy = 'timestamp',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};

    // Add type filter
    if (type) {
      filter.type = type;
    }

    // Add status filter
    if (status) {
      filter.status = status;
    }

    // Add date range filter
    if (dateFrom || dateTo) {
      filter.timestamp = {};
      if (dateFrom) {
        filter.timestamp.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        filter.timestamp.$lte = new Date(dateTo);
      }
    }

    // Add search filter (transaction ID or item names)
    if (search) {
      filter.$or = [
        { transactionId: { $regex: search, $options: 'i' } },
        { 'items.itemName': { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query
    const [transactions, totalCount] = await Promise.all([
      Transaction.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .populate('userId', 'username email')
        .lean(),
      Transaction.countDocuments(filter)
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / parseInt(limit));
    const hasNextPage = parseInt(page) < totalPages;
    const hasPrevPage = parseInt(page) > 1;

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalCount,
          hasNextPage,
          hasPrevPage,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transactions',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get single transaction by ID
const getTransactionById = async (req, res) => {
  try {
    const { id } = req.params;

    const transaction = await Transaction.findById(id)
      .populate('userId', 'username email')
      .lean();

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    res.json({
      success: true,
      data: transaction
    });
  } catch (error) {
    console.error('Error fetching transaction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transaction',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Create new transaction
const createTransaction = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      type = 'inventory_add',
      status = 'completed',
      items = [],
      dateOrdered,
      notes,
      stockIds = [],
      attachments = []
    } = req.body;

    // Add user information if authenticated
    let userId = null;
    let username = null;
    if (req.user) {
      userId = req.user._id;
      username = req.user.username;
    }

    // Create transaction
    const transaction = new Transaction({
      type,
      status,
      items,
      dateOrdered: dateOrdered ? new Date(dateOrdered) : undefined,
      notes,
      userId,
      username,
      stockIds,
      attachments
    });

    await transaction.save();

    // Populate user data for response
    await transaction.populate('userId', 'username email');

    res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      data: transaction
    });
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create transaction',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update transaction
const updateTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Don't allow updating these fields
    delete updates._id;
    delete updates.transactionId;
    delete updates.createdAt;
    delete updates.updatedAt;

    const transaction = await Transaction.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).populate('userId', 'username email');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    res.json({
      success: true,
      message: 'Transaction updated successfully',
      data: transaction
    });
  } catch (error) {
    console.error('Error updating transaction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update transaction',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete transaction
const deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;

    const transaction = await Transaction.findByIdAndDelete(id);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    res.json({
      success: true,
      message: 'Transaction deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete transaction',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete multiple transactions
const deleteMultipleTransactions = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide valid transaction IDs'
      });
    }

    const result = await Transaction.deleteMany({ _id: { $in: ids } });

    res.json({
      success: true,
      message: `${result.deletedCount} transaction(s) deleted successfully`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error deleting transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete transactions',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get transaction statistics
const getTransactionStats = async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;

    // Build filter for date range
    const filter = {};
    if (dateFrom || dateTo) {
      filter.timestamp = {};
      if (dateFrom) {
        filter.timestamp.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        filter.timestamp.$lte = new Date(dateTo);
      }
    }

    // Aggregate statistics
    const [
      totalTransactions,
      totalValue,
      totalItems,
      typeBreakdown,
      recentTransactions
    ] = await Promise.all([
      Transaction.countDocuments(filter),
      Transaction.aggregate([
        { $match: filter },
        { $group: { _id: null, total: { $sum: '$totalValue' } } }
      ]),
      Transaction.aggregate([
        { $match: filter },
        { $group: { _id: null, total: { $sum: '$totalItems' } } }
      ]),
      Transaction.aggregate([
        { $match: filter },
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 },
            totalValue: { $sum: '$totalValue' }
          }
        }
      ]),
      Transaction.find(filter)
        .sort({ timestamp: -1 })
        .limit(5)
        .select('transactionId totalValue totalItems timestamp type')
        .lean()
    ]);

    res.json({
      success: true,
      data: {
        totalTransactions,
        totalValue: totalValue[0]?.total || 0,
        totalItems: totalItems[0]?.total || 0,
        typeBreakdown,
        recentTransactions
      }
    });
  } catch (error) {
    console.error('Error fetching transaction stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transaction statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  deleteMultipleTransactions,
  getTransactionStats
};