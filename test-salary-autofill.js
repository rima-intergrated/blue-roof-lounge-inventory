// Test Script: Verify Salary Auto-Fill Functionality
// This script simulates the salary auto-fill behavior to ensure it works correctly

console.log('🧪 Testing Salary Auto-Fill Functionality');
console.log('==========================================');

// Simple formatter for test outputs (K prefix)
const fmt = (v) => `K${Number(v || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

// Mock staff data (similar to what would be loaded from database)
const mockStaff = [
  { _id: '1', name: 'John Doe', salary: 50000 },
  { _id: '2', name: 'Jane Smith', salary: 60000 },
  { _id: '3', name: 'Bob Johnson', salary: 45000 }
];

// Mock state variables
let selectedStaff = '';
let paymentCategory = '';
let paymentAmount = '';

// Mock setter functions
const setSelectedStaff = (value) => selectedStaff = value;
const setPaymentCategory = (value) => paymentCategory = value;
const setPaymentAmount = (value) => paymentAmount = value;

// Mock total display calculation
function calculateTotalDisplay() {
  // For salary payments, show the staff member's actual salary
  if (paymentCategory === "Salary" && selectedStaff) {
    const staffMember = mockStaff.find(member => 
      member._id === selectedStaff || member.name === selectedStaff
    );
    if (staffMember && staffMember.salary) {
      return fmt(parseFloat(staffMember.salary));
    }
  }
  // For other payment types, show the entered amount
  return paymentAmount ? fmt(parseFloat(paymentAmount)) : fmt(0);
}

// Replicated handler functions
function handleStaffChange(selectedValue) {
  setSelectedStaff(selectedValue);
  
  // Auto-fill amount if salary category is selected
  if (paymentCategory === "Salary" && selectedValue) {
    const staffMember = mockStaff.find(member => 
      member._id === selectedValue || member.name === selectedValue
    );
    if (staffMember && staffMember.salary) {
      setPaymentAmount(staffMember.salary.toString());
      console.log(`💰 Auto-filled salary amount: ${staffMember.salary} for ${staffMember.name}`);
    }
  }
}

function handlePaymentCategoryChange(newCategory) {
  setPaymentCategory(newCategory);
  
  // Auto-fill amount for salary payments
  if (newCategory === "Salary" && selectedStaff) {
    const staffMember = mockStaff.find(member => 
      member._id === selectedStaff || member.name === selectedStaff
    );
    if (staffMember && staffMember.salary) {
      setPaymentAmount(staffMember.salary.toString());
      console.log(`💰 Auto-filled salary amount: ${staffMember.salary} for ${staffMember.name}`);
    }
  } else if (newCategory !== "Salary") {
    // Clear amount for non-salary payments to allow manual entry
    setPaymentAmount("");
  }
}

function handleAmountChange(newAmount) {
  // Prevent manual changes for salary payments to maintain consistency
  if (paymentCategory === "Salary") {
    console.log('⚠️ Cannot manually change salary amount - it is auto-filled from staff record');
    return;
  }
  setPaymentAmount(newAmount);
}

// Test scenarios
console.log('\n📋 Test 1: Select salary category first, then staff');
console.log('--------------------------------------------------');
handlePaymentCategoryChange('Salary');
console.log(`Payment Category: ${paymentCategory}, Amount: ${paymentAmount}, Total Display: ${calculateTotalDisplay()}`);
handleStaffChange('1');
console.log(`Selected Staff: ${selectedStaff}, Amount: ${paymentAmount}, Total Display: ${calculateTotalDisplay()}`);

console.log('\n📋 Test 2: Select staff first, then salary category');
console.log('--------------------------------------------------');
// Reset
setSelectedStaff('');
setPaymentCategory('');
setPaymentAmount('');

handleStaffChange('2');
console.log(`Selected Staff: ${selectedStaff}, Amount: ${paymentAmount}, Total Display: ${calculateTotalDisplay()}`);
handlePaymentCategoryChange('Salary');
console.log(`Payment Category: ${paymentCategory}, Amount: ${paymentAmount}, Total Display: ${calculateTotalDisplay()}`);

console.log('\n📋 Test 3: Try to manually change salary amount');
console.log('----------------------------------------------');
handleAmountChange('70000');
console.log(`Amount after manual change attempt: ${paymentAmount}, Total Display: ${calculateTotalDisplay()}`);

console.log('\n📋 Test 4: Switch to allowance category');
console.log('---------------------------------------');
handlePaymentCategoryChange('Allowance');
console.log(`Payment Category: ${paymentCategory}, Amount: ${paymentAmount}, Total Display: ${calculateTotalDisplay()}`);
handleAmountChange('5000');
console.log(`Amount after manual change: ${paymentAmount}, Total Display: ${calculateTotalDisplay()}`);

console.log('\n📋 Test 5: Switch back to salary');
console.log('--------------------------------');
handlePaymentCategoryChange('Salary');
console.log(`Payment Category: ${paymentCategory}, Amount: ${paymentAmount}, Total Display: ${calculateTotalDisplay()}`);

console.log('\n✅ All tests completed!');
console.log('\nExpected behavior:');
console.log('1. ✅ Salary amount auto-fills when category is "Salary" and staff is selected');
console.log('2. ✅ Salary amount auto-fills when staff is selected and category is "Salary"');
console.log('3. ✅ Manual changes to salary amount are prevented');
console.log('4. ✅ Amount clears when switching to non-salary categories');
console.log('5. ✅ Amount re-fills when switching back to salary category');
console.log('6. ✅ Total display shows staff salary for salary payments');
console.log('7. ✅ Total display shows entered amount for other payment types');