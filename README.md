# RevEd Kids - Educational Platform

A full-stack educational application designed for children's learning with gamification and cognitive science principles.

## 🏗️ Architecture

This project consists of:
- **Frontend**: React/TypeScript application with Tailwind CSS
- **Backend**: Fastify/TypeScript API with MySQL database
- **Educational Engine**: Wahoo Engine for gamified learning experiences

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0
- MySQL database
- Redis (optional, for caching)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yous2911/fastrevedkids.git
   cd fastrevedkids
   ```

2. **Install all dependencies**
   ```bash
   npm run install:all
   ```

3. **Set up environment variables**
   ```bash
   # Backend
   cp backend/env.example backend/.env
   # Edit backend/.env with your database credentials
   
   # Frontend
   cp frontend/env.example frontend/.env
   ```

4. **Start the development servers**
   ```bash
   # Start both frontend and backend
   npm start
   
   # Or start them separately
   npm run start:frontend  # Frontend on http://localhost:3000
   npm run start:backend   # Backend on http://localhost:3001
   ```

## 📁 Project Structure

```
fastrevedkids/
├── frontend/          # React frontend application
├── backend/           # Fastify backend API
├── src/              # Shared source files
├── scripts/          # Utility scripts
└── docs/             # Documentation
```

## 🛠️ Available Scripts

### Root Level
- `npm start` - Start both frontend and backend in development mode
- `npm run dev` - Same as start
- `npm run build` - Build both frontend and backend
- `npm run test` - Run tests for both frontend and backend
- `npm run install:all` - Install dependencies for all packages

### Frontend (`cd frontend`)
- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests

### Backend (`cd backend`)
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with initial data

## 🗄️ Database Setup

1. **Create MySQL database**
   ```sql
   CREATE DATABASE reved_kids;
   ```

2. **Run migrations**
   ```bash
   cd backend
   npm run db:migrate
   ```

3. **Seed initial data**
   ```bash
   npm run db:seed
   ```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run frontend tests only
npm run test:frontend

# Run backend tests only
npm run test:backend
```

## 🚀 Production Deployment

### Backend
```bash
cd backend
npm run build
npm start
```

### Frontend
```bash
cd frontend
npm run build
# Serve the build folder with your preferred web server
```

## 📚 Documentation

- [Architecture Guide](./ARCHITECTURE.md)
- [Backend Documentation](./backend/README.md)
- [Frontend Documentation](./frontend/README.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Troubleshooting

### Common Issues

1. **"Missing script: start" error**
   - Make sure you're running `npm start` from the root directory
   - Or run frontend/backend separately using their respective scripts

2. **Database connection issues**
   - Check your `.env` file in the backend directory
   - Ensure MySQL is running and accessible

3. **Port conflicts**
   - Frontend runs on port 3000
   - Backend runs on port 3001
   - Make sure these ports are available

For more detailed troubleshooting, see the [Troubleshooting Guide](./backend/TROUBLESHOOTING.md). 