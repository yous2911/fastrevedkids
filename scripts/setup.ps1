# RevEd Kids Setup Script
Write-Host "🚀 Setting up RevEd Kids project..." -ForegroundColor Green

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed. Please install Node.js 18+ first." -ForegroundColor Red
    exit 1
}

# Check if npm is installed
try {
    $npmVersion = npm --version
    Write-Host "✅ npm version: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm is not installed." -ForegroundColor Red
    exit 1
}

# Install root dependencies
Write-Host "📦 Installing root dependencies..." -ForegroundColor Yellow
npm install

# Install frontend dependencies
Write-Host "📦 Installing frontend dependencies..." -ForegroundColor Yellow
Set-Location frontend
npm install
Set-Location ..

# Install backend dependencies (skip husky for now)
Write-Host "📦 Installing backend dependencies..." -ForegroundColor Yellow
Set-Location backend
# Temporarily disable husky
$env:HUSKY = "0"
npm install --ignore-scripts
Set-Location ..

# Create environment files
Write-Host "⚙️ Creating environment files..." -ForegroundColor Yellow

# Backend env.backend
if (!(Test-Path "backend/env.backend")) {
    Copy-Item "backend/env.example" "backend/env.backend"
    Write-Host "✅ Created backend/env.backend (please edit with your database credentials)" -ForegroundColor Green
} else {
    Write-Host "ℹ️ backend/env.backend already exists" -ForegroundColor Blue
}

# Frontend .env
if (!(Test-Path "frontend/.env")) {
    if (Test-Path "frontend/env.example") {
        Copy-Item "frontend/env.example" "frontend/.env"
        Write-Host "✅ Created frontend/.env" -ForegroundColor Green
    } else {
        # Create basic frontend .env
        $frontendEnv = @"
REACT_APP_API_URL=http://localhost:3001
REACT_APP_ENVIRONMENT=development
"@
        $frontendEnv | Out-File -FilePath "frontend/.env" -Encoding UTF8
        Write-Host "✅ Created frontend/.env" -ForegroundColor Green
    }
} else {
    Write-Host "ℹ️ frontend/.env already exists" -ForegroundColor Blue
}

Write-Host ""
Write-Host "🎉 Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Edit backend/env.backend with your database credentials" -ForegroundColor White
Write-Host "2. Start the application: npm start" -ForegroundColor White
Write-Host "3. Or start separately:" -ForegroundColor White
Write-Host "   - Frontend: npm run start:frontend" -ForegroundColor White
Write-Host "   - Backend: npm run start:backend" -ForegroundColor White
Write-Host ""
Write-Host "📚 See README.md for more information" -ForegroundColor Cyan 