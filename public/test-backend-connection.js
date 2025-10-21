// Test script to check if backend API is responding
console.log('🔍 Testing backend API connection...');

async function testBackendConnection() {
  try {
    console.log('📡 Testing health endpoint...');
    const healthResponse = await fetch('http://localhost:5000/api/health');
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ Backend health check successful:', healthData);
    } else {
      console.log('❌ Backend health check failed:', healthResponse.status, healthResponse.statusText);
    }
  } catch (error) {
    console.log('❌ Backend connection failed:', error.message);
    console.log('💡 Make sure the backend server is running on port 5000');
    console.log('💡 Start the backend with: cd backend && node server.js');
  }

  try {
    console.log('📡 Testing permissions endpoint...');
    const permissionsResponse = await fetch('http://localhost:5000/api/auth/permissions', {
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📋 Permissions endpoint response status:', permissionsResponse.status);
  } catch (error) {
    console.log('❌ Permissions endpoint test failed:', error.message);
  }
}

testBackendConnection();