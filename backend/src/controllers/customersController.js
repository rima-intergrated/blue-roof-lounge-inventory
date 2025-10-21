const Customer = require('../models/Customer');

const listCustomers = async (req, res) => {
  try {
    const customers = await Customer.find().sort({ createdAt: -1 }).limit(200);
    res.json({ success: true, data: { customers } });
  } catch (err) {
    console.error('List customers error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const createOrFindCustomer = async (req, res) => {
  try {
    const { name, mobile, email, address } = req.body;
    if (!mobile) return res.status(400).json({ success: false, message: 'Mobile is required' });
    let cust = await Customer.findOne({ mobile }).exec();
    if (!cust) {
      cust = new Customer({ name: name || '', mobile, email: email || '', address: address || '' });
      await cust.save();
    }
    res.status(201).json({ success: true, data: { customer: cust } });
  } catch (err) {
    console.error('Create customer error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = { listCustomers, createOrFindCustomer };
