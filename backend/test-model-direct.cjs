// Simple test without authentication to check controller logic
const DeliveryNotesReceipts = require('./src/models/DeliveryNotesReceipts');
const mongoose = require('mongoose');
require('dotenv').config();

async function testDeliveryModelDirectly() {
  try {
    console.log('🧪 Testing delivery model directly...');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/blue_roof_lounge');
    console.log('✅ Connected to database');
    
    // Create a test document directly
    const testDocument = new DeliveryNotesReceipts({
      inventoryItemId: new mongoose.Types.ObjectId(), // Create a new valid ObjectId
      itemName: 'Test Item Direct',
      itemId: 'TEST-DIRECT-001',
      fileName: 'test-file.txt',
      originalName: 'test-file.txt',
      filePath: '/fake/path/test-file.txt',
      fileSize: 1024,
      mimeType: 'text/plain',
      description: 'Direct model test',
      uploadedBy: {
        userId: new mongoose.Types.ObjectId(),
        userName: 'Test User',
        userEmail: 'test@example.com'
      },
      orderDetails: {
        quantity: 5,
        costPrice: 10.00,
        sellingPrice: 15.00,
        deliveryNote: 'Direct test delivery note'
      },
      transactionId: 'TEST-DIRECT-' + Date.now()
    });
    
    const savedDoc = await testDocument.save();
    console.log('✅ Document saved directly to database!');
    console.log('📄 Document ID:', savedDoc._id);
    
    // Check if it's in the collection
    const count = await DeliveryNotesReceipts.countDocuments();
    console.log('📊 Total documents in collection:', count);
    
    // List all documents
    const allDocs = await DeliveryNotesReceipts.find().limit(5);
    console.log('📋 Documents in collection:');
    allDocs.forEach((doc, index) => {
      console.log(`  ${index + 1}. ${doc.originalName} - ${doc.itemName} (${doc.transactionId})`);
    });
    
    await mongoose.disconnect();
    console.log('✅ Test completed');
    
  } catch (error) {
    console.error('❌ Direct model test failed:', error);
  }
}

testDeliveryModelDirectly();