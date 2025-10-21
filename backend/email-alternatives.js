// Alternative email sending options for Blue Roof Restaurant

const EMAIL_ALTERNATIVES = {
  // Option 1: Use EmailJS (frontend-based)
  emailjs: {
    serviceId: 'YOUR_EMAILJS_SERVICE_ID',
    templateId: 'YOUR_EMAILJS_TEMPLATE_ID',
    publicKey: 'YOUR_EMAILJS_PUBLIC_KEY'
  },
  
  // Option 2: Use Formspree
  formspree: {
    endpoint: 'https://formspree.io/f/YOUR_FORM_ID'
  },
  
  // Option 3: Use Netlify Forms
  netlify: {
    endpoint: 'https://your-site.netlify.app/'
  },
  
  // Option 4: Use Gmail SMTP (requires app password)
  gmail: {
    user: 'your-gmail@gmail.com',
    pass: 'your-app-password' // Generate in Google Account settings
  }
};

// Instructions for setting up alternatives:

/*
1. WEB3FORMS TROUBLESHOOTING:
   - Check if the API key is verified
   - Ensure the form is set up correctly at web3forms.com
   - Try creating a new form with a new API key

2. EMAILJS SETUP (Recommended alternative):
   - Go to emailjs.com
   - Create free account
   - Set up email service (Gmail, Outlook, etc.)
   - Create email template
   - Use from frontend with emailjs-com package

3. FORMSPREE SETUP:
   - Go to formspree.io
   - Create form
   - Use the endpoint URL

4. GMAIL SMTP SETUP:
   - Enable 2FA on Gmail
   - Generate App Password
   - Use with nodemailer

5. DEVELOPMENT WORKAROUND:
   - System already logs to console
   - Shows setup link to admin for manual sharing
   - All functionality works except automated email
*/

module.exports = EMAIL_ALTERNATIVES;