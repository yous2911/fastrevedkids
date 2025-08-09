# Test Exercise Engine Script
# This script starts the frontend and provides instructions for testing the exercise engine

Write-Host "🧪 Exercise Engine Test Setup" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

# Check if backend is running
Write-Host "Checking backend status..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3003/api/health" -Method GET -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Backend is running on http://localhost:3003" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Backend responded with status: $($response.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Backend is not running on http://localhost:3003" -ForegroundColor Red
    Write-Host "Please start the backend first with: cd backend && npm run dev" -ForegroundColor Yellow
    Write-Host ""
}

Write-Host ""
Write-Host "🚀 Starting Frontend..." -ForegroundColor Cyan

# Change to frontend directory
Set-Location "frontend"

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
}

# Start the frontend
Write-Host "🌐 Starting frontend development server..." -ForegroundColor Green
Write-Host "Frontend will be available at: http://localhost:3000" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Testing Instructions:" -ForegroundColor Cyan
Write-Host "1. Open http://localhost:3000 in your browser" -ForegroundColor White
Write-Host "2. Log in with any student credentials" -ForegroundColor White
Write-Host "3. Click the '🧪 Test Exercise Engine' button on the dashboard" -ForegroundColor White
Write-Host "4. Select an exercise engine type (Simple, Full, or Adaptive)" -ForegroundColor White
Write-Host "5. Use filters to find specific exercise types" -ForegroundColor White
Write-Host "6. Click on exercises to test them" -ForegroundColor White
Write-Host "7. View test results and performance metrics" -ForegroundColor White
Write-Host ""
Write-Host "🔧 Available Exercise Engines:" -ForegroundColor Cyan
Write-Host "• Simple Engine: Basic exercise component with minimal features" -ForegroundColor White
Write-Host "• Full Engine: Complete exercise engine with all features (hints, timer, etc.)" -ForegroundColor White
Write-Host "• Adaptive Engine: AI-powered adaptive learning with difficulty adjustment" -ForegroundColor White
Write-Host ""
Write-Host "📊 Test Features:" -ForegroundColor Cyan
Write-Host "• Real backend data integration" -ForegroundColor White
Write-Host "• Multiple exercise types (QCM, CALCUL, TEXTE_LIBRE, DRAG_DROP)" -ForegroundColor White
Write-Host "• Performance tracking and analytics" -ForegroundColor White
Write-Host "• XP earning and progress tracking" -ForegroundColor White
Write-Host "• Filtering by type, difficulty, and subject" -ForegroundColor White
Write-Host ""

# Start the development server
npm start 