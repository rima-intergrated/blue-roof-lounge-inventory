import { useState, useEffect } from "react";
import { staffAPI, positionAPI, authAPI } from './services/api';
import { LoadingSpinner, ErrorMessage, SuccessMessage } from './components/common/FeedbackComponents';
import { useAuth } from './context/AuthContext';
import StaffRegistrationModal from './components/StaffRegistrationModal';

function RegisterNewStaff({ staff = [], setStaff }) {
  const { user, loading: authLoading } = useAuth();
  const [viewMode, setViewMode] = useState('register');
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  // Staff registration states
  const [staffName, setStaffName] = useState("");
  const [staffGender, setStaffGender] = useState("");
  const [staffContact, setStaffContact] = useState("");
  const [staffEmail, setStaffEmail] = useState("");
  const [staffPosition, setStaffPosition] = useState("");
  const [staffAddress, setStaffAddress] = useState("");
  const [staffSalary, setStaffSalary] = useState("");
  const [isEmployed, setIsEmployed] = useState(true);
  const [selectedStaffMember, setSelectedStaffMember] = useState("");

  // Form states
  const [successMessage, setSuccessMessage] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [resendLoadingMap, setResendLoadingMap] = useState({});
  
  // Modal states
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [modalData, setModalData] = useState({
    staffName: '',
    email: '',
    setupUrl: '',
    emailSent: false
  });
  
  const [newPositionName, setNewPositionName] = useState("");
  const [selectedPosition, setSelectedPosition] = useState("");
  const [editingPermissions, setEditingPermissions] = useState(null);

  // Load positions and staff when user is authenticated
  useEffect(() => {
    if (user && !authLoading) {
      loadPositions();
      loadStaff();
    }
  }, [user, authLoading]);

  // Load staff when viewMode changes to 'staff' and user is authenticated
  useEffect(() => {
    if (viewMode === 'staff' && user && !authLoading) {
      loadStaff();
    }
  }, [viewMode, user, authLoading]);

  const loadPositions = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading positions from API...');
      const response = await positionAPI.getAll();
      console.log('📋 Positions API response:', response);
      if (response.success) {
        const positionsArray = response.data.positions || [];
        console.log('✅ Positions loaded successfully:', positionsArray.length, 'positions');
        setPositions(positionsArray);
      } else {
        console.error('❌ Failed to load positions:', response.message);
        setError('Failed to load positions: ' + (response.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error loading positions:', error);
      setError('Failed to load positions');
    } finally {
      setLoading(false);
    }
  };

  const loadStaff = async () => {
    try {
      setLoading(true);
      const response = await staffAPI.getAll();
      if (response.success) {
        setStaff(response.data.staff || []);
      }
    } catch (error) {
      console.error('Error loading staff:', error);
      setError('Failed to load staff members');
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  const createStaff = async (staffData) => {
    try {
      const response = await staffAPI.create(staffData);
      
      if (response.success) {
        // Reload staff list to ensure it's up to date
        await loadStaff();
        return { success: true, data: response.data };
      } else {
        throw new Error(response.message || 'Failed to create staff member');
      }
    } catch (error) {
      console.error('Error creating staff:', error);
      setError(error.message || 'Failed to create staff member');
      return { success: false, error: error.message };
    }
  };
  
  // Pagination states
  const [staffCurrentPage, setStaffCurrentPage] = useState(1);
  const [positionsCurrentPage, setPositionsCurrentPage] = useState(1);
  const [permissionsCurrentPage, setPermissionsCurrentPage] = useState(1);
  const itemsPerPage = 10; // Configurable items per page
  
  const availableSections = [
    { id: "sales", name: "Sales & POS" },
    { id: "hrm", name: "Human Resource Management" },
    { id: "payroll", name: "Payroll Management" },
    { id: "settings", name: "Settings & Profile" },
    { id: "inventory", name: "Inventory Management" },
    { id: "reports", name: "Business Dashboard" }
  ];

  function handleStaffSelect(event) {
    setSelectedStaffMember(event.target.value);
  }
  

  
  const handleRegisterNewStaff = async () => {
    // Validation
    if (!staffName.trim() || !staffEmail.trim() || !staffPosition.trim()) {
      alert('Please fill in all required fields (Name, Email, Position)');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(staffEmail)) {
      alert('Please enter a valid email address');
      return;
    }

    const newStaff = {
      name: staffName.trim(),
      gender: staffGender,
      contact: staffContact.trim(),
      email: staffEmail.trim(),
      position: staffPosition,
      address: staffAddress.trim(),
      salary: parseFloat(staffSalary) || 0,
      employed: isEmployed,
    };

    setFormLoading(true);
    clearError();

    const result = await createStaff(newStaff);
    
    if (result.success) {
      const staffData = result.data.staff;
      const emailSent = result.data.passwordSetupSent;
      const setupUrl = result.data.setupUrl;
      
      // Check if email was sent successfully
      let emailDelivered = false;
      if (emailSent && emailSent.length > 0) {
        const emailResult = emailSent.find(n => n.method === 'gmail-smtp' || n.method === 'resend-api' || n.method === 'email');
        emailDelivered = emailResult && emailResult.success;
      }
      
      // Show modal with registration details
      setModalData({
        staffName: staffData.name,
        email: staffData.email,
        setupUrl: setupUrl,
        emailSent: emailDelivered
      });
      setShowRegistrationModal(true);
      
      // Clear form
      setStaffName("");
      setStaffGender("");
      setStaffContact("");
      setStaffEmail("");
      setStaffPosition("");
      setStaffAddress("");
      setStaffSalary("");
      setIsEmployed(true);
    }
    
    setFormLoading(false);
  };

  const handleCloseModal = () => {
    setShowRegistrationModal(false);
    setModalData({
      staffName: '',
      email: '',
      setupUrl: '',
      emailSent: false
    });
  };

  const handlePasswordReset = async (member) => {
    const memberKey = member._id || member.email;
    setResendLoadingMap(m => ({ ...m, [memberKey]: true }));
    
    try {
      const resp = await staffAPI.sendPasswordSetup(member._id);
      
      if (resp && resp.success) {
        // Check if email was sent successfully
        let emailDelivered = false;
        if (resp.data && resp.data.passwordSetupSent) {
          const emailResults = resp.data.passwordSetupSent;
          if (emailResults && emailResults.length > 0) {
            const emailResult = emailResults.find(n => n.method === 'gmail-smtp' || n.method === 'resend-api' || n.method === 'email');
            emailDelivered = emailResult && emailResult.success;
          }
        }
        
        // Show modal with reset details
        setModalData({
          staffName: member.name,
          email: member.email,
          setupUrl: resp.data.setupUrl || '',
          emailSent: emailDelivered
        });
        setShowRegistrationModal(true);
        
      } else {
        setError(resp.message || 'Failed to send password setup link');
      }
    } catch (err) {
      console.error('Send setup error:', err);
      setError(err.message || 'Failed to send password setup link');
    } finally {
      setResendLoadingMap(m => ({ ...m, [memberKey]: false }));
    }
  };
 
  const handleNameChange = (event) => {
    setStaffName(event.target.value);
  };

  const handleGenderChange = (event) => {
    setStaffGender(event.target.value);
  };

  const handleContactChange = (event) => {
    setStaffContact(event.target.value);
  };

  const handleEmailChange = (event) => {
    setStaffEmail(event.target.value);
  };

  const handlePositionChange = (event) => {
    setStaffPosition(event.target.value);
  };

  const handleAddressChange = (event) => {
    setStaffAddress(event.target.value);
  };

  const handleSalaryChange = (event) => {
    setStaffSalary(event.target.value);
  };

  const toggleEmployedStatus = (index) => {
    // Persist the employed toggle to the server
    const actualIndex = index;
    const member = (staff && staff[actualIndex]) || null;
    if (!member) return;

    const memberKey = member._id || member.email || actualIndex;
    // optimistic UI update
    setStaff(s => s.map((m, i) => i === actualIndex ? { ...m, employed: !m.employed } : m));
    // call API to persist
    (async () => {
      try {
        const updated = { employed: !member.employed };
        const resp = await staffAPI.update(member._id, updated);
        if (!(resp && resp.success)) {
          // revert optimistic change
          setStaff(s => s.map((m, i) => i === actualIndex ? { ...m, employed: member.employed } : m));
          setError(resp && resp.message ? resp.message : 'Failed to update employment status');
        } else {
          setMessage('Employment status updated');
          setTimeout(() => setMessage(null), 3000);
        }
      } catch (err) {
        console.error('Error updating employment status:', err);
        // revert optimistic change
        setStaff(s => s.map((m, i) => i === actualIndex ? { ...m, employed: member.employed } : m));
        setError(err.message || 'Failed to update employment status');
      }
    })();
  }

  // Position management functions
  const handleCreatePosition = async () => {
    if (!newPositionName.trim()) return;
    
    setFormLoading(true);
    clearError();
    
    try {
      // Create position with the most basic structure, then try to update it
      const basicPositionData = {
        positionTitle: newPositionName.trim(),
        positionCode: newPositionName.trim().toUpperCase().replace(/\s+/g, '_'),
        permissions: {
          sales: { view: false, create: false, edit: false, delete: false, add: false },
          inventory: { view: false, create: false, edit: false, delete: false, add: false },
          hrm: { view: false, create: false, edit: false, delete: false, add: false },
          payroll: { view: false, create: false, edit: false, delete: false, process: false, approve: false },
          reports: { view: false, create: false, edit: false, delete: false, generate: false, export: false },
          settings: { view: false, create: false, edit: false, delete: false, systemConfig: false }
        }
      };

      console.log('🏗️ Creating position with basic data:', basicPositionData);
      const createResponse = await positionAPI.create(basicPositionData);
      console.log('🏗️ Position creation response:', createResponse);
      
      if (createResponse.success) {
        const positionName = newPositionName.trim();
        setNewPositionName("");
        setSuccessMessage(`Position "${positionName}" created successfully! Checking if visible in list...`);
        
        // Refresh positions to see if it appears with the basic structure
        setTimeout(async () => {
          await loadPositions();
          console.log('🔍 Positions reloaded after creation');
        }, 1000);
      } else {
        throw new Error(createResponse.message || 'Failed to create position');
      }
    } catch (error) {
      console.error('Error creating position:', error);
      setError(error.message || 'Failed to create position');
    } finally {
      setFormLoading(false);
    }
  };

  function handleDeletePosition(positionId) {
    if (positions.length > 1) { // Prevent deleting all positions
      setPositions(p => p.filter(pos => (pos._id || pos.positionCode) !== positionId));
    }
  }

  async function handlePermissionToggle(positionId, sectionId) {
    try {
      setLoading(true);
      
      // Find the current position
      const position = positions.find(p => (p._id || p.positionCode) === positionId);
      if (!position) {
        setError('Position not found');
        return;
      }

      const currentPermissions = position.permissions || {};
      const sectionPermissions = currentPermissions[sectionId] || {};
      const hasViewPermission = sectionPermissions.view || false;
      
      // Create updated permissions
      const updatedPermissions = {
        ...currentPermissions,
        [sectionId]: {
          ...sectionPermissions,
          view: !hasViewPermission
        }
      };

      // Update position via API
      await positionAPI.update(position._id, { permissions: updatedPermissions });
      
      // Update local state
      setPositions(p => p.map(pos => {
        if ((pos._id || pos.positionCode) === positionId) {
          return {
            ...pos,
            permissions: updatedPermissions
          };
        }
        return pos;
      }));
      
      setMessage('Permissions updated successfully');
      setTimeout(() => setMessage(null), 3000);
      
    } catch (error) {
      console.error('Error updating permissions:', error);
      setError('Failed to update permissions');
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
    }
  }

  function handleEditPermissions(positionId) {
    setEditingPermissions(positionId);
    setViewMode('manage-permissions');
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
      <div className="staff-register-main-container" style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '400px',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <LoadingSpinner size="medium" message="Loading staff management system..." />
        </div>
      </div>
    );
  }

  // Show login prompt if not authenticated
  if (!user) {
    return (
      <div className="staff-register-main-container" style={{ 
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
          <p style={{ color: '#6c757d', margin: 0 }}>Please log in to access the staff management system.</p>
        </div>
      </div>
    );
  }

  return(
  <>
    <div className="staff-register-main-container">
      <div className="sales-options">
        <div>
          <button className="sales-btn" onClick={() => setViewMode('register')}>Register New Staff</button>
        </div>
        <div>
          <button className="sales-btn" onClick={() => setViewMode('staff')}>View Staff List</button>
        </div>
        <div>
            <button className="sales-btn" onClick={() => setViewMode('create-position')}>Create Position</button>
          </div>
          <div>
            <button className="sales-btn" onClick={() => setViewMode('manage-permissions')}>Manage Positions & Permissions</button>
          </div>
      </div>

    {viewMode === 'register' && (
      <div className="staff-register-container">  
      <div className="registration-options">          
          <h2 className="my-profile-button" style={{ fontFamily: 'Arial, sans-serif' }}>New Staff Member</h2>          
        </div>   

        {error && <ErrorMessage error={error} onDismiss={clearError} />}
        {successMessage && <SuccessMessage message={successMessage} autoHide={false} onDismiss={() => setSuccessMessage("")} />}
        
        {loading && <LoadingSpinner size="medium" message="Loading staff data..." />}

  <input
   className="reg-input-field" 
   placeholder="Full name *" 
   type="text" 
   value={staffName} 
   onChange={handleNameChange}
   disabled={formLoading}
   required
   />
      
  <select className="select-gender" value={staffGender} onChange={handleGenderChange} disabled={formLoading}>
              <option value="">Select gender</option>
              <option value="Male">Male</option> 
              <option value="Female">Female</option>              
      </select>

  <input 
   className="reg-input-field" 
   placeholder="Phone number" 
   type="tel" 
   value={staffContact} 
   onChange={handleContactChange}
   disabled={formLoading}
   />

  <input 
   className="reg-input-field" 
   placeholder="Email address *" 
   type="email" 
   value={staffEmail} 
   onChange={handleEmailChange}
   disabled={formLoading}
   required
   />

  <select className="select-gender" value={staffPosition} onChange={handlePositionChange} disabled={formLoading} required>
    <option value="">Select position *</option>
    {positions.map((position) => (
      <option key={position._id || position.positionCode} value={position._id}>{position.positionTitle}</option>
    ))}
  </select>

  <input 
   className="reg-input-field" 
   placeholder="Residential address" 
   type="text" 
   value={staffAddress} 
   onChange={handleAddressChange}
   disabled={formLoading}
   />

  <input 
   className="reg-input-field" 
   placeholder="Salary (optional)" 
   type="number" 
   value={staffSalary} 
   onChange={handleSalaryChange}
   disabled={formLoading}
   min="0"
   step="0.01"
   />

      <button 
        className="register-staff-button" 
        onClick={handleRegisterNewStaff}
        disabled={formLoading}
      >
        {formLoading ? <LoadingSpinner size="small" message="" /> : 'Register Staff'}
      </button>  

    </div>
     )}     
    </div>

    {viewMode === 'staff' && (
    
      <div className="staff-register-container">
        <div className="registration-options">          
          <h2 className="my-profile-button" style={{ fontFamily: 'Arial, sans-serif' }}>Staff Members</h2>          
        </div>     

        {error && <ErrorMessage error={error} onDismiss={clearError} />}
        {successMessage && <SuccessMessage message={successMessage} autoHide={false} onDismiss={() => setSuccessMessage("")} />}

        {loading ? (
          <LoadingSpinner size="large" message="Loading staff members..." />
        ) : (
          <div className="staff-list-container"> 
            <div className="staff-list-information">
              <div className="salary-items">
                <h2 className="date-requested">Staff name</h2>
                <h2 className="staff-name">Gender</h2>
                <h2 className="salary">Phone</h2>
                <h2 className="advance-paid">Email</h2>
                <h2 className="balance">Position</h2>
                <h2 className="action">Address</h2>
                <h2 className="action">Status</h2>
                <h2 className="action">Actions</h2>
              </div>

              {/* Scrollable container with max height */}
              <div style={{
                border: '1px solid #e5e5e5',
                borderRadius: '8px',
                backgroundColor: 'white'
              }}>
                {staff.length === 0 ? (
                  <div className="salary-item-info">
                    <p className="date-requested">No staff members registered yet</p>
                    <p className="staff-name">-</p>
                    <p className="salary">-</p>
                    <p className="advance-paid">-</p>
                    <p className="balance">-</p>
                    <p className="action">-</p>
                    <p className="action">-</p>
                    <p className="action">-</p>
                  </div>
                ) : (
                  paginate(staff, staffCurrentPage).map((member, index) => {
                    const actualIndex = (staffCurrentPage - 1) * itemsPerPage + index;
                    return (
                      <div className="salary-item-info" key={actualIndex}>
                        <p className="date-requested">{member.name}</p>
                        <p className="staff-name">{member.gender}</p>
                        <p className="salary">{member.contact}</p>
                        <p className="advance-paid">{member.email}</p>
                        <p className="balance">
                          {(() => {
                            // Find position title by matching the position ID
                            const position = positions.find(pos => 
                              pos._id === member.position || 
                              pos._id === member.position?.$oid ||
                              pos.positionCode === member.position
                            );
                            return position ? position.positionTitle : member.position || 'No Position';
                          })()}
                        </p>
                        <p className="action">{member.address}</p>
                        <p className="action">{member.employed ? "Active" : "Not Active"}</p>
                        <div className="action">
                          <div>
                            <button
                              className="reset-password-button"
                              onClick={() => handlePasswordReset(member)}
                              disabled={!!resendLoadingMap[member._id || member.email || actualIndex]}
                            >
                              {resendLoadingMap[member._id || member.email || actualIndex] ? 'Sending...' : 'Reset'}
                            </button>
                            <button className="flag-staff-button" onClick={() => toggleEmployedStatus(actualIndex)}>
                              {member.employed ? "Flag" : "Unflag"}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              
              {/* Pagination Controls for Staff */}
              <PaginationControls 
                currentPage={staffCurrentPage}
                totalPages={getTotalPages(staff)}
                onPageChange={setStaffCurrentPage}
              />
            </div>
          </div>         
        )}
      </div>
    
      )}

      {viewMode === 'create-position' && (
        <div className="staff-register-container">
          <div className="registration-options">          
            <h2 className="my-profile-button" style={{ fontFamily: 'Arial, sans-serif' }}>Create New Position</h2>
            <p style={{ fontSize: '14px', color: '#FF9800', marginTop: '10px', textAlign: 'center' }}>
              ⚠️ Note: Due to backend schema limitations, newly created positions may not appear in the list. 
              We are working on updating the backend to support full position data.
            </p>          
          </div>

          <input 
            className="reg-input-field" 
            placeholder="Enter new position name" 
            type="text"
            value={newPositionName}
            onChange={(e) => setNewPositionName(e.target.value)}
          />

          <button className="add-item-button" onClick={handleCreatePosition}>
            Save Position
          </button>

          {/* Display existing positions */}
          <div className="staff-list-container" style={{marginTop: '30px'}}> 
            <div className="staff-list-information">
              <div className="salary-items">
                <h2 className="date-requested">Position Name</h2>
                <h2 className="staff-name">Permissions Count</h2>
                <h2 className="action">Actions</h2>
              </div>

              {/* Scrollable container for positions */}
              <div style={{
                maxHeight: '300px',
                overflowY: 'auto',
                overflowX: 'hidden',
                border: '1px solid #e5e5e5',
                borderRadius: '8px',
                backgroundColor: 'white'
              }}>
                {positions.length === 0 ? (
                  <div className="salary-item-info">
                    <p className="date-requested">No positions created yet</p>
                    <p className="staff-name">-</p>
                    <p className="action">-</p>
                  </div>
                ) : (
                  paginate(positions, positionsCurrentPage).map((position) => {
                    const permissionsCount = position.permissions 
                      ? Object.keys(position.permissions).reduce((count, module) => {
                          if (position.permissions[module] && typeof position.permissions[module] === 'object') {
                            return count + Object.values(position.permissions[module]).filter(perm => perm === true).length;
                          }
                          return count;
                        }, 0) 
                      : 0;
                    
                    return (
                      <div className="salary-item-info" key={position._id || position.positionCode}>
                        <p className="date-requested">{position.positionTitle}</p>
                        <p className="staff-name">{permissionsCount} permissions</p>
                        <div className="action">
                          <button 
                            className="reset-password-button" 
                            onClick={() => handleEditPermissions(position._id || position.positionCode)}
                          >
                            Edit
                          </button>
                          {positions.length > 1 && (
                            <button 
                              className="flag-staff-button" 
                              onClick={() => handleDeletePosition(position._id || position.positionCode)}
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              
              {/* Pagination Controls for Positions */}
              <PaginationControls 
                currentPage={positionsCurrentPage}
                totalPages={getTotalPages(positions)}
                onPageChange={setPositionsCurrentPage}
              />
            </div>
          </div>   
        </div>
      )}

      {viewMode === 'manage-permissions' && (
        <div className="staff-register-container">
          <div className="registration-options">          
            <h2 className="my-profile-button" style={{ fontFamily: 'Arial, sans-serif' }}>Manage Positions & Permissions</h2>          
          </div>

          {editingPermissions ? (
            <div>
              <h3 style={{fontFamily: 'Arial, sans-serif', marginBottom: '20px'}}>
                Edit Permissions for: {positions.find(p => (p._id || p.positionCode) === editingPermissions)?.positionTitle}
              </h3>
              
              {availableSections.map((section) => {
                const position = positions.find(p => (p._id || p.positionCode) === editingPermissions);
                const hasPermission = position?.permissions?.[section.id]?.view || false;
                
                return (
                  <div key={section.id} style={{
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    padding: '15px', 
                    marginBottom: '10px',
                    backgroundColor: hasPermission ? '#e8f5e8' : '#f5f5f5',
                    borderRadius: '8px',
                    border: hasPermission ? '2px solid #4ade80' : '2px solid #e5e5e5'
                  }}>
                    <span style={{fontFamily: 'Arial, sans-serif', fontWeight: '500'}}>
                      {section.name}
                    </span>
                    <button
                      className={hasPermission ? "reset-password-button" : "flag-staff-button"}
                      onClick={() => handlePermissionToggle(editingPermissions, section.id)}
                    >
                      {hasPermission ? "Remove" : "Grant"}
                    </button>
                  </div>
                );
              })}
              
              <button 
                className="add-item-button" 
                onClick={() => setEditingPermissions(null)}
                style={{marginTop: '20px'}}
              >
                Done Editing
              </button>
            </div>
          ) : (
            <div>
              <div className="staff-list-container" style={{ width: '100%' }}> 
                <div className="staff-list-information" style={{ width: '100%' }}>
                  <div className="salary-items">
                    <h2 className="date-requested">Position</h2>
                    <h2 className="staff-name">Permissions</h2>
                    <h2 className="salary">Staff Count</h2>
                    <h2 className="action">Actions</h2>
                  </div>

                  {/* Scrollable container for permissions overview */}
                  <div style={{
                    maxHeight: '350px',
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    border: '1px solid #e5e5e5',
                    borderRadius: '8px',
                    backgroundColor: 'white',
                    width: '100% !important',
                    boxSizing: 'border-box'
                  }}>
                    {paginate(positions, permissionsCurrentPage).map((position) => {
                      // Count staff members assigned to this position
                      const staffCount = staff.filter(s => 
                        s.position === position._id || 
                        s.position?.$oid === position._id ||
                        s.position === position.positionCode
                      ).length;
                      
                      // Extract permissions from the permissions object structure
                      const getPermissionsList = (permissions) => {
                        if (!permissions || typeof permissions !== 'object') return [];
                        
                        const permissionsList = [];
                        Object.keys(permissions).forEach(module => {
                          if (permissions[module] && typeof permissions[module] === 'object') {
                            Object.keys(permissions[module]).forEach(action => {
                              if (permissions[module][action] === true) {
                                permissionsList.push(`${module}:${action}`);
                              }
                            });
                          }
                        });
                        return permissionsList;
                      };

                      const permissionsList = getPermissionsList(position.permissions);
                      
                      return (
                        <div className="salary-item-info" key={position._id || position.positionCode}>
                          <p className="date-requested">{position.positionTitle}</p>
                          <p className="staff-name" style={{fontSize: '0.85rem', lineHeight: '1.2', wordWrap: 'break-word'}}>
                            {permissionsList.length > 0 
                              ? permissionsList.slice(0, 3).join(', ') + (permissionsList.length > 3 ? '...' : '')
                              : 'No permissions assigned'
                            }
                          </p>
                          <p className="salary">{staffCount} staff</p>
                          <div className="action">
                            <button 
                              className="reset-password-button" 
                              onClick={() => setEditingPermissions(position._id || position.positionCode)}
                            >
                              Edit Permissions
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Pagination Controls for Permissions */}
                  <PaginationControls 
                    currentPage={permissionsCurrentPage}
                    totalPages={getTotalPages(positions)}
                    onPageChange={setPermissionsCurrentPage}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Staff Registration Success Modal */}
      <StaffRegistrationModal
        isOpen={showRegistrationModal}
        onClose={handleCloseModal}
        staffName={modalData.staffName}
        email={modalData.email}
        setupUrl={modalData.setupUrl}
        emailSent={modalData.emailSent}
      />

  </>);
}

export default RegisterNewStaff;