import { useState, useEffect } from "react";
import formatCurrency from "./utils/formatCurrency";
import { useLocation } from 'react-router-dom';
function NewOrder (props) {
  const location = useLocation();
  // Fetch all stocks for stocksheet on mount
  useEffect(() => {
    async function fetchAllStocks() {
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch('/api/stock?page=1&limit=1000', {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (!response.ok) return;
        const data = await response.json();
        if (data && data.data && data.data.items) {
          // Convert array to object keyed by itemId
          const inventoryObj = {};
          data.data.items.forEach(item => {
            inventoryObj[item.itemId] = item;
          });
          setInventory(inventoryObj);
        }
      } catch (err) {
        // Optionally handle error
      }
    }
    fetchAllStocks();
  }, []);
  // Local state only
  const [inventory, setInventory] = useState({});
  // Backend stocks collection
  const [stockOptions, setStockOptions] = useState([]);
  const [stockError, setStockError] = useState("");
  // Delivery notes / attachments loaded from backend
  const [deliveryAttachments, setDeliveryAttachments] = useState([]);
  const [loadingDeliveryAttachments, setLoadingDeliveryAttachments] = useState(false);
  const [deliveryAttachmentsError, setDeliveryAttachmentsError] = useState("");
  const [receiptsPerPageOption, setReceiptsPerPageOption] = useState(5);

  // Fetch stocks from backend on mount
  useEffect(() => {
    async function fetchStocks() {
      try {
        // Get auth token from localStorage (adjust key as needed)
  const token = localStorage.getItem('authToken');
        console.log('[DEBUG] Token used for /api/stock:', token);
        setStockError("");
        const response = await fetch("/api/stock?page=1&limit=1000", {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (!response.ok) {
          let msg = `Failed to fetch stocks (status: ${response.status})`;
          if (response.status === 401) {
            msg = 'Unauthorized: Please log in again or check your token.';
          }
          setStockOptions([]);
          setStockError(msg);
          throw new Error(msg);
        }
        const data = await response.json();
        setStockOptions((data && data.data && data.data.items) ? data.data.items : []);
      } catch (err) {
        setStockOptions([]);
        setStockError(err.message || 'Error loading stocks');
        // Optionally handle error (e.g., show notification)
      }
    }
    fetchStocks();
  }, []);

  // If a focusItemId is provided via query param, try to prefill and page to it
  useEffect(() => {
    try {
      const params = new URLSearchParams(location.search);
      const focusItemId = params.get('focusItemId');
      if (!focusItemId) return;
      // If stockOptions already loaded, find the item and prefill
      const tryPrefill = () => {
        const candidate = stockOptions.find(s => {
          return String(s.itemId || s._id || s.id) === String(focusItemId) || String(s.itemName) === String(focusItemId);
        });
        if (candidate) {
          // Prefill the order form with candidate data
          setInventoryForm(prev => ({
            ...prev,
            itemName: candidate.itemName || candidate.name || '',
            costPrice: candidate.costPrice || candidate.cost_price || '',
            sellingPrice: candidate.sellingPrice || candidate.selling_price || ''
          }));
          // Ensure the stock sheet page shows this item
          const index = stockOptions.findIndex(s => String(s.itemId || s._id || s.id) === String(focusItemId) || String(s.itemName) === String(focusItemId));
          if (index >= 0) {
            const page = Math.floor(index / itemsPerPage) + 1;
            setStockSheetPage(page);
            setViewMode('new-order');
          }
        }
      };
      // If stockOptions not yet loaded, wait until they are
      if (stockOptions && stockOptions.length > 0) {
        tryPrefill();
      } else {
        // watch for when stockOptions updates (one-time)
        const interval = setInterval(() => {
          if (stockOptions && stockOptions.length > 0) {
            tryPrefill();
            clearInterval(interval);
          }
        }, 200);
        // clear after some time
        setTimeout(() => clearInterval(interval), 5000);
      }
    } catch (e) {
      // ignore
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search, stockOptions]);
  const [inventoryForm, setInventoryForm] = useState({
    itemName: '',
    costPrice: '',
    sellingPrice: '',
    quantityOrdered: '',
    supplierName: '',
    supplierContact: '',
    dateOrdered: '',
    deliveryNote: ''
  });
  
  const [viewMode, setViewMode] = useState('new-order');
  const [stockSheetPage, setStockSheetPage] = useState(1);
  const [itemOrderedPage, setItemOrderedPage] = useState(1);
  const itemsPerPage = 10;

  // Ensure stockSheetPage stays within bounds when inventory changes
  useEffect(() => {
    const allItems = Object.values(inventory || {});
    const totalPages = Math.max(1, Math.ceil(allItems.length / itemsPerPage));
    if (stockSheetPage > totalPages) setStockSheetPage(totalPages);
    if (stockSheetPage < 1) setStockSheetPage(1);
  }, [inventory, stockSheetPage, itemsPerPage]);
  const [isSaving, setIsSaving] = useState(false);
  const [receiptsPage, setReceiptsPage] = useState(1);
  const receiptsPerPage = 5;
  
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

  // Load delivery attachments from backend when switching to delivery-notes-receipts
  useEffect(() => {
    async function loadDeliveryAttachments() {
      if (viewMode !== 'delivery-notes-receipts') return;
      setLoadingDeliveryAttachments(true);
      setDeliveryAttachmentsError('');
      try {
        const token = localStorage.getItem('authToken');
        // Fetch many attachments related to stock; server supports filtering
        const resp = await fetch('/api/attachments?entityType=stock&limit=1000', {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (!resp.ok) {
          throw new Error(`Failed to load attachments (status ${resp.status})`);
        }
        const json = await resp.json();
        const atts = (json && json.data && json.data.attachments) ? json.data.attachments : [];
        // Normalize attachments to include a download/view URL
        // build absolute backend URL for downloads to avoid dev-server proxy issues
  // Always point to backend on port 5000 for downloads in dev
  const backendOrigin = (window && window.location) ? `${window.location.protocol}//${window.location.hostname}:5000` : '';
        const normalized = atts.map(a => ({
          _id: a._id,
          entityId: a.entityId || null,
          name: a.originalName || a.fileName || 'Attachment',
          type: a.mimeType || 'application/octet-stream',
          size: a.fileSize || a.size || 0,
          dateOrdered: a.createdAt || a.uploadedAt || a.updatedAt,
          itemName: a.itemName || null,
          url: (backendOrigin ? `${backendOrigin}` : '') + `/api/attachments/download/${a._id}`,
          transactionId: a.transactionId || null
        }));
        setDeliveryAttachments(normalized);
      } catch (err) {
        setDeliveryAttachmentsError(err.message || 'Error loading attachments');
        setDeliveryAttachments([]);
      } finally {
        setLoadingDeliveryAttachments(false);
      }
    }
    loadDeliveryAttachments();
  }, [viewMode]);

  function getOrderTotal() {
    const total = itemOrdered.reduce(
      (total, product) => total + (Number(product.costPrice) * Number(product.quantityOrdered)),
      0
    );
    return formatCurrency(total);
  }
  const [showPopup, setShowPopup] = useState(false);
  
    const handleProcessTransaction = () => {
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 2000);
    };
  
    const [itemOrdered, setItemOrdered] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);
    const [showAttachmentModal, setShowAttachmentModal] = useState(false);
    const [currentAttachment, setCurrentAttachment] = useState(null);
    
  
    // Handle form input changes
    const handleInputChange = (field, value) => {
      setInventoryForm(prev => ({
        ...prev,
        [field]: value
      }));
    };

    function handleNewItemOrdered(event) {
      event.preventDefault();
      console.log('🔄 handleNewItemOrdered called');
      console.log('📋 Form data:', inventoryForm);
      console.log('📄 Selected file:', selectedFile);
      

      // Validation for creating NEW inventory item
      if (!inventoryForm.itemName || !inventoryForm.costPrice ||
          !inventoryForm.sellingPrice || !inventoryForm.quantityOrdered) {
        alert('Please fill in all required fields: Item Name, Cost Price, Selling Price, Quantity');
        return;
      }

      // Find the selected stock option to get the real itemId
      const selectedStock = stockOptions.find(stock => stock.itemName === inventoryForm.itemName);
      const realItemId = selectedStock ? selectedStock.itemId : undefined;

      // Create new inventory entry with real itemId
      const newItemOrdered = {
        itemId: realItemId,
        itemName: inventoryForm.itemName,
        dateOrdered: inventoryForm.dateOrdered || new Date().toISOString().split('T')[0],
        costPrice: parseFloat(inventoryForm.costPrice),
        sellingPrice: parseFloat(inventoryForm.sellingPrice),
        quantityOrdered: parseInt(inventoryForm.quantityOrdered),
        supplierName: inventoryForm.supplierName || 'Direct Purchase',
        supplierContact: inventoryForm.supplierContact || '',
        deliveryNote: inventoryForm.deliveryNote || '',
        // Keep the original File so the upload logic (instanceof File) runs later.
        attachment: selectedFile ? selectedFile : null,
        // Optionally include a preview URL for display
        attachmentPreview: selectedFile ? URL.createObjectURL(selectedFile) : null
      };

      setItemOrdered(prev => [...prev, newItemOrdered]);

      // Reset form
      setInventoryForm({
        dateOrdered: '',
        itemName: '',
        costPrice: '',
        sellingPrice: '',
        quantityOrdered: '',
        supplierName: '',
        supplierContact: '',
        deliveryNote: ''
      });
      setSelectedFile(null);
    }


    function handleFileChange(event) {
      const file = event.target.files[0];
      if (file) {
        const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
        if (validTypes.includes(file.type)) {
          setSelectedFile(file);
          handleInputChange('deliveryNote', file.name);
        } else {
          alert('Please select a valid file (PDF, JPG, PNG, or GIF)');
          event.target.value = '';
        }
      }
    }

    async function handleViewAttachment(attachment) {
      try {
        const { fetchAttachmentPreview } = await import('./utils/attachmentPreview');
        const att = { ...attachment };
        const result = await fetchAttachmentPreview(att);
        att.url = result.url;
        if (result.mimeType && !att.type) att.type = result.mimeType;
        att._revokePreview = result.revoke;
        setCurrentAttachment(att);
        setShowAttachmentModal(true);
      } catch (e) {
        // Fallback to previous behavior if helper import fails
        const att = { ...attachment };
        if (!att.url && att._id) att.url = `/api/attachments/download/${att._id}`;
        setCurrentAttachment(att);
        setShowAttachmentModal(true);
      }
    }

    function closeAttachmentModal() {
        // Revoke any created object URL to avoid memory leaks
        if (currentAttachment && currentAttachment._revokePreview) {
          try { currentAttachment._revokePreview(); } catch(e) {}
        }
        setShowAttachmentModal(false);
        setCurrentAttachment(null);
    }

    // Track transaction IDs by grouping items by a transactionId field (persisted in localStorage)
    function getAllOrderAttachments() {
      // Get transaction mapping from localStorage
      let transactionMap = {};
      let lastTransactionNumber = 0;
      try {
        transactionMap = JSON.parse(localStorage.getItem('transactionMap') || '{}');
        lastTransactionNumber = parseInt(localStorage.getItem('lastTransactionNumber') || '0', 10);
      } catch (e) {
        transactionMap = {};
        lastTransactionNumber = 0;
      }
      // Build a map of attachment._id to transactionId
      const attachmentToTransaction = {};
      Object.keys(transactionMap).forEach(refid => {
        (transactionMap[refid] || []).forEach(attId => {
          attachmentToTransaction[attId] = refid;
        });
      });
      // Now build the list for the table, and collect unknowns (attachments not mapped to a transaction)
      const allAttachments = [];
      const unknownGroups = {};
      Object.values(inventory).forEach(inventoryItem => {
        if (inventoryItem.attachments && inventoryItem.attachments.length > 0) {
          inventoryItem.attachments.forEach(attachment => {
            if (attachment._id && !attachment.isEmbedded) {
              const refid = attachmentToTransaction[attachment._id] || null;
              if (refid) {
                allAttachments.push({
                  itemName: inventoryItem.itemName,
                  itemId: inventoryItem.itemId,
                  dateOrdered: inventoryItem.lastUpdated,
                  deliveryNote: inventoryItem.deliveryNote,
                  attachment: {
                    _id: attachment._id,
                    name: attachment.originalName || attachment.fileName || attachment.name || 'Unknown File',
                    type: attachment.mimeType || attachment.type || 'Unknown Type',
                    size: attachment.size || attachment.fileSize || 0,
                    filePath: attachment.filePath || null,
                    isEmbedded: false
                  },
                  transactionId: refid
                });
              } else {
                // Group by lastUpdated timestamp (to the second) as a save instance
                const groupKey = inventoryItem.lastUpdated ? new Date(inventoryItem.lastUpdated).toISOString().slice(0,19) : '';
                if (!unknownGroups[groupKey]) unknownGroups[groupKey] = [];
                unknownGroups[groupKey].push({
                    itemName: inventoryItem.itemName,
                    itemId: inventoryItem.itemId,
                    dateOrdered: inventoryItem.lastUpdated,
                    deliveryNote: inventoryItem.deliveryNote,
                    attachment: {
                    _id: attachment._id,
                    name: attachment.originalName || attachment.fileName || attachment.name || 'Unknown File',
                    type: attachment.mimeType || attachment.type || 'Unknown Type',
                    size: attachment.size || attachment.fileSize || 0,
                    filePath: attachment.filePath || null,
                    isEmbedded: false
                  }
                });
              }
            }
          });
        }
      });
      // Assign a unique REFID to each unknown attachment, continuing from lastTransactionNumber
      Object.values(unknownGroups).forEach(group => {
        // Use the earliest dateOrdered in the group as the time for REFID
        let minDate = null;
        group.forEach(order => {
          if (order.dateOrdered) {
            const d = new Date(order.dateOrdered);
            if (!minDate || d < minDate) minDate = d;
          }
        });
        const isoTime = minDate ? new Date(minDate).toISOString().replace(/[:.]/g, '-') : Date.now();
        const refid = `REFID-${isoTime}`;
        group.forEach(order => {
          allAttachments.push({
            ...order,
            transactionId: refid
          });
        });
      });
      return allAttachments;
    }

  async function handleConfirmOrder() {

    if (itemOrdered.length === 0) {
      alert('No items to save. Please add items to your order first.');
      return;
    }

    setIsSaving(true);
    const token = localStorage.getItem('authToken');
    const newInventory = { ...inventory };

    // Helper to fetch current stock for an item. Prefer lookup by itemId when provided.
    async function fetchCurrentStock({ itemId, itemName }) {
      try {
        let url;
        if (itemId) {
          url = `/api/stock?itemId=${encodeURIComponent(itemId)}`;
        } else if (itemName) {
          url = `/api/stock?itemName=${encodeURIComponent(itemName)}`;
        } else {
          return null;
        }
        const response = await fetch(url, { headers: token ? { 'Authorization': `Bearer ${token}` } : {} });
        if (!response.ok) return null;
        const data = await response.json();
        // Assume backend returns array of items
        if (data && data.data && data.data.items && data.data.items.length > 0) {
          // Prefer exact matches when multiple returned
          const items = data.data.items;
          if (items.length === 1) return items[0];
          if (itemId) {
            const exact = items.find(it => it.itemId && it.itemId.toLowerCase() === itemId.toLowerCase());
            if (exact) return exact;
          }
          if (itemName) {
            const exactName = items.find(it => it.itemName && it.itemName.toLowerCase() === itemName.toLowerCase());
            if (exactName) return exactName;
          }
          return items[0];
        }
        return null;
      } catch (err) {
        return null;
      }
    }

    // Helper to update or create stock item
    async function upsertStockItem(stockData) {
      try {
        // This app only uses PUT /api/stock/byid/:id for "Save to Inventory" updates.
        if (!stockData._id) {
          console.error('No _id found for stockData, cannot update:', stockData);
          return false;
        }
        const url = `/api/stock/byid/${encodeURIComponent(stockData._id)}`;
        const response = await fetch(url, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify(stockData)
        });
        const respText = await response.text();
        let respJson = null;
        try { respJson = JSON.parse(respText); } catch (e) {}
        console.log(`[DEBUG] upsertStockItem PUT ${url} status:`, response.status, 'response:', respJson || respText);
        return response.ok;
      } catch (err) {
        console.error('[DEBUG] upsertStockItem error:', err);
        return false;
      }
    }


  // Generate a transactionId for this Save action (used to link attachments)
  const transactionId = `REF-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;

  // Process each ordered item with weighted average calculation
  for (const orderedItem of itemOrdered) {
      // Ensure supplier saved separately if supplierName provided and not the default label
      if (orderedItem.supplierName && orderedItem.supplierName.trim() !== '' && orderedItem.supplierName !== 'Direct Purchase') {
        try {
          const resp = await fetch('/api/suppliers/simple', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify({ supplierName: orderedItem.supplierName, phoneNumber: orderedItem.supplierContact || '' })
          });

          if (!resp.ok) {
            let body;
            try { body = await resp.json(); } catch (e) { body = await resp.text(); }
            console.warn('Could not save supplier (server):', resp.status, body);
          } else {
            try { const json = await resp.json(); console.log('Supplier saved:', json); } catch(e) { console.log('Supplier saved (no json body)'); }
          }
        } catch (e) {
          console.warn('Could not save supplier (network):', e && e.message);
        }
        // If parent provided setSuppliers, try to append the created supplier for immediate UI feedback
        try {
          if (resp && resp.ok) {
            let json = null;
            try { json = await resp.json(); } catch (e) { json = null; }
            const created = json && json.data && json.data.supplier ? json.data.supplier : (json && json.data && json.data.suppliers ? json.data.suppliers[0] : null);
            if (created && typeof props.setSuppliers === 'function') {
              props.setSuppliers(prev => Array.isArray(prev) ? [created, ...prev] : [created]);
            }
          }
        } catch (e) {
          // non-fatal
        }
      }
      // Upload attachment separately (if file provided as selectedFile or embedded in orderedItem)
      let attachmentId = null;
      if (orderedItem.attachment && orderedItem.attachment instanceof File) {
        try {
          const form = new FormData();
          form.append('attachments', orderedItem.attachment, orderedItem.attachment.name);
          form.append('entityType', 'stock');
          // entityId unknown until put; backend allows post then link later via attachment update
          form.append('entityId', '');
          form.append('transactionId', transactionId);
          const attResp = await fetch('/api/attachments', {
            method: 'POST',
            headers: {
              ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: form
          });
          if (attResp.ok) {
            const attJson = await attResp.json();
            if (attJson && attJson.data && attJson.data.attachments && attJson.data.attachments[0]) attachmentId = attJson.data.attachments[0]._id;
          } else {
            // Try to read JSON error body for debugging
            try {
              const errBody = await attResp.json();
              console.warn('Attachment upload failed, server response:', errBody);
            } catch (e) {
              const txt = await attResp.text();
              console.warn('Attachment upload failed, response text:', txt);
            }
          }
        } catch (e) {
          console.warn('Attachment upload failed (non-fatal):', e && e.message);
        }
      }
      // For each item, prefer checking by itemId (if provided), otherwise by itemName
      const backendStock = await fetchCurrentStock({ itemId: orderedItem.itemId, itemName: orderedItem.itemName });
      const _id = backendStock && backendStock._id ? backendStock._id : undefined;
      const itemId = backendStock && backendStock.itemId ? backendStock.itemId : orderedItem.itemId;
      const isNew = !backendStock;
      if (!isNew && !_id && !itemId) {
        console.error('No _id or itemId found for ordered item:', orderedItem);
        continue;
      }
      const initialStock = backendStock && backendStock.currentStock ? Number(backendStock.currentStock) : 0;
      const orderQuantity = Number(orderedItem.quantityOrdered);
      const costPrice = Number(orderedItem.costPrice);
      const sellingPrice = Number(orderedItem.sellingPrice);
      const prevAvgCostPrice = backendStock && backendStock.avgCostPrice ? Number(backendStock.avgCostPrice) : costPrice;
      const prevAvgSellingPrice = backendStock && backendStock.avgSellingPrice ? Number(backendStock.avgSellingPrice) : sellingPrice;
      const currentStock = initialStock + orderQuantity;

      // Weighted average calculation
      const newAvgCostPrice = currentStock > 0
        ? ((prevAvgCostPrice * initialStock) + (costPrice * orderQuantity)) / currentStock
        : costPrice;
      const newAvgSellingPrice = currentStock > 0
        ? ((prevAvgSellingPrice * initialStock) + (sellingPrice * orderQuantity)) / currentStock
        : sellingPrice;

      const stockValue = newAvgCostPrice * currentStock;
      const projectedProfit = (newAvgSellingPrice * currentStock) - (newAvgCostPrice * currentStock);

      // Prepare stock data for backend
      const stockData = {
        _id, // must be present for PUT
        itemId,
        itemName: orderedItem.itemName,
        costPrice,
        sellingPrice,
        orderQuantity,
        supplierName: orderedItem.supplierName,
        supplierContact: orderedItem.supplierContact,
        dateOrdered: orderedItem.dateOrdered,
        deliveryNote: orderedItem.deliveryNote,
        attachment: orderedItem.attachment || null,
        transactionId
      };

      // Update or create stock in backend
  await upsertStockItem(stockData, isNew);

      // Fetch the latest stock item from backend to get updated _id, itemId, and updatedAt
      // (No-op here, will fetch all after loop)
    }

    setInventory(newInventory);
    // Always fetch latest inventory from backend after saving
    async function fetchAllStocksAfterSave() {
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch('/api/stock?page=1&limit=1000', {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (!response.ok) return;
        const data = await response.json();
        if (data && data.data && data.data.items) {
          const inventoryObj = {};
          data.data.items.forEach(item => {
            inventoryObj[item.itemId] = item;
          });
          setInventory(inventoryObj);
        }
      } catch (err) {
        // Optionally handle error
      }
    }
    await fetchAllStocksAfterSave();
    setItemOrdered([]);
    setShowPopup(true);
    setTimeout(() => setShowPopup(false), 2000);
    setIsSaving(false);
  }

  function getAllLocalAttachments() {
    // Flatten all attachments from inventory
    const attachments = [];
    Object.values(inventory).forEach(item => {
      if (item.attachment) {
        // If attachment is a File object, expose the fields and a preview URL
        if (item.attachment instanceof File) {
          attachments.push({
            _id: null,
            name: item.attachment.name,
            type: item.attachment.type,
            size: item.attachment.size,
            url: item.attachmentPreview || URL.createObjectURL(item.attachment),
            itemName: item.itemName,
            dateOrdered: item.dateOrdered,
            itemId: item.itemId,
            transactionId: null
          });
        } else {
          attachments.push({
            ...item.attachment,
            itemName: item.itemName,
            dateOrdered: item.dateOrdered,
            itemId: item.itemId,
          });
        }
      }
    });
    return attachments;
  }

  return (
      <div className="order-container">
        {showPopup && (
          <div className="custom-popup">Order confirmed successfully!</div>
        )}

        <div className="sales-options">
          <div>
            <button className="sales-btn" onClick={() => setViewMode('new-order')}>New Order</button>
          </div>
          <div>
            <button className="sales-btn" onClick={() => setViewMode('stock-sheet')}>View Stock-sheet</button>
          </div>
          {/* <div>
            <button className="sales-btn" onClick={() => setViewMode('delivery-notes-receipts')}>Delivery Notes & Receipts</button>
          </div> */}
          
        </div>

       {viewMode === 'new-order' && (
        <div className="add-item-container">  
                
          <div className="transaction-left-container">
            <h4>Order preview:</h4>
            <div className="stocksheet-items">
              <h2 className="item">Item</h2>
              <h2 className="cost-price">Cost Price</h2>
              <h2 className="selling-price">Quantity</h2>
              <h2 className="stock-value">Sub-Total</h2>
              <h2 className="stock-value">Action</h2>
            </div>

            {/* Scrollable container for items ordered */}
            <div style={{
              maxHeight: '400px',
              overflowY: 'auto',
              overflowX: 'hidden',
              marginBottom: '1rem',
              border: '1px solid #e5e5e5',
              borderRadius: '8px',
              backgroundColor: 'white',
              padding: itemOrdered.length > 0 ? '0.5rem' : '0'
            }}>
              {itemOrdered.length === 0 ? (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '2rem', 
                  color: '#666',
                  fontStyle: 'italic' 
                }}>
                  No items added to order yet
                </div>
              ) : (
                itemOrdered.map((productOrdered, index) => (
                  <div className="item-info" key={index}>
                    <p className="item">{productOrdered.itemName}</p>
                    <p className="cost-price">{formatCurrency(productOrdered.costPrice)}</p>
                    <p className="selling-price">{productOrdered.quantityOrdered}</p>
                    <div className="stock-value" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      <button
                        onClick={() => {
                          const updatedItems = itemOrdered.filter((_, i) => i !== index);
                          setItemOrdered(updatedItems);
                        }}
                        style={{
                          backgroundColor: '#dc3545',
                          border: 'none',
                          padding: '4px 8px',
                          color: 'white',
                          fontSize: '0.8rem',
                          fontWeight: 'normal',
                          fontFamily: 'Arial, sans-serif',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          minWidth: 'auto',
                          width: 'auto'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = '#c82333';
                          e.target.style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = '#dc3545';
                          e.target.style.transform = 'scale(1)';
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="order-total-display">
              <h3>Transaction total:</h3>
              <p>{getOrderTotal()}</p>
            </div>

            <button 
              className="confirm-order-button" 
              onClick={(e) => {
                console.log('🔄 Save to Inventory button clicked');
                console.log('📦 Items in order:', itemOrdered.length);
                console.log('🔒 Is saving:', isSaving);
                handleConfirmOrder();
              }}
              disabled={itemOrdered.length === 0 || isSaving}
              style={{
                opacity: (itemOrdered.length === 0 || isSaving) ? 0.5 : 1,
                cursor: (itemOrdered.length === 0 || isSaving) ? 'not-allowed' : 'pointer',
                backgroundColor: (itemOrdered.length === 0 || isSaving) ? '#6c757d' : '#28a745',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '5px',
                fontSize: '1rem',
                fontWeight: 'bold',
                fontFamily: 'Arial, sans-serif',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (itemOrdered.length > 0 && !isSaving) {
                  e.target.style.backgroundColor = '#218838';
                  e.target.style.transform = 'scale(1.02)';
                }
              }}
              onMouseLeave={(e) => {
                if (itemOrdered.length > 0 && !isSaving) {
                  e.target.style.backgroundColor = '#28a745';
                  e.target.style.transform = 'scale(1)';
                }
              }}
              title={itemOrdered.length === 0 ? 'Add items to your order before saving to inventory' : isSaving ? 'Saving to database...' : 'Save all order items to inventory permanently'}
            >
              {itemOrdered.length === 0 ? 'No Items to Save' : isSaving ? 'Saving...' : 'Save to Inventory'}
            </button>
          </div>

          <div className="transaction-right-container">
            {/* Current Stock Reference */}
            <div className="inventory-reference" style={{
              margin: '10px 0',
              padding: '10px',
              backgroundColor: '#f8f9fa',
              border: '1px solid #dee2e6',
              borderRadius: '5px',
              fontSize: '1rem',
              fontFamily: 'Arial, sans-serif',              
            }}>
              <strong>📦 Current Stock ({Object.keys(inventory).length} items):</strong>
              {Object.keys(inventory).length > 0 ? (
                <div style={{ maxHeight: '60px', overflowY: 'auto', marginTop: '5px' }}>
                  {Object.values(inventory).map((item, index) => (
                    <span key={index} style={{ 
                      display: 'inline-block', 
                      margin: '2px 4px', 
                      padding: '2px 6px', 
                      backgroundColor: '#e9ecef', 
                      borderRadius: '3px',
                      fontSize: '0.9rem'
                    }}>
                      {item.itemName || 'Unnamed'} ({item.currentStock} units)
                    </span>
                  ))}
                </div>
              ) : (
                <span style={{ color: '#6c757d', fontStyle: 'italic' }}> No items in stock yet</span>
              )}
              <div style={{ fontSize: '0.7rem', color: '#6c757d', marginTop: '5px', fontStyle: 'italic' }}>
                💡 Create NEW items here. Use Sales & Expenditures to sell existing items.
              </div>
            </div>

            <form onSubmit={handleNewItemOrdered}>
              <input 
                className="order-input-field" 
                type="date" 
                value={inventoryForm.dateOrdered} 
                onChange={(e) => handleInputChange('dateOrdered', e.target.value)}
                required
              />

              {/* Item Selection - From stocks collection (backend) */}
              {stockError && (
                <div style={{ color: 'red', marginBottom: '0.5rem', fontSize: '0.95rem' }}>
                  {stockError}
                </div>
              )}
              <select 
                className="select-item" 
                value={inventoryForm.itemName} 
                onChange={(e) => handleInputChange('itemName', e.target.value)}
                required
                disabled={!!stockError}
              >
                <option value="">Select Item Name</option>
                {stockOptions.map((stock, idx) => (
                  <option key={stock._id || stock.id || idx} value={stock.itemName}>{stock.itemName}</option>
                ))}
              </select>

              {/* Order Quantity */}
              <input 
                className="order-input-field" 
                placeholder="Order quantity" 
                type="number" 
                min="1" 
                value={inventoryForm.quantityOrdered} 
                onChange={(e) => handleInputChange('quantityOrdered', e.target.value)}
                required
              />

              {/* Cost Price */}
              <input 
                className="order-input-field" 
                placeholder="Cost price per item" 
                type="number" 
                step="0.01" 
                min="0" 
                value={inventoryForm.costPrice} 
                onChange={(e) => handleInputChange('costPrice', e.target.value)}
                required
              />

              {/* Selling Price */}
              <input 
                className="order-input-field" 
                placeholder="Selling price per item" 
                type="number" 
                step="0.01" 
                min="0" 
                value={inventoryForm.sellingPrice} 
                onChange={(e) => handleInputChange('sellingPrice', e.target.value)}
                required
              />

              {/* Supplier Information */}
              <input 
                className="order-input-field" 
                placeholder="Supplier name" 
                value={inventoryForm.supplierName} 
                onChange={(e) => handleInputChange('supplierName', e.target.value)}
              />

              <input 
                className="order-input-field" 
                placeholder="Supplier contact" 
                type="tel" 
                value={inventoryForm.supplierContact} 
                onChange={(e) => handleInputChange('supplierContact', e.target.value)}
              />           

            {(() => {
              // By default hide the attachment UI in NewOrder until a
              // payment-mode or explicit prop is wired to control visibility.
              // To re-enable, replace `false` with a condition such as
              // `!['Credit','Mobile Transfer','Cash'].includes(inventoryForm.paymentMode)`
              const showAttachment = false;
              if (!showAttachment) return null;

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%', marginTop: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontFamily: 'Arial, sans-serif', fontSize: '1rem' }}>
                    Attach Delivery Note or Receipt
                  </label>
                  <div style={{ position: 'relative', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input 
                      type="file" 
                      accept=".pdf,.jpg,.jpeg,.png,.gif"
                      onChange={handleFileChange}
                      id="file-input-order"
                      style={{ display: 'none' }}
                    />
                    <label 
                      htmlFor="file-input-order"
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
                        type="button"
                        onClick={() => {
                          setSelectedFile(null);
                          setDeliveryNote("");
                          // Reset the file input
                          const fileInput = document.getElementById('file-input-order');
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
                    <p style={{ fontSize: '0.9rem', color: '#666', margin: '0', fontFamily: 'Arial, sans-serif' }}>
                      Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                    </p>
                  )}
                </div>
              );
            })()}

              <button 
                className="add-item-button" 
                type="submit"
                style={{
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '5px',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  fontFamily: 'Arial, sans-serif',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  width: '100%',
                  marginTop: '1rem'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#0056b3';
                  e.target.style.transform = 'scale(1.02)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#007bff';
                  e.target.style.transform = 'scale(1)';
                }}
              >
                Add to Order
              </button>
            </form>
          </div>
        </div>
       )}         
        
      <div>         

      </div>
      {viewMode === 'stock-sheet' && (
        <div className="stocksheet-container">          
          <div className="stocksheet-title">
            <h2>Stock-sheet Review</h2>
          </div>
          <div className="stocksheet-mini-container">        

            <div className="stocksheet-information">
              <div className="stocksheet-items">
                <h2 className="item">Item ID</h2>
                <h2 className="item">Item Name</h2>
                <h2 className="cost-price">Avg Cost Price</h2>
                <h2 className="selling-price">Avg Selling Price</h2>
                <h2 className="quantity-available">Current Stock</h2>
                <h2 className="stock-value">Stock Value</h2>
                <h2 className="stock-value">Projected Profit</h2>
                <h2 className="stock-value">Last Updated</h2>
              </div>

              {console.log('🖼️ Rendering stocksheet with', Object.values(inventory).length, 'items')}
              {Object.values(inventory).length === 0 && <p>No inventory items to display</p>}
              {(() => {
                const source = Object.values(inventory || {});
                const perPage = itemsPerPage;
                const totalPages = Math.max(1, Math.ceil(source.length / perPage));
                const currentPage = Math.max(1, Math.min(stockSheetPage, totalPages));
                const paginatedDocuments = source.slice((currentPage - 1) * perPage, currentPage * perPage);

                if (source.length === 0) {
                  return (
                    <div className="item-info"><p className="item">No inventory items to display</p></div>
                  );
                }

                return (
                  <>
                    {paginatedDocuments.map((inventoryItem, index) => {
                      const itemId = inventoryItem.itemId || inventoryItem._id || `idx-${index}`;
                      const avgCostPrice = formatCurrency(inventoryItem.avgCostPrice || 0);
                      const avgSellingPrice = formatCurrency(inventoryItem.avgSellingPrice || 0);
                      const stockValue = formatCurrency((Number(inventoryItem.avgCostPrice || 0) * Number(inventoryItem.currentStock || 0)));
                      const projectedProfit = formatCurrency((Number(inventoryItem.avgSellingPrice || 0) * Number(inventoryItem.currentStock || 0)) - (Number(inventoryItem.avgCostPrice || 0) * Number(inventoryItem.currentStock || 0)));
                      const lastUpdated = inventoryItem.updatedAt
                        ? new Date(inventoryItem.updatedAt).toLocaleDateString()
                        : (inventoryItem.lastStockUpdate ? new Date(inventoryItem.lastStockUpdate).toLocaleDateString() : 'N/A');

                      return (
                        <div className="item-info" key={itemId}>
                          <p className="item">{itemId}</p>
                          <p className="item">{inventoryItem.itemName}</p>
                          <p className="cost-price">{inventoryItem.costPrice}</p>
                          <p className="selling-price">{inventoryItem.sellingPrice}</p>
                          <p className="quantity-available">{inventoryItem.currentStock || 0}</p>
                          <p className="stock-value">{inventoryItem.stockValue}</p>
                          <p className="stock-value">{inventoryItem.projectedProfit}</p>
                          <p className="stock-value">{lastUpdated}</p>
                        </div>
                      );
                    })}

                    {/* Pagination Controls (delivery-notes style) */}
                    {totalPages > 1 && (
                      <div style={{ gridColumn: '1 / -1', padding: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                        <button
                          onClick={() => setStockSheetPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          style={{ padding: '0.5rem 1rem', backgroundColor: currentPage === 1 ? '#e9ecef' : '#007bff', color: currentPage === 1 ? '#6c757d' : 'white', border: 'none', borderRadius: '4px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                        >
                          ← Previous
                        </button>

                        <span style={{ fontWeight: 'bold' }}>Page {currentPage} of {totalPages}</span>

                        <button
                          onClick={() => setStockSheetPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                          style={{ padding: '0.5rem 1rem', backgroundColor: currentPage === totalPages ? '#e9ecef' : '#007bff', color: currentPage === totalPages ? '#6c757d' : 'white', border: 'none', borderRadius: '4px', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
                        >
                          Next →
                        </button>
                      </div>
                    )}
                  </>
                );
              })()}

              {/* Pagination will be rendered at the bottom of the sheet */}
              
              {Object.keys(inventory).length === 0 && (
                <div className="item-info">
                  <p className="item">No inventory items confirmed yet</p>
                </div>
              )}
          
            </div>   
          </div>

        </div>
      )}

      {false && (
        <div className="stocksheet-container">          
            <div className="stocksheet-title">
              <h2>Delivery Notes & Receipts</h2>
            </div>
            <div className="stocksheet-mini-container">        
              <div className="stocksheet-information">
                <div className="stocksheet-items">
                  <h2 className="selling-price">Date Saved</h2>
                  <h2 className="item">Attachment</h2>                
                  <h2 className="quantity-available">Actions</h2>
                </div>
                {/* Pagination for Delivery Notes/Receipts */}
                {(() => {
                  // Prefer server-provided deliveryAttachments; fall back to local attachments
                  const source = (deliveryAttachments && deliveryAttachments.length > 0) ? deliveryAttachments : getAllLocalAttachments();
                  if (loadingDeliveryAttachments) {
                    return (
                      <div className="item-info"><p className="item">Loading attachments...</p></div>
                    );
                  }
                  if (deliveryAttachmentsError) {
                    return (
                      <div className="item-info"><p className="item">Error loading attachments: {deliveryAttachmentsError}</p></div>
                    );
                  }
                  const perPage = receiptsPerPageOption || receiptsPerPage;
                  const totalReceiptsPages = Math.ceil(source.length / perPage);
                  const paginatedDocuments = source.slice((receiptsPage - 1) * perPage, receiptsPage * perPage);
                  if (source.length === 0) {
                    return (
                      <div className="item-info">
                        <p className="item">No delivery notes or receipts yet</p>
                      </div>
                    );
                  }
                  return (
                    <>
                      {paginatedDocuments.map((doc, idx) => {
                        // Resolve linked inventory item by entityId (which should be stock _id) or by transaction mapping
                        let linkedItemName = doc.itemName || '';
                        let linkedItemId = doc.entityId || null;
                        if (doc.entityId) {
                          // Try to find in stockOptions by _id or itemId
                          const foundById = stockOptions.find(s => s._id === doc.entityId || s.itemId === doc.entityId);
                          if (foundById) {
                            linkedItemName = foundById.itemName || linkedItemName;
                            linkedItemId = foundById.itemId || linkedItemId;
                          } else if (inventory && Object.keys(inventory).length > 0) {
                            // inventory is keyed by itemId; try to find a matching item by _id
                            const invFound = Object.values(inventory).find(i => i._id === doc.entityId || i.itemId === doc.entityId);
                            if (invFound) {
                              linkedItemName = invFound.itemName || linkedItemName;
                              linkedItemId = invFound.itemId || linkedItemId;
                            }
                          }
                        } else if (doc.transactionId) {
                          // Find any stockOptions whose attachments include this transactionId (best-effort)
                          const byTxn = stockOptions.find(s => (s.attachments || []).some(a => a.transactionId === doc.transactionId));
                          if (byTxn) {
                            linkedItemName = byTxn.itemName || linkedItemName;
                            linkedItemId = byTxn.itemId || linkedItemId;
                          }
                        }

                        return (
                        <div className="item-info" key={doc._id || idx}>
                          <p className="selling-price">
                            {doc.dateOrdered
                              ? new Date(doc.dateOrdered).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                })
                              : 'Unknown Date'}
                          </p>
                          <p className="item" style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                            <span style={{ fontWeight: 'bold' }}>{doc.name || doc.originalName || doc.name}</span>
                            <span style={{ fontSize: '0.8rem', color: '#666' }}>
                              {linkedItemName ? `${linkedItemName} (${linkedItemId || 'id?'}) • ` : ''}{doc.type || doc.mimeType || ''} • {((doc.size || doc.fileSize || 0) / 1024).toFixed(1)} KB
                            </span>
                          </p>
                          <p className="quantity-available" style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', alignItems: 'center' }}>
                            <button
                              className="view-attachment-button"
                              onClick={() => handleViewAttachment(doc)}
                              style={{
                                backgroundColor: '#2e8bff',
                                color: 'white',
                                border: 'none',
                                padding: '0.5rem 1rem',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.9rem',
                                fontWeight: 'normal',
                                fontFamily: 'Arial, sans-serif',
                                transition: 'all 0.2s ease',
                              }}
                            >
                              View
                            </button>
                            <button
                              onClick={async () => {
                                try {
                                  const { fetchAttachmentPreview } = await import('./utils/attachmentPreview');
                                  const result = await fetchAttachmentPreview(doc);
                                  if (result.source === 'blob') {
                                    const url = result.url;
                                    const a = window.document.createElement('a');
                                    a.href = url;
                                    a.download = doc.name || (doc.originalName || ('attachment-' + doc._id));
                                    window.document.body.appendChild(a);
                                    a.click();
                                    a.remove();
                                    // Delay revoking the object URL to ensure the browser has time to start the download
                                    try { setTimeout(() => { result.revoke(); }, 2000); } catch (e) { /* ignore */ }
                                  } else {
                                    // Fallback: open the auth-backed preview URL returned by helper
                                    try {
                                      // Try opening the helper URL in a new tab, but also attempt an authenticated fetch
                                      // to download instead of letting the browser follow a possibly unauthenticated link.
                                      const token = (typeof localStorage !== 'undefined') ? localStorage.getItem('authToken') : null;
                                      const fetchOpts = { headers: token ? { 'Authorization': `Bearer ${token}` } : {} };
                                      try {
                                        const fetchResp = await fetch(result.url, fetchOpts);
                                        if (fetchResp.ok) {
                                          const ctype = fetchResp.headers.get('content-type') || '';
                                          if (!ctype.includes('text/html')) {
                                            const blob = await fetchResp.blob();
                                            const objectUrl = URL.createObjectURL(blob);
                                            const a = window.document.createElement('a');
                                            a.href = objectUrl;
                                            a.download = doc.name || (doc.originalName || ('attachment-' + doc._id));
                                            window.document.body.appendChild(a);
                                            a.click();
                                            a.remove();
                                            setTimeout(() => { try { URL.revokeObjectURL(objectUrl); } catch(e) {} }, 2000);
                                          } else {
                                            // server returned HTML — open preview in new tab as a last resort
                                            window.open(result.url, '_blank');
                                          }
                                        } else {
                                          // fetch failed — open preview as a fallback
                                          window.open(result.url, '_blank');
                                        }
                                      } catch (e) {
                                        // network/fetch error — open preview link in new tab
                                        window.open(result.url, '_blank');
                                      }
                                    } catch (e) {
                                      // As an absolute last resort, open the unauthenticated download endpoint
                                      window.open(`/api/attachments/download/${doc._id}`, '_blank');
                                    }
                                  }
                                } catch (e) {
                                  console.error('Download error', e);
                                  alert('Download error: ' + (e && e.message));
                                }
                              }}
                              style={{
                                backgroundColor: '#28a745',
                                color: 'white',
                                border: 'none',
                                padding: '0.5rem 1rem',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.9rem'
                              }}
                              onMouseEnter={e => e.target.style.backgroundColor = '#218838'}
                              onMouseLeave={e => e.target.style.backgroundColor = '#28a745'}
                            >
                              Download
                            </button>
                            <button
                              onClick={async () => {
                                // Delete attachment from server and update UI
                                if (!doc._id) {
                                  alert('Cannot delete embedded/local attachment');
                                  return;
                                }
                                if (!confirm('Delete this attachment? This will remove the file from the server.')) return;
                                try {
                                  const token = localStorage.getItem('authToken');
                                  const resp = await fetch(`/api/attachments/${encodeURIComponent(doc._id)}`, {
                                    method: 'DELETE',
                                    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
                                  });
                                  if (!resp.ok) {
                                    const body = await resp.json().catch(() => null);
                                    alert('Delete failed: ' + (body && body.message ? body.message : resp.status));
                                    return;
                                  }
                                  // Remove from local state
                                  setDeliveryAttachments(prev => prev.filter(a => a._id !== doc._id));
                                  // If currently viewing this attachment, close modal
                                  if (currentAttachment && currentAttachment._id === doc._id) {
                                    closeAttachmentModal();
                                  }
                                } catch (e) {
                                  console.error('Delete error', e);
                                  alert('Delete error: ' + (e && e.message));
                                }
                              }}
                              style={{
                                backgroundColor: '#dc3545',
                                color: 'white',
                                border: 'none',
                                padding: '0.5rem 1rem',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.9rem'
                              }}
                              onMouseEnter={e => e.target.style.backgroundColor = '#c82333'}
                              onMouseLeave={e => e.target.style.backgroundColor = '#dc3545'}
                            >
                              Delete
                            </button>
                          </p>
                        </div>
                      );
                      })}
                      {/* Pagination Controls for Delivery Notes/Receipts */}
                      {totalReceiptsPages > 1 && (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginTop: '20px', padding: '10px' }}>
                          <button
                            onClick={() => setReceiptsPage(receiptsPage - 1)}
                            disabled={receiptsPage <= 1}
                            style={{
                              padding: '8px 12px',
                              border: '1px solid #ccc',
                              borderRadius: '4px',
                              backgroundColor: receiptsPage <= 1 ? '#f5f5f5' : 'white',
                              cursor: receiptsPage <= 1 ? 'not-allowed' : 'pointer',
                              color: receiptsPage <= 1 ? '#999' : '#333',
                            }}
                          >
                            Previous
                          </button>
                          <span style={{ fontSize: '14px', color: '#666', fontWeight: '500' }}>
                            Page {receiptsPage} of {totalReceiptsPages} ({source.length} documents)
                          </span>
                          <select value={receiptsPerPageOption} onChange={(e) => { setReceiptsPerPageOption(Number(e.target.value)); setReceiptsPage(1); }} style={{ marginLeft: '8px', padding: '6px' }}>
                            <option value={5}>5 / page</option>
                            <option value={10}>10 / page</option>
                          </select>
                          <button
                            onClick={() => setReceiptsPage(receiptsPage + 1)}
                            disabled={receiptsPage >= totalReceiptsPages}
                            style={{
                              padding: '8px 12px',
                              border: '1px solid #ccc',
                              borderRadius: '4px',
                              backgroundColor: receiptsPage >= totalReceiptsPages ? '#f5f5f5' : 'white',
                              cursor: receiptsPage >= totalReceiptsPages ? 'not-allowed' : 'pointer',
                              color: receiptsPage >= totalReceiptsPages ? '#999' : '#333',
                            }}
                          >
                            Next
                          </button>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
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
                fontSize: '1.2rem',
                fontFamily: 'Arial, sans-serif'
              }}
            >
              ×
            </button>
            
            <h3 style={{ marginTop: 0, marginBottom: '1rem', fontFamily: 'Arial, sans-serif' }}>
              {currentAttachment.name}
            </h3>
            
            <div style={{ marginBottom: '1rem', color: '#666', fontFamily: 'Arial, sans-serif'  }}>
              Type: {currentAttachment.type} • Size: {(currentAttachment.size / 1024).toFixed(1)} KB
            </div>
            
            {currentAttachment.type.startsWith('image/') ? (
              <img 
                src={currentAttachment.url} 
                alt={currentAttachment.name}
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: '600px',
                  objectFit: 'contain'
                }}
              />
            ) : currentAttachment.type === 'application/pdf' ? (
              <div style={{ textAlign: 'center', fontFamily: 'Arial, sans-serif' }}>
                <p>PDF files can be downloaded for viewing.</p>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                  <button
                    onClick={async () => {
                      try {
                        const { fetchAttachmentPreview } = await import('./utils/attachmentPreview');
                        const result = await fetchAttachmentPreview(currentAttachment);
                        if (result.source === 'blob') {
                          const a = window.document.createElement('a');
                          a.href = result.url;
                          a.download = currentAttachment.name || ('attachment-' + currentAttachment._id);
                          window.document.body.appendChild(a);
                          a.click();
                          a.remove();
                          try { setTimeout(() => { result.revoke(); }, 2000); } catch (e) { /* ignore */ }
                        } else {
                          try {
                            const token = (typeof localStorage !== 'undefined') ? localStorage.getItem('authToken') : null;
                            const fetchOpts = { headers: token ? { 'Authorization': `Bearer ${token}` } : {} };
                            const fetchResp = await fetch(result.url, fetchOpts);
                            if (fetchResp.ok) {
                              const ctype = fetchResp.headers.get('content-type') || '';
                              if (!ctype.includes('text/html')) {
                                const blob = await fetchResp.blob();
                                const objectUrl = URL.createObjectURL(blob);
                                const a = window.document.createElement('a');
                                a.href = objectUrl;
                                a.download = currentAttachment.name || ('attachment-' + currentAttachment._id);
                                window.document.body.appendChild(a);
                                a.click();
                                a.remove();
                                setTimeout(() => { try { URL.revokeObjectURL(objectUrl); } catch(e) {} }, 2000);
                              } else {
                                window.open(result.url, '_blank');
                              }
                            } else {
                              window.open(result.url, '_blank');
                            }
                          } catch (e) {
                            window.open(result.url, '_blank');
                          }
                        }
                      } catch (e) {
                        console.error('Download PDF error', e);
                        alert('Download error: ' + (e && e.message));
                      }
                    }}
                    style={{
                      display: 'inline-block',
                      padding: '0.75rem 1.5rem',
                      backgroundColor: '#2e8bff',
                      color: 'white',
                      textDecoration: 'none',
                      borderRadius: '4px',
                      marginTop: '1rem',
                      fontFamily: 'Arial, sans-serif'
                    }}
                  >
                    Download PDF
                  </button>
                  <button
                    onClick={async () => {
                      if (!currentAttachment._id) { alert('Cannot delete local attachment'); return; }
                      if (!confirm('Delete this attachment?')) return;
                      try {
                        const token = localStorage.getItem('authToken');
                        const resp = await fetch(`/api/attachments/${encodeURIComponent(currentAttachment._id)}`, {
                          method: 'DELETE',
                          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
                        });
                        if (!resp.ok) {
                          const body = await resp.json().catch(() => null);
                          alert('Delete failed: ' + (body && body.message ? body.message : resp.status));
                          return;
                        }
                        setDeliveryAttachments(prev => prev.filter(a => a._id !== currentAttachment._id));
                        closeAttachmentModal();
                      } catch (e) {
                        console.error('Delete error', e);
                        alert('Delete error: ' + (e && e.message));
                      }
                    }}
                    style={{
                      display: 'inline-block',
                      padding: '0.75rem 1.5rem',
                      backgroundColor: '#dc3545',
                      color: 'white',
                      textDecoration: 'none',
                      borderRadius: '4px',
                      marginTop: '1rem',
                      fontFamily: 'Arial, sans-serif'
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', fontFamily: 'Arial, sans-serif' }}>
                <p>This file type cannot be previewed.</p>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                  <button
                    onClick={async () => {
                      try {
                        const { fetchAttachmentPreview } = await import('./utils/attachmentPreview');
                        const result = await fetchAttachmentPreview(currentAttachment);
                        if (result.source === 'blob') {
                          const a = window.document.createElement('a');
                          a.href = result.url;
                          a.download = currentAttachment.name || ('attachment-' + currentAttachment._id);
                          window.document.body.appendChild(a);
                          a.click();
                          a.remove();
                          try { setTimeout(() => { result.revoke(); }, 2000); } catch (e) { /* ignore */ }
                        } else {
                          try {
                            const token = (typeof localStorage !== 'undefined') ? localStorage.getItem('authToken') : null;
                            const fetchOpts = { headers: token ? { 'Authorization': `Bearer ${token}` } : {} };
                            const fetchResp = await fetch(result.url, fetchOpts);
                            if (fetchResp.ok) {
                              const ctype = fetchResp.headers.get('content-type') || '';
                              if (!ctype.includes('text/html')) {
                                const blob = await fetchResp.blob();
                                const objectUrl = URL.createObjectURL(blob);
                                const a = window.document.createElement('a');
                                a.href = objectUrl;
                                a.download = currentAttachment.name || ('attachment-' + currentAttachment._id);
                                window.document.body.appendChild(a);
                                a.click();
                                a.remove();
                                setTimeout(() => { try { URL.revokeObjectURL(objectUrl); } catch(e) {} }, 2000);
                              } else {
                                window.open(result.url, '_blank');
                              }
                            } else {
                              window.open(result.url, '_blank');
                            }
                          } catch (e) {
                            window.open(result.url, '_blank');
                          }
                        }
                      } catch (e) {
                        console.error('Download error', e);
                        alert('Download error: ' + (e && e.message));
                      }
                    }}
                    style={{
                      display: 'inline-block',
                      padding: '0.75rem 1.5rem',
                      backgroundColor: '#2e8bff',
                      color: 'white',
                      textDecoration: 'none',
                      borderRadius: '4px',
                      marginTop: '1rem',
                      fontFamily: 'Arial, sans-serif'
                    }}
                  >
                    Download File
                  </button>
                  <button
                    onClick={async () => {
                      if (!currentAttachment._id) { alert('Cannot delete local attachment'); return; }
                      if (!confirm('Delete this attachment?')) return;
                      try {
                        const token = localStorage.getItem('authToken');
                        const resp = await fetch(`/api/attachments/${encodeURIComponent(currentAttachment._id)}`, {
                          method: 'DELETE',
                          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
                        });
                        if (!resp.ok) {
                          const body = await resp.json().catch(() => null);
                          alert('Delete failed: ' + (body && body.message ? body.message : resp.status));
                          return;
                        }
                        setDeliveryAttachments(prev => prev.filter(a => a._id !== currentAttachment._id));
                        closeAttachmentModal();
                      } catch (e) {
                        console.error('Delete error', e);
                        alert('Delete error: ' + (e && e.message));
                      }
                    }}
                    style={{
                      display: 'inline-block',
                      padding: '0.75rem 1.5rem',
                      backgroundColor: '#dc3545',
                      color: 'white',
                      textDecoration: 'none',
                      borderRadius: '4px',
                      marginTop: '1rem',
                      fontFamily: 'Arial, sans-serif'
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NewOrder;