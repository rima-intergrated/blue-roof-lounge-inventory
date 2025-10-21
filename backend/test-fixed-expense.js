// Test the fixed expense category API
const http = require('http');

function testCreateExpenseCategory() {
    const postData = JSON.stringify({
        "name": "Office Supplies",
        "expenseId": "BRL001",
        "description": "Office Supplies expense category"
    });

    const options = {
        hostname: 'localhost',
        port: 5000,
        path: '/api/expense-categories',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        }
    };

    const req = http.request(options, (res) => {
        console.log('✅ Status:', res.statusCode);
        console.log('📋 Headers:', res.headers);
        
        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            try {
                const jsonData = JSON.parse(data);
                console.log('📊 Response:', JSON.stringify(jsonData, null, 2));
            } catch (e) {
                console.log('📊 Raw Response:', data);
            }
            
            if (res.statusCode === 201) {
                console.log('🎉 SUCCESS: Expense category created successfully!');
            } else {
                console.log('❌ FAILED: Status code', res.statusCode);
            }
        });
    });

    req.on('error', (e) => {
        console.error('❌ Error:', e.message);
    });

    req.write(postData);
    req.end();
}

console.log('🚀 Testing expense category creation with fixed indexes...');
testCreateExpenseCategory();