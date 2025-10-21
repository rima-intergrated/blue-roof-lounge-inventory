import { useAuth } from '../context/AuthContext';

// Hook to check user permissions
export const usePermissions = () => {
  const { user } = useAuth();
  
  const hasPermission = (module, action) => {
    if (!user || !user.permissions) {
      return false;
    }
    
    // Administrator users have all permissions
    if (user.role === 'Administrator') {
      return true;
    }
    
    const modulePermissions = user.permissions[module];
    if (!modulePermissions) {
      return false;
    }
    
    return modulePermissions[action] === true;
  };
  
  const hasAnyPermission = (module) => {
    if (!user || !user.permissions) {
      return false;
    }
    
    // Administrator users have all permissions
    if (user.role === 'Administrator') {
      return true;
    }
    
    const modulePermissions = user.permissions[module];
    if (!modulePermissions) {
      return false;
    }
    
    // Check if user has at least one permission in this module
    return Object.values(modulePermissions).some(permission => permission === true);
  };
  
  const getAccessibleModules = () => {
    if (!user || !user.permissions) {
      return [];
    }
    
    // Administrator users have access to all modules
    if (user.role === 'Administrator') {
      return ['sales', 'inventory', 'hrm', 'payroll', 'reports', 'settings'];
    }
    
    return Object.keys(user.permissions).filter(module => 
      hasAnyPermission(module)
    );
  };
  
  return {
    hasPermission,
    hasAnyPermission,
    getAccessibleModules,
    permissions: user?.permissions || {},
    userRole: user?.role
  };
};

export default usePermissions;