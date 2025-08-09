# CP2025 Enhanced API Documentation

## Overview

This document outlines the enhanced API endpoints for the CP2025 educational system, providing comprehensive progress tracking, competence prerequisites management, and advanced analytics capabilities.

## Base URL
```
http://localhost:3000/api
```

## Authentication
Most endpoints require authentication. Include the authorization token in the header:
```
Authorization: Bearer <token>
```

---

## Student Progress Tracking APIs

### 1. Get Student Competence Progress
**Endpoint:** `GET /students/{id}/competence-progress`

**Description:** Retrieve detailed progress tracking for all competences associated with a student.

**Parameters:**
- `id` (path, required): Student ID
- `matiere` (query, optional): Filter by subject (FRANCAIS, MATHEMATIQUES, SCIENCES, etc.)
- `niveau` (query, optional): Filter by level (CP, CE1, CE2, CM1, CM2, CP-CE1)
- `masteryLevel` (query, optional): Filter by mastery level (not_started, discovering, practicing, mastering, mastered)
- `limit` (query, optional): Limit results (default: 100)
- `offset` (query, optional): Offset for pagination (default: 0)

**Response:**
```json
{
  "success": true,
  "data": {
    "competenceProgress": [
      {
        "id": 1,
        "competenceCode": "CP.FR.L1.1",
        "niveau": "CP",
        "matiere": "FRANCAIS",
        "domaine": "L1",
        "masteryLevel": "mastering",
        "progressPercent": 85,
        "totalAttempts": 12,
        "successfulAttempts": 10,
        "averageScore": 83.5,
        "totalTimeSpent": 1200,
        "averageTimePerAttempt": 100,
        "difficultyLevel": 1.2,
        "consecutiveSuccesses": 3,
        "consecutiveFailures": 0,
        "firstAttemptAt": "2024-01-15T10:00:00Z",
        "lastAttemptAt": "2024-01-25T14:30:00Z",
        "masteredAt": null,
        "updatedAt": "2024-01-25T14:30:00Z"
      }
    ],
    "summary": {
      "totalCompetences": 45,
      "masteredCount": 12,
      "inProgressCount": 18,
      "averageScore": 78.5,
      "totalTimeSpent": 15600
    },
    "filters": { "matiere": "FRANCAIS" },
    "pagination": { "limit": 100, "offset": 0, "total": 45 }
  }
}
```

### 2. Record Student Progress
**Endpoint:** `POST /students/{id}/record-progress`

**Description:** Record new progress data for a student on a specific competence.

**Request Body:**
```json
{
  "competenceCode": "CP.FR.L1.1",
  "exerciseResult": {
    "score": 85,
    "timeSpent": 120,
    "completed": true,
    "attempts": 1,
    "exerciseId": 123,
    "difficultyLevel": 1.2
  },
  "sessionData": {
    "sessionId": "uuid-session-id",
    "deviceType": "tablet",
    "focusScore": 88
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "progress": {
      "id": 1,
      "masteryLevel": "mastering",
      "progressPercent": 85,
      "consecutiveSuccesses": 3,
      "averageScore": 83.5
    },
    "newAchievements": [
      {
        "id": 5,
        "title": "Math Streak Master",
        "xpReward": 50
      }
    ],
    "xpEarned": 15,
    "masteryLevelChanged": true
  }
}
```

### 3. Get Student Achievements
**Endpoint:** `GET /students/{id}/achievements`

**Description:** Retrieve all achievements and badges for a student.

**Parameters:**
- `category` (query, optional): Filter by category (academic, engagement, progress, social, special)
- `difficulty` (query, optional): Filter by difficulty (bronze, silver, gold, platinum, diamond)
- `completed` (query, optional): Filter by completion status (true/false)
- `visible` (query, optional): Filter by visibility (default: true)
- `limit` (query, optional): Limit results (default: 50)

**Response:**
```json
{
  "success": true,
  "data": {
    "achievements": [
      {
        "id": 1,
        "achievementCode": "FIRST_COMPETENCE_MASTERY",
        "title": "Premier Maître",
        "description": "Première compétence maîtrisée",
        "category": "academic",
        "difficulty": "bronze",
        "xpReward": 50,
        "badgeIconUrl": "/badges/first-master.png",
        "currentProgress": 1,
        "maxProgress": 1,
        "progressPercentage": 100,
        "isCompleted": true,
        "completedAt": "2024-01-20T15:30:00Z",
        "displayOrder": 1
      }
    ],
    "summary": {
      "totalAchievements": 25,
      "completedCount": 8,
      "totalXpEarned": 450,
      "byCategory": {
        "academic": 12,
        "engagement": 8,
        "progress": 5
      },
      "byDifficulty": {
        "bronze": 5,
        "silver": 2,
        "gold": 1
      }
    }
  }
}
```

---

## Competence Management APIs

### 4. Get Competence Prerequisites
**Endpoint:** `GET /competences/{code}/prerequisites`

**Description:** Retrieve prerequisite relationships for a specific competence.

**Parameters:**
- `code` (path, required): Competence code (e.g., "CP.FR.L1.1")
- `includePrerequisiteDetails` (query, optional): Include detailed info about prerequisites (default: true)
- `studentId` (query, optional): Include student's progress on prerequisites
- `depth` (query, optional): Depth of prerequisite tree (1-5, default: 1)

