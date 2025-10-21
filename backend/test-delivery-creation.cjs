// Test delivery document creation
const fs = require('fs');
const path = require('path');

async function testDeliveryDocumentCreation() {
  try {
    console.log('🧪 Testing delivery document creation...');
    
    // First, let's try to get a valid auth token
    console.log('🔐 Attempting login...');
    
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@blueroof.com', // Try common admin credentials
        password: 'admin123'
      }),
    });
    
    if (!loginResponse.ok) {
      console.log('❌ Login failed with admin credentials, trying other credentials...');
      
      // Try different credentials
      const loginResponse2 = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123'
        }),
      });
      
      if (!loginResponse2.ok) {
        const errorData = await loginResponse2.json().catch(() => ({}));
        console.log('❌ Login failed:', errorData.message || 'Unknown error');
        return;
      }
      
      const loginData = await loginResponse2.json();
      if (!loginData.success || !loginData.token) {
        console.log('❌ Login response invalid:', loginData);
        return;
      }
      
      console.log('✅ Login successful with test credentials');
      await testCreateDeliveryDocument(loginData.token);
    } else {
      const loginData = await loginResponse.json();
      if (!loginData.success || !loginData.token) {
        console.log('❌ Login response invalid:', loginData);
        return;
      }
      
      console.log('✅ Login successful with admin credentials');
      await testCreateDeliveryDocument(loginData.token);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

async function testCreateDeliveryDocument(token) {
  try {
    console.log('📝 Testing delivery document creation with token...');
    
    // Create a test file
    const testContent = 'This is a test delivery receipt file for API testing.';
    const testFilePath = path.join(__dirname, 'test-receipt.txt');
    fs.writeFileSync(testFilePath, testContent);
    
    // Create FormData
    const FormData = require('form-data');
    const formData = new FormData();
    
    formData.append('deliveryDocument', fs.createReadStream(testFilePath));
    formData.append('inventoryItemId', '6543a1b2c3d4e5f6789012ab'); // Dummy but valid ObjectId
    formData.append('itemName', 'Test Item for API');
    formData.append('itemId', 'TEST-API-001');
    formData.append('transactionId', 'TEST-' + Date.now());
    formData.append('description', 'Test delivery document via API');
    formData.append('quantity', '10');
    formData.append('costPrice', '25.50');
    formData.append('sellingPrice', '35.00');
    formData.append('deliveryNote', 'Test delivery note from API test');
    
    const response = await fetch('http://localhost:5000/api/delivery-notes-receipts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        ...formData.getHeaders()
      },
      body: formData,
    });
    
    const responseData = await response.json();
    
    if (response.ok && responseData.success) {
      console.log('✅ Delivery document created successfully!');
      console.log('📄 Document ID:', responseData.data?.document?._id);
      console.log('📋 Document details:', {
        fileName: responseData.data?.document?.originalName,
        itemName: responseData.data?.document?.itemName,
        transactionId: responseData.data?.document?.transactionId
      });
    } else {
      console.log('❌ Failed to create delivery document:');
      console.log('📋 Response:', responseData);
    }
    
    // Clean up test file
    fs.unlinkSync(testFilePath);
    
  } catch (error) {
    console.error('❌ Error testing delivery document creation:', error);
  }
}

testDeliveryDocumentCreation();