const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function viewDatabaseUsers() {
  try {
    console.log('🗃️  Checking Database for Users...\n');
    
    // Test database stats
    console.log('📊 Getting Database Statistics:');
    const statsResponse = await fetch('http://localhost:5000/api/test/stats');
    const stats = await statsResponse.json();
    
    if (stats.success) {
      console.log(`📋 Database: ${stats.data.database.name}`);
      console.log(`🏠 Host: ${stats.data.database.host}`);
      console.log(`📦 Size: ${stats.data.database.size}`);
      console.log(`📁 Collections: ${stats.data.collections.join(', ')}`);
      console.log(`👥 Users in database: ${stats.data.models.User || 0}`);
      console.log('\n' + '='.repeat(50) + '\n');
    }
    
    // Try to login with the user we created
    console.log('🔐 Testing Login with Created User:');
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: "jane@bluerooflounge.com",
        password: "Manager456"
      })
    });
    
    const loginResult = await loginResponse.json();
    
    if (loginResponse.ok) {
      console.log('✅ Login Successful!');
      console.log('👤 User Details from Login:');
      console.log(`   ID: ${loginResult.data.user.id}`);
      console.log(`   Username: ${loginResult.data.user.username}`);
      console.log(`   Email: ${loginResult.data.user.email}`);
      console.log(`   Role: ${loginResult.data.user.role}`);
      console.log(`   Created: ${new Date(loginResult.data.user.createdAt).toLocaleString()}`);
      console.log(`   Active: ${loginResult.data.user.isActive}`);
      
      // Get user profile using the token
      console.log('\n👤 Getting User Profile:');
      const profileResponse = await fetch('http://localhost:5000/api/auth/profile', {
        headers: {
          'Authorization': `Bearer ${loginResult.data.token}`
        }
      });
      
      const profile = await profileResponse.json();
      if (profile.success) {
        console.log('✅ Profile Retrieved Successfully!');
        console.log('📋 Full User Data from Database:');
        console.log(JSON.stringify(profile.data.user, null, 2));
      }
      
    } else {
      console.log('❌ Login Failed:', loginResult.message);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

viewDatabaseUsers();
