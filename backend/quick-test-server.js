const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/blue_roof_lounge', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Import models
const User = require('./src/models/User');
const Staff = require('./src/models/Staff');
const Inventory = require('./src/models/Inventory');
const Payroll = require('./src/models/Payroll');
const Supplier = require('./src/models/Supplier');

// Import controllers
const { register, login, getCurrentUser } = require('./src/controllers/authController');
const { getAllStaff, createStaff } = require('./src/controllers/staffController');
const { 
  getAllInventory, 
  createInventoryItem, 
  getLowStockItems, 
  getInventoryStats 
} = require('./src/controllers/inventoryController');
const { 
  getAllPayroll, 
  createPayroll 
} = require('./src/controllers/payrollController');
const { 
  getAllSuppliers, 
  createSupplier 
} = require('./src/controllers/supplierController');

// Import middleware
const { authenticateToken } = require('./src/middleware/auth');

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Blue Roof Lounge API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Authentication routes
app.post('/api/auth/register', register);
app.post('/api/auth/login', login);
app.get('/api/auth/me', authenticateToken, getCurrentUser);

// Staff routes
app.get('/api/staff', authenticateToken, getAllStaff);
app.post('/api/staff', authenticateToken, createStaff);

// Inventory routes
app.get('/api/stock', authenticateToken, getAllInventory);
app.post('/api/stock', authenticateToken, createInventoryItem);
app.get('/api/stock/alerts/low-stock', authenticateToken, getLowStockItems);
app.get('/api/stock/stats', authenticateToken, getInventoryStats);

// Payroll routes
app.get('/api/payroll', authenticateToken, getAllPayroll);
app.post('/api/payroll', authenticateToken, createPayroll);

// Supplier routes  
app.get('/api/suppliers', authenticateToken, getAllSuppliers);
app.post('/api/suppliers', authenticateToken, createSupplier);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.originalUrl
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log('🚀 Blue Roof Lounge API Server running on port', PORT);
  console.log('📊 Environment: development');
  console.log('🌐 Server listening on http://127.0.0.1:' + PORT);
  
  // Test database connection
  mongoose.connection.on('connected', () => {
    console.log('✅ MongoDB Connected: localhost');
    console.log('📊 Database: blue_roof_lounge');
  });
  
  mongoose.connection.on('error', (err) => {
    console.log('❌ MongoDB connection error:', err);
  });
});
