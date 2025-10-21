const mongoose = require('mongoose');

// Import all models
const User = require('./User');
const Staff = require('./Staff');
const Sale = require('./Sale');
const Stock = require('./Stock');
const Payroll = require('./Payroll');
const Supplier = require('./Supplier');
const Position = require('./Position');
const Attachment = require('./Attachment');
const DeliveryNotesReceipts = require('./DeliveryNotesReceipts');
// const Category = require('./Category');

/**
 * Initialize database indexes for all models
 * This should be called after database connection is established
 */
const initializeIndexes = async () => {
  try {
    console.log('🔄 Creating database indexes...');
    
    // Create indexes for all models
    await Promise.all([
      User.createIndexes(),
      Staff.createIndexes(),
      Sale.createIndexes(),
    Stock.createIndexes(),
    Payroll.createIndexes(),
    Supplier.createIndexes(),
    Position.createIndexes(),
    DeliveryNotesReceipts.createIndexes(),
    // Category.createIndexes(),
    ]);
    
    console.log('✅ Database indexes created successfully');
    
    // Log index information for each collection
    const collections = [
      { name: 'users', model: User },
      { name: 'staff', model: Staff },
      { name: 'sales', model: Sale },
  { name: 'stock', model: Stock },
      { name: 'payrolls', model: Payroll },
      { name: 'suppliers', model: Supplier },
      { name: 'positions', model: Position },
      { name: 'categories', model: Category }
    ];
    
    for (const collection of collections) {
      const indexes = await collection.model.collection.getIndexes();
      console.log(`📊 ${collection.name} collection indexes:`, Object.keys(indexes));
    }
    
  } catch (error) {
    console.error('❌ Error creating database indexes:', error);
    throw error;
  }
};

/**
 * Drop all indexes for a fresh start (use with caution in production)
 */
const dropAllIndexes = async () => {
  try {
    console.log('🗑️  Dropping all database indexes...');
    
  const collections = [User, Staff, Sale, Stock, Payroll, Supplier, Position, Category];
    
    await Promise.all(
      collections.map(async (model) => {
        try {
          await model.collection.dropIndexes();
          console.log(`✅ Dropped indexes for ${model.modelName}`);
        } catch (error) {
          // Ignore errors for collections that don't exist yet
          if (error.code !== 26) { // 26 = NamespaceNotFound
            throw error;
          }
        }
      })
    );
    
    console.log('✅ All indexes dropped successfully');
  } catch (error) {
    console.error('❌ Error dropping indexes:', error);
    throw error;
  }
};

/**
 * Get database statistics including index usage
 */
const getDatabaseStats = async () => {
  try {
    const db = mongoose.connection.db;
    const stats = await db.stats();
    
    console.log('📊 Database Statistics:');
    console.log(`Collections: ${stats.collections}`);
    console.log(`Data Size: ${(stats.dataSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Index Size: ${(stats.indexSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Storage Size: ${(stats.storageSize / 1024 / 1024).toFixed(2)} MB`);
    
    return stats;
  } catch (error) {
    console.error('❌ Error getting database stats:', error);
    throw error;
  }
};

module.exports = {
  initializeIndexes,
  dropAllIndexes,
  getDatabaseStats,
  models: {
    User,
    Staff,
    Sale,
    Stock,
    Payroll,
    Supplier,
    Position,
    Attachment
  }
};
