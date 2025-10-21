const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('./src/models/User');
const Staff = require('./src/models/Staff');
const Position = require('./src/models/Position');

const checkCashierUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📦 Connected to MongoDB');

    // Find cashier users
    console.log('\n🔍 Checking all users with staff positions...');
    
    const users = await User.find({ staffId: { $exists: true, $ne: null } })
      .populate({
        path: 'staffId',
        populate: {
          path: 'position',
          select: 'positionTitle permissions'
        }
      })
      .select('email username staffId');

    console.log(`📊 Found ${users.length} users with staff assignments:`);
    
    for (const user of users) {
      console.log(`\n👤 User: ${user.email} (${user.username})`);
      if (user.staffId) {
        console.log(`  📋 Staff ID: ${user.staffId._id}`);
        if (user.staffId.position) {
          console.log(`  🏷️  Position: ${user.staffId.position.positionTitle}`);
          console.log(`  🔑 Permissions: ${JSON.stringify(user.staffId.position.permissions, null, 2)}`);
        } else {
          console.log(`  ❌ No position assigned to staff record`);
        }
      } else {
        console.log(`  ❌ No staff record found`);
      }
    }

    // Check cashier position specifically
    console.log('\n🔍 Checking Cashier position...');
    const cashierPosition = await Position.findOne({ positionTitle: 'Cashier' });
    if (cashierPosition) {
      console.log(`✅ Cashier position found: ${cashierPosition._id}`);
      console.log(`🔑 Cashier permissions: ${JSON.stringify(cashierPosition.permissions, null, 2)}`);
    } else {
      console.log(`❌ Cashier position not found`);
    }

    // Check which staff members have cashier position
    console.log('\n🔍 Checking staff members with Cashier position...');
    const cashierStaff = await Staff.find({ position: cashierPosition?._id })
      .populate('position', 'positionTitle permissions');
    
    console.log(`📊 Found ${cashierStaff.length} staff members with Cashier position:`);
    for (const staff of cashierStaff) {
      console.log(`  👤 Staff: ${staff.firstName} ${staff.lastName} (ID: ${staff._id})`);
    }

    await mongoose.disconnect();
    console.log('\n✅ Database check completed');

  } catch (error) {
    console.error('❌ Error checking cashier user:', error);
    process.exit(1);
  }
};

checkCashierUser();