import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import usePermissions from './hooks/usePermissions'
import { LoadingSpinner, ErrorMessage } from './components/common/FeedbackComponents'

function LogIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { login, loading, error, clearError } = useAuth()
  const { getAccessibleModules } = usePermissions()
  const navigate = useNavigate()

  const getDefaultRoute = () => {
    const accessibleModules = getAccessibleModules();
    const routePriority = ['sales', 'inventory', 'hrm', 'payroll', 'reports', 'settings'];
    const defaultModule = routePriority.find(module => accessibleModules.includes(module));
    return defaultModule || (accessibleModules.length > 0 ? accessibleModules[0] : 'sales');
  };

  const handleLogin = async (e) => {
    if (e) e.preventDefault()
    
    // Simple validation - just check if both fields are filled
    if (!email.trim() || !password.trim()) {
      alert('Please enter both email and password')
      return
    }

    clearError()
    const result = await login(email, password)
    
    if (result.success) {
      // Check if there's a stored redirect path
      const redirectPath = localStorage.getItem('redirectAfterLogin')
      if (redirectPath && 
          redirectPath !== '/login' && 
          redirectPath !== '/setup-password' &&
          redirectPath.startsWith('/') &&
          redirectPath.length > 1) {
        localStorage.removeItem('redirectAfterLogin')
        navigate(redirectPath)
      } else {
        // Navigate to user's default accessible route
        const defaultRoute = getDefaultRoute();
        const validRoute = defaultRoute.startsWith('/') ? defaultRoute : `/${defaultRoute}`;
        navigate(validRoute)
      }
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleLogin()
    }
  }

  return (
    <div className='login-container'>
      <div className='login-form'>
        <h2>Welcome to Blue Roof Lounge</h2>
        <p>We're excited to see you</p>
        
        {error && <ErrorMessage error={error} onDismiss={clearError} />}
        
        <form onSubmit={handleLogin}>
          <label htmlFor="email">Email</label>
          <input 
            id="email"
            type="email" 
            placeholder='Email' 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading}
            required
          />
          <label htmlFor="password">Password</label>
          <input 
            id="password"
            type="password" 
            placeholder='Password' 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading}
            required
          />
          <p className='forgot-password'>Forgot your password?</p>
          
          <button 
            className='login-btn' 
            type="submit"
            disabled={loading}
          >
            {loading ? <LoadingSpinner size="small" message="" /> : 'Log In'}
          </button>
        </form>
        
        <p className='contact-support'>Contact support</p>
      </div>
    </div>
  )
}

export default LogIn