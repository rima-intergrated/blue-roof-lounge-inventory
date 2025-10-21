// Test Script: Verify Salary Payment Logic
// This script tests that salary payments show full amount without deductions

console.log('🧪 Testing Salary Payment Logic');
console.log('===============================');

// Simple formatter for test outputs (K prefix)
const fmt = (v) => `K${Number(v || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

// Mock staff data
const mockStaff = [
  { _id: '1', name: 'John Doe', salary: 50000 },
  { _id: '2', name: 'Jane Smith', salary: 60000 },
  { _id: '3', name: 'Bob Johnson', salary: 45000 }
];

// Mock payroll data simulating database response
const mockPayrollData = [
  {
    _id: 'salary1',
    employee: { _id: '1', name: 'John Doe' },
    basicSalary: 50000,
    allowances: {},
    deductions: {}, // No deductions for salary payments
    paymentStatus: 'Pending',
    paymentType: 'salary',
    createdAt: new Date().toISOString()
  },
  {
    _id: 'advance1',
    employee: { _id: '2', name: 'Jane Smith' },
    basicSalary: 60000,
    allowances: {},
    deductions: { advance: 15000 }, // Advance deduction
    paymentStatus: 'Pending',
    paymentType: 'advance',
    createdAt: new Date().toISOString()
  }
];

// Helper function to format dates
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    return 'N/A';
  }
};

// Simulate the filtering and transformation logic from AdvancePayment.jsx
function testSalaryPaymentLogic() {
  console.log('\n📊 Raw payroll data:');
  mockPayrollData.forEach(p => {
    console.log(`  - ${p.employee.name}: Basic Salary: ${p.basicSalary}, Type: ${p.paymentType}, Deductions: ${JSON.stringify(p.deductions)}`);
  });

  // Filter pending payments
  const pending = mockPayrollData.filter(p => 
    p.paymentStatus === 'Pending' || p.paymentStatus === 'pending'
  );

  // Filter advances
  const advances = mockPayrollData.filter(p => {
    if (p.paymentType === 'advance') {
      return true;
    }
    const hasAdvances = p.deductions && p.deductions.advance > 0;
    return hasAdvances;
  });

  // Transform pending data with updated logic
  const transformedPending = pending.map(p => {
    const isAdvance = advances.find(a => a._id === p._id);
    const category = isAdvance ? 'Advance' : 'Salary';
    
    // Calculate balance based on payment type
    let balance;
    if (category === 'Advance') {
      // For advances, show remaining balance after advance deduction
      balance = p.basicSalary - (p.deductions?.advance || 0);
    } else {
      // For salary payments, show full salary amount (no deductions in pending)
      balance = p.basicSalary || 0;
    }
    
    return {
      ...p,
      staffName: p.employee?.name || 'Unknown Staff',
      salary: p.basicSalary || 0,
      category: category,
      advancePaid: p.deductions?.advance || 0,
      balance: balance,
      pension: (p.basicSalary || 0) * 0.15, // 15% pension calculation (informational only)
      status: p.paymentStatus?.toLowerCase() || 'pending',
      dateIssued: formatDate(p.createdAt)
    };
  });

  console.log('\n📋 Transformed pending salaries:');
  transformedPending.forEach(p => {
    console.log(`  - ${p.staffName} (${p.category}):`);
  console.log(`    Salary: ${fmt(p.salary)}`);
  console.log(`    Amount (advancePaid): ${fmt(p.advancePaid)}`);
  console.log(`    Pending (balance): ${fmt(p.balance)}`);
  console.log(`    Pension (info only): ${fmt(p.pension)}`);
    console.log('');
  });

  return transformedPending;
}

// Run the test
const results = testSalaryPaymentLogic();

console.log('🎯 Expected Results:');
console.log('===================');
console.log('✅ John Doe (Salary):');
console.log('   - Salary: 50,000');
console.log('   - Amount: 0 (no advance)');
console.log('   - Pending: 50,000 (full salary)');
console.log('   - Pension: 7,500 (15% info only)');
console.log('');
console.log('✅ Jane Smith (Advance):');
console.log('   - Salary: 60,000');
console.log('   - Amount: 15,000 (advance paid)');
console.log('   - Pending: 45,000 (remaining balance)');
console.log('   - Pension: 9,000 (15% info only)');

console.log('\n🔍 Verification:');
const johnResult = results.find(r => r.staffName === 'John Doe');
const janeResult = results.find(r => r.staffName === 'Jane Smith');

if (johnResult && johnResult.balance === 50000 && johnResult.category === 'Salary') {
  console.log('✅ John Doe salary test PASSED - Shows full salary in pending');
} else {
  console.log('❌ John Doe salary test FAILED');
}

if (janeResult && janeResult.balance === 45000 && janeResult.category === 'Advance') {
  console.log('✅ Jane Smith advance test PASSED - Shows remaining balance');
} else {
  console.log('❌ Jane Smith advance test FAILED');
}

console.log('\n🎉 Testing completed!');