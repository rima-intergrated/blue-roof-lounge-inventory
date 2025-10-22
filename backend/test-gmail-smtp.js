const nodemailer = require('nodemailer');
require('dotenv').config();

console.log('Testing Gmail SMTP Configuration...');
console.log('Gmail User:', process.env.GMAIL_USER);
console.log('Gmail App Password:', process.env.GMAIL_APP_PASSWORD ? '***configured***' : 'NOT SET');
console.log('Email Notifications Enabled:', process.env.ENABLE_EMAIL_NOTIFICATIONS);

// Create transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

// Test the connection
async function testConnection() {
  try {
    console.log('Testing connection to Gmail SMTP...');
    await transporter.verify();
    console.log('✅ Gmail SMTP connection successful!');
    
    // Send a test email
    console.log('Sending test email...');
    const info = await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: process.env.GMAIL_USER, // Send to yourself for testing
      subject: 'Blue Roof Lounge - Gmail SMTP Test',
      html: `
        <h2>Gmail SMTP Test Successful!</h2>
        <p>This email confirms that your Gmail SMTP configuration is working correctly.</p>
        <p>Date: ${new Date().toLocaleString()}</p>
        <p>From: Blue Roof Lounge API</p>
      `
    });
    
    console.log('✅ Test email sent successfully!');
    console.log('Message ID:', info.messageId);
    
  } catch (error) {
    console.error('❌ Gmail SMTP Error:', error.message);
    
    if (error.code === 'EAUTH') {
      console.error('❌ Authentication failed. Please check:');
      console.error('   - Gmail address is correct');
      console.error('   - App password is correct (16 characters without spaces)');
      console.error('   - 2-factor authentication is enabled on Gmail');
    }
  }
}

testConnection();