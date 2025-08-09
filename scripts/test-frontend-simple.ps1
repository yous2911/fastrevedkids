# 🧪 RevEd Kids - Frontend Unit Tests (Simple Version)
# This script runs frontend unit tests automatically

Write-Host "🧪 RevEd Kids - Frontend Unit Tests" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan

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

if (-not (Test-Path "frontend")) {
    Write-Error "❌ Not in the correct directory! Make sure you're in the fastrevedkids root folder."
    Write-Error "Expected structure: fastrevedkids/frontend/"
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

# Navigate to frontend directory
Write-Status "Navigating to frontend directory..."
Set-Location frontend

if (-not (Test-Path "package.json")) {
    Write-Error "❌ package.json not found in frontend directory!"
    exit 1
}

# Check if dependencies are installed
if (-not (Test-Path "node_modules")) {
    Write-Warning "⚠️  Dependencies not installed. Installing now..."
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Error "❌ Failed to install dependencies!"
        exit 1
    }
    Write-Success "✅ Dependencies installed successfully"
}

# Check available test scripts
Write-Status "Checking available test scripts..."
$packageJson = Get-Content "package.json" | ConvertFrom-Json
$testScripts = $packageJson.scripts | Get-Member -MemberType NoteProperty | Where-Object { $_.Name -like "*test*" }

Write-Success "✅ Available test scripts:"
foreach ($script in $testScripts) {
    Write-Host "   - $($script.Name): $($packageJson.scripts.$($script.Name))" -ForegroundColor White
}

# Run tests with coverage
Write-Host ""
Write-Status "Running frontend unit tests with coverage..."
Write-Host ""

try {
    # Run the tests with coverage
    $output = npm run test:coverage 2>&1
    $exitCode = $LASTEXITCODE
    
    # Display the output
    $output | ForEach-Object { Write-Host $_ }
    
    if ($exitCode -eq 0) {
        Write-Success "✅ All tests passed successfully!"
    } else {
        Write-Warning "⚠️  Some tests failed (exit code: $exitCode)"
    }
    
} catch {
    Write-Error "❌ Error running tests: $($_.Exception.Message)"
    $exitCode = 1
}

# Return to root directory
Set-Location ..

# Final status
Write-Host ""
Write-Host "🎉 ==============================================" -ForegroundColor Green
Write-Host "🎉 Frontend Unit Tests Complete!" -ForegroundColor Green
Write-Host "🎉 ==============================================" -ForegroundColor Green
Write-Host ""

if ($exitCode -eq 0) {
    Write-Success "✅ All tests passed successfully!"
} else {
    Write-Warning "⚠️  Some tests failed. Check the output above for details."
}

Write-Host ""
Write-Host "📚 Next Steps:" -ForegroundColor Yellow
Write-Host "   - Review test coverage report in frontend/coverage/" -ForegroundColor White
Write-Host "   - Fix any failing tests" -ForegroundColor White
Write-Host "   - Add new tests for untested components" -ForegroundColor White
Write-Host "   - Run 'npm test' in frontend directory for interactive mode" -ForegroundColor White

Write-Host ""
Write-Success "🧪 Frontend unit testing complete!"

# Exit with the test result code
exit $exitCode 