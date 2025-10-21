require('dotenv').config();
const mongoose = require('mongoose');
const Position = require('./src/models/Position');

console.log('🔧 Adding permissions field to existing positions...');

async function addPermissionsToPositions() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/blue_roof_lounge');
    console.log('✅ Database connected');
    
    // Get all positions
    const positions = await Position.find({});
    console.log(`\n📋 Found ${positions.length} positions`);
    
    // Default permissions structure
    const defaultPermissions = {
      sales: {
        view: false,
        create: false,
        edit: false,
        delete: false
      },
      inventory: {
        view: false,
        create: false,
        edit: false,
        delete: false
      },
      hrm: {
        view: false,
        create: false,
        edit: false,
        delete: false
      },
      payroll: {
        view: false,
        create: false,
        edit: false,
        delete: false
      },
      reports: {
        view: false,
        create: false,
        edit: false,
        delete: false
      },
      settings: {
        view: false,
        create: false,
        edit: false,
        delete: false
      }
    };
    
    // Update each position
    for (const position of positions) {
      console.log(`\n🔍 Updating position: ${position.positionTitle}`);
      console.log(`📝 Current permissions:`, position.permissions);
      
      // If permissions don't exist or are empty, add default structure
      if (!position.permissions || Object.keys(position.permissions).length === 0) {
        position.permissions = defaultPermissions;
        console.log(`➕ Added default permissions structure`);
      } else {
        // Merge existing permissions with default structure
        const updatedPermissions = { ...defaultPermissions };
        
        // Preserve existing permissions if they exist
        Object.keys(defaultPermissions).forEach(section => {
          if (position.permissions[section] && typeof position.permissions[section] === 'object') {
            updatedPermissions[section] = {
              ...defaultPermissions[section],
              ...position.permissions[section]
            };
          }
        });
        
        position.permissions = updatedPermissions;
        console.log(`🔄 Updated existing permissions structure`);
      }
      
      // Special handling for CEO - give full access
      if (position.positionTitle.toLowerCase().includes('chief executive') || 
          position.positionTitle.toLowerCase().includes('ceo')) {
        console.log(`👑 Detected CEO position - granting full access`);
        Object.keys(position.permissions).forEach(section => {
          position.permissions[section] = {
            view: true,
            create: true,
            edit: true,
            delete: true
          };
        });
      }
      
      await position.save();
      console.log(`✅ Position updated successfully`);
      console.log(`📋 Final permissions:`, JSON.stringify(position.permissions, null, 2));
    }
    
    console.log(`\n🎉 Successfully updated ${positions.length} positions with permissions!`);
    
    // Show summary
    console.log(`\n📊 Summary:`);
    const updatedPositions = await Position.find({});
    updatedPositions.forEach(pos => {
      const permCount = Object.keys(pos.permissions).reduce((count, section) => {
        return count + Object.values(pos.permissions[section]).filter(perm => perm === true).length;
      }, 0);
      console.log(`   ${pos.positionTitle}: ${permCount} permissions granted`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    mongoose.connection.close();
  }
}

addPermissionsToPositions();