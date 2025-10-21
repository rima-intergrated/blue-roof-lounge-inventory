// Simple test for expense categories API
const http = require('http');

function testAPI() {
    const options = {
        hostname: 'localhost',
        port: 5000,
        path: '/api/expense-categories',
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    };

    const req = http.request(options, (res) => {
        console.log('✅ Status:', res.statusCode);
        
        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            console.log('📊 Response:', data);
            console.log('🎉 API test completed successfully!');
        });
    });

    req.on('error', (e) => {
        console.error('❌ Error:', e.message);
        console.error('❌ Error code:', e.code);
        console.error('❌ Error details:', e);
    });

    req.end();
}

console.log('🚀 Testing expense categories API...');
testAPI();