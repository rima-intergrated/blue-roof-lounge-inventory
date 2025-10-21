const mongoose = require('mongoose');
const Inventory = require('./src/models/Inventory');

async function testInventoryDB() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/blue_roof_lounge');
    console.log('✅ Connected to MongoDB');

    // Check if inventory collection exists and count documents
    const inventoryCount = await Inventory.countDocuments();
    console.log(`📊 Total inventory items: ${inventoryCount}`);

    // Get all inventory items
    const inventoryItems = await Inventory.find({}).limit(10);
    console.log('📋 Current inventory items:');
    inventoryItems.forEach((item, index) => {
      console.log(`${index + 1}. ${item.itemName} (${item.itemId})`);
      console.log(`   Stock: ${item.currentStock}`);
      console.log(`   Avg Cost: MK ${item.avgCostPrice || 'N/A'}`);
      console.log(`   Avg Selling: MK ${item.avgSellingPrice || 'N/A'}`);
      console.log(`   Total Quantity: ${item.totalQuantity || 'N/A'}`);
      console.log(`   Stock Value: MK ${item.totalStockValue || 'N/A'}`);
      console.log(`   Projected Profit: MK ${item.projectedProfit || 'N/A'}`);
      console.log(`   Last Updated: ${item.lastStockUpdate || item.updatedAt}`);
      console.log('   ---');
    });

    // Test creating a new inventory item
    console.log('\n🧪 Testing inventory creation...');
    const testItem = new Inventory({
      itemName: 'Test Item ' + Date.now(),
      itemId: 'TEST' + Date.now(),
      currentStock: 10,
      avgCostPrice: 100,
      avgSellingPrice: 150,
      totalQuantity: 10,
      description: 'Test inventory item'
    });

    const savedItem = await testItem.save();
    console.log('✅ Test item created successfully:');
    console.log(`   Name: ${savedItem.itemName}`);
    console.log(`   ID: ${savedItem.itemId}`);
    console.log(`   Stock Value: MK ${savedItem.totalStockValue}`);
    console.log(`   Projected Profit: MK ${savedItem.projectedProfit}`);

    // Clean up test item
    await Inventory.deleteOne({ _id: savedItem._id });
    console.log('🗑️ Test item cleaned up');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

testInventoryDB();