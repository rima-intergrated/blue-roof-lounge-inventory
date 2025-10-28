# Email Notification Setup Guide

This application supports two methods for sending email notifications:

## ✅ Option 1: Resend API (Recommended for Cloud Platforms)

**Why Resend?**
- Works on all cloud platforms (Render, Heroku, Vercel, etc.)
- Uses HTTPS API (port 443) - never blocked by firewalls
- Better deliverability than SMTP
- Free tier: 100 emails/day, 3,000/month
- Modern, simple API

### Setup Steps:

1. **Create Resend Account**
   - Go to https://resend.com
   - Sign up for a free account
   - Verify your email address

2. **Get API Key**
   - Go to https://resend.com/api-keys
   - Click "Create API Key"
   - Give it a name (e.g., "Blue Roof Lounge Production")
   - Copy the API key (starts with `re_`)

3. **Add Domain (Optional but Recommended)**
   - Go to https://resend.com/domains
   - Click "Add Domain"
   - Enter your domain (e.g., `blueroof.com`)
   - Follow DNS setup instructions
   - Verify domain

4. **Configure Environment Variables in Render**
   - Go to your Render dashboard
   - Navigate to your service
   - Click "Environment" tab
   - Add the following variables:
     ```
     ENABLE_EMAIL_NOTIFICATIONS=true
     RESEND_API_KEY=re_your_api_key_here
     RESEND_FROM_EMAIL=noreply@yourdomain.com
     ```
   - If you haven't added a domain, use: `onboarding@resend.dev` (Resend's test domain)

5. **Deploy**
   - Changes will auto-deploy when you push to GitHub
   - Or click "Manual Deploy" in Render

### Testing:

```bash
# Check Render logs for:
✅ Resend email API initialized successfully
📧 Sending from: noreply@yourdomain.com
```

---

## Option 2: Gmail SMTP (Fallback)

**Note:** Gmail SMTP may not work on some cloud platforms (like Render) due to blocked outbound SMTP ports (587, 465).

### Setup Steps:

1. **Enable 2-Factor Authentication**
   - Go to https://myaccount.google.com/security
   - Enable 2-Step Verification

2. **Generate App Password**
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and your device
   - Click "Generate"
   - Copy the 16-character password

3. **Configure Environment Variables**
   ```
   ENABLE_EMAIL_NOTIFICATIONS=true
   GMAIL_USER=your-email@gmail.com
   GMAIL_APP_PASSWORD=your-16-char-app-password
   ```

---

## Environment Variables Summary

### Required for Email Notifications:
```env
ENABLE_EMAIL_NOTIFICATIONS=true
```

### For Resend (Recommended):
```env
RESEND_API_KEY=re_your_api_key_here
RESEND_FROM_EMAIL=noreply@yourdomain.com  # Optional, defaults to onboarding@resend.dev
```

### For Gmail SMTP (Fallback):
```env
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-app-password
```

### Other Email-Related Variables:
```env
FRONTEND_URL=https://blue-roof-lounge-inventory-system.vercel.app
```

---

## How It Works

The notification service tries email methods in this order:

1. **Resend API** (if `RESEND_API_KEY` is configured)
   - Fast, reliable, works everywhere
   - If fails, tries Gmail SMTP

2. **Gmail SMTP** (if `GMAIL_USER` and `GMAIL_APP_PASSWORD` configured)
   - May not work on cloud platforms with blocked SMTP ports
   - If fails, returns fallback instructions

3. **Console Logging** (if no email service configured)
   - Logs setup URL to console
   - Returns instructions for manual email sharing

---

## Troubleshooting

### Resend Issues:

**"Resend API email failed: API key is invalid"**
- Check your API key is correct
- Make sure it starts with `re_`
- Regenerate API key if needed

**"Email delivery failed: Domain not verified"**
- Use `onboarding@resend.dev` for testing
- Or verify your custom domain in Resend dashboard

### Gmail SMTP Issues:

**"Connection timeout"**
- SMTP ports (587, 465) are likely blocked by your cloud provider
- **Solution:** Switch to Resend API

**"Invalid credentials"**
- Check Gmail App Password is correct (16 characters, no spaces)
- Make sure 2FA is enabled on Gmail account
- Regenerate App Password if needed

---

## Testing Email Delivery

1. **Register New Staff**
   - Navigate to "Register New Staff"
   - Fill out form with a test email
   - Submit registration

2. **Check Logs**
   - Go to Render dashboard → Logs
   - Look for:
     ```
     📧 EMAIL NOTIFICATION
     ✅ Email sent successfully to test@example.com via Resend API
     📧 Message ID: ...
     ```

3. **Check Email Inbox**
   - Look for email from "Blue Roof Lounge"
   - Subject: "Welcome to Blue Roof Lounge - Set Up Your Password"
   - Click password setup link to test

---

## Best Practices

1. **Use Resend for Production**
   - More reliable than SMTP
   - Better deliverability
   - Works on all cloud platforms

2. **Verify Domain**
   - Improves email deliverability
   - Looks more professional
   - Reduces spam risk

3. **Monitor Logs**
   - Check Render logs regularly
   - Verify email delivery success
   - Track any failures

4. **Test Regularly**
   - Register test users periodically
   - Verify password reset works
   - Check email formatting

---

## Support

- **Resend Documentation:** https://resend.com/docs
- **Resend Support:** support@resend.com
- **Gmail App Passwords:** https://support.google.com/accounts/answer/185833
