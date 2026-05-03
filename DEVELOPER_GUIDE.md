# ⚡ Developer Quick Reference Guide

## 🎯 Quick Start Commands

### Backend
```bash
# Installation
cd backend && npm install

# Development
npm run dev

# Production
npm start

# Database seed
npm run seed

# Testing
npm test

# Linting
npm run lint
```

### Frontend
```bash
# Installation
cd frontend && npm install

# Development
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Linting
npm run lint
```

---

## 📁 Project Structure

```
backend/
├── config/             ← Database & services config
├── controllers/        ← Request handlers
├── middleware/         ← Express middleware
├── models/            ← MongoDB schemas
├── routes/            ← API route definitions
├── socket/            ← WebSocket handlers
├── utils/             ← Helper functions
├── validators/        ← Input validation
├── uploads/           ← File storage (local)
├── .env.example       ← Environment template
├── server.js          ← Entry point
└── package.json       ← Dependencies

frontend/
├── src/
│   ├── components/    ← React components
│   ├── pages/         ← Page components
│   ├── services/      ← API service layer
│   ├── context/       ← React context/state
│   ├── hooks/         ← Custom React hooks
│   ├── utils/         ← Helper functions
│   ├── assets/        ← Images/media
│   ├── App.jsx        ← Main component
│   └── main.jsx       ← Entry point
├── .env               ← Environment variables
├── vite.config.js     ← Build configuration
└── package.json       ← Dependencies
```

---

## 🔐 Environment Variables

### Essential Backend Variables
```
MONGODB_URI              ← Database connection string
JWT_SECRET              ← JWT signing key
JWT_REFRESH_SECRET      ← Refresh token secret
CLOUDINARY_NAME         ← File upload service
CLOUDINARY_KEY          ← File upload API key
CLOUDINARY_SECRET       ← File upload secret
SMTP_USER               ← Email service username
SMTP_PASS               ← Email service password
NODE_ENV                ← development/production
PORT                    ← Server port (default 5000)
FRONTEND_URL            ← Frontend domain for CORS
```

### Essential Frontend Variables
```
VITE_API_URL            ← Backend API base URL
VITE_SOCKET_URL         ← WebSocket server URL
```

---

## 🛠️ Common Development Tasks

### Create New API Endpoint

1. **Create Controller Function**
   ```javascript
   // backend/controllers/studentController.js
   exports.getStudent = async (req, res) => {
     try {
       const student = await Student.findById(req.params.id);
       res.json({ success: true, data: student });
     } catch (err) {
       res.status(400).json({ success: false, message: err.message });
     }
   };
   ```

2. **Create Route**
   ```javascript
   // backend/routes/studentRoutes.js
   router.get('/:id', authenticateToken, getStudent);
   ```

3. **Add Service Method (Frontend)**
   ```javascript
   // frontend/src/services/studentService.js
   getStudent: async (studentId) => {
     const { data } = await api.get(`/students/${studentId}`);
     return data;
   }
   ```

4. **Use in Component**
   ```jsx
   // frontend/src/components/StudentCard.jsx
   import { studentService } from "../../services/studentService";
   
   const [student, setStudent] = useState(null);
   useEffect(() => {
     studentService.getStudent(id).then(setStudent);
   }, [id]);
   ```

### Create New Database Model

```javascript
// backend/models/NewModel.js
const schema = new mongoose.Schema({
  name: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

schema.index({ createdAt: -1 });
module.exports = mongoose.model('NewModel', schema);
```

### Add New Component

```jsx
// frontend/src/components/NewComponent.jsx
import { useState, useEffect } from 'react';
import { Card } from './common/Card';

export const NewComponent = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch logic here
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="text-red-500">{error}</div>;
  
  return <Card>Content</Card>;
};

export default NewComponent;
```

---

## 🧪 Testing Endpoints with cURL

### POST with JSON
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@college.edu",
    "password": "admin123"
  }'
```

### GET with Authorization
```bash
curl -X GET http://localhost:5000/api/students \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### POST with File
```bash
curl -X POST http://localhost:5000/api/admin/bulk/import-students \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@students.csv"
```

### PUT Request
```bash
curl -X PUT http://localhost:5000/api/students/123 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "New Name"}'
```

---

## 📊 Database Queries

### Find Operations
```javascript
// Find one
const student = await Student.findById(studentId);

// Find multiple
const students = await Student.find({ semester: 4 });

// With filtering and sorting
const students = await Student
  .find({ semester: 4 })
  .sort({ cgpa: -1 })
  .limit(10);

// Count
const count = await Student.countDocuments({ semester: 4 });
```

### Create Operations
```javascript
// Single document
const student = await Student.create({
  name: "John Doe",
  email: "john@college.edu"
});

// Multiple documents
const students = await Student.insertMany([
  { name: "John", email: "john@..." },
  { name: "Jane", email: "jane@..." }
]);
```

### Update Operations
```javascript
// Update one
await Student.findByIdAndUpdate(id, { cgpa: 3.5 });

// Update multiple
await Student.updateMany({ semester: 4 }, { semester: 5 });
```

### Delete Operations
```javascript
// Delete one
await Student.findByIdAndDelete(id);

// Delete multiple
await Student.deleteMany({ semester: 4 });
```

