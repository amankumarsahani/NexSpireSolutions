# 🚀 Deployment Guide - Nexspire Solutions

Complete guide for deploying the Nexspire Solutions frontend to GitHub Pages at **nexspiresolutions.co.in**.

## 📋 Prerequisites

- Node.js 20+ installed
- Git installed
- GitHub account
- Access to domain DNS settings (`nexspiresolutions.co.in`)
- Backend API ready at subdomain (`api.nexspiresolutions.co.in`)

## 🔧 Environment Setup

### 1. Install Dependencies

```powershell
cd "e:\Smart Code\Freelance Project\Nexs\nexs-agency"
npm install
```

This will install the new `gh-pages` package required for deployment.

### 2. Environment Variables

Three environment files have been created:

- **`.env.production`** - Production configuration (API: `https://api.nexspiresolutions.co.in/api`)
- **`.env.development`** - Local development (API: `http://localhost:5000/api`)
- **`.env.example`** - Template for reference

The build process automatically uses the correct environment file.

## 📦 Building for Production

### Test the Production Build Locally

```powershell
# Build the production bundle
cd "e:\Smart Code\Freelance Project\Nexs\nexs-agency"
npm run build:prod

# Preview the production build
npm run preview
```

Visit `http://localhost:4173` to test the production build locally.

## 🌐 GitHub Pages Deployment

### Option 1: Automated Deployment (Recommended)

The GitHub Actions workflow (`.github/workflows/deploy.yml`) automatically deploys when you push to the `main` branch.

**Steps:**

1. **Push Your Code to GitHub:**
   ```powershell
   cd "e:\Smart Code\Freelance Project\Nexs"
   git add .
   git commit -m "Configure GitHub Pages deployment"
   git push origin main
   ```

2. **Enable GitHub Pages:**
   - Go to your GitHub repository
   - Navigate to **Settings** → **Pages**
   - Under "Source", select **GitHub Actions**
   - The workflow will automatically deploy

3. **Configure Custom Domain:**
   - In **Settings** → **Pages**
   - Under "Custom domain", enter: `nexspiresolutions.co.in`
   - Click **Save**
   - GitHub will create a `CNAME` file

### Option 2: Manual Deployment

```powershell
cd "e:\Smart Code\Freelance Project\Nexs\nexs-agency"

# Deploy to GitHub Pages
npm run deploy
```

This command:
1. Runs `npm run build:prod` to create production bundle
2. Deploys the `dist` folder to `gh-pages` branch

## 🔐 DNS Configuration

### Configure Your Domain

Add these DNS records at your domain registrar for `nexspiresolutions.co.in`:

**For Apex Domain (nexspiresolutions.co.in):**

```
Type: A
Name: @
Value: 185.199.108.153
TTL: 3600

Type: A  
Name: @
Value: 185.199.109.153
TTL: 3600

Type: A
Name: @
Value: 185.199.110.153
TTL: 3600

Type: A
Name: @
Value: 185.199.111.153
TTL: 3600
```

**For www subdomain:**

```
Type: CNAME
Name: www
Value: <your-github-username>.github.io
TTL: 3600
```

**For API subdomain:**

```
Type: A or CNAME
Name: api
Value: <your-backend-server-ip> or <backend-host>
TTL: 3600
```

### Verify DNS Propagation

