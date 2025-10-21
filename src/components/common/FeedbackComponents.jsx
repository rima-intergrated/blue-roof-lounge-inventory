import React from 'react';

export const LoadingSpinner = ({ size = 'medium', message = 'Loading...' }) => {
  const sizeClasses = {
    small: 'professional-loading-small',
    medium: 'professional-loading-medium',
    large: 'professional-loading-large'
  };

  return (
    <div className="professional-loading-container">
      <div className="professional-loading-content">
        {/* Professional Loading Dots */}
        <div className={`professional-loading-dots ${sizeClasses[size]}`}>
          <div className="dot"></div>
          <div className="dot"></div>
          <div className="dot"></div>
        </div>
        
        {/* Message */}
        {message && (
          <div className="professional-loading-message">
            <span className="loading-text">{message}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export const ErrorMessage = ({ error, onRetry, onDismiss }) => {
  if (!error) return null;

  return (
    <div className="error-container">
      <div className="error-message">
        <h4>Something went wrong</h4>
        <p>{error}</p>
        <div className="error-actions">
          {onRetry && (
            <button className="btn btn-primary" onClick={onRetry}>
              Try Again
            </button>
          )}
          {onDismiss && (
            <button className="btn btn-secondary" onClick={onDismiss}>
              Dismiss
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export const SuccessMessage = ({ message, onDismiss, autoHide = true }) => {
  React.useEffect(() => {
    if (autoHide && onDismiss) {
      const timer = setTimeout(onDismiss, 3000);
      return () => clearTimeout(timer);
    }
  }, [autoHide, onDismiss]);

  if (!message) return null;

  return (
    <div className="success-container">
      <div className="success-message">
        <div style={{ whiteSpace: 'pre-line', lineHeight: '1.6' }}>
          {message}
        </div>
        {onDismiss && (
          <button className="success-dismiss" onClick={onDismiss}>
            ×
          </button>
        )}
      </div>
    </div>
  );
};

export default { LoadingSpinner, ErrorMessage, SuccessMessage };