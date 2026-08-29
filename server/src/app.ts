import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import 'express-async-errors';
import { config } from './config/env.js';
import { errorHandler } from './middleware/error.middleware.js';
import { swaggerSpec } from './docs/swagger.js';
import authRoutes from './modules/auth/auth.routes.js';
import userRoutes from './modules/users/user.routes.js';
import resumeRoutes from './modules/resumes/resume.routes.js';
import analysisRoutes from './modules/analysis/analysis.routes.js';
import recruiterRoutes from './modules/recruiter/recruiter.routes.js';

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration - allow multiple origins with exact domain matching
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
];

// Add configured frontend URL
if (config.frontend_url && config.frontend_url !== 'http://localhost:5173') {
  allowedOrigins.push(config.frontend_url);
}

// Allow all Vercel preview & production domains
const vercelDomain = /^https:\/\/.*\.vercel\.app$/;

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      callback(null, true);
      return;
    }

    // Check if origin is in whitelist
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    // Check if origin is a Vercel domain
    if (vercelDomain.test(origin)) {
      callback(null, true);
      return;
    }

    // Reject everything else
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve);
app.get('/api-docs', swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Resume Analyzer API Documentation',
}));

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'OK',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      port: config.port,
    },
  });
});

// Debug endpoint - only available in development
if (process.env.NODE_ENV === 'development') {
  app.post('/debug/test-parse', express.raw({ type: 'application/octet-stream', limit: '10mb' }), async (req, res) => {
    try {
      const fileType = req.query.type as string || 'application/pdf';
      const buffer = req.body as Buffer;

      const { parseFile } = await import('./utils/fileParser.js');
      const content = await parseFile(buffer, fileType);

      res.json({
        success: true,
        data: {
          fileType,
          bufferSize: buffer.length,
          parsedContentLength: content.length,
          preview: content.substring(0, 500),
        },
      });
    } catch (err: any) {
      // In development, include stack; in production, hide it
      res.status(400).json({
        success: false,
        error: {
          code: 'PARSE_ERROR',
          message: err.message,
        },
      });
    }
  });
}

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/resumes', resumeRoutes);
app.use('/api/v1/analysis', analysisRoutes);
app.use('/api/v1/recruiter', recruiterRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Route not found',
    },
  });
});

// Error handler (must be last)
app.use(errorHandler);

export default app;
