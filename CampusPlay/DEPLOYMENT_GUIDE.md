# Deployment Guide - CampusPlay

## Hosting Options Comparison

### ✅ Option 1: Vercel (Recommended for Frontend + Serverless)
**Pros:**
- Free tier available
- Easy deployment from GitHub
- Automatic HTTPS
- Great for static frontend
- Serverless functions for API

**Cons:**
- Need to convert Express routes to serverless functions
- File uploads need external storage (S3, Cloudinary)
- MongoDB connection pooling needs adjustment
- 10-second timeout on free tier

**Best for:** Frontend + API routes (with modifications)

---

### ✅ Option 2: Railway (Recommended for Full Stack)
**Pros:**
- Easy deployment
- Supports full Node.js apps
- Built-in MongoDB option
- Free tier available
- Simple setup

**Cons:**
- Limited free tier hours

**Best for:** Full Express app without major changes

---

### ✅ Option 3: Render
**Pros:**
- Free tier for web services
- Supports full Node.js apps
- Easy MongoDB integration
- Automatic deployments

**Cons:**
- Free tier spins down after inactivity

**Best for:** Full Express app

---

### ✅ Option 4: Heroku
**Pros:**
- Well-established platform
- Good documentation
- Add-ons for MongoDB

**Cons:**
- No free tier anymore
- More expensive

**Best for:** Production apps with budget

---

### ✅ Option 5: DigitalOcean / AWS / Azure
**Pros:**
- Full control
- Scalable
- Professional hosting

**Cons:**
- Requires server management
- More complex setup
- Costs money

**Best for:** Large-scale production

---

## Deploying to Vercel

### Step 1: Prepare Your Project

Vercel works best with serverless functions. You'll need to:

1. **Create `vercel.json` configuration**
2. **Convert Express routes to serverless functions** (or use a wrapper)
3. **Set up environment variables**
4. **Configure MongoDB connection**

### Step 2: Create vercel.json

Create this file in your project root:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "server/server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "server/server.js"
    },
    {
      "src": "/(.*)",
      "dest": "client/$1"
    }
  ]
}
```

### Step 3: Modify server.js for Vercel

Update your `server/server.js` to export the Express app:

```javascript
// At the end of server.js, instead of app.listen():
module.exports = app;

// For local development, keep:
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}
```

### Step 4: Environment Variables

In Vercel Dashboard:
1. Go to your project → Settings → Environment Variables
2. Add:
   - `MONGO_URI`
   - `JWT_SECRET`
   - `RAZORPAY_KEY_ID` (optional)
   - `RAZORPAY_KEY_SECRET` (optional)

### Step 5: Deploy

1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel`
3. Or connect GitHub repo in Vercel dashboard

---

## Deploying to Railway (Easier Option)

### Step 1: Sign up at railway.app

### Step 2: Create New Project

1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose your repository

### Step 3: Configure

1. **Root Directory:** Set to `CampusPlay/server`
2. **Start Command:** `npm start`
3. **Build Command:** (leave empty or `npm install`)

### Step 4: Environment Variables

Add in Railway dashboard:
- `MONGO_URI`
- `JWT_SECRET`
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `PORT` (Railway sets this automatically)

### Step 5: Deploy

Railway will automatically:
- Install dependencies
- Start your server
- Provide a public URL

---

## Deploying to Render

### Step 1: Sign up at render.com

### Step 2: Create Web Service

1. New → Web Service
2. Connect GitHub repository
3. Configure:
   - **Name:** CampusPlay
   - **Root Directory:** `CampusPlay/server`
   - **Environment:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`

### Step 3: Environment Variables

Add all required environment variables

### Step 4: Deploy

Render will automatically deploy on every push to main branch

---

## MongoDB Setup (Required for All)

### Option 1: MongoDB Atlas (Recommended - Free)

1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create free cluster
3. Get connection string
4. Add to environment variables as `MONGO_URI`

### Option 2: Railway MongoDB

Railway offers MongoDB as an addon

---

## Important Notes

### Before Deploying:

1. ✅ **Remove hardcoded localhost URLs**
   - Update API calls to use environment variable or relative paths
   - Example: `fetch('/api/tournaments')` instead of `fetch('http://localhost:5000/api/tournaments')`

2. ✅ **Update CORS settings**
   - Allow your production domain
   - Example: `ALLOWED_ORIGINS=https://yourdomain.vercel.app`

3. ✅ **File Uploads**
   - CSV uploads might need external storage (S3, Cloudinary)
   - Or use Vercel Blob / Railway Volumes

4. ✅ **Payment Webhooks**
   - Update Razorpay webhook URL to production URL
   - Example: `https://yourdomain.vercel.app/api/payments/webhook`

5. ✅ **Environment Variables**
   - Never commit `.env` file
   - Add all variables in hosting platform dashboard

---

## Recommended Setup

**For Quick Deployment:** Railway or Render
- Minimal changes needed
- Full Express app support
- Easy MongoDB integration

**For Best Performance:** Vercel (with modifications)
- Fast CDN for frontend
- Serverless functions
- Requires code restructuring

---

## Quick Start Commands

### Railway:
```bash
npm i -g @railway/cli
railway login
railway init
railway up
```

### Vercel:
```bash
npm i -g vercel
vercel
```

### Render:
- Use web dashboard (no CLI needed)

---

## Testing After Deployment

1. Check API endpoints: `https://yourdomain.com/api/tournaments`
2. Test authentication
3. Test file uploads
4. Test payment flow (use test mode)
5. Check MongoDB connection

---

## Support

If you encounter issues:
1. Check server logs in hosting dashboard
2. Verify environment variables
3. Check MongoDB connection
4. Review CORS settings
5. Check file paths (use relative paths)

