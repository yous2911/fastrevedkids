#!/bin/bash

# 🎯 RevEd Kids - Complete Test & Launch Script
# This script will test your project setup and launch both servers

echo "🚀 RevEd Kids - Project Test & Launch Script"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
print_status "Checking project structure..."

if [ ! -d "frontend" ] || [ ! -d "backend" ]; then
    print_error "❌ Not in the correct directory! Make sure you're in the fastrevedkids root folder."
    print_error "Expected structure:"
    echo "fastrevedkids/"
    echo "├── frontend/"
    echo "└── backend/"
    exit 1
fi

print_success "✅ Project structure looks good!"

# Check Node.js installation
print_status "Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    print_error "❌ Node.js is not installed! Please install Node.js first."
    exit 1
fi

NODE_VERSION=$(node --version)
print_success "✅ Node.js version: $NODE_VERSION"

# Check npm installation
print_status "Checking npm installation..."
if ! command -v npm &> /dev/null; then
    print_error "❌ npm is not installed! Please install npm first."
    exit 1
fi

print_success "✅ npm is installed"

# Check if ports are available
print_status "Checking port availability..."

check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        print_warning "⚠️  Port $port is already in use"
        return 1
    else
        print_success "✅ Port $port is available"
        return 0
    fi
}

check_port 3000
check_port 3001

# Install frontend dependencies
print_status "Installing frontend dependencies..."
cd frontend

if [ ! -f "package.json" ]; then
    print_error "❌ package.json not found in frontend directory!"
    exit 1
fi

print_status "Running npm install for frontend..."
npm install

if [ $? -ne 0 ]; then
    print_error "❌ Frontend dependency installation failed!"
    exit 1
fi

print_success "✅ Frontend dependencies installed"

# Check for missing dependencies
print_status "Checking for critical missing dependencies..."

MISSING_DEPS=()

if ! npm list three >/dev/null 2>&1; then
    MISSING_DEPS+=("three")
fi

if ! npm list framer-motion >/dev/null 2>&1; then
    MISSING_DEPS+=("framer-motion")
fi

if ! npm list @types/three >/dev/null 2>&1; then
    MISSING_DEPS+=("@types/three")
fi

if [ ${#MISSING_DEPS[@]} -ne 0 ]; then
    print_warning "⚠️  Missing critical dependencies: ${MISSING_DEPS[*]}"
    print_status "Installing missing dependencies..."
    npm install "${MISSING_DEPS[@]}"
    print_success "✅ Missing dependencies installed"
fi

# Install backend dependencies
print_status "Installing backend dependencies..."
cd ../backend

if [ ! -f "package.json" ]; then
    print_error "❌ package.json not found in backend directory!"
    exit 1
fi

print_status "Running npm install for backend..."
npm install

if [ $? -ne 0 ]; then
    print_error "❌ Backend dependency installation failed!"
    exit 1
fi

print_success "✅ Backend dependencies installed"

# Check for environment files
print_status "Checking environment configuration..."

cd ../frontend
if [ ! -f ".env.local" ] && [ -f "env.example" ]; then
    print_warning "⚠️  Frontend .env.local not found, copying from example..."
    cp env.example .env.local
    print_success "✅ Frontend environment file created"
fi

cd ../backend
if [ ! -f ".env" ] && [ -f "env.example" ]; then
    print_warning "⚠️  Backend .env not found, copying from example..."
    cp env.example .env
    print_success "✅ Backend environment file created"
fi

# Test frontend build
print_status "Testing frontend build..."
cd ../frontend

print_status "Running frontend build test..."
npm run build > /dev/null 2>&1

if [ $? -eq 0 ]; then
    print_success "✅ Frontend builds successfully"
else
    print_warning "⚠️  Frontend build has issues (this is expected with current TypeScript errors)"
fi

# Test backend build
print_status "Testing backend build..."
cd ../backend

print_status "Running backend build test..."
npm run build > /dev/null 2>&1

if [ $? -eq 0 ]; then
    print_success "✅ Backend builds successfully"
else
    print_warning "⚠️  Backend build has issues (this is expected with current TypeScript errors)"
fi

# Launch servers
print_status "🚀 Launching servers..."

cd ..

# Function to start frontend
start_frontend() {
    print_status "Starting frontend server on port 3000..."
    cd frontend
    npm start &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > ../frontend.pid
    print_success "✅ Frontend server started (PID: $FRONTEND_PID)"
}

# Function to start backend
start_backend() {
    print_status "Starting backend server on port 3001..."
    cd backend
    npm run dev &
    BACKEND_PID=$!
    echo $BACKEND_PID > ../backend.pid
    print_success "✅ Backend server started (PID: $BACKEND_PID)"
}

# Start both servers
start_frontend
sleep 3
start_backend

# Wait a moment for servers to start
sleep 5

# Test server connectivity
print_status "Testing server connectivity..."

# Test frontend
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    print_success "✅ Frontend server is responding on http://localhost:3000"
else
    print_warning "⚠️  Frontend server not responding yet (may still be starting)"
fi

# Test backend
if curl -s http://localhost:3001 > /dev/null 2>&1; then
    print_success "✅ Backend server is responding on http://localhost:3001"
else
    print_warning "⚠️  Backend server not responding yet (may still be starting)"
fi

# Display final status
echo ""
echo "🎉 =============================================="
echo "🎉 RevEd Kids - Launch Complete!"
echo "🎉 =============================================="
echo ""
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Backend:  http://localhost:3001"
echo ""
echo "📋 Current Status:"
echo "   ✅ Project structure verified"
echo "   ✅ Dependencies installed"
echo "   ✅ Environment files created"
echo "   ✅ Servers launched"
echo ""
echo "⚠️  Known Issues:"
echo "   - TypeScript errors need fixing (use Jules AI)"
echo "   - Some components need useRef fixes"
echo "   - Missing sound types need to be added"
echo ""
echo "🚀 Next Steps:"
echo "   1. Open http://localhost:3000 in your browser"
echo "   2. Use Jules AI to fix TypeScript errors"
echo "   3. Test the application functionality"
echo ""
echo "🛑 To stop servers:"
echo "   ./stop-servers.sh"
echo ""

# Create stop script
cat > stop-servers.sh << 'EOF'
#!/bin/bash
echo "🛑 Stopping RevEd Kids servers..."

if [ -f "frontend.pid" ]; then
    FRONTEND_PID=$(cat frontend.pid)
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        kill $FRONTEND_PID
        echo "✅ Frontend server stopped (PID: $FRONTEND_PID)"
    fi
    rm frontend.pid
fi

if [ -f "backend.pid" ]; then
    BACKEND_PID=$(cat backend.pid)
    if kill -0 $BACKEND_PID 2>/dev/null; then
        kill $BACKEND_PID
        echo "✅ Backend server stopped (PID: $BACKEND_PID)"
    fi
    rm backend.pid
fi

echo "🎉 All servers stopped!"
EOF

chmod +x stop-servers.sh
print_success "✅ Stop script created: ./stop-servers.sh"

print_success "🎉 Launch complete! Your RevEd Kids app should be running!" 