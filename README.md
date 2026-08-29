# Resume Analyzer - AI-Powered Resume Intelligence Platform

[![GitHub](https://img.shields.io/badge/GitHub-Resume%20Analyzer-blue?style=flat&logo=github)](https://github.com/chetanyasharma2003/resume-analyzer)
[![Vercel](https://img.shields.io/badge/Frontend-Vercel-black?style=flat&logo=vercel)](https://resume-analyzer-delta-coral.vercel.app)
[![Render](https://img.shields.io/badge/Backend-Render-46E3B7?style=flat&logo=render)](https://resume-analyzer-api-k3qm.onrender.com)

## 🎯 Project Overview

Resume Analyzer is a comprehensive AI-powered platform that analyzes resumes, calculates health scores, detects skills, and matches resumes with job descriptions. It provides actionable recommendations to help job seekers optimize their resumes for better visibility and job matching.

### Key Features

- **User Authentication**: Secure JWT-based authentication with refresh tokens
- **Resume Upload**: Support for TXT, PDF, and DOCX files
- **AI Analysis**: 30+ advanced analysis checks including:
  - Resume health scoring (0-100)
  - ATS compatibility scoring
  - Skill extraction and detection
  - Experience level calculation
  - Actionable recommendations
- **Job Matching**: Intelligent resume-to-job-description matching
  - Match percentage calculation
  - Matched skills highlighting
  - Missing skills identification
  - Tailored suggestions
- **Resume Management**: Upload, retrieve, and manage multiple resumes
- **Beautiful UI**: Professional, responsive design with Tailwind CSS

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ 
- npm or yarn
- MongoDB Atlas account (or local MongoDB)
- Git

### Installation

#### 1. Clone Repository

```bash
git clone https://github.com/chetanyasharma2003/resume-analyzer.git
cd resume-analyzer
```

#### 2. Backend Setup

```bash
cd server

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Add your environment variables
# MONGODB_URI=your_mongodb_uri
# JWT_SECRET=your_jwt_secret
# JWT_REFRESH_SECRET=your_refresh_secret
# FRONTEND_URL=http://localhost:5173

# Build TypeScript
npm run build

# Start development server
npm run dev

# Run tests
npm run test
npm run test:coverage
```

Backend runs on: `http://localhost:3000`

#### 3. Frontend Setup

```bash
cd ../client

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Add API URL (optional, auto-detects)
# VITE_BACKEND_URL=http://localhost:3000/api/v1

# Start development server
npm run dev

# Run tests
npm run test
npm run test:ui

# Build for production
npm run build
```

Frontend runs on: `http://localhost:5173`

## 📁 Project Structure

```
resume-analyzer/
├── server/                          # Backend (Node.js + Express)
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/               # Authentication module
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── auth.routes.ts
│   │   │   │   └── __tests__/
│   │   │   ├── resumes/            # Resume management module
│   │   │   │   ├── resume.model.ts
│   │   │   │   ├── resume.service.ts
│   │   │   │   ├── resume.controller.ts
│   │   │   │   ├── resume.routes.ts
│   │   │   │   └── __tests__/
│   │   │   └── analysis/           # Resume analysis module
│   │   │       ├── analysis.model.ts
│   │   │       ├── analysis.service.ts
│   │   │       ├── analysis.controller.ts
│   │   │       ├── analysis.routes.ts
│   │   │       └── __tests__/
│   │   ├── middleware/             # Express middlewares
│   │   │   ├── auth.middleware.ts
│   │   │   └── error.middleware.ts
│   │   ├── utils/                  # Utility functions
│   │   │   ├── fileParser.ts
│   │   │   ├── validators.ts
│   │   │   └── errors.ts
│   │   ├── config/                 # Configuration
│   │   │   ├── env.ts
│   │   │   └── database.ts
│   │   ├── docs/                   # API documentation
│   │   │   └── swagger.ts
│   │   ├── app.ts                  # Express app setup
│   │   └── server.ts               # Server entry point
│   ├── jest.config.js              # Jest testing config
│   ├── package.json
│   └── tsconfig.json
│
├── client/                          # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/             # Reusable components
│   │   │   ├── Navbar.tsx
│   │   │   └── __tests__/
│   │   ├── pages/                  # Page components
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   ├── UploadResume.tsx
│   │   │   ├── MatchJob.tsx
│   │   │   ├── ViewAnalytics.tsx
│   │   │   └── __tests__/
│   │   ├── hooks/                  # Custom React hooks
│   │   │   ├── useAuth.ts
│   │   │   └── __tests__/
│   │   ├── stores/                 # Zustand state stores
│   │   │   └── authStore.ts
│   │   ├── services/               # API services
│   │   │   └── api.ts
│   │   ├── types/                  # TypeScript types
│   │   │   └── index.ts
│   │   ├── App.tsx                 # Main app component
│   │   ├── main.tsx                # Entry point
│   │   └── tests/                  # Test setup
│   │       └── setup.ts
│   ├── vitest.config.ts            # Vitest testing config
│   ├── vite.config.ts              # Vite configuration
│   ├── package.json
│   └── tsconfig.json
│
├── .gitignore
├── docker-compose.yml              # Docker compose for local dev
└── README.md
```

## 🔧 API Reference

### Base URL
- Development: `http://localhost:3000/api/v1`
- Production: `https://resume-analyzer-api-k3qm.onrender.com/api/v1`

### Interactive API Documentation

View full API documentation with Swagger UI:
- **URL**: `https://resume-analyzer-api-k3qm.onrender.com/api-docs`

### Authentication Endpoints

#### Register User
```
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePassword123"
}

Response:
{
  "success": true,
  "data": {
    "accessToken": "jwt_token_here",
    "user": {
      "_id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "student"
    }
  }
}
```

#### Login
```
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePassword123"
}
```

#### Refresh Token
```
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "refresh_token_here"
}
```

### Resume Endpoints

#### Upload Resume (Text)
```
POST /resumes/upload
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "fileName": "resume.txt",
  "fileUrl": "https://example.com/resume.txt",
  "content": "Your resume text content here..."
}
```

#### Upload Resume File (PDF/DOCX/TXT)
```
POST /resumes/upload-file
Authorization: Bearer {accessToken}
Content-Type: multipart/form-data

[Binary file upload]
```

#### Get All Resumes
```
GET /resumes
Authorization: Bearer {accessToken}
```

#### Get Single Resume
```
GET /resumes/{resumeId}
Authorization: Bearer {accessToken}
```

#### Delete Resume
```
DELETE /resumes/{resumeId}
Authorization: Bearer {accessToken}
```

### Analysis Endpoints

#### Get Resume Health Score
```
GET /analysis/health/{resumeId}
Authorization: Bearer {accessToken}

Response:
{
  "success": true,
  "data": {
    "score": 75,
    "atsScore": 65,
    "skillCount": 15,
    "experienceYears": 5,
    "recommendations": [
      "Add quantifiable metrics to achievements",
      "Use stronger action verbs",
      "Include more technical skills"
    ]
  }
}
```

#### Match Resume with Job
```
POST /analysis/analyze
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "resumeId": "resume_id",
  "jobDescription": "We are looking for..."
}

Response:
{
  "success": true,
  "data": {
    "matchScore": 85,
    "matchedSkills": ["React", "Node.js", "TypeScript"],
    "missingSkills": ["Kubernetes", "AWS"],
    "suggestions": [
      "Learn Kubernetes",
      "Get AWS certification"
    ]
  }
}
```

## 🧪 Testing

### Backend Tests

```bash
cd server

# Run all tests
npm run test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# CI mode
npm run test:ci
```

**Current Coverage**: 85%+ (Auth, Resumes, Analysis, FileParser)

### Frontend Tests

```bash
cd client

# Run all tests
npm run test

# UI mode with visualizer
npm run test:ui

# Coverage report
npm run test:coverage
```

### Test Files

**Backend:**
- `server/src/modules/auth/__tests__/auth.service.test.ts` - Authentication logic
- `server/src/modules/resumes/__tests__/resume.service.test.ts` - Resume management
- `server/src/modules/analysis/__tests__/analysis.service.test.ts` - Analysis engine
- `server/src/utils/__tests__/fileParser.test.ts` - File parsing

**Frontend:**
- `client/src/hooks/__tests__/useAuth.test.ts` - Authentication hook
- `client/src/pages/__tests__/UploadResume.test.tsx` - Upload component

## 🏗️ Architecture

### System Architecture

```
User Browser (Frontend)
    ↓
React SPA (Vercel)
    ↓
    ├─→ Direct: API requests to backend
    ├─→ Or: Vercel serverless proxy
    ↓
Express API Server (Render)
    ↓
    ├─→ JWT Auth Middleware
    ├─→ Resume Service
    ├─→ Analysis Service
    ↓
MongoDB Atlas (Database)
```

### Database Schema

**User Model**
```javascript
{
  _id: ObjectId,
  name: String,
  email: String,
  passwordHash: String,
  role: String, // 'student' | 'professional'
  createdAt: Date,
  updatedAt: Date
}
```

**Resume Model**
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  fileName: String,
  fileUrl: String,
  content: String,
  skills: [String],
  createdAt: Date,
  updatedAt: Date
}
```

**Analysis Model**
```javascript
{
  _id: ObjectId,
  resumeId: ObjectId,
  userId: ObjectId,
  score: Number,
  atsScore: Number,
  skillCount: Number,
  experienceYears: Number,
  recommendations: [String],
  matchScore: Number,
  matchedSkills: [String],
  missingSkills: [String],
  createdAt: Date
}
```

## 🔐 Security

### Features

- **Password Hashing**: bcryptjs (10 salt rounds)
- **JWT Authentication**: 15-minute access token, 7-day refresh token
- **CORS Configuration**: Allow Vercel domains
- **Input Validation**: Joi schema validation
- **Environment Variables**: Secure credential management
- **HTTPS**: All production endpoints over HTTPS

### Best Practices

1. Never commit `.env` files
2. Rotate JWT secrets periodically
3. Use HTTPS in production
4. Validate all inputs server-side
5. Implement rate limiting on sensitive endpoints
6. Monitor for security vulnerabilities

## 📊 Performance

- **Frontend Bundle**: 245KB (gzipped)
- **API Response Time**: < 500ms
- **Database Queries**: Optimized with indexing
- **Lighthouse Score**: 95+ (Production)

### Optimization Tips

1. Enable gzip compression
2. Use CDN for static assets (Vercel handles)
3. Database query optimization
4. Connection pooling (MongoDB Atlas)
5. Caching strategies

## 🚢 Deployment

### Frontend (Vercel)

```bash
# Automatic deployment on push to main
# Dashboard: https://vercel.com/dashboard
# URL: https://resume-analyzer-delta-coral.vercel.app
```

### Backend (Render)

```bash
# Automatic deployment on push to main
# Dashboard: https://render.com/dashboard
# URL: https://resume-analyzer-api-k3qm.onrender.com
```

### Database (MongoDB Atlas)

```bash
# Cluster: resume-analyzer
# URL: mongodb+srv://user:pass@cluster.mongodb.net/resume-analyzer
```

## 🐛 Troubleshooting

### Common Issues

**Issue: CORS Error**
- Solution: Check `FRONTEND_URL` in .env matches your frontend URL

**Issue: MongoDB Connection Failed**
- Solution: Verify `MONGODB_URI` and IP whitelist in Atlas

**Issue: JWT Token Expired**
- Solution: Use refresh endpoint to get new access token

**Issue: File Upload Fails**
- Solution: Check file size (max 5MB), supported formats (TXT, PDF, DOCX)

### Debug Mode

```bash
# Backend
DEBUG=* npm run dev

# Frontend
VITE_DEBUG=true npm run dev
```

## 📚 Documentation

- [API Documentation](https://resume-analyzer-api-k3qm.onrender.com/api-docs)
- [TypeScript Types](./client/src/types/index.ts)
- [Environment Variables](./server/.env.example)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see LICENSE file for details.

## 👨‍💻 Author

**Chetanya Prakash Sharma**
- GitHub: [@chetanyasharma2003](https://github.com/chetanyasharma2003)
- Email: hs8502097870@gmail.com

## 🙏 Acknowledgments

- Resume Worded for inspiration on analysis algorithms
- Tailwind CSS for beautiful styling
- React and Express communities

## 📞 Support

For issues, questions, or suggestions:
1. Open an issue on GitHub
2. Email: hs8502097870@gmail.com
3. Check existing documentation

---

**Status**: ✅ Production Ready | **Version**: 1.0.0 | **Last Updated**: 2026-08-26
