# 🗄️ MySQL Database Setup Guide for Both Projects

## 🎯 **Database Status: PRODUCTION-READY**

Both projects are configured to use **MySQL 8.0** in production with comprehensive schemas and data.

---

## 📊 **Database Overview**

### **Current Configuration:**
- ✅ **Development**: SQLite (for easy local development)
- ✅ **Production**: MySQL 8.0 (enterprise-grade)
- ✅ **Schema**: Complete CP2025 educational curriculum
- ✅ **Data**: Pre-populated with exercises and competences
- ✅ **Migrations**: Automated setup scripts

### **Database Features:**
- 🎓 **CP2025 Curriculum**: French educational standards
- 📈 **Progress Tracking**: Student performance analytics
- 🔄 **Adaptive Learning**: Intelligent exercise recommendations
- 🛡️ **Security**: Encrypted connections, user authentication
- 📊 **Analytics**: Comprehensive reporting and metrics

---

## 🚀 **Quick Setup for Both Projects**

### **Option 1: Docker MySQL (Recommended)**

#### **For Main Project:**
```bash
cd fastrevedkids-main

# Start MySQL with Docker
docker run --name mysql-main \
  -e MYSQL_ROOT_PASSWORD=your_secure_password \
  -e MYSQL_DATABASE=reved_kids_main \
  -e MYSQL_USER=reved_user \
  -e MYSQL_PASSWORD=your_user_password \
  -p 3306:3306 \
  -d mysql:8.0

# Update backend/env.backend
DB_HOST=localhost
DB_PORT=3306
DB_USER=reved_user
DB_PASSWORD=your_user_password
DB_NAME=reved_kids_main
```

#### **For Diamond Project:**
```bash
cd fastrevedkids-diamond

# Start MySQL with Docker (different port)
docker run --name mysql-diamond \
  -e MYSQL_ROOT_PASSWORD=your_secure_password \
  -e MYSQL_DATABASE=reved_kids_diamond \
  -e MYSQL_USER=reved_user \
  -e MYSQL_PASSWORD=your_user_password \
  -p 3307:3306 \
  -d mysql:8.0

# Update backend/env.backend
DB_HOST=localhost
DB_PORT=3307
DB_USER=reved_user
DB_PASSWORD=your_user_password
DB_NAME=reved_kids_diamond
```

### **Option 2: Local MySQL Installation**

#### **Windows:**
1. Download MySQL Installer from: https://dev.mysql.com/downloads/installer/
2. Install MySQL 8.0 Server
3. Create databases for both projects

#### **macOS:**
```bash
# Using Homebrew
brew install mysql
brew services start mysql

# Create databases
mysql -u root -p
CREATE DATABASE reved_kids_main;
CREATE DATABASE reved_kids_diamond;
```

#### **Linux (Ubuntu):**
```bash
sudo apt update
sudo apt install mysql-server
sudo mysql_secure_installation

# Create databases
sudo mysql -u root -p
CREATE DATABASE reved_kids_main;
CREATE DATABASE reved_kids_diamond;
```

---

## 🔧 **Database Setup Steps**

### **Step 1: Initialize Database Schema**

#### **For Main Project:**
```bash
cd fastrevedkids-main/backend

# Run the enhanced CP2025 schema
mysql -u reved_user -p reved_kids_main < scripts/cp2025_enhanced_schema.sql

# Populate with initial data
mysql -u reved_user -p reved_kids_main < scripts/populate_cp2025_enhanced_data.sql
```

#### **For Diamond Project:**
```bash
cd fastrevedkids-diamond/backend

# Run the enhanced CP2025 schema
mysql -u reved_user -p reved_kids_diamond < scripts/cp2025_enhanced_schema.sql

# Populate with initial data
mysql -u reved_user -p reved_kids_diamond < scripts/populate_cp2025_enhanced_data.sql
```

### **Step 2: Configure Environment**

#### **Main Project** (`fastrevedkids-main/backend/env.backend`):
```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=reved_user
DB_PASSWORD=your_user_password
DB_NAME=reved_kids_main
DB_CONNECTION_LIMIT=20

# Production settings
NODE_ENV=production
JWT_SECRET=your_secure_jwt_secret_minimum_32_characters
ENCRYPTION_KEY=your_secure_encryption_key_32_chars
```

