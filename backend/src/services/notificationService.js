const crypto = require('crypto');
const nodemailer = require('nodemailer');

class NotificationService {
  constructor() {
    // Gmail SMTP configuration
    this.gmailConfig = {
      user: process.env.GMAIL_USER || 'your-gmail@gmail.com',
      pass: process.env.GMAIL_APP_PASSWORD || 'your-app-password'
    };
    
    // Create nodemailer transporter for Gmail
    this.transporter = null;
    this.initializeTransporter();
  }

  /**
   * Initialize Gmail SMTP transporter
   */
  initializeTransporter() {
    try {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: this.gmailConfig.user,
          pass: this.gmailConfig.pass
        },
        tls: {
          rejectUnauthorized: false
        }
      });
      
      // Verify connection
      this.transporter.verify((error, success) => {
        if (error) {
          console.log('📧 Gmail SMTP configuration error:', error.message);
          console.log('💡 Please check your Gmail credentials in environment variables');
        } else {
          console.log('✅ Gmail SMTP server is ready to send emails');
        }
      });
    } catch (error) {
      console.error('❌ Failed to initialize Gmail transporter:', error.message);
    }
  }

  /**
   * Generate a secure password reset token
   */
  generatePasswordSetupToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Generate password setup URL
   */
  generatePasswordSetupUrl(token, userId) {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    return `${baseUrl}/setup-password?token=${token}&userId=${userId}`;
  }

  /**
   * Send password setup email using Gmail SMTP
   */
  async sendPasswordSetupEmail(email, name, setupUrl, position) {
    const emailContent = this.generatePasswordSetupEmailContent(name, setupUrl, position);
    
    // Always log to console for development
    console.log('\n📧 EMAIL NOTIFICATION');
    console.log('='.repeat(50));
    console.log(`To: ${email}`);
    console.log(`Subject: ${emailContent.subject}`);
    console.log('Setup URL:', setupUrl);
    console.log('='.repeat(50));
    
    // Check if Gmail is configured
    if (!this.transporter || this.gmailConfig.user === 'your-gmail@gmail.com') {
      console.log('⚠️ Gmail SMTP not configured. Using console logging only.');
      console.log('💡 To enable Gmail SMTP:');
      console.log('   1. Set GMAIL_USER environment variable');
      console.log('   2. Set GMAIL_APP_PASSWORD environment variable');
      console.log('   3. Enable 2FA on Gmail and generate App Password');
      
      return { 
        success: false, 
        method: 'console', 
        recipient: email,
        error: 'Gmail SMTP not configured',
        setupUrl: setupUrl,
        fallbackMessage: `Gmail not configured. Please manually share the setup link with ${name} (${email}): ${setupUrl}`
      };
    }
    
    try {
      // Send email using Gmail SMTP
      const mailOptions = {
        from: {
          name: 'Blue Roof Lounge',
          address: this.gmailConfig.user
        },
        to: email,
        subject: emailContent.subject,
        text: emailContent.text,
        html: emailContent.html
      };
      
      const info = await this.transporter.sendMail(mailOptions);
      
      console.log(`✅ Email sent successfully to ${email} via Gmail SMTP`);
      console.log(`📧 Message ID: ${info.messageId}`);
      
      return { 
        success: true, 
        method: 'gmail-smtp', 
        recipient: email,
        messageId: info.messageId,
        message: 'Email sent successfully via Gmail SMTP'
      };
      
    } catch (error) {
      console.error('❌ Gmail SMTP email failed:', error.message);
      
      // Return detailed fallback information for manual sharing
      return { 
        success: false, 
        method: 'gmail-smtp', 
        recipient: email,
        error: error.message,
        setupUrl: setupUrl,
        fallbackMessage: `Email delivery failed (${error.message}). Please manually share the setup link with ${name} (${email}): ${setupUrl}`
      };
    }
  }

  /**
   * Send password setup SMS
   */
  async sendPasswordSetupSMS(phoneNumber, name, setupUrl) {
    const smsContent = this.generatePasswordSetupSMSContent(name, setupUrl);
    
    // Development mode - log to console
    console.log('\n📱 SMS NOTIFICATION');
    console.log('='.repeat(50));
    console.log(`To: ${phoneNumber}`);
    console.log('Message:');
    console.log(smsContent);
    console.log('='.repeat(50));

    // In production, implement actual SMS sending here
    // Example with Twilio:
    /*
    const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
    
    await client.messages.create({
      body: smsContent,
      from: process.env.TWILIO_PHONE,
      to: phoneNumber
    });
    */

    return { success: true, method: 'console', recipient: phoneNumber };
  }

  /**
   * Generate email content for password setup
   */
  generatePasswordSetupEmailContent(name, setupUrl, position) {
    const subject = '🎉 Welcome to Blue Roof Lounge - Complete Your Account Setup';
    
    const text = `
Hi ${name},

Welcome to the Blue Roof Lounge team! 🎉

We're excited to have you join us as our new ${position}.

TO COMPLETE YOUR ACCOUNT SETUP:
1. Click the secure link below to create your password
2. Choose a strong password (minimum 8 characters)
3. Start using the Blue Roof Restaurant management system

SETUP LINK:
${setupUrl}

IMPORTANT SECURITY NOTES:
- This link will expire in 24 hours for your security
- Do not share this link with anyone
- You will use your email address (${name.split(' ')[0].toLowerCase()}@blueroofrestaurant.com or the email this was sent to) as your username

Once you complete setup, you'll have access to:
✓ Staff management system
✓ Inventory tracking
✓ Sales reporting
✓ Payroll information

Need help? Contact your supervisor or the IT team.

Welcome aboard!

Best regards,
Blue Roof Lounge Management Team

---
This is an automated security message. Please do not reply to this email.
For support, contact your manager directly.
    `.trim();

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Welcome to Blue Roof Restaurant!</h1>
        </div>
        
        <div style="padding: 30px; background-color: white;">
          <p style="font-size: 18px; color: #2c3e50;">Hi <strong>${name}</strong>,</p>
          
          <p style="color: #34495e; line-height: 1.6;">We're excited to have you join us as our new <strong>${position}</strong>!</p>
          
          <div style="background-color: #e8f4fd; padding: 20px; border-radius: 8px; margin: 25px 0;">
            <h3 style="color: #2980b9; margin-top: 0;">📋 To Complete Your Account Setup:</h3>
            <ol style="color: #2c3e50; line-height: 1.8;">
              <li>Click the secure link below to create your password</li>
              <li>Choose a strong password (minimum 8 characters)</li>
              <li>Start using the Blue Roof Lounge management system</li>
            </ol>
          </div>
          
          <div style="text-align: center; margin: 35px 0;">
            <a href="${setupUrl}" 
               style="background: linear-gradient(45deg, #3498db, #2980b9); 
                      color: white; 
                      padding: 15px 35px; 
                      text-decoration: none; 
                      border-radius: 8px; 
                      font-weight: bold; 
                      font-size: 16px;
                      display: inline-block;
                      box-shadow: 0 4px 15px rgba(52, 152, 219, 0.3);">
              🔐 Complete Account Setup
            </a>
          </div>
          
          <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin: 25px 0;">
            <h4 style="color: #856404; margin-top: 0;">⚠️ Important Security Notes:</h4>
            <ul style="color: #856404; margin-bottom: 0;">
              <li>This link will expire in <strong>24 hours</strong> for your security</li>
              <li>Do not share this link with anyone</li>
              <li>You will use your email address as your username</li>
            </ul>
          </div>
          
          <div style="background-color: #d1ecf1; padding: 20px; border-radius: 8px; margin: 25px 0;">
            <h4 style="color: #0c5460; margin-top: 0;">🚀 Once you complete setup, you'll have access to:</h4>
            <ul style="color: #0c5460; line-height: 1.6;">
              <li>✓ Staff management system</li>
              <li>✓ Inventory tracking</li>
              <li>✓ Sales reporting</li>
              <li>✓ Payroll information</li>
            </ul>
          </div>
          
          <p style="color: #7f8c8d; font-style: italic;">Need help? Contact your supervisor or the IT team.</p>
          
          <p style="color: #2c3e50; font-weight: bold;">Welcome aboard! 🎊</p>
        </div>
        
        <div style="background-color: #34495e; padding: 20px; text-align: center;">
          <p style="color: #bdc3c7; font-size: 14px; margin: 0;">
            <strong>Blue Roof Restaurant Management Team</strong><br>
            <small>This is an automated security message. Please do not reply to this email.<br>
            For support, contact your manager directly.</small>
          </p>
        </div>
      </div>
    `;

    return { subject, text, html };
  }

  /**
   * Generate SMS content for password setup
   */
  generatePasswordSetupSMSContent(name, setupUrl) {
    return `Hi ${name}! Welcome to Blue Roof Lounge. Set up your password: ${setupUrl} (Link expires in 24h)`;
  }

  /**
   * Send notification based on preference (email or SMS)
   */
  async sendPasswordSetupNotification(staffData, setupUrl) {
    const notifications = [];
    
    // Always try to send email if available
    if (staffData.email) {
      try {
        const emailResult = await this.sendPasswordSetupEmail(
          staffData.email, 
          staffData.name, 
          setupUrl, 
          staffData.position
        );
        notifications.push(emailResult);
      } catch (error) {
        console.error('Email notification failed:', error);
        notifications.push({ 
          success: false, 
          method: 'gmail-smtp', 
          error: error.message,
          recipient: staffData.email
        });
      }
    }

    // Also try SMS if phone number is available
    if (staffData.contact) {
      try {
        const smsResult = await this.sendPasswordSetupSMS(
          staffData.contact, 
          staffData.name, 
          setupUrl
        );
        notifications.push(smsResult);
      } catch (error) {
        console.error('SMS notification failed:', error);
        notifications.push({ 
          success: false, 
          method: 'sms', 
          error: error.message,
          recipient: staffData.contact
        });
      }
    }

    return notifications;
  }
}

module.exports = new NotificationService();