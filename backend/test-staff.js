const mongoose = require('mongoose');
const Staff = require('./src/models/Staff');
const { connectDB } = require('./src/config/database');

const testStaff = async () => {
  try {
    await connectDB();
    console.log('Connected to database');

    // Try to find all staff
    const staff = await Staff.find();
    console.log('Staff count:', staff.length);
    console.log('Staff records:', staff);

    if (staff.length === 0) {
      console.log('No staff records found. Creating test staff...');
      
      const testStaff = new Staff({
        name: 'John Doe',
        gender: 'Male',
        contact: '+1234567890',
        email: 'john.doe@example.com',
        position: 'Manager',
        address: '123 Main St, City, State',
        salary: 50000
      });

      await testStaff.save();
      console.log('Test staff created:', testStaff);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
  }
};

testStaff();
