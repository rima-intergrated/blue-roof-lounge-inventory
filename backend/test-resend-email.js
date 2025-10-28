/**
 * Quick Resend Email Test Script
 * Run this to verify your Resend API key works before deploying
 */

const { Resend } = require('resend');

// Your Resend API Key
const resend = new Resend('re_41F7sfeh_2hkxdCm57uyNTCXjjmEsoS5h');

async function testEmail() {
  console.log('🧪 Testing Resend Email API...\n');
  
  try {
    const result = await resend.emails.send({
      from: 'Blue Roof Lounge <onboarding@resend.dev>',
      to: 'dreamlightmw@gmail.com',
      subject: '🎉 Blue Roof Email System Test',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #185aca;">✅ Email System Working!</h1>
          <p>Congratulations! Your Blue Roof Lounge email notification system is configured correctly.</p>
          
          <div style="background: #f0f7ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #185aca;">What's Next:</h3>
            <ol style="line-height: 1.8;">
              <li>Add <code>RESEND_API_KEY</code> to Render environment</li>
              <li>Add <code>RESEND_FROM_EMAIL</code> to Render environment</li>
              <li>Wait for auto-deployment (2-3 minutes)</li>
              <li>Test staff registration in production</li>
            </ol>
          </div>
          
          <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <strong>📧 Email Features Ready:</strong>
            <ul>
              <li>Staff registration welcome emails</li>
              <li>Password setup links</li>
              <li>Password reset notifications</li>
              <li>Professional HTML formatting</li>
            </ul>
          </div>
          
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            This test email was sent using Resend API.<br>
            Production emails will come from the same address.
          </p>
        </div>
      `
    });
    
    console.log('✅ Email sent successfully!');
    console.log('📧 Message ID:', result.id);
    console.log('📬 Recipient: dreamlightmw@gmail.com');
    console.log('\n🎉 Check your inbox! Email should arrive within seconds.');
    console.log('\n📝 Next Steps:');
    console.log('   1. Add environment variables to Render');
    console.log('   2. Wait for deployment');
    console.log('   3. Test production staff registration\n');
    
  } catch (error) {
    console.error('❌ Email test failed:', error.message);
    console.error('\n💡 Possible issues:');
    console.error('   - API key is invalid or revoked');
    console.error('   - Network connectivity issues');
    console.error('   - Resend service temporary outage\n');
  }
}

// Run the test
testEmail();
