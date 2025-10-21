const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testWeb3Forms() {
  try {
    console.log('🧪 Testing Web3Forms API...');
    
    const params = new URLSearchParams();
    params.append("access_key", "8f3bd8f4-57a3-4a6c-9bfc-ee63ba778c52");
    params.append("name", "Blue Roof Restaurant");
    params.append("email", "dreamlightmw@gmail.com");
    params.append("subject", "Test Email from Blue Roof Restaurant");
    params.append("message", "This is a test email to verify the Web3Forms integration works correctly.");
    
    console.log('📤 Sending test email...');
    
    const response = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString()
    });

    const data = await response.json();
    
    console.log('📨 Response:', data);
    
    if (data.success) {
      console.log('✅ Test email sent successfully!');
    } else {
      console.log('❌ Test email failed:', data.message);
    }
    
  } catch (error) {
    console.error('❌ Error testing Web3Forms:', error);
  }
}

testWeb3Forms();