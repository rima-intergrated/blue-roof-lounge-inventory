// Script to seed a Position, Staff, and link a User for permissions testing
// Run with: node backend/scripts/seedPermissions.js

const mongoose = require('mongoose');
const User = require('../src/models/User');
const Staff = require('../src/models/Staff');
const Position = require('../src/models/Position');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/blue_roof';

async function seed() {
  await mongoose.connect(MONGO_URI);

  // 1. Create a Position with full sales permissions
  const position = await Position.create({
    positionTitle: 'Test Manager',
    positionCode: 'TESTMAN',
    permissions: {
      sales: { view: true, add: true, edit: true, delete: true },
      inventory: { view: true, add: true, edit: true, delete: true },
      hrm: { view: true, add: true, edit: true, delete: true },
      payroll: { view: true, process: true, approve: true },
      reports: { view: true, generate: true, export: true },
      settings: { view: true, edit: true, systemConfig: true }
    }
  });

  // 2. Create a Staff member with that position
  const staff = await Staff.create({
    name: 'Test Staff',
    gender: 'Male',
    contact: '+1234567890',
    email: 'teststaff@example.com',
    position: position._id,
    address: '123 Test St',
    salary: 1000
  });

  // 3. Link the first user in the database to this staff
  const user = await User.findOne();
  if (user) {
    user.staffId = staff._id;
    await user.save();
    console.log('Linked user', user.username, 'to staff', staff.name, 'with position', position.positionTitle);
  } else {
    console.log('No user found to link. Please register a user first.');
  }

  await mongoose.disconnect();
  console.log('Seeding complete.');
}

seed().catch(e => { console.error(e); process.exit(1); });
