const axios = require('axios');

async function testExpenseCategories() {
    const baseURL = 'http://127.0.0.1:5000/api';
    
    try {
        console.log('\n📊 Testing Expense Categories API...\n');
        
        // Test GET all expense categories
        console.log('1. Testing GET /api/expense-categories');
        const getResponse = await axios.get(`${baseURL}/expense-categories`);
        console.log('✅ Status:', getResponse.status);
        console.log('📊 Current expense categories:', getResponse.data);
        console.log('📈 Count:', getResponse.data.length);
        
        // Test POST - Create new expense category
        console.log('\n2. Testing POST /api/expense-categories');
        const newCategory = {
            name: 'Test Category',
            description: 'Test expense category for API testing'
        };
        
        const createResponse = await axios.post(`${baseURL}/expense-categories`, newCategory);
        console.log('✅ Status:', createResponse.status);
        console.log('📝 Created:', createResponse.data);
        
        const createdId = createResponse.data._id;
        
        // Test GET again to verify creation
        console.log('\n3. Testing GET again after creation');
        const getResponse2 = await axios.get(`${baseURL}/expense-categories`);
        console.log('✅ Status:', getResponse2.status);
        console.log('📊 Updated count:', getResponse2.data.length);
        
        // Test DELETE
        console.log('\n4. Testing DELETE /api/expense-categories/:id');
        const deleteResponse = await axios.delete(`${baseURL}/expense-categories/${createdId}`);
        console.log('✅ Status:', deleteResponse.status);
        console.log('🗑️  Deleted:', deleteResponse.data);
        
        // Final GET to verify deletion
        console.log('\n5. Testing GET after deletion');
        const getResponse3 = await axios.get(`${baseURL}/expense-categories`);
        console.log('✅ Status:', getResponse3.status);
        console.log('📊 Final count:', getResponse3.data.length);
        
        console.log('\n🎉 All expense category API tests completed successfully!');
        
    } catch (error) {
        console.error('❌ Error testing expense categories API:');
        console.error('Error message:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
            console.error('Headers:', error.response.headers);
        } else if (error.request) {
            console.error('Request was made but no response received');
            console.error('Request:', error.request);
        } else {
            console.error('Error setting up request:', error.message);
        }
    }
}

testExpenseCategories();