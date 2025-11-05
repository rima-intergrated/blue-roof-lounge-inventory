const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    throw error;
  }
};

// Fix function to add missing inventory permissions
const fixInventoryPermissions = async () => {
  try {
    console.log('🚀 Starting inventory permissions fix...');
    console.log('📋 This script will add missing inventory permissions to existing positions');
    
    // Get the positions collection directly
    const db = mongoose.connection.db;
    const positionsCollection = db.collection('positions');
    
    // Find positions missing inventory permissions
    const positionsWithoutInventory = await positionsCollection.find({
      'permissions.inventory': { $exists: false }
    }).toArray();
    
    console.log(`📊 Found ${positionsWithoutInventory.length} positions without inventory permissions`);
    
    if (positionsWithoutInventory.length === 0) {
      console.log('✅ All positions already have inventory permissions!');
      return;
    }
    
    // Update each position to add inventory permissions
    let updatedCount = 0;
    
    for (const position of positionsWithoutInventory) {
      console.log(`🔧 Fixing position: ${position.positionTitle} (${position.positionCode})`);
      
      const result = await positionsCollection.updateOne(
        { _id: position._id },
        {
          $set: {
            'permissions.inventory': {
              view: false,
              create: false,
              edit: false,
              delete: false,
              add: false
            },
            updatedAt: new Date()
          }
        }
      );
      
      if (result.modifiedCount > 0) {
        updatedCount++;
        console.log(`✅ Successfully added inventory permissions to ${position.positionTitle}`);
      } else {
        console.log(`⚠️  No changes made to ${position.positionTitle}`);
      }
    }
    
    console.log(`🎉 Successfully updated ${updatedCount} positions with inventory permissions`);
    
    // Verify the fix
    console.log('🔍 Verifying the fix...');
    const allPositions = await positionsCollection.find({}).toArray();
    
    for (const position of allPositions) {
      const hasInventory = position.permissions && position.permissions.inventory;
      console.log(`📋 ${position.positionTitle}: ${hasInventory ? '✅ Has inventory permissions' : '❌ Missing inventory permissions'}`);
    }
    
  } catch (error) {
    console.error('❌ Error during inventory permissions fix:', error);
    throw error;
  }
};

// Main execution
const runFix = async () => {
  try {
    await connectDB();
    await fixInventoryPermissions();
    console.log('🎊 Inventory permissions fix completed successfully!');
  } catch (error) {
    console.error('💥 Fix failed:', error);
    process.exit(1);
  } finally {
    console.log('🔌 Closing database connection...');
    await mongoose.connection.close();
    console.log('👋 Database connection closed');
    process.exit(0);
  }
};

// Execute the fix
runFix();