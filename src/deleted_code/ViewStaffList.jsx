function ViewStaffList () {
  return(
  <div className="staff-register-main-container">
    <div className="staff-register-container">
      <div className="registration-options">
        
        <h2 className="view-staff-button">View Staff List</h2>
        <h2 className="register-new-staff-button">Register New Staff</h2>
        <h2 className="my-profile-button">My Profile</h2>
        
      </div>

      <div className="staff-list-container">
        <div className="sales-options">
        <div>
          <button className="sales-btn" onClick={() => setViewMode('transaction')}>Record New Sale</button>
        </div>
        <div>
          <button className="sales-btn" onClick={() => setViewMode('records')}>View Sales Records</button>
        </div>
      </div>     
             

        <div className="staff-list-information">
          <div className="salary-items">
            <h2 className="date-requested">Staff name</h2>
            <h2 className="staff-name">Gender</h2>
            <h2 className="salary">Phone</h2>
            <h2 className="advance-paid">Position</h2>
            <h2 className="balance">Status</h2>
            <h2 className="action">Actions</h2>
          </div>

          <div className="salary-item-info">
            <p className="date-requested">John Banda</p>
            <p className="staff-name">Male</p>
            <p className="salary">0995065463</p>
            <p className="advance-paid">Cashier</p>
            <p className="balance">Active</p>
            <div className="action">
              <div>
                <button className="reset-password-button">Reset</button>
                <button className="flag-staff-button">Flag</button>
              </div>
            </div>
          </div>

          <div className="salary-item-info">
            <p className="date-requested">John Banda</p>
            <p className="staff-name">Male</p>
            <p className="salary">0995065463</p>
            <p className="advance-paid">Cashier</p>
            <p className="balance">Active</p>
            <div className="action">
              <div>
                <button className="reset-password-button">Reset</button>
                <button className="flag-staff-button">Flag</button>
              </div>
            </div>
          </div>

          <div className="salary-item-info">
            <p className="date-requested">John Banda</p>
            <p className="staff-name">Male</p>
            <p className="salary">0995065463</p>
            <p className="advance-paid">Cashier</p>
            <p className="balance">Active</p>
            <div className="action">
              <div>
                <button className="reset-password-button">Reset</button>
                <button className="flag-staff-button">Flag</button>
              </div>
            </div>
          </div>
         
        </div>
        </div>
    

    </div>
  </div>

    
  );
}

export default ViewStaffList;