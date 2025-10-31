const { Resend } = require('resend');
const resend = new Resend('re_41F7sfeh_2hkxdCm57uyNTCXjjmEsoS5h');

async function checkEmailStatus() {
  console.log('📊 Checking Resend API response details...\n');
  
  try {
    const result = await resend.emails.send({
      from: 'Blue Roof Lounge <onboarding@resend.dev>',
      to: 'ibrahimusuman474@gmail.com',
      subject: '🔍 Email Delivery Test',
      html: '<h2>Testing email delivery...</h2><p>If you receive this, verification is working!</p>'
    });
    
    console.log('✅ API Response:', JSON.stringify(result, null, 2));
    
    if (result.error) {
      console.log('❌ Error detected:', result.error);
    } else if (result.data) {
      console.log('✅ Email appears to have been sent successfully');
      console.log('📧 Message ID:', result.data.id);
    }
    
  } catch (error) {
    console.log('❌ API Error:', error.message);
    
    if (error.message.includes('403')) {
      console.log('\n💡 HTTP 403 Forbidden Error Explanation:');
      console.log('   This means the email address is NOT verified in your Resend account');
      console.log('\n🔧 How to Fix:');
      console.log('   1. Go to: https://resend.com/audiences');
      console.log('   2. Find: ibrahimusuman474@gmail.com');
      console.log('   3. Status should show "Verified" (green checkmark)');
      console.log('   4. If status shows "Pending", click "Resend Verification"');
      console.log('   5. Ask Ibrahimu to check his email for verification link');
      console.log('   6. He must click the link to verify his email address');
      console.log('\n📝 Note: onboarding@resend.dev only sends to verified contacts');
    }
    
    console.log('\n📋 Full error details:', JSON.stringify(error, null, 2));
  }
}

checkEmailStatus();