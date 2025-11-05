# Deploy Backend Updates to Fix Inventory Permissions

## The Issue
The Director position (and potentially others) is missing the `inventory` field in permissions, which causes problems when assigning staff to positions that need inventory access.

## What We Fixed

### 1. Frontend Fix ✅
- Updated `RegisterNewStaff.jsx` to include `inventory` permissions when creating new positions
- New positions will now have complete permission structure including inventory

### 2. Backend Route Addition ✅
- Added temporary fix endpoint: `POST /api/staff/positions/fix-inventory`
- This endpoint will add missing inventory permissions to existing positions

### 3. Backend Model ✅
- Enhanced Position model already includes inventory permissions in schema
- Default permissions include inventory module

## How to Apply the Fix

### Option 1: Deploy Backend Changes
1. Commit and push the updated backend code to your repository
2. Render will automatically deploy the changes
3. Once deployed, call the fix endpoint

### Option 2: Use Fix Endpoint (after deployment)
```bash
# Call the fix endpoint to update existing positions
curl -X POST "https://blue-roof-lounge-backend.onrender.com/api/staff/positions/fix-inventory"
```

### Option 3: MongoDB Compass (immediate)
1. Open MongoDB Compass
2. Connect to your database
3. Navigate to the `positions` collection
4. Run this update query:

```javascript
db.positions.updateMany(
  { "permissions.inventory": { $exists: false } },
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
```

## Expected Results
After applying the fix:
- All existing positions will have `inventory` permissions
- New positions created through the UI will include inventory permissions
- Staff assignment to positions will work correctly
- Inventory access control will function properly

## Verification
Check that positions now have inventory permissions:
```bash
curl -X GET "https://blue-roof-lounge-backend.onrender.com/api/staff/positions"
```

Look for the `permissions.inventory` field in each position object.