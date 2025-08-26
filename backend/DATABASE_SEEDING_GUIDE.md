# Database Seeding Guide

This guide explains how to seed your MySQL database with test data for the RevEd Kids educational platform.

## Quick Start

### 1. Automatic Setup (Recommended)

Run the complete database setup script:

```bash
npm run db:setup
```

This will:
- Run database migrations
- Seed the database with comprehensive test data
- Display test credentials and API endpoints

### 2. Manual Setup

If you prefer to run steps manually:

```bash
# Step 1: Run migrations
npm run migrate

# Step 2: Seed the database
npm run db:seed:comprehensive
```

## Available Seeding Options

### Comprehensive Seeding (Default)
```bash
npm run db:seed:comprehensive
# or simply
npm run db:seed
```

**Includes:**
- 5 test students with login credentials
- 8 educational modules
- 8 exercises across different subjects and levels
- Student progress records
- Learning paths
- Sessions and audit logs

### Simple Seeding
```bash
npm run db:seed:simple
```

**Includes:**
- 4 basic students (no passwords)
- 3 modules
- 3 exercises

## Test Data Overview

### Students
The comprehensive seed creates 5 test students with the following credentials:

| Email | Password | Level | Mascot |
|-------|----------|-------|--------|
| lucas.martin@test.com | password123 | CE2 | Dragon |
| emma.durand@test.com | password123 | CM1 | Unicorn |
| noah.lefebvre@test.com | password123 | CE1 | Robot |
| alice.dupont@test.com | password123 | CE1 | Cat |
| thomas.moreau@test.com | password123 | CE2 | Dragon |

### Educational Content

#### Modules (8 total)
- **Mathematics CE1**: Les nombres jusqu'à 100, Addition et soustraction
- **French CE2**: Les verbes du premier groupe, La conjugaison au présent
- **Sciences CM1**: Le système solaire, Les animaux et leur habitat
- **Mathematics CE2**: Multiplication et division
- **French CE1**: La lecture et la compréhension

#### Exercises (8 total)
- **Mathematics CE1**: Compter de 10 en 10, Addition simple, Soustraction
- **French CE2**: Conjuguer CHANTER, Les articles définis
- **Sciences CM1**: Les planètes rocheuses
- **Mathematics CE2**: Multiplication par 2, Division simple

### Exercise Types
- **Multiple Choice**: Questions with predefined answer options
- **Fill-in-Blank**: Questions requiring text input

### Difficulty Levels
- **FACILE**: Easy exercises (10 XP)
- **MOYEN**: Medium exercises (15 XP)
- **DIFFICILE**: Difficult exercises (20 XP)

## API Testing

Once seeded, you can test the following API endpoints:

### Authentication
```bash
# Login
POST /api/auth/login
{
  "email": "lucas.martin@test.com",
  "password": "password123"
}
```

### Students
```bash
# Get all students
GET /api/students

# Get student by ID
GET /api/students/1

# Get student progress
GET /api/students/1/progress
```

### Exercises
```bash
# Get all exercises
GET /api/exercises

# Get exercises by subject
GET /api/exercises?matiere=mathematiques

# Get exercises by level
GET /api/exercises?niveau=CE1

# Get exercise by ID
GET /api/exercises/1
```

### Modules
```bash
# Get all modules
GET /api/modules

# Get modules by subject
GET /api/modules?matiere=mathematiques
```

### Progress
```bash
# Submit exercise completion
POST /api/progress
{
  "studentId": 1,
  "exerciseId": 1,
  "score": 85,
  "timeSpent": 120
}
```

## Database Schema

The seeding populates the following tables:

- **students**: User accounts and profiles
- **exercises**: Educational content
- **modules**: Course modules
- **student_progress**: Learning progress tracking
- **student_learning_path**: Personalized learning paths
- **sessions**: User sessions
- **revisions**: Spaced repetition data
- **audit_logs**: Compliance and security logs

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Ensure MySQL is running
   - Check `env.backend` file has correct credentials
   - Verify database `reved_kids` exists

2. **Migration Errors**
   - Run `npm run db:reset` to clear database
   - Check for existing tables that might conflict

3. **Seeding Errors**
   - Ensure all dependencies are installed: `npm install`
   - Check database permissions
   - Verify schema matches current version

### Reset Database

To start fresh:

```bash
# Reset and reseed
npm run db:reset
npm run db:seed:comprehensive
```

### Manual Database Creation

If you need to create the database manually:

```sql
CREATE DATABASE reved_kids CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

## Development Workflow

1. **Initial Setup**
   ```bash
   npm run db:setup
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```

3. **Test API Endpoints**
   - Use the test credentials to login
   - Test various API endpoints
   - Check Swagger documentation at `/documentation`

4. **Reset When Needed**
   ```bash
   npm run db:reset
   npm run db:seed:comprehensive
   ```

## Custom Seeding

To add your own test data, modify the files in `src/db/seeds/`:

- `comprehensive-seed.ts`: Main seeding logic
- `cp2025-exercises.ts`: Additional exercise data

Then run:
```bash
npm run db:seed:comprehensive
```

## Production Notes

⚠️ **Important**: The seeded data is for development and testing only. Never use these credentials in production.

- All passwords are set to `password123`
- Email addresses are test domains
- Data is simplified for testing purposes

For production, ensure:
- Strong, unique passwords
- Real email addresses
- Proper data validation
- Security measures enabled
