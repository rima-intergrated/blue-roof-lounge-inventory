const mongoose = require('mongoose');
require('dotenv').config();

// Position Schema (simplified for quick update)
const positionSchema = new mongoose.Schema({}, { strict: false });
const Position = mongoose.model('Position', positionSchema);

// Function to update positions with retry logic
async function fixExistingPositions() {
  const maxRetries = 3;
  let currentRetry = 0;

  while (currentRetry < maxRetries) {
    try {
      console.log(`🔄 Attempt ${currentRetry + 1}/${maxRetries} - Connecting to MongoDB...`);
      
      // Connect with additional options for better connectivity
      await mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 15000, // 15 seconds
        socketTimeoutMS: 30000, // 30 seconds
        connectTimeoutMS: 15000, // 15 seconds
        maxPoolSize: 5,
        retryWrites: true,
        w: 'majority'
      });
      
      console.log('✅ Connected to MongoDB');

      // Get all positions
      console.log('📋 Fetching all positions...');
      const positions = await Position.find({}).lean();
      console.log(`📊 Found ${positions.length} positions`);

      if (positions.length === 0) {
        console.log('ℹ️  No positions found to update');
        return;
      }

      console.log('\n🔍 Current positions:');
      positions.forEach((pos, index) => {
        console.log(`${index + 1}. ${pos.positionTitle} (${pos.positionCode || 'No code'})`);
        console.log(`   - Has department: ${!!pos.department}`);
        console.log(`   - Has level: ${!!pos.level}`);
        console.log(`   - Has status: ${!!pos.status}`);
        console.log(`   - Has maxPositions: ${pos.maxPositions !== undefined}`);
        console.log(`   - Has currentPositions: ${pos.currentPositions !== undefined}`);
        console.log('');
      });

      console.log('🔧 Starting bulk position updates...');

      // Define the updates to apply to all positions that are missing fields
      const bulkUpdates = [];

      for (const position of positions) {
        const updates = {};
        let hasUpdates = false;

        // Add missing required fields
        if (!position.department) {
          // Smart department assignment based on position title
          const title = (position.positionTitle || '').toLowerCase();
          if (title.includes('manager') || title.includes('director')) {
            updates.department = 'Management';
          } else if (title.includes('cashier') || title.includes('sales')) {
            updates.department = 'Sales';
          } else if (title.includes('cook') || title.includes('chef') || title.includes('kitchen')) {
            updates.department = 'Kitchen';
          } else if (title.includes('server') || title.includes('waiter') || title.includes('waitress')) {
            updates.department = 'Service';
          } else if (title.includes('clean') || title.includes('maintenance')) {
            updates.department = 'Operations';
          } else {
            updates.department = 'General';
          }
          hasUpdates = true;
        }

        if (!position.level) {
          const title = (position.positionTitle || '').toLowerCase();
          if (title.includes('manager') || title.includes('director') || title.includes('supervisor')) {
            updates.level = 'Management';
          } else if (title.includes('senior') || title.includes('lead')) {
            updates.level = 'Senior Staff';
          } else if (title.includes('junior') || title.includes('trainee')) {
            updates.level = 'Junior Staff';
          } else {
            updates.level = 'Staff';
          }
          hasUpdates = true;
        }

        if (!position.description) {
          updates.description = `${position.positionTitle || 'Staff'} position`;
          hasUpdates = true;
        }

        if (!position.status) {
          updates.status = 'Active';
          hasUpdates = true;
        }

        if (position.maxPositions === undefined || position.maxPositions === null) {
          updates.maxPositions = 1;
          hasUpdates = true;
        }

        if (position.currentPositions === undefined || position.currentPositions === null) {
          updates.currentPositions = 0;
          hasUpdates = true;
        }

        // Add basic structure fields if missing
        if (!position.responsibilities) {
          updates.responsibilities = ['General duties and responsibilities'];
          hasUpdates = true;
        }

        if (!position.requirements) {
          updates.requirements = {
            education: ['High school diploma'],
            experience: { minimum: 0, preferred: 1 },
            skills: ['Basic skills'],
            certifications: []
          };
          hasUpdates = true;
        }

        if (!position.salary) {
          updates.salary = {
            minimum: 30000,
            maximum: 50000,
            currency: 'KES',
            payFrequency: 'Monthly'
          };
          hasUpdates = true;
        }

        if (!position.workSchedule) {
          updates.workSchedule = {
            type: 'Full-time',
            hoursPerWeek: 40,
            shifts: []
          };
          hasUpdates = true;
        }

        if (!position.reportingStructure) {
          updates.reportingStructure = { manages: [] };
          hasUpdates = true;
        }

        if (!position.benefits) {
          updates.benefits = [];
          hasUpdates = true;
        }

        // Add basic permissions structure if missing
        if (!position.permissions) {
          updates.permissions = {
            sales: { view: false, create: false, edit: false, delete: false, add: false },
            inventory: { view: false, create: false, edit: false, delete: false, add: false },
            hrm: { view: false, create: false, edit: false, delete: false, add: false },
            payroll: { view: false, create: false, edit: false, delete: false, process: false, approve: false },
            reports: { view: false, create: false, edit: false, delete: false, generate: false, export: false },
            settings: { view: false, create: false, edit: false, delete: false, systemConfig: false }
          };
          hasUpdates = true;
        }

        if (hasUpdates) {
          bulkUpdates.push({
            updateOne: {
              filter: { _id: position._id },
              update: { $set: updates }
            }
          });
        }
      }

      if (bulkUpdates.length > 0) {
        console.log(`🔄 Executing bulk update for ${bulkUpdates.length} positions...`);
        const result = await Position.bulkWrite(bulkUpdates);
        console.log(`✅ Bulk update completed: ${result.modifiedCount} positions updated`);
      } else {
        console.log('ℹ️  All positions already have the required fields');
      }

      // Verify the updates
      console.log('\n🔍 Verifying updated positions:');
      const verifyPositions = await Position.find({}).lean();
      console.log(`📊 Total positions: ${verifyPositions.length}`);
      
      verifyPositions.forEach((pos, index) => {
        console.log(`${index + 1}. ${pos.positionTitle}`);
        console.log(`   - Department: ${pos.department || 'MISSING'}`);
        console.log(`   - Level: ${pos.level || 'MISSING'}`);
        console.log(`   - Status: ${pos.status || 'MISSING'}`);
        console.log(`   - Max/Current: ${pos.maxPositions}/${pos.currentPositions}`);
        console.log('');
      });

      console.log('✅ Database fix completed successfully!');
      console.log('🚀 Positions should now be compatible with filtering logic!');
      
      break; // Exit retry loop on success

    } catch (error) {
      currentRetry++;
      console.error(`❌ Attempt ${currentRetry} failed:`, error.message);
      
      if (currentRetry >= maxRetries) {
        console.error('💥 All retry attempts failed');
        throw error;
      } else {
        console.log(`⏳ Waiting 5 seconds before retry...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    } finally {
      if (mongoose.connection.readyState === 1) {
        console.log('🔌 Closing database connection...');
        await mongoose.connection.close();
        console.log('👋 Database connection closed');
      }
    }
  }
}

// Run the fix
console.log('🚀 Starting enhanced position database fix...');
console.log('📋 This script will add missing fields to existing positions');
console.log('🔄 Using retry logic for better connectivity');
console.log('');

fixExistingPositions()
  .then(() => {
    console.log('🎊 Database fix completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Database fix failed:', error);
    console.log('');
    console.log('🔧 Alternative solutions:');
    console.log('1. Check your internet connection');
    console.log('2. Try connecting from MongoDB Compass first');
    console.log('3. Contact your database administrator');
    console.log('4. Consider running this script from a server environment');
    process.exit(1);
  });