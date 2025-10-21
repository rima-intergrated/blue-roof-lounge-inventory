require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const bcrypt = require('bcryptjs');

console.log('🔍 Testing password hashing issue...');

async function testPasswordHashing() {
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
    console.log(`🔓 Password Setup: ${user.isPasswordSetup}`);
    console.log(`✅ Is Active: ${user.isActive}`);
    console.log(`🔑 Has Password: ${user.password ? 'Yes' : 'No'}`);
    
    if (user.password) {
      console.log(`🔑 Password Hash: ${user.password.substring(0, 20)}...`);
    } else {
      console.log('❌ No password found in database');
      return;
    }
    
    // Test the password that was set during password setup
    const testPassword = 'test123'; // Replace with the actual password you set
    
    console.log(`\n🧪 Testing password verification...`);
    console.log(`📝 Testing password: "${testPassword}"`);
    
    // Test with bcrypt.compare directly
    const directCompare = await bcrypt.compare(testPassword, user.password);
    console.log(`🔧 Direct bcrypt.compare: ${directCompare}`);
    
    // Test with user model method
    const modelMethod = await user.matchPassword(testPassword);
    console.log(`🏗️ User.matchPassword method: ${modelMethod}`);
    
    // Test if password is double-hashed by checking if the stored hash looks like a bcrypt hash
    const isValidBcryptHash = user.password.startsWith('$2b$') || user.password.startsWith('$2a$');
    console.log(`🔍 Is valid bcrypt hash format: ${isValidBcryptHash}`);
    
    if (!directCompare && !modelMethod) {
      console.log('❌ Password verification failed - likely double-hashed');
      console.log('💡 Need to reset the password to fix the issue');
    } else {
      console.log('✅ Password verification successful');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    mongoose.connection.close();
  }
}

testPasswordHashing();