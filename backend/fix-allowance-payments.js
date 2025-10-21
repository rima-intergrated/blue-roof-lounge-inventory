const mongoose = require('mongoose');
const Payroll = require('./src/models/Payroll');
require('dotenv').config();

async function fixAllowancePayments() {
  try {
    // Connect to MongoDB
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/blueroof');
    console.log('✅ Connected to MongoDB');

    // Find allowance payments that might have wrong basicSalary
    const allowancePayments = await Payroll.find({ 
      paymentType: 'allowance'
    });

    console.log(`📊 Found ${allowancePayments.length} allowance payments`);

    for (const payment of allowancePayments) {
      console.log(`🔍 Checking allowance payment: ${payment.payrollReference}`);
      console.log(`  - Current basicSalary: ${payment.basicSalary}`);
      console.log(`  - Allowance amount: ${payment.allowances?.other || 0}`);
      console.log(`  - Payment status: ${payment.paymentStatus}`);

      // Update the payment to have zero basic salary and paid status
      const updateData = {
        basicSalary: 0,
        paymentStatus: 'Paid',
        paymentType: 'allowance'
      };

      await Payroll.updateOne(
        { _id: payment._id },
        { $set: updateData }
      );

      console.log(`✅ Updated allowance payment ${payment.payrollReference}`);
    }

    console.log(`🎉 Successfully fixed ${allowancePayments.length} allowance payments`);

    // Show summary of all payment types
    console.log('\n📊 Payment Summary:');
    const summary = await Payroll.aggregate([
      {
        $group: {
          _id: '$paymentType',
          count: { $sum: 1 },
          avgBasicSalary: { $avg: '$basicSalary' },
          statuses: { $addToSet: '$paymentStatus' }
        }
      }
    ]);

    summary.forEach(item => {
      console.log(`  ${item._id}: ${item.count} payments, avg salary: ${item.avgBasicSalary?.toFixed(2) || 0}, statuses: ${item.statuses.join(', ')}`);
    });

  } catch (error) {
    console.error('❌ Error fixing allowance payments:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the fix
fixAllowancePayments();