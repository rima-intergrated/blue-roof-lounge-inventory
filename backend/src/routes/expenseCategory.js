const express = require('express');
const router = express.Router();
const expenseCategoryController = require('../controllers/expenseCategoryController');

router.get('/', expenseCategoryController.getAllExpenseCategories);
router.post('/', expenseCategoryController.createExpenseCategory);
router.delete('/:id', expenseCategoryController.deleteExpenseCategory);

module.exports = router;
