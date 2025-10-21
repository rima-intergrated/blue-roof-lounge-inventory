require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Staff = require('./src/models/Staff');
const Position = require('./src/models/Position');

console.log('🔍 Checking dreamlightmw@gmail.com user details...');

async function checkCashierUser() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/blue_roof_lounge');
    console.log('✅ Database connected');

    // Find the cashier user with all related data
    const cashierUser = await User.findOne({ email: 'dreamlightmw@gmail.com' })
      .populate({
        path: 'staffId',
        populate: {
          path: 'position',
          select: 'positionTitle positionCode permissions'
        }
      })
      .select('-password');

    if (!cashierUser) {
      console.log('❌ dreamlightmw@gmail.com user not found');
      return;
    }

    console.log('\n👤 Cashier User Details:');
    console.log('Email:', cashierUser.email);
    console.log('Username:', cashierUser.username);
    console.log('Role:', cashierUser.role);
    console.log('Active:', cashierUser.isActive);
    console.log('Staff ID linked:', !!cashierUser.staffId);

    if (cashierUser.staffId) {
      console.log('\n📋 Staff Details:');
      console.log('Staff Name:', cashierUser.staffId.name);
      console.log('Staff Email:', cashierUser.staffId.email);
      console.log('Position linked:', !!cashierUser.staffId.position);
      
      if (cashierUser.staffId.position) {
        console.log('\n🏢 Position Details:');
        console.log('Position Title:', cashierUser.staffId.position.positionTitle);
        console.log('Position Code:', cashierUser.staffId.position.positionCode);
        console.log('Permissions:', JSON.stringify(cashierUser.staffId.position.permissions, null, 2));
      } else {
        console.log('❌ No position assigned to staff');
      }
    } else {
      console.log('❌ No staff record linked to user');
    }

    // Test the permissions API endpoint simulation
    console.log('\n🔧 Simulating /api/auth/permissions response:');
    const permissionsResponse = {
      success: true,
      message: 'User permissions retrieved successfully',
      data: {
        permissions: cashierUser.staffId?.position?.permissions || {},
        positionTitle: cashierUser.staffId?.position?.positionTitle || null
      }
    };
    console.log(JSON.stringify(permissionsResponse, null, 2));

  } catch (error) {
    console.error('❌ Error checking cashier user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Database disconnected');
    process.exit(0);
  }
}

checkCashierUser();