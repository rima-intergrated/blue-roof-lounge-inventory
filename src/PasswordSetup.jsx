import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { authAPI, API_BASE_URL } from './services/api';
import './PasswordSetup.css';

function PasswordSetup() {
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [tokenValid, setTokenValid] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  // Extract token and userId from URL params
  const urlParams = new URLSearchParams(location.search);
  const token = urlParams.get('token');
  const userId = urlParams.get('userId');

  useEffect(() => {
    verifyToken();
  }, []);

  const verifyToken = async () => {
    if (!token || !userId) {
      setError('Invalid password setup link. Please check your email for the correct link.');
      setLoading(false);
      return;
    }

    try {
      const response = await authAPI.verifyPasswordSetupToken(token, userId);

      if (response.success) {
        setUserInfo(response.data);
        setTokenValid(true);
        setMessage(`Welcome ${response.data.name}! Please set up your password to complete your account registration.`);
      } else {
        setError(response.message || 'Invalid or expired token');
      }
    } catch (err) {
      console.error('Token verification error:', err);
      setError('Failed to verify token. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear errors when user starts typing
    if (error) setError('');
  };

  const validatePassword = () => {
    if (!formData.password) {
      setError('Password is required');
      return false;
    }
    
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validatePassword()) return;
    
    setSubmitting(true);
    setError('');

    try {
      const response = await authAPI.setupPassword(token, userId, formData.password, formData.confirmPassword);

      if (response.success) {
        // Store the JWT token
        localStorage.setItem('authToken', response.data.token);
        
        // Store user data
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        setMessage('Password setup completed successfully! Redirecting to dashboard...');
        
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          navigate('/sales');
        }, 2000);
      } else {
        setError(data.message || 'Failed to setup password');
      }
    } catch (err) {
      console.error('Password setup error:', err);
      setError('Failed to setup password. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const resendInstructions = async () => {
    if (!userInfo?.email) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/password-setup/resend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: userInfo.email }),
      });

      const data = await response.json();
      
      if (data.success) {
        setMessage('New password setup instructions have been sent to your email.');
      } else {
        setError(data.message || 'Failed to resend instructions');
      }
    } catch (err) {
      setError('Failed to resend instructions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="password-setup-container">
        <div className="password-setup-card">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Verifying your password setup link...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="password-setup-container">
        <div className="password-setup-card">
          <div className="error-state">
            <h2>Invalid Link</h2>
            <p className="error-message">{error}</p>
            <div className="action-buttons">
              <button 
                onClick={() => navigate('/login')}
                className="btn btn-primary"
              >
                Go to Login
              </button>
              {userInfo?.email && (
                <button 
                  onClick={resendInstructions}
                  className="btn btn-secondary"
                  disabled={loading}
                >
                  {loading ? 'Sending...' : 'Resend Instructions'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="password-setup-container">
      <div className="password-setup-card">
        <div className="header">
          <h1>Welcome to Blue Roof Lounge! <i className="fas fa-party-horn"></i></h1>
          {userInfo && (
            <div className="user-welcome">
              <h2>Hi {userInfo.name}!</h2>
              <p>Position: <strong>{userInfo.position}</strong></p>
              <p>Email: <strong>{userInfo.email}</strong></p>
            </div>
          )}
        </div>

        {message && (
          <div className="success-message">
            <p>{message}</p>
          </div>
        )}

        {error && (
          <div className="error-message">
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="password-setup-form">
          <h3>Set Up Your Password</h3>
          <p>Please create a secure password to complete your account setup.</p>

          <div className="form-group">
            <label htmlFor="password">New Password *</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Enter your new password"
              required
              minLength="6"
              disabled={submitting}
            />
            <small>Password must be at least 6 characters long</small>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password *</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              placeholder="Confirm your new password"
              required
              minLength="6"
              disabled={submitting}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-large"
            disabled={submitting}
          >
            {submitting ? 'Setting Up Password...' : 'Complete Setup'}
          </button>
        </form>

        <div className="footer">
          <p>
            Need help? Contact your manager or IT support.
          </p>
        </div>
      </div>
    </div>
  );
}

export default PasswordSetup;