const { Resend } = require('resend');
const resend = new Resend('re_41F7sfeh_2hkxdCm57uyNTCXjjmEsoS5h');

async function testOwnerEmail() {
  console.log('🧪 Testing with account owner email...\n');
  
  try {
    const result = await resend.emails.send({
      from: 'Blue Roof Lounge <onboarding@resend.dev>',
      to: 'dreamlightmw@gmail.com',
      subject: '✅ Email System Test - Sending to Account Owner',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #185aca;">✅ Email System Working!</h2>
          <p>This email was sent to YOUR verified address (dreamlightmw@gmail.com) to confirm the system works correctly.</p>
          
          <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <h3 style="margin-top: 0; color: #856404;">Why Ibrahim didn't receive the email:</h3>
            <p style="margin-bottom: 0;">onboarding@resend.dev is a TEST address that only sends to the account owner's email (you). For production, you need to:</p>
          </div>
          
          <div style="background: #f0f7ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #185aca;">Production Solutions:</h3>
            <ol style="line-height: 1.8;">
              <li><strong>Verify a Domain:</strong> Go to resend.com/domains and add your domain</li>
              <li><strong>Use Gmail SMTP:</strong> Switch back to Gmail (works immediately)</li>
              <li><strong>Use Free Alternative:</strong> Different email service</li>
            </ol>
          </div>
          
          <p><strong>Recommendation:</strong> Use Gmail SMTP for immediate production, then add domain verification later for professional branding.</p>
        </div>
      `
    });
    
    console.log('✅ Email sent successfully to account owner!');
    console.log('📧 Check dreamlightmw@gmail.com inbox');
    console.log('📋 Message ID:', result.data?.id);
    console.log('\n🎯 This proves the email system works!');
    console.log('💡 The issue is just the test email restriction.');
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

testOwnerEmail();