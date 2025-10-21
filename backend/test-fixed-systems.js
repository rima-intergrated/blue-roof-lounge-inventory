const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

// Import models directly
const Staff = require('./src/models/Staff');
const Payroll = require('./src/models/Payroll');
const Supplier = require('./src/models/Supplier');
const Inventory = require('./src/models/Inventory');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/blue_roof_lounge');

// Health endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Test server is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// STAFF ENDPOINTS (Fixed)
app.get('/api/staff', async (req, res) => {
  try {
    const staff = await Staff.find();
    res.json({
      success: true,
      data: {
        staff,
        pagination: {
          totalItems: staff.length,
          currentPage: 1,
          totalPages: 1
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
});

app.post('/api/staff', async (req, res) => {
  try {
    const staff = new Staff(req.body);
    const result = await staff.save();
    res.json({
      success: true,
      message: 'Staff member created successfully',
      data: { staff: result }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Validation failed', error: error.message });
  }
});

// PAYROLL ENDPOINTS (Fixed)
app.get('/api/payroll', async (req, res) => {
  try {
    const payrolls = await Payroll.find().populate('employee');
    res.json({
      success: true,
      data: {
        payrolls,
        pagination: {
          totalItems: payrolls.length,
          currentPage: 1,
          totalPages: 1
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
});

app.post('/api/payroll', async (req, res) => {
  try {
    const payroll = new Payroll(req.body);
    const result = await payroll.save();
    res.json({
      success: true,
      message: 'Payroll record created successfully',
      data: { payroll: result }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Validation failed', error: error.message });
  }
});

// SUPPLIER ENDPOINTS (Fixed)
app.get('/api/suppliers', async (req, res) => {
  try {
    const suppliers = await Supplier.find();
    res.json({
      success: true,
      data: {
        suppliers,
        pagination: {
          totalItems: suppliers.length,
          currentPage: 1,
          totalPages: 1
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
});

app.post('/api/suppliers', async (req, res) => {
  try {
    const supplier = new Supplier(req.body);
    const result = await supplier.save();
    res.json({
      success: true,
      message: 'Supplier created successfully',
      data: { supplier: result }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Validation failed', error: error.message });
  }
});

// INVENTORY ENDPOINTS (Working)
app.get('/api/stock', async (req, res) => {
  try {
    const inventory = await Inventory.find();
    res.json({
      success: true,
      data: {
        items: inventory,
        pagination: {
          totalItems: inventory.length,
          currentPage: 1,
          totalPages: 1
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
});

app.post('/api/stock', async (req, res) => {
  try {
    const item = new Inventory(req.body);
    const result = await item.save();
    res.json({
      success: true,
      message: 'Inventory item created successfully',
      data: { item: result }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Validation failed', error: error.message });
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: err.message
  });
});

// Start server
const PORT = 5003;
app.listen(PORT, () => {
  console.log(`🚀 Testing Server running on port ${PORT}`);
  console.log(`🌐 Server listening on http://127.0.0.1:${PORT}`);
  console.log('✅ All fixed systems ready for testing!');
});
