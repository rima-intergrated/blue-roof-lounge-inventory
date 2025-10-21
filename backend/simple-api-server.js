const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

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

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

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
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role = 'staff' } = req.body;
    
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Error registering user'
    });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging in'
    });
  }
});

// Get current user
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user data'
    });
  }
});

// Staff routes
app.get('/api/staff', authenticateToken, async (req, res) => {
  try {
    const staff = await Staff.find();
    res.json({
      success: true,
      data: staff
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching staff'
    });
  }
});

app.post('/api/staff', authenticateToken, async (req, res) => {
  try {
    const staff = new Staff(req.body);
    await staff.save();
    res.status(201).json({
      success: true,
      message: 'Staff member created successfully',
      data: staff
    });
  } catch (error) {
    console.error('Staff creation error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Inventory routes
app.get('/api/stock', authenticateToken, async (req, res) => {
  try {
    const inventory = await Inventory.find();
    res.json({
      success: true,
      data: { items: inventory }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching inventory'
    });
  }
});

app.post('/api/stock', authenticateToken, async (req, res) => {
  try {
    const item = new Inventory(req.body);
    await item.save();
    res.status(201).json({
      success: true,
      message: 'Inventory item created successfully',
      data: { item }
    });
  } catch (error) {
    console.error('Inventory creation error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Payroll routes
app.get('/api/payroll', authenticateToken, async (req, res) => {
  try {
    const payroll = await Payroll.find().populate('employee');
    res.json({
      success: true,
      data: payroll
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching payroll'
    });
  }
});

app.post('/api/payroll', authenticateToken, async (req, res) => {
  try {
    const payroll = new Payroll(req.body);
    await payroll.save();
    res.status(201).json({
      success: true,
      message: 'Payroll record created successfully',
      data: payroll
    });
  } catch (error) {
    console.error('Payroll creation error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Supplier routes
app.get('/api/suppliers', authenticateToken, async (req, res) => {
  try {
    const suppliers = await Supplier.find();
    res.json({
      success: true,
      data: suppliers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching suppliers'
    });
  }
});

app.post('/api/suppliers', authenticateToken, async (req, res) => {
  try {
    const supplier = new Supplier(req.body);
    await supplier.save();
    res.status(201).json({
      success: true,
      message: 'Supplier created successfully',
      data: supplier
    });
  } catch (error) {
    console.error('Supplier creation error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

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
    console.log('🔍 Testing database connection...');
  });
  
  mongoose.connection.on('error', (err) => {
    console.log('❌ MongoDB connection error:', err);
  });
});