**Response:**
```json
{
  "success": true,
  "data": {
    "competenceCode": "CP.FR.L1.3",
    "prerequisites": [
      {
        "id": 1,
        "competenceCode": "CP.FR.L1.3",
        "prerequisiteCode": "CP.FR.L1.1",
        "prerequisiteType": "required",
        "masteryThreshold": 75,
        "weight": 2.0,
        "description": "Sons simples requis avant sons complexes",
        "studentProgress": {
          "masteryLevel": "mastered",
          "progressPercent": 95,
          "averageScore": 88.5,
          "isMasteryThresholdMet": true,
          "totalTimeSpent": 1200,
          "lastAttemptAt": "2024-01-25T14:30:00Z"
        },
        "prerequisiteDetails": {
          "code": "CP.FR.L1.1",
          "description": "Reconnaissance des phonèmes",
          "niveau": "CP",
          "matiere": "FRANCAIS",
          "domaine": "L1"
        }
      }
    ],
    "readinessAnalysis": {
      "totalPrerequisites": 2,
      "requiredPrerequisites": 1,
      "recommendedPrerequisites": 1,
      "studentReadiness": {
        "requiredMet": true,
        "recommendedMet": 1,
        "readinessScore": 88,
        "blockers": []
      }
    }
  }
}
```

---

## Analytics APIs

### 5. Get Daily Progress Analytics
**Endpoint:** `GET /analytics/daily-progress`

**Description:** Retrieve detailed daily learning analytics with trends and breakdowns.

**Parameters:**
- `studentId` (query, optional): Filter by specific student
- `dateStart` (query, optional): Start date (YYYY-MM-DD)
- `dateEnd` (query, optional): End date (YYYY-MM-DD, default: today)
- `matiere` (query, optional): Filter by subject
- `groupBy` (query, optional): Grouping level (day, week, month, default: day)
- `limit` (query, optional): Limit results (default: 30)

**Response:**
```json
{
  "success": true,
  "data": {
    "analytics": [
      {
        "date": "2024-01-25",
        "sessionTime": 1200,
        "exercisesAttempted": 8,
        "exercisesCompleted": 6,
        "averageScore": 82.5,
        "xpEarned": 120,
        "competencesMastered": 1,
        "competencesProgressed": 2,
        "streakDays": 5,
        "subjectTimes": {
          "francais": 720,
          "mathematiques": 480,
          "sciences": 0
        }
      }
    ],
    "aggregatedMetrics": {
      "totalDays": 30,
      "totalSessionTime": 25600,
      "totalExercises": 180,
      "averageScore": 78.5,
      "totalXpEarned": 2400,
      "totalCompetencesMastered": 12,
      "maxStreakDays": 8,
      "completionRate": 85.5
    },
    "subjectBreakdown": {
      "francais": { "totalTime": 15360, "percentage": 60 },
      "mathematiques": { "totalTime": 10240, "percentage": 40 }
    },
    "trendAnalysis": {
      "sessionTime": { "direction": "increasing", "change": 12.5 },
      "averageScore": { "direction": "stable", "change": 2.1 },
      "exercisesCompleted": { "direction": "increasing", "change": 8.3 },
      "consistency": {
        "activeDays": 22,
        "totalDays": 30,
        "consistencyRate": 73
      }
    }
  }
}
```

### 6. Get Learning Sessions Analytics
**Endpoint:** `GET /analytics/learning-sessions`

**Description:** Detailed analytics on individual learning sessions.

**Parameters:**
- `studentId` (query, optional): Filter by student
- `dateStart`, `dateEnd` (query, optional): Date range
- `deviceType` (query, optional): Filter by device type
- `minDuration`, `maxDuration` (query, optional): Duration filters (seconds)
- `limit` (query, optional): Limit results (default: 50)

**Response:**
```json
{
  "success": true,
  "data": {
    "sessions": [
      {
        "id": "uuid-session-id",
        "sessionStart": "2024-01-25T10:00:00Z",
        "sessionEnd": "2024-01-25T10:25:00Z",
        "duration": 1500,
        "exercisesAttempted": 4,
        "exercisesCompleted": 3,
        "averageScore": 78.5,
        "xpEarned": 45,
        "focusScore": 85.2,
        "motivationLevel": "high",
        "deviceType": "tablet",
        "competencesWorked": ["CP.FR.L1.1", "CP.MA.N1.1"]
      }
    ],
    "analytics": {
      "totalSessions": 25,
      "averageSessionDuration": 1350,
      "totalLearningTime": 33750,
      "averageFocusScore": 82.1,
      "deviceDistribution": {
        "mobile": 8,
        "tablet": 12,
        "desktop": 5
      },
      "motivationLevels": {
        "low": 2,
        "neutral": 15,
        "high": 8
      }
    }
  }
}
```

---

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message"
  }
}
```

### Common Error Codes:
- `STUDENT_NOT_FOUND`: Student ID does not exist
- `COMPETENCE_NOT_FOUND`: Competence code not found
- `INVALID_PARAMETERS`: Request parameters are invalid
- `INTERNAL_ERROR`: Server-side error
- `UNAUTHORIZED`: Authentication required
- `FORBIDDEN`: Insufficient permissions

---

## Usage Examples

### JavaScript/TypeScript Example:
```typescript
// Get student's French competence progress
const response = await fetch('/api/students/123/competence-progress?matiere=FRANCAIS', {
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
if (data.success) {
  console.log(`Student has mastered ${data.data.summary.masteredCount} competences`);
}

// Record new progress
await fetch('/api/students/123/record-progress', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    competenceCode: 'CP.FR.L1.1',
    exerciseResult: {
      score: 85,
      timeSpent: 120,
      completed: true
    }
  })
});
```

### curl Examples:
```bash
# Get competence prerequisites
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/competences/CP.FR.L1.3/prerequisites?studentId=123"

# Get daily analytics for last 7 days
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/analytics/daily-progress?studentId=123&limit=7"
```

---

## Testing

Use the provided test script to verify all endpoints:
```bash
node test-enhanced-apis.js
```

This will test all endpoints and provide detailed feedback on their status and functionality.