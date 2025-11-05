/* eslint-disable no-unused-vars, no-empty */
import { useState, useEffect, useRef } from "react";
import { attachmentAPI, stockAPI, categoryAPI, expenseAPI, expenseCategoryAPI, salesAPI, creditSalesAPI, staffAPI, API_BASE_URL } from "../../services/api";
import formatCurrency from '../../utils/formatCurrency';
import { useAuth } from '../../context/AuthContext';

function PosTransaction (props) {
  // User authentication context
  const { user } = useAuth();
  
  // State for cash sales modal
  const [showCashSalesModal, setShowCashSalesModal] = useState(false);
  const [selectedCashSale, setSelectedCashSale] = useState(null);
  // Helper to render filtered cash records and summary
  function renderFilteredCashRecords() {
    const isFiltered = !!(cashSalesFilterDate || cashSalesFilterItem || cashSalesFilterSignedBy);
    const filteredCashRecords = allCashRecords.filter(product => {
      // Date filter
      if (cashSalesFilterDate && product.dateSold) {
        // Normalize product date to YYYY-MM-DD format without timezone shifts
        let prodDate;
        if (typeof product.dateSold === 'string') {
          // If it's already in YYYY-MM-DD format, use it directly
          const match = product.dateSold.match(/^(\d{4})-(\d{2})-(\d{2})/);
          if (match) {
            prodDate = match[0]; // YYYY-MM-DD
          } else {
            // Handle other string formats like MM/DD/YYYY or localized dates
            const date = new Date(product.dateSold);
            if (!isNaN(date)) {
              // Use local date components to avoid timezone shifts
              const year = date.getFullYear();
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const day = String(date.getDate()).padStart(2, '0');
              prodDate = `${year}-${month}-${day}`;
            }
          }
        } else if (product.dateSold instanceof Date) {
          // For Date objects, use local date components
          const year = product.dateSold.getFullYear();
          const month = String(product.dateSold.getMonth() + 1).padStart(2, '0');
          const day = String(product.dateSold.getDate()).padStart(2, '0');
          prodDate = `${year}-${month}-${day}`;
        }
        
        if (prodDate !== cashSalesFilterDate) return false;
      }
      // Item filter
      if (cashSalesFilterItem && product.name) {
        if (!product.name.toLowerCase().includes(cashSalesFilterItem.toLowerCase())) return false;
      }
      // Signed By filter
      if (cashSalesFilterSignedBy && getSignedByDisplay(product)) {
        if (!getSignedByDisplay(product).toLowerCase().includes(cashSalesFilterSignedBy.toLowerCase())) return false;
      }
      return true;
    });

  // Use all records if not filtered
  const recordsToShow = isFiltered ? filteredCashRecords : allCashRecords;
  const totalToShow = recordsToShow.length;
  const startIdx = (cashRecordsPage - 1) * cashRecordsPerPage;
  const endIdx = Math.min(cashRecordsPage * cashRecordsPerPage, totalToShow);
  const paginatedRecords = recordsToShow.slice(startIdx, endIdx);

    // Render filtered and paginated records
    const recordRows = paginatedRecords.map((product, index) => (
      <div 
        className="item-info" 
        key={product.id || index}
        onClick={() => {
          setSelectedCashSale(product);
          setShowCashSalesModal(true);
        }}
        style={{ cursor: 'pointer' }}
      >
        <p className="item">{formatDate(product.dateSold)}</p>
        <p className="item" title={product.name}>{product.name}</p>
        <p className="item">
          <span style={{
            padding: '0.2rem 0.5rem',
            borderRadius: '4px',
            fontSize: '0.8rem',
            fontWeight: 'bold',
            backgroundColor: product.paymentMode === 'Credit' ? '#d4edda' : 
                           product.paymentMode === 'Mobile Transfer' ? '#cce5ff' : '#f8f9fa',
            color: product.paymentMode === 'Credit' ? '#155724' : 
                   product.paymentMode === 'Mobile Transfer' ? '#004085' : '#495057'
          }}>
            {product.paymentMode}
          </span>
        </p>
        <p className="cost-price">{formatCurrency(product.costPrice)}</p>
        <p className="selling-price">{formatCurrency(product.sellingPrice)}</p>
        <p className="quantity-available">{product.quantitySold}</p>
        <p className="sub-total">{formatCurrency((product.sellingPrice || 0) * (product.quantitySold || 0))}</p>
        <p className="item" title={getSignedByTooltip(product)}>{getSignedByDisplay(product)}</p>
      </div>
    ));

    // Summary section
    return (
      <>
        {recordRows}
        {/* Summary Section */}
        <div style={{ 
          gridColumn: '1 / -1', 
          borderTop: '2px solid #007bff', 
          padding: '1rem', 
          marginTop: '1rem',
          backgroundColor: '#f8f9fa',
          display: 'flex',
          justifyContent: 'space-between',
          fontWeight: 'bold'
        }}>
          <span>
            Showing {totalToShow === 0 ? 0 : (startIdx + 1)}-{endIdx} of {totalToShow} transactions
          </span>
          <span>Total Amount: {formatCurrency(recordsToShow.reduce((sum, record) => sum + ((record.sellingPrice || 0) * (record.quantitySold || 0)), 0))}</span>
        </div>
      </>
    );
  }
  // Helper: normalize attachment objects from various shapes the backend may return
  // Cash sales sheet filter states
  const [cashSalesFilterDate, setCashSalesFilterDate] = useState('');
  const [cashSalesFilterItem, setCashSalesFilterItem] = useState('');
  const [cashSalesFilterSignedBy, setCashSalesFilterSignedBy] = useState('');
  const normalizeAttachment = (a) => {
    if (!a) return null;
    const id = a._id || a.id || (a.fileName && null);
    const filePathRaw = a.filePath || a.fileUrl || a.url || '';
    // normalize Windows backslashes to forward slashes and ensure leading '/'
    let normalizedPath = null;
    try {
      if (filePathRaw && typeof filePathRaw === 'string') {
        normalizedPath = filePathRaw.replace(/\\\\/g, '/').replace(/\\/g, '/');
        if (!normalizedPath.startsWith('/')) normalizedPath = '/' + normalizedPath;
      }
    } catch (e) {
      normalizedPath = null;
    }

  const backendBase = API_BASE_URL || ((typeof window !== 'undefined' && window.location) ? `${window.location.protocol}//${window.location.hostname}:5000` : '');

    // If server provided a relative static file URL (fileUrl), build an absolute URL for preview
    let absoluteStaticUrl = null;
    if (a.fileUrl && typeof a.fileUrl === 'string') {
      if (/^https?:\/\//i.test(a.fileUrl)) {
        absoluteStaticUrl = a.fileUrl;
      } else if (a.fileUrl.startsWith('/') && backendBase) {
        absoluteStaticUrl = backendBase + a.fileUrl;
      } else {
        absoluteStaticUrl = a.fileUrl;
      }
    } else if (normalizedPath) {
      absoluteStaticUrl = backendBase ? backendBase + normalizedPath : normalizedPath;
    }

    const downloadUrl = a.downloadUrl || (id ? attachmentAPI.getUrl(id) : null);

    const originalName = a.originalName || a.originalname || a.name || a.fileName || (absoluteStaticUrl ? absoluteStaticUrl.split('/').pop() : (id ? `attachment-${id}` : 'attachment'));

    return {
      _id: id,
      originalName,
      mimeType: a.mimeType || a.mimetype || a.type || '',
      size: a.fileSize || a.size || 0,
      // API download endpoint (authenticated)
      downloadUrl,
      // For immediate preview/download via static serving, expose an absolute static URL when available
      url: absoluteStaticUrl || downloadUrl,
      filePath: a.filePath || a.filePath === '' ? a.filePath : undefined,
      raw: a
    };
  };
  const [viewMode, setViewMode] = useState('transaction');
  const expenses = props.expenses || [];
  const drinks = props.drinks || [];
  const creditRecords = props.creditRecords || [];
  const setCreditRecords = props.setCreditRecords;
  const paidCreditRecords = props.paidCreditRecords || [];
  const setPaidCreditRecords = props.setPaidCreditRecords;
  const inventory = props.inventory || {};
  const setInventory = props.setInventory;
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  
  // Dynamic categories state (derived from stock documents; no dedicated categories endpoint)
  const [itemCategories, setItemCategories] = useState([]);
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [staffMap, setStaffMap] = useState(null);
  // Backend stocks for item select
  const [stockOptions, setStockOptions] = useState([]);
  const [stockError, setStockError] = useState('');

  // Pagination states
  const [cashRecordsPage, setCashRecordsPage] = useState(1);
  const [cashRecordsPerPage] = useState(6); // Items per page
  const [totalCashRecords, setTotalCashRecords] = useState(0);
  const [allCashRecords, setAllCashRecords] = useState([]); // Store all records for pagination
  const [creditRecordsPage, setCreditRecordsPage] = useState(1);
  const [creditRecordsPerPage] = useState(6); // Items per page for credit records
  const [totalCreditRecords, setTotalCreditRecords] = useState(0);
  const [allCreditRecords, setAllCreditRecords] = useState([]); // Store all credit records for pagination
  const [expenseRecordsPage, setExpenseRecordsPage] = useState(1);
  const [attachmentsPage, setAttachmentsPage] = useState(1);

  // Load categories and recent expenses on component mount
  useEffect(() => {
    const loadData = async () => {
      setCategoriesLoading(true);
      try {
        // No dedicated categories endpoint; categories can be derived from stock documents when needed

  // Load expense categories from expensecategories collection
        let expenseCatsResponse = null;
        try {
          expenseCatsResponse = await expenseCategoryAPI.getAll();
          console.log('🏷️ Expense categories response:', expenseCatsResponse);
          
          if (expenseCatsResponse.success && expenseCatsResponse.data?.categories) {
            setExpenseCategories(expenseCatsResponse.data.categories);
            console.log('✅ Loaded expense categories:', expenseCatsResponse.data.categories);
          } else {
            console.warn('⚠️ No expense categories found or invalid response format');
            setExpenseCategories([]);
          }
        } catch (e) {
          console.error('❌ Could not load expense categories:', e?.message || e);
          setExpenseCategories([]);
        }

        // Load recent expenses list
        try {
          const expensesResponse = await expenseAPI.getAll({ limit: 100 });
          // Load staff list to resolve signatories
          try {
            const staffResp = await staffAPI.getAll();
            if (staffResp && staffResp.success && Array.isArray(staffResp.data?.staff)) {
              const map = {};
              staffResp.data.staff.forEach(s => { map[String(s._id)] = s.name || s.fullName || s.email || s.username || String(s._id); });
              setStaffMap(map);
            }
          } catch (e) {
            console.warn('Could not load staff list for signatory mapping:', e?.message || e);
          }
          if (expensesResponse.success) {
            // Use local copy of fetched expense categories (may contain { expenseId, name })
            const localExpenseCats = (expenseCatsResponse && expenseCatsResponse.data && expenseCatsResponse.data.categories) ? expenseCatsResponse.data.categories : (expenseCategories || []);

            // Fetch persisted attachments for each expense (parallel requests) and merge them
            let expenseAttachments = [];
            try {
              const expensesList = expensesResponse.data.expenses || [];
              const attachmentPromises = expensesList.map(exp =>
                attachmentAPI.getByEntity('expense', exp._id).catch(err => {
                  console.warn('Expense attachment fetch failed for', exp._id, err?.message || err);
                  return null;
                })
              );

              const attachmentsResults = await Promise.all(attachmentPromises);
              attachmentsResults.forEach(res => {
                if (res && res.success && res.data && Array.isArray(res.data.attachments)) {
                  expenseAttachments.push(...res.data.attachments);
                }
              });

              // As a fallback, also include any global expense attachments listing
              try {
                const atResp = await attachmentAPI.getAll({ entityType: 'expense', limit: 1000 });
                if (atResp && atResp.success && atResp.data && Array.isArray(atResp.data.attachments)) {
                  // Include any attachments that may not be returned by per-entity calls (e.g., missing entityId)
                  expenseAttachments.push(...atResp.data.attachments);
                }
              } catch (e) {
                // ignore fallback errors
              }
            } catch (e) {
              console.warn('Could not load expense attachments:', e?.message || e);
            }

            // Map attachments by entityId for quick lookup
            const attachmentsByEntity = {};
            // Also map by transactionId as a fallback for uploads done before entityId was set
            const attachmentsByTransaction = {};
            expenseAttachments.forEach(att => {
              const key = att.entityId ? String(att.entityId) : null;
              if (!key) return;
              if (!attachmentsByEntity[key]) attachmentsByEntity[key] = [];
              attachmentsByEntity[key].push(att);
              // map by transactionId if present
              if (att.transactionId) {
                const tKey = String(att.transactionId);
                if (!attachmentsByTransaction[tKey]) attachmentsByTransaction[tKey] = [];
                attachmentsByTransaction[tKey].push(att);
              }
            });

            const transformedExpenses = (expensesResponse.data.expenses || []).map(expense => {
              // Resolve category name from expense categories when category stores expenseId or object
              const categoryRaw = expense.category;
              // Support category being an object ({ _id, name }) or a plain id/string
              const categoryId = categoryRaw && typeof categoryRaw === 'object' ? (categoryRaw._id || categoryRaw.id) : categoryRaw;
              const categoryNameFromObj = categoryRaw && typeof categoryRaw === 'object' ? (categoryRaw.name || categoryRaw.title || null) : null;
              const matched = localExpenseCats.find(c =>
                c._id === categoryId || c.id === categoryId || c.expenseId === categoryId || c.name === categoryId || c.name === categoryNameFromObj
              );
              const categoryName = categoryNameFromObj || (matched ? matched.name : (typeof categoryRaw === 'string' ? categoryRaw : 'Unknown'));

              const attList = attachmentsByEntity[String(expense._id)] || attachmentsByTransaction[String(expense.transactionId)] || [];
              const firstAtt = attList.length > 0 ? attList[0] : null;

              return {
                id: expense._id,
                dateSold: expense.expenseDate,
                name: categoryName,
                sellingPrice: expense.amount,
                customer: expense.description,
                transactionId: expense.transactionId,
                // Resolve signatory (prefer populated user, else lookup by id using staff map)
                signatory: (expense.recordedBy && typeof expense.recordedBy === 'object') ? (expense.recordedBy.username || expense.recordedBy.email || expense.recordedBy._id) : (staffMap && staffMap[String(expense.recordedBy)]) || null,
                attachment: firstAtt ? {
                    _id: firstAtt._id,
                    name: firstAtt.originalName || firstAtt.originalname || firstAtt.fileName || (firstAtt.filePath ? firstAtt.filePath.split('/').pop() : 'attachment'),
                    type: firstAtt.mimeType || firstAtt.mimetype || firstAtt.mime || firstAtt.type || 'application/octet-stream',
                    size: firstAtt.fileSize || firstAtt.size || firstAtt.fileSizeFormatted || 0,
                    // include other metadata for preview/download
                    entityId: firstAtt.entityId || firstAtt.entityId,
                    transactionId: firstAtt.transactionId || firstAtt.transactionId,
                    url: (function(){
                      const raw = firstAtt.fileUrl || firstAtt.url || null;
                      try {
                        if (raw && typeof raw === 'string' && raw.startsWith('/')) {
                          const backendBase = (typeof window !== 'undefined' && window.location) ? `${window.location.protocol}//${window.location.hostname}:5000` : '';
                          return backendBase ? backendBase + raw : raw;
                        }
                      } catch(e) {}
                      return raw || (firstAtt._id ? attachmentAPI.getUrl(firstAtt._id) : null);
                    })()
                } : null
              };
            });

            setExpenseRecords(transformedExpenses);
          }
        } catch (e) {
          console.warn('Could not load expenses list:', e?.message || e);
        }

      } catch (error) {
    // Load cash sales and credit sales when component mounts so attachments are available
    (async () => {
      try {
        await loadCashSales();
      } catch (e) { /* ignore */ }
      try {
        // loadCreditSales is defined later in the file but hoisted; safe to call
        await loadCreditSales();
      } catch (e) { /* ignore */ }
    })();
        console.error('Error loading data:', error);
      } finally {
        setCategoriesLoading(false);
      }
    };

    loadData();
  }, []);

  // Delete attachment handler
  async function handleDeleteAttachment(attachment) {
    if (!attachment || !(attachment._id || attachment.id)) return;
    if (!window.confirm('Delete this attachment? This cannot be undone.')) return;
    try {
      const id = attachment._id || attachment.id;
      const resp = await attachmentAPI.delete(id);
      if (!resp || !resp.success) throw new Error(resp?.message || 'Delete failed');

      // Remove from expenseRecords
      setExpenseRecords(prev => prev.map(rec => {
        if (rec.attachment && (rec.attachment._id === id || rec.attachment.id === id || rec.transactionId === attachment.transactionId)) {
          return { ...rec, attachment: null };
        }
        return rec;
      }));

      // Remove from cashRecords (attachments array or legacy attachment)
      setCashRecords(prev => prev.map(rec => {
        if (rec.attachments && rec.attachments.length) {
          const filtered = rec.attachments.filter(att => !(att._id === id || att.id === id));
          return { ...rec, attachments: filtered, attachment: filtered.length ? filtered[0] : null };
        }
        if (rec.attachment && (rec.attachment._id === id || rec.attachment.id === id)) {
          return { ...rec, attachment: null };
        }
        return rec;
      }));

      // Remove from credit records (use writeCreditRecords to support parent or local state)
      writeCreditRecords(prev => {
        if (!Array.isArray(prev)) return prev;
        return prev.map(rec => {
          if (rec.attachments && rec.attachments.length) {
            const filtered = rec.attachments.filter(att => !(att._id === id || att.id === id));
            return { ...rec, attachments: filtered, attachment: filtered.length ? filtered[0] : null };
          }
          if (rec.attachment && (rec.attachment._id === id || rec.attachment.id === id)) {
            return { ...rec, attachment: null };
          }
          return rec;
        });
      });

  setPopupMessage('Attachment deleted');
  setShowPopup(true);
  setTimeout(() => { setShowPopup(false); setPopupMessage(''); }, 2000);
    } catch (err) {
      console.error('Failed to delete attachment:', err);
      alert('Failed to delete attachment: ' + (err.message || err));
    }
  }

  // Fetch stocks from backend (for item select)
  useEffect(() => {
    async function fetchStocks() {
      try {
        console.log('[POS DEBUG] Using stockAPI.getAll() method');
        setStockError('');
        
        // Use the stockAPI method instead of direct fetch
        const data = await stockAPI.getAll();
        console.log('[POS DEBUG] Stock data received:', data);
        
        setStockOptions((data && data.data && data.data.items) ? data.data.items : []);
      } catch (err) {
        console.error('[POS DEBUG] Stock fetch error:', err);
        setStockOptions([]);
        setStockError(err.message || 'Error loading stocks');
      }
    }
    fetchStocks();
  }, []);
  
  // Function to load cash sales from database
  const loadCashSales = async () => {
    try {
      console.log('📋 Loading cash sales from database...');
      
      // Get all sales and filter locally since URLSearchParams doesn't handle arrays well
      console.log('🔍 Fetching all sales to filter locally...');
      const response = await salesAPI.getAll({ limit: 1000 }); // Get a large number to ensure we get all
      console.log('📊 All sales response:', response);
      
      if (response.success) {
        let allSales = response.data.sales || [];
        console.log(`📦 Total sales from API: ${allSales.length}`);
        
        // Filter for Cash and Mobile Transfer sales
        const cashSales = allSales.filter(sale => 
          sale.paymentMode === 'Cash' || sale.paymentMode === 'Mobile Transfer'
        );
        console.log(`💰 Cash/Mobile Transfer sales: ${cashSales.length}`);
        
        const transformedSales = cashSales.map(sale => ({
          id: sale._id,
          dateSold: new Date(sale.dateSold).toLocaleDateString(),
          name: sale.itemName,
          paymentMode: sale.paymentMode,
          costPrice: sale.costPrice || 0,
          sellingPrice: sale.sellingPrice,
          quantitySold: sale.quantitySold,
          totalAmount: sale.totalAmount,
          customer: sale.customer,
          transactionId: sale.transactionId,
          cashier: sale.cashier?.username || 'Unknown'
        })).sort((a, b) => new Date(b.dateSold) - new Date(a.dateSold)); // Sort by date descending
        
        // Store all records and set total count
        setAllCashRecords(transformedSales);
        setTotalCashRecords(transformedSales.length);
        
        // Reset to page 1 when loading new data
        const currentPage = 1;
        setCashRecordsPage(currentPage);
        
        // Apply pagination
        const startIndex = (currentPage - 1) * cashRecordsPerPage;
        const endIndex = startIndex + cashRecordsPerPage;
        const paginatedRecords = transformedSales.slice(startIndex, endIndex);
        
        setCashRecords(paginatedRecords);
        console.log(`✅ Loaded ${paginatedRecords.length} cash sales for page ${currentPage} (${transformedSales.length} total)`);
      } else {
        console.warn('Failed to load cash sales:', response.message);
      }
    } catch (error) {
      console.error('Error loading cash sales:', error);
    }
  };

  // Function to handle pagination for cash sales
  const paginateCashSales = (pageNumber) => {
    setCashRecordsPage(pageNumber);
    
    // Apply pagination to existing data
    const startIndex = (pageNumber - 1) * cashRecordsPerPage;
    const endIndex = startIndex + cashRecordsPerPage;
    const paginatedRecords = allCashRecords.slice(startIndex, endIndex);
    
    setCashRecords(paginatedRecords);
    console.log(`📄 Showing page ${pageNumber}: ${paginatedRecords.length} records`);
  };

  // Function to handle pagination for credit sales
  const paginateCreditSales = (pageNumber) => {
    setCreditRecordsPage(pageNumber);
    
    // Apply pagination to existing data
    const startIndex = (pageNumber - 1) * creditRecordsPerPage;
    const endIndex = startIndex + creditRecordsPerPage;
    const paginatedRecords = allCreditRecords.slice(startIndex, endIndex);
    
  writeCreditRecords(paginatedRecords);
    console.log(`📄 Showing credit page ${pageNumber}: ${paginatedRecords.length} records`);
  };

  // Function to load credit sales from database
  const loadCreditSales = async () => {
    try {
      console.log('📋 Loading credit sales from database...');
      // If the AuthContext prefetched credit sales after login, use them first for immediate UI
      let response = null;
      try {
        const cached = localStorage.getItem('prefetchedCreditSales');
        if (cached) {
          const parsed = JSON.parse(cached);
          response = { success: true, data: { creditSales: parsed } };
          // Remove cache after use so subsequent page loads get fresh data
          localStorage.removeItem('prefetchedCreditSales');
          console.log('Using prefetched credit sales from localStorage');
        }
      } catch (e) {
        response = null;
      }

      if (!response) {
        response = await creditSalesAPI.getAll({ limit: 1000 });
      }
      console.log('📊 Credit sales response:', response);
      
      if (response.success) {
        const creditSales = response.data.creditSales || [];
        console.log(`💳 Total credit sales from API: ${creditSales.length}`);
        
        const transformedCreditSales = creditSales.map(sale => ({
          id: sale._id,
          dateSold: new Date(sale.dateSold).toLocaleDateString(),
          name: sale.itemName,
          paymentMode: 'Credit',
          costPrice: sale.costPrice || 0,
          sellingPrice: sale.sellingPrice,
          quantitySold: sale.quantitySold,
          totalAmount: sale.totalAmount,
          customerName: sale.customerName,
          customerContact: sale.customerContact,
          isPaid: sale.isPaid,
          datePaid: sale.datePaid ? new Date(sale.datePaid).toLocaleDateString() : null,
          paymentMethod: sale.paymentMethod,
          cashier: sale.soldBy?.firstName + ' ' + sale.soldBy?.lastName || 'Unknown',
          // Map attachments (new format) and normalize legacy single attachment (old format)
          attachments: Array.isArray(sale.attachments) ? sale.attachments.map(att => normalizeAttachment(att)) : (sale.attachment ? [ normalizeAttachment(sale.attachment) ] : [] )
        })).sort((a, b) => new Date(b.dateSold) - new Date(a.dateSold));

        // If the server didn't include attachments for some credit sales (defensive),
        // fetch attachments per-sale so the UI can show them after reload.
        const salesNeedingAttachments = transformedCreditSales.filter(s => !s.attachments || s.attachments.length === 0);
        if (salesNeedingAttachments.length > 0) {
          try {
            await Promise.all(salesNeedingAttachments.map(async (s) => {
              try {
                const resp = await attachmentAPI.getByEntity('sales', s.id);
                if (resp && resp.success && resp.data && Array.isArray(resp.data.attachments) && resp.data.attachments.length > 0) {
                  s.attachments = resp.data.attachments.map(a => normalizeAttachment(a));
                } else {
                  s.attachments = s.attachments || [];
                }
              } catch (e) {
                s.attachments = s.attachments || [];
              }
            }));
          } catch (e) {
            // ignore and proceed; we still have transformedCreditSales available
          }
        }
        
        // Update both unpaid and paid credit records based on isPaid status
        const unpaidCredits = transformedCreditSales.filter(sale => !sale.isPaid);
        const paidCredits = transformedCreditSales.filter(sale => sale.isPaid);
        
        // Store all records and set total count for pagination
        setAllCreditRecords(unpaidCredits);
        setTotalCreditRecords(unpaidCredits.length);
        
        // Reset to page 1 when loading new data
        const currentPage = 1;
        setCreditRecordsPage(currentPage);
        
        // Apply pagination
        const startIndex = (currentPage - 1) * creditRecordsPerPage;
        const endIndex = startIndex + creditRecordsPerPage;
        const paginatedRecords = unpaidCredits.slice(startIndex, endIndex);
        
  writeCreditRecords(paginatedRecords);
        
        if (setPaidCreditRecords) {
          setPaidCreditRecords(paidCredits);
        }
        
        console.log(`📦 Unpaid credit sales: ${unpaidCredits.length}, Paid: ${paidCredits.length}`);
      } else {
        console.warn('⚠️ Failed to load credit sales:', response.message);
      }
    } catch (error) {
      console.error('❌ Error loading credit sales:', error);
    }
  };

  // Update pagination when cashRecordsPage changes
  useEffect(() => {
    if (allCashRecords.length > 0) {
      paginateCashSales(cashRecordsPage);
    }
  }, [cashRecordsPage, allCashRecords, cashRecordsPerPage]);

  // Update pagination when creditRecordsPage changes
  useEffect(() => {
    if (allCreditRecords.length > 0) {
      paginateCreditSales(creditRecordsPage);
    }
  }, [creditRecordsPage, allCreditRecords, creditRecordsPerPage]);

  // Load cash sales when viewing cash records
  useEffect(() => {
    if (viewMode === 'cash-records') {
      loadCashSales();
    }
  }, [viewMode]);

  // Load credit sales when viewing credit records or paid credit records
  useEffect(() => {
    if (viewMode === 'credit-records' || viewMode === 'paid-credit-records') {
      loadCreditSales();
    }
  }, [viewMode]);
  
  const itemsPerPage = 5;
  
  // Pagination helper functions
  const paginate = (items, currentPage) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return items.slice(startIndex, startIndex + itemsPerPage);
  };
  
  const getTotalPages = (items) => Math.ceil(items.length / itemsPerPage);

  // Helper to format a person object or string into a displayable name
  function formatPerson(person) {
    if (!person) return null;
    if (typeof person === 'string') return person;
    if (typeof person === 'number') return String(person);
    // Common shape: { username }
    if (person.username) return String(person.username);
    // Common shape: { firstName, lastName }
    const first = person.firstName || person.first || '';
    const last = person.lastName || person.last || '';
    const full = (first + ' ' + last).trim();
    if (full) return full;
    // Other possible fields
    if (person.displayName) return String(person.displayName);
    if (person.name) return String(person.name);
    // Fallback to commonly available identifiers
    if (person.email) return String(person.email);
    if (person.id) return String(person.id);
    if (person._id) return String(person._id);
    return null;
  }

  function getSignedByDisplay(record) {
    // Prefer formatted person for cashier/soldBy/customer; never return a raw object
    return formatPerson(record.cashier) || formatPerson(record.soldBy) || formatPerson(record.customer) ||
      // As a last resort, try primitive fields
      (record && (typeof record.cashier === 'string' ? record.cashier : null)) ||
      (record && (typeof record.soldBy === 'string' ? record.soldBy : null)) ||
      (record && (typeof record.customer === 'string' ? record.customer : null)) ||
      'Walk-in';
  }

  function getSignedByTooltip(record) {
    const cust = record && record.customer;
    let name = '';
    let phone = '';
    if (cust) {
      if (typeof cust === 'string') {
        name = cust;
      } else if (typeof cust === 'object') {
        name = cust.name || cust.fullName || cust.displayName || cust.email || cust.username || cust.id || cust._id || '';
        phone = cust.phone || cust.mobile || cust.customerMobile || cust.customerPhone || '';
      }
    }
    // standalone phone fields may exist on the record
    phone = phone || record.customerMobile || record.customerPhone || '';
    if (name && phone) return `${name} • ${phone}`;
    if (name) return name;
    if (phone) return phone;
    return 'No customer info';
  }

  // Resolve expense category name from category value (id/object/string)
  function resolveExpenseCategoryName(categoryVal) {
    if (!categoryVal) return 'Unknown';
    if (typeof categoryVal === 'object') return categoryVal.name || categoryVal.title || String(categoryVal._id || categoryVal.id || 'Unknown');
    // Try expenseCategories lookup by expenseId or name
    const byId = expenseCategories.find(c => c.expenseId === categoryVal || String(c._id) === String(categoryVal) || c.name === categoryVal);
    if (byId) return byId.name;
    return String(categoryVal);
  }
  
  // Format ISO/date-like strings to MM/DD/YYYY (avoid timezone shifts by preferring the YYYY-MM-DD prefix when present)
  function formatDate(d) {
    if (!d && d !== 0) return '—';
    // If it's a Date object
    if (d instanceof Date && !isNaN(d)) {
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const yyyy = d.getFullYear();
      return `${mm}/${dd}/${yyyy}`;
    }
    // If it's a string like 2025-10-20T00:00:00.000Z or 2025-10-20
    if (typeof d === 'string') {
      const m = d.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (m) return `${m[2]}/${m[3]}/${m[1]}`;
      // Fallback to Date parsing for strings like '10/20/2025' or other formats
      const parsed = new Date(d);
      if (!isNaN(parsed)) {
        const mm = String(parsed.getMonth() + 1).padStart(2, '0');
        const dd = String(parsed.getDate()).padStart(2, '0');
        const yyyy = parsed.getFullYear();
        return `${mm}/${dd}/${yyyy}`;
      }
      return d;
    }
    // Fallback: coerce to string
    try {
      const parsed = new Date(d);
      if (!isNaN(parsed)) {
        const mm = String(parsed.getMonth() + 1).padStart(2, '0');
        const dd = String(parsed.getDate()).padStart(2, '0');
        const yyyy = parsed.getFullYear();
        return `${mm}/${dd}/${yyyy}`;
      }
    } catch (e) {}
    return String(d);
  }
  
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

  // Separate state for cash records only (credit now managed by App)
  const [cashRecords, setCashRecords] = useState([]);
  // Local fallback for credit records when parent doesn't provide props.setCreditRecords
  const [localCreditRecords, setLocalCreditRecords] = useState([]);
  // Add state for expense records
  const [expenseRecords, setExpenseRecords] = useState([]);

  // Use props.creditRecords when provided; otherwise use local state
  const displayedCreditRecords = props.creditRecords && Array.isArray(props.creditRecords) ? props.creditRecords : localCreditRecords;
  // Safe writer for credit records (supports passing array or updater function)
  function writeCreditRecords(payload) {
    if (typeof setCreditRecords === 'function') {
      if (typeof payload === 'function') return setCreditRecords(payload);
      return setCreditRecords(payload);
    }
    if (typeof payload === 'function') return setLocalCreditRecords(prev => payload(prev || []));
    return setLocalCreditRecords(payload);
  }

  // Sales transaction state
  const [itemName, setItemName] = useState("");
  const [itemPaymentMode, setItemPaymentMode] = useState("");
  const [itemDateSold, setItemDateSold] = useState("");
  const [itemSellingPrice, setItemSellingPrice] = useState("");
  const [itemQuantitySold, setItemQuantitySold] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerContact, setCustomerContact] = useState("");
  const [proofOfPayment, setProofOfPayment] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  // Refs for autofocus on validation
  const paymentModeRef = useRef(null);
  const itemNameRef = useRef(null);
  const dateRef = useRef(null);
  const sellingPriceRef = useRef(null);
  const quantityRef = useRef(null);
  const customerNameRef = useRef(null);
  const customerContactRef = useRef(null);

  // Expense transaction state (separate from sales)
  const [expenseCategory, setExpenseCategory] = useState("");
  const [expenseDate, setExpenseDate] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseDescription, setExpenseDescription] = useState("");
  const [expenseFile, setExpenseFile] = useState(null);
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);
  const [currentAttachment, setCurrentAttachment] = useState(null);
  // Modal preview object URL (created from authenticated fetch) to ensure <img> doesn't hit dev server
  const [modalPreviewUrl, setModalPreviewUrl] = useState(null);
  const [modalPreviewRevoke, setModalPreviewRevoke] = useState(null);

  
  // Calculate transaction total
  function getTransactionTotal() {
    if (viewMode === 'new-expense') {
      // For expenses, just return the amount
      return Number(expenseAmount) || 0;
    } else {
      // For sales, multiply price × quantity
      const price = Number(itemSellingPrice) || 0;
      const quantity = Number(itemQuantitySold) || 0;
      return price * quantity;
    }
  }

  // Compute availableQuantity and overstock flag from selected item
  const selectedStock = stockOptions.find(s => s.itemName === itemName || s.itemId === itemName || s._id === itemName);
  const selectedInventoryKey = Object.keys(inventory).find(key => inventory[key].itemName === itemName);
  const availableQuantity = (selectedStock && typeof selectedStock.currentStock === 'number')
    ? selectedStock.currentStock
    : (selectedInventoryKey && inventory[selectedInventoryKey] && typeof inventory[selectedInventoryKey].currentStock === 'number')
      ? inventory[selectedInventoryKey].currentStock
      : 0;
  const requestedQuantity = Number(itemQuantitySold) || 0;
  const isOverstock = requestedQuantity > availableQuantity;

  // Validation functions
  function isValidSalesTransaction() {
    // Basic field validation
    const basicValidation = itemPaymentMode && 
                           itemName && 
                           itemDateSold && 
                           itemSellingPrice && 
                           itemQuantitySold &&
                           (itemPaymentMode !== "Credit" || (customerName && customerContact));
    
    if (!basicValidation) return false;
    
    // Stock validation - prefer backend stocks (stockOptions) then fallback to inventory
    if (itemName && itemQuantitySold) {
      const foundStock = stockOptions.find(s => s.itemName === itemName || s.itemId === itemName || s._id === itemName);
      if (foundStock) {
        const availableQuantity = typeof foundStock.currentStock === 'number' ? foundStock.currentStock : 0;
        const requestedQuantity = Number(itemQuantitySold);
        return availableQuantity >= requestedQuantity;
      }

      if (inventory) {
        const inventoryKey = Object.keys(inventory).find(key => inventory[key].itemName === itemName);
        if (inventoryKey && inventory[inventoryKey]) {
          const availableQuantity = typeof inventory[inventoryKey].currentStock === 'number'
            ? inventory[inventoryKey].currentStock
            : 0;
          const requestedQuantity = Number(itemQuantitySold);
          return availableQuantity >= requestedQuantity;
        }
      }

      // If item not found in either, disallow
      return false;
    }
    
    return true;
  }

  function getValidationMessage() {
    // Check basic fields first
    if (!itemPaymentMode) return 'Please select a payment mode';
    if (!itemName) return 'Please select an item';
    if (!itemDateSold) return 'Please select a date';
    if (!itemSellingPrice) return 'Please enter selling price';
    if (!itemQuantitySold) return 'Please enter quantity';
    if (itemPaymentMode === "Credit" && !customerName) return 'Please enter customer name';
    if (itemPaymentMode === "Credit" && !customerContact) return 'Please enter customer contact';
    
    // Check stock availability (prefer backend stocks first)
    if (itemName && itemQuantitySold) {
      const foundStock = stockOptions.find(s => s.itemName === itemName || s.itemId === itemName || s._id === itemName);
      if (foundStock) {
        const availableQuantity = typeof foundStock.currentStock === 'number' ? foundStock.currentStock : 0;
        const requestedQuantity = Number(itemQuantitySold);
        if (requestedQuantity > availableQuantity) {
          return `Insufficient stock! Available: ${availableQuantity}, Requested: ${requestedQuantity}`;
        }
      } else {
        // fallback to inventory
        if (inventory) {
          const inventoryKey = Object.keys(inventory).find(key => inventory[key].itemName === itemName);
          if (!inventoryKey) return 'Item not found in inventory';
          const availableQuantity = typeof inventory[inventoryKey].currentStock === 'number'
            ? inventory[inventoryKey].currentStock
            : 0;
          const requestedQuantity = Number(itemQuantitySold);
          if (requestedQuantity > availableQuantity) {
            return `Insufficient stock! Available: ${availableQuantity}, Requested: ${requestedQuantity}`;
          }
        } else {
          return 'Item not found in inventory';
        }
      }
    }
    
    return 'Save this transaction';
  }

  // Focus the first invalid field in the order of logical importance
  function focusFirstInvalid() {
    // 1. payment mode
    if (!itemPaymentMode && paymentModeRef?.current) { paymentModeRef.current.focus(); return; }
    // 2. item
    if (!itemName && itemNameRef?.current) { itemNameRef.current.focus(); return; }
    // 3. date
    if (!itemDateSold && dateRef?.current) { dateRef.current.focus(); return; }
    // 4. selling price
    if (!itemSellingPrice && sellingPriceRef?.current) { sellingPriceRef.current.focus(); return; }
    // 5. quantity
    if (!itemQuantitySold && quantityRef?.current) { quantityRef.current.focus(); return; }
    // 6. customer info when credit
    if (itemPaymentMode === 'Credit' && !customerName && customerNameRef?.current) { customerNameRef.current.focus(); return; }
    if (itemPaymentMode === 'Credit' && !customerContact && customerContactRef?.current) { customerContactRef.current.focus(); return; }

    // 7. stock/item not found or insufficient: focus item select
    const foundStock = stockOptions.find(s => s.itemName === itemName || s.itemId === itemName || s._id === itemName);
    if (!foundStock && itemNameRef?.current) { itemNameRef.current.focus(); return; }

    // 8. last resort - focus the first available input
    if (paymentModeRef?.current) { paymentModeRef.current.focus(); }
  }

  function isValidExpense() {
    return expenseCategory && 
           expenseDate && 
           expenseAmount &&
           (expenseCategory !== "Other" || expenseDescription);
  }

  async function handleItemNewEntry () {
    // If in new-expense mode, create expense via API
    if (viewMode === 'new-expense') {
      try {
        let finalCategory, finalDescription;
        
        if (expenseCategory === "Other") {
          // For "Other", use expenseDescription as both category and description
          finalCategory = expenseDescription || "Other";
          finalDescription = expenseDescription || "Other expense";
        } else {
          // For predefined categories, use category as name and expenseDescription as description (with fallback)
          finalCategory = expenseCategory;
          finalDescription = expenseDescription || expenseCategory; // Fallback to category name if no description provided
        }
        
        // Create expense via API
        const expenseData = {
          category: finalCategory,
          description: finalDescription,
          amount: Number(expenseAmount),
          expenseDate: expenseDate,
          paymentMethod: 'Cash', // Default to cash for now
          department: 'General' // Default department
        };

        console.log('🔄 Creating expense:', expenseData);
        const response = await expenseAPI.create(expenseData);
        
        if (response.success) {
          console.log('✅ Expense created successfully:', response.data.expense);
          
          // Add to local state for immediate display (formatted to match existing structure)
          const newExpense = {
            id: response.data.expense._id,
            dateSold: expenseDate,
            name: finalCategory,
            sellingPrice: expenseAmount,
            customer: finalDescription,
            attachment: expenseFile ? {
              // placeholder until upload completes
              name: expenseFile.name,
              size: expenseFile.size,
              type: expenseFile.type,
              _pending: true
            } : null,
            transactionId: response.data.expense.transactionId
          };
          
          setExpenseRecords(i => [...i, newExpense]);
          
          // Clear form
          setExpenseCategory("");
          setExpenseDate("");
          setExpenseAmount("");
          setExpenseDescription("");
          setExpenseFile(null);
          
          alert('Expense recorded successfully!');
          
          // If there is a file selected, upload it to attachments API and link to this expense
          if (expenseFile) {
            try {
              const uploadResp = await attachmentAPI.upload('expense', response.data.expense._id, [expenseFile], 'Expense receipt');
              if (uploadResp && uploadResp.success && uploadResp.data && Array.isArray(uploadResp.data.attachments)) {
                const savedAttachments = uploadResp.data.attachments;
                // Replace placeholder attachment in local state with saved metadata
                setExpenseRecords(prev => prev.map(rec => {
                  if (rec.transactionId === response.data.expense.transactionId || rec.id === response.data.expense._id) {
                    return { ...rec, attachment: savedAttachments[0] };
                  }
                  return rec;
                }));
              } else {
                console.warn('Attachment upload did not return expected shape', uploadResp);
              }
            } catch (uploadErr) {
              console.error('❌ Expense attachment upload failed:', uploadErr);
            }
          }
        } else {
          throw new Error(response.message || 'Failed to create expense');
        }
        
      } catch (error) {
        console.error('❌ Error creating expense:', error);
        alert(`Error recording expense: ${error.message}`);
      }
      return;
    }
    
    // Create the transaction record first
    const transactionId = Date.now().toString(); // Generate a unique ID for the transaction
    
  // Prefer cost price and canonical ids from backend stocks (stockOptions), fallback to inventory
  const selectedStock = stockOptions.find(s => s.itemName === itemName || s.itemId === itemName || s._id === itemName);
  const selectedInventoryItem = !selectedStock && Object.values(inventory).find(item => item.itemName === itemName);
  const costPrice = selectedStock ? (selectedStock.costPrice || 0) : (selectedInventoryItem ? (selectedInventoryItem.avgCostPrice || 0) : 0);
    
    const newItem = {
      transactionId,
      itemName,
      itemId: selectedStock ? selectedStock.itemId : (selectedInventoryItem ? selectedInventoryItem.itemId : undefined),
      stockId: selectedStock ? selectedStock._id : undefined,
      costPrice: costPrice,
      sellingPrice: Number(itemSellingPrice),
      quantitySold: Number(itemQuantitySold),
      paymentMode: itemPaymentMode === "Visa" ? "Cash" : itemPaymentMode,
      customer: customerName,
      customerMobile: customerContact,
      dateSold: itemDateSold,
      proofOfPayment,
      attachments: [] // Will be populated after file upload
    };

    try {
      // Prepare sale data
      const saleData = {
        itemName,
        // Prefer stock's canonical itemId when available
        itemId: selectedStock ? selectedStock.itemId : (selectedInventoryItem ? selectedInventoryItem.itemId : undefined),
        costPrice: costPrice,
        sellingPrice: Number(itemSellingPrice),
        quantitySold: Number(itemQuantitySold),
        totalAmount: Number(itemSellingPrice) * Number(itemQuantitySold),
        dateSold: itemDateSold,
        proofOfPayment
      };

      let response;
      let savedSale;

      if (itemPaymentMode === 'Credit') {
        // For credit sales, use credit sales API
        const creditSaleData = {
          ...saleData,
          customerName,
          customerContact,
          notes: ''
        };

        // Validate credit sale fields
        if (!customerName || !customerContact) {
          alert('Customer name and contact are required for credit sales');
          return;
        }

        console.log('[POS] Creating credit sale:', JSON.stringify(creditSaleData, null, 2));
        
        try {
          // Create credit sale first (server will persist the record)
          response = await creditSalesAPI.create(creditSaleData);
          
          // If there's a selected file, upload it via the attachments API so
          // an Attachment document is created and will show up in attachments UI.
          if (selectedFile && response && response.success && response.data) {
            try {
              const saleId = response.data._id || response.data.id || response.data._doc?._id || null;
              // Upload and attach to the saved credit sale record using entityType 'sales'
              const uploadResp = await attachmentAPI.upload('sales', saleId, [selectedFile], 'Credit sale proof');
              if (uploadResp && uploadResp.success && uploadResp.data && Array.isArray(uploadResp.data.attachments)) {
                // Attachments metadata saved - include on the savedSale object for immediate UI
                response.data.attachments = uploadResp.data.attachments;
              } else {
                console.warn('Attachment upload after credit sale did not return expected shape', uploadResp);
              }
            } catch (uploadErr) {
              console.error('[POS] Credit sale attachment upload failed:', uploadErr);
              // proceed without blocking the user - sale is already created
            }
          }
        } catch (apiError) {
          console.error('[POS] Credit sales API error:', apiError);
          alert('Credit sale save failed: ' + (apiError.message || apiError));
          return;
        }

        if (!response?.success) {
          console.error('[POS] Credit sale API response error:', response);
          alert('Credit sale save failed: ' + (response?.message || 'Unknown error'));
          return;
        }

        savedSale = response.data;

        // Add to UI immediately with placeholder attachment if a file was selected (mirror expense flow)
        const placeholderAttachment = selectedFile ? {
          name: selectedFile.name,
          size: selectedFile.size,
          type: selectedFile.type,
          _pending: true
        } : null;

        const newCreditItem = {
          ...newItem,
          _id: savedSale._id,
          customerName,
          customerContact,
          isPaid: false,
          transactionId: savedSale.transactionId,
          attachments: Array.isArray(savedSale.attachments) && savedSale.attachments.length > 0
            ? savedSale.attachments
            : (placeholderAttachment ? [placeholderAttachment] : [])
        };

        writeCreditRecords(prev => [...(prev || []), newCreditItem]);
        alert('Credit sale recorded successfully!');

        // If there is a file selected, upload it and replace the placeholder with saved metadata
        if (selectedFile) {
          try {
            const uploadResp = await attachmentAPI.upload('sales', savedSale._id, [selectedFile], 'Credit sale proof');
            if (uploadResp && uploadResp.success && uploadResp.data && Array.isArray(uploadResp.data.attachments)) {
              const savedAttachments = uploadResp.data.attachments;
              // Update local credit records replacing placeholder
              writeCreditRecords(prev => (prev || []).map(rec => {
                if ((rec.transactionId && savedSale.transactionId && rec.transactionId === savedSale.transactionId) || (rec._id && rec._id === savedSale._id)) {
                  return { ...rec, attachments: savedAttachments };
                }
                return rec;
              }));
            } else {
              console.warn('Attachment upload after credit sale did not return expected shape', uploadResp);
            }
          } catch (uploadErr) {
            console.error('[POS] Credit sale attachment upload failed:', uploadErr);
            // Do not block the user; keep the placeholder or allow retry
          }
        }

      } else {
        // For cash/mobile transfer sales, use regular sales API
        const payload = {
          ...saleData,
          stockId: newItem.stockId,
          paymentMode: itemPaymentMode === 'Mobile Transfer' ? 'Mobile Transfer' : itemPaymentMode,
          customer: customerName || 'Walk-in',
          customerMobile: customerContact
        };

        if (!payload.customerMobile) delete payload.customerMobile;

        // Validate required fields for regular sales
  // If stockId is present we can relax the requirement for itemId
  const requiredFields = ['itemName', 'costPrice', 'sellingPrice', 'quantitySold', 'paymentMode', 'dateSold'];
  const missingFields = requiredFields.filter(f => !payload[f] && payload[f] !== 0);
  if (!payload.itemId && !payload.stockId) missingFields.unshift('itemId or stockId');
        if (missingFields.length > 0) {
          alert('Transaction not saved: Missing required fields: ' + missingFields.join(', '));
          console.error('[POS] Missing required fields in payload:', missingFields, payload);
          return;
        }

        console.log('[POS] Creating regular sale:', JSON.stringify(payload, null, 2));

        // Capture the stockId we'll refresh after the sale (if available)
        const keyStockId = payload.stockId;

        // Optimistically decrement local stock so UI updates instantly
        if (keyStockId) {
          const qty = Number(payload.quantitySold) || 0;
          if (qty > 0) {
            setStockOptions(prev => {
              if (!Array.isArray(prev)) return prev || [];
              return prev.map(s => {
                if (s && ((s._id && String(s._id) === String(keyStockId)) || (s.itemId && s.itemId === keyStockId))) {
                  const newStock = Math.max(0, Number(s.currentStock || 0) - qty);
                  return { ...s, currentStock: newStock };
                }
                return s;
              });
            });
            if (setInventory) {
              setInventory(prev => {
                const copy = { ...(prev || {}) };
                const invKey = Object.keys(copy).find(k => k === keyStockId || (copy[k] && copy[k].itemId === keyStockId));
                if (invKey) {
                  const newStock = Math.max(0, Number(copy[invKey].currentStock || 0) - qty);
                  copy[invKey] = { ...copy[invKey], currentStock: newStock };
                }
                return copy;
              });
            }
          }
        }

        try {
          response = await salesAPI.create(payload);
        } catch (apiError) {
          console.error('[POS] Sales API error:', apiError);
          // Revert optimistic change on failure
          if (keyStockId) {
            const qty = Number(payload.quantitySold) || 0;
              if (qty > 0) {
                setStockOptions(prev => {
                  if (!Array.isArray(prev)) return prev || [];
                  return prev.map(s => {
                    if (s && ((s._id && String(s._id) === String(keyStockId)) || (s.itemId && s.itemId === keyStockId))) {
                      const newStock = Math.max(0, Number(s.currentStock || 0) + qty);
                      return { ...s, currentStock: newStock };
                    }
                    return s;
                  });
                });
                if (setInventory) {
                  setInventory(prev => {
                    const copy = { ...(prev || {}) };
                    const invKey = Object.keys(copy).find(k => k === keyStockId || (copy[k] && copy[k].itemId === keyStockId));
                    if (invKey) {
                      const newStock = Math.max(0, Number(copy[invKey].currentStock || 0) + qty);
                      copy[invKey] = { ...copy[invKey], currentStock: newStock };
                    }
                    return copy;
                  });
                }
              }
          }
          alert('Transaction save failed: ' + (apiError.message || apiError));
          return;
        }

        if (!response?.success) {
          console.error('[POS] Sale API response error:', response);
          alert('Transaction save failed: ' + (response?.message || 'Unknown error'));
          return;
        }

        savedSale = response.data?.sale;

        // Upload attachment for regular sales if file is provided
        if (savedSale && selectedFile) {
          try {
            // Upload attachment and set entityType 'sales' (attachmentAPI.upload handles the entityType param)
            const uploadResult = await attachmentAPI.upload('sales', savedSale._id, [selectedFile], 'Payment proof/receipt');
            if (uploadResult.success && uploadResult.data.attachments?.length > 0) {
              newItem.attachments = uploadResult.data.attachments;
            }
          } catch (e) {
            console.warn('Attachment upload error:', e?.message || e);
          }
        }

        // Refresh cash sales from database
        loadCashSales();
        // Reconcile optimistic update: fetch authoritative stock by keyStockId (preferred) or fallback to savedSale
        (async () => {
          try {
            const lookupId = (typeof keyStockId !== 'undefined' && keyStockId) ? keyStockId : (savedSale?.stockId || savedSale?.itemId);
            if (!lookupId) return;

            const stockResp = await stockAPI.getById(lookupId);
            if (stockResp && stockResp.success && stockResp.data && stockResp.data.item) {
              const updatedItem = stockResp.data.item;
              // Replace or insert authoritative item in stockOptions
              setStockOptions(prev => {
                const copy = Array.isArray(prev) ? [...prev] : [];
                const idx = copy.findIndex(s => (s._id && updatedItem._id && String(s._id) === String(updatedItem._id)) || (s.itemId && updatedItem.itemId && s.itemId === updatedItem.itemId));
                if (idx >= 0) {
                  copy[idx] = updatedItem;
                } else {
                  copy.unshift(updatedItem);
                }
                return copy;
              });

              // Replace in inventory
              if (setInventory) {
                setInventory(prevInv => {
                  const copy = { ...(prevInv || {}) };
                  const key = updatedItem.itemId || updatedItem._id;
                  copy[key] = updatedItem;
                  return copy;
                });
              }
            } else {
              // If fetch didn't provide authoritative result, attempt a full refresh to be safe
              try {
                const all = await stockAPI.getAll();
                if (all && all.success) {
                  const items = all.data?.items || [];
                  setStockOptions(items);
                  if (setInventory) {
                    const inventoryObj = Array.isArray(items) ? Object.fromEntries(items.map(item => [item.itemId || item._id, item])) : {};
                    setInventory(inventoryObj);
                  }
                }
              } catch (err) {
                console.warn('Fallback full refresh failed:', err?.message || err);
              }
            }
          } catch (refreshErr) {
            console.warn('Could not fetch updated stock item after sale:', refreshErr?.message || refreshErr);
            // Revert optimistic decrement if lookup failed
            if (keyStockId) {
              const qty = Number(payload.quantitySold) || 0;
              if (qty > 0) {
                setStockOptions(prev => {
                  if (!Array.isArray(prev)) return prev || [];
                  return prev.map(s => {
                    if (s && ((s._id && String(s._id) === String(keyStockId)) || (s.itemId && s.itemId === keyStockId))) {
                      const newStock = Math.max(0, Number(s.currentStock || 0) + qty);
                      return { ...s, currentStock: newStock };
                    }
                    return s;
                  });
                });
                if (setInventory) {
                  setInventory(prev => {
                    const copy = { ...(prev || {}) };
                    const invKey = Object.keys(copy).find(k => k === keyStockId || (copy[k] && copy[k].itemId === keyStockId));
                    if (invKey) {
                      const newStock = Math.max(0, Number(copy[invKey].currentStock || 0) + qty);
                      copy[invKey] = { ...copy[invKey], currentStock: newStock };
                    }
                    return copy;
                  });
                }
              }
            }
          }
        })();
        alert('Sale recorded successfully!');
      }

        // Always fetch latest inventory from backend after sale
      if (setInventory) {
        try {
          const stockRes = await stockAPI.getAll();
          if (stockRes && stockRes.success) {
            const items = stockRes.data?.items || [];
            const inventoryObj = Array.isArray(items)
              ? Object.fromEntries(items.map(item => [item.itemId || item._id, item]))
              : (stockRes.data?.inventory || {});
            setInventory(inventoryObj);
          }
        } catch (e) {
          console.warn('Could not refresh inventory after sale:', e?.message || e);
        }
      }
    } catch (error) {
      console.error('\u274c Error creating transaction with attachment:', error);
      alert('Transaction save failed: ' + error.message);
    }

    setItemName("");
    setItemPaymentMode("");
    setItemDateSold("");
    setItemSellingPrice("");
    setItemQuantitySold("");
    setCustomerName("");
    setCustomerContact("");
    setProofOfPayment("");
    setSelectedFile(null);
  }
 
  function handlePaymentChange(event) {
    setItemPaymentMode(event.target.value);
  }
  function handleItemChange(event) {
    setItemName(event.target.value);
  }
  function handleDateChange(event) {
    setItemDateSold(event.target.value);
  }
  function handleSellingPriceChange(event) {
    const raw = event.target.value;
    // Allow empty string so user can clear the field
    if (raw === '') {
      setItemSellingPrice('');
      return;
    }

    // Parse as float and enforce non-negative
    const parsed = parseFloat(raw);
    if (Number.isNaN(parsed) || parsed < 0) {
      return; // ignore invalid input
    }

    // Store as string with up to 2 decimal places
    const normalized = String(Math.round(parsed * 100) / 100);
    setItemSellingPrice(normalized);
  }
  function handleQuantitySoldChange(event) {
    const raw = event.target.value;
    if (raw === '') {
      setItemQuantitySold('');
      return;
    }

    // Parse integer and enforce minimum 1
    const parsed = parseInt(raw, 10);
    if (Number.isNaN(parsed) || parsed < 1) {
      return; // ignore invalid input like 0 or negative
    }

    setItemQuantitySold(String(parsed));
  }
  function handleCustomerNameChange(event) {
    setCustomerName(event.target.value);
  }
  function handleContactChange(event) {
    setCustomerContact(event.target.value);
  }
  function handleProofofPaymentChange(event) {
    setProofOfPayment(event.target.value);
  }

  // Expense form handlers (separate from sales)
  function handleExpenseCategoryChange(event) {
    setExpenseCategory(event.target.value);
  }
  function handleExpenseDateChange(event) {
    setExpenseDate(event.target.value);
  }
  function handleExpenseAmountChange(event) {
    setExpenseAmount(event.target.value);
  }
  function handleExpenseDescriptionChange(event) {
    setExpenseDescription(event.target.value);
  }

  function handleFileChange(event) {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (validTypes.includes(file.type)) {
        setSelectedFile(file);
        setProofOfPayment(file.name); // Update the text field with filename
      } else {
        alert('Please select a valid file (PDF, JPG, PNG, or GIF)');
        event.target.value = '';
      }
    }
  }

  function handleExpenseFileChange(event) {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (validTypes.includes(file.type)) {
        setExpenseFile(file);
      } else {
        alert('Please select a valid file (PDF, JPG, PNG, or GIF)');
        event.target.value = '';
      }
    }
  }

  function handleViewAttachment(attachment) {
    (async () => {
      try {
        const { fetchAttachmentPreview } = await import('../../utils/attachmentPreview');
        const att = { ...attachment };
        const result = await fetchAttachmentPreview(att);

        // If helper returned a blob/object URL, use it directly
        if (result && result.source === 'blob' && result.url) {
          att.url = result.url;
          if (result.mimeType && !att.type) att.type = result.mimeType;
          att._revokePreview = result.revoke;
          setCurrentAttachment(att);
          setShowAttachmentModal(true);
        } else {
          // Helper couldn't produce a blob URL (maybe direct URL or fallback). Try an authenticated fetch
          // to obtain a blob we can preview in the modal without making the <img> hit an unauthenticated endpoint.
          const downloadApiUrl = (result && result.url) || att.url || (att._id ? attachmentAPI.getUrl(att._id) : null);
          let previewSet = false;
          if (downloadApiUrl) {
            try {
              const token = (typeof localStorage !== 'undefined') ? localStorage.getItem('authToken') : null;
              const fetchResp = await fetch(downloadApiUrl, { headers: token ? { 'Authorization': `Bearer ${token}` } : {} });
              if (fetchResp.ok) {
                const ct = fetchResp.headers.get('content-type') || '';
                if (!ct.includes('text/html') && ct.startsWith('image/')) {
                  const blobPreview = await fetchResp.blob();
                  if (blobPreview && blobPreview.size > 0) {
                    const objectUrlPreview = URL.createObjectURL(blobPreview);
                    att.url = objectUrlPreview;
                    att.type = ct || att.type;
                    att._revokePreview = () => { try { URL.revokeObjectURL(objectUrlPreview); } catch(e) {} };
                    setCurrentAttachment(att);
                    setShowAttachmentModal(true);
                    previewSet = true;
                  }
                }
              }
            } catch (e) {
              // ignore and fallback to download link below
            }
          }

          if (!previewSet) {
            if (!att.url && att._id) att.url = attachmentAPI.getUrl(att._id);
            setCurrentAttachment(att);
            setShowAttachmentModal(true);
          }
        }
      } catch (e) {
        const att = { ...attachment };
  if (!att.url && att._id) att.url = attachmentAPI.getUrl(att._id);
        setCurrentAttachment(att);
        setShowAttachmentModal(true);
      }
    })();
  }

  function closeAttachmentModal() {
    if (currentAttachment && currentAttachment._revokePreview) {
      try { currentAttachment._revokePreview(); } catch(e) {}
    }
    // Revoke any modal-created preview
    if (modalPreviewRevoke) {
      try { modalPreviewRevoke(); } catch(e) {}
      setModalPreviewRevoke(null);
    }
    if (modalPreviewUrl) {
      try { URL.revokeObjectURL(modalPreviewUrl); } catch(e) {}
      setModalPreviewUrl(null);
    }
    setShowAttachmentModal(false);
    setCurrentAttachment(null);
  }

  // Cash sales modal functions
  function closeCashSalesModal() {
    setShowCashSalesModal(false);
    setSelectedCashSale(null);
  }

  async function handleDeleteCashSale() {
    if (!selectedCashSale || !user) return;

    // Restrict delete to testuser123 only
    if (user.username !== 'testuser123') {
      alert('You do not have permission to delete cash sales records.');
      return;
    }

    try {
      const response = await salesAPI.delete(selectedCashSale._id || selectedCashSale.id);
      if (response && response.success) {
        // Remove from local state
        setCashRecords(prev => prev.filter(record => 
          (record._id || record.id) !== (selectedCashSale._id || selectedCashSale.id)
        ));
        setAllCashRecords(prev => prev.filter(record => 
          (record._id || record.id) !== (selectedCashSale._id || selectedCashSale.id)
        ));
        
        // Show success message
        setPopupMessage('Cash sale deleted successfully');
        setShowPopup(true);
        setTimeout(() => { setShowPopup(false); setPopupMessage(''); }, 2000);
        
        closeCashSalesModal();
      } else {
        throw new Error(response?.message || 'Failed to delete cash sale');
      }
    } catch (error) {
      console.error('❌ Failed to delete cash sale:', error);
      alert('Failed to delete cash sale: ' + (error.message || error));
    }
  }

  // When modal opens with a currentAttachment, ensure the preview URL is an authenticated blob URL
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!showAttachmentModal || !currentAttachment) return;

      // If currentAttachment already has a blob/object URL or a preview attached, use that
      if (currentAttachment._revokePreview && currentAttachment.url && String(currentAttachment.url).startsWith('blob:')) {
        setModalPreviewUrl(currentAttachment.url);
        setModalPreviewRevoke(() => currentAttachment._revokePreview);
        return;
      }

      // If the URL is absolute and not same-origin frontend, prefer it; otherwise fetch from backend with auth
      try {
        const rawUrl = currentAttachment.url || '';
        const backendBase = (typeof window !== 'undefined' && window.location) ? `${window.location.protocol}//${window.location.hostname}:5000` : '';
        let targetUrl = rawUrl;
        const isAbsolute = /^https?:\/\//i.test(rawUrl);
        if (!isAbsolute && rawUrl && rawUrl.startsWith('/') && backendBase) {
          targetUrl = backendBase + rawUrl;
        }

        // If targetUrl still not set, try the API download endpoint (absolute URL)
        if (!targetUrl && currentAttachment._id) {
          try {
            targetUrl = attachmentAPI.getUrl(currentAttachment._id);
          } catch(e) {
            targetUrl = (backendBase ? backendBase : '') + `/attachments/download/${currentAttachment._id}`;
          }
        }

        if (!targetUrl) return;

        const token = (typeof localStorage !== 'undefined') ? localStorage.getItem('authToken') : null;
        const resp = await fetch(targetUrl, { headers: token ? { 'Authorization': `Bearer ${token}` } : {} });
        if (!resp.ok) return;
        const ct = resp.headers.get('content-type') || '';
        if (ct.includes('text/html')) return; // don't use HTML responses
        if (!ct.startsWith('image/')) return; // only build previews for images

        const blob = await resp.blob();
        if (!blob || blob.size === 0) return;
        if (cancelled) return;
        const obj = URL.createObjectURL(blob);
        setModalPreviewUrl(obj);
        setModalPreviewRevoke(() => () => { try { URL.revokeObjectURL(obj); } catch(e) {} });
      } catch (e) {
        // ignore — UI will show download link
      }
    })();

    return () => { cancelled = true; };
  }, [showAttachmentModal, currentAttachment]);

  function handleClearCreditSale(index) {
  const creditSale = displayedCreditRecords[index];

    // Call backend to mark as paid. Use default paymentMethod 'Cash' if not provided.
    (async () => {
      try {
        const paymentData = { paymentMethod: 'Cash', datePaid: new Date().toISOString().split('T')[0] };
        const resp = await creditSalesAPI.markAsPaid(creditSale._id || creditSale.id, paymentData);
        if (!resp || !resp.success) {
          throw new Error(resp?.message || 'Could not mark credit sale as paid');
        }

        const currentDate = new Date().toISOString().split('T')[0];
        const paidCreditSale = {
          ...creditSale,
          originalSaleDate: creditSale.dateSold,
          paymentDate: currentDate,
          paymentMode: 'Paid Credit',
          dateSold: currentDate,
          isPaid: true
        };

        // Add to cash and paid lists
        setCashRecords(prev => [...prev, paidCreditSale]);
        setPaidCreditRecords(prev => [...prev, paidCreditSale]);

        // Remove from local credit datasets
        const itemToRemove = creditRecords[index];
        const updatedAllCreditRecords = allCreditRecords.filter(record => (record._id || record.id) !== (itemToRemove._id || itemToRemove.id));
        setAllCreditRecords(updatedAllCreditRecords);
        setTotalCreditRecords(updatedAllCreditRecords.length);

        // Recalculate pagination and current page
        const currentPage = creditRecordsPage;
        const totalPages = Math.ceil(updatedAllCreditRecords.length / creditRecordsPerPage) || 1;
        const adjustedPage = currentPage > totalPages ? Math.max(1, totalPages) : currentPage;
        setCreditRecordsPage(adjustedPage);

        const startIndex = (adjustedPage - 1) * creditRecordsPerPage;
        const endIndex = startIndex + creditRecordsPerPage;
        const paginatedRecords = updatedAllCreditRecords.slice(startIndex, endIndex);
  writeCreditRecords(paginatedRecords);

  setPopupMessage('Credit sale marked as paid and moved to cash records');
  setShowPopup(true);
  setTimeout(() => { setShowPopup(false); setPopupMessage(''); }, 2000);
      } catch (err) {
        console.error('❌ Failed to mark credit sale as paid:', err);
        alert('Failed to mark credit sale as paid: ' + (err.message || err));
      }
    })();
  }

  // Get all records with attachments from all sources
  function getAllAttachments() {
    const allRecords = [];
    
    // Add expense records with attachments (old format)
    expenseRecords.forEach(record => {
      if (record.attachment) {
        // Prefer the expense category/name if available (e.g., 'Food'),
        // fall back to any provided category field or a generic label.
        const expenseCategoryLabel = record.name || record.category || 'Expense';
        allRecords.push({
          ...record,
          source: 'expense',
          category: expenseCategoryLabel
        });
      }
    });
    
    // Add cash records with attachments (new and old formats)
    cashRecords.forEach(record => {
      // Handle new attachment format (array of attachments)
      if (record.attachments && record.attachments.length > 0) {
        record.attachments.forEach(attachment => {
          allRecords.push({
            ...record,
            attachment: {
              _id: attachment._id,
              name: attachment.originalName,
              type: attachment.mimeType,
              size: attachment.size
            },
            source: record.paymentMode === 'Mobile Transfer' ? 'mobile_transfer' : 
                    record.paymentMode === 'Paid Credit' ? 'paid_credit' : 'cash',
            category: record.paymentMode === 'Mobile Transfer' ? 'Mobile Transfer' : 
                     record.paymentMode === 'Paid Credit' ? 'Paid Credit' : 'Cash Sale'
          });
        });
      }
      // Handle old attachment format (single attachment object)
      else if (record.attachment) {
        allRecords.push({
          ...record,
          source: record.paymentMode === 'Mobile Transfer' ? 'mobile_transfer' : 
                  record.paymentMode === 'Paid Credit' ? 'paid_credit' : 'cash',
          category: record.paymentMode === 'Mobile Transfer' ? 'Mobile Transfer' : 
                   record.paymentMode === 'Paid Credit' ? 'Paid Credit' : 'Cash Sale'
        });
      }
    });
    
    // Add credit records with attachments (new and old formats)
    displayedCreditRecords.forEach(record => {
      // Handle new attachment format (array of attachments)
      if (record.attachments && record.attachments.length > 0) {
        record.attachments.forEach(attachment => {
          allRecords.push({
            ...record,
            attachment: {
              _id: attachment._id,
              name: attachment.originalName,
              type: attachment.mimeType,
              size: attachment.size
            },
            source: 'credit',
            category: 'Credit Sale'
          });
        });
      }
      // Handle old attachment format (single attachment object)
      else if (record.attachment) {
        allRecords.push({
          ...record,
          source: 'credit',
          category: 'Credit Sale'
        });
      }
    });
    
    return allRecords;
  }

  // Paginated slices for expenses and attachments
  const totalExpenseRecords = expenseRecords.length || 0;
  const expenseTotalPages = Math.max(1, Math.ceil(totalExpenseRecords / itemsPerPage));
  const paginatedExpenses = paginate(expenseRecords || [], expenseRecordsPage);

  const allAttachmentsList = getAllAttachments();
  const totalAttachments = allAttachmentsList.length || 0;
  const attachmentsTotalPages = Math.max(1, Math.ceil(totalAttachments / itemsPerPage));
  const paginatedAttachments = paginate(allAttachmentsList, attachmentsPage);

  // Keep expense and attachment page numbers in-range when data changes
  useEffect(() => {
    if (expenseRecordsPage > expenseTotalPages) setExpenseRecordsPage(1);
  }, [expenseRecordsPage, expenseTotalPages, expenseRecords]);

  useEffect(() => {
    if (attachmentsPage > attachmentsTotalPages) setAttachmentsPage(1);
  }, [attachmentsPage, attachmentsTotalPages, expenseRecords, cashRecords, displayedCreditRecords]);

  return (
    <div className="pos-main-container">
      {showPopup && (
        <div className="custom-popup">{popupMessage || 'Done'}</div>
      )}
      <div className="sales-options">
        <div>
          <button className="sales-btn" onClick={() => setViewMode('transaction')}>Record Sale</button>
        </div>
        <div>
          <button className="sales-btn" onClick={() => setViewMode('cash-records')}>Cash Sales</button>
        </div>
        <div>
          <button className="sales-btn" onClick={() => setViewMode('credit-records')}>Credit Sales</button>
        </div>
        <div>
          <button className="sales-btn" onClick={() => setViewMode('new-expense')}>Record Expense/Receipt</button>
        </div>
        <div>
          <button className="sales-btn" onClick={() => setViewMode('expense-records')}>Expenses</button>
        </div>
        <div>
          <button className="sales-btn" onClick={() => setViewMode('attachments')}>Attachments</button>
        </div>
      </div>
      {viewMode === 'transaction' && (
        <div className="pos-transaction-container">
          <select ref={paymentModeRef} className="select-input" value={itemPaymentMode} onChange={handlePaymentChange}>
            <option value="">Select Mode of Payment</option>
            <option value="Cash">Cash</option>
            <option value="Mobile Transfer">Mobile Transfer</option>
            <option value="Credit">Credit</option>
          </select>
          {stockError && (
            <div style={{ color: 'red', marginBottom: '0.5rem', fontSize: '0.95rem' }}>
              {stockError}
            </div>
          )}
          <select ref={itemNameRef} className="select-item" value={itemName} onChange={handleItemChange} disabled={!!stockError}>
            <option value="">Select item</option>
            {stockOptions.length === 0 ? (
              <option disabled>No inventory items found</option>
            ) : (
              stockOptions.map((stock, idx) => (
                <option key={stock._id || stock.itemId || idx} value={stock.itemName}>{stock.itemName}</option>
              ))
            )}
          </select>
          <input ref={dateRef} className="input-field" type="date" value={itemDateSold} onChange={handleDateChange}/>
          <input
            className="input-field"
            placeholder="Enter selling price per item"
            type="number"
            min="0"
            step="0.01"
            value={itemSellingPrice}
            onChange={handleSellingPriceChange}
            ref={sellingPriceRef}
          />
          <input
            className="input-field"
            placeholder="Enter quantity sold"
            type="number"
            min="1"
            step="1"
            value={itemQuantitySold}
            onChange={handleQuantitySoldChange}
            ref={quantityRef}
          />
          
          {/* Stock availability indicator */}
          {itemName && (() => {
            // Prefer backend stockOptions (server-authoritative currentStock); fall back to inventory prop
            const foundStock = stockOptions.find(s => s.itemName === itemName || s.itemId === itemName || s._id === itemName);
            const invKey = Object.keys(inventory).find(key => inventory[key].itemName === itemName);

            const availableQuantity = (foundStock && typeof foundStock.currentStock === 'number')
              ? foundStock.currentStock
              : (invKey && inventory[invKey] && typeof inventory[invKey].currentStock === 'number')
                ? inventory[invKey].currentStock
                : 0;

            const requestedQuantity = Number(itemQuantitySold) || 0;
            const isOverstock = requestedQuantity > availableQuantity;

            // Choose background color: overstock warning > low stock > normal
            const bgColor = isOverstock ? '#fff3cd' : (availableQuantity <= 5 ? '#f8d7da' : '#d1edff');
            const borderColor = isOverstock ? '#ffeaa7' : (availableQuantity <= 5 ? '#f5c6cb' : '#b8daff');
            const textColor = isOverstock ? '#856404' : (availableQuantity <= 5 ? '#721c24' : '#004085');

            return (
              <div style={{ 
                padding: '8px 12px', 
                borderRadius: '5px',
                backgroundColor: bgColor,
                border: `1px solid ${borderColor}`,
                fontSize: '0.9rem',
                fontFamily: 'Arial, sans-serif',
                color: textColor
              }}>
                <span style={{ fontWeight: 'bold' }}>Stock Available: {availableQuantity}</span>
                {availableQuantity <= 5 && !isOverstock && (
                  <span style={{ marginLeft: '8px', color: '#dc3545', fontWeight: 'bold' }}>
                    (Low Stock!)
                  </span>
                )}
                {isOverstock && (
                  <span style={{ marginLeft: '8px', color: '#856404', fontWeight: 'bold' }}>
                    (Exceeds Available Stock!)
                  </span>
                )}
              </div>
            );
          })()}
          
          {/* Show proof of payment for Mobile Transfer and Credit, show customer fields only for Credit */}
          {itemPaymentMode === "Credit" && (
            <>
              <input ref={customerNameRef} className="input-field" placeholder="Customer’s name" value={customerName} onChange={handleCustomerNameChange}/>
              <input ref={customerContactRef} className="input-field" placeholder="Customer’s phone number" type="tel" value={customerContact} onChange={handleContactChange}/>
            </>
          )}
          {/* Conditional-controlled File attachment UI. */}
          {(() => {
            // Determine whether to show the attachment UI.
            // Hide when payment mode is Credit, Mobile Transfer, or Cash.
            const hiddenModes = ['Credit', 'Mobile Transfer', 'Cash'];
            // Only show attachment UI when a payment mode is selected and it's not one of the hidden modes.
            const showAttachment = itemPaymentMode && !hiddenModes.includes(itemPaymentMode);
            if (!showAttachment) return null;

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%', marginTop: '1rem' }}>
                {/* <input 
                  className="input-field" 
                  placeholder="Proof of payment description" 
                  value={proofOfPayment} 
                  onChange={handleProofofPaymentChange}
                /> */}
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontFamily: 'Arial, sans-serif', fontSize: '1rem' }}>
                  Attach Supporting Document
                </label>
                <div style={{ position: 'relative', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input 
                    type="file" 
                    accept=".pdf,.jpg,.jpeg,.png,.gif"
                    onChange={handleFileChange}
                    id="file-input-1"
                    style={{ display: 'none' }}
                  />
                  <label 
                    htmlFor="file-input-1"
                    style={{
                      backgroundColor: '#007bff',
                      border: 'none',
                      padding: '8px 12px',
                      color: 'white',
                      fontSize: '0.9rem',
                      fontWeight: 'normal',
                      fontFamily: 'Arial, sans-serif',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'inline-block',
                      marginBottom: '0'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#0056b3';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = '#007bff';
                    }}
                  >
                    Choose File
                  </label>
                  {selectedFile && (
                    <button 
                      onClick={() => {
                        setSelectedFile(null);
                        setProofOfPayment("");
                        // Reset the file input
                        const fileInput = document.getElementById('file-input-1');
                        if (fileInput) fileInput.value = '';
                      }}
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
                      Delete File
                    </button>
                  )}
                </div>
                {selectedFile && (
                  <p style={{ fontSize: '0.9rem', color: '#666', margin: '0' }}>
                    Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                  </p>
                )}
              </div>
            );
          })()}
          
          <div className="transaction-total-display">
            <h3>Total:</h3>
            <span style={{ 
              fontSize: '1.2rem', 
              fontWeight: 'bold', 
              color: getTransactionTotal() > 0 ? '#28a745' : '#666',
              fontFamily: 'Arial, sans-serif'
            }}>
              {getTransactionTotal().toFixed(2)}
            </span>
          </div>
          <button 
            className="process-transaction-button" 
            onClick={(e) => {
              // If form invalid, focus first invalid field; otherwise proceed
              if (!isValidSalesTransaction() || isOverstock) {
                e.preventDefault();
                focusFirstInvalid();
                return;
              }
              handleItemNewEntry();
            }}
            disabled={!isValidSalesTransaction() || isOverstock}
            style={{
              backgroundColor: !isValidSalesTransaction() ? '#6c757d' : '#28a745',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '5px',
              fontSize: '1rem',
              fontWeight: 'bold',
              fontFamily: 'Arial, sans-serif',
              cursor: !isValidSalesTransaction() ? 'not-allowed' : 'pointer',
              opacity: !isValidSalesTransaction() ? 0.6 : 1,
              transition: 'all 0.2s ease',
              width: '100%',
              marginTop: '1rem'
            }}
            onMouseEnter={(e) => {
              if (isValidSalesTransaction()) {
                e.target.style.backgroundColor = '#218838';
                e.target.style.transform = 'scale(1.02)';
              }
            }}
            onMouseLeave={(e) => {
              if (isValidSalesTransaction()) {
                e.target.style.backgroundColor = '#28a745';
                e.target.style.transform = 'scale(1)';
              }
            }}
            title={getValidationMessage()}
          >
            {isOverstock ? 'Exceeds Available Stock' : (!isValidSalesTransaction() ? 'Complete Required Fields' : 'Save Transaction')}
          </button>
        </div>
      )}
      {viewMode === 'cash-records' && (
        <div className="sales-mini-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 className="sales-head">Cash Sales Sheet</h2>
            {/* <button 
              onClick={loadCashSales}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              🔄 Refresh
            </button> */}
          </div>
          {/* Filters for cash sales sheet */}
          <div className="cash-sales-filters">
            <input
              type="date"
              value={cashSalesFilterDate || ''}
              onChange={e => setCashSalesFilterDate(e.target.value)}
              placeholder="Filter by Date"
            />
            <input
              type="text"
              value={cashSalesFilterItem || ''}
              onChange={e => setCashSalesFilterItem(e.target.value)}
              placeholder="Filter by Item"
            />
            <input
              type="text"
              value={cashSalesFilterSignedBy || ''}
              onChange={e => setCashSalesFilterSignedBy(e.target.value)}
              placeholder="Filter by Signed By"
            />
            <button
              onClick={() => {
                setCashSalesFilterDate('');
                setCashSalesFilterItem('');
                setCashSalesFilterSignedBy('');
              }}
              style={{ padding: '0.5rem 1rem', borderRadius: '7px', border: '1px solid #d1d5db', backgroundColor: '#f6f8fa', color: '#185aca', cursor: 'pointer', fontWeight: 500, fontSize: '1rem' }}
            >
              Clear
            </button>
          </div>
          <div className="sales-information">
            <div className="sales-items">
              <h2 className="item">Date</h2>
              <h2 className="item">Item</h2>
              <h2 className="item">Payment Mode</h2>
              <h2 className="cost-price">Cost price</h2>
              <h2 className="selling-price">Selling price</h2>
              <h2 className="quantity-available">Quantity Sold</h2>
              <h2 className="sub-total">Sub Total</h2>
              <h2 className="item">Signed By</h2>
            </div>
            {renderFilteredCashRecords()}
                
                {/* Pagination Controls */}
                {Math.ceil(totalCashRecords / cashRecordsPerPage) > 1 && (
                  <div style={{ 
                    gridColumn: '1 / -1', 
                    padding: '1rem', 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    gap: '0.5rem',
                    backgroundColor: '#fff',
                    borderTop: '1px solid #dee2e6'
                  }}>
                    <button
                      onClick={() => paginateCashSales(cashRecordsPage - 1)}
                      disabled={cashRecordsPage === 1}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: cashRecordsPage === 1 ? '#e9ecef' : '#007bff',
                        color: cashRecordsPage === 1 ? '#6c757d' : 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: cashRecordsPage === 1 ? 'not-allowed' : 'pointer'
                      }}
                    >
                      ← Previous
                    </button>
                    
                    <span style={{ margin: '0 1rem', fontWeight: 'bold' }}>
                      Page {cashRecordsPage} of {Math.ceil(totalCashRecords / cashRecordsPerPage)}
                    </span>
                    
                    <button
                      onClick={() => paginateCashSales(cashRecordsPage + 1)}
                      disabled={cashRecordsPage === Math.ceil(totalCashRecords / cashRecordsPerPage)}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: cashRecordsPage === Math.ceil(totalCashRecords / cashRecordsPerPage) ? '#e9ecef' : '#007bff',
                        color: cashRecordsPage === Math.ceil(totalCashRecords / cashRecordsPerPage) ? '#6c757d' : 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: cashRecordsPage === Math.ceil(totalCashRecords / cashRecordsPerPage) ? 'not-allowed' : 'pointer'
                      }}
                    >
                      Next →
                    </button>
                  </div>
                )}
          </div>
        </div>
      )}
      {viewMode === 'credit-records' && (
        <div className="sales-mini-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 className="sales-head">Credit Sales Sheet</h2>
          </div>
          <div className="sales-information">
            <div className="sales-items">
              <h2 className="item">Date</h2>
              <h2 className="item">Item</h2>
              <h2 className="cost-price">Cost price</h2>
              <h2 className="selling-price">Selling price</h2>
              <h2 className="quantity-available">Quantity Sold</h2>
              <h2 className="sub-total">Sub-total</h2>
              <h2 className="sub-total">Action</h2>
            </div>
              {displayedCreditRecords.length === 0 ? (
              <div className="item-info">
                <p className="item">No credit sales added yet</p>
              </div>
            ) : (
              displayedCreditRecords.map((product, index) => (
                <div className="item-info" key={index}>
                  <p className="item">{formatDate(product.dateSold)}</p>
                  <p className="item">{resolveExpenseCategoryName(product.name)}</p>
                  <p className="cost-price">{formatCurrency(product.costPrice)}</p>
                  <p className="selling-price">{formatCurrency(product.sellingPrice)}</p>
                  <p className="quantity-available">{product.quantitySold}</p>
                  <p className="sub-total">{formatCurrency((product.sellingPrice || 0) * (product.quantitySold || 0))}</p>
                  <p className="sub-total">
                    <button 
                      onClick={() => handleClearCreditSale(index)}
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
                      Mark as Paid
                    </button>
                  </p>
                </div>
              ))
            )}
            {totalCreditRecords > 0 && (
              <>
                {/* Summary Section */}
                <div style={{ 
                  gridColumn: '1 / -1', 
                  borderTop: '2px solid #007bff', 
                  padding: '1rem', 
                  marginTop: '1rem',
                  backgroundColor: '#f8f9fa',
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontWeight: 'bold'
                }}>
                  <span>
                    Showing {((creditRecordsPage - 1) * creditRecordsPerPage) + 1}-{Math.min(creditRecordsPage * creditRecordsPerPage, totalCreditRecords)} of {totalCreditRecords} transactions
                  </span>
                  <span>Total Amount: {formatCurrency(allCreditRecords.reduce((sum, record) => sum + ((record.sellingPrice || 0) * (record.quantitySold || 0)), 0))}</span>
                </div>
                
                {/* Pagination Controls */}
                {Math.ceil(totalCreditRecords / creditRecordsPerPage) > 1 && (
                  <div style={{ 
                    gridColumn: '1 / -1', 
                    padding: '1rem', 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    gap: '0.5rem',
                    backgroundColor: '#fff',
                    borderTop: '1px solid #dee2e6'
                  }}>
                    <button
                      onClick={() => paginateCreditSales(creditRecordsPage - 1)}
                      disabled={creditRecordsPage === 1}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: creditRecordsPage === 1 ? '#e9ecef' : '#007bff',
                        color: creditRecordsPage === 1 ? '#6c757d' : 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: creditRecordsPage === 1 ? 'not-allowed' : 'pointer'
                      }}
                    >
                      ← Previous
                    </button>
                    
                    <span style={{ margin: '0 1rem', fontWeight: 'bold' }}>
                      Page {creditRecordsPage} of {Math.ceil(totalCreditRecords / creditRecordsPerPage)}
                    </span>
                    
                    <button
                      onClick={() => paginateCreditSales(creditRecordsPage + 1)}
                      disabled={creditRecordsPage === Math.ceil(totalCreditRecords / creditRecordsPerPage)}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: creditRecordsPage === Math.ceil(totalCreditRecords / creditRecordsPerPage) ? '#e9ecef' : '#007bff',
                        color: creditRecordsPage === Math.ceil(totalCreditRecords / creditRecordsPerPage) ? '#6c757d' : 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: creditRecordsPage === Math.ceil(totalCreditRecords / creditRecordsPerPage) ? 'not-allowed' : 'pointer'
                      }}
                    >
                      Next →
                    </button>
                  </div>
                )}
              </>
            )}
        </div>
      </div>
    )}
    {viewMode === 'new-expense' && (
      <div className="pos-transaction-container">
        <select className="select-item" value={expenseCategory} onChange={handleExpenseCategoryChange}>
          <option value="">Select expense category</option>
          {categoriesLoading ? (
            <option disabled>Loading categories...</option>
          ) : (
            expenseCategories.map((category) => (
              <option key={category.expenseId || category._id} value={category.expenseId || category.name}>
                {category.name} {category.expenseId ? `(${category.expenseId})` : ''}
              </option>
            ))
          )}
          {/* Fallback to legacy expenses if categories not loaded */}
          {!categoriesLoading && expenseCategories.length === 0 && expenses.map((expense, idx) => (
            <option key={`legacy-${idx}`} value={expense.name}>{expense.name}</option>
          ))}
          <option value="Other">Other</option>
        </select>
        <input className="input-field" type="date" value={expenseDate} onChange={handleExpenseDateChange}/>
        <input className="input-field" placeholder="Enter amount" type="number" value={expenseAmount} onChange={handleExpenseAmountChange}/>
        {expenseCategory === "Other" && (
          <input className="input-field" placeholder="Enter custom expense category" value={expenseDescription} onChange={handleExpenseDescriptionChange}/>
        )}
        {/* {expenseCategory !== "Other" && expenseCategory !== "" && (
          <input className="input-field" placeholder="Description (optional)" value={expenseDescription} onChange={handleExpenseDescriptionChange}/>
        )} */}
        <div style={{ marginBottom: '1rem', width: '100%', marginTop: '1rem', alignItems: 'center' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontFamily: 'Arial, sans-serif', fontSize: '1rem' }}>
            Attach Receipt/Invoice (Optional)
          </label>
          <div style={{ position: 'relative', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input 
              type="file" 
              accept=".pdf,.jpg,.jpeg,.png,.gif"
              onChange={handleExpenseFileChange}
              id="file-input-2"
              style={{ display: 'none' }}
            />
            <label 
              htmlFor="file-input-2"
              style={{
                backgroundColor: '#007bff',
                border: 'none',
                padding: '8px 12px',
                color: 'white',
                fontSize: '0.9rem',
                fontWeight: 'normal',
                fontFamily: 'Arial, sans-serif',
                borderRadius: '5px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'inline-block',
                marginBottom: '0'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#0056b3';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#007bff';
              }}
            >
              Choose File
            </label>
            {expenseFile && (
              <button 
                onClick={() => {
                  setExpenseFile(null);
                  // Reset the file input
                  const fileInput = document.getElementById('file-input-2');
                  if (fileInput) fileInput.value = '';
                }}
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
                Delete File
              </button>
            )}
          </div>
          {expenseFile && (
            <p style={{ fontSize: '0.9rem', color: '#666', margin: '0.5rem 0 0 0', fontFamily: 'Arial, sans-serif' }}>
              Selected: {expenseFile.name} ({(expenseFile.size / 1024).toFixed(1)} KB)
            </p>
          )}
        </div>
        <div className="transaction-total-display">
          <h3>Total:</h3>
          <span style={{ 
            fontSize: '1.2rem', 
            fontWeight: 'bold', 
            color: getTransactionTotal() > 0 ? '#28a745' : '#666',
            fontFamily: 'Arial, sans-serif'
          }}>
            {getTransactionTotal().toFixed(2)}
          </span>
        </div>
        <button 
          className="save-expense-button" 
          onClick={handleItemNewEntry}
          disabled={!isValidExpense()}
          style={{
            backgroundColor: !isValidExpense() ? '#6c757d' : '#28a745',
            color: 'white',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: '5px',
            fontSize: '1rem',
            fontWeight: 'bold',
            fontFamily: 'Arial, sans-serif',
            cursor: !isValidExpense() ? 'not-allowed' : 'pointer',
            opacity: !isValidExpense() ? 0.6 : 1,
            transition: 'all 0.2s ease',
            width: '100%',
            marginTop: '1rem'
          }}
          onMouseEnter={(e) => {
            if (isValidExpense()) {
              e.target.style.backgroundColor = '#218838';
              e.target.style.transform = 'scale(1.02)';
            }
          }}
          onMouseLeave={(e) => {
            if (isValidExpense()) {
              e.target.style.backgroundColor = '#28a745';
              e.target.style.transform = 'scale(1)';
            }
          }}
          title={!isValidExpense() ? 
            'Please fill required fields: Category, Date, Amount' + 
            (expenseCategory === "Other" ? ', and Custom Category Name' : '') : 
            'Save this expense'
          }
        >
          {!isValidExpense() ? 'Complete Required Fields' : 'Save Expense'}
        </button>
        </div>
      )}
      {viewMode === 'expense-records' && (
        <div className="sales-mini-container">
          <h2 className="sales-head">Expense Sheet</h2>
          <div className="sales-information">
            <div className="sales-items">
              <h2 className="item">Date</h2>
              <h2 className="item">Expense Category</h2>
              <h2 className="cost-price">Amount</h2>
              <h2 className="selling-price">Signatory</h2>
            </div>
            {totalExpenseRecords === 0 ? (
              <div className="item-info">
                <p className="item">No expense records added yet</p>
              </div>
            ) : (
              paginatedExpenses.map((product, index) => (
                <div className="item-info" key={product.id || index}>
                  <p className="item">{formatDate(product.dateSold)}</p>
                  <p className="item">{product.name || product.category || '—'}</p>
                  <p className="cost-price">{formatCurrency(Number(product.sellingPrice) || 0)}</p>
                  <p className="selling-price">{
                    (product.recordedBy && typeof product.recordedBy === 'object')
                      ? (product.recordedBy.username || product.recordedBy.email || product.recordedBy._id)
                      : (product.signatory || product.customer || '—')
                  }</p>
                </div>
              ))
            )}
            {totalExpenseRecords > 0 && (
              <>
                <div style={{ 
                  gridColumn: '1 / -1', 
                  borderTop: '2px solid #007bff', 
                  padding: '1rem', 
                  marginTop: '1rem',
                  backgroundColor: '#f8f9fa',
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontWeight: 'bold'
                }}>
                  <span>
                    Showing {((expenseRecordsPage - 1) * itemsPerPage) + 1}-{Math.min(expenseRecordsPage * itemsPerPage, totalExpenseRecords)} of {totalExpenseRecords} records
                  </span>
                  <span>Total Amount: {formatCurrency(expenseRecords.reduce((sum, r) => sum + (Number(r.sellingPrice) || 0), 0))}</span>
                </div>
                {expenseTotalPages > 1 && (
                  <div style={{ gridColumn: '1 / -1', padding: '1rem' }}>
                    <PaginationControls currentPage={expenseRecordsPage} totalPages={expenseTotalPages} onPageChange={(p) => setExpenseRecordsPage(p)} />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
      {viewMode === 'attachments' && (
        <div className="sales-mini-container">
          <h2 className="sales-head">All Attachments</h2>
          <div className="sales-information">
              <div className="sales-items">
              <h2 className="item">Date</h2>
              <h2 className="item">Category</h2>
              <h2 className="item">Attachment</h2>
              <h2 className="cost-price">Amount</h2>
              <h2 className="selling-price">Action</h2>
            </div>
            {totalAttachments === 0 ? (
              <div className="item-info">
                <p className="item">No attachments added yet</p>
              </div>
            ) : (
              paginatedAttachments.map((record, index) => (
                <div className="item-info" key={record.attachment?._id || index}>
                  <p className="item">{formatDate(record.dateSold)}</p>
                  <p className="item" style={{ 
                    fontSize: '0.9rem', 
                    padding: '0.2rem 0.5rem',
                    backgroundColor: record.source === 'expense' ? '#ffeaa7' : 
                                   record.source === 'credit' ? '#fab1a0' : 
                                   record.source === 'mobile_transfer' ? '#a29bfe' : 
                                   record.source === 'paid_credit' ? '#d4edda' : '#74b9ff',
                    borderRadius: '4px',
                    color: '#2d3436',
                    fontWeight: 'bold'
                  }}>
                    {record.category}
                  </p>
                  <p className="item" style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    <span style={{ fontWeight: 'bold' }}>{record.attachment.name}</span>
                    <span style={{ fontSize: '0.8rem', color: '#666' }}>
                      {record.attachment.type} • {(record.attachment.size / 1024).toFixed(1)} KB
                    </span>
                  </p>
                  <p className="cost-price">
                    {formatCurrency(Number(record.source === 'expense' ? (record.sellingPrice || 0) : ((record.sellingPrice || 0) * (record.quantitySold || 0))) || 0)}
                  </p>
                  {/* <p className="selling-price">
                    {record.source === 'expense' 
                      ? record.customer 
                      : `${record.name} - ${record.customer || 
                          (record.source === 'credit' ? 'Credit Sale' : 
                           record.source === 'mobile_transfer' ? 'Mobile Transfer' :
                           record.source === 'paid_credit' ? 'Paid Credit' : 'Cash Sale')}`
                    }
                  </p> */}
                      <p className="selling-price" style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          className="download-attachment-button"
                          onClick={async () => {
                            // Download attachment via helper; if blob URL returned, trigger programmatic download.
                            if (record.attachment._id) {
                              try {
                                const { fetchAttachmentPreview } = await import('../../utils/attachmentPreview');
                                const att = { ...record.attachment };
                                const res = await fetchAttachmentPreview(att);

                                if (res && res.url) {
                                  const url = res.url;
                                  const mime = res.mimeType || att.type || '';

                                  // If it's a blob URL we can programmatically download it
                                  if (typeof url === 'string' && url.startsWith('blob:')) {
                                      // If we have the blob available, validate it's not HTML and for JPEGs check the signature
                                      const blob = res.blob;
                                      let safeToSave = true;
                                      if (blob && blob.size > 0) {
                                        // If declared mime is image/jpeg, validate JPEG SOI (0xFF 0xD8)
                                        if ((res.mimeType || '').toLowerCase() === 'image/jpeg') {
                                          try {
                                            const header = await blob.slice(0, 2).arrayBuffer();
                                            const view = new Uint8Array(header);
                                            if (!(view[0] === 0xFF && view[1] === 0xD8)) {
                                              safeToSave = false;
                                            }
                                          } catch (e) {
                                            safeToSave = false;
                                          }
                                        }
                                      } else {
                                        safeToSave = false;
                                      }

                                      if (safeToSave) {
                                        // Create a temporary anchor to download the blob URL
                                        const a = document.createElement('a');
                                        a.href = url;
                                        // Choose filename: prefer header filename or originalName/name
                                        const filename = res.filename || att.originalName || att.name || (`attachment-${att._id}`);
                                        a.download = filename;
                                        document.body.appendChild(a);
                                        a.click();
                                        a.remove();
                                        // Revoke the object URL when possible
                                        if (typeof res.revoke === 'function') {
                                          try { res.revoke(); } catch (e) { /* ignore */ }
                                        } else {
                                          try { URL.revokeObjectURL(url); } catch(e) {}
                                        }
                                      } else {
                                        // Blob failed basic validation - try to fetch an authenticated preview for the modal
                                        {
                                          const downloadApiUrl = att.url || (att._id ? `/attachments/download/${att._id}` : null);
                                          let previewSet = false;
                                          if (downloadApiUrl) {
                                            try {
                                              const token = (typeof localStorage !== 'undefined') ? localStorage.getItem('authToken') : null;
                                              const fetchResp = await fetch(downloadApiUrl, { headers: token ? { 'Authorization': `Bearer ${token}` } : {} });
                                              if (fetchResp.ok) {
                                                const ct = fetchResp.headers.get('content-type') || '';
                                                if (!ct.includes('text/html') && ct.startsWith('image/')) {
                                                  const blobPreview = await fetchResp.blob();
                                                  if (blobPreview && blobPreview.size > 0) {
                                                    const objectUrlPreview = URL.createObjectURL(blobPreview);
                                                    att.url = objectUrlPreview;
                                                    att.type = ct || att.type;
                                                    att._revokePreview = () => { try { URL.revokeObjectURL(objectUrlPreview); } catch(e) {} };
                                                    setCurrentAttachment(att);
                                                    setShowAttachmentModal(true);
                                                    previewSet = true;
                                                  }
                                                }
                                              }
                                            } catch (e) {
                                              // ignore and fallback below
                                            }
                                          }
                                          if (!previewSet) {
                                            if (!att.url && att._id) att.url = attachmentAPI.getUrl(att._id);
                                            setCurrentAttachment(att);
                                            setShowAttachmentModal(true);
                                          }
                                        }
                                      }
                                  } else if (mime && (mime.startsWith('image/') || mime === 'application/pdf')) {
                                    // For non-blob URLs we must fetch the file with auth headers
                                    // because a plain anchor click won't include the Bearer token
                                    // and the server may return an HTML login page (which appears as a small corrupt file).
                                    try {
                                      const token = (typeof localStorage !== 'undefined') ? localStorage.getItem('authToken') : null;
                                      const fetchOpts = { headers: token ? { 'Authorization': `Bearer ${token}` } : {} };
                                      const fetchResp = await fetch(url, fetchOpts);
                                      if (!fetchResp.ok) throw new Error(`Download failed: ${fetchResp.status}`);

                                      const respContentType = fetchResp.headers.get('content-type') || '';
                                      if (respContentType.includes('text/html')) {
                                        // Server returned HTML (likely login page) — fallback to modal
                                        throw new Error('Server returned HTML instead of file');
                                      }

                                      const downloadedBlob = await fetchResp.blob();
                                      // Basic validation: non-empty and for images check JPEG signature when applicable
                                      let safeToSave = downloadedBlob && downloadedBlob.size > 512;
                                      if (respContentType.toLowerCase().startsWith('image/jpeg') && safeToSave) {
                                        try {
                                          const header = await downloadedBlob.slice(0, 2).arrayBuffer();
                                          const view = new Uint8Array(header);
                                          if (!(view[0] === 0xFF && view[1] === 0xD8)) safeToSave = false;
                                        } catch (e) {
                                          safeToSave = false;
                                        }
                                      }

                                      if (safeToSave) {
                                        const objectUrl2 = URL.createObjectURL(downloadedBlob);
                                        const a2 = document.createElement('a');
                                        a2.href = objectUrl2;
                                        a2.download = res.filename || att.originalName || att.name || (`attachment-${att._id}`);
                                        document.body.appendChild(a2);
                                        a2.click();
                                        a2.remove();
                                        try { URL.revokeObjectURL(objectUrl2); } catch(e) {}
                                      } else {
                                        // Fallback to modal — attempt authenticated preview first
                                        {
                                          const downloadApiUrl = att.url || (att._id ? `/attachments/download/${att._id}` : null);
                                          let previewSet = false;
                                          if (downloadApiUrl) {
                                            try {
                                              const token = (typeof localStorage !== 'undefined') ? localStorage.getItem('authToken') : null;
                                              const fetchResp = await fetch(downloadApiUrl, { headers: token ? { 'Authorization': `Bearer ${token}` } : {} });
                                              if (fetchResp.ok) {
                                                const ct = fetchResp.headers.get('content-type') || '';
                                                if (!ct.includes('text/html') && ct.startsWith('image/')) {
                                                  const blobPreview = await fetchResp.blob();
                                                  if (blobPreview && blobPreview.size > 0) {
                                                    const objectUrlPreview = URL.createObjectURL(blobPreview);
                                                    att.url = objectUrlPreview;
                                                    att.type = ct || att.type;
                                                    att._revokePreview = () => { try { URL.revokeObjectURL(objectUrlPreview); } catch(e) {} };
                                                    setCurrentAttachment(att);
                                                    setShowAttachmentModal(true);
                                                    previewSet = true;
                                                  }
                                                }
                                              }
                                            } catch (e) {
                                              // ignore and fallback below
                                            }
                                          }
                                          if (!previewSet) {
                                            if (!att.url && att._id) att.url = attachmentAPI.getUrl(att._id);
                                            setCurrentAttachment(att);
                                            setShowAttachmentModal(true);
                                          }
                                        }
                                      }
                                    } catch (e) {
                                      // If any fetch or validation error occurs, fallback to safe modal download link
                                if (!att.url && att._id) att.url = attachmentAPI.getUrl(att._id);
                                      setCurrentAttachment(att);
                                      setShowAttachmentModal(true);
                                    }
                                  } else {
                                    // Fallback: show modal with download link (safe) — try authenticated preview first
                                    {
                                      const downloadApiUrl = att.url || (att._id ? `/attachments/download/${att._id}` : null);
                                      let previewSet = false;
                                      if (downloadApiUrl) {
                                        try {
                                          const token = (typeof localStorage !== 'undefined') ? localStorage.getItem('authToken') : null;
                                          const fetchResp = await fetch(downloadApiUrl, { headers: token ? { 'Authorization': `Bearer ${token}` } : {} });
                                          if (fetchResp.ok) {
                                            const ct = fetchResp.headers.get('content-type') || '';
                                            if (!ct.includes('text/html') && ct.startsWith('image/')) {
                                              const blobPreview = await fetchResp.blob();
                                              if (blobPreview && blobPreview.size > 0) {
                                                const objectUrlPreview = URL.createObjectURL(blobPreview);
                                                att.url = objectUrlPreview;
                                                att.type = ct || att.type;
                                                att._revokePreview = () => { try { URL.revokeObjectURL(objectUrlPreview); } catch(e) {} };
                                                setCurrentAttachment(att);
                                                setShowAttachmentModal(true);
                                                previewSet = true;
                                              }
                                            }
                                          }
                                        } catch (e) {
                                          // ignore
                                        }
                                      }
                                      if (!previewSet) {
                                            if (!att.url && att._id) att.url = attachmentAPI.getUrl(att._id);
                                        setCurrentAttachment(att);
                                        setShowAttachmentModal(true);
                                      }
                                    }
                                  }
                                } else {
                                  // No preview url returned; fallback to modal with API download link
                                  const att = { ...record.attachment };
                                      if (!att.url && att._id) att.url = attachmentAPI.getUrl(att._id);
                                  setCurrentAttachment(att);
                                  setShowAttachmentModal(true);
                                }
                              } catch (e) {
                                console.warn('Download preview failed, fallback to modal:', e);
                                const att = { ...record.attachment };
                                            if (!att.url && att._id) att.url = attachmentAPI.getUrl(att._id);
                                setCurrentAttachment(att);
                                setShowAttachmentModal(true);
                              }
                            } else {
                              // Old format: use direct API download link
                              const att = { ...record.attachment };
                              if (!att.url && att._id) att.url = attachmentAPI.getUrl(att._id);
                              setCurrentAttachment(att);
                              setShowAttachmentModal(true);
                            }
                          }}
                          style={{
                            backgroundColor: '#28a745',
                            color: 'white',
                            border: 'none',
                            padding: '0.5rem 1rem',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          Download
                        </button>

                        <button
                          className="delete-attachment-button"
                          onClick={() => handleDeleteAttachment(record.attachment)}
                          style={{
                            backgroundColor: '#dc3545',
                            color: 'white',
                            border: 'none',
                            padding: '0.5rem 1rem',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          Delete
                        </button>
                      </p>
                </div>
              ))
            )}
            {totalAttachments > 0 && (
              <>
                <div style={{ 
                  gridColumn: '1 / -1', 
                  borderTop: '2px solid #007bff', 
                  padding: '1rem', 
                  marginTop: '1rem',
                  backgroundColor: '#f8f9fa',
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontWeight: 'bold'
                }}>
                  <span>
                    Showing {((attachmentsPage - 1) * itemsPerPage) + 1}-{Math.min(attachmentsPage * itemsPerPage, totalAttachments)} of {totalAttachments} attachments
                  </span>
                  <span>Total Attachments: {totalAttachments}</span>
                </div>
                {attachmentsTotalPages > 1 && (
                  <div style={{ gridColumn: '1 / -1', padding: '1rem' }}>
                    <PaginationControls currentPage={attachmentsPage} totalPages={attachmentsTotalPages} onPageChange={(p) => setAttachmentsPage(p)} />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Attachment Viewer Modal */}
      {showAttachmentModal && currentAttachment && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '12px',
            maxWidth: '90%',
            maxHeight: '90%',
            position: 'relative',
            overflow: 'auto'
          }}>
            <button
              onClick={closeAttachmentModal}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                cursor: 'pointer',
                fontSize: '1.2rem'
              }}
            >
              ×
            </button>
            
            <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>
              {currentAttachment.name}
            </h3>
            
            <div style={{ marginBottom: '1rem', color: '#666' }}>
              Type: {currentAttachment.type} • Size: {(currentAttachment.size / 1024).toFixed(1)} KB
            </div>
            
            {currentAttachment.type.startsWith('image/') ? (
              // Only render the <img> when we have a blob/object URL to avoid the browser
              // requesting a raw '/uploads/...' path from the dev server (which returns HTML).
              (modalPreviewUrl || (currentAttachment._revokePreview && currentAttachment.url && String(currentAttachment.url).startsWith('blob:'))) ? (
                <img 
                  src={modalPreviewUrl || currentAttachment.url} 
                  alt={currentAttachment.name}
                  style={{ 
                    maxWidth: '100%', 
                    maxHeight: '600px',
                    objectFit: 'contain'
                  }}
                />
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <p>Preparing preview...</p>
                  <p style={{ fontSize: '0.9rem', color: '#666' }}>If the preview does not appear, use the download button below.</p>
                  <div style={{ marginTop: '1rem' }}>
                    <a
                      href={modalPreviewUrl || currentAttachment.url}
                      download={currentAttachment.name}
                      style={{
                        display: 'inline-block',
                        padding: '0.5rem 1rem',
                        backgroundColor: '#2e8bff',
                        color: 'white',
                        textDecoration: 'none',
                        borderRadius: '4px'
                      }}
                    >
                      Download
                    </a>
                  </div>
                </div>
              )
            ) : currentAttachment.type === 'application/pdf' ? (
              <div style={{ textAlign: 'center' }}>
                <p>PDF files cannot be previewed directly.</p>
                <a 
                  href={modalPreviewUrl || currentAttachment.url} 
                  download={currentAttachment.name}
                  style={{
                    display: 'inline-block',
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#2e8bff',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '4px',
                    marginTop: '1rem'
                  }}
                >
                  Download PDF
                </a>
              </div>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <p>This file type cannot be previewed.</p>
                <a 
                  href={modalPreviewUrl || currentAttachment.url} 
                  download={currentAttachment.name}
                  style={{
                    display: 'inline-block',
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#2e8bff',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '4px',
                    marginTop: '1rem'
                  }}
                >
                  Download File
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cash Sales Modal */}
      {showCashSalesModal && selectedCashSale && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '12px',
            maxWidth: '500px',
            width: '90%',
            position: 'relative'
          }}>
            <button
              onClick={closeCashSalesModal}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                cursor: 'pointer',
                fontSize: '1.2rem'
              }}
            >
              ×
            </button>
            
            <h3 style={{ marginTop: 0, marginBottom: '1.5rem', color: '#333' }}>
              Cash Sale Details
            </h3>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.9rem' }}>
                <div><strong>Date:</strong> {formatDate(selectedCashSale.dateSold)}</div>
                <div><strong>Item:</strong> {selectedCashSale.name}</div>
                <div><strong>Payment Mode:</strong> {selectedCashSale.paymentMode}</div>
                <div><strong>Quantity:</strong> {selectedCashSale.quantitySold}</div>
                <div><strong>Unit Price:</strong> {formatCurrency(selectedCashSale.sellingPrice)}</div>
                <div><strong>Total:</strong> {formatCurrency((selectedCashSale.sellingPrice || 0) * (selectedCashSale.quantitySold || 0))}</div>
              </div>
              {getSignedByDisplay(selectedCashSale) && (
                <div style={{ marginTop: '1rem' }}>
                  <strong>Signed By:</strong> {getSignedByDisplay(selectedCashSale)}
                </div>
              )}
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                onClick={closeCashSalesModal}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                Cancel
              </button>
              {user && user.username === 'testuser123' && (
                <button
                  onClick={handleDeleteCashSale}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#c82333';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#dc3545';
                  }}
                >
                  Delete Sale
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PosTransaction;