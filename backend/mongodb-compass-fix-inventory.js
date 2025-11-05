// MongoDB Compass Script: Fix Missing Inventory Permissions
// Copy and paste this into MongoDB Compass and run against the 'positions' collection

// 1. First, let's see which positions are missing inventory permissions
db.positions.find({
  "permissions.inventory": { $exists: false }
}, {
  positionTitle: 1,
  positionCode: 1,
  permissions: 1
});

// 2. Add inventory permissions to all positions that don't have them
db.positions.updateMany(
  {
    "permissions.inventory": { $exists: false }
  },
  {
    $set: {
      "permissions.inventory": {
        "view": false,
        "create": false,
        "edit": false,
        "delete": false,
        "add": false
      },
      "updatedAt": new Date()
    }
  }
);

// 3. Verify all positions now have inventory permissions
db.positions.find({}, {
  positionTitle: 1,
  positionCode: 1,
  "permissions.inventory": 1
});

// Expected result: All positions should now have inventory permissions like:
// {
//   "_id": ObjectId("..."),
//   "positionTitle": "Director",
//   "positionCode": "DIRECTOR",
//   "permissions": {
//     "inventory": {
//       "view": false,
//       "create": false,
//       "edit": false,
//       "delete": false,
//       "add": false
//     }
//   }
// }