require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Staff = require('./src/models/Staff');
const Position = require('./src/models/Position');

console.log('👥 Checking all users and their permissions...');

async function checkUsers() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/blue_roof_lounge');
    console.log('✅ Database connected');

    // Get all users with their staff and position data
    const users = await User.find({})
      .populate({
        path: 'staffId',
        populate: {
          path: 'position',
          select: 'positionTitle permissions'
        }
      })
      .select('-password -passwordSetupToken -refreshToken');
    
    console.log(`\n📊 Found ${users.length} users:\n`);
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. 👤 ${user.email}`);
      console.log(`   Username: ${user.username}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Active: ${user.isActive ? 'Yes' : 'No'}`);
      console.log(`   Staff ID: ${user.staffId ? 'Linked' : 'Not linked'}`);
      
      if (user.staffId && user.staffId.position) {
        console.log(`   Position: ${user.staffId.position.positionTitle}`);
        console.log(`   Permissions: ${JSON.stringify(user.staffId.position.permissions, null, 4)}`);
      } else {
        console.log(`   Position: No position assigned`);
        console.log(`   Permissions: None`);
      }
      console.log('');
    });

    // Check if we have a proper administrator
    const adminUser = users.find(user => user.role === 'Administrator');
    if (adminUser) {
      console.log('✅ Administrator user found:', adminUser.email);
      console.log('✅ System has proper admin access');
    } else {
      console.log('⚠️  No Administrator user found!');
      console.log('💡 You may want to promote an existing user or create one');
    }

  } catch (error) {
    console.error('❌ Error checking users:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Database disconnected');
    process.exit(0);
  }
}

checkUsers();