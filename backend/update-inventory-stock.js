// Script to update all inventory items to include currentStock field
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/blue_roof_db'; // Change if needed
const Inventory = require('./src/models/Inventory');

async function updateInventoryStock() {
  try {
    await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    const result = await Inventory.updateMany(
      { currentStock: { $exists: false } },
      { $set: { currentStock: 0 } }
    );
    console.log(`Updated ${result.modifiedCount || result.nModified} inventory items.`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error updating inventory:', err);
    process.exit(1);
  }
}

updateInventoryStock();
