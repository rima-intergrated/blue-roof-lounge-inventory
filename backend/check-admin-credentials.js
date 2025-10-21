const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('./src/models/User');

const checkAdminCredentials = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📦 Connected to MongoDB');

    // Find admin users
    const adminUsers = await User.find({ 
      $or: [
        { email: 'admin@bluerooflounge.com' },
        { email: 'test@bluerooflounge.com' }
      ]
    }).select('email username password isActive');

    for (const user of adminUsers) {
      console.log(`\n👤 ${user.email} (${user.username})`);
      console.log(`🔓 Active: ${user.isActive}`);
      
      // Test common passwords
      const passwords = ['newpassword123', 'admin123', 'password', 'admin'];
      
      for (const pwd of passwords) {
        try {
          const isMatch = await bcrypt.compare(pwd, user.password);
          if (isMatch) {
            console.log(`✅ Password found: ${pwd}`);
            break;
          }
        } catch (err) {
          // Continue checking
        }
      }
    }

    await mongoose.disconnect();
    console.log('\n✅ Admin check completed');

  } catch (error) {
    console.error('❌ Error checking admin:', error);
    process.exit(1);
  }
};

checkAdminCredentials();