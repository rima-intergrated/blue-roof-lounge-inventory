// Test updating cashier permissions through API
async function testUpdateCashierPermissions() {
    try {
        console.log('🧪 Testing permission update workflow...');
        
        const API_BASE_URL = 'http://localhost:5000/api';
        
        const apiRequest = async (endpoint, options = {}) => {
            const url = `${API_BASE_URL}${endpoint}`;
            console.log(`📡 Making request to: ${url}`);
            
            const defaultHeaders = {
                'Content-Type': 'application/json',
            };
            
            // Use admin token for permission updates
            const adminToken = global.adminToken;
            if (adminToken) {
                defaultHeaders.Authorization = `Bearer ${adminToken}`;
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
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        };
        
        // Step 1: Login as admin
        console.log('\n🔐 Step 1: Login as admin...');
        const adminLogin = await apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({
                email: 'test@bluerooflounge.com',
                password: 'testpass123'
            })
        });
        
        console.log('✅ Admin login successful!');
        global.adminToken = adminLogin.data.token;
        
        // Step 2: Get all positions
        console.log('\n📋 Step 2: Getting all positions...');
        const positions = await apiRequest('/staff/positions');
        
        console.log(`✅ Found ${positions.data.positions.length} positions`);
        
        // Find the Cashier position
        const cashierPosition = positions.data.positions.find(p => p.positionTitle === 'Cashier');
        if (!cashierPosition) {
            console.log('❌ Cashier position not found');
            return;
        }
        
        console.log(`🏷️  Found Cashier position: ${cashierPosition._id}`);
        console.log(`🔑 Current permissions:`, JSON.stringify(cashierPosition.permissions, null, 2));
        
        // Step 3: Update Cashier permissions to include inventory
        console.log('\n🔧 Step 3: Updating Cashier permissions to include inventory access...');
        
        const updatedPermissions = {
            ...cashierPosition.permissions,
            inventory: {
                view: true,
                create: false,
                edit: false,
                delete: false,
                add: false
            }
        };
        
        const updateResponse = await apiRequest(`/staff/positions/${cashierPosition._id}`, {
            method: 'PUT',
            body: JSON.stringify({
                permissions: updatedPermissions
            })
        });
        
        console.log('✅ Cashier permissions updated successfully!');
        console.log('🔑 New permissions:', JSON.stringify(updatedPermissions, null, 2));
        
        // Step 4: Verify the change by logging in as cashier
        console.log('\n🧪 Step 4: Testing cashier login with new permissions...');
        
        const cashierLogin = await apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({
                email: 'dreamlightmw@gmail.com',
                password: 'cashier123'
            })
        });
        
        console.log('✅ Cashier login successful!');
        global.adminToken = null; // Clear admin token
        global.cashierToken = cashierLogin.data.token;
        
        // Step 5: Get cashier permissions
        console.log('\n🔒 Step 5: Getting cashier permissions after update...');
        const cashierPermissions = await apiRequest('/auth/permissions');
        
        console.log('✅ Updated cashier permissions retrieved!');
        console.log('🏷️  Position:', cashierPermissions.data.positionTitle);
        console.log('🔑 New permissions:', JSON.stringify(cashierPermissions.data.permissions, null, 2));
        
        // Check if inventory permission was added
        if (cashierPermissions.data.permissions.inventory && cashierPermissions.data.permissions.inventory.view) {
            console.log('\n🎉 SUCCESS! Cashier now has inventory view permission!');
            console.log('✅ The permission system is working correctly');
            console.log('🎯 Frontend will now show inventory section to cashier users');
        } else {
            console.log('\n❌ Inventory permission not found in cashier permissions');
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Helper function to reset permissions back
async function resetCashierPermissions() {
    console.log('\n🔄 Resetting cashier permissions to original state...');
    
    const API_BASE_URL = 'http://localhost:5000/api';
    
    const apiRequest = async (endpoint, options = {}) => {
        const url = `${API_BASE_URL}${endpoint}`;
        
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${global.adminToken}`
            },
            ...options,
        });
        
        return await response.json();
    };
    
    // Get cashier position
    const positions = await apiRequest('/staff/positions');
    const cashierPosition = positions.data.positions.find(p => p.positionTitle === 'Cashier');
    
    // Reset to original permissions
    const originalPermissions = {
        sales: {
            view: true,
            create: false,
            edit: false,
            delete: false,
            add: false
        },
        inventory: {
            view: false,
            create: false,
            edit: false,
            delete: false,
            add: false
        },
        hrm: {
            view: false,
            create: false,
            edit: false,
            delete: false,
            add: false
        },
        payroll: {
            view: false,
            create: false,
            edit: false,
            delete: false,
            process: false,
            approve: false
        },
        reports: {
            view: false,
            create: false,
            edit: false,
            delete: false,
            generate: false,
            export: false
        },
        settings: {
            view: false,
            create: false,
            edit: false,
            delete: false,
            systemConfig: false
        }
    };
    
    await apiRequest(`/staff/positions/${cashierPosition._id}`, {
        method: 'PUT',
        body: JSON.stringify({
            permissions: originalPermissions
        })
    });
    
    console.log('✅ Cashier permissions reset to original state');
}

testUpdateCashierPermissions();