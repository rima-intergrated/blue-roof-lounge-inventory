const mongoose = require('mongoose');

const payrollSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff',
    required: [true, 'Employee reference is required']
  },
  payPeriod: {
    startDate: {
      type: Date,
      required: [true, 'Pay period start date is required']
    },
    endDate: {
      type: Date,
      required: [true, 'Pay period end date is required']
    }
  },
  basicSalary: {
    type: Number,
    required: [true, 'Basic salary is required'],
    min: [0, 'Basic salary cannot be negative']
  },
  allowances: {
    transport: {
      type: Number,
      default: 0,
      min: [0, 'Transport allowance cannot be negative']
    },
    housing: {
      type: Number,
      default: 0,
      min: [0, 'Housing allowance cannot be negative']
    },
    meal: {
      type: Number,
      default: 0,
      min: [0, 'Meal allowance cannot be negative']
    },
    overtime: {
      type: Number,
      default: 0,
      min: [0, 'Overtime allowance cannot be negative']
    },
    bonus: {
      type: Number,
      default: 0,
      min: [0, 'Bonus cannot be negative']
    },
    commission: {
      type: Number,
      default: 0,
      min: [0, 'Commission cannot be negative']
    },
    other: {
      type: Number,
      default: 0,
      min: [0, 'Other allowance cannot be negative']
    }
  },
  deductions: {
    tax: {
      type: Number,
      default: 0,
      min: [0, 'Tax deduction cannot be negative']
    },
    nhif: {
      type: Number,
      default: 0,
      min: [0, 'NHIF deduction cannot be negative']
    },
    nssf: {
      type: Number,
      default: 0,
      min: [0, 'NSSF deduction cannot be negative']
    },
    loan: {
      type: Number,
      default: 0,
      min: [0, 'Loan deduction cannot be negative']
    },
    advance: {
      type: Number,
      default: 0,
      min: [0, 'Advance deduction cannot be negative']
    },
    latePenalty: {
      type: Number,
      default: 0,
      min: [0, 'Late penalty cannot be negative']
    },
    other: {
      type: Number,
      default: 0,
      min: [0, 'Other deduction cannot be negative']
    }
  },
  workingDays: {
    expected: {
      type: Number,
      required: [true, 'Expected working days is required'],
      min: [1, 'Expected working days must be at least 1']
    },
    actual: {
      type: Number,
      required: [true, 'Actual working days is required'],
      min: [0, 'Actual working days cannot be negative']
    }
  },
  overtime: {
    hours: {
      type: Number,
      default: 0,
      min: [0, 'Overtime hours cannot be negative']
    },
    rate: {
      type: Number,
      default: 0,
      min: [0, 'Overtime rate cannot be negative']
    }
  },
  grossPay: {
    type: Number,
    default: 0
  },
  totalDeductions: {
    type: Number,
    default: 0
  },
  netPay: {
    type: Number,
    default: 0
  },
  paymentMethod: {
    type: String,
    required: [true, 'Payment method is required'],
    enum: ['Bank Transfer', 'Cash', 'Cheque', 'Mobile Money']
  },
  bankDetails: {
    accountNumber: String,
    bankName: String,
    branchCode: String
  },
  paymentStatus: {
    type: String,
    required: [true, 'Payment status is required'],
    enum: ['Pending', 'Processed', 'Paid', 'Failed'],
    default: 'Pending'
  },
  paymentType: {
    type: String,
    enum: ['salary', 'advance', 'allowance', 'bonus', 'overtime'],
    default: 'salary'
  },
  paymentDate: {
    type: Date
  },
  payrollReference: {
    type: String
  },
  notes: {
    type: String,
    maxlength: [300, 'Notes cannot exceed 300 characters']
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvalDate: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Pre-save middleware to calculate totals and generate reference
payrollSchema.pre('save', function(next) {
  // Calculate total allowances
  const totalAllowances = Object.values(this.allowances).reduce((sum, amount) => sum + (amount || 0), 0);
  
  // Calculate overtime pay
  const overtimePay = (this.overtime.hours || 0) * (this.overtime.rate || 0);
  
  // Calculate gross pay
  this.grossPay = this.basicSalary + totalAllowances + overtimePay;
  
  // Calculate total deductions
  this.totalDeductions = Object.values(this.deductions).reduce((sum, amount) => sum + (amount || 0), 0);
  
  // Calculate net pay
  this.netPay = this.grossPay - this.totalDeductions;
  
  // Generate payroll reference if not provided
  if (!this.payrollReference) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.payrollReference = `PAY${year}${month}${random}`;
  }
  
  next();
});

// Validate pay period
payrollSchema.pre('save', function(next) {
  if (this.payPeriod.endDate <= this.payPeriod.startDate) {
    return next(new Error('End date must be after start date'));
  }
  
  if (this.workingDays.actual > this.workingDays.expected) {
    return next(new Error('Actual working days cannot exceed expected working days'));
  }
  
  next();
});

// Virtual for attendance percentage
payrollSchema.virtual('attendancePercentage').get(function() {
  return ((this.workingDays.actual / this.workingDays.expected) * 100).toFixed(2);
});

// Virtual for days in pay period
payrollSchema.virtual('payPeriodDays').get(function() {
  return Math.ceil((this.payPeriod.endDate - this.payPeriod.startDate) / (1000 * 60 * 60 * 24));
});

// Virtual for effective daily rate
payrollSchema.virtual('dailyRate').get(function() {
  return (this.basicSalary / this.workingDays.expected).toFixed(2);
});

// Virtual for deduction percentage
payrollSchema.virtual('deductionPercentage').get(function() {
  return this.grossPay > 0 ? ((this.totalDeductions / this.grossPay) * 100).toFixed(2) : 0;
});

// Method to approve payroll
payrollSchema.methods.approve = function(approvedBy) {
  this.paymentStatus = 'Processed';
  this.approvedBy = approvedBy;
  this.approvalDate = new Date();
  return this.save();
};

// Method to mark as paid
payrollSchema.methods.markAsPaid = function() {
  this.paymentStatus = 'Paid';
  this.paymentDate = new Date();
  return this.save();
};

// Static method to find pending payrolls
payrollSchema.statics.findPending = function() {
  return this.find({ paymentStatus: 'Pending' })
    .populate('employee', 'firstName lastName employeeId')
    .populate('processedBy', 'username')
    .sort({ createdAt: -1 });
};

// Static method to get payroll summary for a period
payrollSchema.statics.getSummaryForPeriod = function(startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        'payPeriod.startDate': { $gte: new Date(startDate) },
        'payPeriod.endDate': { $lte: new Date(endDate) }
      }
    },
    {
      $group: {
        _id: null,
        totalGrossPay: { $sum: '$grossPay' },
        totalDeductions: { $sum: '$totalDeductions' },
        totalNetPay: { $sum: '$netPay' },
        employeeCount: { $sum: 1 },
        averageNetPay: { $avg: '$netPay' }
      }
    }
  ]);
};

// Indexes for better performance
payrollSchema.index({ employee: 1 });
payrollSchema.index({ 'payPeriod.startDate': -1, 'payPeriod.endDate': -1 });
payrollSchema.index({ paymentStatus: 1 });
payrollSchema.index({ paymentType: 1 });
// payrollReference index declared once
payrollSchema.index({ payrollReference: 1 });
payrollSchema.index({ processedBy: 1 });
payrollSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Payroll', payrollSchema);
