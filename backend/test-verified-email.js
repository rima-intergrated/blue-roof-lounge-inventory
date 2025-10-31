const { Resend } = require('resend');
const resend = new Resend('re_41F7sfeh_2hkxdCm57uyNTCXjjmEsoS5h');

async function testVerifiedEmail() {
  console.log('🧪 Testing email to VERIFIED recipient...\n');
  
  try {
    const result = await resend.emails.send({
      from: 'Blue Roof Lounge <onboarding@resend.dev>',
      to: 'ibrahimusuman474@gmail.com',
      subject: '✅ Staff Password Setup - Blue Roof Lounge',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #185aca;">Welcome to Blue Roof Lounge!</h2>
          <p>Hi <strong>Ibrahimu Sumani</strong>,</p>
          <p>Your staff account has been created successfully. Please set up your password to access the system:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://blue-roof-lounge-inventory-system.vercel.app/setup-password?token=test123&email=ibrahimusuman474@gmail.com" 
               style="background: #185aca; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              🔐 Set Up Your Password
            </a>
          </div>
          
          <div style="background: #f0f7ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #185aca;">Next Steps:</h3>
            <ol style="line-height: 1.8;">
              <li>Click the button above to access the password setup page</li>
              <li>Create a secure password (minimum 8 characters)</li>
              <li>Log in to the Blue Roof Lounge system</li>
            </ol>
          </div>
          
          <p style="color: #666; font-size: 14px;">
            If you have any questions, please contact your manager or the IT support team.
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
          <p style="color: #999; font-size: 12px; text-align: center;">
            This email was sent from the Blue Roof Lounge Staff Management System.<br>
            If you received this email in error, please contact support.
          </p>
        </div>
      `
    });
    
    console.log('✅ Email sent successfully to VERIFIED recipient!');
    console.log('📧 Message ID:', result.data?.id);
    console.log('📬 Recipient: ibrahimusuman474@gmail.com');
    console.log('\n🎉 Ibrahimu should receive this email within seconds!');
    console.log('\n📋 Next Steps:');
    console.log('   1. Check Ibrahimu\'s inbox');
    console.log('   2. Verify he receives the email');
    console.log('   3. Test the password setup link');
    
  } catch (error) {
    console.error('❌ Email failed:', error.message);
    if (error.message.includes('403')) {
      console.log('\n💡 If you see a 403 error, the contact might not be verified yet.');
      console.log('   Go to https://resend.com/audiences and check the status.');
    }
  }
}

testVerifiedEmail();