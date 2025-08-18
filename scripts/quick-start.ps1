# Quick Start Script for Dual Frontend Development
# This script provides easy commands to start development servers

param(
    [string]$Command = "help"
)

function Show-Help {
    Write-Host "🚀 FastRev Kids Dual Frontend Quick Start" -ForegroundColor Green
    Write-Host ""
    Write-Host "Usage: .\scripts\quick-start.ps1 [command]" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Commands:" -ForegroundColor Yellow
    Write-Host "  start-all     - Start all applications (backend + both frontends)" -ForegroundColor White
    Write-Host "  start-backend - Start only the backend API" -ForegroundColor White
    Write-Host "  start-main    - Start only the main frontend" -ForegroundColor White
    Write-Host "  start-diamond - Start only the diamond frontend" -ForegroundColor White
    Write-Host "  stop-all      - Stop all applications" -ForegroundColor White
    Write-Host "  logs          - Show logs from all services" -ForegroundColor White
    Write-Host "  status        - Show status of all services" -ForegroundColor White
    Write-Host "  clean         - Clean up Docker containers and volumes" -ForegroundColor White
    Write-Host "  help          - Show this help message" -ForegroundColor White
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor Yellow
    Write-Host "  .\scripts\quick-start.ps1 start-all" -ForegroundColor White
    Write-Host "  .\scripts\quick-start.ps1 start-diamond" -ForegroundColor White
    Write-Host "  .\scripts\quick-start.ps1 logs" -ForegroundColor White
}

function Start-AllApplications {
    Write-Host "🚀 Starting all applications..." -ForegroundColor Green
    
    # Check if Docker is running
    try {
        docker version | Out-Null
    } catch {
        Write-Host "❌ Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
        return
    }
    
    # Start backend first
    Write-Host "🔧 Starting backend..." -ForegroundColor Cyan
    Set-Location backend
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev"
    Set-Location ..
    
    # Wait a moment for backend to start
    Start-Sleep -Seconds 3
    
    # Start main frontend
    Write-Host "🌟 Starting main frontend..." -ForegroundColor Cyan
    Set-Location frontend
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm start"
    Set-Location ..
    
    # Start diamond frontend
    Write-Host "💎 Starting diamond frontend..." -ForegroundColor Cyan
    Set-Location frontend-diamond
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev"
    Set-Location ..
    
    Write-Host ""
    Write-Host "✅ All applications started!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📱 Access your applications:" -ForegroundColor Cyan
    Write-Host "   🌟 Main Frontend: http://localhost:3000" -ForegroundColor White
    Write-Host "   💎 Diamond Frontend: http://localhost:3001" -ForegroundColor White
    Write-Host "   🔧 Backend API: http://localhost:3003" -ForegroundColor White
    Write-Host ""
    Write-Host "💡 Use '.\scripts\quick-start.ps1 logs' to view logs" -ForegroundColor Yellow
}

function Start-BackendOnly {
    Write-Host "🔧 Starting backend only..." -ForegroundColor Green
    Set-Location backend
    npm run dev
    Set-Location ..
}

function Start-MainFrontendOnly {
    Write-Host "🌟 Starting main frontend only..." -ForegroundColor Green
    Set-Location frontend
    npm start
    Set-Location ..
}

function Start-DiamondFrontendOnly {
    Write-Host "💎 Starting diamond frontend only..." -ForegroundColor Green
    Set-Location frontend-diamond
    npm run dev
    Set-Location ..
}

function Stop-AllApplications {
    Write-Host "🛑 Stopping all applications..." -ForegroundColor Yellow
    
    # Stop Docker containers
    docker-compose -f docker-compose.dev.yml down 2>$null
    
    # Kill Node.js processes on the specific ports
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {
        $_.ProcessName -eq "node"
    } | Stop-Process -Force -ErrorAction SilentlyContinue
    
    Write-Host "✅ All applications stopped" -ForegroundColor Green
}

function Show-Logs {
    Write-Host "📋 Showing logs from all services..." -ForegroundColor Green
    docker-compose -f docker-compose.dev.yml logs -f
}

function Show-Status {
    Write-Host "📊 Service Status:" -ForegroundColor Green
    docker-compose -f docker-compose.dev.yml ps
}

function Clean-Docker {
    Write-Host "🧹 Cleaning up Docker containers and volumes..." -ForegroundColor Yellow
    
    # Stop and remove containers
    docker-compose -f docker-compose.dev.yml down -v
    
    # Remove unused containers, networks, and images
    docker system prune -f
    
    Write-Host "✅ Cleanup completed" -ForegroundColor Green
}

# Main script logic
switch ($Command.ToLower()) {
    "start-all" { Start-AllApplications }
    "start-backend" { Start-BackendOnly }
    "start-main" { Start-MainFrontendOnly }
    "start-diamond" { Start-DiamondFrontendOnly }
    "stop-all" { Stop-AllApplications }
    "logs" { Show-Logs }
    "status" { Show-Status }
    "clean" { Clean-Docker }
    "help" { Show-Help }
    default { 
        Write-Host "❌ Unknown command: $Command" -ForegroundColor Red
        Write-Host ""
        Show-Help
    }
}
