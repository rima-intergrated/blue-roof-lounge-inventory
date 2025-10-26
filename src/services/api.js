// API Base Configuration
// Use VITE_API_URL as-is, no forced '/api' suffix
// CRITICAL: Must be set in Vercel environment variables as VITE_API_URL
const VITE_API_URL_VALUE = import.meta.env.VITE_API_URL;
const FALLBACK_URL = 'http://localhost:5000';

// If VITE_API_URL is empty string, treat it as not set
const API_BASE_URL = (VITE_API_URL_VALUE && VITE_API_URL_VALUE.trim()) ? VITE_API_URL_VALUE.trim() : FALLBACK_URL;

console.log('🔧 API Configuration loaded:');
console.log('  - VITE_API_URL env variable:', VITE_API_URL_VALUE);
console.log('  - API_BASE_URL resolved to:', API_BASE_URL);
console.log('  - Mode:', import.meta.env.MODE);
console.log('  - All environment variables:', import.meta.env);

if (API_BASE_URL === FALLBACK_URL) {
  console.warn('⚠️ WARNING: Using fallback URL! VITE_API_URL not set or empty in build environment.');
  console.warn('⚠️ This will cause API requests to fail in production!');
}

export { API_BASE_URL };

// API utility functions
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultHeaders = {};

  // Only set Content-Type to application/json if we're not sending FormData
  if (!(options.body instanceof FormData)) {
    defaultHeaders['Content-Type'] = 'application/json';
  }

  // Get token from localStorage if available
  const token = localStorage.getItem('authToken');
  if (token) {
    defaultHeaders.Authorization = `Bearer ${token}`;
  }

  const config = {
    credentials: 'include',
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options.headers || {}),
    },
  };

  try {
    const response = await fetch(url, config);

    // Check for HTTP error status
    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      let errorText = '';
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json().catch(() => ({}));
        errorText = errorData.message || JSON.stringify(errorData);
      } else {
        errorText = await response.text();
      }
      throw new Error(`HTTP error ${response.status}: ${errorText}`);
    }

    // Check for valid JSON response
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    } else {
      // Not JSON, return text for debugging
      const text = await response.text();
      throw new Error(`Expected JSON, got: ${text}`);
    }
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    throw error;
  }
};

