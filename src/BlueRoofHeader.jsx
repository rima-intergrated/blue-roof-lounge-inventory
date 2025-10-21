import { Link, useLocation } from "react-router-dom";
import { useAuth } from './context/AuthContext';
import usePermissions from './hooks/usePermissions';
import { PermissionCheck } from './components/common/PermissionGuard';
import { useEffect, useRef, useState } from 'react';
import './BlueRoofHeader.css';

function BlueRoofHeader() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { hasAnyPermission } = usePermissions();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  
  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to logout?')) {
      await logout();
    }
  };

  // Close mobile menu on navigation changes
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Close mobile menu on outside click
  useEffect(() => {
    const onClick = (e) => {
      if (!menuRef.current) return;
      if (menuOpen && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [menuOpen]);

  // Navigation items with their required permissions
  const navItems = [
    { path: '/sales', label: 'Sales & Expenditure', module: 'sales' },
    { path: '/inventory', label: 'Inventory', module: 'inventory' },
    { path: '/payroll', label: 'Payroll', module: 'payroll' },
    { path: '/reports', label: 'Analytics', module: 'reports' },
    { path: '/hrm', label: 'HRM', module: 'hrm' },
    { path: '/settings', label: 'Settings', module: 'settings' }
  ];

  return (
    <nav className="blue-roof-header-container">
      <div className="inside-header-container" ref={menuRef}>
        <div className="blue-roof-logo">BlueRoof</div>

        {/* Hamburger for small screens */}
        <button
          className={`hamburger-btn ${menuOpen ? 'open' : ''}`}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((s) => !s)}
        >
          <span className="hamburger-box">
            <span className="hamburger-inner" />
          </span>
        </button>

        <ul className={`blue-roof-nav-list ${menuOpen ? 'mobile-open' : ''}`}>
          {navItems.map((item) => (
            <PermissionCheck key={item.path} module={item.module}>
              <li>
                <Link
                  className={`nav-btn ${isActive(item.path) ? 'active' : ''}`}
                  to={item.path}
                >
                  {item.label}
                </Link>
              </li>
            </PermissionCheck>
          ))}
        </ul>

        <div className="header-user-section">
          {user && (
            <div className="user-info">
              <button className="logout-btn" onClick={handleLogout}>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default BlueRoofHeader;