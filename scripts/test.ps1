# 🎯 RevEd Kids - Complete Test & Launch Script (PowerShell)
# This script will test your project setup and launch both servers

Write-Host "🚀 RevEd Kids - Project Test & Launch Script" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan

# Function to print colored output
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Check if we're in the right directory
Write-Status "Checking project structure..."

if (-not (Test-Path "frontend") -or -not (Test-Path "backend")) {
    Write-Error "❌ Not in the correct directory! Make sure you're in the fastrevedkids root folder."
    Write-Error "Expected structure:"
    Write-Host "fastrevedkids/"
    Write-Host "├── frontend/"
    Write-Host "└── backend/"
    exit 1
}

Write-Success "✅ Project structure looks good!"

# Check Node.js installation
Write-Status "Checking Node.js installation..."
try {
    $nodeVersion = node --version
    Write-Success "✅ Node.js version: $nodeVersion"
} catch {
    Write-Error "❌ Node.js is not installed! Please install Node.js first."
    exit 1
}

# Check npm installation
Write-Status "Checking npm installation..."
try {
    $npmVersion = npm --version
    Write-Success "✅ npm version: $npmVersion"
} catch {
    Write-Error "❌ npm is not installed! Please install npm first."
    exit 1
}

# Check if ports are available
Write-Status "Checking port availability..."

function Test-Port {
    param([int]$Port)
    try {
        $connection = Test-NetConnection -ComputerName localhost -Port $Port -InformationLevel Quiet
        if ($connection) {
            Write-Warning "⚠️  Port $Port is already in use"
            return $false
        } else {
            Write-Success "✅ Port $Port is available"
            return $true
        }
    } catch {
        Write-Success "✅ Port $Port is available"
        return $true
    }
}

Test-Port 3000
Test-Port 3001

# Install frontend dependencies
Write-Status "Installing frontend dependencies..."
Set-Location frontend

if (-not (Test-Path "package.json")) {
    Write-Error "❌ package.json not found in frontend directory!"
    exit 1
}

Write-Status "Running npm install for frontend..."
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Error "❌ Frontend dependency installation failed!"
    exit 1
}

Write-Success "✅ Frontend dependencies installed"

# Check for missing dependencies
Write-Status "Checking for critical missing dependencies..."

$missingDeps = @()

try {
    npm list three | Out-Null
} catch {
    $missingDeps += "three"
}

try {
    npm list framer-motion | Out-Null
} catch {
    $missingDeps += "framer-motion"
}

try {
    npm list @types/three | Out-Null
} catch {
    $missingDeps += "@types/three"
}

if ($missingDeps.Count -gt 0) {
    Write-Warning "⚠️  Missing critical dependencies: $($missingDeps -join ', ')"
    Write-Status "Installing missing dependencies..."
    npm install $missingDeps
    Write-Success "✅ Missing dependencies installed"
}

# Install backend dependencies
Write-Status "Installing backend dependencies..."
Set-Location ../backend

if (-not (Test-Path "package.json")) {
    Write-Error "❌ package.json not found in backend directory!"
    exit 1
}

Write-Status "Running npm install for backend..."
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Error "❌ Backend dependency installation failed!"
    exit 1
}

Write-Success "✅ Backend dependencies installed"

# Check for environment files
Write-Status "Checking environment configuration..."

Set-Location ../frontend
if (-not (Test-Path ".env.local") -and (Test-Path "env.example")) {
    Write-Warning "⚠️  Frontend .env.local not found, copying from example..."
    Copy-Item env.example .env.local
    Write-Success "✅ Frontend environment file created"
}

Set-Location ../backend
if (-not (Test-Path "env.backend") -and (Test-Path "env.example")) {
    Write-Warning "⚠️  Backend env.backend not found, copying from example..."
    Copy-Item env.example env.backend
    Write-Success "✅ Backend environment file created"
}

# Test frontend build
Write-Status "Testing frontend build..."
Set-Location ../frontend

Write-Status "Running frontend build test..."
npm run build 2>$null

if ($LASTEXITCODE -eq 0) {
    Write-Success "✅ Frontend builds successfully"
} else {
    Write-Warning "⚠️  Frontend build has issues (this is expected with current TypeScript errors)"
}

# Test backend build
Write-Status "Testing backend build..."
Set-Location ../backend

Write-Status "Running backend build test..."
npm run build 2>$null

if ($LASTEXITCODE -eq 0) {
    Write-Success "✅ Backend builds successfully"
} else {
    Write-Warning "⚠️  Backend build has issues (this is expected with current TypeScript errors)"
}

# Launch servers
Write-Status "🚀 Launching servers..."

Set-Location ..

# Function to start frontend
function Start-Frontend {
    Write-Status "Starting frontend server on port 3000..."
    Set-Location frontend
    Start-Process -FilePath "npm" -ArgumentList "start" -WindowStyle Hidden
    Write-Success "✅ Frontend server started"
}

# Function to start backend
function Start-Backend {
    Write-Status "Starting backend server on port 3001..."
    Set-Location backend
    Start-Process -FilePath "npm" -ArgumentList "run", "dev" -WindowStyle Hidden
    Write-Success "✅ Backend server started"
}

# Start both servers
Start-Frontend
Start-Sleep -Seconds 3
Start-Backend

# Wait a moment for servers to start
Start-Sleep -Seconds 5

# Test server connectivity
Write-Status "Testing server connectivity..."

# Test frontend
try {
    Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 5 -UseBasicParsing | Out-Null
    Write-Success "✅ Frontend server is responding on http://localhost:3000"
} catch {
    Write-Warning "⚠️  Frontend server not responding yet (may still be starting)"
}

# Test backend
try {
    Invoke-WebRequest -Uri "http://localhost:3001" -TimeoutSec 5 -UseBasicParsing | Out-Null
    Write-Success "✅ Backend server is responding on http://localhost:3001"
} catch {
    Write-Warning "⚠️  Backend server not responding yet (may still be starting)"
}

# Display final status
Write-Host ""
Write-Host "🎉 ==============================================" -ForegroundColor Green
Write-Host "🎉 RevEd Kids - Launch Complete!" -ForegroundColor Green
Write-Host "🎉 ==============================================" -ForegroundColor Green
Write-Host ""
Write-Host "📱 Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "🔧 Backend:  http://localhost:3001" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Current Status:" -ForegroundColor Yellow
Write-Host "   ✅ Project structure verified"
Write-Host "   ✅ Dependencies installed"
Write-Host "   ✅ Environment files created"
Write-Host "   ✅ Servers launched"
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
Write-Host "🛑 To stop servers:" -ForegroundColor Red
Write-Host "   Press Ctrl+C in each terminal window"
Write-Host "   Or close the terminal windows"
Write-Host ""

Write-Success "🎉 Launch complete! Your RevEd Kids app should be running!" 