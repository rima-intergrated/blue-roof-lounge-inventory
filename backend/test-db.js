#!/usr/bin/env node

/**
 * Database Test Script for Blue Roof Lounge
 * 
 * This script tests database connectivity, model operations,
 * and provides sample data insertion for testing.
 * 
 * Usage:
 *   node test-db.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB, testConnection, testModels, closeDB } = require('./src/config/database');
const { models } = require('./src/models');

// ANSI color codes for better console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const log = (message, color = colors.reset) => {
  console.log(`${color}${message}${colors.reset}`);
};

// Test database operations
const runDatabaseTests = async () => {
  try {
    log('\n🚀 Blue Roof Lounge Database Test Suite', colors.bright);
    log('===============================================', colors.cyan);
    
    // Test 1: Connection
    log('\n📡 Test 1: Database Connection', colors.yellow);
    await connectDB();
    
    // Test 2: Basic Operations
    log('\n🔧 Test 2: Basic Database Operations', colors.yellow);
    await testConnection();
    
    // Test 3: Model Testing
    log('\n📋 Test 3: Model Testing', colors.yellow);
    await testModels();
    
    // Test 4: Sample Data Operations
    log('\n💾 Test 4: Sample Data Operations', colors.yellow);
    await testSampleOperations();
    
    // Test 5: Query Performance
    log('\n⚡ Test 5: Query Performance', colors.yellow);
    await testQueryPerformance();
    
    log('\n✅ All database tests completed successfully!', colors.green);
    
  } catch (error) {
    log(`\n❌ Database test failed: ${error.message}`, colors.red);
    console.error(error);
  } finally {
    await closeDB();
  }
};

// Test sample database operations
const testSampleOperations = async () => {
  try {
    log('   Creating sample user...', colors.blue);
    
    // Test user creation
    const testUser = new models.User({
      username: 'testuser',
      email: 'test@bluerooflounge.com',
      password: 'TestPass123',
      role: 'user'
    });
    
    const savedUser = await testUser.save();
    log(`   ✅ User created with ID: ${savedUser._id}`, colors.green);
    
    // Test user retrieval
    const retrievedUser = await models.User.findById(savedUser._id);
    log(`   ✅ User retrieved: ${retrievedUser.username}`, colors.green);
    
    // Test position creation
    log('   Creating sample position...', colors.blue);
    const testPosition = new models.Position({
      positionTitle: 'Test Manager',
      department: 'Management',
      level: 'Management',
      description: 'Test position for database testing',
      responsibilities: ['Test responsibility 1', 'Test responsibility 2'],
      salary: {
        minimum: 50000,
        maximum: 80000,
        payFrequency: 'Monthly'
      },
      createdBy: savedUser._id
    });
    
    const savedPosition = await testPosition.save();
    log(`   ✅ Position created: ${savedPosition.positionTitle}`, colors.green);
    
    // Test staff creation
    log('   Creating sample staff member...', colors.blue);
    const testStaff = new models.Staff({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@bluerooflounge.com',
      phoneNumber: '+254712345678',
      nationalId: '12345678',
      position: savedPosition._id,
      department: 'Management',
      dateOfBirth: new Date('1990-01-01'),
      salary: 60000,
      addedBy: savedUser._id
    });
    
    const savedStaff = await testStaff.save();
    log(`   ✅ Staff member created: ${savedStaff.firstName} ${savedStaff.lastName}`, colors.green);
    
    // Clean up test data
    log('   Cleaning up test data...', colors.yellow);
    await models.User.findByIdAndDelete(savedUser._id);
    await models.Position.findByIdAndDelete(savedPosition._id);
    await models.Staff.findByIdAndDelete(savedStaff._id);
    log('   ✅ Test data cleaned up', colors.green);
    
  } catch (error) {
    log(`   ❌ Sample operations failed: ${error.message}`, colors.red);
    throw error;
  }
};

// Test query performance
const testQueryPerformance = async () => {
  try {
    const startTime = Date.now();
    
    // Test multiple concurrent queries
    const promises = [
      models.User.countDocuments(),
      models.Staff.countDocuments(),
      models.Position.countDocuments(),
      models.Sale.countDocuments(),
      models.Inventory.countDocuments()
    ];
    
    const results = await Promise.all(promises);
    const endTime = Date.now();
    
    log(`   ✅ Query performance test completed in ${endTime - startTime}ms`, colors.green);
    log(`   📊 Document counts: Users(${results[0]}), Staff(${results[1]}), Positions(${results[2]}), Sales(${results[3]}), Inventory(${results[4]})`, colors.blue);
    
  } catch (error) {
    log(`   ❌ Performance test failed: ${error.message}`, colors.red);
    throw error;
  }
};

// Test database indexes
const testIndexes = async () => {
  try {
    log('\n🗂️  Test 6: Database Indexes', colors.yellow);
    
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    for (const collection of collections) {
      const indexes = await mongoose.connection.db.collection(collection.name).indexes();
      log(`   📋 ${collection.name}: ${indexes.length} indexes`, colors.blue);
      
      indexes.forEach(index => {
        const keys = Object.keys(index.key).join(', ');
        log(`      - ${index.name}: {${keys}}`, colors.cyan);
      });
    }
    
  } catch (error) {
    log(`   ❌ Index test failed: ${error.message}`, colors.red);
  }
};

// Interactive database explorer
const interactiveExplorer = async () => {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  log('\n🔍 Interactive Database Explorer', colors.bright);
  log('Available commands:', colors.yellow);
  log('  - stats: Show database statistics', colors.blue);
  log('  - collections: List all collections', colors.blue);
  log('  - count <model>: Count documents in a model', colors.blue);
  log('  - exit: Exit explorer', colors.blue);
  
  const askQuestion = () => {
    rl.question('\n> ', async (input) => {
      const [command, ...args] = input.trim().split(' ');
      
      try {
        switch (command.toLowerCase()) {
          case 'stats':
            const stats = await mongoose.connection.db.stats();
            console.log('📊 Database Statistics:');
            console.log(`   Size: ${(stats.dataSize / 1024 / 1024).toFixed(2)} MB`);
            console.log(`   Collections: ${stats.collections}`);
            console.log(`   Documents: ${stats.objects}`);
            console.log(`   Indexes: ${stats.indexes}`);
            break;
            
          case 'collections':
            const collections = await mongoose.connection.db.listCollections().toArray();
            console.log('📋 Collections:');
            collections.forEach(col => console.log(`   - ${col.name}`));
            break;
            
          case 'count':
            const modelName = args[0];
            if (models[modelName]) {
              const count = await models[modelName].countDocuments();
              console.log(`📄 ${modelName}: ${count} documents`);
            } else {
              console.log(`❌ Model '${modelName}' not found`);
              console.log('Available models:', Object.keys(models).join(', '));
            }
            break;
            
          case 'exit':
            log('👋 Goodbye!', colors.yellow);
            rl.close();
            await closeDB();
            process.exit(0);
            break;
            
          default:
            console.log('❌ Unknown command. Type "exit" to quit.');
        }
      } catch (error) {
        console.log(`❌ Error: ${error.message}`);
      }
      
      askQuestion();
    });
  };
  
  askQuestion();
};

// Main execution
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--interactive')) {
    // Start interactive mode
    connectDB().then(() => {
      interactiveExplorer();
    }).catch(console.error);
  } else {
    // Run full test suite
    runDatabaseTests();
  }
}

module.exports = {
  runDatabaseTests,
  testSampleOperations,
  testQueryPerformance,
  interactiveExplorer
};
