const mongoose = require('mongoose');
const Payroll = require('./src/models/Payroll');
const Staff = require('./src/models/Staff');
require('dotenv').config();

async function testAllowanceWorkflow() {
  try {
    // Connect to MongoDB
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/blueroof');
    console.log('✅ Connected to MongoDB');

    // Find a staff member for testing
    const staff = await Staff.findOne();
    if (!staff) {
      console.log('❌ No staff member found for testing');
      return;
    }

    console.log(`👤 Testing with staff member: ${staff.name} (${staff._id})`);

    // Test 1: Create an allowance payment
    console.log('\n🧪 Test 1: Create allowance payment');
    const allowanceData = {
      employee: staff._id,
      basicSalary: 0, // Zero for allowance-only
      payPeriod: {
        startDate: new Date(),
        endDate: new Date(Date.now() + 60000)
      },
      allowances: {
        other: 3000
      },
      deductions: {},
      workingDays: { expected: 30, actual: 30 },
      paymentMethod: 'Cash',
      paymentType: 'allowance',
      paymentStatus: 'Paid',
      notes: 'Test allowance for workflow validation',
      processedBy: staff._id
    };

    const allowancePayment = new Payroll(allowanceData);
    await allowancePayment.save();
    console.log(`✅ Allowance created: ${allowancePayment.payrollReference}`);

    // Test 2: Verify filtering logic
    console.log('\n🧪 Test 2: Verify filtering logic');
    
    // Get all payroll data
    const allPayrolls = await Payroll.find({}).populate('employee', 'name');
    console.log(`📊 Total payroll records: ${allPayrolls.length}`);

    // Apply the same filtering logic as frontend
    const allowances = allPayrolls.filter(p => {
      if (p.paymentType === 'allowance') {
        return true;
      }
      const hasAllowances = p.allowances && 
        (p.allowances.other > 0 || p.allowances.transport > 0 || 
         p.allowances.housing > 0 || p.allowances.meal > 0 || 
         p.allowances.overtime > 0 || p.allowances.bonus > 0);
      const hasZeroBasicSalary = p.basicSalary === 0 || p.basicSalary === null;
      const hasNoAdvances = !p.deductions?.advance || p.deductions.advance === 0;
      return hasAllowances && hasZeroBasicSalary && hasNoAdvances;
    });

    const pending = allPayrolls.filter(p => {
      const isPendingStatus = p.paymentStatus === 'Pending' || p.paymentStatus === 'pending';
      const isAllowanceType = p.paymentType === 'allowance';
      const isAllowanceOnly = allowances.find(a => a._id.toString() === p._id.toString());
      return isPendingStatus && !isAllowanceType && !isAllowanceOnly;
    });

    const processed = allPayrolls.filter(p => {
      const isProcessedStatus = p.paymentStatus === 'Processed' || p.paymentStatus === 'Paid' ||
                               p.paymentStatus === 'processed' || p.paymentStatus === 'paid';
      const isAllowanceType = p.paymentType === 'allowance';
      return isProcessedStatus && !isAllowanceType;
    });

    console.log(`📋 Allowances identified: ${allowances.length}`);
    allowances.forEach(a => {
      console.log(`  - ${a.payrollReference}: ${a.employee?.name}, Amount: ${a.allowances?.other || 0}, Type: ${a.paymentType}, Status: ${a.paymentStatus}`);
    });

    console.log(`⏳ Pending payments: ${pending.length}`);
    pending.forEach(p => {
      console.log(`  - ${p.payrollReference}: ${p.employee?.name}, Type: ${p.paymentType}, Status: ${p.paymentStatus}`);
    });

    console.log(`✅ Processed payments (non-allowance): ${processed.length}`);
    
    // Test 3: Simulate login/reload scenario
    console.log('\n🧪 Test 3: Simulate login/reload scenario');
    
    // This simulates what happens when the frontend loads data
    const freshData = await Payroll.find({}).populate('employee', 'name');
    const freshAllowances = freshData.filter(p => p.paymentType === 'allowance');
    const freshPending = freshData.filter(p => {
      const isPending = p.paymentStatus === 'Pending';
      const isAllowance = p.paymentType === 'allowance';
      return isPending && !isAllowance;
    });

    console.log(`🔄 After reload - Allowances: ${freshAllowances.length}, Pending: ${freshPending.length}`);
    
    // Verify our test allowance is in allowances, not pending
    const ourAllowance = freshAllowances.find(a => a._id.toString() === allowancePayment._id.toString());
    const ourAllowanceInPending = freshPending.find(p => p._id.toString() === allowancePayment._id.toString());
    
    if (ourAllowance && !ourAllowanceInPending) {
      console.log('✅ SUCCESS: Allowance correctly stays in allowances section after reload');
    } else {
      console.log('❌ FAILED: Allowance incorrectly moved to pending section');
    }

    console.log('\n🎉 Workflow test completed!');

  } catch (error) {
    console.error('❌ Error testing allowance workflow:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the test
testAllowanceWorkflow();