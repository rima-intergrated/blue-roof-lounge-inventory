import { useState, useEffect } from "react";
import { payrollAPI, staffAPI } from "./services/api";
import { useAuth } from "./context/AuthContext";
import formatCurrency from "./utils/formatCurrency";

function AdvancePayment (props) {
  const { user, loading: authLoading } = useAuth();
  const [viewMode, setViewMode] = useState('issue-payment');
  const [staff, setStaff] = useState(props.staff || []);
  const [pendingSalaries, setPendingSalaries] = useState(props.pendingSalaries || []);
  const [selectedStaff, setSelectedStaff] = useState("");
  const [paymentCategory, setPaymentCategory] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [advanceBalance, setAdvanceBalance] = useState("");
  const [balanceDate, setBalanceDate] = useState("");
  
  // Enhanced state with database integration
  const [allowancesIssued, setAllowancesIssued] = useState([]);
  const [advancesIssued, setAdvancesIssued] = useState([]);
  const [processedSalaries, setProcessedSalaries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Helper function for consistent date formatting
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      // Return format like "Sep 27, 2025" - clean and readable
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'N/A';
    }
  };

  // Load data from database when user is authenticated
  useEffect(() => {
    if (user && !authLoading) {
      loadPayrollData();
      loadStaffData();
    }
  }, [user, authLoading]);

  const loadPayrollData = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('🔄 Loading payroll data...');
      // Load all payroll records
      const payrollResponse = await payrollAPI.getAll();
      console.log('📊 Payroll response:', payrollResponse);
      
      if (payrollResponse.success) {
        const payrollData = payrollResponse.data.payrolls || [];
        console.log('📊 Raw payroll data:', payrollData);
        
        // Separate into different categories based on actual field names and logic
        // Classify payments based on paymentType field for better database persistence
        const allowances = payrollData.filter(p => {
          // Primary check: Use paymentType field for accurate identification
          if (p.paymentType === 'allowance') {
            return true;
          }
          
          // Fallback to checking allowances structure for backward compatibility
          const hasAllowances = p.allowances && 
            (p.allowances.other > 0 || p.allowances.transport > 0 || 
             p.allowances.housing > 0 || p.allowances.meal > 0 || 
             p.allowances.overtime > 0 || p.allowances.bonus > 0);
          const hasZeroBasicSalary = p.basicSalary === 0 || p.basicSalary === null;
          const hasNoAdvances = !p.deductions?.advance || p.deductions.advance === 0;
          
          return hasAllowances && hasZeroBasicSalary && hasNoAdvances;
        });
        
        // Filter pending payments excluding allowance-only payments
        const pending = payrollData.filter(p => {
          const isPendingStatus = p.paymentStatus === 'Pending' || p.paymentStatus === 'pending';
          const isAllowanceType = p.paymentType === 'allowance';
          const isAllowanceOnly = allowances.find(a => a._id === p._id);
          
          return isPendingStatus && !isAllowanceType && !isAllowanceOnly;
        });
        
        const processed = payrollData.filter(p => {
          const isProcessedStatus = p.paymentStatus === 'Processed' || p.paymentStatus === 'Paid' ||
                                   p.paymentStatus === 'processed' || p.paymentStatus === 'paid';
          const isAllowanceType = p.paymentType === 'allowance';
          // Exclude allowances from processed salaries since they're handled separately
          return isProcessedStatus && !isAllowanceType;
        });
        
        const advances = payrollData.filter(p => {
          // Use paymentType field for accurate identification
          if (p.paymentType === 'advance') {
            return true;
          }
          // Fallback to checking deductions structure for backward compatibility
          const hasAdvances = p.deductions && p.deductions.advance > 0;
          return hasAdvances;
        });
        
        // Transform data to match frontend expectations
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
            dateIssued: formatDate(p.createdAt), // Use clean date formatting
            lastAdvanceDate: isAdvance ? p.createdAt : null
          };
        });
        
        const transformedAllowances = allowances.map(p => ({
          ...p,
          staffName: p.employee?.name || 'Unknown Staff',
          amount: (p.allowances?.other || 0) + (p.allowances?.transport || 0) + 
                 (p.allowances?.housing || 0) + (p.allowances?.meal || 0) + 
                 (p.allowances?.overtime || 0) + (p.allowances?.bonus || 0),
          date: formatDate(p.createdAt),
          type: 'allowance',
          status: 'issued'
        }));
        
        const transformedAdvances = advances.map(p => {
          // Find if this advance has been processed (balance paid)
          const correspondingProcessed = processed.find(proc => 
            proc._id === p._id || 
            (proc.employee?._id === p.employee?._id && proc.deductions?.advance > 0)
          );
          
          return {
            ...p,
            staffName: p.employee?.name || 'Unknown Staff',
            advanceIssued: p.deductions?.advance || 0,
            issuedDate: formatDate(p.createdAt),
            balance: p.basicSalary - (p.deductions?.advance || 0),
            balanceDate: correspondingProcessed ? formatDate(correspondingProcessed.paymentDate || correspondingProcessed.updatedAt) : null,
            salaryId: p._id,
            type: 'advance',
            status: correspondingProcessed ? 'settled' : 'pending'
          };
        });
        
        // Transform processed salaries the same way as pending salaries
        const transformedProcessed = processed.map(p => {
          const isAdvance = advances.find(a => a._id === p._id);
          const category = isAdvance ? 'Advance' : 'Salary';
          
          // Calculate balance based on payment type (same logic as pending)
          let balance;
          if (category === 'Advance') {
            // For advances, show remaining balance after advance deduction
            balance = p.basicSalary - (p.deductions?.advance || 0);
          } else {
            // For salary payments, show full salary amount
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
            status: p.paymentStatus?.toLowerCase() || 'processed',
            processedDate: formatDate(p.paymentDate) !== 'N/A' ? formatDate(p.paymentDate) : 
                          formatDate(p.updatedAt) !== 'N/A' ? formatDate(p.updatedAt) : 'N/A'
          };
        });

        // Simply use the fresh data from database - backend should handle persistence
        setPendingSalaries(transformedPending);
        // If parent provided a setter (AppLayout), sync the top-level pendingSalaries
        if (typeof props.setPendingSalaries === 'function') {
          try {
            props.setPendingSalaries(transformedPending);
          } catch (e) {
            // non-fatal
            // eslint-disable-next-line no-console
            console.warn('Failed to sync pendingSalaries to parent:', e && e.message);
          }
        }
        setProcessedSalaries(transformedProcessed);
        
        setAllowancesIssued(transformedAllowances);
        setAdvancesIssued(transformedAdvances);
        
        console.log('✅ Payroll data loaded and transformed successfully');
        console.log('📊 Pending salaries:', transformedPending);
        console.log('📊 Processed salaries:', transformedProcessed);
        console.log('📊 Allowances:', transformedAllowances);
        console.log('📊 Advances:', transformedAdvances);
      } else {
        console.warn('⚠️ Payroll response not successful:', payrollResponse);
        setError('Failed to load payroll data: ' + (payrollResponse.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('❌ Error loading payroll data:', error);
      if (error.message.includes('Failed to fetch')) {
        setError('Network error: Unable to connect to the server. Please check if the backend server is running.');
      } else {
        setError('Failed to load payroll data: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadStaffData = async () => {
    try {
      // Load staff data if not provided via props
      if (!props.staff || props.staff.length === 0) {
        console.log('🔄 Loading staff data...');
        const staffResponse = await staffAPI.getAll();
        console.log('👥 Staff response:', staffResponse);
        
        if (staffResponse.success) {
          setStaff(staffResponse.data.staff || []);
          console.log('✅ Staff data loaded successfully');
        } else {
          console.warn('⚠️ Staff response not successful:', staffResponse);
        }
      }
    } catch (error) {
      console.error('❌ Error loading staff data:', error);
      if (error.message.includes('Failed to fetch')) {
        setError('Network error: Unable to connect to the server for staff data.');
      }
    }
  };

  // Pagination states
  const [pendingSalariesPage, setPendingSalariesPage] = useState(1);
  const [processedSalariesPage, setProcessedSalariesPage] = useState(1);
  const [advancesPage, setAdvancesPage] = useState(1);
  const [allowancesPage, setAllowancesPage] = useState(1);
  const itemsPerPage = 5;

  function handleStaffChange(e) {
    setSelectedStaff(e.target.value);
    
    // Auto-fill amount if salary category is selected
    if (paymentCategory === "Salary" && e.target.value) {
      const staffMember = staff.find(member => 
        member._id === e.target.value || member.name === e.target.value
      );
      if (staffMember && staffMember.salary) {
        setPaymentAmount(staffMember.salary.toString());
        console.log(`💰 Auto-filled salary amount: ${staffMember.salary} for ${staffMember.name}`);
      }
    }
  }

  function handlePaymentCategoryChange(e) {
    const newCategory = e.target.value;
    setPaymentCategory(newCategory);
    
    // Auto-fill amount for salary payments
    if (newCategory === "Salary" && selectedStaff) {
      const staffMember = staff.find(member => 
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

  function handleAmountChange(e) {
    // Prevent manual changes for salary payments to maintain consistency
    if (paymentCategory === "Salary") {
      console.log('⚠️ Cannot manually change salary amount - it is auto-filled from staff record');
      return;
    }
    setPaymentAmount(e.target.value);
  }

  function handleDateChange(e) {
    setPaymentDate(e.target.value);
  }

  function handleAdvanceBalanceChange(e) {
    setAdvanceBalance(e.target.value);
  }

  function handleBalanceDateChange(e) {
    setBalanceDate(e.target.value);
  }

  async function handleProcessPayment() {
    if (!selectedStaff || !paymentAmount || !paymentDate || !paymentCategory) {
      alert('Please fill all required fields');
      return;
    }

    if (loading) {
      console.log('⏳ Payment already in progress, skipping...');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Find the selected staff member to get their salary
      const staffMember = staff.find(member => 
        member.name === selectedStaff || member._id === selectedStaff
      );
      if (!staffMember) {
        alert('Staff member not found');
        return;
      }

      // Create proper ISO8601 date format for the payPeriod (using specific date + time to avoid duplicates)
      const selectedDate = new Date(paymentDate);
      const uniqueStartTime = new Date(selectedDate.getTime() + Math.random() * 1000); // Add random milliseconds
      const uniqueEndTime = new Date(uniqueStartTime.getTime() + 60000); // 1 minute duration

      const requestId = `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.log(`🆔 Processing payment request: ${requestId}`);

      const basePaymentData = {
        employee: staffMember._id,
        basicSalary: 0, // Set to 0 for allowance payments - will be overridden for salary/advance payments
        payPeriod: {
          startDate: uniqueStartTime.toISOString(),
          endDate: uniqueEndTime.toISOString()
        },
        workingDays: {
          expected: 30,
          actual: 30
        },
        paymentMethod: 'Cash', // Default payment method
        paymentType: paymentCategory.toLowerCase(), // Add payment type for categorization
        notes: `${paymentCategory} payment processed on ${paymentDate} (${requestId})`
      };

      let paymentData;

      if (paymentCategory === "Allowance") {
        paymentData = {
          ...basePaymentData,
          basicSalary: 0, // Allowances have zero basic salary
          allowances: {
            other: parseFloat(paymentAmount)
          },
          deductions: {},
          paymentStatus: 'Paid', // Set allowances as immediately paid since they're independent
          paymentType: 'allowance' // Add specific type for clear identification
        };
        
        // Create allowance record in database
        console.log('🔄 Creating allowance payment with data:', JSON.stringify(paymentData, null, 2));
        const response = await payrollAPI.create(paymentData);
        if (response.success) {
          console.log('✅ Allowance payment created successfully:', response.data.payroll);
          
          // Update local allowances state with proper structure
          const newAllowance = {
            _id: response.data.payroll._id,
            staffName: staffMember.name || selectedStaff,
            staffId: response.data.payroll.employee,
            amount: parseFloat(paymentAmount),
            date: formatDate(paymentDate),
            type: 'allowance',
            payrollReference: response.data.payroll.payrollReference,
            status: 'issued',
            createdAt: new Date().toISOString()
          };
          
          setAllowancesIssued(prev => [...prev, newAllowance]);
          
          // Only refresh allowances data, don't reload all payroll data
          // This prevents allowances from appearing in pending salaries
          console.log('✅ Allowance processed independently - not adding to pending salaries');
        }
      } else if (paymentCategory === "Advance") {
        const advanceAmount = parseFloat(paymentAmount);
        const staffSalary = parseFloat(staffMember.salary) || 0;
        const calculatedBalance = staffSalary - advanceAmount;

        paymentData = {
          ...basePaymentData,
          basicSalary: staffSalary, // Set the actual staff salary for advance payments
          allowances: {},
          deductions: {
            advance: advanceAmount
          }
        };

        // Create advance record in database
        console.log('🔄 Creating advance payment with data:', JSON.stringify(paymentData, null, 2));
        const response = await payrollAPI.create(paymentData);
        if (response.success) {
          console.log('✅ Advance payment created successfully:', response.data.payroll);
          
          // Update advances issued state with proper structure
          const newAdvance = {
            _id: response.data.payroll._id,
            staffName: staffMember.name || selectedStaff,
            staffId: response.data.payroll.employee,
            advanceIssued: advanceAmount,
            issuedDate: formatDate(paymentDate),
            balance: calculatedBalance,
            balanceDate: null,
            salaryId: response.data.payroll._id,
            type: 'advance',
            payrollReference: response.data.payroll.payrollReference,
            status: 'issued'
          };
          
          setAdvancesIssued(prev => [...prev, newAdvance]);

          // Add to pending salaries with proper structure
          const newPendingSalary = {
            _id: response.data.payroll._id,
            staffName: staffMember.name || selectedStaff,
            staffId: response.data.payroll.employee,
            salary: staffSalary,
            category: 'Advance',
            advancePaid: advanceAmount,
            balance: calculatedBalance,
            pension: staffSalary * 0.15,
            status: 'pending',
            dateIssued: formatDate(paymentDate), // Add formatted issued date
            lastAdvanceDate: paymentDate,
            payrollReference: response.data.payroll.payrollReference,
            createdAt: new Date().toISOString()
          };
          
          setPendingSalaries(prev => {
            const next = [...prev, newPendingSalary];
            if (typeof props.setPendingSalaries === 'function') {
              try { props.setPendingSalaries(next); } catch (e) { /* ignore */ }
            }
            return next;
          });
          
          // Refresh payroll data
          await loadPayrollData();
        }
      } else if (paymentCategory === "Salary") {
        // Direct salary payment - full salary amount without automatic deductions
        const staffSalary = parseFloat(staffMember.salary) || 0;
        
        paymentData = {
          ...basePaymentData,
          basicSalary: staffSalary, // Set the actual staff salary for salary payments
          allowances: {},
          deductions: {} // No automatic deductions for salary payments
        };

        console.log('🔄 Creating salary payment with data:', JSON.stringify(paymentData, null, 2));
        const response = await payrollAPI.create(paymentData);
        if (response.success) {
          console.log('✅ Salary payment created successfully:', response.data.payroll);
          
          // Add to pending salaries with proper structure
          const newSalaryEntry = {
            _id: response.data.payroll._id,
            staffName: staffMember.name || selectedStaff,
            staffId: response.data.payroll.employee,
            salary: staffSalary,
            category: 'Salary',
            advancePaid: 0,
            balance: staffSalary, // Show full salary amount as pending (not deducted)
            pension: staffSalary * 0.15, // Pension is just for display/information
            status: 'pending',
            dateIssued: formatDate(paymentDate), // Add formatted issued date
            lastAdvanceDate: null,
            payrollReference: response.data.payroll.payrollReference,
            grossPay: response.data.payroll.grossPay,
            netPay: response.data.payroll.netPay,
            deductions: response.data.payroll.deductions,
            createdAt: new Date().toISOString()
          };
          
          setPendingSalaries(prev => {
            const next = [...prev, newSalaryEntry];
            if (typeof props.setPendingSalaries === 'function') {
              try { props.setPendingSalaries(next); } catch (e) { /* ignore */ }
            }
            return next;
          });
          
          // Refresh payroll data
          await loadPayrollData();
        }
      }

      // Clear form fields on success
      setSelectedStaff("");
      setPaymentAmount("");
      setPaymentDate("");
      setPaymentCategory("");
      setAdvanceBalance("");
      setBalanceDate("");

      // Only refresh all payroll data for advances and salaries, not for allowances
      if (paymentCategory !== "Allowance") {
        await loadPayrollData();
      }
      
      alert('Payment processed successfully!');

    } catch (error) {
      console.error('Error processing payment:', error);
      
      // Extract more specific error message
      let errorMessage = 'Failed to process payment. Please try again.';
      if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      alert(`Error processing payment: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }

  // Function to process pending salary (move from pending to processed)
  async function handleProcessSalary(salaryId) {
    setLoading(true);
    setError(null);

    try {
      const salaryToProcess = pendingSalaries.find(salary => 
        salary.id === salaryId || salary._id === salaryId
      );
      if (!salaryToProcess) {
        alert('Salary record not found');
        return;
      }

      const processedDate = new Date().toISOString().split('T')[0];

      // Mark salary as paid using the dedicated endpoint
      const paymentData = {
        paymentMethod: 'Cash',
        paidDate: processedDate
      };

      console.log('🔄 Marking salary as paid with data:', paymentData);
      console.log('🎯 Processing payroll ID:', salaryToProcess._id || salaryId);
      
      const response = await payrollAPI.markAsPaid(salaryToProcess._id || salaryId, paymentData);
      console.log('📨 markAsPaid response:', response);

      if (response.success) {
        console.log('✅ Payment processed successfully, updating advance balance dates...');
        
        // Update advance balance dates for matching records
        if (salaryToProcess.category === 'Advance') {
          setAdvancesIssued(prev => prev.map(advance => {
            if (advance.salaryId === salaryToProcess._id || advance._id === salaryToProcess._id) {
              return {
                ...advance,
                balanceDate: formatDate(processedDate)
              };
            }
            return advance;
          }));
        }
        
        // Reload fresh data from database
        await loadPayrollData();
        
        alert('Salary processed successfully!');
      }
    } catch (error) {
      console.error('Error processing salary:', error);
      setError('Failed to process salary. Please try again.');
      alert('Error processing salary. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // Pagination helper functions
  const paginate = (items, currentPage) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return items.slice(startIndex, endIndex);
  };

  const getTotalPages = (items) => {
    return Math.ceil(items.length / itemsPerPage);
  };

  const PaginationControls = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;
    
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '10px',
        marginTop: '20px',
        fontFamily: 'Arial, sans-serif'
      }}>
        <button 
          className="reset-password-button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          style={{ 
            opacity: currentPage === 1 ? 0.5 : 1,
            cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
          }}
        >
          Previous
        </button>
        
        <span style={{ 
          margin: '0 15px',
          fontWeight: '500',
          fontSize: '1rem'
        }}>
          {currentPage} / {totalPages}
        </span>
        
        <button 
          className="reset-password-button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          style={{ 
            opacity: currentPage === totalPages ? 0.5 : 1,
            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
          }}
        >
          Next
        </button>
      </div>
    );
  };

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="order-container" style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '400px',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #3498db',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          <p>Loading payroll system...</p>
        </div>
      </div>
    );
  }

  // Show login prompt if not authenticated
  if (!user) {
    return (
      <div className="order-container" style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '400px',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{ 
          textAlign: 'center', 
          padding: '2rem',
          backgroundColor: '#f8f9fa',
          borderRadius: '10px',
          border: '1px solid #dee2e6'
        }}>
          <h3 style={{ color: '#6c757d', margin: '0 0 1rem 0' }}>🔐 Authentication Required</h3>
          <p style={{ color: '#6c757d', margin: 0 }}>Please log in to access the payroll system.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="order-container">

      {/* Dashboard Summary */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-around',
        margin: '1rem 0',
        padding: '1rem',
        backgroundColor: '#f8f9fa',
        borderRadius: '10px',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h4 style={{ margin: '0 0 0.5rem 0', color: '#007bff' }}>Pending Salaries</h4>
          <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>{pendingSalaries.length}</p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <h4 style={{ margin: '0 0 0.5rem 0', color: '#28a745' }}>Processed Salaries</h4>
          <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>{processedSalaries.length}</p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <h4 style={{ margin: '0 0 0.5rem 0', color: '#ffc107' }}>Advances Issued</h4>
          <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>{advancesIssued.length}</p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <h4 style={{ margin: '0 0 0.5rem 0', color: '#17a2b8' }}>Allowances Issued</h4>
          <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>{allowancesIssued.length}</p>
        </div>
      </div>

      <div className="sales-options">
          <div>
            <button className="sales-btn" onClick={() => setViewMode('issue-payment')}>Issue Payment</button>
          </div>
          <div>
            <button className="sales-btn" onClick={() => setViewMode('salaries-pending')}>Salaries Pending</button>
          </div>
          <div>
            <button className="sales-btn" onClick={() => setViewMode('salaries-processed')}>Salaries Processed</button>
          </div>
          <div>
            <button className="sales-btn" onClick={() => setViewMode('advances-issued')}>Advances Issued</button>
          </div>
          <div>
            <button className="sales-btn" onClick={() => setViewMode('allowances-issued')}>Allowances Issued</button>
          </div>
          <div>
            <button 
              className="sales-btn" 
              onClick={loadPayrollData}
              disabled={loading}
              style={{
                backgroundColor: loading ? '#6c757d' : '#007bff',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? '⏳ Loading...' : '🔄 Refresh Data'}
            </button>
          </div>
        </div>

      {viewMode === 'issue-payment' && (
        <div className="main-advance-payment-container">       

      <div className="advance-payment-container">
        <h2>Issue Payment</h2>
        <select className="select-staff-member" value={paymentCategory} onChange={handlePaymentCategoryChange}>
            <option value="">Select payment category</option>
            <option value="Allowance">Allowance</option>
            <option value="Advance">Advance</option>
            <option value="Salary">Salary</option>
          </select>

        <select className="select-staff-member" value={selectedStaff} onChange= {handleStaffChange}>
          <option value="">Choose staff member</option>
          {staff.map((member, idx) => (
            <option key={member._id || idx} value={member._id || member.name}>
              {member.name || member.firstName + ' ' + member.lastName}
            </option>
          ))}
        </select>
          <input className="input-field" placeholder="Select date" type="date" value={paymentDate} onChange={handleDateChange} />
          <input 
            className="input-field" 
            placeholder={paymentCategory === "Salary" ? "Amount (auto-filled from staff salary)" : "Enter amount"} 
            type="number" 
            value={paymentAmount} 
            onChange={handleAmountChange}
            readOnly={paymentCategory === "Salary"}
            style={{
              backgroundColor: paymentCategory === "Salary" ? '#f8f9fa' : 'white',
              cursor: paymentCategory === "Salary" ? 'not-allowed' : 'text',
              color: paymentCategory === "Salary" ? '#6c757d' : 'black'
            }}
          />
              {paymentCategory === "Salary" && paymentAmount && (
            <div style={{ 
              padding: '0.5rem', 
              backgroundColor: '#d4edda', 
              borderRadius: '5px', 
              margin: '0.5rem 0',
              fontFamily: 'Arial, sans-serif',
              fontSize: '0.9rem',
              color: '#155724',
              border: '1px solid #c3e6cb'
            }}>
              💰 <strong>Salary Payment:</strong> Amount automatically set to staff member's salary ({formatCurrency(paymentAmount)})
            </div>
          )}
          {paymentCategory === "Advance" && selectedStaff && (
              <div style={{ 
                padding: '1rem', 
                backgroundColor: '#f8f9fa', 
                borderRadius: '5px', 
                margin: '0.5rem 0',
                fontFamily: 'Arial, sans-serif'
              }}>
                <p style={{ margin: '0.25rem 0', fontSize: '0.9rem' }}>
                  <strong>Staff Salary:</strong> {formatCurrency(staff.find(member => member._id === selectedStaff || member.name === selectedStaff)?.salary || 0)}
                </p>
                <p style={{ margin: '0.25rem 0', fontSize: '0.9rem' }}>
                  <strong>Advance Amount:</strong> {formatCurrency(paymentAmount || 0)}
                </p>
                <p style={{ margin: '0.25rem 0', fontSize: '0.9rem' }}>
                  <strong>Remaining Balance:</strong> {
                    (() => {
                      const staffMember = staff.find(member => member._id === selectedStaff || member.name === selectedStaff);
                      return paymentAmount && staffMember 
                        ? formatCurrency((parseFloat(staffMember.salary) - parseFloat(paymentAmount)) || 0)
                        : formatCurrency(0);
                    })()
                  }
                </p>
              </div>
            )}
        <div className="total-display">
          <h3>Total:</h3>
          <span>
            {(() => {
              // For salary payments, show the staff member's actual salary
              if (paymentCategory === "Salary" && selectedStaff) {
                const staffMember = staff.find(member => 
                  member._id === selectedStaff || member.name === selectedStaff
                );
                if (staffMember && staffMember.salary) {
                  return formatCurrency(staffMember.salary);
                }
              }
              // For other payment types, show the entered amount
              return paymentAmount ? formatCurrency(paymentAmount) : formatCurrency(0);
            })()}
          </span>
        </div>
        {/* Display payment type indicator in total section */}
        {paymentCategory && (
          <div style={{
            textAlign: 'center',
            marginTop: '0.5rem',
            fontSize: '0.9rem',
            color: '#6c757d',
            fontFamily: 'Arial, sans-serif'
          }}>
            {paymentCategory === "Salary" && selectedStaff ? 
              `📋 ${paymentCategory} Payment for ${staff.find(member => member._id === selectedStaff || member.name === selectedStaff)?.name || 'Selected Staff'}` :
              `📋 ${paymentCategory} Payment`
            }
          </div>
        )}
        {error && (
          <div style={{
            backgroundColor: '#f8d7da',
            color: '#721c24',
            padding: '0.75rem',
            borderRadius: '5px',
            marginBottom: '1rem',
            border: '1px solid #f5c6cb'
          }}>
            {error}
          </div>
        )}
        
        <button 
          className="process-transaction-button" 
          onClick={handleProcessPayment}
          disabled={!selectedStaff || !paymentAmount || !paymentDate || !paymentCategory || loading}
          style={{
            backgroundColor: (!selectedStaff || !paymentAmount || !paymentDate || !paymentCategory || loading) ? '#6c757d' : '#28a745',
            color: 'white',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: '5px',
            fontSize: '1rem',
            fontWeight: 'bold',
            fontFamily: 'Arial, sans-serif',
            cursor: (!selectedStaff || !paymentAmount || !paymentDate || !paymentCategory || loading) ? 'not-allowed' : 'pointer',
            opacity: (!selectedStaff || !paymentAmount || !paymentDate || !paymentCategory || loading) ? 0.6 : 1,
            transition: 'all 0.2s ease',
            width: '100%',
            marginTop: '1rem'
          }}
          onMouseEnter={(e) => {
            if (selectedStaff && paymentAmount && paymentDate && paymentCategory && !loading) {
              e.target.style.backgroundColor = '#218838';
              e.target.style.transform = 'scale(1.02)';
            }
          }}
          onMouseLeave={(e) => {
            if (selectedStaff && paymentAmount && paymentDate && paymentCategory && !loading) {
              e.target.style.backgroundColor = '#28a745';
              e.target.style.transform = 'scale(1)';
            }
          }}
        >
          {loading ? '⏳ Processing...' : 
           (!selectedStaff || !paymentAmount || !paymentDate || !paymentCategory) ? 'Complete Required Fields' : 'Process Payment'}
        </button>
      </div>
    </div>
      )}
    
      {viewMode === 'salaries-pending' && (
        <div className="salary-container">
      <div className="salary-title">
          <h2>Salaries Pending</h2>
      </div>
      <div className="salary-mini-container">        
        
        <div className="salary-information">
          <div className="salary-items">
            <h2 className="date-requested">Date issued</h2>
            <h2 className="staff-name">Staff name</h2>
            <h2 className="salary">Salary</h2>
            <h2 className="salary">Category</h2>
            <h2 className="advance-paid">Amount</h2>
            <h2 className="balance">Pending</h2>
            <h2 className="balance">Pension</h2>
            <h2 className="action">Action</h2>
          </div>
          
          {/* Scrollable container for pending salaries */}
          <div style={{
            maxHeight: '400px',
            overflowY: 'auto',
            overflowX: 'hidden',
            border: '1px solid #e5e5e5',
            borderRadius: '8px',
            backgroundColor: 'white'
          }}>
            {pendingSalaries.length === 0 ? (
              <div className="salary-item-info">
                <p className="date-requested">No pending salaries</p>
                <p className="staff-name">-</p>
                <p className="salary">-</p>
                <p className="salary">-</p>
                <p className="advance-paid">-</p>
                <p className="balance">-</p>
                <p className="balance">-</p>
                <p className="action">-</p>
              </div>
            ) : (
              paginate(pendingSalaries, pendingSalariesPage).map((salary) => (
                <div className="salary-item-info" key={salary.id}>
                  <p className="date-requested">{salary.dateIssued || 'N/A'}</p>
                  <p className="staff-name">{salary.staffName || 'N/A'}</p>
                  <p className="salary">{formatCurrency(salary.salary || 0)}</p>
                  <p className="salary">{salary.category || 'N/A'}</p>
                  <p className="advance-paid">{formatCurrency(salary.advancePaid || 0)}</p>
                  <p className="balance">{formatCurrency(salary.balance || 0)}</p>
                  <p className="balance">{formatCurrency(salary.pension || 0)}</p>
                  <p className="action">
                    <button 
                      className="resolve-button"
                      onClick={() => handleProcessSalary(salary._id || salary.id)}
                      disabled={loading}
                      style={{
                        backgroundColor: '#28a745',
                        border: 'none',
                        padding: '8px 12px',
                        color: 'white',
                        fontSize: '0.9rem',
                        fontWeight: 'normal',
                        fontFamily: 'Arial, sans-serif',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#218838';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = '#28a745';
                      }}
                    >
                      Process
                    </button>
                  </p>
                </div>
              ))
            )}
          </div>
          
          {/* Pagination Controls for Pending Salaries */}
          <PaginationControls 
            currentPage={pendingSalariesPage}
            totalPages={getTotalPages(pendingSalaries)}
            onPageChange={setPendingSalariesPage}
          />
        </div>
        </div>
    </div>
      )}
    
      {viewMode === 'salaries-processed' && (
        <div className="salary-container">
      <div className="salary-title">
          <h2>Salaries Processed</h2>
      </div>
      <div className="salary-mini-container">        

        <div className="salary-information">
          <div className="salary-items">
            <h2 className="staff-name">Staff name</h2>
            <h2 className="salary">Salary</h2>
            <h2 className="advance-paid">Pension</h2>
            <h2 className="date-resolved">Date processed</h2>
          </div>

          {/* Scrollable container for processed salaries */}
          <div style={{
            maxHeight: '400px',
            overflowY: 'auto',
            overflowX: 'hidden',
            border: '1px solid #e5e5e5',
            borderRadius: '8px',
            backgroundColor: 'white'
          }}>
            {processedSalaries.length === 0 ? (
              <div className="salary-item-info">
                <p className="staff-name">No processed salaries yet</p>
                <p className="salary">-</p>
                <p className="advance-paid">-</p>
                <p className="date-resolved">-</p>
              </div>
            ) : (
              paginate(processedSalaries, processedSalariesPage).map((salary) => (
                <div className="salary-item-info" key={salary.id}>
                  <p className="staff-name">{salary.staffName || 'N/A'}</p>
                  <p className="salary">{formatCurrency(salary.salary || 0)}</p>
                  <p className="advance-paid">{formatCurrency(salary.pension || 0)}</p>
                  <p className="date-resolved">{salary.processedDate || 'N/A'}</p>
                </div>
              ))
            )}
          </div>
          
          {/* Pagination Controls for Processed Salaries */}
          <PaginationControls 
            currentPage={processedSalariesPage}
            totalPages={getTotalPages(processedSalaries)}
            onPageChange={setProcessedSalariesPage}
          />
        </div>
        </div>
    </div>
      )}

      {viewMode === 'advances-issued' && (
        <div className="salary-container">
      <div className="salary-title">
          <h2>Advances Issued</h2>
      </div>
      <div className="salary-mini-container">        

        <div className="salary-information">
          <div className="salary-items">                        
            <h2 className="staff-name">Staff name</h2>
            <h2 className="advance-paid">Advance issued</h2>
            <h2 className="date-requested">Adv. issued date</h2>
            <h2 className="advance-paid">Balance</h2>
            <h2 className="date-resolved">Bal. issued date</h2>
          </div>

          {/* Scrollable container for advances issued */}
          <div style={{
            maxHeight: '400px',
            overflowY: 'auto',
            overflowX: 'hidden',
            border: '1px solid #e5e5e5',
            borderRadius: '8px',
            backgroundColor: 'white'
          }}>
            {advancesIssued.length === 0 ? (
              <div className="salary-item-info">
                <p className="staff-name">No advances issued yet</p>
                <p className="advance-paid">-</p>
                <p className="date-requested">-</p>
                <p className="advance-paid">-</p>
                <p className="date-resolved">-</p>
              </div>
            ) : (
              paginate(advancesIssued, advancesPage).map((advance, idx) => (
                <div className="salary-item-info" key={idx}>
                  <p className="staff-name">{advance.staffName || 'N/A'}</p>
                  <p className="advance-paid">{formatCurrency(advance.advanceIssued || 0)}</p>
                  <p className="date-requested">{advance.issuedDate || 'N/A'}</p>
                  <p className="advance-paid">{formatCurrency(advance.balance || 0)}</p>
                  <p className="date-resolved" style={{
                    color: advance.balanceDate ? '#28a745' : '#dc3545',
                    fontWeight: advance.balanceDate ? 'normal' : 'bold'
                  }}>
                    {advance.balanceDate || 'Pending'}
                  </p>
                </div>
              ))
            )}
          </div>
          
          {/* Pagination Controls for Advances Issued */}
          <PaginationControls 
            currentPage={advancesPage}
            totalPages={getTotalPages(advancesIssued)}
            onPageChange={setAdvancesPage}
          />
        </div>
        </div>
    </div>
      )}

      {viewMode === 'allowances-issued' && (
          <div className="salary-container">
            <div className="salary-title">
              <h2>Allowances Issued</h2>
            </div>
            <div className="salary-mini-container">        
              <div className="salary-information">
                <div className="salary-items">
                  <h2 className="staff-name">Staff name</h2>
                  <h2 className="advance-paid">Amount issued</h2>
                  <h2 className="date-resolved">Date issued</h2>
                </div>
                
                {/* Scrollable container for allowances issued */}
                <div style={{
                  maxHeight: '400px',
                  overflowY: 'auto',
                  overflowX: 'hidden',
                  border: '1px solid #e5e5e5',
                  borderRadius: '8px',
                  backgroundColor: 'white'
                }}>
                  {allowancesIssued.length === 0 ? (
                    <div className="salary-item-info">
                      <p className="staff-name">No allowances issued yet</p>
                      <p className="advance-paid">-</p>
                      <p className="date-resolved">-</p>
                    </div>
                  ) : (
                    paginate(allowancesIssued, allowancesPage).map((item, idx) => (
                      <div className="salary-item-info" key={idx}>
                        <p className="staff-name">{item.staffName || 'N/A'}</p>
                        <p className="advance-paid">{formatCurrency(item.amount || 0)}</p>
                        <p className="date-resolved">{item.date || 'N/A'}</p>
                      </div>
                    ))
                  )}
                </div>
                
                {/* Pagination Controls for Allowances Issued */}
                <PaginationControls 
                  currentPage={allowancesPage}
                  totalPages={getTotalPages(allowancesIssued)}
                  onPageChange={setAllowancesPage}
                />
              </div>
            </div>
          </div>
      )}
    
    </div>
  );
}

export default AdvancePayment;