# Production deployment script for RevEd Kids (Windows)
param(
    [switch]$SkipSSLGeneration = $false
)

Write-Host "🚀 Starting RevEd Kids Production Deployment" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green

# Check if .env.production exists
if (-not (Test-Path ".env.production")) {
    Write-Host "❌ .env.production file not found!" -ForegroundColor Red
    Write-Host "Please create .env.production with your production configuration" -ForegroundColor Yellow
    exit 1
}

# Check if SSL certificates exist
if (-not (Test-Path "nginx\ssl\yourdomain.com.crt") -or -not (Test-Path "nginx\ssl\yourdomain.com.key")) {
    if (-not $SkipSSLGeneration) {
        Write-Host "⚠️  SSL certificates not found. Generating self-signed certificates for testing..." -ForegroundColor Yellow
        Set-Location "nginx\ssl"
        .\generate-self-signed.ps1
        Set-Location "..\.."
    } else {
        Write-Host "⚠️  SSL certificates not found. Skipping SSL generation as requested." -ForegroundColor Yellow
    }
}

# Test nginx configuration
Write-Host "📋 Testing Nginx configuration..." -ForegroundColor Green
$nginxTest = docker run --rm -v "$(Get-Location)\nginx\nginx.conf:/etc/nginx/nginx.conf:ro" -v "$(Get-Location)\nginx\conf.d:/etc/nginx/conf.d:ro" nginx:alpine nginx -t

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Nginx configuration test failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Nginx configuration is valid" -ForegroundColor Green

# Stop existing containers
Write-Host "🛑 Stopping existing containers..." -ForegroundColor Green
docker-compose -f docker-compose.prod.yml down

# Build and start services
Write-Host "🏗️  Building and starting production services..." -ForegroundColor Green
docker-compose -f docker-compose.prod.yml up -d --build

# Wait for services to be ready
Write-Host "⏳ Waiting for services to be ready..." -ForegroundColor Green
Start-Sleep -Seconds 30

# Check service health
Write-Host "🏥 Checking service health..." -ForegroundColor Green

# Check Nginx
try {
    $response = Invoke-WebRequest -Uri "http://localhost/.well-known/health-check" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Nginx proxy is healthy" -ForegroundColor Green
    } else {
        Write-Host "❌ Nginx proxy health check failed" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Nginx proxy health check failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Check backend API
try {
    $response = Invoke-WebRequest -Uri "http://localhost/api/health" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Backend API is healthy" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Backend API health check failed - may still be starting" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  Backend API health check failed - may still be starting: $($_.Exception.Message)" -ForegroundColor Yellow
}

# Show container status
Write-Host "📊 Container status:" -ForegroundColor Green
docker-compose -f docker-compose.prod.yml ps

Write-Host ""
Write-Host "🎉 Deployment completed!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Yellow
Write-Host "1. Update your DNS records to point to this server"
Write-Host "2. Replace self-signed certificates with proper SSL certificates"
Write-Host "3. Update domain names in nginx\nginx.conf"
Write-Host "4. Test the application at: https://yourdomain.com"
Write-Host ""
Write-Host "📊 Monitor logs with:" -ForegroundColor Yellow
Write-Host "  docker-compose -f docker-compose.prod.yml logs -f"
Write-Host ""
Write-Host "🔧 Manage SSL certificates:" -ForegroundColor Yellow
Write-Host "  - Self-signed: .\nginx\ssl\generate-self-signed.ps1"
Write-Host "  - Let's Encrypt: certbot --nginx -d yourdomain.com"
Write-Host ""
Write-Host "✨ Happy coding!" -ForegroundColor Green