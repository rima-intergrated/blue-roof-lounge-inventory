const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Your login token from the previous login
const AUTH_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGQ1ZjJkOTQ0ODE0YTViOTMwNzk2YWUiLCJpYXQiOjE3NTg4NTI2MzIsImV4cCI6MTc1OTQ1NzQzMn0.6zHkVrjbbKlm8L7QeKvNyWVUyBHga45uhVQxZLmx1iA";

async function testProtectedEndpoints() {
  console.log('🧪 Testing Protected API Endpoints\n');
  console.log('=' .repeat(50));

  // Test 1: Get User Profile
  console.log('\n📋 Test 1: Getting User Profile...');
  try {
    const profileResponse = await fetch('http://localhost:5000/api/auth/profile', {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`
      }
    });
    
    const profile = await profileResponse.json();
    console.log('Status:', profileResponse.status);
    
    if (profileResponse.ok) {
      console.log('✅ Profile Retrieved Successfully!');
      console.log(`👤 Welcome, ${profile.data.user.username} (${profile.data.user.role})`);
    } else {
      console.log('❌ Profile Failed:', profile.message);
    }
  } catch (error) {
    console.log('❌ Profile Error:', error.message);
  }

  // Test 2: Check Staff Endpoint
  console.log('\n👥 Test 2: Checking Staff Endpoint...');
  try {
    const staffResponse = await fetch('http://localhost:5000/api/staff', {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`
      }
    });
    
    const staff = await staffResponse.json();
    console.log('Status:', staffResponse.status);
    console.log('Response:', JSON.stringify(staff, null, 2));
  } catch (error) {
    console.log('❌ Staff Error:', error.message);
  }

  // Test 3: Check Sales Endpoint
  console.log('\n💰 Test 3: Checking Sales Endpoint...');
  try {
    const salesResponse = await fetch('http://localhost:5000/api/sales', {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`
      }
    });
    
    const sales = await salesResponse.json();
    console.log('Status:', salesResponse.status);
    console.log('Response:', JSON.stringify(sales, null, 2));
  } catch (error) {
    console.log('❌ Sales Error:', error.message);
  }

  // Test 4: Database Stats
  console.log('\n📊 Test 4: Database Statistics...');
  try {
    const statsResponse = await fetch('http://localhost:5000/api/test/stats');
    const stats = await statsResponse.json();
    
    if (stats.success) {
      console.log('✅ Database Stats Retrieved!');
      console.log(`📋 Database: ${stats.data.database.name}`);
      console.log(`📦 Size: ${stats.data.database.size}`);
      console.log(`🗂️  Collections: ${stats.data.collections.length}`);
      console.log('\n📊 Document Counts:');
      for (const [model, count] of Object.entries(stats.data.models)) {
        console.log(`   ${model}: ${count} documents`);
      }
    }
  } catch (error) {
    console.log('❌ Stats Error:', error.message);
  }

  console.log('\n' + '='.repeat(50));
  console.log('🎉 API Testing Complete!');
  console.log('\n💡 Next Steps:');
  console.log('   1. Try these same requests in Postman');
  console.log('   2. Test creating staff members');
  console.log('   3. Test creating sales records');
  console.log('   4. Explore the database in MongoDB Compass');
}

testProtectedEndpoints();
