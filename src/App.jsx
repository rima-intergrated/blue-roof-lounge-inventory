import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from './services/api';
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from './context/AuthContext';
import usePermissions from './hooks/usePermissions';
import BlueRoofHeader from "./BlueRoofHeader.jsx";
import PosTransaction from "./components/Sales/PosTransaction.jsx";
import AdvancePayment from "./AdvancePayment.jsx";
import RegisterNewStaff from "./RegisterNewStaff.jsx";
import MyProfile from "./MyProfile.jsx";
import NewOrder from "./NewOrder.jsx";
import ReportsAnalytics from "./ReportsAnalytics.jsx";
import LogIn from "./LogIn.jsx";
import PasswordSetup from "./PasswordSetup.jsx";
import { LoadingSpinner } from './components/common/FeedbackComponents';
import ConnectionStatus from './components/common/ConnectionStatus';
import PermissionGuard from './components/common/PermissionGuard';
import ErrorBoundary from './components/common/ErrorBoundary';
import RimaAssistant from './components/RimaAssistant';

// Component to determine the default route. Prefer the last-view saved in
// localStorage (if valid and not a login/setup path). Otherwise fall back
// to a permission-based module selection, and finally to /sales.
const DefaultRouteRedirect = () => {
  try {
    const last = localStorage.getItem('lastViewPath');
    if (last && typeof last === 'string' && last.startsWith('/') && !last.startsWith('/login') && !last.startsWith('/setup-password')) {
      // Allow only known top-level modules to avoid restoring arbitrary routes
      const allowedRoots = ['sales', 'inventory', 'hrm', 'payroll', 'reports', 'settings'];
      const pathRoot = last.split('/')[1] || '';
      if (allowedRoots.includes(pathRoot)) {
        return <Navigate to={last} replace />;
      }
    }
  } catch (e) {
    // ignore
  }

  const { getAccessibleModules } = usePermissions();
  const accessibleModules = getAccessibleModules();
  // Priority order for default route
  const routePriority = ['sales', 'inventory', 'hrm', 'payroll', 'reports', 'settings'];
  const defaultModule = routePriority.find(module => accessibleModules.includes(module));
  const redirectTo = defaultModule || (accessibleModules.length > 0 ? accessibleModules[0] : 'sales');
  const validPath = redirectTo.startsWith('/') ? redirectTo : `/${redirectTo}`;
  return <Navigate to={validPath} replace />;
};

// Main App Layout Component
const AppLayout = () => {
  const { user, logout } = useAuth();
  const [staff, setStaff] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [drinks, setDrinks] = useState([]);
  const [inventory, setInventory] = useState({});
  const [suppliers, setSuppliers] = useState([]);
  const [creditRecords, setCreditRecords] = useState([]);
  const [paidCreditRecords, setPaidCreditRecords] = useState([]);
  const [pendingSalaries, setPendingSalaries] = useState([]);

  const handleLogout = async () => {
    await logout();
  };

  // Load initial suppliers into top-level state
  useInitialSuppliers(setSuppliers);
  // Load initial credit sales into top-level state
  useInitialCreditSales(setCreditRecords, setPaidCreditRecords);

  return (
    <>
      <BlueRoofHeader user={user} onLogout={handleLogout} />
      <RimaAssistant />
      <Routes>
        <Route path="/sales" element={
          <PermissionGuard module="sales">
            <div className="page-transition">
              <PosTransaction 
                expenses={expenses} 
                drinks={drinks} 
                creditRecords={creditRecords} 
                setCreditRecords={setCreditRecords} 
                paidCreditRecords={paidCreditRecords} 
                setPaidCreditRecords={setPaidCreditRecords} 
                inventory={inventory} 
                setInventory={setInventory} 
              />
            </div>
          </PermissionGuard>
        } />
        <Route path="/hrm" element={
          <PermissionGuard module="hrm">
            <div className="page-transition">
              <RegisterNewStaff 
                staff={staff} 
                setStaff={setStaff}
                onStaffAdded={() => {
                  // Callback to refresh staff data if needed
                  console.log('Staff member added successfully');
                }}
              />
            </div>
          </PermissionGuard>
        } />
        <Route path="/payroll" element={
          <PermissionGuard module="payroll">
            <div className="page-transition">
              <AdvancePayment 
                staff={staff} 
                pendingSalaries={pendingSalaries} 
                setPendingSalaries={setPendingSalaries} 
              />
            </div>
          </PermissionGuard>
        } />
        <Route path="/settings" element={
          <PermissionGuard module="settings">
            <div className="page-transition">
              <MyProfile token={localStorage.getItem('authToken')} user={user} onLogout={handleLogout} />
            </div>
          </PermissionGuard>
        } />
        <Route path="/inventory" element={
          <PermissionGuard module="inventory">
            <div className="page-transition">
              <NewOrder 
                drinks={drinks} 
                inventory={inventory} 
                setInventory={setInventory} 
                suppliers={suppliers} 
                setSuppliers={setSuppliers} 
              />
            </div>
          </PermissionGuard>
        } />
        <Route path="/reports" element={
          <PermissionGuard module="reports">
            <div className="page-transition">
              <ReportsAnalytics 
                suppliers={suppliers} 
                setSuppliers={setSuppliers} 
                creditRecords={creditRecords} 
                paidCreditRecords={paidCreditRecords} 
                pendingSalaries={pendingSalaries} 
                inventory={inventory} 
              />
            </div>
          </PermissionGuard>
        } />
        <Route path="/" element={<DefaultRouteRedirect />} />
        <Route path="*" element={
          <div className="page-transition" style={{padding:'2rem', textAlign: 'center'}}>
            <h2>Page Not Found</h2>
            <p>The page you're looking for doesn't exist.</p>
            <p><a href="/sales" style={{color: '#007bff'}}>Go to Sales</a></p>
          </div>
        } />
      </Routes>
    </>
  );
};

