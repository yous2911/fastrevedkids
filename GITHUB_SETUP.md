# GitHub Repository Setup Instructions

## 🎯 Overview

You now have **two completely separate projects** that can be deployed independently:

1. **🌟 Main Project**: `fastrevedkids-main/` - Standard educational interface
2. **💎 Diamond Project**: `fastrevedkids-diamond/` - Premium magical/crystal theme

## 🌟 Main Project Repository Setup

### 1. Create GitHub Repository
1. Go to GitHub.com and create a new repository named: `fastrevedkids-main`
2. Make it **public** or **private** (your choice)
3. **DO NOT** initialize with README, .gitignore, or license (we already have these)

### 2. Initialize and Push Main Project
```bash
# Navigate to the main project directory
cd fastrevedkids-main

# Initialize git repository
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Main FastRev Kids application"

# Set main branch
git branch -M main

# Add remote origin (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/fastrevedkids-main.git

# Push to GitHub
git push -u origin main
```

## 💎 Diamond Project Repository Setup

### 1. Create GitHub Repository
1. Go to GitHub.com and create a new repository named: `fastrevedkids-diamond`
2. Make it **public** or **private** (your choice)
3. **DO NOT** initialize with README, .gitignore, or license (we already have these)

### 2. Initialize and Push Diamond Project
```bash
# Navigate to the diamond project directory
cd fastrevedkids-diamond

# Initialize git repository
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Diamond FastRev Kids application"

# Set main branch
git branch -M main

# Add remote origin (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/fastrevedkids-diamond.git

# Push to GitHub
git push -u origin main
```

## 🔧 Development Workflow

### Main Project Development
```bash
# Navigate to main project
cd fastrevedkids-main

# Start with Docker (recommended)
npm run dev

# Or start individually
npm run dev:backend  # Backend only
npm run dev:frontend # Frontend only

# Stop services
npm run stop

# View logs
npm run logs
```

### Diamond Project Development
```bash
# Navigate to diamond project
cd fastrevedkids-diamond

# Start with Docker (recommended)
npm run dev

# Or start individually
npm run dev:backend  # Backend only
npm run dev:frontend # Frontend only

# Stop services
npm run stop

# View logs
npm run logs
```

## 🌐 Access URLs

### Main Project
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3003
- **Redis**: localhost:6379
- **API Documentation**: http://localhost:3003/documentation

### Diamond Project
- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:3003
- **Redis**: localhost:6380
- **API Documentation**: http://localhost:3003/documentation

## 📁 Project Structure

### Main Project (`fastrevedkids-main/`)
```
fastrevedkids-main/
├── backend/          # Fastify API server
│   ├── src/         # Source code
│   ├── package.json # Backend dependencies
│   └── ...
├── frontend/        # React application
│   ├── src/         # Source code
│   ├── package.json # Frontend dependencies
│   └── ...
├── docker-compose.yml # Docker configuration
├── package.json     # Project scripts
└── README.md        # Project documentation
```

### Diamond Project (`fastrevedkids-diamond/`)
```
fastrevedkids-diamond/
├── backend/          # Fastify API server
│   ├── src/         # Source code
│   ├── package.json # Backend dependencies
│   └── ...
├── frontend/        # React application (Diamond theme)
│   ├── src/         # Source code
│   ├── package.json # Frontend dependencies
│   └── ...
├── docker-compose.yml # Docker configuration
├── package.json     # Project scripts
└── README.md        # Project documentation
```

## 🔄 Independent Development

### Key Benefits
- **Separate Repositories**: Each project has its own GitHub repository
- **Independent Deployment**: Deploy each project separately
- **Different Themes**: Main project uses standard interface, Diamond uses magical theme
- **Separate Databases**: Each project can have its own database
- **Different Ports**: No port conflicts between projects

### Development Tips
1. **Work on one project at a time** to avoid confusion
2. **Use different terminals** for each project
3. **Each project has its own dependencies** - install separately
4. **Database changes** in one project won't affect the other
5. **Different Redis instances** prevent cache conflicts

## 🚀 Deployment

### Main Project Deployment
```bash
cd fastrevedkids-main
npm run build  # Build for production
```

### Diamond Project Deployment
```bash
cd fastrevedkids-diamond
npm run build  # Build for production
```

## 📝 Notes

- Each project has its own independent backend and frontend
- Each project can be developed and deployed separately
- Each project has its own database and Redis instance
- Main project uses standard educational interface
- Diamond project uses premium magical/crystal theme
- Both projects share the same backend architecture but are completely independent

## 🆘 Troubleshooting

### Port Conflicts
If you get port conflicts:
- Main project uses ports: 3000, 3003, 6379
- Diamond project uses ports: 3001, 3003, 6380
- Make sure you're not running both projects simultaneously on the same ports

### Database Issues
- Each project has its own database file
- If you need to reset: delete the `*.db` files and restart

### Docker Issues
- Use `npm run clean` to clean up Docker containers
- Use `docker system prune` to free up space
