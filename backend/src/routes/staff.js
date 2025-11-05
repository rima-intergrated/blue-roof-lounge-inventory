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
    // Include positions that are Active OR don't have a status field (for backward compatibility)
    const positions = await Position.find({
      $or: [
        { status: 'Active' },
        { status: { $exists: false } }
      ]
    })
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
    console.log('📝 Creating new position with data:', req.body);
    
    const { 
      positionTitle, 
      positionCode, 
      department,
      level,
      description,
      responsibilities,
      requirements,
      salary,
      benefits,
      permissions,
      workSchedule,
      reportingStructure,
      status,
      maxPositions,
      currentPositions
    } = req.body;

    if (!positionTitle || !positionCode) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: positionTitle, positionCode'
      });
    }

    // Check for duplicate position code
    const existingPosition = await Position.findOne({ 
      positionCode: positionCode.trim().toUpperCase() 
    });
    
    if (existingPosition) {
      return res.status(400).json({
        success: false,
        message: 'Position code already exists'
      });
    }

    const newPosition = new Position({
      positionTitle: positionTitle.trim(),
      positionCode: positionCode.trim().toUpperCase(),
      department: department || 'General',
      level: level || 'Staff',
      description: description || `${positionTitle.trim()} position`,
      responsibilities: responsibilities || ['General duties and responsibilities'],
      requirements: requirements || {
        education: ['High school diploma'],
        experience: { minimum: 0, preferred: 1 },
        skills: ['Basic skills'],
        certifications: []
      },
      salary: salary || {
        minimum: 30000,
        maximum: 50000,
        currency: 'KES',
        payFrequency: 'Monthly'
      },
      benefits: benefits || [],
      permissions: permissions || {
        sales: { view: false, create: false, edit: false, delete: false, add: false },
        inventory: { view: false, create: false, edit: false, delete: false, add: false },
        hrm: { view: false, create: false, edit: false, delete: false, add: false },
        payroll: { view: false, create: false, edit: false, delete: false, process: false, approve: false },
        reports: { view: false, create: false, edit: false, delete: false, generate: false, export: false },
        settings: { view: false, create: false, edit: false, delete: false, systemConfig: false }
      },
      workSchedule: workSchedule || {
        type: 'Full-time',
        hoursPerWeek: 40,
        shifts: []
      },
      reportingStructure: reportingStructure || { manages: [] },
      status: status || 'Active',
      maxPositions: maxPositions || 1,
      currentPositions: currentPositions || 0
    });

    const savedPosition = await newPosition.save();
    console.log('✅ Position created successfully:', savedPosition._id);

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

// Temporary fix endpoint for inventory permissions
router.post('/positions/fix-inventory', async (req, res) => {
  try {
    console.log('🔧 Starting inventory permissions fix...');
    
    // Find positions missing inventory permissions
    const positionsWithoutInventory = await Position.find({
      'permissions.inventory': { $exists: false }
    }).select('positionTitle positionCode permissions');
    
    console.log(`📊 Found ${positionsWithoutInventory.length} positions without inventory permissions`);
    
    if (positionsWithoutInventory.length === 0) {
      return res.json({
        success: true,
        message: 'All positions already have inventory permissions',
        modifiedCount: 0,
        positions: []
      });
    }
    
    // Update positions to add inventory permissions
    const result = await Position.updateMany(
      { 'permissions.inventory': { $exists: false } },
      { 
        $set: { 
          'permissions.inventory': {
            view: false,
            create: false,
            edit: false,
            delete: false,
            add: false
          },
          updatedAt: new Date()
        }
      }
    );
    
    console.log(`✅ Successfully updated ${result.modifiedCount} positions with inventory permissions`);
    
    // Get the updated positions for verification
    const updatedPositions = await Position.find({
      _id: { $in: positionsWithoutInventory.map(p => p._id) }
    }).select('positionTitle positionCode permissions.inventory');
    
    res.json({
      success: true,
      message: `Successfully added inventory permissions to ${result.modifiedCount} positions`,
      modifiedCount: result.modifiedCount,
      updatedPositions: updatedPositions.map(p => ({
        id: p._id,
        title: p.positionTitle,
        code: p.positionCode,
        hasInventoryPerms: !!p.permissions?.inventory
      }))
    });
    
  } catch (error) {
    console.error('❌ Error fixing inventory permissions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fix inventory permissions',
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
