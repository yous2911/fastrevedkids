# FastRev Kids - Dual Frontend Applications Setup

This repository contains two separate frontend applications that share the same backend API:

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Main Frontend │    │ Diamond Frontend│    │   Backend API   │
│   (Port 3000)   │    │   (Port 3001)   │    │   (Port 3003)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Shared Data   │
                    │   (Database)    │
                    └─────────────────┘
```

## 📱 Applications

### 🌟 Main Frontend (`frontend/`)
- **Port**: 3000
- **Purpose**: Standard educational interface
- **Features**: 
  - Complete educational platform
  - Advanced analytics dashboard
  - Comprehensive exercise system
  - Accessibility features
  - GDPR compliance

### 💎 Diamond Frontend (`frontend-diamond/`)
- **Port**: 3001
- **Purpose**: Premium magical/crystal-themed interface
- **Features**:
  - Unique magical styling and animations
  - Crystal-themed UI components
  - Enhanced audio system
  - Special particle effects
  - Premium user experience

### 🔧 Backend API (`backend/`)
- **Port**: 3003
- **Purpose**: Shared API for both frontends
- **Features**:
  - Fastify-based high-performance API
  - MySQL database with Redis caching
  - JWT authentication
  - File upload system
  - Comprehensive security features

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Docker Desktop
- Git

### Automated Setup (Recommended)
```powershell
# Run the automated setup script
.\scripts\setup-dual-apps.ps1
```

### Manual Setup

1. **Clone and navigate to the repository**
   ```bash
   git clone <repository-url>
   cd fastrevedkids
   ```

2. **Install dependencies for all applications**
   ```bash
   # Backend
   cd backend && npm install && cd ..
   
   # Main frontend
   cd frontend && npm install && cd ..
   
   # Diamond frontend
   cd frontend-diamond && npm install && cd ..
   ```

3. **Set up environment files**
   - Copy `backend/env.backend.example` to `backend/env.backend`
   - Copy `frontend/.env.example` to `frontend/.env`
   - Copy `frontend-diamond/.env.example` to `frontend-diamond/.env`

4. **Start with Docker Compose**
   ```bash
   docker-compose -f docker-compose.dev.yml up -d
   ```

## 🐳 Docker Setup

### Development Environment
```bash
# Start all services
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop services
docker-compose -f docker-compose.dev.yml down
```

### Production Environment
```bash
# Start production services
docker-compose -f docker-compose.prod.yml up -d

# View production logs
docker-compose -f docker-compose.prod.yml logs -f
```

## 🔧 Development Commands

### Backend Development
```bash
cd backend
npm run dev          # Start development server
npm run test         # Run tests
npm run build        # Build for production
```

### Main Frontend Development
```bash
cd frontend
npm start            # Start development server (port 3000)
npm run build        # Build for production
npm run test         # Run tests
```

### Diamond Frontend Development
```bash
cd frontend-diamond
npm run dev          # Start development server (port 3001)
npm run build        # Build for production
npm run test         # Run tests
```

## 🌐 Access URLs

After starting the applications:

- **Main Frontend**: http://localhost:3000
- **Diamond Frontend**: http://localhost:3001
- **Backend API**: http://localhost:3003
- **API Documentation**: http://localhost:3003/documentation
- **Health Check**: http://localhost:3003/health

## 🔐 Environment Configuration

### Backend Environment (`backend/env.backend`)
```env
NODE_ENV=development
PORT=3003
CORS_ORIGIN=http://localhost:3000,http://localhost:3001
JWT_SECRET=your-secret-key
# ... other configuration
```

### Main Frontend Environment (`frontend/.env`)
```env
REACT_APP_API_URL=http://localhost:3003
REACT_APP_ENVIRONMENT=development
REACT_APP_APP_TYPE=main
```

### Diamond Frontend Environment (`frontend-diamond/.env`)
```env
REACT_APP_API_URL=http://localhost:3003
REACT_APP_ENVIRONMENT=development
REACT_APP_APP_TYPE=diamond
```

## 📊 Database Setup

The backend uses MySQL for data persistence and Redis for caching:

```bash
# Initialize database
cd backend
npm run migrate

# Seed with sample data
npm run db:seed

# Reset database
npm run db:reset
```

## 🔒 Security Features

Both frontends share the same security features through the backend:

- JWT-based authentication
- CORS protection
- Rate limiting
- Input sanitization
- XSS protection
- CSRF protection
- File upload security

## 🎨 Styling Differences

### Main Frontend
- Standard educational interface
- Professional design
- Accessibility-focused
- Responsive layout

### Diamond Frontend
- Magical/crystal theme
- Custom animations
- Enhanced audio system
- Premium visual effects
- Unique color scheme

## 📈 Monitoring and Analytics

Both applications share the same backend monitoring:

- Health checks: `/health`
- Metrics: `/metrics`
- API documentation: `/documentation`
- Performance monitoring
- Error tracking

## 🚀 Deployment

### Development Deployment
```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up -d
```

### Production Deployment
```bash
# Set up production environment variables
cp .env.example .env.prod

# Start production environment
docker-compose -f docker-compose.prod.yml up -d
```

## 🔧 Troubleshooting

### Common Issues

1. **Port conflicts**
   - Ensure ports 3000, 3001, and 3003 are available
   - Check for other running services

2. **Database connection issues**
   - Verify MySQL is running
   - Check database credentials in `backend/env.backend`

3. **CORS errors**
   - Ensure CORS_ORIGIN includes both frontend URLs
   - Check browser console for specific errors

4. **Docker issues**
   - Restart Docker Desktop
   - Clear Docker cache: `docker system prune`

### Logs and Debugging
```bash
# View all logs
docker-compose -f docker-compose.dev.yml logs -f

# View specific service logs
docker-compose -f docker-compose.dev.yml logs -f backend-dev
docker-compose -f docker-compose.dev.yml logs -f frontend-main-dev
docker-compose -f docker-compose.dev.yml logs -f frontend-diamond-dev
```

## 📚 Additional Resources

- [Backend API Documentation](backend/docs/api/README.md)
- [Frontend Architecture Guide](frontend/docs/ARCHITECTURE.md)
- [Diamond Frontend Features](frontend-diamond/README.md)
- [Database Schema](backend/scripts/cp2025_enhanced_schema.sql)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test both frontends
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
