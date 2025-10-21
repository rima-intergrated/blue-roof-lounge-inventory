// Test the staff controller directly
const mongoose = require('mongoose');
const { connectDB } = require('./src/config/database');
const Staff = require('./src/models/Staff');

const testStaffController = async () => {
  try {
    console.log('Connecting to database...');
    await connectDB();

    // Mock request and response objects
    const req = {
      query: {},
      user: { id: '68d5f2d944814a5b930796ae', role: 'Manager' }
    };

    const res = {
      json: (data) => {
        console.log('Success response:', JSON.stringify(data, null, 2));
        process.exit(0);
      },
      status: (code) => ({
        json: (data) => {
          console.log(`Error response (${code}):`, JSON.stringify(data, null, 2));
          process.exit(1);
        }
      })
    };

    // Simulate the getAllStaff function logic
    const {
      page = 1,
      limit = 10,
      status,
      position,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (status) filter.employed = status === 'active' || status === 'Active';
    if (position) filter.position = position;
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { contact: { $regex: search, $options: 'i' } },
        { position: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    console.log('Filter:', filter);
    console.log('Sort:', sort);

    // Execute query
    const [staff, total] = await Promise.all([
      Staff.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      Staff.countDocuments(filter)
    ]);

    console.log('Found staff:', staff.length);
    console.log('Total staff:', total);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.json({
      success: true,
      data: {
        staff,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: total,
          itemsPerPage: parseInt(limit),
          hasNextPage,
          hasPrevPage,
          nextPage: hasNextPage ? parseInt(page) + 1 : null,
          prevPage: hasPrevPage ? parseInt(page) - 1 : null
        }
      }
    });

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

testStaffController();
