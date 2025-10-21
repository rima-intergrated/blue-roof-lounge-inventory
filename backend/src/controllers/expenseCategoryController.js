const ExpenseCategory = require('../models/ExpenseCategory');

exports.getAllExpenseCategories = async (req, res) => {
  try {
    const categories = await ExpenseCategory.find();
    res.json({ 
      success: true, 
      data: { categories },
      message: 'Expense categories retrieved successfully'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.createExpenseCategory = async (req, res) => {
  try {
    const { name, expenseId, description } = req.body;
    const category = new ExpenseCategory({ name, expenseId, description });
    await category.save();
    res.status(201).json(category); // Return the created category directly
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.deleteExpenseCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedCategory = await ExpenseCategory.findByIdAndDelete(id);
    res.json(deletedCategory); // Return the deleted category
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};
