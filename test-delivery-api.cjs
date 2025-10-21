// Test script for Delivery Notes and Receipts API
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const BASE_URL = 'http://localhost:5000/api';

// Test functions
async function testHealthCheck() {
  console.log('🔍 Testing health check...');
  try {
    const response = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    return false;
  }
}

async function testAuthLogin() {
  console.log('🔐 Testing authentication...');
  try {
    // Try to login with test credentials
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'test@example.com', // Replace with actual test credentials
      password: 'password123'
    });
    
    if (response.data.success && response.data.token) {
      console.log('✅ Login successful');
      return response.data.token;
    } else {
      console.log('❌ Login failed:', response.data.message);
      return null;
    }
  } catch (error) {
    console.log('❌ Login error:', error.response?.data?.message || error.message);
    return null;
  }
}

async function testDeliveryDocumentsAPI(token) {
  console.log('📋 Testing delivery documents API...');
  
  const headers = {
    'Authorization': `Bearer ${token}`
  };

  try {
    // Test getting statistics
    console.log('📊 Testing statistics endpoint...');
    const statsResponse = await axios.get(`${BASE_URL}/delivery-notes-receipts/stats`, { headers });
    console.log('✅ Stats response:', statsResponse.data);

    // Test getting all documents
    console.log('📄 Testing get all documents...');
    const allDocsResponse = await axios.get(`${BASE_URL}/delivery-notes-receipts`, { headers });
    console.log('✅ All documents response:', {
      success: allDocsResponse.data.success,
      count: allDocsResponse.data.data?.documents?.length || 0,
      pagination: allDocsResponse.data.data?.pagination
    });

    return true;
  } catch (error) {
    console.error('❌ Delivery documents API test failed:', error.response?.data || error.message);
    return false;
  }
}

async function testCreateDeliveryDocument(token) {
  console.log('📝 Testing create delivery document...');
  
  // Create a simple test file
  const testContent = 'This is a test delivery receipt document';
  const testFileName = 'test-receipt.txt';
  
  try {
    fs.writeFileSync(testFileName, testContent);
    
    const formData = new FormData();
    formData.append('deliveryDocument', fs.createReadStream(testFileName));
    formData.append('inventoryItemId', '507f1f77bcf86cd799439011'); // Dummy ObjectId
    formData.append('itemName', 'Test Item');
    formData.append('itemId', 'TEST-001');
    formData.append('transactionId', 'TEST-' + Date.now());
    formData.append('description', 'Test delivery document');
    formData.append('quantity', '5');
    formData.append('costPrice', '10.00');
    formData.append('sellingPrice', '15.00');
    formData.append('deliveryNote', 'Test delivery note');

    const response = await axios.post(`${BASE_URL}/delivery-notes-receipts`, formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        ...formData.getHeaders()
      }
    });

    console.log('✅ Create document response:', {
      success: response.data.success,
      message: response.data.message,
      documentId: response.data.data?.document?._id
    });

    // Clean up test file
    fs.unlinkSync(testFileName);
    
    return response.data.data?.document?._id;
  } catch (error) {
    console.error('❌ Create delivery document failed:', error.response?.data || error.message);
    // Clean up test file if it exists
    try {
      fs.unlinkSync(testFileName);
    } catch (e) {}
    return null;
  }
}

// Run all tests
async function runTests() {
  console.log('🚀 Starting Delivery Notes & Receipts API Tests\n');
  
  // Test 1: Health check
  const healthOk = await testHealthCheck();
  if (!healthOk) {
    console.log('❌ Server not responding. Make sure the backend is running on port 5000.');
    return;
  }
  
  console.log('');
  
  // Test 2: Authentication
  const token = await testAuthLogin();
  if (!token) {
    console.log('❌ Authentication failed. Using tests that don\'t require auth only.');
    return;
  }
  
  console.log('');
  
  // Test 3: API endpoints
  const apiOk = await testDeliveryDocumentsAPI(token);
  
  console.log('');
  
  // Test 4: Create document (optional - only if you want to test creation)
  // const documentId = await testCreateDeliveryDocument(token);
  
  console.log('\n🎉 Test completed!');
  console.log('✅ Health check: OK');
  console.log(`✅ Authentication: ${token ? 'OK' : 'FAILED'}`);
  console.log(`✅ API endpoints: ${apiOk ? 'OK' : 'FAILED'}`);
}

// Run the tests
runTests().catch(console.error);