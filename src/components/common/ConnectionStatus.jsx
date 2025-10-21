import React, { useState, useEffect } from 'react';
import { healthCheck } from '../../services/api';

const ConnectionStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [apiStatus, setApiStatus] = useState('checking');
  
  useEffect(() => {
    // Check browser online status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Check API connectivity
    const checkApiStatus = async () => {
      try {
        await healthCheck();
        setApiStatus('online');
      } catch (error) {
        setApiStatus('offline');
      }
    };
    
    // Check API status every 30 seconds
    checkApiStatus();
    const interval = setInterval(checkApiStatus, 30000);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);
  
  const getStatusText = () => {
    if (!isOnline) return 'No Internet';
    if (apiStatus === 'checking') return 'Checking...';
    if (apiStatus === 'online') return 'Connected';
    return 'API Offline';
  };
  
  const getStatusClass = () => {
    if (!isOnline || apiStatus === 'offline') return 'offline';
    if (apiStatus === 'checking') return 'checking';
    return 'online';
  };
  
  return (
    <div className={`connection-status ${getStatusClass()}`}>
      {getStatusText()}
    </div>
  );
};

export default ConnectionStatus;