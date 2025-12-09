# Nexs-Admin Deployment Guide

## Cloudflare Pages Deployment

This guide will walk you through deploying the Nexs-Admin dashboard to Cloudflare Pages with GitHub integration.

### Prerequisites

- GitHub account with the nexs-admin repository
- Cloudflare account with access to `nexspiresolutions.co.in` domain
- GitHub repository should be pushed and up-to-date

### Step 1: Push Code to GitHub

If you haven't already, push your code to GitHub:

```bash
cd "E:\Smart Code\Freelance Project\Nexs\nexs-admin"
git add .
git commit -m "Add Cloudflare Pages deployment configuration"
git push origin main
```

### Step 2: Create Cloudflare Pages Project

1. **Login to Cloudflare Dashboard**
   - Go to [https://dash.cloudflare.com/](https://dash.cloudflare.com/)
   - Navigate to **Pages** from the left sidebar

2. **Create New Project**
   - Click **"Create a project"**
   - Select **"Connect to Git"**

3. **Connect GitHub Repository**
   - Click **"Connect GitHub"** (authorize if first time)
   - Select your repository: `nexs-admin`
   - Click **"Begin setup"**

4. **Configure Build Settings**
   - **Project name**: `nexs-admin`
   - **Production branch**: `main` (or your default branch)
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `/` (leave empty)
   - **Node version**: `18` (detected from .node-version)

5. **Environment Variables**
   Click **"Add variable"** and add:
   - **Variable name**: `VITE_API_URL`
   - **Value**: `https://api.nexspiresolutions.co.in/api`

6. **Deploy**
   - Click **"Save and Deploy"**
   - Wait for the build to complete (usually 2-5 minutes)
   - You'll get a temporary URL: `https://nexs-admin-xxx.pages.dev`

### Step 3: Configure Custom Subdomain

1. **Add Custom Domain**
   - In your Cloudflare Pages project, go to **"Custom domains"**
   - Click **"Set up a custom domain"**
   - Enter: `admin.nexspiresolutions.co.in`
   - Click **"Continue"**

2. **DNS Configuration**
   - Cloudflare will automatically add the required DNS records
   - Since `nexspiresolutions.co.in` is already on Cloudflare, this is automatic
   - The CNAME record will point to your Pages deployment

3. **SSL/TLS**
   - SSL certificate is automatically provisioned (may take a few minutes)
   - Your site will be accessible at `https://admin.nexspiresolutions.co.in`

### Step 4: Verify Deployment

1. **Check Build Status**
   - Go to **Deployments** tab in Cloudflare Pages
   - Ensure the build completed successfully
   - Check build logs for any errors

2. **Test the Application**
   - Visit `https://admin.nexspiresolutions.co.in`
   - Verify the login page loads correctly
   - Test login functionality
   - Check that API calls work with your backend

3. **Test CORS**
   - Ensure your backend (`api.nexspiresolutions.co.in`) allows requests from `admin.nexspiresolutions.co.in`
   - CORS origin should include: `https://admin.nexspiresolutions.co.in`

### Step 5: Enable Automatic Deployments

Cloudflare Pages automatically deploys when you push to your production branch:

1. **Make a Change**
   ```bash
   # Make some changes to your code
   git add .
   git commit -m "Update feature"
   git push origin main
   ```

2. **Automatic Build**
   - Cloudflare automatically detects the push
   - Triggers a new build
   - Deploys to production upon success

3. **View Deployment**
   - Check the **Deployments** tab in Cloudflare Pages
   - Each commit gets its own deployment
   - Click on any deployment to see details

### Updating Backend CORS

Your backend needs to allow requests from the admin subdomain. Update your CORS configuration in `nexs-backend`:

```javascript
// In your backend CORS configuration
const allowedOrigins = [
  'https://nexspiresolutions.co.in',
  'https://admin.nexspiresolutions.co.in',
  'http://localhost:5173', // For local development
];
```

### Troubleshooting

#### Build Fails

- **Check build logs** in Cloudflare Pages dashboard
- **Verify Node version** matches your local environment
- **Check npm dependencies** are all in package.json
- **Ensure .env.production** has correct API URL

#### API Calls Fail

- **CORS errors**: Update backend CORS to include admin subdomain
- **Wrong API URL**: Check environment variable in Cloudflare Pages
- **SSL issues**: Ensure backend has valid SSL certificate

#### Custom Domain Not Working

- **DNS propagation**: May take up to 24 hours (usually minutes)
- **Check DNS records** in Cloudflare DNS dashboard
- **SSL provisioning**: Wait a few minutes for automatic SSL

#### 404 Errors on Refresh

Cloudflare Pages handles SPAs automatically, but if you encounter issues:
- Check that your routing is client-side (React Router)
- Cloudflare Pages automatically serves index.html for all routes

### Monitoring and Logs

1. **Analytics**
   - View traffic analytics in Cloudflare Pages dashboard
   - Monitor performance metrics

2. **Build Logs**
   - Each deployment has detailed build logs
   - Useful for debugging build issues

3. **Function Logs** (if using Pages Functions)
   - Real-time logs available in dashboard
   - Helps debug server-side issues

### Rollback

To rollback to a previous version:

1. Go to **Deployments** tab
2. Find the working deployment
3. Click **"..."** menu
4. Select **"Rollback to this deployment"**

### Environment-Specific Deployments

For preview deployments (feature branches):

- Push to any non-production branch
- Cloudflare creates a preview deployment
- URL format: `https://branch-name.nexs-admin-xxx.pages.dev`
- Perfect for testing before merging to main

---

## Additional Resources

- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [Cloudflare DNS Documentation](https://developers.cloudflare.com/dns/)

## Support

If you encounter issues:
1. Check Cloudflare Pages build logs
2. Review Cloudflare community forums
3. Contact Cloudflare support for infrastructure issues
