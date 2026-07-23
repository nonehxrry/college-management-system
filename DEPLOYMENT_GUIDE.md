# College Management System - Deployment Guide

## 🚀 Quick Start Guide

### Prerequisites
- Node.js 14+ and npm
- MongoDB Atlas account (or local MongoDB)
- Cloudinary account (for file uploads)
- Gmail/SMTP server for emails
- Git

### 1. Local Development Setup

#### Backend Setup
```bash
# Clone repository
git clone <your-repo>
cd college-management-system/backend

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your configuration
nano .env

# Run database migrations (if using seed)
npm run seed

# Start development server
npm run dev
```

#### Frontend Setup
```bash
cd ../frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

### 2. Configuration Files

Create `.env` file in backend directory:
```
MONGODB_URI=<your-mongodb-connection-string>
JWT_SECRET=<generate-random-secret>
CLOUDINARY_NAME=<your-cloudinary-name>
CLOUDINARY_KEY=<your-cloudinary-key>
CLOUDINARY_SECRET=<your-cloudinary-secret>
SMTP_USER=<your-email>
SMTP_PASS=<your-app-password>
NODE_ENV=development
```

### 3. Cloud Deployment (Render/Railway/Heroku)

#### Using Render
```bash
# Create account at render.com

# Create new Web Service
# Connect GitHub repository
# Set Environment Variables (from .env)
# Deploy from branch: main

# Build Command: npm install
# Start Command: npm start
```

#### Using Railway
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Add environment variables
railway variables set MONGODB_URI=<uri>
railway variables set JWT_SECRET=<secret>

# Deploy
railway up
```

### 4. Production Deployment Checklist

#### Pre-Deployment
- [ ] All environment variables configured
- [ ] Database backups enabled
- [ ] SSL/HTTPS configured
- [ ] Rate limiting tested
- [ ] Error logging setup
- [ ] Monitor/alerting configured

#### During Deployment
- [ ] Test all API endpoints
- [ ] Test file uploads
- [ ] Test email notifications
- [ ] Test plagiarism detection
- [ ] Test bulk import
- [ ] Verify analytics working

#### Post-Deployment
- [ ] Monitor system health
- [ ] Check error logs
- [ ] Verify analytics collection
- [ ] Test user authentication
- [ ] Monitor API response times
- [ ] Setup automated backups

### 5. Database Backup Strategy

#### Automated Daily Backups
```javascript
// In your cron job or deployment script
const backupSchedule = "0 0 * * *"; // Daily at midnight

// Backup command (MongoDB)
mongodump --uri="mongodb+srv://user:pass@cluster.mongodb.net/college-mgmt" \
  --out=/backups/`date +%Y%m%d_%H%M%S`
```

#### Restore from Backup
```bash
mongorestore --uri="mongodb+srv://user:pass@cluster.mongodb.net/college-mgmt" \
  /backups/backup_folder
```

### 6. Monitoring Setup

#### Application Monitoring
```bash
# Install PM2 for process management
npm install -g pm2

# Start application with PM2
pm2 start server.js --name "cms"
pm2 save
pm2 startup

# Monitor
pm2 monit
pm2 logs
```

#### Health Check
```bash
# Monitor endpoint
curl https://api.yourdomain.com/api/health

# Response should include:
{
  "success": true,
  "message": "API is running",
  "environment": "production",
  "timestamp": "2024-05-02T..."
}
```

### 7. SSL/HTTPS Setup

#### Using Let's Encrypt with Nginx
```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Generate certificate
sudo certbot certonly --nginx -d api.yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
```

#### Nginx Configuration
```nginx
server {
    listen 443 ssl;
    server_name api.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 8. Performance Optimization

#### Caching Strategy
```javascript
// Redis caching for frequently accessed data
const redis = require("redis");
const client = redis.createClient();

app.get("/api/students/:id", async (req, res) => {
  const cached = await client.get(`student:${req.params.id}`);
  if (cached) return res.json(JSON.parse(cached));
  
  // Fetch and cache
  const student = await Student.findById(req.params.id);
  await client.setEx(`student:${req.params.id}`, 3600, JSON.stringify(student));
  res.json(student);
});
```

#### Database Indexing
```javascript
// Ensure indexes for better performance
Student.collection.createIndex({ email: 1 });
Student.collection.createIndex({ rollNumber: 1 });
Result.collection.createIndex({ student: 1, semester: 1 });
```

### 9. Logging & Error Tracking

#### Winston Logger Setup
```javascript
const winston = require("winston");

const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" })
  ]
});

// Use in code
logger.info("API request received");
logger.error("Database connection failed");
```

### 10. Security Hardening

#### Helmet Configuration
```javascript
const helmet = require("helmet");
app.use(helmet());
app.use(helmet.contentSecurityPolicy());
app.use(helmet.frameguard({ action: "deny" }));
```

#### CORS Configuration
```javascript
const cors = require("cors");
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
}));
```

### 11. Scale & Load Testing

#### Using Artillery
```bash
# Install Artillery
npm install -g artillery

# Load test configuration
cat > load-test.yml << EOF
config:
  target: "https://api.yourdomain.com"
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - name: "API Test"
    flow:
      - get:
          url: "/api/health"
EOF

# Run test
artillery run load-test.yml
```

### 12. Troubleshooting

#### Common Issues

1. **Database Connection Failed**
   ```bash
   # Check MongoDB connection string
   # Verify IP whitelist in MongoDB Atlas
   # Check network connectivity
   ```

2. **CORS Error**
   ```bash
   # Update FRONTEND_URL in .env
   # Verify CORS middleware configuration
   ```

3. **File Upload Failed**
   ```bash
   # Check Cloudinary credentials
   # Verify file size limits
   # Check file upload permissions
   ```

4. **Email Not Sending**
   ```bash
   # Verify SMTP credentials
   # Check "Less secure app access" for Gmail
   # Review email logs
   ```

### 13. Environment-Specific Configuration

#### Development
```env
NODE_ENV=development
DEBUG=true
LOG_LEVEL=debug
```

#### Staging
```env
NODE_ENV=staging
DEBUG=false
LOG_LEVEL=info
```

#### Production
```env
NODE_ENV=production
DEBUG=false
LOG_LEVEL=error
```

### 14. Automated Testing Before Deploy

```bash
# Run tests
npm test

# Run linter
npm run lint

# Build frontend
cd frontend && npm run build

# Run integration tests
npm run test:integration
```

### 15. Zero-Downtime Deployment

```bash
# Using PM2 Cluster Mode
pm2 start server.js -i max --name "cms"

# Deploy new version
git pull origin main
npm install
pm2 reload cms

# Verify
curl https://api.yourdomain.com/api/health
```

---

## 📊 Performance Targets

- API response time: < 200ms
- Page load time: < 2s
- Availability: > 99.9%
- Database query time: < 100ms

---

## 🔐 Security Checklist

- [ ] HTTPS/SSL enabled
- [ ] CORS properly configured
- [ ] Rate limiting active
- [ ] SQL injection prevention
- [ ] CSRF protection
- [ ] Sensitive data encrypted
- [ ] API keys secured
- [ ] Regular security updates
- [ ] Penetration testing done
- [ ] Audit logging enabled

---

## 📞 Support Contacts

- **Technical Issues**: support@yourdomain.edu
- **Security Issues**: security@yourdomain.edu
- **Database Issues**: dba@yourdomain.edu

---

## 📚 Additional Resources

- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [MongoDB Security](https://docs.mongodb.com/manual/security/)
- [Express.js Security](https://expressjs.com/en/advanced/best-practice-security.html)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

---

Last Updated: May 2, 2024
