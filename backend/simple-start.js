const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'uploads')));

// Simple health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Server is running', 
    timestamp: new Date().toISOString(),
    note: 'MongoDB connection not available - using fallback mode'
  });
});

// Simple categories endpoint for testing
app.get('/api/categories', (req, res) => {
  res.json({
    success: true,
    data: {
      categories: [
        { _id: '1', name: 'Beverages', categoryId: 'BR001', type: 'item' },
        { _id: '2', name: 'Food', categoryId: 'BR002', type: 'item' },
        { _id: '3', name: 'Office Supplies', categoryId: 'BRL001', type: 'expense' }
      ]
    }
  });
});

// Simple inventory categories endpoint
app.get('/api/stock/categories', (req, res) => {
  res.json({
    success: true,
    data: {
      categories: [
        { _id: '1', name: 'Beverages', categoryId: 'BR001', type: 'item' },
        { _id: '2', name: 'Food', categoryId: 'BR002', type: 'item' },
        { _id: '3', name: 'Snacks', categoryId: 'BR003', type: 'item' }
      ]
    }
  });
});

// Catch-all route for other API endpoints
app.use('/api/*', (req, res) => {
  res.status(503).json({
    success: false,
    message: 'Database not available - running in fallback mode',
    endpoint: req.originalUrl
  });
});

// Start server
app.listen(PORT, '127.0.0.1', () => {
  console.log(`🚀 Fallback server running on http://127.0.0.1:${PORT}`);
  console.log('📊 Mode: Fallback (No Database)');
  console.log('💡 This server provides basic functionality while MongoDB is unavailable');
});

// Error handling
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled Rejection:', error);
});