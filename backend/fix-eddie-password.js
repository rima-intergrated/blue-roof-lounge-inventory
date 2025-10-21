require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

console.log('🔧 Fixing Eddie Phiri password issue...');

async function fixUserPassword() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/blue_roof_lounge');
    console.log('✅ Database connected');
    
    // Find Eddie Phiri's user account
    const user = await User.findOne({ email: 'dreamlightmw@gmail.com' });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log(`\n👤 User: ${user.email}`);
    console.log(`🔓 Before fix - Password Setup: ${user.isPasswordSetup}`);
    console.log(`✅ Before fix - Is Active: ${user.isActive}`);
    console.log(`🔑 Before fix - Has Password: ${user.password ? 'Yes' : 'No'}`);
    
    // Reset the user to allow password setup again
    user.password = 'temp123'; // This will be hashed by the pre-save hook
    user.isPasswordSetup = false;
    user.isActive = false;
    
    // Generate new password setup token
    const crypto = require('crypto');
    const passwordSetupToken = crypto.randomBytes(32).toString('hex');
    user.passwordSetupToken = passwordSetupToken;
    user.passwordSetupExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    await user.save();
    
    console.log(`\n✅ User reset for password setup:`);
    console.log(`🔓 Password Setup: ${user.isPasswordSetup}`);
    console.log(`✅ Is Active: ${user.isActive}`);
    console.log(`🔑 Has Password: ${user.password ? 'Yes' : 'No'}`);
    console.log(`🎫 New Token: ${passwordSetupToken}`);
    console.log(`⏰ Token Expires: ${user.passwordSetupExpires}`);
    
    // Generate new setup URL
    const setupUrl = `http://localhost:5173/setup-password?token=${passwordSetupToken}&userId=${user._id}`;
    console.log(`\n🔗 New Password Setup URL:`);
    console.log(setupUrl);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    mongoose.connection.close();
  }
}

fixUserPassword();