const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testRegistration() {
  try {
    console.log('🧪 Testing Registration with detailed debug...\n');
    
    const testUser = {
      username: "debuguser123",
      email: "debug@bluerooflounge.com",
      password: "DebugPass123",
      role: "Cashier"
    };
    
    console.log('📤 Request Details:');
    console.log('URL:', 'http://localhost:5000/api/auth/register');
    console.log('Method: POST');
    console.log('Headers:', { 'Content-Type': 'application/json' });
    console.log('Body:', JSON.stringify(testUser, null, 2));
    console.log('\n⏳ Sending request...\n');
    
    const response = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUser)
    });
    
    const result = await response.json();
    
    console.log('📨 Response Status:', response.status);
    console.log('📋 Response Headers:', Object.fromEntries(response.headers));
    console.log('📄 Response Body:');
    console.log(JSON.stringify(result, null, 2));
    
    if (response.ok) {
      console.log('\n✅ Registration successful!');
    } else {
      console.log('\n❌ Registration failed!');
      
      if (result.errors) {
        console.log('\n🔍 Validation Errors:');
        result.errors.forEach(error => {
          console.log(`  - Field: ${error.path}`);
          console.log(`    Value: "${error.value}"`);
          console.log(`    Message: ${error.msg}\n`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testRegistration();
