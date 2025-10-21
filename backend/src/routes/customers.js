const express = require('express');
const router = express.Router();
const { listCustomers, createOrFindCustomer } = require('../controllers/customersController');
const { auth } = require('../middleware/auth');

router.use(auth);

router.get('/', listCustomers);
router.post('/', createOrFindCustomer);

module.exports = router;
