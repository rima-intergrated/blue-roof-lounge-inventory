const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Simple health endpoint
app.get('/api/health', (req, res) => {
  console.log('Health endpoint called');
  res.json({
    success: true,
    message: 'Debug server is running',
    timestamp: new Date().toISOString()
  });
});

// Test staff endpoint without auth
app.post('/api/staff', (req, res) => {
  console.log('Staff creation called with body:', req.body);
  res.json({
    success: true,
    message: 'Staff endpoint working',
    data: req.body
  });
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
const PORT = 5001;
app.listen(PORT, () => {
  console.log(`🚀 Debug server running on port ${PORT}`);
  console.log(`🌐 Server listening on http://127.0.0.1:${PORT}`);
});
