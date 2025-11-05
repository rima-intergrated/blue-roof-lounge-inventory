import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, creditSalesAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is already logged in on app start
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        const userProfile = await authAPI.getProfile();
        const userData = userProfile.data || userProfile;
        
        // Load cached permissions immediately to prevent blank page
        const cachedPermissions = localStorage.getItem('userPermissions');
        const cachedPositionTitle = localStorage.getItem('userPositionTitle');
        const cachedStaffName = localStorage.getItem('userStaffName');
        if (cachedPermissions) {
          try {
            userData.permissions = JSON.parse(cachedPermissions);
            userData.positionTitle = cachedPositionTitle;
            userData.name = cachedStaffName || userData.name;
          } catch (parseError) {
            console.warn('Failed to parse cached permissions:', parseError);
          }
        }
        
        // Set user immediately with cached permissions
        setUser(userData);
        
        // Then fetch fresh permissions if they have staff data
        if (userData.staffId) {
          try {
            const permissionsData = await authAPI.getPermissions();
            userData.permissions = permissionsData.data.permissions;
            userData.positionTitle = permissionsData.data.positionTitle;
            userData.name = permissionsData.data.staffName || userData.name;
            
            // Cache the fresh permissions and staff data
            localStorage.setItem('userPermissions', JSON.stringify(userData.permissions));
            localStorage.setItem('userPositionTitle', userData.positionTitle || '');
            localStorage.setItem('userStaffName', userData.name || '');
            
            // Update user with fresh permissions
            setUser({...userData});
          } catch (permError) {
            console.warn('Failed to fetch fresh permissions:', permError);
          }
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('authToken');
      localStorage.removeItem('userPermissions');
      localStorage.removeItem('userPositionTitle');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔐 Attempting login with:', email);
      const response = await authAPI.login(email, password);
      console.log('📡 Login response:', response);
      console.log('📡 Response structure - success:', response.success, 'data:', response.data);
      
      if (response.success && response.data && response.data.token) {
        console.log('✅ Login successful, storing token and user data');
        console.log('🔑 Token:', response.data.token);
        console.log('👤 User data being set:', response.data.user);
        localStorage.setItem('authToken', response.data.token);
        
        const userData = response.data.user;
        
        // Fetch user permissions if they have staff data
        if (userData.staffId) {
          try {
            const permissionsData = await authAPI.getPermissions();
            userData.permissions = permissionsData.data.permissions;
            userData.positionTitle = permissionsData.data.positionTitle;
            userData.name = permissionsData.data.staffName || userData.name;
            
            // Cache permissions and staff data for reload persistence
            localStorage.setItem('userPermissions', JSON.stringify(userData.permissions));
            localStorage.setItem('userPositionTitle', userData.positionTitle || '');
            localStorage.setItem('userStaffName', userData.name || '');
          } catch (permError) {
            console.warn('Failed to fetch permissions:', permError);
          }
        }
        
        setUser(userData);
        console.log('🎯 User state updated, isAuthenticated should be true now');
        // Prefetch credit sales (including attachments) in background so UI can show them quickly
        (async () => {
          try {
            const resp = await creditSalesAPI.getAll({ limit: 1000 });
            if (resp && resp.success && resp.data && Array.isArray(resp.data.creditSales)) {
              try {
                localStorage.setItem('prefetchedCreditSales', JSON.stringify(resp.data.creditSales));
                console.log('Prefetched credit sales stored in localStorage');
              } catch (e) {
                console.warn('Failed to cache prefetched credit sales:', e);
              }
            }
          } catch (e) {
            // ignore prefetch errors
            console.debug('Credit sales prefetch failed:', e?.message || e);
          }
        })();
        return { success: true };
      } else {
        console.log('❌ Login failed:', response.message);
        console.log('❌ Response details:', { success: response.success, data: response.data });
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      setError(error.message || 'Login failed');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authAPI.register(userData);
      
      if (response.success) {
        // Auto-login after registration if token is provided
        if (response.token) {
          localStorage.setItem('authToken', response.token);
          setUser(response.user || response.data);
        }
        return { success: true };
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error) {
      setError(error.message || 'Registration failed');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userPermissions');
      localStorage.removeItem('userPositionTitle');
      setUser(null);
      setError(null);
    }
  };

  const updateProfile = async (profileData) => {
    try {
      setError(null);
      const response = await authAPI.updateProfile(profileData);
      
      if (response.success) {
        setUser(response.user || response.data);
        return { success: true };
      } else {
        throw new Error(response.message || 'Profile update failed');
      }
    } catch (error) {
      setError(error.message || 'Profile update failed');
      return { success: false, error: error.message };
    }
  };

  const changePassword = async (passwordData) => {
    try {
      setError(null);
      const response = await authAPI.changePassword(passwordData);
      
      if (response.success) {
        return { success: true };
      } else {
        throw new Error(response.message || 'Password change failed');
      }
    } catch (error) {
      setError(error.message || 'Password change failed');
      return { success: false, error: error.message };
    }
  };

  const clearError = () => setError(null);

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    clearError,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;