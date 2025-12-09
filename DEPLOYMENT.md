# Deployment Guide for Nexs Projects

This repository contains two projects that are deployed together to GitHub Pages:

## Projects

### 1. Nexs-Agency (Public Website)
- **URL**: https://nexspiresolutions.co.in
- **Path**: Root (`/`)
- **Source**: `nexs-agency/`

### 2. Nexs-Admin (Admin Dashboard)
-**URL**: https://admin.nexspiresolutions.co.in
- **Path**: `/nexs-admin/`
- **Source**: `nexs-admin/`

## How It Works

Both projects are deployed together using a single GitHub Actions workflow:

1. **Build Stage**: Builds both `nexs-agency` and `nexs-admin` separately
2. **Combine Stage**: Combines both builds into one deployment
   - `nexs-agency/dist/*` → deployed to root
   - `nexs-admin/dist/*` → deployed to `/nexs-admin/`
3. **Deploy Stage**: Deploys the combined build to GitHub Pages

## Deployment

### Automatic Deployment

Every push to `master` branch triggers automatic deployment:

```bash
git push origin master
```

Both projects will be built and deployed automatically.

### Monitoring

- GitHub Actions: https://github.com/amankumarsahani/NexSpireSolutions/actions
- Build typically takes 3-7 minutes for both projects

## DNS Configuration

### Root Domain (nexs-agency)
Already configured ✅
```
Type: CNAME
Name: @ or nexspiresolutions.co.in
Target: amankumarsahani.github.io
```

### Admin Subdomain (nexs-admin)
Add this CNAME record in Cloudflare:
```
Type: CNAME
Name: admin
Target: amankumarsahani.github.io
Proxy: DNS only (gray cloud)
TTL: Auto
```

## GitHub Pages Settings

**Do NOT change the GitHub Pages source** - it's already correctly configured for nexs-agency and will now serve both projects.

Custom domains:
- Primary: `nexspiresolutions.co.in` (already set)
- The admin subdomain will automatically work via DNS CNAME

## Important Notes

- Both projects share the same deployment
- Changes to either project trigger a full rebuild
- nexs-agency always at root, nexs-admin always at `/nexs-admin/`
- Do not create separate GitHub Pages configurations

## Project-Specific Guides

- nexs-admin deployment details: `nexs-admin/DEPLOYMENT.md`
