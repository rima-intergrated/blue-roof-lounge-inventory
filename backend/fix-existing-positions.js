const mongoose = require('mongoose');
require('dotenv').config();

// Position Schema (matching the current structure)
const positionSchema = new mongoose.Schema({
  positionTitle: { type: String, required: true, trim: true, unique: true },
  positionCode: { type: String, required: true, trim: true, unique: true, uppercase: true },
  department: { type: String, default: 'General' },
  level: { type: String, default: 'Staff' },
  description: { type: String, default: '' },
  responsibilities: [{ type: String }],
  requirements: {
    education: [{ type: String }],
    experience: {
      minimum: { type: Number, default: 0 },
      preferred: { type: Number, default: 1 }
    },
    skills: [{ type: String }],
    certifications: [{ type: String }]
  },
  salary: {
    minimum: { type: Number, default: 30000 },
    maximum: { type: Number, default: 50000 },
    currency: { type: String, default: 'KES' },
    payFrequency: { type: String, default: 'Monthly' }
  },
  benefits: [{ type: String }],
  permissions: {
    sales: { 
      view: { type: Boolean, default: false },
      create: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
      add: { type: Boolean, default: false }
    },
    inventory: {
      view: { type: Boolean, default: false },
      create: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
      add: { type: Boolean, default: false }
    },
    hrm: {
      view: { type: Boolean, default: false },
      create: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
      add: { type: Boolean, default: false }
    },
    payroll: {
      view: { type: Boolean, default: false },
      create: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
      process: { type: Boolean, default: false },
      approve: { type: Boolean, default: false }
    },
    reports: {
      view: { type: Boolean, default: false },
      create: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
      generate: { type: Boolean, default: false },
      export: { type: Boolean, default: false }
    },
    settings: {
      view: { type: Boolean, default: false },
      create: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
      systemConfig: { type: Boolean, default: false }
    }
  },
  workSchedule: {
    type: { type: String, default: 'Full-time' },
    hoursPerWeek: { type: Number, default: 40 },
    shifts: [{ type: String }]
  },
  reportingStructure: {
    manages: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Position' }]
  },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  maxPositions: { type: Number, default: 1 },
  currentPositions: { type: Number, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

const Position = mongoose.model('Position', positionSchema);

// Function to update positions
async function fixExistingPositions() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get all positions
    console.log('📋 Fetching all positions...');
    const positions = await Position.find({});
    console.log(`📊 Found ${positions.length} positions`);

    if (positions.length === 0) {
      console.log('ℹ️  No positions found to update');
      return;
    }

    console.log('\n🔍 Current positions:');
    positions.forEach((pos, index) => {
      console.log(`${index + 1}. ${pos.positionTitle} (${pos.positionCode})`);
      console.log(`   - Has department: ${!!pos.department}`);
      console.log(`   - Has level: ${!!pos.level}`);
      console.log(`   - Has description: ${!!pos.description}`);
      console.log(`   - Has maxPositions: ${!!pos.maxPositions}`);
      console.log(`   - Has currentPositions: ${pos.currentPositions !== undefined}`);
      console.log(`   - Has status: ${!!pos.status}`);
      console.log('');
    });

    console.log('🔧 Starting position updates...');

    // Update each position with missing fields
    const updatePromises = positions.map(async (position) => {
      const updates = {};
      let hasUpdates = false;

      // Add department if missing
      if (!position.department) {
        // Set department based on position title or default to 'General'
        if (position.positionTitle.toLowerCase().includes('manager')) {
          updates.department = 'Management';
        } else if (position.positionTitle.toLowerCase().includes('cashier')) {
          updates.department = 'Sales';
        } else if (position.positionTitle.toLowerCase().includes('cook')) {
          updates.department = 'Kitchen';
        } else if (position.positionTitle.toLowerCase().includes('server') || position.positionTitle.toLowerCase().includes('waiter')) {
          updates.department = 'Service';
        } else {
          updates.department = 'General';
        }
        hasUpdates = true;
      }

      // Add level if missing
      if (!position.level) {
        if (position.positionTitle.toLowerCase().includes('manager') || position.positionTitle.toLowerCase().includes('director')) {
          updates.level = 'Management';
        } else if (position.positionTitle.toLowerCase().includes('senior')) {
          updates.level = 'Senior Staff';
        } else if (position.positionTitle.toLowerCase().includes('junior')) {
          updates.level = 'Junior Staff';
        } else {
          updates.level = 'Staff';
        }
        hasUpdates = true;
      }

      // Add description if missing
      if (!position.description) {
        updates.description = `${position.positionTitle} position`;
        hasUpdates = true;
      }

      // Add responsibilities if missing
      if (!position.responsibilities || position.responsibilities.length === 0) {
        updates.responsibilities = ['General duties and responsibilities'];
        hasUpdates = true;
      }

      // Add requirements if missing
      if (!position.requirements) {
        updates.requirements = {
          education: ['High school diploma'],
          experience: {
            minimum: 0,
            preferred: 1
          },
          skills: ['Basic skills'],
          certifications: []
        };
        hasUpdates = true;
      }

      // Add salary if missing
      if (!position.salary) {
        updates.salary = {
          minimum: 30000,
          maximum: 50000,
          currency: 'KES',
          payFrequency: 'Monthly'
        };
        hasUpdates = true;
      }

      // Add benefits if missing
      if (!position.benefits) {
        updates.benefits = [];
        hasUpdates = true;
      }

      // Add workSchedule if missing
      if (!position.workSchedule) {
        updates.workSchedule = {
          type: 'Full-time',
          hoursPerWeek: 40,
          shifts: []
        };
        hasUpdates = true;
      }

      // Add reportingStructure if missing
      if (!position.reportingStructure) {
        updates.reportingStructure = {
          manages: []
        };
        hasUpdates = true;
      }

      // Add status if missing (VERY IMPORTANT for filtering)
      if (!position.status) {
        updates.status = 'Active';
        hasUpdates = true;
      }

      // Add maxPositions if missing
      if (position.maxPositions === undefined || position.maxPositions === null) {
        updates.maxPositions = 1;
        hasUpdates = true;
      }

      // Add currentPositions if missing
      if (position.currentPositions === undefined || position.currentPositions === null) {
        updates.currentPositions = 0;
        hasUpdates = true;
      }

      if (hasUpdates) {
        console.log(`🔄 Updating position: ${position.positionTitle}`);
        console.log(`   Fields to add: ${Object.keys(updates).join(', ')}`);
        
        const result = await Position.findByIdAndUpdate(
          position._id,
          { $set: updates },
          { new: true, runValidators: true }
        );

        console.log(`✅ Updated position: ${result.positionTitle}`);
        return result;
      } else {
        console.log(`ℹ️  Position "${position.positionTitle}" already has all required fields`);
        return position;
      }
    });

    // Execute all updates
    const updatedPositions = await Promise.all(updatePromises);
    
    console.log('\n🎉 Position update completed!');
    console.log(`📊 Updated ${updatedPositions.length} positions`);

    // Verify the updates
    console.log('\n🔍 Verifying updated positions:');
    const verifyPositions = await Position.find({});
    verifyPositions.forEach((pos, index) => {
      console.log(`${index + 1}. ${pos.positionTitle} (${pos.positionCode})`);
      console.log(`   - Department: ${pos.department}`);
      console.log(`   - Level: ${pos.level}`);
      console.log(`   - Description: ${pos.description}`);
      console.log(`   - Status: ${pos.status}`);
      console.log(`   - Max/Current Positions: ${pos.maxPositions}/${pos.currentPositions}`);
      console.log('');
    });

    console.log('✅ All positions should now be compatible with the filtering logic!');
    console.log('🚀 New positions created through the API will now appear in the UI!');

  } catch (error) {
    console.error('❌ Error updating positions:', error);
  } finally {
    console.log('🔌 Closing database connection...');
    await mongoose.connection.close();
    console.log('👋 Database connection closed');
  }
}

// Run the fix
console.log('🚀 Starting position database fix...');
console.log('📋 This script will add missing fields to existing positions');
console.log('⚠️  Make sure you have a backup of your database before running this!');
console.log('');

fixExistingPositions()
  .then(() => {
    console.log('🎊 Database fix completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Database fix failed:', error);
    process.exit(1);
  });