const https = require('https');
const http = require('http');
const querystring = require('querystring');

async function testInventoryCreation() {
  try {
    // First, let's test a simple POST request to create inventory
    console.log('🧪 Testing inventory creation endpoint...');
    
    const testData = {
      itemName: 'Test API Item ' + Date.now(),
      itemId: 'TEST-API-' + Date.now(),
      description: 'Test item from API',
      costPrice: 100,
      sellingPrice: 150,
      quantity: 10
    };

    console.log('📦 Test data:', testData);

    const postData = JSON.stringify(testData);
    
    const options = {
      hostname: '127.0.0.1',
      port: 5000,
  path: '/api/stock',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const response = await new Promise((resolve, reject) => {
      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            const parsedData = JSON.parse(data);
            resolve({ status: res.statusCode, data: parsedData });
          } catch (err) {
            resolve({ status: res.statusCode, data: data });
          }
        });
      });

      req.on('error', (err) => {
        reject(err);
      });

      req.write(postData);
      req.end();
    });

    console.log('📋 Response status:', response.status);
    console.log('📋 Response data:', response.data);

    if (response.status !== 200 && response.status !== 201) {
      console.log('❌ Request failed, checking error details...');
      if (response.data.errors) {
        console.log('📋 Validation errors:', response.data.errors);
      }
    } else {
      console.log('✅ Item created successfully!');
    }

  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testInventoryCreation();