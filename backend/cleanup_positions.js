// cleanup_positions.js
// Run this script with: node cleanup_positions.js
// It will remove all fields from Position documents except: _id, positionTitle, positionCode, permissions, createdAt, updatedAt, __v

const mongoose = require('mongoose');
const Position = require('./src/models/Position');
const config = require('./src/config/database');

(async () => {
  try {
    await config(); // Connect to DB
    const positions = await Position.find({});
    for (const pos of positions) {
      const allowed = {
        _id: pos._id,
        positionTitle: pos.positionTitle,
        positionCode: pos.positionCode,
        permissions: pos.permissions || {
          sales: {}, inventory: {}, hrm: {}, payroll: {}, reports: {}, settings: {}
        },
        createdAt: pos.createdAt,
        updatedAt: pos.updatedAt,
        __v: pos.__v
      };
      await Position.replaceOne({ _id: pos._id }, allowed);
    }
    console.log('✅ All Position documents cleaned up.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Cleanup failed:', err);
    process.exit(1);
  }
})();
