const { validationResult } = require('express-validator');
const Item = require('../models/Item');

// @desc    Get all items
// @route   GET /api/items
// @access  Private
const getAllItems = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      type,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = { isActive: true };
    
    if (type) filter.type = type;
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { itemId: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    // Execute query with population
    const [items, total] = await Promise.all([
      Item.find(filter)
        .populate('createdBy', 'name username')
        .populate('lastModifiedBy', 'name username')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      Item.countDocuments(filter)
    ]);

    res.json({
      success: true,
      message: 'Items retrieved successfully',
      data: {
        items,
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
    console.error('Get all items error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get item by ID
// @route   GET /api/items/:id
// @access  Private
const getItemById = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id)
      .populate('createdBy', 'name username')
      .populate('lastModifiedBy', 'name username');

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    res.json({
      success: true,
      message: 'Item retrieved successfully',
      data: { item }
    });

  } catch (error) {
    console.error('Get item by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// @desc    Create new item
// @route   POST /api/items
// @access  Private
const createItem = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, type, description, itemId } = req.body;

    // Check if item name already exists for this type
    const existingItem = await Item.findOne({
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      type,
      isActive: true
    });

    if (existingItem) {
      return res.status(400).json({
        success: false,
        message: `${type} item with this name already exists`
      });
    }

    // Check if itemId is provided and not already used
    if (itemId) {
      const existingId = await Item.findOne({
        itemId: itemId.toUpperCase(),
        isActive: true
      });

      if (existingId) {
        return res.status(400).json({
          success: false,
          message: 'Item ID already exists'
        });
      }
    }

    const item = new Item({
      name: name.trim(),
      type,
      description: description?.trim(),
      itemId: itemId?.toUpperCase(),
      createdBy: req.user.userId,
      lastModifiedBy: req.user.userId
    });

    await item.save();

    // Populate the response
    await item.populate('createdBy', 'name username');

    res.status(201).json({
      success: true,
      message: `${type} item created successfully`,
      data: { item }
    });

  } catch (error) {
    console.error('Create item error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Update item
// @route   PUT /api/items/:id
// @access  Private
const updateItem = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, description } = req.body;

    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    // Check if name is being changed and if new name already exists
    if (name && name !== item.name) {
      const existingItem = await Item.findOne({
        _id: { $ne: req.params.id },
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        type: item.type,
        isActive: true
      });

      if (existingItem) {
        return res.status(400).json({
          success: false,
          message: `${item.type} item with this name already exists`
        });
      }
    }

    // Update fields
    if (name) item.name = name.trim();
    if (description !== undefined) item.description = description?.trim();
    item.lastModifiedBy = req.user.userId;

    await item.save();

    // Populate the response
    await item.populate(['createdBy lastModifiedBy'], 'name username');

    res.json({
      success: true,
      message: 'Item updated successfully',
      data: { item }
    });

  } catch (error) {
    console.error('Update item error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// @desc    Delete item (soft delete)
// @route   DELETE /api/items/:id
// @access  Private
const deleteItem = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    // Soft delete
    item.isActive = false;
    item.lastModifiedBy = req.user.userId;
    await item.save();

    res.json({
      success: true,
      message: 'Item deleted successfully'
    });

  } catch (error) {
    console.error('Delete item error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// @desc    Get items by type
// @route   GET /api/items/type/:type
// @access  Private
const getItemsByType = async (req, res) => {
  try {
    const { type } = req.params;
    const items = await Item.find({ type, isActive: true })
      .select('name itemId description')
      .sort('name');

    res.json({
      success: true,
      message: `${type} items retrieved successfully`,
      data: { items }
    });

  } catch (error) {
    console.error('Get items by type error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  getAllItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
  getItemsByType
};