// Authentication API
export const authAPI = {
  login: async (email, password) => {
    return apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  register: async (userData) => {
    return apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  logout: async () => {
    return apiRequest('/auth/logout', {
      method: 'POST',
    });
  },

  getProfile: async () => {
    return apiRequest('/auth/profile');
  },

  updateProfile: async (profileData) => {
    return apiRequest('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },

  // Password setup methods
  verifyPasswordSetupToken: async (token, userId) => {
    return apiRequest(`/password-setup/verify-token?token=${token}&userId=${userId}`);
  },

  setupPassword: async (token, userId, password, confirmPassword) => {
    return apiRequest('/password-setup/setup-password', {
      method: 'POST',
      body: JSON.stringify({ token, userId, password, confirmPassword }),
    });
  },

  // Resend password setup instructions (used by admin/forgot flows)
  resendPasswordSetup: async (email) => {
    return apiRequest('/password-setup/resend', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  changePassword: async (passwordData) => {
    return apiRequest('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify(passwordData),
    });
  },

  // Get user permissions
  getPermissions: async () => {
    return apiRequest('/auth/permissions');
  },
};

// Staff API
export const staffAPI = {
  getAll: async () => {
    return apiRequest('/staff');
  },

  getById: async (id) => {
    return apiRequest(`/staff/${id}`);
  },

  create: async (staffData) => {
    return apiRequest('/staff', {
      method: 'POST',
      body: JSON.stringify(staffData),
    });
  },

  update: async (id, staffData) => {
    return apiRequest(`/staff/${id}`, {
      method: 'PUT',
      body: JSON.stringify(staffData),
    });
  },

  delete: async (id) => {
    return apiRequest(`/staff/${id}`, {
      method: 'DELETE',
    });
  },

  // Trigger sending a password-setup link for a staff member (admin)
  sendPasswordSetup: async (id) => {
    return apiRequest(`/staff/${id}/send-password-setup`, {
      method: 'POST'
    });
  },

  getPositions: async () => {
    return apiRequest('/staff/positions');
  },

  createPosition: async (positionData) => {
    return apiRequest('/staff/positions', {
      method: 'POST',
      body: JSON.stringify(positionData),
    });
  },

  updatePosition: async (positionId, positionData) => {
    return apiRequest(`/staff/positions/${positionId}`, {
      method: 'PUT',
      body: JSON.stringify(positionData),
    });
  },
};

// Position API (alias for staff position methods)
export const positionAPI = {
  getAll: staffAPI.getPositions,
  create: staffAPI.createPosition,
  update: staffAPI.updatePosition,
};

// Sales API
export const salesAPI = {
  getAll: async (filters = {}) => {
    const queryParams = new URLSearchParams(filters);
    return apiRequest(`/sales?${queryParams}`);
  },

  getById: async (id) => {
    return apiRequest(`/sales/${id}`);
  },

  create: async (saleData) => {
    return apiRequest('/sales', {
      method: 'POST',
      body: JSON.stringify(saleData),
    });
  },

  update: async (id, saleData) => {
    return apiRequest(`/sales/${id}`, {
      method: 'PUT',
      body: JSON.stringify(saleData),
    });
  },

  delete: async (id) => {
    return apiRequest(`/sales/${id}`, {
      method: 'DELETE',
    });
  },

  getDailySummary: async (date) => {
    return apiRequest(`/sales/summary/daily?date=${date}`);
  },

  getWeeklySummary: async (startDate, endDate) => {
    return apiRequest(`/sales/summary/weekly?startDate=${startDate}&endDate=${endDate}`);
  },

  getMonthlySummary: async (month, year) => {
    return apiRequest(`/sales/summary/monthly?month=${month}&year=${year}`);
  },
};

// Credit Sales API
export const creditSalesAPI = {
  getAll: async (filters = {}) => {
    const queryParams = new URLSearchParams(filters);
    return apiRequest(`/credit-sales?${queryParams}`);
  },

  getById: async (id) => {
    return apiRequest(`/credit-sales/${id}`);
  },

  create: async (creditSaleData) => {
    return apiRequest('/credit-sales', {
      method: 'POST',
      body: JSON.stringify(creditSaleData),
    });
  },

  createWithAttachment: async (formData) => {
    return apiRequest('/credit-sales', {
      method: 'POST',
      body: formData,
    });
  },

  update: async (id, creditSaleData) => {
    return apiRequest(`/credit-sales/${id}`, {
      method: 'PUT',
      body: JSON.stringify(creditSaleData),
    });
  },

  delete: async (id) => {
    return apiRequest(`/credit-sales/${id}`, {
      method: 'DELETE',
    });
  },

  markAsPaid: async (id, paymentData) => {
    return apiRequest(`/credit-sales/${id}/mark-paid`, {
      method: 'PATCH',
      body: JSON.stringify(paymentData),
    });
  },

  getStats: async (filters = {}) => {
    const queryParams = new URLSearchParams(filters);
    return apiRequest(`/credit-sales/stats?${queryParams}`);
  },
};

// Expense API
export const expenseAPI = {
  getAll: async (filters = {}) => {
    const queryParams = new URLSearchParams(filters);
    return apiRequest(`/expenses?${queryParams}`);
  },

  getById: async (id) => {
    return apiRequest(`/expenses/${id}`);
  },

  create: async (expenseData) => {
    return apiRequest('/expenses', {
      method: 'POST',
      body: JSON.stringify(expenseData),
    });
  },

  update: async (id, expenseData) => {
    return apiRequest(`/expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(expenseData),
    });
  },

  delete: async (id) => {
    return apiRequest(`/expenses/${id}`, {
      method: 'DELETE',
    });
  },

  approve: async (id) => {
    return apiRequest(`/expenses/${id}/approve`, {
      method: 'PATCH',
    });
  },

  getSummary: async (startDate, endDate) => {
    return apiRequest(`/expenses/summary/range?startDate=${startDate}&endDate=${endDate}`);
  },

  getMonthlySummary: async (month, year) => {
    return apiRequest(`/expenses/summary/monthly?month=${month}&year=${year}`);
  },
};

// Stock API (replacement for legacy inventory endpoints)
export const stockAPI = {
  getAll: async () => {
    return apiRequest('/stock');
  },

  getById: async (id) => {
    return apiRequest(`/stock/${id}`);
  },

  create: async (stockData) => {
    return apiRequest('/stock', {
      method: 'POST',
      body: JSON.stringify(stockData),
    });
  },

  createWithFiles: async (formData) => {
    // For file uploads, we don't set Content-Type header - let browser set it with boundary
    return fetch(`${API_BASE_URL}/stock`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      },
      body: formData,
    }).then(async response => {
      if (!response.ok) {
        const error = await response.json();
        console.error('❌ Server validation error:', error);
        throw new Error(error.message || `Upload failed: ${response.status} ${response.statusText}`);
      }
      return response.json();
    });
  },

  update: async (id, stockData) => {
    return apiRequest(`/stock/${id}`, {
      method: 'PUT',
      body: JSON.stringify(stockData),
    });
  },

  delete: async (id) => {
    return apiRequest(`/stock/${id}`, {
      method: 'DELETE',
    });
  },

  updateStock: async (id, stockData) => {
    return apiRequest(`/stock/byid/${id}`, {
      method: 'PUT',
      body: JSON.stringify(stockData),
    });
  },

  getLowStock: async () => {
    return apiRequest('/stock/alerts/low-stock');
  },
    // categories are now derived from stock documents; no dedicated endpoint
};

// Attachment API
export const attachmentAPI = {
  // Upload attachments for an entity
  upload: async (entityType, entityId, files, description = '', tags = []) => {
    const formData = new FormData();
    // Keep entityType in the form for backward compatibility but also include it in the query
    // so multer can read it before form fields are parsed when saving the file.
    formData.append('entityType', entityType);
    formData.append('entityId', entityId);
    formData.append('description', description);
    formData.append('tags', Array.isArray(tags) ? tags.join(',') : tags);
    
    // Add files
    if (Array.isArray(files)) {
      files.forEach(file => formData.append('attachments', file));
    } else {
      formData.append('attachments', files);
    }
    
    const uploadUrl = `${API_BASE_URL}/attachments?entityType=${encodeURIComponent(entityType)}`;
    return fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      },
      body: formData,
    }).then(async response => {
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }
      return response.json();
    });
  },

  // Get attachments for a specific entity
  getByEntity: async (entityType, entityId) => {
    return apiRequest(`/attachments/${entityType}/${entityId}`);
  },

  // Get all attachments with filtering
  getAll: async (filters = {}) => {
    const queryParams = new URLSearchParams(filters);
    return apiRequest(`/attachments?${queryParams}`);
  },

  // Download attachment
  download: async (id, download = false) => {
    const url = `${API_BASE_URL}/attachments/download/${id}?download=${download}`;
    return url; // Return URL for direct browser navigation
  },

  // Update attachment metadata
  update: async (id, updateData) => {
    return apiRequest(`/attachments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  },

  // Delete attachment
  delete: async (id) => {
    return apiRequest(`/attachments/${id}`, {
      method: 'DELETE',
    });
  },

  // Get attachment URL for display
  getUrl: (id) => {
    return `${API_BASE_URL}/attachments/download/${id}`;
  }
};

// Payroll API
export const payrollAPI = {
  getAll: async (filters = {}) => {
    const queryParams = new URLSearchParams(filters);
    return apiRequest(`/payroll?${queryParams}`);
  },

  getById: async (id) => {
    return apiRequest(`/payroll/${id}`);
  },

  create: async (payrollData) => {
    return apiRequest('/payroll', {
      method: 'POST',
      body: JSON.stringify(payrollData),
    });
  },

  update: async (id, payrollData) => {
    return apiRequest(`/payroll/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payrollData),
    });
  },

  delete: async (id) => {
    return apiRequest(`/payroll/${id}`, {
      method: 'DELETE',
    });
  },

  processPayroll: async (staffId, payrollData) => {
    return apiRequest('/payroll/process', {
      method: 'POST',
      body: JSON.stringify({ staffId, ...payrollData }),
    });
  },

  getPayrollByStaff: async (staffId) => {
    return apiRequest(`/payroll/staff/${staffId}`);
  },

  markAsPaid: async (id, paymentData) => {
    return apiRequest(`/payroll/${id}/pay`, {
      method: 'PATCH',
      body: JSON.stringify(paymentData),
    });
  },
};

// Supplier API
export const supplierAPI = {
  getAll: async () => {
    return apiRequest('/suppliers');
  },

  getById: async (id) => {
    return apiRequest(`/suppliers/${id}`);
  },

  create: async (supplierData) => {
    return apiRequest('/suppliers', {
      method: 'POST',
      body: JSON.stringify(supplierData),
    });
  },

  update: async (id, supplierData) => {
    return apiRequest(`/suppliers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(supplierData),
    });
  },

  delete: async (id) => {
    return apiRequest(`/suppliers/${id}`, {
      method: 'DELETE',
    });
  },
};

// Category API
export const categoryAPI = {
  getAll: async (filters = {}) => {
    const queryParams = new URLSearchParams(filters);
    return apiRequest(`/categories?${queryParams}`);
  },

  getById: async (id) => {
    return apiRequest(`/categories/${id}`);
  },

  create: async (categoryData) => {
    return apiRequest('/categories', {
      method: 'POST',
      body: JSON.stringify(categoryData),
    });
  },

  update: async (id, categoryData) => {
    return apiRequest(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(categoryData),
    });
  },

  delete: async (id) => {
    return apiRequest(`/categories/${id}`, {
      method: 'DELETE',
    });
  },

  getAvailableIds: async (type) => {
    return apiRequest(`/categories/available-ids/${type}`);
  },
};

// Expense Category API (separate from Category API)
export const expenseCategoryAPI = {
  getAll: async () => {
    return apiRequest('/expense-categories');
  },

  create: async (expenseCategoryData) => {
    return apiRequest('/expense-categories', {
      method: 'POST',
      body: JSON.stringify(expenseCategoryData),
    });
  },

  delete: async (id) => {
    return apiRequest(`/expense-categories/${id}`, {
      method: 'DELETE',
    });
  },
};

// Delivery Notes and Receipts API
export const deliveryNotesReceiptsAPI = {
  // Get all delivery documents with pagination and filtering
  getAll: async (page = 1, limit = 10, filters = {}) => {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters
    });
    return apiRequest(`/delivery-notes-receipts?${queryParams}`);
  },

  // Get documents by transaction ID
  getByTransactionId: async (transactionId) => {
    return apiRequest(`/delivery-notes-receipts/transaction/${transactionId}`);
  },

  // Get documents by inventory item ID
  getByInventoryItem: async (inventoryItemId) => {
    return apiRequest(`/delivery-notes-receipts/inventory/${inventoryItemId}`);
  },

  // Create new delivery document with file upload
  create: async (formData) => {
    const token = localStorage.getItem('authToken');
    return fetch(`${API_BASE_URL}/delivery-notes-receipts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
        // Don't set Content-Type for FormData - browser will set it with boundary
      },
      body: formData,
    }).then(async response => {
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        console.error('❌ Delivery document creation error:', error);
        throw new Error(error.message || `Upload failed: ${response.status} ${response.statusText}`);
      }
      return response.json();
    });
  },

  // Archive delivery document
  archive: async (id) => {
    return apiRequest(`/delivery-notes-receipts/${id}/archive`, {
      method: 'PATCH',
    });
  },

  // Download delivery document
  download: async (id) => {
    const token = localStorage.getItem('authToken');
    const url = `${API_BASE_URL}/delivery-notes-receipts/${id}/download`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Download failed');
    }

    return response;
  },

  // Get delivery document statistics
  getStats: async () => {
    return apiRequest('/delivery-notes-receipts/stats');
  },
};

// Health check
export const healthCheck = async () => {
  return apiRequest('/health');
};

export default {
  authAPI,
  staffAPI,
  salesAPI,
  creditSalesAPI,
  expenseAPI,
  stockAPI,
  attachmentAPI,
  payrollAPI,
  supplierAPI,
  categoryAPI,
  expenseCategoryAPI,
  deliveryNotesReceiptsAPI,
  healthCheck
};
