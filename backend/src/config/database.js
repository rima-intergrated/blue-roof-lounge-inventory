const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/blue_roof_lounge', {
      // These options are no longer needed in Mongoose 6+
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    
    // Listen for connection events
    mongoose.connection.on('connected', () => {
      console.log('📡 Mongoose connected to MongoDB');
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ Mongoose connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('📴 Mongoose disconnected from MongoDB');
    });

    // Graceful shutdown - commented out as it's causing issues on Windows
    // process.on('SIGINT', async () => {
    //   try {
    //     await mongoose.connection.close();
    //     console.log('🔌 MongoDB connection closed through app termination');
    //     process.exit(0);
    //   } catch (error) {
    //     console.error('❌ Error closing MongoDB connection:', error);
    //     process.exit(1);
    //   }
    // });

    // Test the connection after establishing it
    await testConnection();
    
    return conn;

  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    // In development, provide helpful connection tips
    if (process.env.NODE_ENV === 'development') {
      console.log('\n💡 Database Connection Tips:');
      console.log('   • Make sure MongoDB is running on your system');
      console.log('   • Check if the MONGODB_URI in your .env file is correct');
      console.log('   • Verify that port 27017 is available');
      console.log('   • For MongoDB Atlas, ensure your IP is whitelisted\n');
    }
    // Instead of exiting, throw error to allow graceful handling
    throw error;
  }
};

// Test database connection and operations
const testConnection = async () => {
  try {
    console.log('🔍 Testing database connection...');
    
    // Simple ping test
    await mongoose.connection.db.admin().ping();
    console.log('✅ Database ping successful');
    
    // Get database stats
    const stats = await mongoose.connection.db.stats();
    console.log(`📊 Database size: ${(stats.dataSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`🗂️  Collections: ${stats.collections}`);
    console.log(`📄 Documents: ${stats.objects}`);
    
    // List collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    if (collections.length > 0) {
      console.log('📋 Available collections:', collections.map(c => c.name).join(', '));
    } else {
      console.log('📋 No collections found (database is empty)');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    return false;
  }
};

// Test model operations
const testModels = async () => {
  try {
    console.log('\n🧪 Testing database models...');
    
    const { models } = require('../models');
    
    // Test each model's connection
    for (const [modelName, model] of Object.entries(models)) {
      try {
        const count = await model.countDocuments();
        console.log(`✅ ${modelName}: ${count} documents`);
      } catch (error) {
        console.error(`❌ ${modelName}: ${error.message}`);
      }
    }
    
    return true;
  } catch (error) {
    console.error('❌ Model test failed:', error.message);
    return false;
  }
};

// Close database connection
const closeDB = async () => {
  try {
    await mongoose.connection.close();
    console.log('📴 Database connection closed');
  } catch (error) {
    console.error('❌ Error closing database connection:', error);
  }
};

module.exports = {
  connectDB,
  testConnection,
  testModels,
  closeDB
};
