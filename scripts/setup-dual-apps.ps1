# Setup script for dual frontend applications
# This script sets up both the main frontend and diamond frontend

Write-Host "🚀 Setting up FastRev Kids Dual Frontend Applications..." -ForegroundColor Green

# Check if Docker is running
Write-Host "📋 Checking Docker status..." -ForegroundColor Yellow
try {
    docker version | Out-Null
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
    exit 1
}

# Check if required directories exist
Write-Host "📋 Checking project structure..." -ForegroundColor Yellow
$requiredDirs = @("backend", "frontend", "frontend-diamond")
foreach ($dir in $requiredDirs) {
    if (Test-Path $dir) {
        Write-Host "✅ $dir directory exists" -ForegroundColor Green
    } else {
        Write-Host "❌ $dir directory not found" -ForegroundColor Red
        exit 1
    }
}

# Install dependencies for all applications
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow

# Backend dependencies
Write-Host "📦 Installing backend dependencies..." -ForegroundColor Cyan
Set-Location backend
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install backend dependencies" -ForegroundColor Red
    exit 1
}
Set-Location ..

# Main frontend dependencies
Write-Host "📦 Installing main frontend dependencies..." -ForegroundColor Cyan
Set-Location frontend
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install main frontend dependencies" -ForegroundColor Red
    exit 1
}
Set-Location ..

# Diamond frontend dependencies
Write-Host "📦 Installing diamond frontend dependencies..." -ForegroundColor Cyan
Set-Location frontend-diamond
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install diamond frontend dependencies" -ForegroundColor Red
    exit 1
}
Set-Location ..

# Create environment files if they don't exist
Write-Host "📋 Setting up environment files..." -ForegroundColor Yellow

# Backend environment
if (-not (Test-Path "backend/env.backend")) {
    Write-Host "📝 Creating backend environment file..." -ForegroundColor Cyan
    @"
NODE_ENV=development
PORT=3003
HOST=0.0.0.0

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=reved_kids
DB_CONNECTION_LIMIT=20

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_ENABLED=false

# Security
JWT_SECRET=dev-secret-key-change-in-production-minimum-32-chars
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=dev-refresh-secret-change-in-production-minimum-32-chars
JWT_REFRESH_EXPIRES_IN=7d
ENCRYPTION_KEY=dev-encryption-key-change-in-production-32-chars
COOKIE_SECRET=dev-cookie-secret-change-in-production-minimum-32-chars

# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:3001

# File Upload
MAX_FILE_SIZE=10485760
MAX_FILES_PER_REQUEST=5
UPLOAD_PATH=./uploads
ALLOWED_EXTENSIONS=.jpg,.jpeg,.png,.gif,.pdf,.doc,.docx
SCAN_UPLOADS=true

# Monitoring
ENABLE_METRICS=true
METRICS_INTERVAL=60000
HEALTH_CHECK_TIMEOUT=5000
PROMETHEUS_ENABLED=true
PROMETHEUS_PORT=9090

# Cache
CACHE_TTL=900
CACHE_MAX_SIZE=1000

# Rate Limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_AUTH_MAX=10
RATE_LIMIT_AUTH_WINDOW=900000
RATE_LIMIT_GLOBAL_MAX=10000
RATE_LIMIT_GLOBAL_WINDOW=3600000

# DDoS Protection
DDOS_MAX_REQUESTS=1000
DDOS_TIME_WINDOW=60000
DDOS_BAN_DURATION=3600000

# Production Settings
TRUST_PROXY=true
SECURE_COOKIES=false
SAME_SITE=lax
HTTPS_ONLY=false
"@ | Out-File -FilePath "backend/env.backend" -Encoding UTF8
    Write-Host "✅ Backend environment file created" -ForegroundColor Green
}

# Main frontend environment
if (-not (Test-Path "frontend/.env")) {
    Write-Host "📝 Creating main frontend environment file..." -ForegroundColor Cyan
    @"
REACT_APP_API_URL=http://localhost:3003
REACT_APP_ENVIRONMENT=development
REACT_APP_APP_TYPE=main
GENERATE_SOURCEMAP=false
"@ | Out-File -FilePath "frontend/.env" -Encoding UTF8
    Write-Host "✅ Main frontend environment file created" -ForegroundColor Green
}

# Diamond frontend environment
if (-not (Test-Path "frontend-diamond/.env")) {
    Write-Host "📝 Creating diamond frontend environment file..." -ForegroundColor Cyan
    @"
REACT_APP_API_URL=http://localhost:3003
REACT_APP_ENVIRONMENT=development
REACT_APP_APP_TYPE=diamond
GENERATE_SOURCEMAP=false
"@ | Out-File -FilePath "frontend-diamond/.env" -Encoding UTF8
    Write-Host "✅ Diamond frontend environment file created" -ForegroundColor Green
}

# Build Docker images
Write-Host "🐳 Building Docker images..." -ForegroundColor Yellow
docker-compose -f docker-compose.dev.yml build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to build Docker images" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Docker images built successfully" -ForegroundColor Green

# Start the applications
Write-Host "🚀 Starting applications..." -ForegroundColor Yellow
Write-Host "📋 Starting with Docker Compose..." -ForegroundColor Cyan
docker-compose -f docker-compose.dev.yml up -d

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to start applications" -ForegroundColor Red
    exit 1
}

# Wait for services to be ready
Write-Host "⏳ Waiting for services to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Check service status
Write-Host "📋 Checking service status..." -ForegroundColor Yellow
docker-compose -f docker-compose.dev.yml ps

Write-Host ""
Write-Host "🎉 Setup completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📱 Your applications are now running:" -ForegroundColor Cyan
Write-Host "   🌟 Main Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "   💎 Diamond Frontend: http://localhost:3001" -ForegroundColor White
Write-Host "   🔧 Backend API: http://localhost:3003" -ForegroundColor White
Write-Host "   📊 Redis: localhost:6379" -ForegroundColor White
Write-Host ""
Write-Host "📋 Useful commands:" -ForegroundColor Cyan
Write-Host "   • View logs: docker-compose -f docker-compose.dev.yml logs -f" -ForegroundColor White
Write-Host "   • Stop services: docker-compose -f docker-compose.dev.yml down" -ForegroundColor White
Write-Host "   • Restart services: docker-compose -f docker-compose.dev.yml restart" -ForegroundColor White
Write-Host ""
Write-Host "🔧 Development commands:" -ForegroundColor Cyan
Write-Host "   • Backend: cd backend && npm run dev" -ForegroundColor White
Write-Host "   • Main Frontend: cd frontend && npm start" -ForegroundColor White
Write-Host "   • Diamond Frontend: cd frontend-diamond && npm run dev" -ForegroundColor White
