const { validationResult } = require('express-validator');
const Attachment = require('../models/Attachment');
const fs = require('fs');
const path = require('path');

// @desc    Upload attachment(s) for an entity
// @route   POST /api/attachments
// @access  Private
const uploadAttachment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Clean up uploaded files if validation fails
      if (req.files) {
        req.files.forEach(file => {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        });
      }
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

  // Prefer entityType provided in the query (set by client before multipart parsing), then body
  let { entityType, entityId, description, tags, transactionId } = req.body;
  if ((!entityType || String(entityType).trim() === '') && req.query && req.query.entityType) {
    entityType = String(req.query.entityType).trim();
  }
    // Normalize entityId: allow empty string (upload-before-associate) by coercing to null
    if (!entityId || (typeof entityId === 'string' && entityId.trim() === '')) {
      entityId = null;
    }
    const files = req.files || (req.file ? [req.file] : []);

    if (!transactionId) {
      // Generate REFID with only the time (HHMMSS) in CAT (UTC+2) if not provided
      const now = new Date();
      // Convert to CAT (UTC+2)
      const utcHours = now.getUTCHours();
      const catHours = (utcHours + 2) % 24;
      const pad = n => n.toString().padStart(2, '0');
      const timeStr = `${pad(catHours)}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}`;
      transactionId = `REFID-${timeStr}`;
    }

    if (files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    const attachments = [];
    for (const file of files) {
      // Ensure file path is normalized and the entityType reflects the directory where multer saved the file
      const savedFilePath = file.path;
      // If multer provided a generatedId, prefer it as the filename (and as the attachment _id)
      const savedFileName = file.filename;
      const generatedId = file.generatedId || null;
      // Derive entity type from the saved file path if not provided
      let finalEntityType = entityType;
      try {
        const parts = savedFilePath.split(path.sep);
        // Expect uploads/<entityType>/<filename>
        const idx = parts.findIndex(p => p === 'uploads');
        if ((idx >= 0) && parts.length > idx + 1) {
          finalEntityType = finalEntityType || parts[idx + 1];
        }
      } catch (e) {
        // ignore
      }

      const attachmentData = {
        fileName: savedFileName,
        originalName: file.originalname,
        filePath: savedFilePath,
        fileSize: file.size,
        mimeType: file.mimetype,
        entityType: finalEntityType || 'inventory',
        entityId,
        description,
        tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
        uploadedBy: req.user.userId,
        transactionId
      };

      // If multer generated an id, set the Attachment _id to that value and ensure fileName reflects it
      if (generatedId) {
        try {
          attachmentData._id = generatedId;
          // Ensure fileName matches the stored filename (generatedId + ext)
          attachmentData.fileName = path.basename(savedFileName);
        } catch (e) {
          // ignore and proceed
        }
      }

      const attachment = new Attachment(attachmentData);
      await attachment.save();
      attachments.push(attachment);
    }

    // Build absolute download URLs so clients don't rely on raw /uploads paths
    const base = req && req.protocol && req.get ? `${req.protocol}://${req.get('host')}` : '';
    const attachmentsOut = attachments.map(a => {
      const obj = a.toObject ? a.toObject() : a;
      obj.downloadUrl = base ? `${base}/api/attachments/download/${a._id}` : `/api/attachments/download/${a._id}`;
      // Provide a relative static file URL so frontends can request the file directly from /uploads
      try {
        const entity = (obj.entityType || 'inventory');
        const fileName = obj.fileName || obj.file || '';
        obj.fileUrl = `/uploads/${entity}/${fileName}`;
      } catch (e) {
        obj.fileUrl = null;
      }
      return obj;
    });

    res.status(201).json({
      success: true,
      message: `Successfully uploaded ${attachments.length} file(s)`,
      data: { attachments: attachmentsOut }
    });

  } catch (error) {
    // Clean up files if database save fails
    if (req.files) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    console.error('Upload attachment error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// @desc    Get attachments for a specific entity
// @route   GET /api/attachments/:entityType/:entityId
// @access  Private
const getAttachmentsByEntity = async (req, res) => {
  try {
    const { entityType, entityId } = req.params;

    const attachments = await Attachment.findByEntity(entityType, entityId)
      .populate('uploadedBy', 'username email')
      .select('-filePath'); // Don't expose server file paths

    // Expose a safe downloadUrl for each attachment (absolute URL to API download)
    const base = req && req.protocol && req.get ? `${req.protocol}://${req.get('host')}` : '';
    const attachmentsOut = attachments.map(a => {
      const obj = a.toObject ? a.toObject() : a;
      obj.downloadUrl = base ? `${base}/api/attachments/download/${a._id}` : `/api/attachments/download/${a._id}`;
      try {
        const entity = (obj.entityType || 'inventory');
        const fileName = obj.fileName || obj.file || '';
        obj.fileUrl = `/uploads/${entity}/${fileName}`;
      } catch (e) {
        obj.fileUrl = null;
      }
      return obj;
    });

    res.json({
      success: true,
      data: { 
        attachments: attachmentsOut,
        count: attachmentsOut.length
      }
    });

  } catch (error) {
    console.error('Get attachments error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// @desc    Get all attachments with filtering
// @route   GET /api/attachments
// @access  Private
const getAllAttachments = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      entityType,
      mimeType,
      uploadedBy,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = { isActive: true };
    
    if (entityType) filter.entityType = entityType;
    if (mimeType) filter.mimeType = { $regex: mimeType, $options: 'i' };
    if (uploadedBy) filter.uploadedBy = uploadedBy;
    
    if (search) {
      filter.$or = [
        { originalName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    // Execute query
    const [attachments, total] = await Promise.all([
      Attachment.find(filter)
        .populate('uploadedBy', 'username email')
        .select('-filePath')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      Attachment.countDocuments(filter)
    ]);

    const base = req && req.protocol && req.get ? `${req.protocol}://${req.get('host')}` : '';
    const attachmentsOut = attachments.map(a => {
      const obj = a.toObject ? a.toObject() : a;
      obj.downloadUrl = base ? `${base}/api/attachments/download/${a._id}` : `/api/attachments/download/${a._id}`;
      try {
        const entity = (obj.entityType || 'inventory');
        const fileName = obj.fileName || obj.file || '';
        obj.fileUrl = `/uploads/${entity}/${fileName}`;
      } catch (e) {
        obj.fileUrl = null;
      }
      return obj;
    });

    res.json({
      success: true,
      data: {
        attachments: attachmentsOut,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get all attachments error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// @desc    Download/view attachment
// @route   GET /api/attachments/download/:id
// @access  Private
const downloadAttachment = async (req, res) => {
  try {
    const { id } = req.params;
    const { download = false } = req.query;

    const attachment = await Attachment.findById(id);
    
    if (!attachment || !attachment.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Attachment not found'
      });
    }

    if (!fs.existsSync(attachment.filePath)) {
      try {
        const attempted = require('path').resolve(attachment.filePath);
        console.warn('⚠️ Download requested but file missing on disk:', attempted);
      } catch (e) {
        console.warn('⚠️ Download requested but file missing on disk; filePath:', attachment.filePath);
      }
      return res.status(404).json({
        success: false,
        message: 'File not found on server'
      });
    }

    // Set appropriate headers
    res.setHeader('Content-Type', attachment.mimeType);
    
    if (download === 'true') {
      res.setHeader('Content-Disposition', `attachment; filename="${attachment.originalName}"`);
    } else {
      res.setHeader('Content-Disposition', `inline; filename="${attachment.originalName}"`);
    }

    // Stream the file
    const fileStream = fs.createReadStream(attachment.filePath);
    fileStream.pipe(res);

  } catch (error) {
    console.error('Download attachment error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// @desc    Update attachment metadata
// @route   PUT /api/attachments/:id
// @access  Private
const updateAttachment = async (req, res) => {
  try {
    const { id } = req.params;
    const { description, tags, isPublic } = req.body;

    const attachment = await Attachment.findById(id);
    
    if (!attachment || !attachment.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Attachment not found'
      });
    }

    // Only allow owner or admin to update
    if (attachment.uploadedBy.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this attachment'
      });
    }

    // Update fields
    if (description !== undefined) attachment.description = description;
    if (tags !== undefined) attachment.tags = Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim());
    if (isPublic !== undefined) attachment.isPublic = isPublic;

    await attachment.save();

    res.json({
      success: true,
      message: 'Attachment updated successfully',
      data: { attachment }
    });

  } catch (error) {
    console.error('Update attachment error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// @desc    Delete attachment
// @route   DELETE /api/attachments/:id
// @access  Private
const deleteAttachment = async (req, res) => {
  try {
    const { id } = req.params;

    const attachment = await Attachment.findById(id);
    
    if (!attachment || !attachment.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Attachment not found'
      });
    }

    // Only allow owner or admin to delete
    if (attachment.uploadedBy.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this attachment'
      });
    }

    // Soft delete (mark as inactive)
    attachment.isActive = false;
    await attachment.save();

    // Optionally delete physical file
    if (fs.existsSync(attachment.filePath)) {
      fs.unlinkSync(attachment.filePath);
    }

    res.json({
      success: true,
      message: 'Attachment deleted successfully'
    });

  } catch (error) {
    console.error('Delete attachment error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// @desc    Cleanup orphaned files
// @route   POST /api/attachments/cleanup
// @access  Private (Admin only)
const cleanupOrphanedFiles = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const result = await Attachment.cleanupOrphanedFiles();

    res.json({
      success: true,
      message: `Cleanup completed. Deleted ${result.deletedCount} orphaned files`,
      data: result
    });

  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  uploadAttachment,
  getAttachmentsByEntity,
  getAllAttachments,
  downloadAttachment,
  updateAttachment,
  deleteAttachment,
  cleanupOrphanedFiles
};