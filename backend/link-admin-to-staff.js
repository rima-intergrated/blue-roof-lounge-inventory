require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Staff = require('./src/models/Staff');
const Position = require('./src/models/Position');

console.log('🔗 Linking admin user to staff record...');

async function linkAdminToStaff() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/blue_roof_lounge');
    console.log('✅ Database connected');

    // Find the admin user
    const adminUser = await User.findOne({ role: 'Administrator' });
    if (!adminUser) {
      console.log('❌ No Administrator user found');
      return;
    }

    console.log('👤 Found admin user:', adminUser.email);

    // Check if admin already has a staff record
    if (adminUser.staffId) {
      console.log('✅ Admin user already linked to staff record');
      return;
    }

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
    }

    // Create staff record for admin
    console.log('👤 Creating staff record for admin...');
    const adminStaff = new Staff({
      name: 'System Administrator',
      gender: 'Male',
      contact: '+1234567890',
      email: adminUser.email,
      address: 'Blue Roof Lounge',
      position: adminPosition._id,
      salary: 100000,
      employed: true,
      status: 'Active'
    });
    await adminStaff.save();
    console.log('✅ Admin staff record created');

    // Link user to staff record
    adminUser.staffId = adminStaff._id;
    await adminUser.save();
    console.log('✅ Admin user linked to staff record');

    console.log('\n🎉 Admin setup complete!');
    console.log('📧 Email: admin@bluerooflounge.com');
    console.log('🔑 Default password should be: admin123456');
    console.log('👑 Role: Administrator with full permissions');

  } catch (error) {
    console.error('❌ Error linking admin to staff:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Database disconnected');
    process.exit(0);
  }
}

linkAdminToStaff();