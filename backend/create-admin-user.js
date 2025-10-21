require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/models/User');
const Staff = require('./src/models/Staff');
const Position = require('./src/models/Position');

console.log('🔧 Creating administrator user with full permissions...');

async function createAdminUser() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/blue_roof_lounge');
    console.log('✅ Database connected');

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ role: 'Administrator' });
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists:', existingAdmin.email);
      console.log('💡 If you want to reset the admin user, delete the existing one first.');
      return;
    }

    // Create or update Administrator position with full permissions
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
          sales: {
            view: true,
            create: true,
            edit: true,
            delete: true
          },
          inventory: {
            view: true,
            create: true,
            edit: true,
            delete: true
          },
          hrm: {
            view: true,
            create: true,
            edit: true,
            delete: true
          },
          payroll: {
            view: true,
            create: true,
            edit: true,
            delete: true
          },
          reports: {
            view: true,
            create: true,
            edit: true,
            delete: true
          },
          settings: {
            view: true,
            create: true,
            edit: true,
            delete: true
          }
        }
      });
      await adminPosition.save();
      console.log('✅ Administrator position created with full permissions');
    } else {
      console.log('📋 Updating existing Administrator position with full permissions...');
      adminPosition.permissions = {
        sales: { view: true, create: true, edit: true, delete: true },
        inventory: { view: true, create: true, edit: true, delete: true },
        hrm: { view: true, create: true, edit: true, delete: true },
        payroll: { view: true, create: true, edit: true, delete: true },
        reports: { view: true, create: true, edit: true, delete: true },
        settings: { view: true, create: true, edit: true, delete: true }
      };
      await adminPosition.save();
      console.log('✅ Administrator position updated with full permissions');
    }

    // Create admin staff record
    console.log('👤 Creating admin staff record...');
    const adminStaff = new Staff({
      name: 'System Administrator',
      gender: 'Male',
      contact: '+1234567890',
      email: 'admin@blueroof.com',
      address: 'Blue Roof Lounge',
      position: adminPosition._id,
      salary: 100000, // Set a reasonable admin salary
      dateHired: new Date(),
      status: 'Active'
    });
    await adminStaff.save();
    console.log('✅ Admin staff record created');

    // Hash password
    const password = 'admin123456';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create admin user
    console.log('🔐 Creating admin user account...');
    const adminUser = new User({
      username: 'admin',
      email: 'admin@blueroof.com',
      password: hashedPassword,
      role: 'Administrator',
      staffId: adminStaff._id,
      isActive: true,
      emailVerified: true
    });
    await adminUser.save();
    console.log('✅ Admin user created successfully');

    console.log('\n🎉 Administrator setup complete!');
    console.log('📧 Email: admin@blueroof.com');
    console.log('🔑 Password: admin123456');
    console.log('👑 Role: Administrator with full permissions');
    console.log('\n⚠️  IMPORTANT: Please change the default password after first login!');

    // Show summary of all users
    console.log('\n📊 Current Users Summary:');
    const allUsers = await User.find({})
      .populate({
        path: 'staffId',
        populate: {
          path: 'position',
          select: 'positionTitle permissions'
        }
      })
      .select('-password');
    
    allUsers.forEach(user => {
      console.log(`\n👤 ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Position: ${user.staffId?.position?.positionTitle || 'None'}`);
      console.log(`   Active: ${user.isActive ? 'Yes' : 'No'}`);
    });

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Database disconnected');
    process.exit(0);
  }
}

createAdminUser();