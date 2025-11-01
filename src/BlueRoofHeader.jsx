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

  // Close mobile menu on outside click and handle body scroll
  useEffect(() => {
    const onClick = (e) => {
      if (!menuRef.current) return;
      
      // Close if clicking outside the menu or on the overlay
      if (menuOpen && !menuRef.current.contains(e.target) && !e.target.closest('.hamburger-btn')) {
        setMenuOpen(false);
      }
    };
    
    const onEscape = (e) => {
      if (e.key === 'Escape' && menuOpen) {
        setMenuOpen(false);
      }
    };
    
    const onResize = () => {
      // Close mobile menu if window is resized to desktop size
      if (window.innerWidth > 768 && menuOpen) {
        setMenuOpen(false);
      }
    };
    
    // Prevent body scroll when menu is open
    if (menuOpen) {
      document.body.classList.add('menu-open');
      // Trap focus within mobile menu when open
      const focusableElements = menuRef.current?.querySelectorAll(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusableElements?.length > 0) {
        focusableElements[0].focus();
      }
    } else {
      document.body.classList.remove('menu-open');
    }
    
    document.addEventListener('click', onClick);
    document.addEventListener('keydown', onEscape);
    window.addEventListener('resize', onResize);
    
    return () => {
      document.removeEventListener('click', onClick);
      document.removeEventListener('keydown', onEscape);
      window.removeEventListener('resize', onResize);
      document.body.classList.remove('menu-open');
    };
  }, [menuOpen]);

  // Navigation items with their required permissions and icons
  const navItems = [
    { path: '/sales', label: 'Sales & Expenditure', module: 'sales', icon: 'fas fa-dollar-sign' },
    { path: '/inventory', label: 'Inventory', module: 'inventory', icon: 'fas fa-box' },
    { path: '/payroll', label: 'Payroll', module: 'payroll', icon: 'fas fa-briefcase' },
    { path: '/reports', label: 'Analytics', module: 'reports', icon: 'fas fa-chart-line' },
    { path: '/hrm', label: 'HRM', module: 'hrm', icon: 'fas fa-users' },
    { path: '/settings', label: 'Settings', module: 'settings', icon: 'fas fa-cog' }
  ];

  return (
    <>
      <nav className="blue-roof-header-container">
        <div className="inside-header-container">
          <div className="blue-roof-logo">BlueRoof</div>

          {/* Hamburger for small screens - positioned top right */}
          <button
            className={`hamburger-btn ${menuOpen ? 'open' : ''}`}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setMenuOpen((s) => !s);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setMenuOpen((s) => !s);
              }
            }}
          >
            <span className="hamburger-box">
              <span className="hamburger-inner" />
            </span>
          </button>

          {/* Desktop navigation */}
          <ul className="blue-roof-nav-list desktop-nav">
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

          {/* Desktop user section */}
          <div className="header-user-section desktop-user">
            {user && (
              <div className="user-info">
                <button className="logout-btn" onClick={handleLogout}>
                  <i className="fas fa-sign-out-alt" style={{marginRight: '8px'}}></i>
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile menu elements - positioned outside nav container */}
      {/* Mobile sliding menu overlay */}
      <div 
        className={`mobile-menu-overlay ${menuOpen ? 'open' : ''}`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setMenuOpen(false);
        }}
        role="button"
        tabIndex={menuOpen ? 0 : -1}
        aria-label="Close menu"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setMenuOpen(false);
          }
        }}
      />

      {/* Mobile sliding menu */}
      <div className={`mobile-menu ${menuOpen ? 'open' : ''}`} ref={menuRef}>
        {/* Mobile Menu Header */}
        <div className="mobile-menu-header">
          <div className="mobile-user-info">
            <div className="mobile-user-avatar">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="mobile-user-details">
              <span className="mobile-user-name">{user?.name || 'User'}</span>
              <span className="mobile-user-role">{user?.position || user?.role || 'Staff'}</span>
            </div>
          </div>
        </div>
        
        <ul className="mobile-nav-list">
          {navItems.map((item) => (
            <PermissionCheck key={item.path} module={item.module}>
              <li>
                <Link
                  className={`nav-btn ${isActive(item.path) ? 'active' : ''}`}
                  to={item.path}
                  tabIndex={menuOpen ? 0 : -1}
                >
                  <i className={`nav-icon ${item.icon}`}></i>
                  <span className="nav-label">{item.label}</span>
                </Link>
              </li>
            </PermissionCheck>
          ))}
          {/* Logout button in mobile menu after Settings */}
          {user && (
            <li>
              <button 
                className="nav-btn logout-nav-btn" 
                onClick={(e) => {
                  e.preventDefault();
                  setMenuOpen(false);
                  handleLogout();
                }}
                tabIndex={menuOpen ? 0 : -1}
              >
                <i className="fas fa-sign-out-alt"></i>
                <span className="nav-label">Logout</span>
              </button>
            </li>
          )}
        </ul>
      </div>
    </>
  );
}

export default BlueRoofHeader;