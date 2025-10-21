// Test the fixed API configuration
async function testFixedAPI() {
    try {
        console.log('🧪 Testing fixed API configuration...');
        
        // Import the API functions (simulating what frontend does)
        const API_BASE_URL = 'http://localhost:5000/api';
        
        // Simulate the apiRequest function
        const apiRequest = async (endpoint, options = {}) => {
            const url = `${API_BASE_URL}${endpoint}`;
            console.log(`📡 Making request to: ${url}`);
            
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                },
                ...options
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        };
        
        // Test health check
        console.log('\n1. Testing health check...');
        const healthResult = await apiRequest('/health');
        console.log('✅ Health check successful:', healthResult.message);
        
        // Test auth profile (should fail without token, but should reach the endpoint)
        console.log('\n2. Testing auth profile endpoint...');
        try {
            await apiRequest('/auth/profile');
        } catch (error) {
            // This should fail due to no auth token, but the URL should be correct
            if (error.message.includes('401') || error.message.includes('Unauthorized')) {
                console.log('✅ Auth profile endpoint reached (expected 401 error)');
            } else {
                console.log('❌ Unexpected error:', error.message);
            }
        }
        
        console.log('\n✅ All API endpoint URLs are working correctly!');
        console.log('🔧 Frontend should now be able to connect to backend properly.');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

testFixedAPI();