const mongoose = require('mongoose');
const Payroll = require('./src/models/Payroll');
const Staff = require('./src/models/Staff');
require('dotenv').config();

async function testAllowancePayment() {
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

    console.log(`👤 Using staff member: ${staff.name} (${staff._id})`);

    // Create a test allowance payment
    const allowanceData = {
      employee: staff._id,
      basicSalary: 0, // Zero basic salary for allowance-only payment
      payPeriod: {
        startDate: new Date(),
        endDate: new Date(Date.now() + 60000) // 1 minute later
      },
      allowances: {
        other: 5000 // Test allowance amount
      },
      deductions: {},
      workingDays: { expected: 30, actual: 30 },
      paymentMethod: 'Cash',
      paymentType: 'allowance', // Explicitly set as allowance
      paymentStatus: 'Paid', // Set as paid immediately
      notes: 'Test allowance payment for database persistence',
      processedBy: staff._id // Use staff member as processor for testing
    };

    console.log('💰 Creating test allowance payment...');
    const allowancePayment = new Payroll(allowanceData);
    await allowancePayment.save();
    
    console.log('✅ Allowance payment created successfully');
    console.log(`📄 Reference: ${allowancePayment.payrollReference}`);
    console.log(`💵 Amount: ${allowancePayment.allowances.other}`);
    console.log(`🏷️  Type: ${allowancePayment.paymentType}`);
    console.log(`📊 Status: ${allowancePayment.paymentStatus}`);

    // Test filtering logic
    console.log('\n🔍 Testing filtering logic...');
    
    // Get allowance payments
    const allowancePayments = await Payroll.find({ paymentType: 'allowance' });
    console.log(`📋 Found ${allowancePayments.length} allowance payments`);

    // Get pending payments (should exclude allowances)
    const pendingPayments = await Payroll.find({ 
      paymentStatus: 'Pending',
      paymentType: { $ne: 'allowance' }
    });
    console.log(`⏳ Found ${pendingPayments.length} pending payments (excluding allowances)`);

    // Get all pending including allowances for comparison
    const allPending = await Payroll.find({ paymentStatus: 'Pending' });
    console.log(`📊 Total pending payments (including allowances): ${allPending.length}`);

    console.log('\n✅ Database persistence test completed successfully!');

  } catch (error) {
    console.error('❌ Error testing allowance payment:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the test
testAllowancePayment();