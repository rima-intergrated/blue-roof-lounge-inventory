# Resend Email Verification Guide

## ⚠️ IMPORTANT: Why Emails Aren't Being Delivered

The email system is working correctly, but **`onboarding@resend.dev`** (Resend's default test email) **only delivers to verified email addresses** in your Resend account.

## Current Status
- ✅ Resend API is working
- ✅ Email requests are successful (200 OK)
- ❌ Emails not delivered because recipient isn't verified

## Solution Options

### Option 1: Verify Recipient Emails (Quick Test - 2 minutes)

**For Testing Only** - Good for testing with specific staff emails

1. **Login to Resend Dashboard**
   - Go to: https://resend.com/emails
   - Login with your account

2. **Add Test Recipients**
   - Navigate to: **Audiences** tab
   - Click **Add Contact**
   - Enter: `ibrahimusuman474@gmail.com`
   - Click **Send Verification**

3. **Verify Email**
   - Check Ibrahimu's inbox for Resend verification email
   - Click verification link
   - Email is now whitelisted for `onboarding@resend.dev`

4. **Test Again**
   - Register staff member again
   - Email will now be delivered!

**Limitation**: You need to verify each staff member's email individually (not practical for production)

---

### Option 2: Add Your Own Domain (Production Solution - 10 minutes)

**Recommended for Production** - Unlimited email sending to any address

#### Step 1: Add Domain in Resend

1. **Login to Resend Dashboard**
   - Go to: https://resend.com/domains

2. **Add Your Domain**
   - Click **Add Domain**
   - Enter your domain (e.g., `blueroof.com`, `blueroof-lounge.com`)
   - Click **Add Domain**

3. **Verify Domain with DNS Records**
   
   Resend will show you DNS records to add. Add these to your domain registrar:

   **Example DNS Records:**
   ```
   Type: TXT
   Name: _resend
   Value: resend-verify=abc123xyz...
   
   Type: MX
   Name: @
   Value: mx.resend.com
   Priority: 10
   
   Type: TXT  
   Name: @
   Value: v=spf1 include:spf.resend.com ~all
   ```

4. **Wait for Verification**
   - DNS changes take 5-60 minutes
   - Resend will automatically verify
   - You'll see ✅ **Verified** status

#### Step 2: Update Environment Variables in Render

1. **Go to Render Dashboard**
   - Select your backend service
   - Click **Environment** tab

2. **Update RESEND_FROM_EMAIL**
   - Change from: `onboarding@resend.dev`
   - To: `noreply@yourdomain.com` (use your verified domain)
   
   Example:
   ```
   RESEND_FROM_EMAIL = noreply@blueroof.com
   ```

3. **Save Changes**
   - Click **Save Changes**
   - Wait 2-3 minutes for deployment

#### Step 3: Test
- Register new staff member
- Email will be delivered from your domain
- Works for ANY email address (not just verified ones)

---

### Option 3: Use Gmail SMTP Instead (Fallback)

If Resend verification is taking too long, you can temporarily use Gmail SMTP:

#### Update Render Environment Variables:

1. **Keep existing Gmail variables:**
   ```
   GMAIL_USER = your-email@gmail.com
   GMAIL_APP_PASSWORD = your-16-char-app-password
   ```

2. **Remove or comment out Resend:**
   ```
   # RESEND_API_KEY = (delete or leave empty)
   ```

3. **Save and Deploy**
   - System will automatically fall back to Gmail SMTP
   - **NOTE**: Gmail SMTP might not work on Render (port 587 blocked)
   - Use Resend for production reliability

---

## Recommended Approach

**For Immediate Testing:**
1. Verify 1-2 test email addresses in Resend Dashboard (Option 1)
2. Test staff registration with verified emails
3. Confirm emails are delivered

**For Production:**
1. Add and verify your domain in Resend (Option 2)
2. Update `RESEND_FROM_EMAIL` to use your domain
3. Unlimited email sending to any address

---

## Current Configuration

**Environment Variables** (Set in Render):
```
ENABLE_EMAIL_NOTIFICATIONS = true
RESEND_API_KEY = re_41F7sfeh_2hkxdCm57uyNTCXjjmEsoS5h
RESEND_FROM_EMAIL = onboarding@resend.dev  ⚠️ TEST ONLY
GMAIL_USER = (your gmail)
GMAIL_APP_PASSWORD = (your app password)
```

---

## Troubleshooting

### Email shows "sent successfully" but not received?

**Reason**: `onboarding@resend.dev` only delivers to verified emails

**Solution**: 
- Verify recipient in Resend Dashboard (Option 1), OR
- Add your own domain (Option 2)

### How to check if email was actually sent?

1. **Login to Resend Dashboard**
   - Go to: https://resend.com/emails
   
2. **Check Email Logs**
   - You'll see all sent emails
   - Status will show: **Delivered** or **Bounced**
   - If bounced: recipient not verified for `onboarding@resend.dev`

### Want to use free tier?

Resend free tier includes:
- ✅ 100 emails/day
- ✅ 1 verified domain
- ✅ Unlimited verified recipients
- ✅ Perfect for small businesses

---

## Next Steps

1. **Choose your approach** (Option 1 for testing, Option 2 for production)
2. **Follow the steps** above
3. **Test staff registration** again
4. **Check Resend Dashboard** to confirm delivery

Need help? Check Resend documentation: https://resend.com/docs
