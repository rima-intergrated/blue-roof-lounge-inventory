import { useState, useEffect } from "react";
import { API_BASE_URL } from './services/api';
import { useNavigate } from "react-router-dom";
import formatCurrency from './utils/formatCurrency';
import { payrollAPI } from './services/api';

function ReportsAnalytics (props) {

  // suppliers prop may come as an array or a paginated/resource wrapper
  const rawSuppliersProp = props.suppliers;
  const setSuppliers = props.setSuppliers;

  // Normalize suppliers into an array and expose a count. Common API shapes:
  // - []
  // - { data: [], docs: [], items: [], results: [] }
  // - { rows: [], total: N }
  const normalizeSuppliers = (val) => {
    if (!val) return { list: [], count: 0 };
    if (Array.isArray(val)) return { list: val, count: val.length };
    // Object shapes
    const listCandidates = ['data', 'docs', 'items', 'results', 'rows'];
    for (const key of listCandidates) {
      if (Array.isArray(val[key])) return { list: val[key], count: val.total || val.count || val.length || val[key].length };
    }
    // Fallback: try values that are arrays
    const firstArray = Object.values(val).find(v => Array.isArray(v));
    if (firstArray) return { list: firstArray, count: val.total || val.count || firstArray.length };
    // Not an array-like shape
    return { list: [], count: 0 };
  };

  const { list: suppliers, count: suppliersCount } = normalizeSuppliers(rawSuppliersProp);
  const creditRecords = props.creditRecords || [];
  const paidCreditRecords = props.paidCreditRecords || [];
  const pendingSalariesProp = props.pendingSalaries || [];
  // Local copy so we can fetch/populate when the parent hasn't loaded payrolls yet
  const [localPendingSalaries, setLocalPendingSalaries] = useState(Array.isArray(pendingSalariesProp) ? pendingSalariesProp : []);
  const inventory = props.inventory || {};
  const [viewMode, setViewMode] = useState('low-stock');
  const navigate = useNavigate();
  
  // Pagination states
  const [suppliersPage, setSuppliersPage] = useState(1);
  const [creditRecordsPage, setCreditRecordsPage] = useState(1);
  const [paidCreditRecordsPage, setPaidCreditRecordsPage] = useState(1);
  const [upcomingPaymentsPage, setUpcomingPaymentsPage] = useState(1);
  const [lowStockPage, setLowStockPage] = useState(1);
  const [lowStockItems, setLowStockItems] = useState(null); // null = not loaded yet
  const [lowStockLoading, setLowStockLoading] = useState(false);
  const [lowStockError, setLowStockError] = useState('');
  
  const itemsPerPage = 5;
  
  // Pagination helper functions
  const paginate = (items, currentPage) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return items.slice(startIndex, startIndex + itemsPerPage);
  };
  
  const getTotalPages = (items) => Math.ceil(items.length / itemsPerPage);

  // Helpers to safely extract customer name / phone from various record shapes
  const getCustomerName = (record) => {
    if (!record) return '-';
    // Common shapes: record.customer, record.customerName, record.customer?.name, record.customer?.fullName
    if (record.customer) {
      if (typeof record.customer === 'string') return record.customer;
      if (typeof record.customer === 'object') return record.customer.name || record.customer.fullName || record.customer.customerName || '-';
    }
    return record.customerName || record.customer_fullName || record.customerMobileName || '-';
  };

  const getCustomerPhone = (record) => {
    if (!record) return '-';
    // Common shapes: record.customerContact, record.customerMobile, record.customerPhone, record.customer?.phone
    if (record.customerContact) return record.customerContact;
    if (record.customerMobile) return record.customerMobile;
    if (record.customerPhone) return record.customerPhone;
    if (record.customer && typeof record.customer === 'object') return record.customer.phone || record.customer.mobile || record.customer.contact || '-';
    return record.phone || record.mobile || '-';
  };

  // Helpers for sale/payment dates with multiple possible field names
  const formatDateValue = (val) => {
    if (!val) return '-';
    // If it's a Date object
    if (val instanceof Date) return val.toLocaleDateString();
    // If it's a number (timestamp)
    if (typeof val === 'number') return new Date(val).toLocaleDateString();
    // String - try to parse, but prefer returning as-is (already formatted)
    try {
      const d = new Date(val);
      if (!isNaN(d)) return d.toLocaleDateString();
    } catch (e) {
      // fallthrough
    }
    return String(val);
  };

  const getSaleDate = (record) => {
    if (!record) return '-';
    // Try common fields in order of precedence
    if (record.originalSaleDate) return formatDateValue(record.originalSaleDate);
    if (record.dateSold) return formatDateValue(record.dateSold);
    if (record.formattedDateSold) return formatDateValue(record.formattedDateSold);
    if (record.date) return formatDateValue(record.date);
    if (record.createdAt) return formatDateValue(record.createdAt);
    return '-';
  };

  const getPaymentDate = (record) => {
    if (!record) return '-';
    if (record.paymentDate) return formatDateValue(record.paymentDate);
    if (record.datePaid) return formatDateValue(record.datePaid);
    if (record.formattedDatePaid) return formatDateValue(record.formattedDatePaid);
    if (record.paidAt) return formatDateValue(record.paidAt);
    return '-';
  };

  // Supplier helpers to normalize different shapes
  const getSupplierName = (supplier) => {
    if (!supplier) return '-';
    // API may return { supplierName } or { name }
    if (supplier.supplierName) return supplier.supplierName;
    if (supplier.name) return supplier.name;
    if (supplier.contactPerson && typeof supplier.contactPerson === 'object') {
      return `${supplier.contactPerson.firstName || ''} ${supplier.contactPerson.lastName || ''}`.trim() || '-';
    }
    return supplier.displayName || supplier.label || '-';
  };

  const getSupplierPhone = (supplier) => {
    if (!supplier) return '-';
    if (supplier.phone) return supplier.phone;
    if (supplier.phoneNumber) return supplier.phoneNumber;
    if (supplier.contactInformation && supplier.contactInformation.phoneNumber) return supplier.contactInformation.phoneNumber;
    if (supplier.contactPerson && typeof supplier.contactPerson === 'object') return supplier.contactPerson.phone || supplier.contactPerson.mobile || '-';
    return '-';
  };

  const getSupplierDateAdded = (supplier) => {
    if (!supplier) return '-';
    if (supplier.dateAdded) return supplier.dateAdded;
    if (supplier.createdAt) return new Date(supplier.createdAt).toLocaleDateString();
    return supplier.addedAt || '-';
  };

  // Helper to normalize item name from credit/sale records
  const getItemName = (record) => {
    if (!record) return '-';
    // Common shapes: record.itemName, record.name, record.productName, record.title
    return record.itemName || record.name || record.productName || record.title || '-';
  };
  
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
            cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
            color: currentPage <= 1 ? '#999' : '#333'
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
            color: currentPage >= totalPages ? '#999' : '#333'
          }}
        >
          Next
        </button>
      </div>
    );
  };
  
  // Function to remove supplier (accepts id, _id or supplierId)
  function handleRemoveSupplier(supplierId) {
    // Try to delete from backend first (if auth available)
    (async () => {
      try {
        const token = localStorage.getItem('authToken');
        // Accept supplierId that might be an object id string
  const resp = await fetch(`${API_BASE_URL}/suppliers/${encodeURIComponent(supplierId)}`, {
          method: 'DELETE',
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });

        if (!resp.ok) {
          // Log and still attempt to remove from UI to avoid irritating the user, but warn
          let body = '';
          try { body = await resp.json(); } catch (e) { body = await resp.text(); }
          // eslint-disable-next-line no-console
          console.warn('Failed to delete supplier on server:', resp.status, body);
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('Network error deleting supplier:', e && e.message);
      } finally {
        // Regardless of server response, attempt to update parent state if provided
        if (typeof setSuppliers !== 'function') {
          // eslint-disable-next-line no-console
          console.warn('handleRemoveSupplier: setSuppliers not provided; supplier removed only in local UI iteration. supplierId:', supplierId);
          return;
        }

        setSuppliers(prev => {
          if (!Array.isArray(prev)) return prev;
          return prev.filter(supplier => {
            const sid = supplier.id || supplier._id || supplier.supplierId || '';
            return sid !== supplierId;
          });
        });
      }
    })();
  }

  // Function to navigate to inventory management
  function handleRestockItem() {
    navigate('/inventory');
  }

  // Fetch low-stock items from backend (persistent source)
  async function fetchLowStockItems() {
    setLowStockLoading(true);
    setLowStockError('');
    try {
      const token = localStorage.getItem('authToken');
  const resp = await fetch(`${API_BASE_URL}/stock/alerts/low-stock`, {
        headers: token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }
      });
      if (!resp.ok) {
        const txt = await resp.text();
        const msg = `Failed to fetch low stock items: ${resp.status} ${txt}`;
        console.warn(msg);
        setLowStockError(msg);
        // If alerts endpoint not found, attempt fallback to /api/stock
        if (resp.status === 404) {
          try {
            const fallback = await fetch(`${API_BASE_URL}/stock?page=1&limit=1000`, {
              headers: token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }
            });
            if (fallback.ok) {
              const fallbackJson = await fallback.json();
              const items = fallbackJson && fallbackJson.data && Array.isArray(fallbackJson.data.items) ? fallbackJson.data.items : (fallbackJson.data || []);
              // compute low stock by reorderLevel or threshold 5
              const low = (items || []).filter(it => (Number(it.currentStock) || 0) <= (Number(it.reorderLevel) || 5));
              setLowStockItems(low);
              return;
            }
          } catch (fe) {
            console.warn('Fallback /api/stock fetch failed:', fe?.message || fe);
          }
        }
        setLowStockItems([]);
        return;
      }
      const data = await resp.json();
      if (data && data.success && data.data && Array.isArray(data.data.items)) {
        setLowStockItems(data.data.items);
      } else {
        setLowStockItems([]);
      }
    } catch (e) {
      const msg = 'Error fetching low stock items: ' + (e?.message || e);
      console.error(msg);
      setLowStockError(msg);
      setLowStockItems([]);
    } finally {
      setLowStockLoading(false);
    }
  }

  // Restock handler that persists to backend using PATCH /api/stock/:id/stock
  async function handleRestockPersist(item) {
    // item is an inventory document; we expect _id present
    if (!item || !item._id) {
      alert('Cannot restock: invalid item');
      return;
    }
    const qtyStr = window.prompt(`Enter quantity to add to "${item.itemName || item.name || item.displayName || item.itemId}" (current: ${item.currentStock || 0})`, '10');
    if (!qtyStr) return;
    const qty = parseInt(qtyStr, 10);
    if (Number.isNaN(qty) || qty <= 0) { alert('Invalid quantity'); return; }

    try {
      const token = localStorage.getItem('authToken');
      const body = { quantity: qty, action: 'add', costPrice: item.costPrice || item.cost_price || 0, sellingPrice: item.sellingPrice || item.selling_price || 0 };
  const resp = await fetch(`${API_BASE_URL}/stock/${encodeURIComponent(item._id)}/stock`, {
        method: 'PATCH',
        headers: token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!resp.ok) {
        const txt = await resp.text();
        console.error('Restock failed:', resp.status, txt);
        alert('Restock failed: ' + resp.status);
        return;
      }
      const result = await resp.json();
      if (result && result.success) {
        alert('Restock successful');
        // Refresh low stock list and optionally refresh parent inventory prop by calling /api/stock
        fetchLowStockItems();
      } else {
        console.warn('Unexpected restock response', result);
        alert('Restock may have failed');
      }
    } catch (e) {
      console.error('Error restocking item:', e?.message || e);
      alert('Error restocking item: ' + (e?.message || e));
    }
  }

  // Load low stock items when view is shown
  useEffect(() => {
    if (viewMode === 'low-stock') {
      fetchLowStockItems();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode]);

  // Keep local pending salaries in sync with parent prop
  useEffect(() => {
    if (Array.isArray(pendingSalariesProp) && pendingSalariesProp.length > 0) {
      setLocalPendingSalaries(pendingSalariesProp);
    }
  }, [pendingSalariesProp]);

  // If pending salaries are empty on mount, attempt to fetch payrolls so Reports shows upcoming payments
  useEffect(() => {
    let mounted = true;
    async function fetchPendingFromServer() {
      try {
        if (Array.isArray(localPendingSalaries) && localPendingSalaries.length > 0) return;
        // Use the app's API wrapper so requests go to the actual backend (not the Vite dev server)
        const resp = await payrollAPI.getAll();
        if (!resp || !resp.success) return;
        const payrolls = resp.data && (resp.data.payrolls || resp.data.items) ? (resp.data.payrolls || resp.data.items) : (Array.isArray(resp.data) ? resp.data : []);
        const arr = Array.isArray(payrolls) ? payrolls : [];
        // Basic transformation to the shape Reports expects
        // Exclude allowance-only payroll records so Upcoming Payments shows salaries/advances only
        const pending = arr
          .filter(p => {
            const isPending = p.paymentStatus === 'Pending' || p.paymentStatus === 'pending';
            // Detect explicit allowance type
            if (!isPending) return false;
            const isAllowanceType = p.paymentType === 'allowance';
            // Detect allowance-like records via allowances object
            const hasAllowances = p.allowances && Object.values(p.allowances).some(v => Number(v) > 0);
            // If it's explicitly an allowance or allowance-only record, exclude it
            if (isAllowanceType || hasAllowances) return false;
            return true;
          })
          .map(p => ({
            _id: p._id || p.id,
            id: p._id || p.id,
            staffName: p.employee?.name || p.staffName || p.name || 'Unknown Staff',
            salary: Number(p.basicSalary) || 0,
            category: p.paymentType === 'advance' ? 'Advance' : 'Salary',
            balance: (Number(p.basicSalary) || 0) - (Number(p.deductions?.advance) || 0),
            status: p.paymentStatus || 'pending',
            dateIssued: p.createdAt || p.date || new Date().toISOString()
          }));

        if (mounted && pending.length > 0) {
          setLocalPendingSalaries(pending);
          if (typeof props.setPendingSalaries === 'function') {
            try { props.setPendingSalaries(pending); } catch (e) { /* ignore */ }
          }
        }
      } catch (e) {
        // non-fatal
        // eslint-disable-next-line no-console
        console.warn('ReportsAnalytics: failed to fetch payrolls for pending salaries:', e && e.message);
      }
    }
    fetchPendingFromServer();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Ensure a fetch happens on initial mount regardless of viewMode
    if (lowStockItems === null) fetchLowStockItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Helper to compute low stock count for the top box
  const getLowStockCount = () => {
    // Prefer persisted lowStockItems (when loaded). null = not loaded yet
    if (Array.isArray(lowStockItems)) return lowStockItems.length;
    // Fallback: compute from inventory prop (inventory may be object map or array)
    try {
      const itemsArray = Array.isArray(inventory) ? inventory : Object.values(inventory || {});
      return itemsArray.filter(it => (Number(it.currentStock) || 0) <= (Number(it.reorderLevel) || 5)).length;
    } catch (e) {
      return 0;
    }
  };

  return(
    <div className="reports-analytics-container">
      <div className="top-boxes-container">
        <div className="suppliers" onClick={() => setViewMode('suppliers')}>
          <p>Suppliers</p>
          <h2>{suppliersCount}</h2>
        </div>
        <div className="credit-collections" onClick={() => setViewMode('credit-collections')}>
          <p>Credit Collections</p>
          <h2>{creditRecords.length}</h2>
        </div>
        <div className="upcoming-payments" onClick={() => setViewMode('payment-history')}>
          <p>Payment History</p>
          <h2>{paidCreditRecords.length}</h2>
        </div>
        <div className="overdue-payments" onClick={() => setViewMode('upcoming-payments')}>
          <p>Upcoming Payments</p>
          <h2>{localPendingSalaries.length}</h2>
        </div>
        {/* Overdue Payments removed - not required */}
        <div className="low-stock" onClick={() => setViewMode('low-stock')}>
          <p>Low Stock</p>
            <h2>{getLowStockCount()}</h2>
        </div>
      </div>

      {viewMode === 'suppliers' && (
        <div className="bottom-box-container">
        <div className="stocksheet-title">
          <h2>Suppliers</h2>
        </div>
      <div className="stocksheet-mini-container">        

        <div className="bottom-box-information">
          <div className="stocksheet-items">
            <h2 className="item">Name</h2>
            <h2 className="cost-price">Phone</h2>
            <h2 className="quantity-available">Date Added</h2>
            <h2 className="selling-price">Action</h2>
          </div>

          {/* Scrollable container for suppliers */}
          <div style={{
            maxHeight: '400px',
            overflowY: 'auto',
            overflowX: 'hidden',
            border: '1px solid #e5e5e5',
            borderRadius: '8px',
            backgroundColor: 'white'
          }}>
                {suppliers.length === 0 ? (
              <div className="item-info">
                <p className="item">No suppliers added yet</p>
                <p className="cost-price">-</p>
                <p className="quantity-available">-</p>
                <p className="selling-price">-</p>
              </div>
            ) : (
              paginate(suppliers, suppliersPage).map((supplier) => (
                <div className="item-info" key={supplier.id || supplier._id || supplier.supplierId}>
                  <p className="item">{getSupplierName(supplier)}</p>
                  <p className="cost-price">{getSupplierPhone(supplier)}</p>
                  <p className="quantity-available" style={{ 
                    fontSize: '0.9rem', 
                    color: '#666',
                    fontFamily: 'Arial, sans-serif'
                  }}>
                    {getSupplierDateAdded(supplier)}
                  </p>
                    <p className="selling-price">
                    <button 
                      onClick={() => handleRemoveSupplier(supplier.id || supplier._id || supplier.supplierId)}
                      style={{
                        backgroundColor: '#dc3545',
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
                        e.target.style.backgroundColor = '#c82333';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = '#dc3545';
                      }}
                    >
                      Remove
                    </button>
                  </p>
                </div>
              ))
            )}
          </div>
          
          {/* Pagination Controls for Suppliers */}
          <PaginationControls 
            currentPage={suppliersPage}
            totalPages={getTotalPages(suppliers)}
            onPageChange={setSuppliersPage}
          />
      </div>   
      </div> 
      </div>
      )}

      {viewMode === 'payment-history' && (
        <div className="bottom-box-container">
        <div className="stocksheet-title">
          <h2>Payment History</h2>
        </div>
      <div className="stocksheet-mini-container">        

        <div className="bottom-box-information">
          <div className="stocksheet-items">
            <h2 className="item">Sale Date</h2>
            <h2 className="item">Payment Date</h2>
            <h2 className="item">Item</h2>
            <h2 className="item">Quantity</h2>
            <h2 className="cost-price">Selling Price</h2>
            <h2 className="selling-price">Total</h2>
            <h2 className="quantity-available">Customer</h2>
            <h2 className="stock-value">Phone</h2>
          </div>

          {/* Scrollable container for payment history */}
          <div style={{
            maxHeight: '400px',
            overflowY: 'auto',
            overflowX: 'hidden',
            border: '1px solid #e5e5e5',
            borderRadius: '8px',
            backgroundColor: 'white'
          }}>
            {paidCreditRecords.length === 0 ? (
              <div className="item-info">
                <p className="item">No payments recorded yet</p>
                <p className="item">-</p>
                <p className="item">-</p>
                <p className="item">-</p>
                <p className="cost-price">-</p>
                <p className="selling-price">-</p>
                <p className="quantity-available">-</p>
                <p className="stock-value">-</p>
              </div>
            ) : (
              paginate(paidCreditRecords, paidCreditRecordsPage).map((record, index) => {
                const total = (Number(record.sellingPrice) || 0) * (Number(record.quantitySold) || 0);
                return (
                  <div className="item-info" key={index}>
                    <p className="item" style={{ 
                      fontSize: '0.9rem', 
                      color: '#666',
                      fontFamily: 'Arial, sans-serif'
                    }}>
                      {getSaleDate(record)}
                    </p>
                    <p className="item" style={{ 
                      fontSize: '0.9rem', 
                                      color: '#28a745',
                      fontWeight: 'bold',
                      fontFamily: 'Arial, sans-serif'
                    }}>
                      {getPaymentDate(record)}
                    </p>
                    <p className="item">{getItemName(record)}</p>
                    <p className="item">{record.quantitySold}</p>
                    <p className="cost-price">{formatCurrency(Number(record.sellingPrice))}</p>
                    <p className="selling-price">{formatCurrency(total)}</p>
                    <p className="quantity-available">{getCustomerName(record)}</p>
                    <p className="stock-value">{getCustomerPhone(record)}</p>
                  </div>
                );
              })
            )}
          </div>
          
          {/* Pagination Controls for Payment History */}
          <PaginationControls 
            currentPage={paidCreditRecordsPage}
            totalPages={getTotalPages(paidCreditRecords)}
            onPageChange={setPaidCreditRecordsPage}
          />
      </div>   
      </div> 
      </div>
      )}

      {viewMode === 'credit-collections' && (
        <div className="bottom-box-container">
        <div className="stocksheet-title">
          <h2>Credit Collections</h2>
        </div>
      <div className="stocksheet-mini-container">        

        <div className="bottom-box-information">
          <div className="stocksheet-items">
            <h2 className="item">Sale Date</h2>
            <h2 className="item">Item</h2>
            <h2 className="item">Quantity</h2>
            <h2 className="cost-price">Selling Price</h2>
            <h2 className="selling-price">Total Outstanding</h2>
            <h2 className="quantity-available">Customer</h2>
            <h2 className="stock-value">Phone</h2>
          </div>

          {/* Scrollable container for credit collections */}
          <div style={{
            maxHeight: '400px',
            overflowY: 'auto',
            overflowX: 'hidden',
            border: '1px solid #e5e5e5',
            borderRadius: '8px',
            backgroundColor: 'white'
          }}>
            {creditRecords.length === 0 ? (
              <div className="item-info">
                <p className="item">No outstanding credits</p>
                <p className="item">-</p>
                <p className="item">-</p>
                <p className="cost-price">-</p>
                <p className="selling-price">-</p>
                <p className="quantity-available">-</p>
                <p className="stock-value">-</p>
              </div>
            ) : (
              paginate(creditRecords, creditRecordsPage).map((record, index) => {
                const total = (Number(record.sellingPrice) || 0) * (Number(record.quantitySold) || 0);
                const saleDate = new Date(record.dateSold);
                const today = new Date();
                const daysDifference = Math.floor((today - saleDate) / (1000 * 60 * 60 * 24));
                const isOverdue = daysDifference > 30; // Consider overdue after 30 days
                
                return (
                  <div className="item-info" key={index}>
                    <p className="item" style={{ 
                      fontSize: '0.9rem', 
                      color: isOverdue ? '#dc3545' : '#666',
                      fontFamily: 'Arial, sans-serif',
                      fontWeight: isOverdue ? 'bold' : 'normal'
                    }}>
                      {record.dateSold} {isOverdue && `(${daysDifference} days)`}
                    </p>
                    <p className="item">{getItemName(record)}</p>
                    <p className="item">{record.quantitySold}</p>
                    <p className="cost-price">{formatCurrency(Number(record.sellingPrice))}</p>
                    <p className="selling-price" style={{
                      color: isOverdue ? '#dc3545' : '#333',
                      fontWeight: isOverdue ? 'bold' : 'normal'
                    }}>
                      {formatCurrency(total)}
                    </p>
                    <p className="quantity-available">{getCustomerName(record)}</p>
                    <p className="stock-value">{getCustomerPhone(record)}</p>
                  </div>
                );
              })
            )}
          </div>
          
          {/* Pagination Controls for Credit Collections */}
          <PaginationControls 
            currentPage={creditRecordsPage}
            totalPages={getTotalPages(creditRecords)}
            onPageChange={setCreditRecordsPage}
          />
      </div>   
      </div> 
      </div>
      )} 

      {viewMode === 'upcoming-payments' && (
        <div className="bottom-box-container">
        <div className="stocksheet-title">
          <h2>Upcoming Payments</h2>
        </div>
      <div className="stocksheet-mini-container">        

        <div className="bottom-box-information">
          <div className="stocksheet-items">
            <h2 className="item">Payment Type</h2>
            <h2 className="item">Staff Name</h2>
            <h2 className="cost-price">Due Date</h2>
            <h2 className="selling-price">Salary Amount</h2>
            <h2 className="quantity-available">Amount Due</h2>
            <h2 className="stock-value">Status</h2>
          </div>

          {/* Scrollable container for upcoming payments (mapped from pendingSalaries) */}
          <div style={{
            maxHeight: '400px',
            overflowY: 'auto',
            overflowX: 'hidden',
            border: '1px solid #e5e5e5',
            borderRadius: '8px',
            backgroundColor: 'white'
          }}>
            {(!localPendingSalaries || localPendingSalaries.length === 0) ? (
              <div className="item-info">
                <p className="item">No upcoming payments</p>
                <p className="item">-</p>
                <p className="cost-price">-</p>
                <p className="selling-price">-</p>
                <p className="quantity-available">-</p>
                <p className="stock-value">-</p>
              </div>
            ) : (
              paginate(localPendingSalaries, upcomingPaymentsPage).map((salary, index) => {
                const issueDate = new Date(salary.dateIssued || salary.dueDate || salary.date);
                const today = new Date();
                const daysSinceIssue = Math.floor((today - issueDate) / (1000 * 60 * 60 * 24));
                const isUrgent = daysSinceIssue > 30; // Urgent if issued over 30 days ago

                return (
                  <div className="item-info" key={salary.id || salary._id || index}>
                    <p className="item" style={{
                      fontWeight: 'bold',
                      color: salary.category === 'Advance' ? '#007bff' : '#28a745'
                    }}>
                      {salary.category === 'Advance' ? 'Salary Balance' : 'Full Salary'}
                    </p>
                    <p className="item">{salary.staffName || salary.staff || salary.name || '-'}</p>
                    <p className="cost-price" style={{ 
                      fontSize: '0.9rem', 
                      color: isUrgent ? '#fd7e14' : '#666',
                      fontFamily: 'Arial, sans-serif'
                    }}>
                      {issueDate.toLocaleDateString()} {isUrgent && '(URGENT)'}
                    </p>
                    <p className="selling-price">{formatCurrency(Number(salary.salary || salary.amount || 0))}</p>
                    <p className="quantity-available" style={{
                      color: isUrgent ? '#fd7e14' : '#333'
                    }}>
                      {formatCurrency(Number(salary.balance || salary.amountDue || 0))}
                    </p>
                    <p className="stock-value">
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '0.8rem',
                        fontWeight: 'bold',
                        backgroundColor: isUrgent ? '#fd7e14' : '#28a745',
                        color: 'white'
                      }}>
                        {isUrgent ? 'URGENT' : 'PENDING'}
                      </span>
                    </p>
                  </div>
                );
              })
            )}
          </div>
          
          {/* Pagination Controls for Upcoming Payments */}
          <PaginationControls 
            currentPage={upcomingPaymentsPage}
            totalPages={getTotalPages(localPendingSalaries || [])}
            onPageChange={setUpcomingPaymentsPage}
          />
      </div>   
      </div> 
      </div>
      )}

      {/* Overdue Payments removed as requested */}

      {viewMode === 'low-stock' && (
        <div className="bottom-box-container">
        <div className="stocksheet-title" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          <h2>Low Stock Alert</h2>
          {lowStockError && (
            <div style={{ color: '#b00020', marginTop: '8px', fontSize: '0.9rem', textAlign: 'center', maxWidth: '720px' }}>
              {lowStockError}
            </div>
          )}
          {/* <button 
            onClick={handleRestockItem}
            style={{
              backgroundColor: '#007bff',
              border: 'none',
              padding: '10px 20px',
              color: 'white',
              fontSize: '1rem',
              fontWeight: 'bold',
              fontFamily: 'Arial, sans-serif',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#0056b3';
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#007bff';
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
            }}
          >
            Manage Inventory
          </button> */}
        </div>
      <div className="stocksheet-mini-container">        

        <div className="bottom-box-information">
          <div className="stocksheet-items">
            <h2 className="item">Item Name</h2>
            <h2 className="cost-price">Cost Price</h2>
            <h2 className="selling-price">Selling Price</h2>
            <h2 className="quantity-available">Available Qty</h2>
            <h2 className="stock-value">Status</h2>
            <h2 className="selling-price">Action</h2>
          </div>

          {(() => {
            // Prefer persisted lowStockItems when loaded, otherwise fall back to inventory prop
            const itemsSource = Array.isArray(lowStockItems) ? lowStockItems : Object.entries(inventory).map(([k, v]) => ({ ...v, _id: v._id || v.id || k }));
            const filtered = itemsSource.filter(item => (item.currentStock || 0) <= (item.reorderLevel || 5));

            return (
              <div style={{
                maxHeight: '400px',
                overflowY: 'auto',
                overflowX: 'hidden',
                border: '1px solid #e5e5e5',
                borderRadius: '8px',
                backgroundColor: 'white'
              }}>
                {lowStockLoading ? (
                  <div style={{ padding: '1rem', textAlign: 'center' }}>Loading low stock items…</div>
                ) : filtered.length === 0 ? (
                  <div className="item-info">
                    <p className="item">All items well stocked</p>
                    <p className="cost-price">-</p>
                    <p className="selling-price">-</p>
                    <p className="quantity-available">-</p>
                    <p className="stock-value">-</p>
                    <p className="selling-price">-</p>
                  </div>
                ) : (
                  paginate(filtered, lowStockPage).map((item) => {
                    const isCritical = (item.currentStock || 0) <= 2;
                    const isLow = (item.currentStock || 0) <= 5 && (item.currentStock || 0) > 2;
                    const key = item._id || item.itemId || item.itemId || item.id || item.itemId || item.name;
                    return (
                      <div className="item-info" key={key}>
                        <p className="item" style={{
                          fontWeight: 'bold',
                          color: isCritical ? '#dc3545' : '#fd7e14'
                        }}>
                          {item.itemName || item.name || item.displayName || item.itemId}
                        </p>
                        <p className="cost-price">{formatCurrency(Number(item.costPrice) || Number(item.cost_price) || 0)}</p>
                        <p className="selling-price">{formatCurrency(Number(item.sellingPrice) || Number(item.selling_price) || 0)}</p>
                        <p className="quantity-available" style={{
                          color: isCritical ? '#dc3545' : '#fd7e14',
                          fontWeight: 'bold',
                          fontSize: '1.1rem'
                        }}>
                          {item.currentStock || 0}
                        </p>
                        <p className="stock-value">
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '0.8rem',
                            fontWeight: 'bold',
                            backgroundColor: isCritical ? '#dc3545' : isLow ? '#fd7e14' : '#28a745',
                            color: 'white'
                          }}>
                            {isCritical ? 'CRITICAL' : isLow ? 'LOW' : 'NORMAL'}
                          </span>
                        </p>
                        <p className="selling-price">
                          <button 
                            onClick={() => navigate(`/inventory?focusItemId=${encodeURIComponent(item.itemId || item._id || item.id || '')}`)}
                            style={{
                              backgroundColor: '#007bff',
                              border: 'none',
                              padding: '8px 12px',
                              color: 'white',
                              fontSize: '0.9rem',
                              fontWeight: 'bold',
                              fontFamily: 'Arial, sans-serif',
                              borderRadius: '5px',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.backgroundColor = '#0056b3';
                              e.target.style.transform = 'scale(1.05)';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.backgroundColor = '#007bff';
                              e.target.style.transform = 'scale(1)';
                            }}
                          >
                            Restock
                          </button>
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            );
          })()}
          
          {/* Pagination Controls for Low Stock */}
          {(() => {
            // Compute the same filtered array as the low-stock rendering above
            const itemsSource = Array.isArray(lowStockItems) ? lowStockItems : Object.entries(inventory).map(([k, v]) => ({ ...v, _id: v._id || v.id || k }));
            const filteredForPagination = itemsSource.filter(item => (item.currentStock || 0) <= (item.reorderLevel || 5));

            return (
              <PaginationControls 
                currentPage={lowStockPage}
                totalPages={getTotalPages(filteredForPagination)}
                onPageChange={setLowStockPage}
              />
            );
          })()}
      </div>   
      </div> 
      </div>
      )} 

    </div>
  );
}

export default ReportsAnalytics;