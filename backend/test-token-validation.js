require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

console.log('🔍 Testing token verification...');

async function testToken() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/blue_roof_lounge');
    console.log('✅ Database connected');
    
    // Test tokens from your email
    const tokens = [
      'dfe9218c78af12a4d4f41aa18d750144915fcdb431e0903b7a4d0bafbcba5b0f',
      'b8b33e92664b0c0318ff9295b8834a19512e3612b92017bf41fc8f1e00228cf0'
    ];
    
    const userIds = [
      '68e681c6cdfdc4027edd49ab',
      '68e67f64f3c0a84d7910036c'
    ];
    
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      const userId = userIds[i];
      
      console.log(`\n🔍 Testing token ${i + 1}:`);
      console.log(`Token: ${token}`);
      console.log(`UserId: ${userId}`);
      
      // Find user with matching token
      const user = await User.findOne({
        _id: userId,
        passwordSetupToken: token,
        passwordSetupExpires: { $gt: new Date() },
        isPasswordSetup: false
      }).populate('staffId');

      if (user) {
        console.log('✅ Token is valid!');
        console.log(`👤 User: ${user.email}`);
        console.log(`⏰ Expires: ${user.passwordSetupExpires}`);
        console.log(`🆔 Staff: ${user.staffId ? user.staffId.name : 'No staff linked'}`);
      } else {
        console.log('❌ Token not found or expired');
        
        // Check if user exists
        const userExists = await User.findById(userId);
        if (userExists) {
          console.log('👤 User exists but token mismatch:');
          console.log(`🔑 Stored token: ${userExists.passwordSetupToken}`);
          console.log(`⏰ Expires: ${userExists.passwordSetupExpires}`);
          console.log(`🔓 Password setup: ${userExists.isPasswordSetup}`);
        } else {
          console.log('❌ User not found');
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    mongoose.connection.close();
  }
}

testToken();