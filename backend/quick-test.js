const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testRegistration() {
  try {
    console.log('🧪 Testing User Registration API...\n');
    
    const testUser = {
      username: "testuser123",
      email: "test@bluerooflounge.com",
      password: "TestPass123",
      role: "Cashier"
    };
    
    console.log('📤 Sending registration request:');
    console.log(JSON.stringify(testUser, null, 2));
    
    const response = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUser)
    });
    
    const result = await response.json();
    
    console.log('\n📨 Response Status:', response.status);
    console.log('📋 Response Body:');
    console.log(JSON.stringify(result, null, 2));
    
    if (response.ok) {
      console.log('\n✅ Registration successful!');
    } else {
      console.log('\n❌ Registration failed!');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

async function testHealth() {
  try {
    console.log('🏥 Testing Health Endpoint...\n');
    
    const response = await fetch('http://localhost:5000/api/health');
    const result = await response.json();
    
    console.log('📨 Response Status:', response.status);
    console.log('📋 Response Body:');
    console.log(JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('❌ Health test failed:', error.message);
  }
}

async function runTests() {
  console.log('🚀 Blue Roof Lounge API Test Suite\n');
  console.log('=' .repeat(50));
  
  await testHealth();
  console.log('\n' + '-'.repeat(50) + '\n');
  await testRegistration();
}

runTests();
