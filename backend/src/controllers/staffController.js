const { validationResult } = require('express-validator');
const Staff = require('../models/Staff');
const Position = require('../models/Position');
const User = require('../models/User');
const notificationService = require('../services/notificationService');

// @desc    Send password setup link for a staff member (admin action)
// @route   POST /api/staff/:id/send-password-setup
// @access  Private (HR/Admin)
const sendStaffPasswordSetup = async (req, res) => {
  try {
    const staffId = req.params.id;

    const staff = await Staff.findById(staffId);
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }

    // Find existing user by staff email or by staffId relation
    let user = await User.findOne({ $or: [{ email: staff.email }, { staffId: staff._id }] });

    // Generate token
    const passwordSetupToken = notificationService.generatePasswordSetupToken();

    if (!user) {
      // Create a user record linked to this staff
      user = new User({
        username: (staff.email || 'user').split('@')[0],
        email: staff.email,
        password: 'temp_password_' + Date.now(),
        role: 'Cashier',
        permissions: [],
        isActive: false,
        passwordSetupToken,
        passwordSetupExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
        isPasswordSetup: false,
        staffId: staff._id
      });

      await user.save();
    } else {
      // Update existing user with a fresh token
      user.passwordSetupToken = passwordSetupToken;
      user.passwordSetupExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
      user.isPasswordSetup = false;
      user.isActive = false;
      await user.save();
    }

    const setupUrl = notificationService.generatePasswordSetupUrl(passwordSetupToken, user._id);

    const notificationResults = await notificationService.sendPasswordSetupNotification(
      {
        name: staff.name,
        email: staff.email,
        contact: staff.contact,
        position: staff.position
      },
      setupUrl
    );

    res.json({
      success: true,
      message: 'Password setup instructions sent',
      data: { setupUrl, notificationResults }
    });

  } catch (error) {
    console.error('Send staff password setup error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// @desc    Get all staff members
// @route   GET /api/staff
// @access  Private
const getAllStaff = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      position,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (status) filter.employed = status === 'active' || status === 'Active';
    if (position) filter.position = position;
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { contact: { $regex: search, $options: 'i' } },
        { position: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    // Execute query
    const [staff, total] = await Promise.all([
      Staff.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      Staff.countDocuments(filter)
    ]);

    res.json({
      success: true,
      message: 'Staff members retrieved successfully',
      data: {
        staff,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          itemsPerPage: parseInt(limit),
          hasNextPage: parseInt(page) < Math.ceil(total / parseInt(limit)),
          hasPrevPage: parseInt(page) > 1
        }
      }
    });

  } catch (error) {
    console.error('Get all staff error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get staff member by ID
// @route   GET /api/staff/:id
// @access  Private
const getStaffById = async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id);

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    res.json({
      success: true,
      message: 'Staff member retrieved successfully',
      data: { staff }
    });

  } catch (error) {
    console.error('Get staff by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// @desc    Create new staff member
// @route   POST /api/staff
// @access  Private (HR/Admin)
const createStaff = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      name,
      gender,
      contact,
      email,
      position,
      address,
      salary,
      emergencyContact,
      bankDetails,
      notes
    } = req.body;

    // Check for duplicate email in both Staff and User collections
    const [existingStaff, existingUser] = await Promise.all([
      Staff.findOne({ email }),
      User.findOne({ email })
    ]);

    if (existingStaff || existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Staff member with this email already exists'
      });
    }


    // Validate position exists in database by ObjectId
    const positionRecord = await Position.findById(position);
    if (!positionRecord) {
      return res.status(400).json({
        success: false,
        message: `Position with id "${position}" does not exist. Please create the position first.`
      });
    }

    // Create staff member with position as ObjectId
    const staff = new Staff({
      name,
      gender,
      contact,
      email,
      position: positionRecord._id, // Use the ObjectId reference
      address,
      salary,
      emergencyContact,
      bankDetails,
      notes
    });

    const savedStaff = await staff.save();

    // Generate password setup token
    const passwordSetupToken = notificationService.generatePasswordSetupToken();

    // Create user account (initially without password)
    const user = new User({
      username: email.split('@')[0], // Use email prefix as username
      email,
      password: 'temp_password_' + Date.now(), // Temporary password, will be changed
      role: 'Cashier', // Default role, can be updated later
      permissions: [], // Will be set based on position permissions
      isActive: false, // Inactive until password is setup
      passwordSetupToken,
      passwordSetupExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      isPasswordSetup: false,
      staffId: savedStaff._id
    });

    const savedUser = await user.save();

    // Generate setup URL with correct user ID
    const setupUrl = notificationService.generatePasswordSetupUrl(passwordSetupToken, savedUser._id);

    // Send password setup notification
    const notificationResults = await notificationService.sendPasswordSetupNotification(
      {
        name: savedStaff.name,
        email: savedStaff.email,
        contact: savedStaff.contact,
        position: positionRecord.positionTitle
      },
      setupUrl
    );

    // Check if email was successfully sent
    const emailResult = notificationResults.find(n => n.method === 'gmail-smtp' || n.method === 'email');
    const emailFailed = !emailResult || !emailResult.success;
    
    let responseMessage = 'Staff member created successfully!';
    let responseData = { 
      staff: savedStaff,
      passwordSetupSent: notificationResults
    };
    
    if (emailFailed) {
      responseMessage += ' However, email notification failed.';
      responseData.setupUrl = setupUrl; // Include setup URL for manual sharing
      responseData.manualInstructions = `Please manually share this password setup link with ${savedStaff.name} (${savedStaff.email}): ${setupUrl}`;
    } else {
      responseMessage += ' Password setup instructions have been sent via email.';
    }

    res.status(201).json({
      success: true,
      message: responseMessage,
      data: responseData
    });

  } catch (error) {
    console.error('Create staff error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Update staff member
// @route   PUT /api/staff/:id
// @access  Private (HR/Admin)
const updateStaff = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const staff = await Staff.findById(req.params.id);
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    const {
      firstName,
      lastName,
      email,
      phoneNumber,
      position: newPositionId,
      department,
      salary,
      bankDetails,
      emergencyContact,
      address,
      employmentStatus,
      employed // boolean toggle for employment status
    } = req.body;

    // Handle position change
    if (newPositionId && newPositionId.toString() !== staff.position.toString()) {
      const [oldPosition, newPosition] = await Promise.all([
        Position.findById(staff.position),
        Position.findById(newPositionId)
      ]);

      if (!newPosition) {
        return res.status(400).json({
          success: false,
          message: 'Invalid new position selected'
        });
      }

      if (newPosition.availablePositions <= 0) {
        return res.status(400).json({
          success: false,
          message: 'No available positions for the selected role'
        });
      }

      // Update position counts
      if (oldPosition) {
        await oldPosition.updatePositionCount(-1);
      }
      await newPosition.updatePositionCount(1);
    }

    // Check for duplicate email (excluding current staff)
    if (email && email !== staff.email) {
      const existingStaff = await Staff.findOne({
        email,
        _id: { $ne: req.params.id }
      });

      if (existingStaff) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists for another staff member'
        });
      }
    }

    // Update fields (include `employed` boolean if provided)
    Object.assign(staff, {
      firstName: firstName || staff.firstName,
      lastName: lastName || staff.lastName,
      email: email || staff.email,
      phoneNumber: phoneNumber || staff.phoneNumber,
      position: newPositionId || staff.position,
      department: department || staff.department,
      salary: salary !== undefined ? salary : staff.salary,
      bankDetails: bankDetails || staff.bankDetails,
      emergencyContact: emergencyContact || staff.emergencyContact,
      address: address || staff.address,
      employmentStatus: employmentStatus || staff.employmentStatus,
      employed: employed !== undefined ? employed : staff.employed
    });

    await staff.save();

    res.json({
      success: true,
      message: 'Staff member updated successfully',
      data: { staff }
    });

  } catch (error) {
    console.error('Update staff error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// @desc    Delete staff member
// @route   DELETE /api/staff/:id
// @access  Private (HR/Admin)
const deleteStaff = async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id);
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    // Update position count
    const position = await Position.findById(staff.position);
    if (position) {
      await position.updatePositionCount(-1);
    }

    await Staff.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Staff member deleted successfully'
    });

  } catch (error) {
    console.error('Delete staff error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// @desc    Get staff dashboard statistics
// @route   GET /api/staff/stats
// @access  Private
const getStaffStats = async (req, res) => {
  try {
    const [
      totalStaff,
      activeStaff,
      inactiveStaff,
      departmentStats,
      positionStats
    ] = await Promise.all([
      Staff.countDocuments(),
      Staff.countDocuments({ employmentStatus: 'Active' }),
      Staff.countDocuments({ employmentStatus: { $ne: 'Active' } }),
      Staff.aggregate([
        { $group: { _id: '$department', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Staff.aggregate([
        {
          $lookup: {
            from: 'positions',
            localField: 'position',
            foreignField: '_id',
            as: 'positionInfo'
          }
        },
        { $unwind: '$positionInfo' },
        {
          $group: {
            _id: '$positionInfo.positionTitle',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ])
    ]);

    res.json({
      success: true,
      message: 'Staff statistics retrieved successfully',
      data: {
        summary: {
          totalStaff,
          activeStaff,
          inactiveStaff
        },
        departmentStats,
        positionStats
      }
    });

  } catch (error) {
    console.error('Get staff stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  sendStaffPasswordSetup,
  getAllStaff,
  getStaffById,
  createStaff,
  updateStaff,
  deleteStaff,
  getStaffStats
};
