const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
// Trust proxy so secure cookies and req.secure work behind Render's proxy
app.set('trust proxy', 1);

// Precise CORS configuration - only allow the frontend origin and enable credentials
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  // Add a helpful default for the Vercel frontend; please set FRONTEND_URL in Render to override/confirm
  'https://blue-roof-lounge-inventory-system.vercel.app',
  process.env.FRONTEND_URL
].filter(Boolean);

const corsOptions = {
  // Use the allowedOrigins array directly so the cors middleware handles checks cleanly
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With']
};

// (Removed temporary OPTIONS debug logging)

// Manual preflight handler placed before the cors middleware to ensure
// we always respond to OPTIONS (preflight) requests and set the
// Access-Control-Allow-* headers. This avoids cases where other middleware
// can cause a 500 during preflight handling.
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    const origin = req.get('origin');
    // Allow if no origin (server-to-server) or origin is explicitly allowed
    if (!origin || allowedOrigins.includes(origin)) {
      if (origin) res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,Accept,X-Requested-With');
      return res.status(204).end();
    }
    return res.status(403).json({ message: 'CORS origin not allowed' });
  }
  next();
});

app.use(cors(corsOptions));
// Keep the cors preflight handler as a fallback
app.options('*', cors(corsOptions));

// Custom middleware to conditionally apply JSON parsing
app.use((req, res, next) => {
  // Immediately skip body parsing for preflight requests
  if (req.method === 'OPTIONS') return next();
  const contentType = req.get('content-type') || '';
  const isMultipart = contentType.includes('multipart/form-data');
  const isCreditSalesPost = req.url === '/api/credit-sales' && req.method === 'POST';
  
  console.log(`🔍 Request: ${req.method} ${req.url}, Content-Type: ${contentType}`);
  
  // Skip JSON parsing for credit-sales POST requests with multipart content-type
  // OR if the URL path contains credit-sales and we detect form boundaries in content-type
  if (isCreditSalesPost && (isMultipart || contentType.includes('boundary='))) {
    console.log('🔄 Skipping JSON parsing for multipart credit-sales request');
    return next();
  }
  
  // Apply JSON parsing for all other requests
  express.json({ limit: '10mb' })(req, res, next);
});

app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving for uploads
const uploadPath = process.env.UPLOAD_PATH || './uploads';
app.use('/uploads', express.static(path.resolve(uploadPath)));

// Routes
app.use('/api', require('./src/routes'));

// Database connection
const { connectDB } = require('./src/config/database');
connectDB();

// Global error handler (production-safe)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'production' ? {} : err.message 
  });
});

// Handle 404
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Listen on the environment-provided port and on all interfaces so cloud hosts (Render, etc.)
// can bind the service. Do not hardcode 127.0.0.1 which prevents external access.
const server = app.listen(PORT, () => {
  console.log(`🚀 Blue Roof Lounge API Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});

server.on('error', (err) => {
  console.error('❌ Server error:', err);
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use`);
  }
});

// Handle server shutdown
process.on('SIGTERM', () => {
  console.log('🔴 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
  });
});
