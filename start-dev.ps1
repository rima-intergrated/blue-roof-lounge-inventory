# Development startup script
Write-Host "🚀 Starting Blue Roof Restaurant Management System..." -ForegroundColor Cyan

# Check if Node.js is installed
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js is not installed. Please install Node.js first." -ForegroundColor Red
    exit 1
}

# Function to start backend
function Start-Backend {
    Write-Host "📡 Starting Backend Server..." -ForegroundColor Yellow
    Set-Location "backend"
    
    # Check if package.json exists
    if (-not (Test-Path "package.json")) {
        Write-Host "❌ Backend package.json not found!" -ForegroundColor Red
        return $false
    }
    
    # Install dependencies if node_modules doesn't exist
    if (-not (Test-Path "node_modules")) {
        Write-Host "📦 Installing backend dependencies..." -ForegroundColor Blue
        npm install
    }
    
    # Start backend server
    Write-Host "🔧 Starting backend on http://127.0.0.1:5000..." -ForegroundColor Green
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev"
    
    Set-Location ".."
    return $true
}

# Function to start frontend
function Start-Frontend {
    Write-Host "🎨 Starting Frontend Server..." -ForegroundColor Yellow
    
    # Check if package.json exists
    if (-not (Test-Path "package.json")) {
        Write-Host "❌ Frontend package.json not found!" -ForegroundColor Red
        return $false
    }
    
    # Install dependencies if node_modules doesn't exist
    if (-not (Test-Path "node_modules")) {
        Write-Host "📦 Installing frontend dependencies..." -ForegroundColor Blue
        npm install
    }
    
    # Start frontend server
    Write-Host "🌐 Starting frontend on http://localhost:5173..." -ForegroundColor Green
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev"
    
    return $true
}

# Main execution
try {
    # Start backend
    if (Start-Backend) {
        Write-Host "✅ Backend started successfully!" -ForegroundColor Green
        Start-Sleep -Seconds 3
    } else {
        Write-Host "❌ Failed to start backend!" -ForegroundColor Red
        exit 1
    }
    
    # Start frontend
    if (Start-Frontend) {
        Write-Host "✅ Frontend started successfully!" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to start frontend!" -ForegroundColor Red
        exit 1
    }
    
    Write-Host ""
    Write-Host "🎉 Development servers are starting up!" -ForegroundColor Cyan
    Write-Host "📡 Backend API: http://127.0.0.1:5000" -ForegroundColor White
    Write-Host "🌐 Frontend App: http://localhost:5173" -ForegroundColor White
    Write-Host ""
    Write-Host "Press any key to continue..." -ForegroundColor Yellow
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    
} catch {
    Write-Host "❌ An error occurred: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}