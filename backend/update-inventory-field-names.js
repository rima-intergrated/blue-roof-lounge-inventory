const mongoose = require('mongoose');
const Inventory = require('./src/models/Inventory');

async function updateInventoryFieldNames() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/blue_roof_lounge');
    console.log('✅ Connected to MongoDB');

    // Rename totalQuantity to totalPurchased for all documents
    const result = await mongoose.connection.db.collection('inventories').updateMany(
      { totalQuantity: { $exists: true } },
      { $rename: { "totalQuantity": "totalPurchased" } }
    );

    console.log(`✅ Renamed totalQuantity to totalPurchased in ${result.modifiedCount} documents`);

    // Verify the update
    const updatedItems = await Inventory.find({}).limit(5);
    console.log('\n📋 Verifying field name change...');
    updatedItems.forEach((item, index) => {
      console.log(`${index + 1}. ${item.itemName} (${item.itemId})`);
      console.log(`   Current Stock: ${item.currentStock}`);
      console.log(`   Total Purchased: ${item.totalPurchased || 'N/A'}`);
      console.log(`   Avg Cost: MK ${item.avgCostPrice}`);
      console.log(`   Avg Selling: MK ${item.avgSellingPrice}`);
      console.log('   ---');
    });

  } catch (error) {
    console.error('❌ Update error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

updateInventoryFieldNames();