---

## 🔍 Debugging Tips

### Backend Debugging
```javascript
// Add console logs
console.log('Variable:', variable);

// Use debugger statement
debugger;

// Log with timestamp
console.log('[' + new Date().toISOString() + '] Message');

// Error logging
console.error('Error:', error.message);
```

### Frontend Debugging
```javascript
// React DevTools
import React from 'react';

// Console logging
console.log('State:', state);

// Redux DevTools browser extension
```

### Network Debugging
```bash
# Monitor network requests
curl -v http://localhost:5000/api/health

# Test database connection
mongosh "mongodb://localhost:27017/college-mgmt"
```

---

## 🎨 Common CSS Classes (Tailwind)

### Layout
```jsx
<div className="flex justify-between items-center p-4">
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
<div className="container mx-auto max-w-7xl">
```

### Colors
```jsx
<div className="bg-blue-500 text-white">
<button className="bg-green-600 hover:bg-green-700">
<div className="text-red-600 border-l-4 border-red-600">
```

### Typography
```jsx
<h1 className="text-4xl font-bold">
<p className="text-sm text-gray-600">
<span className="font-semibold">
```

### Spacing
```jsx
<div className="p-6 m-4">
<div className="mt-8 mb-4">
<div className="space-y-4">
```

---

## 🔗 API Integration Pattern

### Create Service Method
```javascript
// frontend/src/services/apiService.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
});

export const studentService = {
  getAll: async (page = 1, limit = 20) => {
    const { data } = await api.get(`/students?page=${page}&limit=${limit}`);
    return data;
  },
  
  getById: async (id) => {
    const { data } = await api.get(`/students/${id}`);
    return data;
  },
  
  create: async (studentData) => {
    const { data } = await api.post('/students', studentData);
    return data;
  },
  
  update: async (id, updates) => {
    const { data } = await api.put(`/students/${id}`, updates);
    return data;
  },
  
  delete: async (id) => {
    const { data } = await api.delete(`/students/${id}`);
    return data;
  }
};

export default api;
```

### Use in Component
```jsx
import { useState, useEffect } from 'react';
import { studentService } from '../../services/studentService';

export const StudentList = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const response = await studentService.getAll();
      setStudents(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {loading && <LoadingSpinner />}
      {error && <div className="text-red-600">{error}</div>}
      {students.map(s => <StudentCard key={s.id} student={s} />)}
    </div>
  );
};
```

---

## 📱 Responsive Design Breakpoints

```
Tailwind Breakpoints:
- sm: 640px
- md: 768px
- lg: 1024px
- xl: 1280px
- 2xl: 1536px

Usage:
<div className="w-full md:w-1/2 lg:w-1/3">
```

---

## 🚀 Performance Tips

### Backend
- Use database indexes on frequently queried fields
- Implement pagination for large datasets
- Cache frequently accessed data
- Use aggregation pipelines for complex queries
- Monitor query performance

### Frontend
- Code splitting with lazy loading
- Memoization for expensive components
- Virtual scrolling for long lists
- Image optimization
- Service worker for offline support

---

## 📦 Adding New Dependencies

### Backend
```bash
cd backend
npm install package-name
npm install --save-dev package-name # For dev dependencies
```

### Frontend
```bash
cd frontend
npm install package-name
npm install --save-dev package-name
```

---

## 🔄 Git Workflow

```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes
git add .
git commit -m "Add new feature"

# Push to remote
git push origin feature/new-feature

# Create pull request on GitHub
# Review and merge

# Delete local branch
git branch -d feature/new-feature
```

---

## 📝 Code Style Guide

### JavaScript
```javascript
// Use const by default
const value = 'something';

// Use arrow functions
const getData = async () => {
  // Code here
};

// Use template strings
const message = `Hello, ${name}`;

// Destructuring
const { id, name } = user;
```

### React
```jsx
// Use functional components
export const MyComponent = () => {
  // Hooks
  const [state, setState] = useState(null);
  
  return <div>Content</div>;
};

// Export at bottom
export default MyComponent;
```

---

## 🛡️ Security Best Practices

- Never commit `.env` file with secrets
- Always validate user input
- Use HTTPS in production
- Sanitize database queries
- Implement CORS properly
- Use strong password hashing
- Implement rate limiting
- Use CSRF tokens for forms

---

## 📋 Checklist for New Features

- [ ] Create backend controller
- [ ] Create API routes
- [ ] Add database model if needed
- [ ] Create service methods
- [ ] Create React components
- [ ] Add error handling
- [ ] Write tests
- [ ] Update documentation
- [ ] Test in development
- [ ] Review code
- [ ] Deploy to staging
- [ ] Test in production

---

## 🆘 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Port already in use | `lsof -i :5000 && kill -9 <PID>` |
| MongoDB connection | Check connection string and credentials |
| CORS errors | Update FRONTEND_URL in .env |
| Undefined variables | Check prop drilling and context |
| API 404 errors | Verify route path and HTTP method |
| Token expired | Implement refresh token rotation |
| File upload failing | Check Cloudinary credentials |

---

Last Updated: May 2, 2024
Version: 2.0
