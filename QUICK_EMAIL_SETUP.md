# Quick Start: Email Notifications Setup

## 🚀 Fastest Setup (5 minutes)

### Step 1: Create Resend Account
1. Go to **https://resend.com**
2. Click "Sign Up" (free account)
3. Verify your email

### Step 2: Get API Key
1. Go to **https://resend.com/api-keys**
2. Click "Create API Key"
3. Name it: "Blue Roof Production"
4. **Copy the API key** (starts with `re_`)

### Step 3: Add to Render
1. Open **Render Dashboard**
2. Go to your backend service
3. Click **"Environment"** tab
4. Add these 2 variables:
   ```
   RESEND_API_KEY = re_your_copied_key_here
   RESEND_FROM_EMAIL = onboarding@resend.dev
   ```
5. Click **"Save Changes"** (auto-deploys)

### Step 4: Test
1. Wait 2-3 minutes for deployment
2. Register a new staff member with your email
3. Check your inbox for password setup email! ✅

---

## 🎯 Current Status

**What's Working:**
- ✅ Backend deployed successfully to Render
- ✅ MongoDB connected (178 documents, 14 collections)
- ✅ All API endpoints working
- ✅ Frontend communicating with backend
- ✅ CORS configured correctly
- ✅ Staff registration flow ready

**What Needs Setup:**
- ⏳ Email notifications (Resend API configuration)

**Why Gmail SMTP Failed:**
- Render blocks outbound SMTP ports (587, 465)
- This is standard security practice on cloud platforms
- **Solution:** Use Resend API instead (uses HTTPS port 443)

---

## 📧 Environment Variables You Need

### Already Configured ✅
```env
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret
FRONTEND_URL=https://blue-roof-lounge-inventory-system.vercel.app
ENABLE_EMAIL_NOTIFICATIONS=true
```

### Need to Add ⏳
```env
RESEND_API_KEY=re_your_key_here
RESEND_FROM_EMAIL=onboarding@resend.dev
```

---

## 🔍 What to Look for in Logs

### Success Messages:
```
✅ Resend email API initialized successfully
📧 Sending from: onboarding@resend.dev
📧 EMAIL NOTIFICATION
✅ Email sent successfully to user@example.com via Resend API
📧 Message ID: ...
```

### If You See This (No Resend yet):
```
ℹ️ Resend API key not found. Trying Gmail SMTP...
📧 Gmail SMTP configuration error: Connection timeout
💡 Gmail SMTP ports may be blocked on this server
💡 Recommendation: Use Resend API instead
```

---

## 📚 Full Documentation

- **Detailed Setup:** `backend/EMAIL_SETUP_GUIDE.md`
- **Resend Docs:** https://resend.com/docs
- **API Keys:** https://resend.com/api-keys
- **Domains:** https://resend.com/domains

---

## 💡 Pro Tips

1. **Use Test Domain First**
   - Start with `onboarding@resend.dev` (no domain setup needed)
   - Add custom domain later for professional emails

2. **Monitor Render Logs**
   - Check logs immediately after adding env variables
   - Look for Resend initialization message

3. **Test with Your Own Email**
   - Register test staff with your email address
   - Verify email arrives and links work

4. **Free Tier Limits**
   - 100 emails per day
   - 3,000 emails per month
   - Perfect for staff onboarding

---

## ❓ Need Help?

**Common Issues:**

1. **"API key is invalid"**
   - Copy the full key (starts with `re_`)
   - No spaces before or after
   - Try regenerating key

2. **"Email not received"**
   - Check spam folder
   - Verify Render logs show "Email sent successfully"
   - Check Resend dashboard → Emails

3. **"Variables not working"**
   - Make sure to click "Save Changes" in Render
   - Wait for auto-deployment to complete (2-3 min)
   - Check logs for updated configuration
