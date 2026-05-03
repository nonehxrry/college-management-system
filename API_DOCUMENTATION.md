# 📚 College Management System - API Documentation

## Base URL
```
Development: http://localhost:5000/api
Production: https://api.yourdomain.com/api
```

## Authentication
All endpoints (except `/auth/login`, `/auth/register`) require:
```
Authorization: Bearer <JWT_TOKEN>
```

---

## 📑 Authentication Endpoints

### Login
```
POST /auth/login
Content-Type: application/json

Request Body:
{
  "email": "user@college.edu",
  "password": "password123"
}

Response (200):
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@college.edu",
    "role": "student"
  }
}
```

### Register
```
POST /auth/register
Content-Type: application/json

Request Body:
{
  "name": "John Doe",
  "email": "john@college.edu",
  "password": "password123",
  "role": "student"
}

Response (201):
{
  "success": true,
  "message": "User registered successfully",
  "userId": "user_id"
}
```

### Refresh Token
```
POST /auth/refresh-token
Content-Type: application/json

Request Body:
{
  "refreshToken": "refresh_token_here"
}

Response (200):
{
  "success": true,
  "token": "new_jwt_token",
  "refreshToken": "new_refresh_token"
}
```

---

## 🎓 Student Endpoints

### Get Student Profile
```
GET /students/:id
Headers: Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "data": {
    "id": "student_id",
    "name": "John Doe",
    "email": "john@college.edu",
    "rollNumber": "CS2024001",
    "department": "Computer Science",
    "semester": 4,
    "cgpa": 3.5,
    "attendance": 88,
    "contact": "9876543210"
  }
}
```

### Update Student Profile
```
PUT /students/:id
Content-Type: application/json
Headers: Authorization: Bearer <token>

Request Body:
{
  "phone": "9876543210",
  "address": "123 Main St",
  "city": "New York"
}

Response (200):
{
  "success": true,
  "message": "Profile updated successfully"
}
```

---

## 🤖 AI & Analytics Endpoints

### Student AI Insights
```
GET /students/ai/insights
Headers: Authorization: Bearer <token>

Query Parameters:
- includeRecommendations: true/false (default: true)

Response (200):
{
  "success": true,
  "data": {
    "performance": {
      "currentCGPA": 3.5,
      "predictedCGPA": 3.7,
      "trend": "improving",
      "riskLevel": "low",
      "confidence": 0.85
    },
    "attendance": {
      "percentage": 88,
      "trend": "stable",
      "weeklyPattern": {...}
    },
    "stress": {
      "score": 45,
      "level": "moderate",
      "factors": ["assignment_backlog", "upcoming_exams"]
    },
    "recommendations": [...]
  }
}
```

### Student Learning Path
```
GET /students/ai/learning-path
Headers: Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "data": {
    "focusAreas": [
      {
        "subject": "Database Systems",
        "priority": "high",
        "suggestions": ["Review normalization concepts"]
      }
    ],
    "studySchedule": [
      {
        "week": 1,
        "topic": "SQL Basics",
        "duration": "5 hours"
      }
    ],
    "learningResources": [...]
  }
}
```

### Student Progress Tracking
```
GET /students/ai/progress
Headers: Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "data": {
    "cgpaTrend": [...],
    "submissionRate": 95,
    "attendanceTrend": [...],
    "overallScore": 82,
    "improvements": [...]
  }
}
```

### Student Wellness
```
GET /students/ai/wellness
Headers: Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "data": {
    "stressLevel": "moderate",
    "recommendations": [...],
    "supportResources": [
      {
        "type": "counseling",
        "name": "Mental Health Counselor",
        "contact": "+1-800-COLLEGE"
      }
    ]
  }
}
```

### Subject-wise Performance
```
GET /students/ai/performance/by-subject
Headers: Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "data": [
    {
      "subject": "Mathematics",
      "grade": "A",
      "average": "B+",
      "trend": "improving"
    }
  ]
}
```

### Peer Comparison
```
GET /students/ai/peer-comparison
Headers: Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "data": {
    "studentCGPA": 3.5,
    "percentileRank": 75,
    "classStats": {
      "average": 3.2,
      "topper": 3.95,
      "lowest": 2.1
    }
  }
}
```

---

## 👨‍🏫 Professor Endpoints

### Professor Dashboard
```
GET /professors/ai/dashboard
Headers: Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "data": {
    "submissionStats": {...},
    "gradeStats": {...},
    "assignmentPerformance": {...},
    "recommendations": [...]
  }
}
```

