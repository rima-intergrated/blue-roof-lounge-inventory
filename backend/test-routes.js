// Simple test server to verify route loading
const express = require('express');
const app = express();
const PORT = 5000;

// Middleware
app.use(express.json());

// Test route
app.get('/api/test', (req, res) => {
  res.json({ success: true, message: 'Server is working!' });
});

// Try to load the main routes
try {
  const mainRoutes = require('./src/routes');
  app.use('/api', mainRoutes);
  console.log('✅ Main routes loaded successfully');
} catch (error) {
  console.error('❌ Error loading main routes:', error.message);
  console.error('Stack trace:', error.stack);
}

app.listen(PORT, '127.0.0.1', () => {
  console.log(`🚀 Test server running on http://127.0.0.1:${PORT}`);
});
