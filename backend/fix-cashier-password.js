const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('./src/models/User');

const fixCashierPassword = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📦 Connected to MongoDB');

    // Find the dreamlightmw user
    const user = await User.findOne({ email: 'dreamlightmw@gmail.com' });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log(`👤 Found user: ${user.email}`);
    console.log(`🔓 Currently active: ${user.isActive}`);

    // Set a known password
    const newPassword = 'cashier123';
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update user
    await User.findByIdAndUpdate(user._id, {
      password: hashedPassword,
      isActive: true,
      passwordSetupToken: null,
      passwordSetupExpires: null
    });

    console.log(`✅ Updated user password to: ${newPassword}`);
    console.log(`✅ Activated user account`);

    await mongoose.disconnect();
    console.log('\n✅ Cashier user fixed for testing');

  } catch (error) {
    console.error('❌ Error fixing cashier user:', error);
    process.exit(1);
  }
};

fixCashierPassword();