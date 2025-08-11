# FastRevEd Kids - Backend Integration Guide

## 🚀 Quick Start

The FastRevEd Kids backend has been successfully implemented with all required endpoints for the CP 2025 educational platform. This guide will help you integrate the backend with both frontend applications.

## 📋 Backend Features Implemented

### ✅ Core API Endpoints
- **Authentication**: `POST /api/auth/login`, `POST /api/auth/logout`
- **Students**: `GET /api/students/:id`, `PUT /api/students/:id`
- **Exercises**: `GET /api/exercises`, `POST /api/exercises/:id/submit`
- **Competences**: `GET /api/competences` (CP 2025 curriculum)
- **Mascots**: `GET /api/mascots/:studentId`, `PUT /api/mascots/:studentId`
- **Wardrobe**: `GET /api/wardrobe/:studentId`, `POST /api/wardrobe/:studentId/unlock/:itemId`
- **Sessions**: `POST /api/sessions/start`, `POST /api/sessions/:id/end`

### ✅ Advanced Features
- **SuperMemo Spaced Repetition Algorithm** - Optimized for young learners (6-11 years)
- **Real-time Progress Tracking** - Track competence mastery and learning progress
- **Mascot AI System** - Emotional responses based on student performance
- **Wardrobe Unlock System** - Achievement-based rewards
- **MySQL Database** - Complete CP 2025 schema with sample data

## 🛠 Setup Instructions

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Setup environment (copy and configure)
cp env.example .env

# Configure your .env file with:
# - Database credentials (MySQL)
# - JWT secrets
# - CORS origins for your frontends

# Run database migration with sample data
npm run migrate

# Start development server
npm run dev:full
```

### 2. Test the Backend

```bash
# Test all endpoints
npm run test:setup
```

### 3. Frontend Integration

The backend provides RESTful APIs that both frontends can consume:

#### Frontend (Port 3000) - For 9-12 year olds
#### Frontend-Diamond (Port 3001) - For 6-8 year olds

## 🔗 API Integration Examples

### Authentication Flow

```javascript
// 1. Login Student
const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include', // Important for cookies
  body: JSON.stringify({
    prenom: 'Emma',
    nom: 'Martin', 
    password: 'password123'
  })
});

const loginData = await loginResponse.json();
if (loginData.success) {
  // Student is now authenticated via HTTP-only cookies
  const student = loginData.data.student;
}
```

### Getting Student Progress

```javascript
// Get student's competence progress
const progressResponse = await fetch(`http://localhost:5000/api/students/${studentId}/competence-progress`, {
  credentials: 'include'
});
const progressData = await progressResponse.json();
```

### Submitting Exercise Results

```javascript
// Submit exercise with SuperMemo integration
const exerciseResult = {
  competenceCode: 'CP.MA.N1.1',
  exerciseResult: {
    score: 85,
    timeSpent: 45,
    completed: true,
    exerciseId: 123
  }
};

const submitResponse = await fetch(`http://localhost:5000/api/students/${studentId}/record-progress`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify(exerciseResult)
});
```

### Mascot Integration

```javascript
// Update mascot emotion based on performance
const mascotResponse = await fetch(`http://localhost:5000/api/mascots/${studentId}/emotion`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    performance: 'excellent', // 'excellent', 'good', 'average', 'poor'
    context: 'exercise_complete'
  })
});

// Get mascot dialogue
const dialogueResponse = await fetch(`http://localhost:5000/api/mascots/${studentId}/dialogue?context=encouragement`, {
  credentials: 'include'
});
const dialogue = await dialogueResponse.json();
```

### Session Management

```javascript
// Start learning session
const sessionResponse = await fetch('http://localhost:5000/api/sessions/start', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    competencesPlanned: ['CP.MA.N1.1', 'CP.FR.L1.1']
  })
});

