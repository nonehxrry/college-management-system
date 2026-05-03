# 🎓 College Management System - Installation & Setup Guide

## 📋 Table of Contents
1. [System Requirements](#system-requirements)
2. [Initial Setup](#initial-setup)
3. [Database Configuration](#database-configuration)
4. [Backend Setup](#backend-setup)
5. [Frontend Setup](#frontend-setup)
6. [Verification & Testing](#verification--testing)
7. [Troubleshooting](#troubleshooting)

---

## 🖥️ System Requirements

### Minimum Requirements
- **OS**: Windows 10+, macOS 10.14+, Ubuntu 18.04+
- **Node.js**: v14.0.0 or higher
- **npm**: v6.0.0 or higher
- **MongoDB**: v4.2 or higher
- **RAM**: 2GB minimum, 4GB recommended
- **Disk Space**: 500MB

### Recommended Setup
- **Node.js**: v18.0.0 or higher
- **npm**: v8.0.0 or higher
- **MongoDB**: v5.0 or higher (Atlas)
- **RAM**: 8GB
- **Disk Space**: 2GB

### Required Third-Party Services
1. **MongoDB Atlas** (Cloud Database)
   - Visit: https://www.mongodb.com/cloud/atlas
   - Create free account
   - Build cluster

2. **Cloudinary** (File Storage)
   - Visit: https://cloudinary.com
   - Sign up (free tier available)
   - Get API credentials

3. **Gmail Account** (Email Service)
   - Enable 2FA
   - Generate app password

---

## 🚀 Initial Setup

### Step 1: Check Node.js Installation
```bash
# Check Node.js version
node --version
# Should output v14.0.0 or higher

# Check npm version
npm --version
# Should output v6.0.0 or higher
```

### Step 2: Clone Repository
```bash
# Clone the repository
git clone <repository-url>
cd college-management-system

# Verify structure
ls -la
# Should show: backend, frontend, render.yaml, etc.
```

### Step 3: Install Global Dependencies
```bash
# Install PM2 for process management (optional)
npm install -g pm2

# Install nodemon for development (optional)
npm install -g nodemon
```

---

## 📦 Database Configuration

### MongoDB Atlas Setup (Recommended for Production)

#### 1. Create Atlas Account
- Go to https://www.mongodb.com/cloud/atlas
- Sign up with email
- Verify email address

#### 2. Create Cluster
```
1. Click "Create" button
2. Select "Shared" (free tier)
3. Choose provider (AWS/Google Cloud/Azure)
4. Select nearest region
5. Click "Create Cluster"
```

#### 3. Configure Network Access
```
1. Go to "Network Access"
2. Click "Add IP Address"
3. Select "Allow access from anywhere" (0.0.0.0/0)
   OR
   Add your static IP
4. Click "Confirm"
```

#### 4. Create Database User
```
1. Go to "Database Access"
2. Click "Add New Database User"
3. Create username and password
4. Set roles to "Read and write to any database"
5. Click "Create User"
```

#### 5. Get Connection String
```
1. Go to Clusters
2. Click "Connect" button
3. Choose "Connect your application"
4. Copy connection string
5. Replace <username> and <password> with credentials
```

Connection String Example:
```
mongodb+srv://username:password@cluster0.mongodb.net/college-mgmt?retryWrites=true&w=majority
```

### Local MongoDB Setup (Development Only)

```bash
# For Windows
# Download from: https://www.mongodb.com/try/download/community

# For macOS
brew tap mongodb/brew
brew install mongodb-community

# For Ubuntu
sudo apt-get install mongodb

# Start MongoDB
mongod

# Connection string
mongodb://localhost:27017/college-mgmt
```

---

## ⚙️ Backend Setup

### Step 1: Navigate to Backend Directory
```bash
cd backend
```

### Step 2: Install Dependencies
```bash
# Install all required packages
npm install

# Verify installation
npm list --depth=0
```

### Step 3: Create Environment File
```bash
# Copy template
cp .env.example .env

# Edit with your credentials
nano .env
# OR
code .env  # Open in VS Code
```

### Step 4: Configure Environment Variables
Edit `.env` file with:

```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/college-mgmt

# JWT Secrets (Generate random strings)
JWT_SECRET=your-random-secret-key-here-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-key-here-min-32-chars

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password-not-main-password

# Cloudinary
CLOUDINARY_NAME=your-cloud-name
CLOUDINARY_KEY=your-api-key
CLOUDINARY_SECRET=your-api-secret

# Server
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:5173
```

### Step 5: Generate JWT Secrets
```bash
# Generate random secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Run multiple times and paste outputs into .env
```

### Step 6: Seed Database (Optional)
```bash
# Create initial data
npm run seed

# Or manually
node seed.js
```

### Step 7: Start Backend Server
```bash
# Development mode with nodemon
npm run dev

# OR Production mode
npm start

# Should output:
# Server running on http://localhost:5000
# Connected to MongoDB
```

### Backend Health Check
```bash
# In new terminal
curl http://localhost:5000/api/health

# Expected response
{
  "success": true,
  "message": "API is running",
  "environment": "development",
  "timestamp": "..."
}
```

---

## 🎨 Frontend Setup

### Step 1: Navigate to Frontend Directory
```bash
cd frontend
```

### Step 2: Install Dependencies
```bash
npm install

# Verify installation
npm list --depth=0
```

### Step 3: Create Environment File (Optional)
```bash
# Create .env file if needed
cat > .env << EOF
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
EOF
```

### Step 4: Start Frontend Development Server
```bash
# Start Vite dev server
npm run dev

# Should output:
# VITE v5.1.4 ready in 245 ms
# ➜  Local:   http://localhost:5173/
# ➜  press h + enter to show help
```

### Step 5: Access Application
Open browser and navigate to:
```
http://localhost:5173
```

---

## ✅ Verification & Testing

### Test Backend Endpoints

#### 1. Health Check
```bash
curl http://localhost:5000/api/health
```

#### 2. Authentication
```bash
# Login test
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@college.edu",
    "password": "admin123"
  }'
```

#### 3. Student Data
```bash
# Get students
curl -X GET http://localhost:5000/api/students \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### 4. AI Features
```bash
# Get AI insights
curl -X GET http://localhost:5000/api/students/ai/insights \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test Frontend

1. **Login**
   - Navigate to login page
   - Test with admin/student/professor accounts

2. **Navigation**
   - Test sidebar navigation
   - Verify all menu items work

3. **Dashboard**
   - Load dashboard
   - Check if data displays

4. **AI Features**
   - Click AI Dashboard
   - Verify analytics load

---

## 🐛 Troubleshooting

### Issue 1: MongoDB Connection Failed
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```

**Solution:**
```bash
# Check if MongoDB is running
# Windows: Check Services
# macOS: brew services list
# Ubuntu: sudo systemctl status mongod

# Verify connection string
# Check credentials in .env
# Verify IP whitelist in MongoDB Atlas
```

### Issue 2: Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::5000
```

**Solution:**
```bash
# Windows - Find and kill process
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :5000
kill -9 <PID>

# OR use different port
PORT=5001 npm run dev
```

### Issue 3: CORS Error
```
Access to XMLHttpRequest blocked by CORS policy
```

**Solution:**
```bash
# Update .env
FRONTEND_URL=http://localhost:5173

# Restart backend
npm run dev
```

### Issue 4: File Upload Not Working
```
Error: Cloudinary credentials invalid
```

**Solution:**
```bash
# Verify Cloudinary account
# Check CLOUDINARY_NAME, CLOUDINARY_KEY, CLOUDINARY_SECRET
# Regenerate API key if needed
```

### Issue 5: Email Not Sending
```
Error: SMTP authentication failed
```

**Solution:**
```bash
# For Gmail:
# 1. Enable 2-factor authentication
# 2. Generate app-specific password
# 3. Use app password in SMTP_PASS (not main password)
# 4. Enable "Less secure app access" if still issues
```

### Issue 6: Dependencies Installation Failed
```
Error: npm ERR! code E401
```

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Try installing again
npm install

# OR use yarn
npm install -g yarn
yarn install
```

---

## 📊 Verify Installation Success

### Checklist
- [ ] Node.js and npm installed
- [ ] MongoDB connected
- [ ] All environment variables configured
- [ ] Backend server running (port 5000)
- [ ] Frontend server running (port 5173)
- [ ] Can access http://localhost:5173
- [ ] Can login with credentials
- [ ] API endpoints responding
- [ ] File uploads working
- [ ] Email service working

### Test Endpoints
```bash
# All should return success
curl http://localhost:5000/api/health

# Should return 200
curl -I http://localhost:5173
```

---

## 🎯 Next Steps

1. **Update Sample Data**
   - Run seed.js to populate test data
   - Create test accounts for admin/student/professor

2. **Configure Email Templates**
   - Customize email templates in backend
   - Test email notifications

3. **Upload Sample Files**
   - Test file upload functionality
   - Verify storage in Cloudinary

4. **Test AI Features**
   - Generate some results first
   - Test analytics endpoints
   - Verify performance prediction

5. **Production Preparation**
   - Read DEPLOYMENT_GUIDE.md
   - Set up SSL certificates
   - Configure domain
   - Set up monitoring

---

## 📚 Important Files Reference

```
college-management-system/
├── backend/
│   ├── .env.example          ← Copy to .env and edit
│   ├── server.js             ← Main entry point
│   ├── package.json          ← Dependencies
│   ├── config/               ← Database config
│   ├── routes/               ← API endpoints
│   ├── models/               ← Database models
│   └── utils/                ← Helper functions
├── frontend/
│   ├── .env                  ← Environment variables
│   ├── vite.config.js        ← Build config
│   ├── package.json          ← Dependencies
│   └── src/
│       ├── App.jsx           ← Main component
│       ├── main.jsx          ← Entry point
│       ├── services/         ← API calls
│       └── components/       ← React components
├── ENHANCED_FEATURES.md      ← New features docs
├── DEPLOYMENT_GUIDE.md       ← Production setup
└── .gitignore               ← Ignored files
```

---

## 💡 Tips & Best Practices

1. **Use Postman for API Testing**
   - Import API endpoints
   - Test without frontend

2. **Monitor Logs**
   - Check console output
   - Monitor error messages

3. **Use Git Branches**
   - Create feature branches
   - Don't commit to main

4. **Backup Data**
   - Regular database backups
   - Version control commits

5. **Performance Monitoring**
   - Check API response times
   - Monitor database queries

---

## 🆘 Getting Help

- **Issues**: Check GitHub issues
- **Documentation**: Read ENHANCED_FEATURES.md
- **API Docs**: Access /api/health endpoint
- **Community**: Ask in project discussions

---

## ✨ First-Time Setup Complete!

You should now have:
✅ Working backend API
✅ Running frontend application
✅ Connected database
✅ All services configured
✅ AI features ready
✅ File uploads enabled
✅ Email notifications ready

**Happy coding! 🚀**

---

Last Updated: May 2, 2024
Version: 2.0 - Complete Setup Guide
