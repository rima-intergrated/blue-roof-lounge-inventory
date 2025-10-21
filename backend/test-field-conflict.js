const mongoose = require('mongoose');
const Inventory = require('./src/models/Inventory');

async function testFieldConflictResolution() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/blue_roof_lounge');
    console.log('✅ Connected to MongoDB');

    // Create a test item to verify field relationships
    const testItem = new Inventory({
      itemName: 'Test Field Conflict Item',
      itemId: 'CONFLICT-TEST-' + Date.now(),
      currentStock: 0,
      avgCostPrice: 0,
      avgSellingPrice: 0,
      totalPurchased: 0,
      description: 'Testing field conflict resolution'
    });

    await testItem.save();
    console.log('✅ Created test item');

    // Test adding stock (should update both currentStock and totalPurchased)
    console.log('\n📦 Testing stock addition...');
    console.log(`Before: currentStock=${testItem.currentStock}, totalPurchased=${testItem.totalPurchased}`);
    
    await testItem.updateStock(10, 'add', 100, 150);
    console.log(`After adding 10: currentStock=${testItem.currentStock}, totalPurchased=${testItem.totalPurchased}`);

    // Test another addition
    await testItem.updateStock(5, 'add', 120, 160);
    console.log(`After adding 5 more: currentStock=${testItem.currentStock}, totalPurchased=${testItem.totalPurchased}`);

    // Test subtraction (should only affect currentStock, not totalPurchased)
    console.log('\n🔄 Testing stock subtraction (sales/usage)...');
    await testItem.updateStock(3, 'subtract');
    console.log(`After subtracting 3: currentStock=${testItem.currentStock}, totalPurchased=${testItem.totalPurchased}`);

    // Verify the field meanings are clear
    console.log('\n📊 Field meanings verification:');
    console.log(`📦 currentStock (${testItem.currentStock}): Current available inventory`);
    console.log(`📈 totalPurchased (${testItem.totalPurchased}): Cumulative purchases ever made`);
    console.log(`💰 avgCostPrice (${testItem.avgCostPrice.toFixed(2)}): Weighted average cost price`);
    console.log(`💵 avgSellingPrice (${testItem.avgSellingPrice.toFixed(2)}): Weighted average selling price`);
    console.log(`📊 totalStockValue (${testItem.totalStockValue.toFixed(2)}): avgCostPrice × currentStock`);
    console.log(`📈 projectedProfit (${testItem.projectedProfit.toFixed(2)}): (avgSellingPrice × currentStock) - totalStockValue`);

    // Verify that totalPurchased >= currentStock (logical constraint)
    if (testItem.totalPurchased >= testItem.currentStock) {
      console.log('✅ Field relationship is correct: totalPurchased >= currentStock');
    } else {
      console.log('❌ Field relationship is incorrect: totalPurchased < currentStock');
    }

    // Clean up
    await Inventory.deleteOne({ _id: testItem._id });
    console.log('🗑️ Test item cleaned up');

  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

testFieldConflictResolution();