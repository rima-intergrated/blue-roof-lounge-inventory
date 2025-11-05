// Alternative: cURL Commands to Fix Permissions via API
// These commands can be run from any terminal with internet access

// Method 1: If your backend has an admin endpoint for database fixes

// First, let's check the current state
curl -X GET "https://blue-roof-lounge-backend.onrender.com/api/staff/positions" | json_pp

// Method 2: Update each position individually (if you have update endpoints)

// Example for Director position - Add inventory permissions
curl -X PUT "https://blue-roof-lounge-backend.onrender.com/api/staff/positions/68d6fd767d3dce993d882fcb" \
  -H "Content-Type: application/json" \
  -d '{
    "permissions": {
      "sales": {"view": true, "create": false, "edit": false, "delete": false, "add": false},
      "inventory": {"view": false, "create": false, "edit": false, "delete": false, "add": false},
      "hrm": {"view": true, "create": false, "edit": false, "delete": false, "add": false},
      "payroll": {"view": false, "create": false, "edit": false, "delete": false, "process": false, "approve": false},
      "reports": {"view": false, "create": false, "edit": false, "delete": false, "generate": false, "export": false},
      "settings": {"view": false, "create": false, "edit": false, "delete": false, "systemConfig": false}
    }
  }'

// Method 3: If you can add a temporary fix endpoint to your backend
// Add this to your backend routes and deploy:

/*
router.post('/positions/fix-inventory', async (req, res) => {
  try {
    const result = await Position.updateMany(
      { 'permissions.inventory': { $exists: false } },
      { 
        $set: { 
          'permissions.inventory': {
            view: false,
            create: false,
            edit: false,
            delete: false,
            add: false
          },
          updatedAt: new Date()
        }
      }
    );
    
    res.json({
      success: true,
      message: `Updated ${result.modifiedCount} positions with inventory permissions`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fix inventory permissions',
      error: error.message
    });
  }
});
*/

// Then call it:
// curl -X POST "https://blue-roof-lounge-backend.onrender.com/api/staff/positions/fix-inventory"