### Student Analytics by Subject
```
GET /professors/ai/analytics/subject/:subjectId/students
Headers: Authorization: Bearer <token>

Query Parameters:
- sort: "performance" / "attendance" / "submissions"

Response (200):
{
  "success": true,
  "data": [
    {
      "studentId": "...",
      "name": "John Doe",
      "grade": "A",
      "attendance": 95,
      "submissionRate": 100,
      "riskLevel": "low"
    }
  ]
}
```

### Assignment Quality Analysis
```
GET /professors/ai/analytics/assignments/:assignmentId/quality
Headers: Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "data": {
    "gradeDistribution": {...},
    "lateSubmissionRate": 15,
    "topStudents": [...],
    "strugglingStudents": [...]
  }
}
```

### Class Performance Analysis
```
GET /professors/ai/analytics/class-performance/:subjectId
Headers: Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "data": {
    "engagementMetrics": {...},
    "attendancePercentages": {...},
    "submissionRates": {...},
    "recommendations": [...]
  }
}
```

### Check Assignment Plagiarism
```
POST /professors/ai/plagiarism/check-assignment/:assignmentId
Headers: Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "data": {
    "totalSubmissions": 50,
    "suspiciousPairs": [
      {
        "submission1": "...",
        "submission2": "...",
        "similarity": 85
      }
    ]
  }
}
```

---

## 👨‍💼 Admin Endpoints

### Bulk Import CSV Template
```
GET /admin/bulk/csv-template
Headers: Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "data": {
    "headers": [
      "name", "email", "rollNumber", "department", ...
    ],
    "sample": {
      "name": "John Doe",
      "email": "john@college.edu"
    }
  }
}
```

### Bulk Import Students
```
POST /admin/bulk/import-students
Headers: Authorization: Bearer <token>
Content-Type: multipart/form-data

Request:
- file: CSV/Excel file
- updateDuplicates: true/false (optional)

Response (200):
{
  "success": true,
  "data": {
    "operationId": "...",
    "totalRecords": 100,
    "successCount": 95,
    "failureCount": 5,
    "duplicateCount": 2,
    "errors": [
      {
        "row": 5,
        "message": "Invalid email format"
      }
    ]
  }
}
```

### Export Students to CSV
```
GET /admin/bulk/export-students
Headers: Authorization: Bearer <token>

Query Parameters:
- department: "Computer Science"
- semester: 4
- section: "A"

Response: CSV file download
```

### Bulk Operations History
```
GET /admin/bulk/operations
Headers: Authorization: Bearer <token>

Query Parameters:
- page: 1
- limit: 20
- status: "completed" / "failed" / "pending"

Response (200):
{
  "success": true,
  "data": [
    {
      "id": "...",
      "operationType": "import_students",
      "status": "completed",
      "statistics": {...},
      "completedAt": "2024-05-02T10:30:00Z"
    }
  ],
  "pagination": {
    "totalRecords": 45,
    "currentPage": 1,
    "totalPages": 3
  }
}
```

### AI Analytics Overview
```
GET /admin/ai/analytics/overview
Headers: Authorization: Bearer <token>

Query Parameters:
- limit: 100 (default)

Response (200):
{
  "success": true,
  "data": {
    "totalAnalyzed": 250,
    "improvingStudents": 85,
    "atRiskStudents": 30,
    "averageCGPA": 3.2
  }
}
```

### Student Analytics Details
```
GET /admin/ai/analytics/student/:studentId
Headers: Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "data": {
    "performance": {...},
    "attendance": {...},
    "stress": {...},
    "recommendations": [...]
  }
}
```

### Exam Difficulty Analysis
```
GET /admin/ai/analytics/exam-difficulty/:subjectId
Headers: Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "data": {
    "difficultyLevel": "medium",
    "gradeDistribution": {...},
    "standardDeviation": 0.45,
    "recommendations": [...]
  }
}
```

### At-Risk Students List
```
GET /admin/ai/analytics/at-risk-students
Headers: Authorization: Bearer <token>

Query Parameters:
- riskLevel: "high" / "medium" / "low"
- page: 1
- limit: 20

Response (200):
{
  "success": true,
  "data": [
    {
      "id": "...",
      "name": "John Doe",
      "riskLevel": "high",
      "cgpa": 1.8,
      "attendance": 45,
      "interventionNeeded": "urgent"
    }
  ]
}
```

### Plagiarism Check Submission
```
POST /admin/ai/plagiarism/check/:submissionId
Headers: Authorization: Bearer <token>

Request Body:
{
  "checkCode": true,
  "checkText": true
}

Response (200):
{
  "success": true,
  "data": {
    "reportId": "...",
    "overallSimilarity": 65,
    "suspiciousLevel": "moderate",
    "matches": [...]
  }
}
```

