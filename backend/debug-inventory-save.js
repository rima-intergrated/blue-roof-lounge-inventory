const fetch = require('node-fetch');
const FormData = require('form-data');

async function testInventoryCreation() {
  try {
    console.log('🧪 Testing inventory creation directly...');

    const testData = {
      itemName: 'Debug Test Item ' + Date.now(),
      itemId: 'DEBUG-' + Date.now(),
      description: 'Testing inventory save functionality',
      costPrice: 50,
      sellingPrice: 80,
      quantity: 15
    };

    console.log('📦 Test data:', testData);

    // Test the createWithFiles endpoint directly
    const formData = new FormData();
    Object.keys(testData).forEach(key => {
      formData.append(key, testData[key]);
    });

    // First get a valid token (you'll need to replace with actual token)
    console.log('🔑 Testing without authentication first...');

  const response = await fetch('http://127.0.0.1:5000/api/stock', {
      method: 'POST',
      body: formData
    });

    const result = await response.text();
    console.log('📋 Response status:', response.status);
    console.log('📋 Response:', result);

    if (response.status === 401) {
      console.log('❌ Authentication required - this is expected');
      console.log('✅ The API endpoint is working but requires authentication');
    } else if (response.status === 200 || response.status === 201) {
      console.log('✅ Item created successfully!');
    } else {
      console.log('❌ Unexpected response');
    }

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testInventoryCreation();