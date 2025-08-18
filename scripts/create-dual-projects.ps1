# Script to create two separate projects with their own backends and frontends
# This will create two independent applications that can be deployed separately

Write-Host "🚀 Creating Two Separate FastRev Kids Projects..." -ForegroundColor Green
Write-Host ""

# Define project directories
$mainProjectDir = "fastrevedkids-main"
$diamondProjectDir = "fastrevedkids-diamond"

Write-Host "📋 Project Structure:" -ForegroundColor Yellow
Write-Host "   🌟 Main Project: $mainProjectDir" -ForegroundColor White
Write-Host "   💎 Diamond Project: $diamondProjectDir" -ForegroundColor White
Write-Host ""

# Check if directories already exist
if (Test-Path $mainProjectDir) {
    Write-Host "❌ $mainProjectDir already exists. Please remove it first." -ForegroundColor Red
    exit 1
}

if (Test-Path $diamondProjectDir) {
    Write-Host "❌ $diamondProjectDir already exists. Please remove it first." -ForegroundColor Red
    exit 1
}

# Create main project
Write-Host "🌟 Creating Main Project..." -ForegroundColor Cyan
New-Item -ItemType Directory -Path $mainProjectDir
Set-Location $mainProjectDir

# Copy backend for main project
Write-Host "📦 Copying backend for main project..." -ForegroundColor Yellow
Copy-Item -Path "../backend" -Destination "backend" -Recurse

# Copy main frontend
Write-Host "📦 Copying main frontend..." -ForegroundColor Yellow
Copy-Item -Path "../frontend" -Destination "frontend" -Recurse

# Create main project README
@"
# FastRev Kids - Main Application

This is the main educational platform application.

## 🏗️ Architecture

- **Backend**: Fastify-based API (Port 3003)
- **Frontend**: React application (Port 3000)
- **Database**: MySQL with Redis caching

## 🚀 Quick Start

