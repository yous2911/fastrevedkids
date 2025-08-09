# CI/CD Pipeline Documentation

This document describes the complete CI/CD pipeline setup for the FastRevEd Kids educational platform.

## Overview

The CI/CD pipeline includes:
- Automated testing for both frontend and backend
- Security scanning and vulnerability assessment
- Docker containerization
- Multi-environment deployment (staging/production)
- GitHub Actions workflows

## Docker Setup

### Development Environment

```bash
# Start development environment with hot reloading
docker compose -f docker-compose.dev.yml up

# Stop development environment
docker compose -f docker-compose.dev.yml down
```

### Production Environment

```bash
# Start production environment
docker compose up -d

# Stop production environment
docker compose down
```

## Services

### Backend Service
- **Port**: 3003
- **Technology**: Fastify + TypeScript
- **Database**: SQLite with Redis caching
- **Features**: JWT authentication, GDPR compliance, file upload

### Frontend Service
- **Port**: 3000
- **Technology**: React + TypeScript
- **Features**: Educational games, GDPR dashboard, responsive design

### Redis Service
- **Port**: 6379
- **Purpose**: Caching and session storage

### Nginx Service
- **Ports**: 80 (HTTP), 443 (HTTPS)
- **Purpose**: Load balancing and reverse proxy

## GitHub Actions Workflows

### Main CI/CD Pipeline (`.github/workflows/ci-cd.yml`)

**Triggers:**
- Push to `master`, `develop`, or `fix-frontend-and-backend-issues` branches
- Pull requests to `master` or `develop`
- Manual dispatch

**Jobs:**

1. **Backend Testing**
   - Linting with ESLint
   - Type checking with TypeScript
   - Unit and integration tests with Vitest
   - Code coverage reporting

2. **Frontend Testing**
   - Linting with ESLint
   - Type checking with TypeScript
   - Unit tests with Jest/React Testing Library
   - Code coverage reporting

3. **Security Scanning**
   - Trivy vulnerability scanner
   - npm audit for dependency vulnerabilities
   - SARIF upload to GitHub Security tab

4. **Build and Push**
   - Docker image building with multi-stage builds
   - Push to GitHub Container Registry
   - Image tagging with branch/SHA

5. **Integration Tests**
   - Full stack testing with Docker Compose
   - Health checks for all services
   - End-to-end test execution

6. **Deployment**
   - Staging deployment for `develop` branch
   - Production deployment for `master` branch

### Security Scan Workflow (`.github/workflows/security-scan.yml`)

**Triggers:**
- Daily schedule (2 AM UTC)
- Push to `master` branch
- Pull requests to `master`

**Features:**
- Dependency vulnerability scanning
- Container image security analysis
- CodeQL static analysis
- SARIF report generation

## Environment Variables

### Backend Environment Variables
```env
NODE_ENV=production
DATABASE_URL=file:./reved_kids.db
REDIS_URL=redis://redis:6379
JWT_SECRET=your-secret-key
CORS_ORIGIN=https://your-domain.com
```

### Frontend Environment Variables
```env
REACT_APP_API_URL=https://api.your-domain.com
REACT_APP_ENVIRONMENT=production
```

## Security Features

### Container Security
- Multi-stage Docker builds
- Non-root user execution
- Minimal Alpine Linux base images
- Security scanning with Trivy

### Application Security
- CSRF protection
- Rate limiting
- Input sanitization
- Security headers
- GDPR compliance

### Network Security
- Nginx reverse proxy
- SSL/TLS termination
- Rate limiting at proxy level
- Security headers enforcement

## Monitoring and Health Checks

### Health Endpoints
- Backend: `http://localhost:3003/health`
- Frontend: `http://localhost:3000/health`

### Container Health Checks
- Automatic container restart on health check failure
- Graceful shutdown handling
- Resource monitoring

## Local Development

### Prerequisites
- Docker and Docker Compose
- Node.js 18+
- Git

### Quick Start
```bash
# Clone repository
git clone <repository-url>
cd fastrevedkids

# Start development environment
docker compose -f docker-compose.dev.yml up

# Access services
# Frontend: http://localhost:3000
# Backend: http://localhost:3003
# Redis: localhost:6379
```

### Development Commands
```bash
# Backend development
cd backend
npm run dev          # Start with hot reload
npm run test:watch   # Run tests in watch mode
npm run lint         # Run linting
npm run type-check   # Type checking

# Frontend development
cd frontend
npm start            # Start development server
npm test             # Run tests
npm run lint         # Run linting
npm run type-check   # Type checking
```

## Production Deployment

### Manual Deployment
```bash
# Build and deploy
docker compose build
docker compose up -d

# Check service status
docker compose ps
docker compose logs
```

### Automated Deployment
- Triggered by pushes to `master` branch
- Includes security scans and tests
- Zero-downtime deployment with health checks

## Troubleshooting

### Common Issues

1. **Port conflicts**
   ```bash
   # Check port usage
   netstat -an | grep :3000
   
   # Stop conflicting services
   docker compose down
   ```

2. **Build failures**
   ```bash
   # Clean Docker cache
   docker system prune -a
   
   # Rebuild without cache
   docker compose build --no-cache
   ```

3. **Database issues**
   ```bash
   # Reset database
   cd backend
   npm run db:reset
   ```

### Logs and Debugging
```bash
# View all logs
docker compose logs

# View specific service logs
docker compose logs backend
docker compose logs frontend

# Follow logs in real-time
docker compose logs -f
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with proper tests
4. Submit a pull request
5. CI/CD pipeline will validate changes

## License

MIT License - see LICENSE file for details.