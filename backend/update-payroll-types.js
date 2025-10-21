const mongoose = require('mongoose');
const Payroll = require('./src/models/Payroll');
require('dotenv').config();

async function updatePayrollTypes() {
  try {
    // Connect to MongoDB
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/blueroof');
    console.log('✅ Connected to MongoDB');

    // Get all payroll records without paymentType
    const payrolls = await Payroll.find({ 
      $or: [
        { paymentType: { $exists: false } },
        { paymentType: null },
        { paymentType: '' }
      ]
    });

    console.log(`📊 Found ${payrolls.length} payroll records to update`);

    let updatedCount = 0;

    for (const payroll of payrolls) {
      let paymentType = 'salary'; // default

      // Determine payment type based on data
      if (payroll.deductions && payroll.deductions.advance > 0) {
        paymentType = 'advance';
      } else if (payroll.allowances) {
        const hasAllowances = Object.values(payroll.allowances).some(amount => amount > 0);
        const hasBasicSalary = payroll.basicSalary > 0;
        const hasDeductions = payroll.deductions && Object.values(payroll.deductions).some(amount => amount > 0);
        
        // If it has allowances but very low/zero basic salary and no meaningful deductions, it's likely an allowance-only payment
        if (hasAllowances && payroll.basicSalary <= 100 && !hasDeductions) {
          paymentType = 'allowance';
        } else if (hasAllowances && hasBasicSalary) {
          paymentType = 'salary'; // salary with allowances
        }
      }

      // Update the record
      await Payroll.updateOne(
        { _id: payroll._id },
        { $set: { paymentType: paymentType } }
      );

      updatedCount++;
      console.log(`✅ Updated payroll ${payroll.payrollReference || payroll._id} - Type: ${paymentType}`);
    }

    console.log(`🎉 Successfully updated ${updatedCount} payroll records`);

  } catch (error) {
    console.error('❌ Error updating payroll types:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the update
updatePayrollTypes();