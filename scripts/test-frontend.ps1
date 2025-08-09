# 🧪 RevEd Kids - Frontend Unit Tests Script (PowerShell)
# This script runs comprehensive unit tests for the frontend

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

# Function to run tests with different options
function Start-TestRun {
    param(
        [string]$TestType = "default",
        [switch]$Watch,
        [switch]$Coverage,
        [switch]$Verbose
    )
    
    Write-Status "Running $TestType tests..."
    
    $testCommand = "npm test"
    $arguments = @()
    
    switch ($TestType) {
        "coverage" {
            $testCommand = "npm run test:coverage"
            Write-Status "Running tests with coverage report..."
        }
        "watch" {
            $arguments += "--watch"
            Write-Status "Running tests in watch mode..."
        }
        "verbose" {
            $arguments += "--verbose"
            Write-Status "Running tests with verbose output..."
        }
        "default" {
            Write-Status "Running default tests..."
        }
    }
    
    if ($Coverage) {
        $testCommand = "npm run test:coverage"
    }
    
    if ($Watch) {
        $arguments += "--watch"
    }
    
    if ($Verbose) {
        $arguments += "--verbose"
    }
    
    # Build the full command
    $fullCommand = $testCommand
    if ($arguments.Count -gt 0) {
        $fullCommand += " " + ($arguments -join " ")
    }
    
    Write-Status "Executing: $fullCommand"
    
    # Run the tests
    if ($Watch) {
        # For watch mode, run in current terminal
        Invoke-Expression $fullCommand
    } else {
        # For non-watch mode, capture output
        $output = Invoke-Expression $fullCommand 2>&1
        $exitCode = $LASTEXITCODE
        
        # Display output
        $output | ForEach-Object { Write-Host $_ }
        
        if ($exitCode -eq 0) {
            Write-Success "✅ Tests completed successfully!"
        } else {
            Write-Warning "⚠️  Some tests failed (exit code: $exitCode)"
        }
        
        return $exitCode
    }
}

# Main test execution
Write-Host ""
Write-Host "🧪 Test Options:" -ForegroundColor Yellow
Write-Host "1. Run default tests" -ForegroundColor White
Write-Host "2. Run tests with coverage" -ForegroundColor White
Write-Host "3. Run tests in watch mode" -ForegroundColor White
Write-Host "4. Run verbose tests" -ForegroundColor White
Write-Host "5. Run all test types" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Select test option (1-5) or press Enter for default tests"

switch ($choice) {
    "1" { 
        $exitCode = Start-TestRun -TestType "default"
    }
    "2" { 
        $exitCode = Start-TestRun -TestType "coverage"
    }
    "3" { 
        Start-TestRun -TestType "watch" -Watch
    }
    "4" { 
        $exitCode = Start-TestRun -TestType "verbose" -Verbose
    }
    "5" { 
        Write-Status "Running all test types..."
        
        Write-Host ""
        Write-Host "📊 Running default tests..." -ForegroundColor Cyan
        $exitCode1 = Start-TestRun -TestType "default"
        
        Write-Host ""
        Write-Host "📊 Running tests with coverage..." -ForegroundColor Cyan
        $exitCode2 = Start-TestRun -TestType "coverage"
        
        Write-Host ""
        Write-Host "📊 Running verbose tests..." -ForegroundColor Cyan
        $exitCode3 = Start-TestRun -TestType "verbose" -Verbose
        
        $overallExitCode = [Math]::Max($exitCode1, [Math]::Max($exitCode2, $exitCode3))
        
        Write-Host ""
        Write-Host "📋 Test Summary:" -ForegroundColor Yellow
        Write-Host "   Default tests: $(if ($exitCode1 -eq 0) { '✅ Passed' } else { '❌ Failed' })" -ForegroundColor $(if ($exitCode1 -eq 0) { "Green" } else { "Red" })
        Write-Host "   Coverage tests: $(if ($exitCode2 -eq 0) { '✅ Passed' } else { '❌ Failed' })" -ForegroundColor $(if ($exitCode2 -eq 0) { "Green" } else { "Red" })
        Write-Host "   Verbose tests: $(if ($exitCode3 -eq 0) { '✅ Passed' } else { '❌ Failed' })" -ForegroundColor $(if ($exitCode3 -eq 0) { "Green" } else { "Red" })
        
        $exitCode = $overallExitCode
    }
    default { 
        $exitCode = Start-TestRun -TestType "default"
    }
}

# Return to root directory
Set-Location ..

# Final status
Write-Host ""
Write-Host "🎉 ==============================================" -ForegroundColor Green
Write-Host "🎉 Frontend Unit Tests Complete!" -ForegroundColor Green
Write-Host "🎉 ==============================================" -ForegroundColor Green
Write-Host ""

if ($choice -eq "3") {
    Write-Host "🔄 Tests are running in watch mode..." -ForegroundColor Yellow
    Write-Host "   Press Ctrl+C to stop watching" -ForegroundColor White
} else {
    if ($exitCode -eq 0) {
        Write-Success "✅ All tests passed successfully!"
    } else {
        Write-Warning "⚠️  Some tests failed. Check the output above for details."
    }
    
    Write-Host ""
    Write-Host "📚 Next Steps:" -ForegroundColor Yellow
    Write-Host "   - Review test coverage report (if generated)" -ForegroundColor White
    Write-Host "   - Fix any failing tests" -ForegroundColor White
    Write-Host "   - Add new tests for untested components" -ForegroundColor White
    Write-Host "   - Run 'npm test' in frontend directory for interactive mode" -ForegroundColor White
}

Write-Host ""
Write-Success "🧪 Frontend unit testing complete!" 