const { validationResult } = require('express-validator');
const Expense = require('../models/Expense');

// @desc    Get all expenses
// @route   GET /api/expenses
// @access  Private
const getAllExpenses = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      dateFrom,
      dateTo,
      search,
      sortBy = 'expenseDate',
      sortOrder = 'desc',
      isApproved
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (category) filter.category = category;
    if (isApproved !== undefined) filter.isApproved = isApproved === 'true';
    
    // Date range filter
    if (dateFrom || dateTo) {
      filter.expenseDate = {};
      if (dateFrom) filter.expenseDate.$gte = new Date(dateFrom);
      if (dateTo) filter.expenseDate.$lte = new Date(dateTo);
    }
    
    if (search) {
      filter.$or = [
        { transactionId: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { vendor: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    // Execute query
    const [expenses, total] = await Promise.all([
      Expense.find(filter)
        .populate('recordedBy', 'username email')
        .populate('approvedBy', 'username email')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      Expense.countDocuments(filter)
    ]);

    res.json({
      success: true,
      message: 'Expenses retrieved successfully',
      data: {
        expenses,
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
    console.error('Get all expenses error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get expense by ID
// @route   GET /api/expenses/:id
// @access  Private
const getExpenseById = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id)
      .populate('recordedBy', 'username email')
      .populate('approvedBy', 'username email');

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    res.json({
      success: true,
      message: 'Expense retrieved successfully',
      data: { expense }
    });

  } catch (error) {
    console.error('Get expense by ID error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid expense ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Create new expense
// @route   POST /api/expenses
// @access  Private
const createExpense = async (req, res) => {
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

    // Ensure request has authenticated user context (set by auth middleware)
    if (!req.userDetails && !req.user) {
      console.warn('Create expense attempted without authenticated user. req.userDetails:', req.userDetails, 'req.user:', req.user);
      return res.status(401).json({ success: false, message: 'Authentication required to create expense' });
    }

    const {
      category,
      description,
      amount,
      expenseDate,
      paymentMethod,
      vendor,
      receiptNumber,
      department,
      notes,
      isRecurring,
      recurringFrequency
    } = req.body;

    // Create expense
    const expense = new Expense({
      category,
      description,
      amount,
      expenseDate: expenseDate || new Date(),
      paymentMethod: paymentMethod || 'Cash',
      vendor,
      receiptNumber,
      // Use populated user details from auth middleware to reliably get DB _id
      recordedBy: req.userDetails?._id || req.user?.userId || req.user?.id,
      department: department || 'General',
      notes,
      isRecurring: isRecurring || false,
      recurringFrequency: isRecurring ? recurringFrequency : undefined
    });

    await expense.save();

    // Populate the created expense
    await expense.populate('recordedBy', 'username email');

    res.status(201).json({
      success: true,
      message: 'Expense created successfully',
      data: { expense }
    });

  } catch (error) {
    console.error('Create expense error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => ({
          field: err.path,
          message: err.message
        }))
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Expense with this transaction ID already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Update expense
// @route   PUT /api/expenses/:id
// @access  Private
const updateExpense = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    // Update allowed fields
    const allowedUpdates = [
      'category', 'description', 'amount', 'expenseDate', 
      'paymentMethod', 'vendor', 'receiptNumber', 'department', 
      'notes', 'isRecurring', 'recurringFrequency'
    ];

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        expense[field] = req.body[field];
      }
    });

    await expense.save();
    await expense.populate('recordedBy', 'username email');
    await expense.populate('approvedBy', 'username email');

    res.json({
      success: true,
      message: 'Expense updated successfully',
      data: { expense }
    });

  } catch (error) {
    console.error('Update expense error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => ({
          field: err.path,
          message: err.message
        }))
      });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid expense ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Delete expense
// @route   DELETE /api/expenses/:id
// @access  Private
const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    await expense.deleteOne();

    res.json({
      success: true,
      message: 'Expense deleted successfully'
    });

  } catch (error) {
    console.error('Delete expense error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid expense ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Approve expense
// @route   PATCH /api/expenses/:id/approve
// @access  Private
const approveExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    expense.isApproved = true;
    expense.approvedBy = req.user.id;
    await expense.save();

    await expense.populate('recordedBy', 'username email');
    await expense.populate('approvedBy', 'username email');

    res.json({
      success: true,
      message: 'Expense approved successfully',
      data: { expense }
    });

  } catch (error) {
    console.error('Approve expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get expense summary by date range
// @route   GET /api/expenses/summary/range
// @access  Private
const getExpenseSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    const expenses = await Expense.getByDateRange(startDate, endDate);
    
    const summary = expenses.reduce((acc, expense) => {
      acc.totalAmount += expense.amount;
      acc.totalCount += 1;
      
      if (acc.categories[expense.category]) {
        acc.categories[expense.category].amount += expense.amount;
        acc.categories[expense.category].count += 1;
      } else {
        acc.categories[expense.category] = {
          amount: expense.amount,
          count: 1
        };
      }
      
      return acc;
    }, {
      totalAmount: 0,
      totalCount: 0,
      categories: {}
    });

    res.json({
      success: true,
      message: 'Expense summary retrieved successfully',
      data: {
        summary,
        expenses,
        dateRange: { startDate, endDate }
      }
    });

  } catch (error) {
    console.error('Get expense summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get monthly expense summary
// @route   GET /api/expenses/summary/monthly
// @access  Private
const getMonthlySummary = async (req, res) => {
  try {
    const { year, month } = req.query;

    if (!year || !month) {
      return res.status(400).json({
        success: false,
        message: 'Year and month are required'
      });
    }

    const summary = await Expense.getMonthlySummary(parseInt(year), parseInt(month));

    res.json({
      success: true,
      message: 'Monthly expense summary retrieved successfully',
      data: {
        summary,
        period: { year: parseInt(year), month: parseInt(month) }
      }
    });

  } catch (error) {
    console.error('Get monthly expense summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getAllExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
  approveExpense,
  getExpenseSummary,
  getMonthlySummary
};