\`\`\`bash
# Install dependencies
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# Start development
cd backend && npm run dev
cd frontend && npm start
\`\`\`

## 🌐 Access URLs

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3003
- **API Documentation**: http://localhost:3003/documentation

## 📁 Project Structure

\`\`\`
$mainProjectDir/
├── backend/          # Fastify API server
├── frontend/         # React application
├── docker-compose.yml
└── README.md
\`\`\`

## 🔧 Development

- Backend runs on port 3003
- Frontend runs on port 3000
- Shared database and authentication
- Professional educational interface

## 📄 License

MIT License
"@ | Out-File -FilePath "README.md" -Encoding UTF8

# Create main project docker-compose
@"
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.dev
      target: development
    ports:
      - "3003:3003"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=file:./reved_kids.db
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=dev-secret-change-in-production
      - CORS_ORIGIN=http://localhost:3000
    volumes:
      - ./backend:/app
      - /app/node_modules
    depends_on:
      - redis
    restart: unless-stopped
    command: npm run dev

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
      target: development
    ports:
      - "3000:3000"
    environment:
      - REACT_APP_API_URL=http://localhost:3003
      - REACT_APP_ENVIRONMENT=development
      - REACT_APP_APP_TYPE=main
    volumes:
      - ./frontend:/app
      - /app/node_modules
    depends_on:
      - backend
    restart: unless-stopped
    stdin_open: true
    tty: true

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    restart: unless-stopped
    command: redis-server --appendonly yes

volumes:
  redis-data:
"@ | Out-File -FilePath "docker-compose.yml" -Encoding UTF8

# Create main project package.json
@"
{
  "name": "fastrevedkids-main",
  "version": "1.0.0",
  "description": "FastRev Kids Main Educational Platform",
  "scripts": {
    "dev": "docker-compose up -d",
    "dev:backend": "cd backend && npm run dev",
    "dev:frontend": "cd frontend && npm start",
    "build": "docker-compose -f docker-compose.prod.yml up -d --build",
    "stop": "docker-compose down",
    "logs": "docker-compose logs -f",
    "clean": "docker-compose down -v && docker system prune -f"
  },
  "keywords": ["education", "react", "fastify", "typescript"],
  "author": "FastRev Kids Team",
  "license": "MIT"
}
"@ | Out-File -FilePath "package.json" -Encoding UTF8

# Create .gitignore for main project
@"
# Dependencies
node_modules/
*/node_modules/

# Environment files
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
backend/env.backend

# Build outputs
build/
dist/
*/build/
*/dist/

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
logs/
*.log

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/
*.lcov

# nyc test coverage
.nyc_output

# Dependency directories
jspm_packages/

# Optional npm cache directory
.npm

# Optional eslint cache
.eslintcache

# Microbundle cache
.rpt2_cache/
.rts2_cache_cjs/
.rts2_cache_es/
.rts2_cache_umd/

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variables file
.env.test

# parcel-bundler cache (https://parceljs.org/)
.cache
.parcel-cache

# Next.js build output
.next

# Nuxt.js build / generate output
.nuxt
dist

# Gatsby files
.cache/
public

# Storybook build outputs
.out
.storybook-out

# Temporary folders
tmp/
temp/

# Editor directories and files
.vscode/
.idea/
*.swp
*.swo
*~

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Database files
*.db
*.sqlite
*.sqlite3

# Upload files
uploads/
"@ | Out-File -FilePath ".gitignore" -Encoding UTF8

Set-Location ..

# Create diamond project
Write-Host "💎 Creating Diamond Project..." -ForegroundColor Cyan
New-Item -ItemType Directory -Path $diamondProjectDir
Set-Location $diamondProjectDir

# Copy backend for diamond project
Write-Host "📦 Copying backend for diamond project..." -ForegroundColor Yellow
Copy-Item -Path "../backend" -Destination "backend" -Recurse

# Copy diamond frontend
Write-Host "📦 Copying diamond frontend..." -ForegroundColor Yellow
Copy-Item -Path "../frontend-diamond" -Destination "frontend" -Recurse

# Create diamond project README
@"
# FastRev Kids - Diamond Application

This is the premium magical/crystal-themed educational platform application.

## 🏗️ Architecture

- **Backend**: Fastify-based API (Port 3003)
- **Frontend**: React application with magical theme (Port 3001)
- **Database**: MySQL with Redis caching

## 🚀 Quick Start

\`\`\`bash
# Install dependencies
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# Start development
cd backend && npm run dev
cd frontend && npm run dev
\`\`\`

## 🌐 Access URLs

- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:3003
- **API Documentation**: http://localhost:3003/documentation

## 📁 Project Structure

\`\`\`
$diamondProjectDir/
├── backend/          # Fastify API server
├── frontend/         # React application (Diamond theme)
├── docker-compose.yml
└── README.md
\`\`\`

## 🔧 Development

- Backend runs on port 3003
- Frontend runs on port 3001
- Shared database and authentication
- Premium magical/crystal-themed interface

## ✨ Features

- Magical/crystal theme
- Enhanced audio system
- Custom animations and particle effects
- Premium user experience

## 📄 License

MIT License
"@ | Out-File -FilePath "README.md" -Encoding UTF8

# Create diamond project docker-compose
@"
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.dev
      target: development
    ports:
      - "3003:3003"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=file:./reved_kids.db
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=dev-secret-change-in-production
      - CORS_ORIGIN=http://localhost:3001
    volumes:
      - ./backend:/app
      - /app/node_modules
    depends_on:
      - redis
    restart: unless-stopped
    command: npm run dev

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
      target: development
    ports:
      - "3001:3001"
    environment:
      - REACT_APP_API_URL=http://localhost:3003
      - REACT_APP_ENVIRONMENT=development
      - REACT_APP_APP_TYPE=diamond
    volumes:
      - ./frontend:/app
      - /app/node_modules
    depends_on:
      - backend
    restart: unless-stopped
    stdin_open: true
    tty: true

  redis:
    image: redis:7-alpine
    ports:
      - "6380:6379"
    volumes:
      - redis-data:/data
    restart: unless-stopped
    command: redis-server --appendonly yes

volumes:
  redis-data:
"@ | Out-File -FilePath "docker-compose.yml" -Encoding UTF8

# Create diamond project package.json
@"
{
  "name": "fastrevedkids-diamond",
  "version": "1.0.0",
  "description": "FastRev Kids Diamond Premium Educational Platform",
  "scripts": {
    "dev": "docker-compose up -d",
    "dev:backend": "cd backend && npm run dev",
    "dev:frontend": "cd frontend && npm run dev",
    "build": "docker-compose -f docker-compose.prod.yml up -d --build",
    "stop": "docker-compose down",
    "logs": "docker-compose logs -f",
    "clean": "docker-compose down -v && docker system prune -f"
  },
  "keywords": ["education", "react", "fastify", "typescript", "premium", "magical"],
  "author": "FastRev Kids Team",
  "license": "MIT"
}
"@ | Out-File -FilePath "package.json" -Encoding UTF8

# Create .gitignore for diamond project
@"
# Dependencies
node_modules/
*/node_modules/

# Environment files
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
backend/env.backend

# Build outputs
build/
dist/
*/build/
*/dist/

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
logs/
*.log

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/
*.lcov

# nyc test coverage
.nyc_output

# Dependency directories
jspm_packages/

# Optional npm cache directory
.npm

# Optional eslint cache
.eslintcache

# Microbundle cache
.rpt2_cache/
.rts2_cache_cjs/
.rts2_cache_es/
.rts2_cache_umd/

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variables file
.env.test

# parcel-bundler cache (https://parceljs.org/)
.cache
.parcel-cache

# Next.js build output
.next

# Nuxt.js build / generate output
.nuxt
dist

# Gatsby files
.cache/
public

# Storybook build outputs
.out
.storybook-out

# Temporary folders
tmp/
temp/

# Editor directories and files
.vscode/
.idea/
*.swp
*.swo
*~

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Database files
*.db
*.sqlite
*.sqlite3

# Upload files
uploads/
"@ | Out-File -FilePath ".gitignore" -Encoding UTF8

Set-Location ..

# Create GitHub setup script
Write-Host "📋 Creating GitHub setup instructions..." -ForegroundColor Yellow
@"
# GitHub Repository Setup Instructions

## 🌟 Main Project Repository

1. Create a new GitHub repository named: \`fastrevedkids-main\`
2. Navigate to the main project directory:
   \`\`\`bash
   cd $mainProjectDir
   \`\`\`
3. Initialize git and push to GitHub:
   \`\`\`bash
   git init
   git add .
   git commit -m "Initial commit: Main FastRev Kids application"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/fastrevedkids-main.git
   git push -u origin main
   \`\`\`

## 💎 Diamond Project Repository

1. Create a new GitHub repository named: \`fastrevedkids-diamond\`
2. Navigate to the diamond project directory:
   \`\`\`bash
   cd $diamondProjectDir
   \`\`\`
3. Initialize git and push to GitHub:
   \`\`\`bash
   git init
   git add .
   git commit -m "Initial commit: Diamond FastRev Kids application"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/fastrevedkids-diamond.git
   git push -u origin main
   \`\`\`

## 🔧 Development Workflow

### Main Project
\`\`\`bash
cd $mainProjectDir
npm run dev          # Start with Docker
npm run dev:backend  # Start backend only
npm run dev:frontend # Start frontend only
\`\`\`

### Diamond Project
\`\`\`bash
cd $diamondProjectDir
npm run dev          # Start with Docker
npm run dev:backend  # Start backend only
npm run dev:frontend # Start frontend only
\`\`\`

## 🌐 Access URLs

### Main Project
- Frontend: http://localhost:3000
- Backend: http://localhost:3003
- Redis: localhost:6379

### Diamond Project
- Frontend: http://localhost:3001
- Backend: http://localhost:3003
- Redis: localhost:6380

## 📝 Notes

- Each project has its own independent backend and frontend
- Each project can be developed and deployed separately
- Each project has its own database and Redis instance
- Main project uses standard educational interface
- Diamond project uses premium magical/crystal theme
"@ | Out-File -FilePath "GITHUB_SETUP.md" -Encoding UTF8

Write-Host ""
Write-Host "🎉 Two separate projects created successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📁 Project Structure:" -ForegroundColor Cyan
Write-Host "   🌟 Main Project: $mainProjectDir/" -ForegroundColor White
Write-Host "   💎 Diamond Project: $diamondProjectDir/" -ForegroundColor White
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Follow the instructions in GITHUB_SETUP.md" -ForegroundColor White
Write-Host "   2. Create two separate GitHub repositories" -ForegroundColor White
Write-Host "   3. Push each project to its own repository" -ForegroundColor White
Write-Host ""
Write-Host "🔧 Development:" -ForegroundColor Cyan
Write-Host "   • Main Project: cd $mainProjectDir && npm run dev" -ForegroundColor White
Write-Host "   • Diamond Project: cd $diamondProjectDir && npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "🌐 Access URLs:" -ForegroundColor Cyan
Write-Host "   • Main Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "   • Diamond Frontend: http://localhost:3001" -ForegroundColor White
Write-Host "   • Main Backend: http://localhost:3003" -ForegroundColor White
Write-Host "   • Diamond Backend: http://localhost:3003 (different project)" -ForegroundColor White
