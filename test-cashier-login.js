// Test login flow for cashier user
async function testCashierLogin() {
    try {
        console.log('🧪 Testing cashier user login flow...');
        
        const API_BASE_URL = 'http://localhost:5000/api';
        
        const apiRequest = async (endpoint, options = {}) => {
            const url = `${API_BASE_URL}${endpoint}`;
            console.log(`📡 Making request to: ${url}`);
            
            const defaultHeaders = {
                'Content-Type': 'application/json',
            };
            
            // Add auth token if available
            const token = global.testToken;
            if (token) {
                defaultHeaders.Authorization = `Bearer ${token}`;
            }
            
            const config = {
                headers: defaultHeaders,
                ...options,
            };
            
            const response = await fetch(url, config);
            console.log(`📊 Response status: ${response.status}`);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.log(`❌ Error response: ${errorText}`);
                throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
            }
            
            return await response.json();
        };
        
        // Step 1: Login as cashier
        console.log('\n🔐 Step 1: Login as cashier (dreamlightmw@gmail.com)...');
        const loginResponse = await apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({
                email: 'dreamlightmw@gmail.com',
                password: 'cashier123' // Updated password
            })
        });
        
        console.log('✅ Login successful!');
        console.log('👤 User data:', loginResponse.data.user);
        console.log('🔑 Has staffId:', !!loginResponse.data.user.staffId);
        
        // Store token for next requests
        global.testToken = loginResponse.data.token;
        
        // Step 2: Get user permissions
        console.log('\n🔒 Step 2: Getting user permissions...');
        const permissionsResponse = await apiRequest('/auth/permissions');
        
        console.log('✅ Permissions retrieved!');
        console.log('🏷️  Position Title:', permissionsResponse.data.positionTitle);
        console.log('🔑 Permissions:', JSON.stringify(permissionsResponse.data.permissions, null, 2));
        
        // Check if this would cause "no positions assigned" message
        if (!permissionsResponse.data.positionTitle) {
            console.log('❌ ISSUE FOUND: No position title returned - this would show "no positions assigned"');
        } else {
            console.log('✅ Position title found - should display correctly');
        }
        
        // Step 3: Get user profile
        console.log('\n👤 Step 3: Getting user profile...');
        const profileResponse = await apiRequest('/auth/profile');
        
        console.log('✅ Profile retrieved!');
        console.log('📧 Email:', profileResponse.data.email);
        console.log('👤 Username:', profileResponse.data.username);
        console.log('🏢 Has Staff ID:', !!profileResponse.data.staffId);
        
        console.log('\n🎉 All API calls completed successfully!');
        console.log('🔧 The double /api issue has been resolved.');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        
        if (error.message.includes('401')) {
            console.log('💡 This might be a password issue. Try with the correct password.');
        } else if (error.message.includes('404')) {
            console.log('💡 This indicates an endpoint issue.');
        }
    }
}

testCashierLogin();