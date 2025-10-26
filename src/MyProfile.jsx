import { useState, useEffect } from "react";
import axios from "axios";
import { expenseCategoryAPI, stockAPI, API_BASE_URL } from './services/api';

function MyProfile(props) {
  const token = props.token;

  const drinks = props.drinks || [];
  const setDrinks = typeof props.setDrinks === 'function' ? props.setDrinks : () => {};
  const onLogout = props.onLogout;

  const [drinkName, setDrinkName] = useState("");
  const [drinkId, setDrinkId] = useState("");

  const expenses = props.expenses || [];
  const setExpenses = typeof props.setExpenses === 'function' ? props.setExpenses : () => {};

  const [expenseName, setExpenseName] = useState("");
  const [expenseId, setExpenseId] = useState("");

  const [viewMode, setViewMode] = useState('create-item');
  
  // Pagination states
  const [drinksPage, setDrinksPage] = useState(1);
  const [expensesPage, setExpensesPage] = useState(1);
  
  const itemsPerPage = 5;
  
  // Pagination helper functions
  const paginate = (items, currentPage) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return items.slice(startIndex, startIndex + itemsPerPage);
  };
  
  const getTotalPages = (items) => Math.ceil(items.length / itemsPerPage);
  
  // Pagination Controls Component
  const PaginationControls = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '10px',
        marginTop: '20px',
        padding: '10px'
      }}>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          style={{
            padding: '8px 12px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            backgroundColor: currentPage <= 1 ? '#f5f5f5' : 'white',
          }}
        >
          Previous
        </button>
        <span style={{ 
          fontSize: '14px',
          color: '#666',
          fontWeight: '500'
        }}>
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          style={{
            padding: '8px 12px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            backgroundColor: currentPage >= totalPages ? '#f5f5f5' : 'white',
            cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
            color: currentPage >= totalPages ? '999' : '#333'
          }}
        >
          Next
        </button>
      </div>
    );
  };
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleteType, setDeleteType] = useState(''); // 'drink' or 'expense'
  const [showExpenseDropdown, setShowExpenseDropdown] = useState(false);
  const [showItemDropdown, setShowItemDropdown] = useState(false);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.custom-dropdown')) {
        setShowExpenseDropdown(false);
        setShowItemDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Backend items state for view mode
  const [backendItems, setBackendItems] = useState([]);
  // Backend expense categories state for view mode
  const [backendExpenses, setBackendExpenses] = useState([]);
  
  useEffect(() => {
    if (viewMode === 'view-items' || viewMode === 'create-item') {
      stockAPI.getAll()
      .then(res => {
        setBackendItems(res.data.items || []);
      })
      .catch(() => {
        setBackendItems([]);
      });
    }
    
    if (viewMode === 'view-expenses' || viewMode === 'create-expense') {
      expenseCategoryAPI.getAll()
        .then(response => {
          console.log('🏷️ MyProfile expense categories response:', response);
          // Handle the new response format
          if (response.success && response.data?.categories) {
            setBackendExpenses(response.data.categories || []);
          } else if (Array.isArray(response)) {
            // Handle legacy direct array response
            setBackendExpenses(response || []);
          } else {
            console.warn('⚠️ Unexpected expense categories response format in MyProfile:', response);
            setBackendExpenses([]);
          }
        })
        .catch((error) => {
          console.error('❌ Error loading expense categories in MyProfile:', error);
          setBackendExpenses([]);
        });
    }
  }, [viewMode, token]);

  function handleCreateNewDrink () {
    // Validation checks
    if (!drinkName.trim()) {
      alert("Please enter an item name");
      return;
    }
    if (!drinkId) {
      alert("Please select an item ID");
      return;
    }
    if (!isIdAvailable(drinkId)) {
      alert(`ID ${drinkId} is already assigned to another item. Please select a different ID.`);
      return;
    }
    if (backendItems.some(item => item.itemName === drinkName)) {
      alert(`Item name '${drinkName}' is already used. Please choose a different name.`);
      return;
    }
    // Build new item object with all required fields
    const now = new Date();
    const newDrink = {
      date: now.toISOString(),
      itemName: drinkName,
      itemId: drinkId,
      orderQuantity: 0,
      costPrice: 0,
      sellingPrice: 0,
      currentStock: 0,
      stockValue: 0,
      projectedProfit: 0
    };
    // Persist to backend (save to 'stock' collection)
    stockAPI.create(newDrink)
    .then(response => {
      setDrinkName("");
      setDrinkId("");
      alert("Item added and persisted to stock database.");
      // Refresh backend items
      stockAPI.getAll().then(res => setBackendItems(res.data.items || []));
    })
    .catch(error => {
      alert("Failed to add item: " + (error.response?.data?.message || error.message));
    });
  }

  function handleCreateNewExpense () {
    // Validation checks
    if (!expenseName.trim()) {
      alert("Please enter an expense category name");
      return;
    }
    
    if (!expenseId) {
      alert("Please select an expense ID");
      return;
    }
    
    if (!isExpenseIdAvailable(expenseId)) {
      alert(`ID ${expenseId} is already assigned to another expense category. Please select a different ID.`);
      return;
    }

    const newExpense = {
      name: expenseName.trim(),
      expenseId: expenseId,
      description: `${expenseName.trim()} expense category`
    };

    // Persist to backend
    expenseCategoryAPI.create(newExpense)
      .then(response => {
        // Backend returns the created category directly on success
        setExpenseName("");
        setExpenseId("");
        alert("Expense category added and persisted to database.");
        // Refresh backend expense categories
        return expenseCategoryAPI.getAll();
      })
      .then(response => {
        console.log('🏷️ MyProfile expense categories after creation:', response);
        // Handle the new response format
        if (response.success && response.data?.categories) {
          setBackendExpenses(response.data.categories || []);
        } else if (Array.isArray(response)) {
          // Handle legacy direct array response
          setBackendExpenses(response || []);
        } else {
          console.warn('⚠️ Unexpected expense categories response format after creation:', response);
          setBackendExpenses([]);
        }
      })
      .catch(error => {
        alert("Failed to add expense category: " + (error.message || 'Unknown error'));
      });
  }

  function handleDrinkNameChange() {
    setDrinkName(event.target.value);
  }

  function handleDrinkIdChange() {
    setDrinkId(event.target.value);
  }

  // Get list of already used IDs for drinks (from backend)
  const getUsedIds = () => {
    return backendItems.map(item => item.itemId);
  }

  // Check if a drink ID is available (from backend)
  const isIdAvailable = (id) => {
    return !getUsedIds().includes(id);
  }

  // All possible drink IDs
  // Generate all possible drink IDs from BR001 to BR200
  function generateAllIds() {
    const ids = [];
    for (let i = 1; i <= 200; i++) {
      ids.push(`BR${i.toString().padStart(3, '0')}`);
    }
    return ids;
  }
  const allIds = generateAllIds();

  // Get list of already used expense IDs (from backend)
  const getUsedExpenseIds = () => {
    if (!Array.isArray(backendExpenses)) {
      console.warn('⚠️ backendExpenses is not an array:', backendExpenses);
      return [];
    }
    return backendExpenses.map(expense => expense.expenseId);
  }

  // Check if an expense ID is available (from backend)
  const isExpenseIdAvailable = (id) => {
    return !getUsedExpenseIds().includes(id);
  }

  // All possible expense IDs - Generate dynamically to match backend format
  function generateAllExpenseIds() {
    const ids = [];
    for (let i = 1; i <= 16; i++) {
      ids.push(`BRL${i.toString().padStart(3, '0')}`);
    }
    return ids;
  }
  const allExpenseIds = generateAllExpenseIds();

  function handleExpenseNameChange() {
    setExpenseName(event.target.value);
  }

  function handleExpenseIdChange() {
    setExpenseId(event.target.value);
  }

  // Delete drink function - show modal
  function handleDeleteDrink(itemId) {
    const drinkToDelete = backendItems.find(item => item.itemId === itemId);
    setItemToDelete(drinkToDelete);
    setDeleteType('drink');
    setShowDeleteModal(true);
  }

  // Delete expense function - show modal
  function handleDeleteExpense(expenseId) {
    const expenseToDelete = backendExpenses.find(expense => expense.expenseId === expenseId);
    setItemToDelete(expenseToDelete);
    setDeleteType('expense');
    setShowDeleteModal(true);
  }

  // Confirm deletion
  function confirmDelete() {
    if (deleteType === 'drink' && itemToDelete) {
      // Delete from backend using the correct item ID
      stockAPI.delete(itemToDelete.itemId)
      .then(() => {
        alert('Item deleted from stock database. ID is now available for new assignment.');
        // Refresh backend items list
        return stockAPI.getAll();
      })
      .then(res => {
        setBackendItems(res.data.items || []);
      })
      .catch(error => {
        alert('Failed to delete item from backend: ' + (error.response?.data?.message || error.message));
      });
    } else if (deleteType === 'expense' && itemToDelete) {
      // Delete from backend
      expenseCategoryAPI.delete(itemToDelete._id)
        .then(() => {
          alert('Expense category deleted from database. ID is now available for new assignment.');
          // Refresh backend expense categories
          return expenseCategoryAPI.getAll();
        })
        .then(response => {
          console.log('🏷️ MyProfile expense categories after deletion:', response);
          // Handle the new response format
          if (response.success && response.data?.categories) {
            setBackendExpenses(response.data.categories || []);
          } else if (Array.isArray(response)) {
            // Handle legacy direct array response
            setBackendExpenses(response || []);
          } else {
            console.warn('⚠️ Unexpected expense categories response format after deletion:', response);
            setBackendExpenses([]);
          }
        })
        .catch(error => {
          alert('Failed to delete expense category from backend: ' + (error.message || 'Unknown error'));
        });
    }
    // Close modal and reset state
    setShowDeleteModal(false);
    setItemToDelete(null);
  }

  // Cancel deletion
  function cancelDelete() {
    setShowDeleteModal(false);
    setItemToDelete(null);
    setDeleteType('');
  }

  return (
    <div className="pro-main-container">
      <div className="sales-options">
          <div>
            <button className="sales-btn" onClick={() => setViewMode('create-item')}>Create Item</button>
          </div>
          <div>
            <button className="sales-btn" onClick={() => setViewMode('view-items')}>View Items</button>
          </div>
          
          <div>
            <button className="sales-btn" onClick={() => setViewMode('create-expense')}>Create Expense Category</button>
          </div>
          <div>
            <button className="sales-btn" onClick={() => setViewMode('view-expenses')}>Expense Categories</button>
          </div>
          <div>
            <button className="sales-btn" onClick={() => setViewMode('my-profile')}>My Profile</button>
          </div>
        </div>
        
    {viewMode === 'my-profile' && (
    <div className="staff-register-main-container">
      <div className="staff-register-container">
        <div className="registration-options">
          <h2 className="my-profile-button">My Profile</h2>          
        </div>
        {/* Profile picture as initials */}
        <div className="profile-picture" style={{
          width: '120px', height: '120px', borderRadius: '50%', background: '#b3c6e0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', color: '#fff', margin: '0 auto', marginBottom: '1rem', fontWeight: 'bold', textTransform: 'uppercase'
        }}>
          {props.user
            ? (() => {
                const fullName = props.user.name || props.user.username || 'User';
                const names = fullName.split(' ');
                const first = names[0] ? names[0][0] : '';
                const last = names.length > 1 ? names[names.length-1][0] : '';
                return first + last;
              })()
            : 'MB'}
        </div>
        <div className="profile-info">
          {props.user ? (
            <>
              <h2>{props.user.name || props.user.username || 'No Name Available'}</h2>
              <h2>{props.user.position || props.user.role || 'No Position Available'}</h2>
              <h2>{props.user.contact || 'No Contact Available'}</h2>
              <h2>{props.user.email || 'No Email Available'}</h2>
              <h2>{props.user.address || 'No Address Available'}</h2>
            </>
          ) : (
            <>
              <h2>Mercy Banda</h2>
              <h2>Cashier</h2>
              <h2>0999123456</h2>
              <h2>mercybanda@gmail.com</h2>
              <h2>Lilongwe, Malawi</h2>
            </>
          )}
        </div>
        <button className="log-out-button" onClick={onLogout}>Log Out</button>      
      </div>
    </div>
    )}

    {viewMode === 'create-item' && (
    <div className="staff-register-main-container">
      <div className="staff-register-container">

        <div className="registration-options">          
          <h2 className="my-profile-button">New Item</h2>          
        </div>

        <input className="reg-input-field" placeholder="Enter new item name" type="text" value={drinkName} onChange={handleDrinkNameChange}/>

        

        {/* Custom Dropdown for Item IDs */}
        <div className="custom-dropdown" style={{ position: 'relative', marginBottom: '1rem', width: '100%' }}>
          <div
            className="reg-input-field"
            onClick={() => setShowItemDropdown(!showItemDropdown)}
            style={{
              cursor: allIds.filter(id => isIdAvailable(id)).length === 0 ? 'not-allowed' : 'pointer',
              backgroundColor: allIds.filter(id => isIdAvailable(id)).length === 0 ? '#f8f9fa' : 'white',
              opacity: allIds.filter(id => isIdAvailable(id)).length === 0 ? 0.6 : 1,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontFamily: 'Arial, sans-serif',
              border: showItemDropdown ? '2px solid #c2c5c8ff' : '2px solid #c2c5c8ff',
              padding: '18px 15px',
              outline: 'none',
              transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
              borderRadius: '4px'
            }}
            onMouseEnter={(e) => {
              if (!showItemDropdown && allIds.filter(id => isIdAvailable(id)).length > 0) {
                e.target.style.borderColor = '#a9abadff';
              }
            }}
            onMouseLeave={(e) => {
              if (!showItemDropdown) {
                e.target.style.borderColor = '#ced4da';
              }
            }}
          >
            <span style={{ color: drinkId ? '#333' : '#999' }}>
              {drinkId ? `✅ ${drinkId} - Selected` : 
               allIds.filter(id => isIdAvailable(id)).length === 0 
                 ? "No available IDs remaining" 
                 : "Assign Item ID"}
            </span>
            <span style={{ fontSize: '0.8rem', color: '#666' }}>
              {allIds.filter(id => isIdAvailable(id)).length === 0 ? '' : '▼'}
            </span>
          </div>
          
          {showItemDropdown && allIds.filter(id => isIdAvailable(id)).length > 0 && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              backgroundColor: 'white',
              border: '1px solid #ced4da',
              borderRadius: '4px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              zIndex: 1000,
              maxHeight: '200px',
              overflowY: 'auto',
              fontSize: '1rem',
              fontFamily: 'Arial, sans-serif'
            }}>
              {allIds.filter(id => isIdAvailable(id)).map(id => (
                <div
                  key={id}
                  onClick={() => {
                    setDrinkId(id);
                    setShowItemDropdown(false);
                  }}
                  style={{
                    padding: '0.75rem',
                    cursor: 'pointer',
                    borderBottom: '1px solid #f8f9fa',
                    color: '#2e8bff',
                    fontWeight: 'bold',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                >
                  ✅ {id} - Available
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>
            Available IDs: {allIds.filter(id => isIdAvailable(id)).length} / {allIds.length}
          </p>
        </div>

        {getUsedIds().length > 0 && (
          <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e9ecef' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', color: '#495057', fontSize: '1rem' }}>Already Assigned IDs:</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {getUsedIds().map(usedId => (
                <span key={usedId} style={{ 
                  padding: '0.25rem 0.5rem', 
                  backgroundColor: '#dc3545', 
                  color: 'white', 
                  borderRadius: '4px', 
                  fontSize: '0.8rem',
                  fontWeight: 'bold'
                }}>
                  ❌ {usedId}
                </span>
              ))}
            </div>
          </div>
        )}

        <button 
          className="add-item-button" 
          onClick={handleCreateNewDrink}
          disabled={allIds.filter(id => isIdAvailable(id)).length === 0}
          style={{
            opacity: allIds.filter(id => isIdAvailable(id)).length === 0 ? 0.5 : 1,
            cursor: allIds.filter(id => isIdAvailable(id)).length === 0 ? 'not-allowed' : 'pointer'
          }}
        >
          {allIds.filter(id => isIdAvailable(id)).length === 0 ? 'No IDs Available' : 'Save Item'}
        </button>   
      </div>
    </div>
    )}

    {viewMode === 'view-items' && (
    <div className="staff-register-main-container">
      <div className="staff-register-container"> 
        <div className="registration-options">          
          <h2 className="my-profile-button">Manage Items</h2>          
        </div>     
        <div className="staff-list-container">           
          <div className="staff-list-information">
            <div className="salary-items">
              <h2 className="staff-name">Item ID</h2>
              <h2 className="staff-name">Item name</h2>
              <h2 className="action">Actions</h2>
            </div>
            {/* Scrollable container for backend items */}
            <div style={{
              maxHeight: '400px',
              overflowY: 'auto',
              overflowX: 'hidden',
              border: '1px solid #e5e5e5',
              borderRadius: '8px',
              backgroundColor: 'white'
            }}>
              {backendItems.length === 0 ? (
                <div className="salary-item-info">
                  <p className="staff-name">No items created yet</p>
                  <p className="staff-name">-</p>
                  <p className="action">-</p>
                </div>
              ) : (
                paginate(backendItems, drinksPage).map((item, index) => (
                  <div className="salary-item-info" key={index}>
                    <p className="staff-name">{item.itemId}</p>
                    <p className="staff-name">{item.itemName}</p>
                    <div className="action">
                      <div>
                        <button 
                          className="flag-staff-button" 
                          onClick={() => handleDeleteDrink(item.itemId)}
                        >
                          Delete item
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {/* Pagination Controls for backend items */}
            <PaginationControls 
              currentPage={drinksPage}
              totalPages={getTotalPages(backendItems)}
              onPageChange={setDrinksPage}
            />
          </div>
        </div>          
      </div>
    </div>
      )}    

    {viewMode === 'create-expense' && (
    <div className="staff-register-main-container">
      <div className="staff-register-container">

        <div className="registration-options">          
          <h2 className="my-profile-button" style={{ fontFamily: 'Arial, sans-serif' }}>New Expense Category</h2>          
        </div>

        <input className="reg-input-field" placeholder="Enter new category name" type="text" value={expenseName} onChange={handleExpenseNameChange}/>
        
        {/* Custom Dropdown for Expense IDs */}
        <div className="custom-dropdown" style={{ position: 'relative', marginBottom: '1rem', width: '100%' }}>
          <div
            className="reg-input-field"
            onClick={() => setShowExpenseDropdown(!showExpenseDropdown)}
            style={{
              cursor: allExpenseIds.filter(id => isExpenseIdAvailable(id)).length === 0 ? 'not-allowed' : 'pointer',
              backgroundColor: allExpenseIds.filter(id => isExpenseIdAvailable(id)).length === 0 ? '#f8f9fa' : 'white',
              opacity: allExpenseIds.filter(id => isExpenseIdAvailable(id)).length === 0 ? 0.6 : 1,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontFamily: 'Arial, sans-serif',
              border: showExpenseDropdown ? '2px solid #c2c5c8ff' : '2px solid #c2c5c8ff',
              padding: '18px 15px',
              outline: 'none',
              transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
              borderRadius: '4px'
            }}
            onMouseEnter={(e) => {
              if (!showExpenseDropdown && allExpenseIds.filter(id => isExpenseIdAvailable(id)).length > 0) {
                e.target.style.borderColor = '#a9abadff';
              }
            }}
            onMouseLeave={(e) => {
              if (!showExpenseDropdown) {
                e.target.style.borderColor = '#ced4da';
              }
            }}
          >
            <span style={{ color: expenseId ? '#333' : '#999' }}>
              {expenseId ? `✅ ${expenseId} - Selected` : 
               allExpenseIds.filter(id => isExpenseIdAvailable(id)).length === 0 
                 ? "No available IDs remaining" 
                 : "Assign Expense ID"}
            </span>
            <span style={{ fontSize: '0.8rem', color: '#666' }}>
              {allExpenseIds.filter(id => isExpenseIdAvailable(id)).length === 0 ? '' : '▼'}
            </span>
          </div>
          
          {showExpenseDropdown && allExpenseIds.filter(id => isExpenseIdAvailable(id)).length > 0 && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              backgroundColor: 'white',
              border: '1px solid #ced4da',
              borderRadius: '4px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              zIndex: 1000,
              maxHeight: '200px',
              overflowY: 'auto',
              fontSize: '1rem',
              fontFamily: 'Arial, sans-serif'
            }}>
              {allExpenseIds.filter(id => isExpenseIdAvailable(id)).map(id => (
                <div
                  key={id}
                  onClick={() => {
                    setExpenseId(id);
                    setShowExpenseDropdown(false);
                  }}
                  style={{
                    padding: '0.75rem',
                    cursor: 'pointer',
                    borderBottom: '1px solid #f8f9fa',
                    color: '#2e8bff',
                    fontWeight: 'bold',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                >
                  ✅ {id} - Available
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>
            Available IDs: {allExpenseIds.filter(id => isExpenseIdAvailable(id)).length} / {allExpenseIds.length}
          </p>
        </div>

        {getUsedExpenseIds().length > 0 && (
          <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e9ecef' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', color: '#495057', fontSize: '1rem' }}>Already Assigned IDs:</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {getUsedExpenseIds().map(usedId => (
                <span key={usedId} style={{ 
                  padding: '0.25rem 0.5rem', 
                  backgroundColor: '#dc3545', 
                  color: 'white', 
                  borderRadius: '4px', 
                  fontSize: '0.8rem',
                  fontWeight: 'bold'
                }}>
                  ❌ {usedId}
                </span>
              ))}
            </div>
          </div>
        )}

        <button 
          className="add-item-button" 
          onClick={handleCreateNewExpense}
          disabled={allExpenseIds.filter(id => isExpenseIdAvailable(id)).length === 0}
          style={{
            opacity: allExpenseIds.filter(id => isExpenseIdAvailable(id)).length === 0 ? 0.5 : 1,
            cursor: allExpenseIds.filter(id => isExpenseIdAvailable(id)).length === 0 ? 'not-allowed' : 'pointer'
          }}
        >
          {allExpenseIds.filter(id => isExpenseIdAvailable(id)).length === 0 ? 'No IDs Available' : 'Save Category'}
        </button>   
      </div>
    </div>
    )}

    {viewMode === 'view-expenses' && (
    <div className="staff-register-main-container">
      <div className="staff-register-container"> 

        <div className="registration-options">          
          <h2 className="my-profile-button">Manage Expenses</h2>          
        </div>     

        
          <div className="staff-list-container">           
        
          <div className="staff-list-information">
            <div className="salary-items">
              <h2 className="staff-name">Expense ID</h2>
              <h2 className="staff-name">Expense category</h2>
              <h2 className="action">Actions</h2>
            </div>

            {/* Scrollable container for expenses */}
            <div style={{
              maxHeight: '400px',
              overflowY: 'auto',
              overflowX: 'hidden',
              border: '1px solid #e5e5e5',
              borderRadius: '8px',
              backgroundColor: 'white'
            }}>
              {backendExpenses.length === 0 ? (
                <div className="salary-item-info">
                  <p className="staff-name">No expense categories created yet</p>
                  <p className="staff-name">-</p>
                  <p className="action">-</p>
                </div>
              ) : (
                paginate(backendExpenses, expensesPage).map((expense, index) => (
                  <div className="salary-item-info" key={index}>
                    <p className="staff-name">{expense.expenseId}</p>
                    <p className="staff-name">{expense.name}</p>
                    <div className="action">
                      <div>
                        <button 
                          className="flag-staff-button" 
                          onClick={() => handleDeleteExpense(expense.expenseId)}
                        >
                          Delete item
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {/* Pagination Controls for Expenses */}
            <PaginationControls 
              currentPage={expensesPage}
              totalPages={getTotalPages(backendExpenses)}
              onPageChange={setExpensesPage}
            />
          
          </div>
          </div>          

      </div>
    </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
            maxWidth: '400px',
            width: '90%',
            textAlign: 'center',
            fontFamily: 'Arial, sans-serif'
          }}>
            <h3 style={{
              margin: '0 0 1rem 0',
              color: '#185aca',
              fontSize: '1.5rem'
            }}>
              Confirm Deletion
            </h3>
            
            <p style={{
              margin: '0 0 1.5rem 0',
              color: '#495057',
              fontSize: '1rem',
              lineHeight: '1.5'
            }}>
              Are you sure you want to delete the {deleteType} <strong>"{deleteType === 'drink' ? itemToDelete?.itemName : itemToDelete?.name}"</strong> (ID: {deleteType === 'drink' ? itemToDelete?.itemId : itemToDelete?.expenseId})?
              <br /><br />
              <span style={{ color: '#495057', fontWeight: 'bold' }}>
                This action cannot be undone.
              </span>
            </p>
            
            <div style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'center'
            }}>
              <button
                onClick={cancelDelete}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#5a6268'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#6c757d'}
              >
                Cancel
              </button>
              
              <button
                onClick={confirmDelete}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#c82333'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#dc3545'}
              >
                OK, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    
    </div>
    
  );
}

export default MyProfile;