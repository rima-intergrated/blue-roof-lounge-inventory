const mongoose = require('mongoose');

const ExpenseCategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  expenseId: { type: String, required: true, unique: true },
  description: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ExpenseCategory', ExpenseCategorySchema);