// End session
const endSessionResponse = await fetch(`http://localhost:5000/api/sessions/${sessionId}/end`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    summary: {
      exercisesCompleted: 5,
      totalXpGained: 75,
      averageScore: 85
    }
  })
});
```

## 📊 Available Test Accounts

The backend includes sample student accounts for testing:

| Username | Password | Name | Level | Age Group |
|----------|----------|------|-------|-----------|
| emma.cp1 | password123 | Emma Martin | CP | 6-8 |
| lucas.cp1 | password123 | Lucas Dubois | CP | 6-8 |
| lea.cp1 | password123 | Léa Bernard | CP | 6-8 |
| noah.ce1 | password123 | Noah Garcia | CE1 | 9-11 |
| alice.ce1 | password123 | Alice Rodriguez | CE1 | 9-11 |

## 🎯 Key Integration Points

### 1. Replace Mock Data
Update your frontend components to use real API calls instead of mock data:

```javascript
// Before (mock data)
const exercises = mockExerciseData;

// After (real API)
const exercisesResponse = await fetch(`http://localhost:5000/api/exercises/by-level/CP?limit=10`);
const exercises = await exercisesResponse.json();
```

### 2. Connect XP System
Link your frontend XP displays to real progress tracking:

```javascript
// Get real student stats
const statsResponse = await fetch(`http://localhost:5000/api/students/${studentId}/stats`, {
  credentials: 'include'
});
const stats = await statsResponse.json();
// Use stats.data.totalXp, stats.data.currentStreak, etc.
```

### 3. Implement SuperMemo
The backend automatically handles spaced repetition. Your frontend just needs to:
- Submit exercise results with `score`, `timeSpent`, and `completed`
- Display recommended exercises from `/api/exercises/recommendations/:studentId`

### 4. Connect Mascot System
The mascot system responds to student performance automatically:

```javascript
// After each exercise, update mascot emotion
await fetch(`http://localhost:5000/api/mascots/${studentId}/emotion`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    performance: score >= 80 ? 'excellent' : score >= 60 ? 'good' : 'poor',
    context: 'exercise_complete'
  })
});

// Get contextual dialogue for mascot
const dialogueResponse = await fetch(`http://localhost:5000/api/mascots/${studentId}/dialogue?context=encouragement`);
const dialogue = await dialogueResponse.json();
// Display dialogue.data.dialogue in your mascot component
```

## 🔐 Authentication Notes

- The backend uses HTTP-only cookies for security
- Include `credentials: 'include'` in all fetch requests
- Check authentication status with `GET /api/auth/me`
- The backend handles session management automatically

## 🧪 Testing Strategy

1. **Unit Tests**: Test individual API endpoints
2. **Integration Tests**: Test complete user flows
3. **Performance Tests**: Verify SuperMemo algorithm efficiency
4. **Frontend Integration**: Test real-time features

```bash
# Test backend endpoints
npm run test:setup

# Test specific functionality
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"prenom":"Emma","nom":"Martin","password":"password123"}'
```

## 🚀 Production Deployment

When ready for production:

1. Update environment variables in `.env`
2. Set up production MySQL database
3. Configure proper CORS origins
4. Enable HTTPS
5. Set strong JWT secrets

## 📱 Frontend Updates Needed

### For Frontend (Port 3000) - Ages 9-12:
- Replace mock authentication with real API calls
- Connect exercise submission to `/api/students/:id/record-progress`
- Integrate progress tracking and achievements
- Connect to real competence data

### For Frontend-Diamond (Port 3001) - Ages 6-8:
- Connect 3D mascot system to real mascot API
- Integrate wardrobe unlocks with achievement system
- Connect particle engine celebrations to real XP gains
- Use real exercise data for the exercise engine

## 🔗 Next Steps

1. **Start the Backend**: `npm run dev:full` in the backend directory
2. **Test Endpoints**: `npm run test:setup` to verify everything works
3. **Update Frontend Auth**: Replace mock login with real authentication
4. **Connect Exercise System**: Link exercise submissions to progress tracking
5. **Integrate Mascot System**: Connect mascot emotions to student performance
6. **Test Complete Flow**: Verify login → exercises → progress → mascot updates

The backend is now fully functional and ready for frontend integration! 🎉

## 💡 Tips for Success

- Always use `credentials: 'include'` for authenticated requests
- Handle errors gracefully (show user-friendly messages)
- Implement loading states for API calls
- Use the test accounts for development
- Monitor the console logs for debugging information
- The SuperMemo algorithm learns from user behavior over time

---

**Happy coding! The FastRevEd Kids educational platform is ready to help young students learn and grow! 🌟**