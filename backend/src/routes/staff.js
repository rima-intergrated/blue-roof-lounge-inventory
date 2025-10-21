const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const { getAllStaff, getStaffById, createStaff, updateStaff, deleteStaff, getStaffStats, sendStaffPasswordSetup } = require('../controllers/staffController');
const Position = require('../models/Position');

// Test route to verify server connectivity
router.get('/test', (req, res) => {
  console.log('🧪 Test endpoint accessed');
  res.json({ success: true, message: 'Staff routes are working!', timestamp: new Date() });
});

// Position routes (public access for testing)
router.get('/positions', async (req, res) => {
  try {
    console.log('📋 Attempting to fetch positions...');
    const positions = await Position.find({ status: 'Active' })
      .select('positionTitle positionCode department level description maxPositions currentPositions permissions')
      .lean();
    
    console.log(`✅ Found ${positions.length} positions`);
    
    res.json({
      success: true,
      message: 'Positions retrieved successfully',
      data: {
        positions: positions,
        total: positions.length
      }
    });
  } catch (error) {
    console.error('❌ Error fetching positions:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching positions', 
      error: error.message 
    });
  }
});

router.post('/positions', async (req, res) => {
  try {
    const { positionTitle, positionCode, permissions } = req.body;

    if (!positionTitle || !positionCode) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: positionTitle, positionCode'
      });
    }

    const newPosition = new Position({
      positionTitle: positionTitle.trim(),
      positionCode: positionCode.trim().toUpperCase(),
      permissions: permissions || {
        sales: {},
  stock: {},
        hrm: {},
        payroll: {},
        reports: {},
        settings: {}
      }
    });

    const savedPosition = await newPosition.save();

    res.status(201).json({
      success: true,
      message: 'Position created successfully',
      data: {
        position: savedPosition
      }
    });
  } catch (error) {
    console.error('Error creating position:', error);
    
    if (error.code === 11000) {
      // Handle duplicate key error
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({
        success: false,
        message: `Position with this ${field} already exists`
      });
    }
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.keys(error.errors).map(key => ({
          field: key,
          message: error.errors[key].message
        }))
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating position',
      error: error.message
    });
  }
});

// Update position permissions
router.put('/positions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { permissions } = req.body;

    console.log('📝 Updating position permissions:', id, permissions);

    const updatedPosition = await Position.findByIdAndUpdate(
      id,
      { permissions },
      { new: true, runValidators: true }
    );

    if (!updatedPosition) {
      return res.status(404).json({
        success: false,
        message: 'Position not found'
      });
    }

    console.log('✅ Position permissions updated successfully');
    
    res.json({
      success: true,
      message: 'Position permissions updated successfully',
      data: { position: updatedPosition }
    });
  } catch (error) {
    console.error('❌ Error updating position permissions:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating position permissions',
      error: error.message
    });
  }
});

// Staff routes  
router.get('/stats', getStaffStats);
router.get('/', getAllStaff);
router.get('/:id', getStaffById);
router.post('/', createStaff);
router.put('/:id', updateStaff);
router.delete('/:id', deleteStaff);
// Admin action: send password setup link to staff member (create user if missing)
router.post('/:id/send-password-setup', sendStaffPasswordSetup);

module.exports = router;
