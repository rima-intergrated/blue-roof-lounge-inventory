import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import usePermissions from './hooks/usePermissions';
import './DesktopSidebar.css';

const DesktopSidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { getAccessibleModules } = usePermissions();

  // Handle sidebar state effect on main content
  useEffect(() => {
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
      if (isCollapsed) {
        mainContent.classList.add('sidebar-collapsed');
      } else {
        mainContent.classList.remove('sidebar-collapsed');
      }
    }
    
    // Cleanup on unmount
    return () => {
      const mainContent = document.querySelector('.main-content');
      if (mainContent) {
        mainContent.classList.remove('sidebar-collapsed');
      }
    };
  }, [isCollapsed]);

  const handleLogout = async () => {
    await logout();
  };

  const toggleSidebar = () => {
    const newCollapsedState = !isCollapsed;
    setIsCollapsed(newCollapsedState);
    
    // Update main content class based on sidebar state
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
      if (newCollapsedState) {
        mainContent.classList.add('sidebar-collapsed');
      } else {
        mainContent.classList.remove('sidebar-collapsed');
      }
    }
  };

  // Define navigation items with icons and permissions
  const navigationItems = [
    {
      id: 'sales',
      label: 'Sales & Expenditure',
      icon: 'fas fa-cash-register',
      path: '/sales',
      permission: 'sales'
    },
    {
      id: 'inventory',
      label: 'Inventory',
      icon: 'fas fa-boxes',
      path: '/inventory',
      permission: 'inventory'
    },
    {
      id: 'payroll',
      label: 'Payroll',
      icon: 'fas fa-money-bill-wave',
      path: '/payroll',
      permission: 'payroll'
    },
    {
      id: 'reports',
      label: 'Analytics',
      icon: 'fas fa-chart-line',
      path: '/reports',
      permission: 'reports'
    },
    {
      id: 'hrm',
      label: 'HRM',
      icon: 'fas fa-users',
      path: '/hrm',
      permission: 'hrm'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: 'fas fa-cog',
      path: '/settings',
      permission: 'settings'
    }
  ];

  // Filter navigation items based on permissions
  const accessibleModules = getAccessibleModules();
  const visibleNavItems = navigationItems.filter(item => 
    accessibleModules.includes(item.permission)
  );

  const handleNavigation = (path) => {
    navigate(path);
    // Store the last viewed path
    localStorage.setItem('lastViewPath', path);
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <aside className={`desktop-sidebar ${isCollapsed ? 'collapsed' : 'expanded'}`}>
      {/* Sidebar Header */}
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <i className="fas fa-building sidebar-brand-icon"></i>
          {!isCollapsed && <span className="sidebar-brand-text">Blue Roof</span>}
        </div>
        <button 
          className="sidebar-toggle"
          onClick={toggleSidebar}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <i className={`fas ${isCollapsed ? 'fa-chevron-right' : 'fa-chevron-left'}`}></i>
        </button>
      </div>

      {/* Navigation Menu */}
      <nav className="sidebar-nav">
        <ul className="sidebar-nav-list">
          {visibleNavItems.map(item => (
            <li key={item.id} className="sidebar-nav-item">
              <button
                className={`sidebar-nav-link ${isActive(item.path) ? 'active' : ''}`}
                onClick={() => handleNavigation(item.path)}
                title={isCollapsed ? item.label : ''}
              >
                <i className={`${item.icon} sidebar-nav-icon`}></i>
                {!isCollapsed && <span className="sidebar-nav-text">{item.label}</span>}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Sidebar Footer */}
      <div className="sidebar-footer">
        {user && (
          <div className="sidebar-user-info">
            {!isCollapsed && (
              <div className="sidebar-user-details">
                <span className="sidebar-user-name">{user.name || user.firstName || user.username}</span>
                <span className="sidebar-user-role">{user.positionTitle || user.role || 'Staff'}</span>
              </div>
            )}
          </div>
        )}
        
        <button
          className="sidebar-logout-btn"
          onClick={handleLogout}
          title={isCollapsed ? 'Logout' : ''}
        >
          <i className="fas fa-sign-out-alt sidebar-nav-icon"></i>
          {!isCollapsed && <span className="sidebar-nav-text">Logout</span>}
        </button>
      </div>
    </aside>
  );
};

export default DesktopSidebar;