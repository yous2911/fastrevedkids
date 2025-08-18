# Simple script to run the dual project setup
Write-Host "🚀 Running Dual Project Setup..." -ForegroundColor Green
Write-Host ""

# Run the main setup script
& ".\scripts\create-dual-projects.ps1"

Write-Host ""
Write-Host "✅ Setup completed! Check the created directories:" -ForegroundColor Green
Write-Host "   • fastrevedkids-main/" -ForegroundColor Cyan
Write-Host "   • fastrevedkids-diamond/" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Follow the instructions in GITHUB_SETUP.md to create GitHub repositories." -ForegroundColor Yellow
