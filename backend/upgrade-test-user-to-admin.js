require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Staff = require('./src/models/Staff');
const Position = require('./src/models/Position');

console.log('🔧 Upgrading test@bluerooflounge.com to Administrator...');

async function upgradeTestUserToAdmin() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/blue_roof_lounge');
    console.log('✅ Database connected');

    // Find the test user
    const testUser = await User.findOne({ email: 'test@bluerooflounge.com' });
    if (!testUser) {
      console.log('❌ test@bluerooflounge.com user not found');
      return;
    }

    console.log('👤 Found test user:', testUser.email);
    console.log('📋 Current role:', testUser.role);

    // Find or create Administrator position
    let adminPosition = await Position.findOne({ 
      $or: [
        { positionTitle: { $regex: /administrator/i } },
        { positionCode: 'ADMIN' }
      ]
    });

    if (!adminPosition) {
      console.log('📋 Creating Administrator position...');
      adminPosition = new Position({
        positionTitle: 'Administrator',
        positionCode: 'ADMIN',
        permissions: {
          sales: { view: true, create: true, edit: true, delete: true },
          inventory: { view: true, create: true, edit: true, delete: true },
          hrm: { view: true, create: true, edit: true, delete: true },
          payroll: { view: true, create: true, edit: true, delete: true },
          reports: { view: true, create: true, edit: true, delete: true },
          settings: { view: true, create: true, edit: true, delete: true }
        }
      });
      await adminPosition.save();
      console.log('✅ Administrator position created');
    } else {
      console.log('📋 Found existing Administrator position');
      // Make sure it has full permissions
      adminPosition.permissions = {
        sales: { view: true, create: true, edit: true, delete: true },
        inventory: { view: true, create: true, edit: true, delete: true },
        hrm: { view: true, create: true, edit: true, delete: true },
        payroll: { view: true, create: true, edit: true, delete: true },
        reports: { view: true, create: true, edit: true, delete: true },
        settings: { view: true, create: true, edit: true, delete: true }
      };
      await adminPosition.save();
      console.log('✅ Administrator position permissions updated');
    }

    // Create or update staff record for test user
    let testStaff = null;
    if (testUser.staffId) {
      // Update existing staff record
      testStaff = await Staff.findById(testUser.staffId);
      if (testStaff) {
        testStaff.position = adminPosition._id;
        testStaff.salary = testStaff.salary || 100000;
        await testStaff.save();
        console.log('✅ Updated existing staff record');
      }
    }
    
    if (!testStaff) {
      // Create new staff record
      console.log('👤 Creating staff record for test user...');
      testStaff = new Staff({
        name: 'Test Administrator',
        gender: 'Male',
        contact: '+1234567890',
        email: testUser.email,
        address: 'Blue Roof Lounge',
        position: adminPosition._id,
        salary: 100000,
        employed: true,
        status: 'Active'
      });
      await testStaff.save();
      console.log('✅ Staff record created');
      
      // Link user to staff record
      testUser.staffId = testStaff._id;
    }

    // Update user role to Administrator
    testUser.role = 'Administrator';
    testUser.isActive = true;
    await testUser.save();
    console.log('✅ User role updated to Administrator');

    console.log('\n🎉 Test user upgrade complete!');
    console.log('📧 Email: test@bluerooflounge.com');
    console.log('🔑 Use existing password');
    console.log('👑 Role: Administrator with full permissions');
    console.log('📋 Position:', adminPosition.positionTitle);

    // Show final user details
    const updatedUser = await User.findById(testUser._id)
      .populate({
        path: 'staffId',
        populate: {
          path: 'position',
          select: 'positionTitle permissions'
        }
      })
      .select('-password');
    
    console.log('\n📊 Final user details:');
    console.log('Username:', updatedUser.username);
    console.log('Email:', updatedUser.email);
    console.log('Role:', updatedUser.role);
    console.log('Active:', updatedUser.isActive);
    console.log('Position:', updatedUser.staffId?.position?.positionTitle || 'None');
    console.log('Permissions:', JSON.stringify(updatedUser.staffId?.position?.permissions, null, 2));

  } catch (error) {
    console.error('❌ Error upgrading test user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Database disconnected');
    process.exit(0);
  }
}

upgradeTestUserToAdmin();