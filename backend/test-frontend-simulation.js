const mongoose = require('mongoose');
const Inventory = require('./src/models/Inventory');

async function testInventoryCreationWithAPI() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/blue_roof_lounge');
    console.log('✅ Connected to MongoDB');

    // Simulate the data that would come from the NewOrder.jsx form
    const newItemData = {
      itemName: 'Frontend Test Item ' + Date.now(),
      itemId: 'FE-TEST-' + Date.now(),
      description: 'Test item from frontend simulation',
      currentStock: 25,
      avgCostPrice: 80,
      avgSellingPrice: 120,
      totalPurchased: 25
    };

    console.log('📦 Creating item with data:', newItemData);

    const newItem = new Inventory(newItemData);
    await newItem.save();

    console.log('✅ Item created successfully!');
    console.log('📋 Saved item details:');
    console.log(`   Name: ${newItem.itemName}`);
    console.log(`   ID: ${newItem.itemId}`);
    console.log(`   Current Stock: ${newItem.currentStock}`);
    console.log(`   Total Purchased: ${newItem.totalPurchased}`);
    console.log(`   Avg Cost Price: MK${newItem.avgCostPrice.toFixed(2)}`);
    console.log(`   Avg Selling Price: MK${newItem.avgSellingPrice.toFixed(2)}`);
    console.log(`   Total Stock Value: MK${newItem.totalStockValue.toFixed(2)}`);
    console.log(`   Projected Profit: MK${newItem.projectedProfit.toFixed(2)}`);
    console.log(`   Last Stock Update: ${newItem.lastStockUpdate}`);

    // Test adding more stock to existing item
    console.log('\n📦 Adding more stock to existing item...');
    await newItem.updateStock(10, 'add', 90, 130);
    
    console.log('📋 After adding 10 more units:');
    console.log(`   Current Stock: ${newItem.currentStock}`);
    console.log(`   Total Purchased: ${newItem.totalPurchased}`);
    console.log(`   New Avg Cost Price: MK${newItem.avgCostPrice.toFixed(2)}`);
    console.log(`   New Avg Selling Price: MK${newItem.avgSellingPrice.toFixed(2)}`);
    console.log(`   New Total Stock Value: MK${newItem.totalStockValue.toFixed(2)}`);
    console.log(`   New Projected Profit: MK${newItem.projectedProfit.toFixed(2)}`);

    // Verify field relationships
    console.log('\n✅ Field relationship checks:');
    console.log(`   totalPurchased (${newItem.totalPurchased}) >= currentStock (${newItem.currentStock}): ${newItem.totalPurchased >= newItem.currentStock ? '✅' : '❌'}`);
    console.log(`   totalStockValue calculation: ${newItem.avgCostPrice.toFixed(2)} × ${newItem.currentStock} = ${(newItem.avgCostPrice * newItem.currentStock).toFixed(2)} ${newItem.totalStockValue.toFixed(2) == (newItem.avgCostPrice * newItem.currentStock).toFixed(2) ? '✅' : '❌'}`);

    // Clean up
    await Inventory.deleteOne({ _id: newItem._id });
    console.log('🗑️ Test item cleaned up');

  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

testInventoryCreationWithAPI();