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
$Source = "dist\*"
$Dest = "admin@ssh.nexspiresolutions.co.in:/var/www/html/"
$ProxyCmd = "cloudflared access ssh --hostname %h"

Write-Host "📤 Uploading files to server..." -ForegroundColor Cyan
Write-Host "Target: $Dest" -ForegroundColor Gray

# Using scp with the proxy command
# Note: Windows scp generally supports -o ProxyCommand
try {
    scp -r -o ProxyCommand="$ProxyCmd" dist/* $Dest
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Deployment Complete!" -ForegroundColor Green
        Write-Host "🌍 Live at: https://nexspiresolutions.co.in" -ForegroundColor Green
    } else {
        Write-Host "❌ SCP Upload failed. Check your SSH/Cloudflare connection." -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error executing SCP: $_" -ForegroundColor Red
}
