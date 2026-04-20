# Vercel Environment Variables Setup Guide

## Overview
When deploying to Vercel, environment variables from `.env.local` are NOT automatically deployed. You must configure them in the Vercel dashboard.

## Step-by-Step Setup

### 1. Access Vercel Dashboard
1. Go to [vercel.com](https://vercel.com)
2. Log in to your account
3. Select your CMS project (e.g., "final-cms" or "dubai-filmmaker-cms")

### 2. Navigate to Environment Variables
1. Click on **Settings** tab
2. Click on **Environment Variables** in the left sidebar

### 3. Add Required Variables

Add each of these variables one by one:

#### NextAuth Configuration
```
Name: NEXTAUTH_URL
Value: https://your-cms-domain.vercel.app
Environment: Production, Preview, Development
```

```
Name: NEXTAUTH_SECRET
Value: your-secret-key-here-change-in-production
Environment: Production, Preview, Development
```

#### Cloudflare R2 Storage
```
Name: R2_ENDPOINT
Value: https://4e369248fbb93ecfab45e53137a9980d.r2.cloudflarestorage.com
Environment: Production, Preview, Development
```

```
Name: R2_ACCESS_KEY_ID
Value: 90de9a24d6683663c992e2ddab5abef7
Environment: Production, Preview, Development
```

```
Name: R2_SECRET_ACCESS_KEY
Value: 64dacf30088ce69ad255566e7909ff47194f603fc4e5f75f17f25f5a5f6c71d6
Environment: Production, Preview, Development
```

```
Name: R2_BUCKET_NAME
Value: dubai-filmmaker-assets
Environment: Production, Preview, Development
```

```
Name: R2_PUBLIC_URL
Value: https://pub-e4e29f1338964c2d89ce48344d55d9fe.r2.dev
Environment: Production, Preview, Development
```

#### Cloudflare D1 Database (CRITICAL FOR THUMBNAIL UPLOAD)
```
Name: CLOUDFLARE_ACCOUNT_ID
Value: 4e369248fbb93ecfab45e53137a9980d
Environment: Production, Preview, Development
```

```
Name: CLOUDFLARE_API_TOKEN
Value: NXu3f4s9376pvFJFSUhE8AZ2UtcyFpcEYVZG2NmF
Environment: Production, Preview, Development
```

```
Name: CLOUDFLARE_DATABASE_ID
Value: 908f42f0-ad4d-4ce0-b3a2-9bb13cf54795
Environment: Production, Preview, Development
```

#### Cloudflare Analytics
```
Name: CLOUDFLARE_PROJECT_NAME
Value: dubail-film-maker-website-portfolio
Environment: Production, Preview, Development
```

```
Name: CLOUDFLARE_WEB_ANALYTICS_SITE_ID
Value: 112f2993056f45899af5e412b84cc1f2
Environment: Production, Preview, Development
```

#### Supabase
```
Name: NEXT_PUBLIC_SUPABASE_URL
Value: https://ssoeuogujchfasvofevy.supabase.co
Environment: Production, Preview, Development
```

```
Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzb2V1b2d1amNoZmFzdm9mZXZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxMDE4MDAsImV4cCI6MjA3ODY3NzgwMH0.NaGPEA9nMpwLXHEjni6na_mLTQ_6UL2gDZEeAg_C9Hc
Environment: Production, Preview, Development
```

```
Name: SUPABASE_SERVICE_ROLE_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzb2V1b2d1amNoZmFzdm9mZXZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzEwMTgwMCwiZXhwIjoyMDc4Njc3ODAwfQ.e8eMXqx7O3zKvpvWVrkYFGTIcjvKZtOa7We1cFuazZ8
Environment: Production, Preview, Development
```

#### App Configuration
```
Name: NEXT_PUBLIC_APP_URL
Value: https://your-cms-domain.vercel.app
Environment: Production, Preview, Development
```

#### Email Configuration
```
Name: EMAIL_PROVIDER
Value: gmail
Environment: Production, Preview, Development
```

```
Name: GMAIL_USER
Value: coffeescripttech@gmail.com
Environment: Production, Preview, Development
```

```
Name: GMAIL_APP_PASSWORD
Value: rnlchpknwqkcrbcu
Environment: Production, Preview, Development
```

### 4. Environment Selection

For each variable, select which environments it applies to:
- ✅ **Production** - Live site
- ✅ **Preview** - Preview deployments (branches)
- ✅ **Development** - Local development (optional, since you have .env.local)

**Recommendation**: Select all three for consistency.

### 5. Redeploy After Adding Variables

After adding all variables:
1. Go to **Deployments** tab
2. Click the **...** menu on the latest deployment
3. Click **Redeploy**
4. Select **Use existing Build Cache** (optional)
5. Click **Redeploy**

OR simply push a new commit to trigger automatic deployment.

## Quick Copy-Paste Format

For faster setup, here's a format you can use:

```bash
# Copy each line and paste into Vercel's "Add New" form
NEXTAUTH_URL=https://your-cms-domain.vercel.app
NEXTAUTH_SECRET=your-secret-key-here-change-in-production
R2_ENDPOINT=https://4e369248fbb93ecfab45e53137a9980d.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=90de9a24d6683663c992e2ddab5abef7
R2_SECRET_ACCESS_KEY=64dacf30088ce69ad255566e7909ff47194f603fc4e5f75f17f25f5a5f6c71d6
R2_BUCKET_NAME=dubai-filmmaker-assets
R2_PUBLIC_URL=https://pub-e4e29f1338964c2d89ce48344d55d9fe.r2.dev
CLOUDFLARE_ACCOUNT_ID=4e369248fbb93ecfab45e53137a9980d
CLOUDFLARE_API_TOKEN=NXu3f4s9376pvFJFSUhE8AZ2UtcyFpcEYVZG2NmF
CLOUDFLARE_DATABASE_ID=908f42f0-ad4d-4ce0-b3a2-9bb13cf54795
CLOUDFLARE_PROJECT_NAME=dubail-film-maker-website-portfolio
CLOUDFLARE_WEB_ANALYTICS_SITE_ID=112f2993056f45899af5e412b84cc1f2
NEXT_PUBLIC_SUPABASE_URL=https://ssoeuogujchfasvofevy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzb2V1b2d1amNoZmFzdm9mZXZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxMDE4MDAsImV4cCI6MjA3ODY3NzgwMH0.NaGPEA9nMpwLXHEjni6na_mLTQ_6UL2gDZEeAg_C9Hc
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzb2V1b2d1amNoZmFzdm9mZXZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzEwMTgwMCwiZXhwIjoyMDc4Njc3ODAwfQ.e8eMXqx7O3zKvpvWVrkYFGTIcjvKZtOa7We1cFuazZ8
NEXT_PUBLIC_APP_URL=https://your-cms-domain.vercel.app
EMAIL_PROVIDER=gmail
GMAIL_USER=coffeescripttech@gmail.com
GMAIL_APP_PASSWORD=rnlchpknwqkcrbcu
```

## Using Vercel CLI (Alternative Method)

If you prefer using the command line:

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link project
vercel link

# Add environment variables from .env.local
vercel env pull .env.vercel.local

# Or add them one by one
vercel env add CLOUDFLARE_ACCOUNT_ID
vercel env add CLOUDFLARE_API_TOKEN
# ... etc
```

## Verification

After deployment, check if variables are loaded:
1. Go to your deployed CMS
2. Try uploading a thumbnail
3. Check browser console for errors
4. If you see "Cloudflare credentials not configured", the variables weren't loaded

## Troubleshooting

### Variables Not Loading
- Make sure you selected the correct environment (Production/Preview)
- Redeploy after adding variables
- Check for typos in variable names (they're case-sensitive)

### Still Getting Errors
- Check Vercel deployment logs for environment variable issues
- Verify the variable names match exactly what's in your code
- Make sure you redeployed after adding variables

## Security Notes

⚠️ **IMPORTANT**: 
- Never commit `.env.local` to Git
- Keep API tokens and secrets secure
- Rotate credentials if they're exposed
- Use different credentials for development and production

## Critical Variables for Thumbnail Upload

These are the MUST-HAVE variables for thumbnail upload to work:
- ✅ `CLOUDFLARE_ACCOUNT_ID`
- ✅ `CLOUDFLARE_API_TOKEN`
- ✅ `CLOUDFLARE_DATABASE_ID`
- ✅ `R2_ENDPOINT`
- ✅ `R2_ACCESS_KEY_ID`
- ✅ `R2_SECRET_ACCESS_KEY`
- ✅ `R2_BUCKET_NAME`
- ✅ `R2_PUBLIC_URL`

Without these, you'll get the "Cloudflare credentials not configured" error.

---

**Next Steps**:
1. Add all variables to Vercel dashboard
2. Redeploy your application
3. Test thumbnail upload functionality
4. Verify all features work correctly

**Status**: Ready to configure on Vercel
**Priority**: High - Required for thumbnail upload feature
