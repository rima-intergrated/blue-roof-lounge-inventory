// CORE ISSUE IDENTIFIED:
// The function getItemIdByName() returns null for new items not in the predefined 'drinks' array
// This causes the save process to skip new items entirely.

// SOLUTION:
// Replace the condition from:
//   if (itemId) {
// To:
//   if (true) {  // OR remove the condition entirely
// 
// AND modify getItemIdByName to generate IDs for new items:

function getOrCreateItemId(itemName) {
  // First check if it's in the predefined drinks list
  let itemId = getItemIdByName(itemName);
  
  if (!itemId) {
    // Generate new item ID for custom items
    const timestamp = Date.now().toString().slice(-6);
    const randomSuffix = Math.random().toString(36).substr(2, 3).toUpperCase();
    itemId = `CUSTOM-${timestamp}-${randomSuffix}`;
    console.log(`🆔 Generated new item ID for "${itemName}": ${itemId}`);
  }
  
  return itemId;
}

// This will allow new items to be saved to the database instead of being skipped.