// Fetch initial suppliers list when AppLayout mounts
// (keeps top-level state in sync with backend so Reports and NewOrder see changes)
function useInitialSuppliers(setSuppliers) {
  useEffect(() => {
    let mounted = true;
    async function loadSuppliers() {
      try {
        const token = localStorage.getItem('authToken');
        const resp = await fetch(`${API_BASE_URL}/suppliers?page=1&limit=1000`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (!resp.ok) return;
        const json = await resp.json();
        // Backend returns { success: true, data: { suppliers: [...], pagination: {...} } }
        const list = json && json.data && json.data.suppliers ? json.data.suppliers : [];
        if (mounted) setSuppliers(list);
      } catch (e) {
        // ignore - keep empty list
        // eslint-disable-next-line no-console
        console.warn('Failed to load initial suppliers:', e && e.message);
      }
    }
    loadSuppliers();
    return () => { mounted = false; };
  }, [setSuppliers]);
}

// Fetch initial credit sales and populate unpaid/paid lists
function useInitialCreditSales(setCreditRecords, setPaidCreditRecords) {
  useEffect(() => {
    let mounted = true;
    async function loadCreditSales() {
      try {
        const token = localStorage.getItem('authToken');
        const resp = await fetch(`${API_BASE_URL}/credit-sales?limit=1000`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (!resp.ok) return;
        const json = await resp.json();
        const list = json && json.data && json.data.creditSales ? json.data.creditSales : [];
        if (!mounted) return;
        const unpaid = list.filter(s => !s.isPaid);
        const paid = list.filter(s => s.isPaid);
        if (typeof setCreditRecords === 'function') setCreditRecords(unpaid);
        if (typeof setPaidCreditRecords === 'function') setPaidCreditRecords(paid);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('Failed to load credit sales:', e && e.message);
      }
    }
    loadCreditSales();
    return () => { mounted = false; };
  }, [setCreditRecords, setPaidCreditRecords]);
}

function App() {
  // Protected Route Component - defined inside App so it has access to AuthProvider
  const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();
    const location = window.location;

    if (loading) {
      return (
        <div style={{ 
          height: '100vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}>
          <LoadingSpinner size="large" message="Loading application..." />
        </div>
      );
    }

    if (!isAuthenticated) {
      // Store the current location before redirecting to login
      const currentPath = location.pathname + location.search;
      // Only store valid paths that start with / and are not login-related
      if (currentPath !== '/login' && 
          currentPath !== '/setup-password' && 
          currentPath.startsWith('/') && 
          currentPath.length > 1) {
        localStorage.setItem('redirectAfterLogin', currentPath);
      }
      return <Navigate to="/login" replace />;
    }

    return children;
  };

  // If the user reloads the browser, treat that as an automatic logout for safety
  // Clear auth-related localStorage and redirect to login. This prevents the
  // app from getting into a stale authenticated state after a reload.
  useEffect(() => {
    try {
      let isReload = false;
      if (typeof performance !== 'undefined' && performance.getEntriesByType) {
        const navEntries = performance.getEntriesByType('navigation');
        if (navEntries && navEntries.length > 0) {
          isReload = navEntries[0].type === 'reload';
        }
      } else if (typeof performance !== 'undefined' && performance.navigation && typeof performance.navigation.type !== 'undefined') {
        // legacy fallback
        isReload = performance.navigation.type === 1;
      }

      if (isReload) {
        try {
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          localStorage.removeItem('userPermissions');
          localStorage.removeItem('userPositionTitle');
        } catch (e) {
          // ignore
        }
        // Force navigation to login
        window.location.href = '/login';
      }
    } catch (e) {
      // ignore
    }
  }, []);
  // Persist last visited path so we can restore it after reload/login
  useEffect(() => {
    const savePath = () => {
      try {
        const path = window.location.pathname + window.location.search;
        if (path && path !== '/login' && path !== '/setup-password') {
          localStorage.setItem('lastViewPath', path);
        }
      } catch (e) {
        // ignore
      }
    };

    // Save on visibility change and before unload as well as on popstate
    window.addEventListener('beforeunload', savePath);
    window.addEventListener('popstate', savePath);
    document.addEventListener('visibilitychange', savePath);

    // Also save immediately when App mounts
    savePath();

    return () => {
      window.removeEventListener('beforeunload', savePath);
      window.removeEventListener('popstate', savePath);
      document.removeEventListener('visibilitychange', savePath);
    };
  }, []);

  return (
    <AuthProvider>
      <Router>
        <ConnectionStatus />
        <Routes>
          <Route path="/login" element={<LogIn />} />
          <Route path="/setup-password" element={<PasswordSetup />} />
          <Route path="/*" element={
            <ProtectedRoute>
              {/* ensure initial suppliers are loaded into AppLayout state */}
              <ErrorBoundary>
                <AppLayout />
              </ErrorBoundary>
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
