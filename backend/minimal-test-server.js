const express = require('express');
const app = express();
const PORT = 3001; // Use different port to avoid conflicts

// Simple middleware
app.use(express.json());

// Test route
app.get('/test', (req, res) => {
  res.json({ message: 'Server is working!', timestamp: new Date().toISOString() });
});

// Simple staff test route without auth
app.get('/staff-test', async (req, res) => {
  try {
    // Import staff model
    const mongoose = require('mongoose');
    const Staff = require('./src/models/Staff');
    
    // Connect to database if not connected
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/blue_roof_lounge');
    }
    
    const staff = await Staff.find().limit(5);
    res.json({ 
      success: true, 
      count: staff.length,
      staff: staff 
    });
  } catch (error) {
    console.error('Staff test error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

const server = app.listen(PORT, '127.0.0.1', () => {
  console.log(`🧪 Test server running on http://127.0.0.1:${PORT}`);
});

server.on('error', (err) => {
  console.error('❌ Server error:', err);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('🔴 Shutting down test server...');
  server.close(() => {
    console.log('✅ Test server closed');
    process.exit(0);
  });
});
