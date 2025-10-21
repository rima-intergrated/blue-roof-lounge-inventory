import { useState, useEffect } from "react";
import { useStaff } from './hooks/useStaff';
import { LoadingSpinner, ErrorMessage, SuccessMessage } from './components/common/FeedbackComponents';

function RegisterNewStaff() {
  const [viewMode, setViewMode] = useState('register');
  const { 
    staff, 
    positions, 
    loading, 
    error, 
    createStaff, 
    updateStaff, 
    deleteStaff, 
    createPosition,
    clearError 
  } = useStaff();

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
  
  const [newPositionName, setNewPositionName] = useState("");
  const [selectedPosition, setSelectedPosition] = useState("");
  const [editingPermissions, setEditingPermissions] = useState(null);
  
  // Pagination states
  const [staffCurrentPage, setStaffCurrentPage] = useState(1);
  const [positionsCurrentPage, setPositionsCurrentPage] = useState(1);
  const [permissionsCurrentPage, setPermissionsCurrentPage] = useState(1);
  const itemsPerPage = 5; // Configurable items per page
  
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

    const newStaff = {
      name: staffName.trim(),
      gender: staffGender,
      contact: staffContact.trim(),
      email: staffEmail.trim(),
      position: staffPosition,
      address: staffAddress.trim(),
      salary: parseFloat(staffSalary) || 0,
      employed: isEmployed
    };

    setFormLoading(true);
    clearError();

    const result = await createStaff(newStaff);
    
    if (result.success) {
      setSuccessMessage('Staff member registered successfully!');
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
    setStaff(s => s.map((member, i) =>
      i === index ? { ...member, employed: !member.employed } : member
    ));
  }

  // Position management functions
  function handleCreatePosition() {
    if (newPositionName.trim()) {
      const newPosition = {
        id: positions.length + 1,
        name: newPositionName,
        permissions: []
      };
      setPositions(p => [...p, newPosition]);
      setNewPositionName("");
    }
  }

  function handleDeletePosition(positionId) {
    if (positions.length > 1) { // Prevent deleting all positions
      setPositions(p => p.filter(pos => pos.id !== positionId));
    }
  }

  function handlePermissionToggle(positionId, sectionId) {
    setPositions(p => p.map(position => {
      if (position.id === positionId) {
        const hasPermission = position.permissions.includes(sectionId);
        return {
          ...position,
          permissions: hasPermission 
            ? position.permissions.filter(perm => perm !== sectionId)
            : [...position.permissions, sectionId]
        };
      }
      return position;
    }));
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
        {successMessage && <SuccessMessage message={successMessage} onDismiss={() => setSuccessMessage("")} />}
        
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
      <option key={position.id || position._id} value={position.name}>{position.name}</option>
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
        {successMessage && <SuccessMessage message={successMessage} onDismiss={() => setSuccessMessage("")} />}

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
                maxHeight: '400px',
                overflowY: 'auto',
                overflowX: 'hidden',
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
                        <p className="balance">{member.position}</p>
                        <p className="action">{member.address}</p>
                        <p className="action">{member.employed ? "Active" : "Not Active"}</p>
                        <div className="action">
                          <div>
                            <button className="reset-password-button">Reset</button>
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
                  paginate(positions, positionsCurrentPage).map((position) => (
                    <div className="salary-item-info" key={position.id}>
                      <p className="date-requested">{position.name}</p>
                      <p className="staff-name">{position.permissions.length} sections</p>
                      <div className="action">
                        <button 
                          className="reset-password-button" 
                          onClick={() => handleEditPermissions(position.id)}
                        >
                          Edit
                        </button>
                        {positions.length > 1 && (
                          <button 
                            className="flag-staff-button" 
                            onClick={() => handleDeletePosition(position.id)}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  ))
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
                Edit Permissions for: {positions.find(p => p.id === editingPermissions)?.name}
              </h3>
              
              {availableSections.map((section) => {
                const position = positions.find(p => p.id === editingPermissions);
                const hasPermission = position?.permissions.includes(section.id);
                
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
                  <div className="salary-items" style={{ 
                    display: 'flex', 
                    width: '100%',
                    boxSizing: 'border-box'
                  }}>
                    <h2 className="date-requested" style={{ flex: '1' }}>Position</h2>
                    <h2 className="staff-name" style={{ flex: '2' }}>Permissions</h2>
                    <h2 className="salary" style={{ flex: '1' }}>Staff Count</h2>
                    <h2 className="action" style={{ flex: '1' }}>Actions</h2>
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
                      const staffCount = staff.filter(s => s.position === position.name).length;
                      
                      return (
                        <div 
                          className="salary-item-info" 
                          key={position.id} 
                          style={{ 
                            width: '100% !important', 
                            display: 'flex !important',
                            boxSizing: 'border-box',
                            minWidth: '100%'
                          }}
                        >
                          <p className="date-requested" style={{ 
                            flex: '1 !important', 
                            margin: '0',
                            padding: '10px',
                            boxSizing: 'border-box',
                            width: 'auto !important'
                          }}>
                            {position.name}
                          </p>
                          <p className="staff-name" style={{
                            fontSize: '0.85rem',
                            lineHeight: '1.2',
                            flex: '2 !important',
                            wordWrap: 'break-word',
                            margin: '0',
                            padding: '10px',
                            boxSizing: 'border-box',
                            width: 'auto !important'
                          }}>
                            {position.permissions.length > 0 
                              ? position.permissions.map(perm => 
                                  availableSections.find(s => s.id === perm)?.name
                                ).join(', ')
                              : 'No permissions assigned'
                            }
                          </p>
                          <p className="salary" style={{ 
                            flex: '1 !important',
                            margin: '0',
                            padding: '10px',
                            boxSizing: 'border-box',
                            width: 'auto !important'
                          }}>
                            {staffCount} staff
                          </p>
                          <div className="action" style={{ 
                            flex: '1 !important',
                            margin: '0',
                            padding: '10px',
                            boxSizing: 'border-box',
                            width: 'auto !important'
                          }}>
                            <button 
                              className="reset-password-button" 
                              onClick={() => setEditingPermissions(position.id)}
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


  </>);
}

export default RegisterNewStaff;