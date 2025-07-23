# 🎯 RevEd Kids - Quick Test & Launch Script
Write-Host "🚀 RevEd Kids - Quick Test & Launch" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

# Check project structure
Write-Host "[INFO] Checking project structure..." -ForegroundColor Blue
if (-not (Test-Path "frontend") -or -not (Test-Path "backend")) {
    Write-Host "[ERROR] Not in the correct directory!" -ForegroundColor Red
    Write-Host "Make sure you're in the fastrevedkids root folder." -ForegroundColor Red
    exit 1
}
Write-Host "[SUCCESS] Project structure looks good!" -ForegroundColor Green

# Check Node.js
Write-Host "[INFO] Checking Node.js..." -ForegroundColor Blue
try {
    $nodeVersion = node --version
    Write-Host "[SUCCESS] Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Node.js not installed!" -ForegroundColor Red
    exit 1
}

# Install frontend dependencies
Write-Host "[INFO] Installing frontend dependencies..." -ForegroundColor Blue
Set-Location frontend
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Frontend install failed!" -ForegroundColor Red
    exit 1
}
Write-Host "[SUCCESS] Frontend dependencies installed!" -ForegroundColor Green

# Install backend dependencies
Write-Host "[INFO] Installing backend dependencies..." -ForegroundColor Blue
Set-Location ../backend
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Backend install failed!" -ForegroundColor Red
    exit 1
}
Write-Host "[SUCCESS] Backend dependencies installed!" -ForegroundColor Green

# Create environment files
Write-Host "[INFO] Creating environment files..." -ForegroundColor Blue
Set-Location ../frontend
if (-not (Test-Path ".env.local") -and (Test-Path "env.example")) {
    Copy-Item env.example .env.local
    Write-Host "[SUCCESS] Frontend .env.local created!" -ForegroundColor Green
}

Set-Location ../backend
if (-not (Test-Path ".env") -and (Test-Path "env.example")) {
    Copy-Item env.example .env
    Write-Host "[SUCCESS] Backend .env created!" -ForegroundColor Green
}

# Launch servers
Write-Host "[INFO] Launching servers..." -ForegroundColor Blue
Set-Location ..

# Start frontend
Write-Host "[INFO] Starting frontend on port 3000..." -ForegroundColor Blue
Start-Process -FilePath "npm" -ArgumentList "start" -WorkingDirectory "frontend" -WindowStyle Hidden
Start-Sleep -Seconds 3

# Start backend
Write-Host "[INFO] Starting backend on port 3001..." -ForegroundColor Blue
Start-Process -FilePath "npm" -ArgumentList "run", "dev" -WorkingDirectory "backend" -WindowStyle Hidden

# Wait and test
Start-Sleep -Seconds 5
Write-Host "[INFO] Testing server connectivity..." -ForegroundColor Blue

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 5 -UseBasicParsing
    Write-Host "[SUCCESS] Frontend responding on http://localhost:3000" -ForegroundColor Green
} catch {
    Write-Host "[WARNING] Frontend not responding yet..." -ForegroundColor Yellow
}

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001" -TimeoutSec 5 -UseBasicParsing
    Write-Host "[SUCCESS] Backend responding on http://localhost:3001" -ForegroundColor Green
} catch {
    Write-Host "[WARNING] Backend not responding yet..." -ForegroundColor Yellow
}

# Final status
Write-Host ""
Write-Host "🎉 ==============================================" -ForegroundColor Green
Write-Host "🎉 RevEd Kids - Launch Complete!" -ForegroundColor Green
Write-Host "🎉 ==============================================" -ForegroundColor Green
Write-Host ""
Write-Host "📱 Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "🔧 Backend:  http://localhost:3001" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  Known Issues:" -ForegroundColor Yellow
Write-Host "   - TypeScript errors need fixing (use Jules AI)"
Write-Host "   - Some components need useRef fixes"
Write-Host "   - Missing sound types need to be added"
Write-Host ""
Write-Host "🚀 Next Steps:" -ForegroundColor Green
Write-Host "   1. Open http://localhost:3000 in your browser"
Write-Host "   2. Use Jules AI to fix TypeScript errors"
Write-Host "   3. Test the application functionality"
Write-Host ""

Write-Host "[SUCCESS] Launch complete! Your RevEd Kids app should be running!" -ForegroundColor Green 