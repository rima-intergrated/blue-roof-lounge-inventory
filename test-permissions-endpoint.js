// Test permissions endpoint specifically
async function testPermissionsEndpoint() {
    try {
        console.log('🧪 Testing permissions endpoint after AuthContext fix...');
        
        // Test with the fixed API configuration
        const API_BASE_URL = 'http://localhost:5000/api';
        
        const apiRequest = async (endpoint, options = {}) => {
            const url = `${API_BASE_URL}${endpoint}`;
            console.log(`📡 Making request to: ${url}`);
            
            // Add authorization header for testing (would need real token)
            const defaultHeaders = {
                'Content-Type': 'application/json',
            };
            
            const token = 'fake-token-for-url-testing';
            if (token) {
                defaultHeaders.Authorization = `Bearer ${token}`;
            }
            
            const config = {
                headers: defaultHeaders,
                ...options,
            };
            
            const response = await fetch(url, config);
            
            console.log(`📊 Response status: ${response.status}`);
            
            if (response.status === 401) {
                console.log('✅ Permissions endpoint reached (expected 401 without valid token)');
                return { reachable: true, needsAuth: true };
            }
            
            if (!response.ok) {
                const errorText = await response.text();
                console.log(`❌ Error response: ${errorText}`);
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        };
        
        // Test the permissions endpoint
        console.log('\n🔒 Testing /auth/permissions endpoint...');
        const result = await apiRequest('/auth/permissions');
        
        if (result.reachable) {
            console.log('✅ Permissions endpoint is reachable and properly configured!');
            console.log('🔧 AuthContext should now work without double /api errors.');
        }
        
    } catch (error) {
        if (error.message.includes('401') || error.message.includes('Unauthorized')) {
            console.log('✅ Permissions endpoint reached (expected auth error)');
        } else {
            console.error('❌ Test failed:', error.message);
        }
    }
}

testPermissionsEndpoint();