Use tools like [whatsmydns.net](https://www.whatsmydns.net/) to check DNS propagation (can take 24-48 hours).

## 🔒 SSL Certificate

GitHub Pages automatically provisions SSL certificates for custom domains via Let's Encrypt.

**Enable HTTPS:**
1. After DNS is configured and verified
2. Go to **Settings** → **Pages**
3. Check **"Enforce HTTPS"**
4. Wait for certificate provisioning (~5 minutes)

## 🎯 Backend API Configuration

### Deploy Backend to Subdomain

Your backend needs to be accessible at `https://api.nexspiresolutions.co.in`

**Required Backend Configuration:**

1. **CORS Settings** - Allow requests from `https://nexspiresolutions.co.in`:

```javascript
// In your backend (e.g., Express.js)
const cors = require('cors');

app.use(cors({
  origin: [
    'https://nexspiresolutions.co.in',
    'https://www.nexspiresolutions.co.in',
    'http://localhost:3000' // For local development
  ],
  credentials: true
}));
```

2. **Environment Variables** - Configure backend for production

3. **SSL Certificate** - Ensure HTTPS is enabled for the API subdomain

### Test API Connectivity

```javascript
// Test in browser console after deployment
fetch('https://api.nexspiresolutions.co.in/api/health')
  .then(res => res.json())
  .then(data => console.log('API Status:', data))
  .catch(err => console.error('API Error:', err));
```

## ✅ Verification Checklist

### Pre-Deployment

- [ ] Code pushed to GitHub `main` branch
- [ ] GitHub Pages enabled in repository settings
- [ ] Custom domain configured (`nexspiresolutions.co.in`)
- [ ] DNS records added and propagated
- [ ] Backend deployed at `api.nexspiresolutions.co.in`
- [ ] Backend CORS configured

### Post-Deployment

- [ ] Site loads at `https://nexspiresolutions.co.in`
- [ ] HTTPS certificate is active (green padlock)
- [ ] All pages and routes work correctly
- [ ] Images and assets load
- [ ] Navigation functions properly
- [ ] Mobile responsive design works
- [ ] API connectivity verified
- [ ] Login/authentication works
- [ ] Admin panel accessible

### SEO Verification

- [ ] Meta tags present (view page source)
- [ ] Open Graph tags correct
- [ ] Sitemap accessible at `/sitemap.xml`
- [ ] Robots.txt accessible at `/robots.txt`
- [ ] Test with [Google Rich Results Test](https://search.google.com/test/rich-results)
- [ ] Test with [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
- [ ] Test with [Twitter Card Validator](https://cards-dev.twitter.com/validator)

## 🐛 Troubleshooting

### Issue: 404 on Page Refresh

**Cause:** GitHub Pages doesn't support client-side routing by default.

**Solution:** Use hash-based routing or create `404.html` redirect:

```html
<!-- public/404.html -->
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Redirecting...</title>
    <script>
      sessionStorage.redirect = location.href;
    </script>
    <meta http-equiv="refresh" content="0;URL='/'">
  </head>
  <body></body>
</html>
```

### Issue: Assets Not Loading

**Check:**
- Vite `base` configuration is set to `'./'`
- Asset paths are relative, not absolute
- Build completed successfully

### Issue: API Connection Failed

**Check:**
- Backend is running at `api.nexspiresolutions.co.in`
- CORS is configured correctly
- Backend has valid SSL certificate
- API subdomain DNS is configured
- Network tab in browser DevTools for errors

### Issue: DNS Not Resolving

**Check:**
- DNS records correctly configured
- Allow 24-48 hours for propagation
- Clear browser DNS cache: `ipconfig /flushdns` (Windows)
- Use incognito/private browsing

## 📊 Monitoring

### Analytics Setup

Consider adding:
- Google Analytics 4
- Google Search Console
- Error tracking (Sentry, LogRocket)

### Performance Monitoring

- Use Lighthouse for performance audits
- Monitor Core Web Vitals
- Check PageSpeed Insights

## 🔄 Updating the Site

### Make Changes and Deploy

```powershell
cd "e:\Smart Code\Freelance Project\Nexs\nexs-agency"

# Make your code changes...

# Build and verify locally
npm run build:prod
npm run preview

# Deploy (if using manual deployment)
npm run deploy

# OR commit and push (if using GitHub Actions)
cd ..
git add .
git commit -m "Your commit message"
git push origin main
```

GitHub Actions will automatically rebuild and deploy within 5-10 minutes.

## 📞 Support

If you encounter issues:

1. Check GitHub Actions workflow logs
2. Verify DNS configuration
3. Test backend API independently
4. Check browser console for errors
5. Review network requests in DevTools

## 🎉 Success!

Once deployed, your site will be live at:
- **Main Site:** https://nexspiresolutions.co.in
- **API Backend:** https://api.nexspiresolutions.co.in
- **Admin Panel:** https://nexspiresolutions.co.in/admin

Share your professional website with the world! 🌍
