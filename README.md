# RevEd Kids - Fastify Backend

A high-performance educational platform backend built with Fastify, TypeScript, Drizzle ORM, and modern best practices.

## 🚀 Features

- **Fastify Framework** - High-performance Node.js web framework
- **TypeScript** - Full type safety and modern JavaScript features
- **Drizzle ORM** - Type-safe database operations with MySQL
- **Redis Caching** - Intelligent caching with memory fallback
- **JWT Authentication** - Secure token-based authentication
- **WebSocket Support** - Real-time features and notifications
- **Spaced Repetition** - Advanced learning algorithm implementation
- **API Documentation** - Swagger/OpenAPI integration
- **Performance Monitoring** - Built-in metrics and health checks
- **Rate Limiting** - Protection against abuse
- **Input Validation** - Zod schema validation
- **File Upload** - Secure file handling
- **Docker Support** - Containerized deployment
- **Testing Suite** - Comprehensive test coverage with Vitest

## 📋 Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- MySQL >= 8.0
- Redis >= 6.0 (optional, falls back to memory cache)

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd reved-kids-fastify-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Database setup**
   ```bash
   # Create MySQL database
   mysql -u root -p
   CREATE DATABASE reved_kids;
   
   # Generate and run migrations
   npm run db:generate
   npm run db:migrate
   
   # Seed with sample data (optional)
   npm run db:seed
   ```

5. **Build the project**
   ```bash
   npm run build
   ```

## 🚀 Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm run build
npm start
```

### Using Docker
```bash
# Build and run with Docker Compose
docker-compose up -d

# Or build manually
docker build -t reved-kids-fastify .
docker run -p 3000:3000 reved-kids-fastify
```

## 📊 API Endpoints

### Authentication
- `POST /api/auth/login` - Student login
- `POST /api/auth/logout` - Logout
- `POST /api/auth/refresh` - Refresh JWT token
- `GET /api/auth/verify/:studentId` - Verify student
- `GET /api/auth/health` - Auth service health

### Students
- `GET /api/students/:id` - Get student info
- `GET /api/students/:id/recommendations` - Get exercise recommendations
- `POST /api/students/:id/attempts` - Submit exercise attempt
- `GET /api/students/:id/progress` - Get student progress
- `GET /api/students/:id/sessions` - Get sessions and analytics
- `POST /api/students` - Create student
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student

### Subjects & Exercises
- `GET /api/subjects` - List all subjects
- `GET /api/subjects/:id/chapters` - Get chapters by subject
- `GET /api/subjects/:id/exercises` - Get exercises by subject

### Spaced Repetition
- `GET /api/revisions/student/:id` - Get due revisions
- `POST /api/revisions/record-success` - Record successful revision
- `POST /api/revisions/record-failure` - Record failed revision
- `PUT /api/revisions/:id/postpone` - Postpone revision
- `DELETE /api/revisions/:id/cancel` - Cancel revision

### System Monitoring
- `GET /api/health` - System health check
- `GET /api/monitoring/health` - Detailed health status
- `GET /api/monitoring/metrics` - Performance metrics
- `GET /api/monitoring/system` - System metrics
- `GET /api/monitoring/cache` - Cache statistics
- `DELETE /api/monitoring/cache` - Clear cache

### Documentation
- `GET /docs` - Interactive API documentation (Swagger UI)

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage

# Run performance tests only
npm run test:performance
```

## 🔧 Configuration

Key environment variables:

```env
# Server
NODE_ENV=development
PORT=3000
HOST=0.0.0.0

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=reved_kids

# Redis (optional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_ENABLED=true

# Security
JWT_SECRET=your-super-secret-jwt-key-32-chars-min
ENCRYPTION_KEY=your-encryption-key-32-chars-min

# Performance
RATE_LIMIT_MAX=100
CACHE_TTL=900
```

## 📈 Performance Features

- **2-3x faster** than Express.js
- **Built-in caching** with Redis/Memory fallback
- **Connection pooling** for database optimization
- **Request compression** and optimization
- **Rate limiting** per IP and user
- **Performance monitoring** with real-time metrics
- **Memory leak protection** with automatic cleanup
- **Graceful shutdown** handling

## 🏗️ Architecture

```
src/
├── config/          # Configuration and environment
├── db/              # Database schema and connection
├── plugins/         # Fastify plugins
├── routes/          # API route handlers
├── services/        # Business logic services
├── schemas/         # Request/response validation
├── utils/           # Utility functions
└── tests/           # Test suites
```

## 🔒 Security Features

- **JWT Authentication** with secure token handling
- **Rate limiting** to prevent abuse
- **Input validation** with Zod schemas
- **SQL injection** prevention with Drizzle ORM
- **XSS protection** with Helmet security headers
- **CORS configuration** for cross-origin requests
- **Request size limits** to prevent DoS attacks
- **Security headers** automatically applied

## 🔍 Monitoring & Observability

- **Health checks** for all services
- **Performance metrics** collection
- **Error tracking** and logging
- **Cache hit/miss** statistics
- **Database connection** monitoring
- **Memory usage** tracking
- **Response time** analysis

## 🚀 Deployment

### Production Checklist

1. **Environment variables** properly configured
2. **Database migrations** applied
3. **SSL certificates** configured
4. **Redis instance** running (optional)
5. **Process manager** (PM2 recommended)
6. **Reverse proxy** (Nginx recommended)
7. **Monitoring** setup
8. **Backup strategy** implemented

### Docker Deployment

```bash
# Production deployment
docker-compose -f docker-compose.prod.yml up -d

# Scale services
docker-compose up -d --scale app=3
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check `/docs` endpoint for API documentation
- **Health Check**: Use `/api/health` for system status
- **Logs**: Check application logs for detailed error information
- **Issues**: Report bugs and request features via GitHub issues

## 🔄 Migration from Express

This Fastify backend is a complete rewrite of the original Express.js version, offering:

- **3x better performance**
- **Better TypeScript integration**
- **Modern development experience**
- **Enhanced security features**
- **Improved scalability**
- **Better error handling**

All existing API endpoints are maintained for compatibility. 