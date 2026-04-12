# Deploy Nexs-Agency to VPS
Write-Host "🚀 Starting Deployment to VPS..." -ForegroundColor Green

# 1. Build the project
Write-Host "📦 Building project..." -ForegroundColor Cyan
npm run build:prod

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

# 2. Deploy files using SCP with Cloudflare ProxyCommand
# Set these environment variables before running:
#   DEPLOY_USER       - SSH username (e.g. admin)
#   DEPLOY_HOST       - SSH hostname (e.g. ssh.example.com)
#   DEPLOY_PATH       - Remote path (e.g. /var/www/html/)
#   DEPLOY_SITE_URL   - Live site URL (e.g. https://example.com)
$Source = "dist\*"
$User = $env:DEPLOY_USER
$Host_ = $env:DEPLOY_HOST
$Path_ = $env:DEPLOY_PATH
$SiteUrl = $env:DEPLOY_SITE_URL

if (-not $User -or -not $Host_ -or -not $Path_) {
    Write-Host "❌ Missing required environment variables: DEPLOY_USER, DEPLOY_HOST, DEPLOY_PATH" -ForegroundColor Red
    exit 1
}

$Dest = "${User}@${Host_}:${Path_}"
$ProxyCmd = "cloudflared access ssh --hostname %h"

Write-Host "📤 Uploading files to server..." -ForegroundColor Cyan
Write-Host "Target: $Dest" -ForegroundColor Gray

# Using scp with the proxy command
# Note: Windows scp generally supports -o ProxyCommand
try {
    scp -r -o ProxyCommand="$ProxyCmd" dist/* $Dest
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Deployment Complete!" -ForegroundColor Green
        if ($SiteUrl) {
            Write-Host "🌍 Live at: $SiteUrl" -ForegroundColor Green
        }
    } else {
        Write-Host "❌ SCP Upload failed. Check your SSH/Cloudflare connection." -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error executing SCP: $_" -ForegroundColor Red
}
