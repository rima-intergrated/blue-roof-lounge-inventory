require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Staff = require('./src/models/Staff');

console.log('🔍 Checking all users and staff in database...');

async function checkDatabase() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/blue_roof_lounge');
    console.log('✅ Database connected');
    
    // Get all users
    const users = await User.find({}).populate('staffId');
    console.log(`\n👥 Total users: ${users.length}`);
    
    users.forEach((user, index) => {
      console.log(`\n${index + 1}. User:`);
      console.log(`   ID: ${user._id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Password Setup: ${user.isPasswordSetup}`);
      console.log(`   Setup Token: ${user.passwordSetupToken ? 'Yes' : 'No'}`);
      console.log(`   Token Expires: ${user.passwordSetupExpires || 'N/A'}`);
      console.log(`   Staff: ${user.staffId ? user.staffId.name : 'No staff linked'}`);
    });
    
    // Get all staff
    const staff = await Staff.find({});
    console.log(`\n👔 Total staff: ${staff.length}`);
    
    staff.forEach((member, index) => {
      console.log(`\n${index + 1}. Staff:`);
      console.log(`   ID: ${member._id}`);
      console.log(`   Name: ${member.name}`);
      console.log(`   Email: ${member.email}`);
      console.log(`   Position: ${member.position}`);
      console.log(`   Has User Account: ${member.userId ? 'Yes' : 'No'}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    mongoose.connection.close();
  }
}

checkDatabase();