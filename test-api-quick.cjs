// Quick test script to check if delivery documents API is accessible
const axios = require('axios');

async function testDeliveryAPI() {
  try {
    console.log('🔍 Testing delivery documents API...');
    
    // Test without auth first
    const response = await axios.get('http://localhost:5000/api/delivery-notes-receipts', {
      timeout: 5000
    });
    
    console.log('✅ API Response:', response.data);
  } catch (error) {
    if (error.response) {
      console.log('📋 API responded with:', error.response.status, error.response.data);
    } else {
      console.log('❌ Network error:', error.message);
    }
  }
}

testDeliveryAPI();