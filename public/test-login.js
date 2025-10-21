// Test the login from the frontend
const testFrontendLogin = async () => {
  try {
    console.log('🧪 Testing frontend login integration...');
    
    const response = await fetch('/api/auth/login', {
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