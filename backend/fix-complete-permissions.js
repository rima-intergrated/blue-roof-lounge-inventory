const mongoose = require('mongoose');
require('dotenv').config();

// Complete permissions structure that should exist
const COMPLETE_PERMISSIONS = {
  sales: {
    view: false,
    create: false,
    edit: false,
    delete: false,
    add: false
  },
  inventory: {
    view: false,
    create: false,
    edit: false,
    delete: false,
    add: false
  },
  hrm: {
    view: false,
    create: false,
    edit: false,
    delete: false,
    add: false
  },
  payroll: {
    view: false,
    create: false,
    edit: false,
    delete: false,
    process: false,
    approve: false
  },
  reports: {
    view: false,
    create: false,
    edit: false,
    delete: false,
    generate: false,
    export: false
  },
  settings: {
    view: false,
    create: false,
    edit: false,
    delete: false,
    systemConfig: false
  }
};

// Connect to MongoDB with retry logic
const connectDB = async (retries = 3) => {
  for (let i = 1; i <= retries; i++) {
    try {
      console.log(`🔄 Attempt ${i}/${retries} - Connecting to MongoDB...`);
      await mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 15000,
        socketTimeoutMS: 45000,
      });
      console.log('✅ Connected to MongoDB successfully');
      return;
    } catch (error) {
      console.error(`❌ Attempt ${i} failed:`, error.message);
      if (i === retries) {
        throw error;
      }
      console.log('⏳ Waiting 5 seconds before retry...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
};

// Function to merge permissions, preserving existing values
const mergePermissions = (existing, complete) => {
  const merged = JSON.parse(JSON.stringify(complete)); // Deep clone
  
  if (existing && typeof existing === 'object') {
    for (const module in complete) {
      if (existing[module] && typeof existing[module] === 'object') {
        for (const permission in complete[module]) {
          if (existing[module][permission] !== undefined) {
            merged[module][permission] = existing[module][permission];
          }
        }
      }
    }
  }
  
  return merged;
};

// Fix function to ensure all positions have complete permissions
const fixAllPermissions = async () => {
  try {
    console.log('🚀 Starting comprehensive permissions fix...');
    console.log('📋 This script will ensure all positions have complete permission structures');
    
    // Get the positions collection directly
    const db = mongoose.connection.db;
    const positionsCollection = db.collection('positions');
    
    // Find all positions
    const allPositions = await positionsCollection.find({}).toArray();
    console.log(`📊 Found ${allPositions.length} total positions`);
    
    if (allPositions.length === 0) {
      console.log('ℹ️  No positions found in database');
      return;
    }
    
    let updatedCount = 0;
    
    for (const position of allPositions) {
      console.log(`\n🔧 Checking position: ${position.positionTitle} (${position.positionCode})`);
      
      // Check what permissions are missing
      const existing = position.permissions || {};
      const missingModules = [];
      
      for (const module in COMPLETE_PERMISSIONS) {
        if (!existing[module]) {
          missingModules.push(module);
        } else {
          // Check for missing individual permissions within module
          const missingPerms = [];
          for (const perm in COMPLETE_PERMISSIONS[module]) {
            if (existing[module][perm] === undefined) {
              missingPerms.push(perm);
            }
          }
          if (missingPerms.length > 0) {
            console.log(`  ⚠️  Missing ${module} permissions: ${missingPerms.join(', ')}`);
          }
        }
      }
      
      if (missingModules.length > 0) {
        console.log(`  ❌ Missing modules: ${missingModules.join(', ')}`);
      }
      
      // Merge existing permissions with complete structure
      const updatedPermissions = mergePermissions(existing, COMPLETE_PERMISSIONS);
      
      // Update the position
      const updateData = {
        permissions: updatedPermissions,
        updatedAt: new Date()
      };
      
      // Add missing required fields if they don't exist
      if (!position.status) {
        updateData.status = 'Active';
        console.log('  📝 Adding status: Active');
      }
      
      if (!position.maxPositions) {
        updateData.maxPositions = 1;
        console.log('  📝 Adding maxPositions: 1');
      }
      
      if (!position.currentPositions) {
        updateData.currentPositions = 0;
        console.log('  📝 Adding currentPositions: 0');
      }
      
      const result = await positionsCollection.updateOne(
        { _id: position._id },
        { $set: updateData }
      );
      
      if (result.modifiedCount > 0) {
        updatedCount++;
        console.log(`  ✅ Successfully updated ${position.positionTitle}`);
      } else {
        console.log(`  ℹ️  No changes needed for ${position.positionTitle}`);
      }
    }
    
    console.log(`\n🎉 Successfully updated ${updatedCount} positions`);
    
    // Verify the fix
    console.log('\n🔍 Verifying the fix...');
    const verifiedPositions = await positionsCollection.find({}).toArray();
    
    for (const position of verifiedPositions) {
      console.log(`\n📋 ${position.positionTitle} (${position.positionCode}):`);
      
      // Check each permission module
      for (const module in COMPLETE_PERMISSIONS) {
        const hasModule = position.permissions && position.permissions[module];
        if (hasModule) {
          const modulePerms = position.permissions[module];
          const allPermsPresent = Object.keys(COMPLETE_PERMISSIONS[module]).every(
            perm => modulePerms[perm] !== undefined
          );
          console.log(`  ${module}: ${allPermsPresent ? '✅ Complete' : '⚠️  Incomplete'}`);
        } else {
          console.log(`  ${module}: ❌ Missing`);
        }
      }
      
      // Check other required fields
      console.log(`  status: ${position.status ? '✅' : '❌'}`);
      console.log(`  maxPositions: ${position.maxPositions !== undefined ? '✅' : '❌'}`);
      console.log(`  currentPositions: ${position.currentPositions !== undefined ? '✅' : '❌'}`);
    }
    
  } catch (error) {
    console.error('❌ Error during permissions fix:', error);
    throw error;
  }
};

// Main execution
const runFix = async () => {
  try {
    await connectDB();
    await fixAllPermissions();
    console.log('\n🎊 Comprehensive permissions fix completed successfully!');
    console.log('\n💡 Next steps:');
    console.log('   1. Test position creation in your app');
    console.log('   2. Verify that staff can be assigned to positions');
    console.log('   3. Check that inventory permissions work correctly');
  } catch (error) {
    console.error('\n💥 Fix failed:', error);
    console.log('\n🔧 Troubleshooting tips:');
    console.log('   1. Check your internet connection');
    console.log('   2. Verify MONGODB_URI in .env file');
    console.log('   3. Ensure your IP is whitelisted in MongoDB Atlas');
    console.log('   4. Try running from a server environment');
  } finally {
    console.log('\n🔌 Closing database connection...');
    try {
      await mongoose.connection.close();
      console.log('👋 Database connection closed');
    } catch (closeError) {
      console.error('Error closing connection:', closeError.message);
    }
    process.exit(0);
  }
};

// Execute the fix
runFix();