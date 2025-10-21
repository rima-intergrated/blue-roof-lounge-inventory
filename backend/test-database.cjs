// Test database connection and check collections
const mongoose = require('mongoose');
require('dotenv').config();

async function testDatabaseConnection() {
  try {
    console.log('🔍 Testing database connection...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/blue_roof_lounge');
    console.log('✅ Connected to MongoDB');
    
    // List all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📋 Available collections:');
    collections.forEach(col => {
      console.log(`  - ${col.name}`);
    });
    
    // Check attachments collection
    const attachmentsCount = await mongoose.connection.db.collection('attachments').countDocuments();
    console.log(`📎 Attachments collection: ${attachmentsCount} documents`);
    
    // Check delivery notes receipts collection
    const deliveryCount = await mongoose.connection.db.collection('deliverynotesreceipts').countDocuments();
    console.log(`📄 DeliveryNotesReceipts collection: ${deliveryCount} documents`);
    
    // Check inventories collection
    const inventoryCount = await mongoose.connection.db.collection('inventories').countDocuments();
    console.log(`📦 Inventories collection: ${inventoryCount} documents`);
    
    // Sample some attachments if they exist
    if (attachmentsCount > 0) {
      console.log('\n📎 Sample attachments:');
      const sampleAttachments = await mongoose.connection.db.collection('attachments').find().limit(3).toArray();
      sampleAttachments.forEach((att, index) => {
        console.log(`  ${index + 1}. ${att.originalName || att.fileName} (Entity: ${att.entityType}/${att.entityId})`);
      });
    }
    
    // Sample some inventories if they exist
    if (inventoryCount > 0) {
      console.log('\n📦 Sample inventories:');
      const sampleInventories = await mongoose.connection.db.collection('inventories').find().limit(3).toArray();
      sampleInventories.forEach((inv, index) => {
        console.log(`  ${index + 1}. ${inv.itemName} (Stock: ${inv.currentStock}, Attachments: ${inv.attachments?.length || 0})`);
      });
    }
    
    await mongoose.disconnect();
    console.log('\n✅ Database test completed');
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
  }
}

testDatabaseConnection();