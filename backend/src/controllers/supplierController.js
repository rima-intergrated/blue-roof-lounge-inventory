const { validationResult } = require('express-validator');
const Supplier = require('../models/Supplier');

// @desc    Get all suppliers
// @route   GET /api/suppliers
// @access  Private
const getAllSuppliers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      category,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (status) filter.status = status;
    if (category) filter.category = category;
    
    if (search) {
      filter.$or = [
        { supplierName: { $regex: search, $options: 'i' } },
        { supplierId: { $regex: search, $options: 'i' } },
        { 'contactPerson.firstName': { $regex: search, $options: 'i' } },
        { 'contactPerson.lastName': { $regex: search, $options: 'i' } },
        { 'contactInformation.email': { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    // Execute query
    const [suppliers, total] = await Promise.all([
      Supplier.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      Supplier.countDocuments(filter)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.json({
      success: true,
      data: {
        suppliers,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: total,
          itemsPerPage: parseInt(limit),
          hasNextPage,
          hasPrevPage,
          nextPage: hasNextPage ? parseInt(page) + 1 : null,
          prevPage: hasPrevPage ? parseInt(page) - 1 : null
        }
      }
    });

  } catch (error) {
    console.error('Get suppliers error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// @desc    Get single supplier
// @route   GET /api/suppliers/:id
// @access  Private
const getSupplierById = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    res.json({
      success: true,
      data: { supplier }
    });

  } catch (error) {
    console.error('Get supplier error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// @desc    Create simple supplier (minimal fields)
// @route   POST /api/suppliers/simple
// @access  Private
const createSimpleSupplier = async (req, res) => {
  try {
    const { supplierName, phoneNumber } = req.body;
    if (!supplierName) {
      return res.status(400).json({ success: false, message: 'supplierName is required' });
    }

    // Check if exists by name or phone (if phone provided)
    const orClause = [{ supplierName }];
    if (phoneNumber && phoneNumber.trim() !== '') orClause.push({ phoneNumber });

    let supplier = await Supplier.findOne({ $or: orClause });
    if (supplier) return res.status(200).json({ success: true, message: 'Supplier exists', data: { supplier } });

    supplier = new Supplier({ supplierName, phoneNumber: phoneNumber || '' });
    await supplier.save();
    return res.status(201).json({ success: true, message: 'Supplier created', data: { supplier } });
  } catch (error) {
    console.error('Create simple supplier error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// @desc    Create new supplier
// @route   POST /api/suppliers
// @access  Private (Admin/Manager only)
const createSupplier = async (req, res) => {
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
      supplierName,
      supplierId,
      contactPerson,
      contactInformation,
      businessDetails,
      paymentTerms,
      productsSupplied,
      notes
    } = req.body;

    // Check if supplier already exists
    const existingSupplier = await Supplier.findOne({
      $or: [
        { supplierName },
        { supplierId },
        { 'contactInformation.email': contactInformation.email }
      ]
    });

    if (existingSupplier) {
      return res.status(400).json({
        success: false,
        message: 'Supplier with this name, ID, or email already exists'
      });
    }

    const supplier = new Supplier({
      supplierName,
      supplierId,
      contactPerson,
      contactInformation,
      businessDetails,
      paymentTerms,
      productsSupplied: productsSupplied || [],
      notes
    });

    await supplier.save();

    res.status(201).json({
      success: true,
      message: 'Supplier created successfully',
      data: { supplier }
    });

  } catch (error) {
    console.error('Create supplier error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// @desc    Update supplier
// @route   PUT /api/suppliers/:id
// @access  Private (Admin/Manager only)
const updateSupplier = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const supplier = await Supplier.findById(req.params.id);

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    const {
      supplierName,
      contactPerson,
      contactInformation,
      businessDetails,
      paymentTerms,
      productsSupplied,
      notes,
      status
    } = req.body;

    const updatedSupplier = await Supplier.findByIdAndUpdate(
      req.params.id,
      {
        supplierName: supplierName || supplier.supplierName,
        contactPerson: { ...supplier.contactPerson, ...contactPerson },
        contactInformation: { ...supplier.contactInformation, ...contactInformation },
        businessDetails: { ...supplier.businessDetails, ...businessDetails },
        paymentTerms: { ...supplier.paymentTerms, ...paymentTerms },
        productsSupplied: productsSupplied || supplier.productsSupplied,
        notes: notes || supplier.notes,
        status: status || supplier.status
      },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Supplier updated successfully',
      data: { supplier: updatedSupplier }
    });

  } catch (error) {
    console.error('Update supplier error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// @desc    Delete supplier
// @route   DELETE /api/suppliers/:id
// @access  Private (Admin only)
const deleteSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    await Supplier.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Supplier deleted successfully'
    });

  } catch (error) {
    console.error('Delete supplier error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// @desc    Update supplier status
// @route   PATCH /api/suppliers/:id/status
// @access  Private (Admin/Manager only)
const updateSupplierStatus = async (req, res) => {
  try {
    const { status, reason } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    if (!['Active', 'Inactive', 'Suspended'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be Active, Inactive, or Suspended'
      });
    }

    const supplier = await Supplier.findById(req.params.id);

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    const updatedSupplier = await Supplier.findByIdAndUpdate(
      req.params.id,
      {
        status,
        statusHistory: [
          ...supplier.statusHistory,
          {
            status,
            changedBy: req.user.id,
            changedAt: new Date(),
            reason: reason || ''
          }
        ]
      },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Supplier status updated successfully',
      data: { supplier: updatedSupplier }
    });

  } catch (error) {
    console.error('Update supplier status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// @desc    Add product to supplier
// @route   POST /api/suppliers/:id/products
// @access  Private (Admin/Manager only)
const addProductToSupplier = async (req, res) => {
  try {
    const { productName, productCode, category, unitPrice, description } = req.body;

    if (!productName || !productCode) {
      return res.status(400).json({
        success: false,
        message: 'Product name and code are required'
      });
    }

    const supplier = await Supplier.findById(req.params.id);

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    // Check if product already exists for this supplier
    const productExists = supplier.productsSupplied.some(
      product => product.productCode === productCode
    );

    if (productExists) {
      return res.status(400).json({
        success: false,
        message: 'Product with this code already exists for this supplier'
      });
    }

    const newProduct = {
      productName,
      productCode,
      category: category || 'General',
      unitPrice: unitPrice || 0,
      description: description || ''
    };

    const updatedSupplier = await Supplier.findByIdAndUpdate(
      req.params.id,
      {
        $push: { productsSupplied: newProduct }
      },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Product added to supplier successfully',
      data: { supplier: updatedSupplier }
    });

  } catch (error) {
    console.error('Add product to supplier error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// @desc    Get supplier statistics
// @route   GET /api/suppliers/stats
// @access  Private
const getSupplierStats = async (req, res) => {
  try {
    const [
      totalSuppliers,
      activeSuppliers,
      categoryStats,
      recentSuppliers
    ] = await Promise.all([
      Supplier.countDocuments(),
      Supplier.countDocuments({ status: 'Active' }),
      Supplier.aggregate([
        {
          $unwind: { path: '$productsSupplied', preserveNullAndEmptyArrays: true }
        },
        {
          $group: {
            _id: '$productsSupplied.category',
            count: { $sum: 1 },
            suppliers: { $addToSet: '$supplierName' }
          }
        },
        { $sort: { count: -1 } }
      ]),
      Supplier.find({})
        .sort({ createdAt: -1 })
        .limit(5)
        .select('supplierName status createdAt')
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalSuppliers,
          activeSuppliers,
          inactiveSuppliers: totalSuppliers - activeSuppliers
        },
        categoryStats,
        recentSuppliers
      }
    });

  } catch (error) {
    console.error('Get supplier stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  getAllSuppliers,
  getSupplierById,
  createSupplier,
  createSimpleSupplier,
  updateSupplier,
  deleteSupplier,
  updateSupplierStatus,
  addProductToSupplier,
  getSupplierStats
};

