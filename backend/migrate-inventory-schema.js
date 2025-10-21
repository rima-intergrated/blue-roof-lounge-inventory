const mongoose = require('mongoose');
const Inventory = require('./src/models/Inventory');

async function migrateInventorySchema() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/blue_roof_lounge');
    console.log('✅ Connected to MongoDB');

    // Find all inventory items that don't have the new fields
    const itemsToMigrate = await Inventory.find({
      $or: [
        { avgCostPrice: { $exists: false } },
        { avgSellingPrice: { $exists: false } },
        { totalQuantity: { $exists: false } },
        { totalStockValue: { $exists: false } },
        { projectedProfit: { $exists: false } },
        { lastStockUpdate: { $exists: false } }
      ]
    });

    console.log(`📊 Found ${itemsToMigrate.length} items to migrate`);

    if (itemsToMigrate.length === 0) {
      console.log('✅ All items are already migrated');
      return;
    }

    for (const item of itemsToMigrate) {
      console.log(`🔄 Migrating: ${item.itemName} (${item.itemId})`);
      
      // Set default values for new fields
      const updateData = {
        avgCostPrice: 0, // Will be set when new orders are added
        avgSellingPrice: 0, // Will be set when new orders are added
        totalQuantity: item.currentStock || 0, // Use current stock as initial total
        totalStockValue: 0, // Will be calculated by pre-save middleware
        projectedProfit: 0, // Will be calculated by pre-save middleware
        lastStockUpdate: item.updatedAt || new Date()
      };

      // Update the item
      await Inventory.updateOne(
        { _id: item._id },
        { $set: updateData }
      );

      console.log(`✅ Migrated: ${item.itemName}`);
    }

    console.log(`🎉 Successfully migrated ${itemsToMigrate.length} inventory items`);

    // Verify migration
    console.log('\n📋 Verifying migration...');
    const updatedItems = await Inventory.find({}).limit(5);
    updatedItems.forEach((item, index) => {
      console.log(`${index + 1}. ${item.itemName} (${item.itemId})`);
      console.log(`   Stock: ${item.currentStock}`);
      console.log(`   Avg Cost: MK ${item.avgCostPrice}`);
      console.log(`   Avg Selling: MK ${item.avgSellingPrice}`);
      console.log(`   Total Quantity: ${item.totalQuantity}`);
      console.log(`   Stock Value: MK ${item.totalStockValue}`);
      console.log(`   Projected Profit: MK ${item.projectedProfit}`);
      console.log(`   Last Stock Update: ${item.lastStockUpdate}`);
      console.log('   ---');
    });

  } catch (error) {
    console.error('❌ Migration error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

migrateInventorySchema();