#### **Diamond Project** (`fastrevedkids-diamond/backend/env.backend`):
```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=3307  # Different port to avoid conflicts
DB_USER=reved_user
DB_PASSWORD=your_user_password
DB_NAME=reved_kids_diamond
DB_CONNECTION_LIMIT=20

# Production settings
NODE_ENV=production
JWT_SECRET=your_secure_jwt_secret_minimum_32_characters
ENCRYPTION_KEY=your_secure_encryption_key_32_chars
```

### **Step 3: Test Database Connection**

#### **For Both Projects:**
```bash
# Test database connection
npm run test:db

# Run database migrations
npm run db:migrate

# Seed initial data
npm run db:seed
```

---

## 📊 **Database Schema Overview**

### **Core Tables (Both Projects):**

#### **Student Management:**
- `students` - Student profiles and information
- `student_competence_progress` - Progress tracking per competence
- `student_learning_path` - Adaptive learning recommendations
- `student_sessions` - Learning session tracking

#### **Curriculum (CP2025):**
- `cp2025_competence_codes` - French educational competences
- `cp2025_exercises` - Educational exercises and content
- `competence_prerequisites` - Learning dependencies
- `modules` - Learning modules and structure

#### **Analytics & Progress:**
- `progress_tracking` - Detailed progress metrics
- `performance_analytics` - Student performance data
- `learning_analytics` - Learning behavior analysis
- `revision_sessions` - Spaced repetition data

#### **System & Security:**
- `users` - User authentication and profiles
- `sessions` - User sessions and security
- `audit_logs` - Security and compliance logging
- `backups` - Database backup tracking

---

## 🛡️ **Production Database Security**

### **Security Features:**
- ✅ **SSL/TLS Encryption** for database connections
- ✅ **Connection Pooling** with optimized limits
- ✅ **User Authentication** with role-based access
- ✅ **Audit Logging** for compliance
- ✅ **Backup Automation** with point-in-time recovery
- ✅ **Rate Limiting** to prevent abuse

### **Production Configuration:**
```bash
# Enable SSL for production
DB_SSL=true
DB_SSL_CA=/path/to/ca-cert.pem
DB_SSL_KEY=/path/to/client-key.pem
DB_SSL_CERT=/path/to/client-cert.pem

# Security settings
SECURE_COOKIES=true
HTTPS_ONLY=true
SAME_SITE=strict
```

---

## 🔄 **Database Migration & Backup**

### **Automated Backups:**
```bash
# Both projects include backup scripts
cd backend/scripts
./backup.sh

# Backup includes:
# - Full database dump
# - Configuration files
# - Uploaded files
# - Log files
```

### **Migration Scripts:**
```bash
# Run migrations
npm run db:migrate

# Check migration status
npm run db:migrate:status

# Rollback if needed
npm run db:migrate:down
```

---

## 📈 **Performance Optimization**

### **Database Indexes:**
- ✅ **Primary Keys** on all tables
- ✅ **Foreign Key Indexes** for relationships
- ✅ **Composite Indexes** for complex queries
- ✅ **Full-text Search** indexes for content

### **Query Optimization:**
- ✅ **Connection Pooling** with optimal limits
- ✅ **Prepared Statements** for security
- ✅ **Query Caching** with Redis
- ✅ **Lazy Loading** for large datasets

---

## 🎯 **Ready for Production**

### **Both Projects Include:**
- ✅ **Complete MySQL Schema** with CP2025 curriculum
- ✅ **Pre-populated Data** with exercises and competences
- ✅ **Production Configuration** with security settings
- ✅ **Backup & Recovery** procedures
- ✅ **Monitoring & Analytics** setup
- ✅ **Migration Scripts** for updates

### **Deployment Options:**
1. **Local Development**: SQLite for easy setup
2. **Staging**: MySQL with test data
3. **Production**: MySQL with full security and monitoring

**Both applications are ready for production deployment with MySQL!** 🚀
