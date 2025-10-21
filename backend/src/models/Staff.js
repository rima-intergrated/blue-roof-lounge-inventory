const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Staff name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  gender: {
    type: String,
    required: [true, 'Gender is required'],
    enum: ['Male', 'Female']
  },
  contact: {
    type: String,
    required: [true, 'Contact number is required'],
    trim: true,
    match: [/^[\+]?[\d]{7,15}$/, 'Please enter a valid phone number (7-15 digits)']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  position: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Position',
    required: [true, 'Position is required']
  },
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true,
    maxlength: [200, 'Address cannot exceed 200 characters']
  },
  salary: {
    type: Number,
    required: [true, 'Salary is required'],
    min: [0, 'Salary cannot be negative']
  },
  employed: {
    type: Boolean,
    default: true
  },
    // ...existing code...
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for employment status
staffSchema.virtual('employmentStatus').get(function() {
  if (!this.employed) return 'Terminated';
  return 'Active';
});

// ...existing code...

// Index for common queries
staffSchema.index({ employed: 1 });
staffSchema.index({ position: 1 });
// ...existing code...

module.exports = mongoose.model('Staff', staffSchema);
