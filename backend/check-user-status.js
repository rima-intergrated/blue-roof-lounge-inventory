const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('./src/models/User');

const checkUserStatus = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📦 Connected to MongoDB');

    // Check all users and their status
    console.log('\n🔍 Checking all users and their status...');
    
    const users = await User.find()
      .select('email username isActive passwordSetupToken')
      .sort({ email: 1 });

    console.log(`📊 Found ${users.length} users:`);
    
    for (const user of users) {
      console.log(`\n👤 ${user.email} (${user.username})`);
      console.log(`  🔓 Active: ${user.isActive}`);
      console.log(`  🔑 Password Setup Required: ${!!user.passwordSetupToken}`);
    }

    await mongoose.disconnect();
    console.log('\n✅ User status check completed');

  } catch (error) {
    console.error('❌ Error checking user status:', error);
    process.exit(1);
  }
};

checkUserStatus();