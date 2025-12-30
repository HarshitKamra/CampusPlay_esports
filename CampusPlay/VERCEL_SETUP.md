# Vercel Deployment Guide

## Changes Made

### 1. Created `vercel.json`
- Configures Vercel to use Node.js runtime
- Routes API calls to server.js
- Serves static files from client directory

### 2. Modified `server/server.js`
- Exports Express app for Vercel serverless functions
- Keeps local development server working

## Deployment Steps

### Step 1: Install Vercel CLI (Optional but Recommended)
```bash
npm i -g vercel
```

### Step 2: Login to Vercel
```bash
vercel login
```

### Step 3: Deploy
From the project root (`CampusPlay` directory):
```bash
vercel
```

Follow the prompts:
- Set up and deploy? **Yes**
- Which scope? **Your account**
- Link to existing project? **No** (first time)
- Project name? **campusplay** (or your choice)
- Directory? **./** (current directory)
- Override settings? **No**

### Step 4: Add Environment Variables

After first deployment, add environment variables:

**Option A: Via CLI**
```bash
vercel env add MONGO_URI
vercel env add JWT_SECRET
vercel env add RAZORPAY_KEY_ID
vercel env add RAZORPAY_KEY_SECRET
```

**Option B: Via Dashboard**
1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add:
   - `MONGO_URI` = your MongoDB connection string
   - `JWT_SECRET` = your JWT secret
   - `RAZORPAY_KEY_ID` = your Razorpay key (optional)
   - `RAZORPAY_KEY_SECRET` = your Razorpay secret (optional)

### Step 5: Redeploy
After adding environment variables:
```bash
vercel --prod
```

Or redeploy from dashboard.

## Alternative: Deploy via GitHub

### Step 1: Push Code to GitHub
(Already done ✅)

### Step 2: Connect GitHub to Vercel
1. Go to https://vercel.com
2. Click "Add New Project"
3. Import your GitHub repository: `CampusPlay_esports`
4. Configure:
   - **Framework Preset:** Other
   - **Root Directory:** Leave as is (or set to `CampusPlay` if needed)
   - **Build Command:** Leave empty
   - **Output Directory:** Leave empty
   - **Install Command:** Leave empty

### Step 3: Add Environment Variables
Add all environment variables in the dashboard

### Step 4: Deploy
Click "Deploy" - Vercel will automatically deploy

## Important Notes

### ✅ What Works:
- All API routes (`/api/*`)
- Static file serving
- Frontend pages
- MongoDB connections (serverless compatible)
- Authentication
- File uploads (with size limits)

### ⚠️ Limitations:
- **Function timeout:** 10 seconds (free tier), 60 seconds (pro)
- **File uploads:** Max 4.5MB per request
- **Cold starts:** First request may take 1-2 seconds

### 🔧 If You Have Issues:

1. **Check logs:**
   ```bash
   vercel logs
   ```

2. **Test locally with Vercel:**
   ```bash
   vercel dev
   ```

3. **Check environment variables:**
   - Make sure all are set
   - Redeploy after adding new ones

## Your App URL

After deployment, you'll get a URL like:
- `https://campusplay-xxxxx.vercel.app`

You can also add a custom domain later.

## MongoDB Setup

Make sure your MongoDB Atlas connection string:
- Allows connections from anywhere (0.0.0.0/0)
- Or add Vercel IPs to whitelist

## Testing

After deployment:
1. Visit your Vercel URL
2. Test login/register
3. Test API endpoints: `https://your-url.vercel.app/api/tournaments`
4. Test file uploads
5. Test payment flow (if configured)

## Troubleshooting

### "Module not found" errors?
- Make sure `package.json` is in `server/` directory
- Vercel should auto-detect and install dependencies

### "Cannot find module"?
- Check `vercel.json` paths are correct
- Ensure all dependencies are in `package.json`

### API routes not working?
- Check `vercel.json` routes configuration
- Ensure routes start with `/api/`

### Static files not loading?
- Check file paths in HTML (use relative paths)
- Verify `vercel.json` static file routes

## Next Steps

1. Deploy to Vercel
2. Test all features
3. Set up custom domain (optional)
4. Configure webhooks for payments (if using Razorpay)










