const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function testLogin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/blue_roof_lounge');
    console.log('✅ Connected to MongoDB');
    
    const User = require('./src/models/User');
    
    // First, let's see all users
    const users = await User.find({}).select('name email role username');
    console.log('\n🔍 EXISTING USERS:');
    console.log('='.repeat(50));
    
    if (users.length > 0) {
      users.forEach((user, index) => {
        console.log(`${index + 1}. 👤 Name: ${user.name || 'N/A'}`);
        console.log(`   📧 Email: ${user.email}`);
        console.log(`   👤 Username: ${user.username || 'N/A'}`);
        console.log(`   🏷️  Role: ${user.role || 'user'}`);
        console.log('');
      });
    } else {
      console.log('❌ No users found');
      
      // Create a test user
      console.log('\n🔧 Creating a test user...');
      const testUser = new User({
        name: 'Test User',
        email: 'test@blueroof.com',
        username: 'testuser',
        password: await bcrypt.hash('test123', 10),
        role: 'admin'
      });
      
      await testUser.save();
      console.log('✅ Test user created!');
      console.log('📧 Email: test@blueroof.com');
      console.log('🔑 Password: test123');
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  process.exit(0);
}

testLogin();