const { validationResult } = require('express-validator');
const Payroll = require('../models/Payroll');
const Staff = require('../models/Staff');

// @desc    Get all payroll records
// @route   GET /api/payroll
// @access  Private (Admin/Manager only)
const getAllPayroll = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      employee,
      month,
      year,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (employee) filter.employee = employee;
    if (status) filter.status = status;
    
    // Filter by month/year
    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      filter['payPeriod.startDate'] = { $gte: startDate };
      filter['payPeriod.endDate'] = { $lte: endDate };
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    // Execute query with population
    const [payrolls, total] = await Promise.all([
      Payroll.find(filter)
        .populate('employee', 'name position email')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      Payroll.countDocuments(filter)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.json({
      success: true,
      data: {
        payrolls,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: total,
          itemsPerPage: parseInt(limit),
          hasNextPage,
          hasPrevPage,
          nextPage: hasNextPage ? parseInt(page) + 1 : null,
          prevPage: hasPrevPage ? parseInt(page) - 1 : null
        }
      }
    });

  } catch (error) {
    console.error('Get payroll error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// @desc    Get single payroll record
// @route   GET /api/payroll/:id
// @access  Private
const getPayrollById = async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id)
      .populate('employee', 'name position email contact');

    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: 'Payroll record not found'
      });
    }

    res.json({
      success: true,
      data: { payroll }
    });

  } catch (error) {
    console.error('Get payroll record error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// @desc    Create new payroll record
// @route   POST /api/payroll
// @access  Private (Admin/Manager only)
const createPayroll = async (req, res) => {
  try {
    console.log('📥 Creating payroll with request body:', JSON.stringify(req.body, null, 2));
    console.log('👤 Authenticated user:', req.user ? `UserID: ${req.user.userId}` : 'No user found');
    console.log('👤 User details:', req.userDetails ? `Email: ${req.userDetails.email}, Name: ${req.userDetails.name}` : 'No user details');
    
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
      employee,
      payPeriod,
      basicSalary,
      allowances,
      deductions,
      workingDays,
      overtime,
      paymentMethod,
      paymentType,
      notes
    } = req.body;

    // Verify employee exists
    const staff = await Staff.findById(employee);
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Check if payroll already exists for this period
    const existingPayroll = await Payroll.findOne({
      employee,
      'payPeriod.startDate': payPeriod.startDate,
      'payPeriod.endDate': payPeriod.endDate
    });

    if (existingPayroll) {
      return res.status(400).json({
        success: false,
        message: 'Payroll already exists for this employee and period'
      });
    }

    // Calculate totals
    const totalAllowances = Object.values(allowances || {}).reduce((sum, val) => sum + (val || 0), 0);
    const totalDeductions = Object.values(deductions || {}).reduce((sum, val) => sum + (val || 0), 0);
    const grossPay = basicSalary + totalAllowances;
    const netPay = grossPay - totalDeductions;

    // Generate unique payroll reference
    const payrollRef = `PAY-${paymentType?.toUpperCase() || 'GEN'}-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    
    const payrollData = {
      employee,
      payPeriod,
      basicSalary,
      allowances: allowances || {},
      deductions: deductions || {},
      workingDays: workingDays || { expected: 30, actual: 30 },
      overtime: overtime || { hours: 0, rate: 0, amount: 0 },
      grossPay,
      netPay,
      notes,
      paymentMethod,
      paymentType: paymentType || 'salary', // Explicitly set paymentType
      payrollReference: payrollRef,
      processedBy: req.user?.userId || req.userDetails?._id
    };

    console.log('🔍 Data being passed to Mongoose:', JSON.stringify(payrollData, null, 2));
    
    const payroll = new Payroll(payrollData);

    await payroll.save();

    // Populate employee details
    await payroll.populate('employee', 'name position email');

    res.status(201).json({
      success: true,
      message: 'Payroll record created successfully',
      data: { payroll }
    });

  } catch (error) {
    console.error('❌ Create payroll error:', error);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Request body was:', JSON.stringify(req.body, null, 2));
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// @desc    Update payroll record
// @route   PUT /api/payroll/:id
// @access  Private (Admin/Manager only)
const updatePayroll = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const payroll = await Payroll.findById(req.params.id);

    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: 'Payroll record not found'
      });
    }

    // Check if already paid
    if (payroll.status === 'Paid') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update paid payroll record'
      });
    }

    const {
      basicSalary,
      allowances,
      deductions,
      workingDays,
      overtime,
      notes
    } = req.body;

    // Recalculate totals
    const totalAllowances = Object.values(allowances || payroll.allowances).reduce((sum, val) => sum + (val || 0), 0);
    const totalDeductions = Object.values(deductions || payroll.deductions).reduce((sum, val) => sum + (val || 0), 0);
    const grossPay = (basicSalary || payroll.basicSalary) + totalAllowances;
    const netPay = grossPay - totalDeductions;

    const updatedPayroll = await Payroll.findByIdAndUpdate(
      req.params.id,
      {
        basicSalary: basicSalary || payroll.basicSalary,
        allowances: allowances || payroll.allowances,
        deductions: deductions || payroll.deductions,
        workingDays: workingDays || payroll.workingDays,
        overtime: overtime || payroll.overtime,
        grossPay,
        netPay,
        notes: notes || payroll.notes,
        updatedBy: req.user.id
      },
      { new: true, runValidators: true }
    ).populate('employee', 'name position email');

    res.json({
      success: true,
      message: 'Payroll record updated successfully',
      data: { payroll: updatedPayroll }
    });

  } catch (error) {
    console.error('Update payroll error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// @desc    Mark payroll as paid
// @route   PATCH /api/payroll/:id/pay
// @access  Private (Admin/Manager only)
const markAsPaid = async (req, res) => {
  try {
    console.log(`🔄 [markAsPaid] Processing payment for payroll ID: ${req.params.id}`);
    console.log(`📝 [markAsPaid] Request body:`, req.body);
    
    const { paymentMethod, transactionReference, paidDate, notes } = req.body;

    const payroll = await Payroll.findById(req.params.id)
      .populate('employee', 'name position email');

    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: 'Payroll record not found'
      });
    }

    if (payroll.paymentStatus === 'Paid') {
      return res.status(400).json({
        success: false,
        message: 'Payroll is already marked as paid'
      });
    }

    payroll.paymentStatus = 'Paid';
    payroll.paymentMethod = paymentMethod || 'Cash';
    payroll.paymentDate = paidDate || new Date();

    await payroll.save();
    
    console.log(`✅ [markAsPaid] Successfully updated payroll ${req.params.id} to status: ${payroll.paymentStatus}`);

    res.json({
      success: true,
      message: 'Payroll marked as paid successfully',
      data: { payroll }
    });

  } catch (error) {
    console.error('Mark payroll as paid error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// @desc    Get payroll statistics
// @route   GET /api/payroll/stats
// @access  Private (Admin/Manager only)
const getPayrollStats = async (req, res) => {
  try {
    const { year = new Date().getFullYear() } = req.query;

    const [
      totalPayroll,
      monthlyPayroll,
      departmentPayroll,
      pendingPayroll
    ] = await Promise.all([
      // Total payroll for the year
      Payroll.aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(year, 0, 1),
              $lt: new Date(parseInt(year) + 1, 0, 1)
            }
          }
        },
        {
          $group: {
            _id: null,
            totalGross: { $sum: '$grossPay' },
            totalNet: { $sum: '$netPay' },
            count: { $sum: 1 }
          }
        }
      ]),
      
      // Monthly breakdown
      Payroll.aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(year, 0, 1),
              $lt: new Date(parseInt(year) + 1, 0, 1)
            }
          }
        },
        {
          $group: {
            _id: { $month: '$createdAt' },
            totalGross: { $sum: '$grossPay' },
            totalNet: { $sum: '$netPay' },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),

      // Department-wise payroll
      Payroll.aggregate([
        {
          $lookup: {
            from: 'staffs',
            localField: 'employee',
            foreignField: '_id',
            as: 'employeeData'
          }
        },
        {
          $unwind: '$employeeData'
        },
        {
          $group: {
            _id: '$employeeData.position',
            totalGross: { $sum: '$grossPay' },
            totalNet: { $sum: '$netPay' },
            count: { $sum: 1 }
          }
        },
        { $sort: { totalGross: -1 } }
      ]),

      // Pending payroll
      Payroll.countDocuments({ status: 'Pending' })
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalPayroll: totalPayroll[0] || { totalGross: 0, totalNet: 0, count: 0 },
          pendingPayroll
        },
        monthlyBreakdown: monthlyPayroll,
        departmentBreakdown: departmentPayroll
      }
    });

  } catch (error) {
    console.error('Get payroll stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// @desc    Get employee payroll history
// @route   GET /api/payroll/employee/:employeeId
// @access  Private
const getEmployeePayrollHistory = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { year, limit = 12 } = req.query;

    // Build filter
    const filter = { employee: employeeId };
    
    if (year) {
      filter.createdAt = {
        $gte: new Date(year, 0, 1),
        $lt: new Date(parseInt(year) + 1, 0, 1)
      };
    }

    const payrollHistory = await Payroll.find(filter)
      .populate('employee', 'name position email')
      .sort({ 'payPeriod.startDate': -1 })
      .limit(parseInt(limit));

    const totalEarnings = payrollHistory.reduce((sum, payroll) => sum + payroll.netPay, 0);

    res.json({
      success: true,
      data: {
        payrollHistory,
        summary: {
          totalRecords: payrollHistory.length,
          totalEarnings
        }
      }
    });

  } catch (error) {
    console.error('Get employee payroll history error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  getAllPayroll,
  getPayrollById,
  createPayroll,
  updatePayroll,
  markAsPaid,
  getPayrollStats,
  getEmployeePayrollHistory
};
