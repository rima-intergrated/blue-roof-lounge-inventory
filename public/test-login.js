// Test the login from the frontend
const testFrontendLogin = async () => {
  try {
    console.log('🧪 Testing frontend login integration...');
    // Use an explicit API base so this test works when the static frontend
    // is served from a different origin (Vercel). Prefer a window override
    // for local quick tests: set window.__API_BASE__ in the console.
    const API_BASE = window.__API_BASE__ || 'https://blue-roof-lounge-backend.onrender.com/api';

    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@bluerooflounge.com',
        password: 'TestPass123'
      }),
    });

    const data = await response.json();
    
    console.log('📡 Response Status:', response.status);
    console.log('📋 Response Data:', data);
    
    if (data.success) {
      console.log('✅ Frontend login successful!');
      console.log('🔑 Token received:', data.data && data.data.token ? 'Yes' : 'No');
      console.log('👤 User data:', data.data ? data.data.user : 'No user data');
      
      // Store token for testing
      if (data.data && data.data.token) {
        localStorage.setItem('authToken', data.data.token);
        console.log('💾 Token stored in localStorage');
      }
    } else {
      console.log('❌ Frontend login failed:', data.message);
    }
  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
};

// Test when page loads
window.addEventListener('load', testFrontendLogin);