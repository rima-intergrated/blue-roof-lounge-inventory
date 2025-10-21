const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { testConnection, testModels } = require('../config/database');
const { models } = require('../models');

// @desc    Test database connection
// @route   GET /api/test/connection
// @access  Public
const testDBConnection = async (req, res) => {
  try {
    const isConnected = await testConnection();
    
    if (isConnected) {
      res.json({
        success: true,
        message: 'Database connection is healthy',
        data: {
          status: 'connected',
          host: mongoose.connection.host,
          database: mongoose.connection.name,
          readyState: mongoose.connection.readyState,
          timestamp: new Date().toISOString()
        }
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Database connection test failed'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Database connection error',
      error: error.message
    });
  }
};

// @desc    Get database statistics
// @route   GET /api/test/stats
// @access  Public
const getDatabaseStats = async (req, res) => {
  try {
    const stats = await mongoose.connection.db.stats();
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    // Get document counts for each model
    const modelCounts = {};
    for (const [modelName, model] of Object.entries(models)) {
      try {
        modelCounts[modelName] = await model.countDocuments();
      } catch (error) {
        modelCounts[modelName] = `Error: ${error.message}`;
      }
    }
    
    res.json({
      success: true,
      message: 'Database statistics retrieved',
      data: {
        database: {
          name: mongoose.connection.name,
          host: mongoose.connection.host,
          size: `${(stats.dataSize / 1024 / 1024).toFixed(2)} MB`,
          collections: stats.collections,
          documents: stats.objects,
          indexes: stats.indexes
        },
        collections: collections.map(c => c.name),
        models: modelCounts,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get database statistics',
      error: error.message
    });
  }
};

// @desc    Test model operations
// @route   GET /api/test/models
// @access  Public
const testModelOperations = async (req, res) => {
  try {
    const results = {};
    
    for (const [modelName, model] of Object.entries(models)) {
      try {
        // Test basic operations
        const count = await model.countDocuments();
        const sample = await model.findOne().lean();
        
        results[modelName] = {
          status: 'success',
          documentCount: count,
          hasSampleData: !!sample,
          collection: model.collection.name
        };
      } catch (error) {
        results[modelName] = {
          status: 'error',
          error: error.message
        };
      }
    }
    
    res.json({
      success: true,
      message: 'Model operations test completed',
      data: results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Model test failed',
      error: error.message
    });
  }
};

// @desc    Create sample test data
// @route   POST /api/test/sample-data
// @access  Public
const createSampleData = async (req, res) => {
  try {
    const results = {};
    
    // Create sample user
    const sampleUser = new models.User({
      username: `testuser_${Date.now()}`,
      email: `test_${Date.now()}@example.com`,
      password: 'TestPassword123',
      role: 'user'
    });
    
    const savedUser = await sampleUser.save();
    results.user = savedUser._id;
    
    // Create sample position
    const samplePosition = new models.Position({
      positionTitle: `Test Position ${Date.now()}`,
      department: 'Management',
      level: 'Management',
      description: 'Sample position for testing',
      responsibilities: ['Sample responsibility'],
      salary: {
        minimum: 30000,
        maximum: 50000,
        payFrequency: 'Monthly'
      },
      createdBy: savedUser._id
    });
    
    const savedPosition = await samplePosition.save();
    results.position = savedPosition._id;
    
  // Create sample stock item
  const sampleStock = new models.Stock({
      itemName: `Test Item ${Date.now()}`,
      itemId: `TEST${Date.now()}`,
      category: 'Other',
      brand: 'Test Brand',
      unitOfMeasure: 'Piece',
      costPrice: 100,
      sellingPrice: 150,
      currentStock: 50,
      minimumStock: 10,
      maximumStock: 100,
      reorderLevel: 20
    });
    
  const savedStock = await sampleStock.save();
  results.stock = savedStock._id;
    
    res.json({
      success: true,
      message: 'Sample data created successfully',
      data: {
        created: results,
        note: 'Remember to clean up test data when done'
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create sample data',
      error: error.message
    });
  }
};

// @desc    Clean up test data
// @route   DELETE /api/test/cleanup
// @access  Public
const cleanupTestData = async (req, res) => {
  try {
    const results = {};
    
    // Clean up test users
    const userResult = await models.User.deleteMany({
      username: { $regex: /^testuser_/ }
    });
    results.users = userResult.deletedCount;
    
    // Clean up test positions
    const positionResult = await models.Position.deleteMany({
      positionTitle: { $regex: /^Test Position/ }
    });
    results.positions = positionResult.deletedCount;
    
  // Clean up test stock
  const stockResult = await models.Stock.deleteMany({
      itemName: { $regex: /^Test Item/ }
    });
  results.stock = stockResult.deletedCount;
    
    res.json({
      success: true,
      message: 'Test data cleaned up successfully',
      data: {
        deleted: results
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to clean up test data',
      error: error.message
    });
  }
};

// Mount the routes
router.get('/connection', testDBConnection);
router.get('/stats', getDatabaseStats);
router.get('/models', testModelOperations);
router.post('/sample-data', createSampleData);
router.delete('/cleanup', cleanupTestData);

module.exports = router;
