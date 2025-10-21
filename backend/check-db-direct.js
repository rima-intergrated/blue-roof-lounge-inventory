const mongoose = require('mongoose');

async function checkDatabase() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/blue_roof_lounge');
    console.log('✅ Connected to MongoDB');
    
    // Get the database
    const db = mongoose.connection.db;
    
    // List all collections
    console.log('\n📁 Collections in database:');
    const collections = await db.listCollections().toArray();
    collections.forEach(col => {
      console.log(`   - ${col.name}`);
    });
    
    // Check users collection specifically
    console.log('\n👥 Users Collection Data:');
    const usersCollection = db.collection('users');
    
    // Count documents
    const count = await usersCollection.countDocuments();
    console.log(`📊 Total users: ${count}`);
    
    if (count > 0) {
      console.log('\n📋 All users in database:');
      const users = await usersCollection.find({}).toArray();
      
      users.forEach((user, index) => {
        console.log(`\n👤 User ${index + 1}:`);
        console.log(`   ID: ${user._id}`);
        console.log(`   Username: ${user.username}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Created: ${user.createdAt}`);
        console.log(`   Active: ${user.isActive}`);
        console.log(`   Password Hash: ${user.password ? 'Yes (hidden)' : 'No'}`);
      });
      
      console.log('\n🔍 Raw JSON Data:');
      console.log(JSON.stringify(users, null, 2));
    } else {
      console.log('❌ No users found in database');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n📴 Disconnected from MongoDB');
  }
}

checkDatabase();