### Plagiarism Reports List
```
GET /admin/ai/plagiarism/reports
Headers: Authorization: Bearer <token>

Query Parameters:
- page: 1
- limit: 20
- suspiciousLevel: "high" / "moderate" / "low"
- isPlagiarized: true/false

Response (200):
{
  "success": true,
  "data": [
    {
      "id": "...",
      "submissionId": "...",
      "studentName": "John Doe",
      "similarity": 75,
      "suspiciousLevel": "high"
    }
  ]
}
```

### Review Plagiarism Report
```
PUT /admin/ai/plagiarism/reports/:reportId/review
Headers: Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
  "verdict": "confirmed", // "confirmed" / "false_positive" / "pending"
  "notes": "Evidence of copying from online source"
}

Response (200):
{
  "success": true,
  "message": "Review recorded successfully"
}
```

### System Health Status
```
GET /admin/system/health
Headers: Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "data": {
    "status": "healthy", // "healthy" / "warning" / "critical"
    "metrics": {
      "uptime": 86400,
      "memoryUsage": 512,
      "activeUsers": 45,
      "apiResponseTime": 120
    }
  }
}
```

### System Analytics
```
GET /admin/system/analytics
Headers: Authorization: Bearer <token>

Query Parameters:
- days: 7 (default)
- granularity: "hourly" / "daily"

Response (200):
{
  "success": true,
  "data": {
    "recentMetrics": [...],
    "trends": {...}
  }
}
```

### Record Analytics Snapshot
```
POST /admin/system/analytics/record
Headers: Authorization: Bearer <token>

Request Body:
{
  "metrics": {
    "apiResponseTime": 120,
    "activeUsers": 45,
    "totalRequests": 1000
  }
}

Response (201):
{
  "success": true,
  "message": "Analytics snapshot recorded"
}
```

### Comprehensive Report
```
GET /admin/reports/comprehensive
Headers: Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "data": {
    "statistics": {
      "students": 500,
      "professors": 50,
      "departments": 10,
      "submissions": {...}
    },
    "performance": {
      "atRiskStudents": 30,
      "averageCGPA": 3.2
    },
    "generatedAt": "2024-05-02T10:30:00Z"
  }
}
```

---

## ✅ Health & Status Endpoints

### System Health
```
GET /health

Response (200):
{
  "success": true,
  "message": "API is running",
  "environment": "production",
  "timestamp": "2024-05-02T10:30:00Z"
}
```

### API Status
```
GET /api/status

Response (200):
{
  "status": "operational",
  "uptime": "99.9%",
  "version": "2.0"
}
```

---

## 🔄 Common Response Formats

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {},
  "timestamp": "2024-05-02T10:30:00Z"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "status": 400,
  "error": {
    "code": "VALIDATION_ERROR",
    "details": [...]
  },
  "timestamp": "2024-05-02T10:30:00Z"
}
```

### Paginated Response
```json
{
  "success": true,
  "data": [],
  "pagination": {
    "totalRecords": 100,
    "currentPage": 1,
    "totalPages": 5,
    "pageSize": 20
  }
}
```

---

## 🔐 HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200  | OK - Request successful |
| 201  | Created - Resource created |
| 400  | Bad Request - Invalid input |
| 401  | Unauthorized - No auth token |
| 403  | Forbidden - Insufficient permissions |
| 404  | Not Found - Resource not found |
| 409  | Conflict - Resource conflict |
| 500  | Server Error |
| 503  | Service Unavailable |

---

## ⏱️ Rate Limiting

Default: 100 requests per 15 minutes

Response Headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1620234600
```

---

## 📝 Common Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number for pagination |
| limit | number | 20 | Records per page |
| sort | string | -createdAt | Sort field and direction |
| search | string | - | Search query |
| filter | object | - | Filter conditions |

---

## 💾 CSV Format for Bulk Import

Required columns:
```
name,email,rollNumber,enrollmentNumber,department,semester,section,batch,
fatherName,motherName,dateOfBirth,gender,phone,street,city,state,pincode,bloodGroup
```

Example:
```
John Doe,john@college.edu,CS2024001,E2024001,Computer Science,4,A,2024,
James Doe,Mary Doe,2002-01-15,Male,9876543210,123 Main St,New York,NY,10001,O+
```

---

## 🚀 Rate Limiting Headers

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1620234600
Retry-After: 60
```

---

## 📦 File Upload Limits

- Max file size: 25MB
- CSV file max: 10MB
- Allowed types: pdf, docx, xlsx, csv, jpg, png, txt

---

Last Updated: May 2, 2024
API Version: 2.0
