import { useState, useEffect, useCallback } from 'react';
import { staffAPI } from '../services/api';

export const useStaff = () => {
  const [staff, setStaff] = useState([]);
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load all staff members
  const loadStaff = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await staffAPI.getAll();
      
      if (response.success) {
        setStaff(response.data || response.staff || []);
      } else {
        throw new Error(response.message || 'Failed to load staff');
      }
    } catch (error) {
      console.error('Error loading staff:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load all positions
  const loadPositions = useCallback(async () => {
    try {
      const response = await staffAPI.getPositions();
      
      if (response.success) {
        setPositions(response.data || response.positions || []);
      } else {
        // If positions API doesn't exist, use default positions
        setPositions([
          { 
            id: 1, 
            name: "Administrator", 
            permissions: ["sales", "hrm", "payroll", "settings", "inventory", "reports"] 
          },
          { 
            id: 2, 
            name: "Manager", 
            permissions: ["sales", "hrm", "payroll", "inventory", "reports"] 
          },
          { 
            id: 3, 
            name: "Supervisor", 
            permissions: ["sales", "hrm", "inventory"] 
          },
          { 
            id: 4, 
            name: "Cashier", 
            permissions: ["sales"] 
          },
          { 
            id: 5, 
            name: "Bartender", 
            permissions: ["sales", "inventory"] 
          },
          { 
            id: 6, 
            name: "Waiter/Waitress", 
            permissions: ["sales"] 
          },
        ]);
      }
    } catch (error) {
      console.error('Error loading positions:', error);
      // Use default positions if API fails
      setPositions([
        { 
          id: 1, 
          name: "Administrator", 
          permissions: ["sales", "hrm", "payroll", "settings", "inventory", "reports"] 
        },
        { 
          id: 2, 
          name: "Manager", 
          permissions: ["sales", "hrm", "payroll", "inventory", "reports"] 
        },
        { 
          id: 3, 
          name: "Supervisor", 
          permissions: ["sales", "hrm", "inventory"] 
        },
        { 
          id: 4, 
          name: "Cashier", 
          permissions: ["sales"] 
        },
        { 
          id: 5, 
          name: "Bartender", 
          permissions: ["sales", "inventory"] 
        },
        { 
          id: 6, 
          name: "Waiter/Waitress", 
          permissions: ["sales"] 
        },
      ]);
    }
  }, []);

  // Create a new staff member
  const createStaff = async (staffData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await staffAPI.create(staffData);
      
      if (response.success) {
        const newStaff = response.data || response.staff;
        setStaff(prev => [...prev, newStaff]);
        return { success: true, staff: newStaff };
      } else {
        throw new Error(response.message || 'Failed to create staff member');
      }
    } catch (error) {
      console.error('Error creating staff:', error);
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Update a staff member
  const updateStaff = async (id, staffData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await staffAPI.update(id, staffData);
      
      if (response.success) {
        const updatedStaff = response.data || response.staff;
        setStaff(prev => prev.map(s => s._id === id ? updatedStaff : s));
        return { success: true, staff: updatedStaff };
      } else {
        throw new Error(response.message || 'Failed to update staff member');
      }
    } catch (error) {
      console.error('Error updating staff:', error);
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Delete a staff member
  const deleteStaff = async (id) => {
    try {
      setLoading(true);
      setError(null);
      const response = await staffAPI.delete(id);
      
      if (response.success) {
        setStaff(prev => prev.filter(s => s._id !== id));
        return { success: true };
      } else {
        throw new Error(response.message || 'Failed to delete staff member');
      }
    } catch (error) {
      console.error('Error deleting staff:', error);
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Create a new position
  const createPosition = async (positionData) => {
    try {
      setError(null);
      const response = await staffAPI.createPosition(positionData);
      
      if (response.success) {
        const newPosition = response.data || response.position;
        setPositions(prev => [...prev, newPosition]);
        return { success: true, position: newPosition };
      } else {
        throw new Error(response.message || 'Failed to create position');
      }
    } catch (error) {
      console.error('Error creating position:', error);
      setError(error.message);
      return { success: false, error: error.message };
    }
  };

  // Load data on hook initialization
  useEffect(() => {
    loadStaff();
    loadPositions();
  }, [loadStaff, loadPositions]);

  const clearError = () => setError(null);

  return {
    staff,
    positions,
    loading,
    error,
    createStaff,
    updateStaff,
    deleteStaff,
    createPosition,
    loadStaff,
    loadPositions,
    clearError,
    setStaff,
    setPositions,
  };
};

export default useStaff;