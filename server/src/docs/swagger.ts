import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Resume Analyzer API',
      version: '1.0.0',
      description: 'AI-Powered Resume Analysis and Job Matching API',
      contact: {
        name: 'Resume Analyzer Team',
        url: 'https://resume-analyzer-delta-coral.vercel.app',
      },
      license: {
        name: 'MIT',
      },
    },
    servers: [
      {
        url: 'https://resume-analyzer-api-k3qm.onrender.com/api/v1',
        description: 'Production Server',
      },
      {
        url: 'http://localhost:3000/api/v1',
        description: 'Development Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string' },
            role: { type: 'string', enum: ['student', 'professional'] },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Resume: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            userId: { type: 'string' },
            fileName: { type: 'string' },
            fileUrl: { type: 'string' },
            content: { type: 'string' },
            skills: { type: 'array', items: { type: 'string' } },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Analysis: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            resumeId: { type: 'string' },
            userId: { type: 'string' },
            score: { type: 'number', minimum: 0, maximum: 100 },
            atsScore: { type: 'number', minimum: 0, maximum: 100 },
            skillCount: { type: 'number' },
            experienceYears: { type: 'number' },
            recommendations: { type: 'array', items: { type: 'string' } },
          },
        },
        MatchResult: {
          type: 'object',
          properties: {
            matchScore: { type: 'number', minimum: 0, maximum: 100 },
            matchedSkills: { type: 'array', items: { type: 'string' } },
            missingSkills: { type: 'array', items: { type: 'string' } },
            suggestions: { type: 'array', items: { type: 'string' } },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' },
              },
            },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: [
    './src/modules/auth/auth.routes.ts',
    './src/modules/resumes/resume.routes.ts',
    './src/modules/analysis/analysis.routes.ts',
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
