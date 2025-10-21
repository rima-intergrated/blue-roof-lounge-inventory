import React from 'react';
import { Navigate } from 'react-router-dom';
import usePermissions from '../../hooks/usePermissions';

// Component to guard routes based on permissions
const PermissionGuard = ({ module, action, fallback, children }) => {
  const { hasPermission, hasAnyPermission, getAccessibleModules } = usePermissions();
  
  // If no specific action is required, check if user has any permission in the module
  const hasAccess = action ? hasPermission(module, action) : hasAnyPermission(module);
  
  if (!hasAccess) {
    // If custom fallback is provided, use it
    if (fallback) {
      return <Navigate to={fallback} replace />;
    }
    
    // Otherwise, redirect to first accessible module
    const accessibleModules = getAccessibleModules();
    const routePriority = ['sales', 'inventory', 'hrm', 'payroll', 'reports', 'settings'];
    const defaultModule = routePriority.find(mod => accessibleModules.includes(mod));
    const redirectTo = defaultModule || (accessibleModules.length > 0 ? accessibleModules[0] : 'sales');
    
    // Always ensure we have a valid path with leading slash
    const validPath = redirectTo.startsWith('/') ? redirectTo : `/${redirectTo}`;
    
    return <Navigate to={validPath} replace />;
  }
  
  return children;
};

// Component to conditionally render content based on permissions
export const PermissionCheck = ({ module, action, fallback = null, children }) => {
  const { hasPermission, hasAnyPermission } = usePermissions();
  
  // If no specific action is required, check if user has any permission in the module
  const hasAccess = action ? hasPermission(module, action) : hasAnyPermission(module);
  
  return hasAccess ? children : fallback;
};

export default PermissionGuard;