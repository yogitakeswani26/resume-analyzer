import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { Express } from 'express';

// Middleware to skip rate limiting if disabled
const skipRateLimit = (req: any, res: any) => {
  return process.env.RATE_LIMIT_DISABLED === 'true' || process.env.NODE_ENV === 'test';
};

// Rate limiters
export const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many registration attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipRateLimit,
});

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many login attempts, please try again later.',
  skip: skipRateLimit,
});

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  message: 'Too many requests, please try again later.',
  skip: skipRateLimit,
});

export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: 'Too many uploads, please try again later.',
  skip: skipRateLimit,
});

export const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // 3 requests per window (brute force protection)
  message: 'Too many password reset attempts, please try again later.',
  skip: skipRateLimit,
});

export const tokenRefreshLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 requests per minute (reasonable for automated token refresh)
  message: 'Too many token refresh attempts, please try again later.',
  skip: skipRateLimit,
});

export const setupSecurityHeaders = (app: Express) => {
  app.use(helmet());
  app.use(helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  }));
  app.use(helmet.hsts({
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  }));
  app.use(helmet.frameguard({ action: 'deny' }));
  app.use(helmet.noSniff());
  app.use(helmet.xssFilter());
};

// Input validation middleware
export const validateInput = (schema: any) => {
  return (req: any, res: any, next: any) => {
    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: error.details[0].message },
      });
    }
    req.body = value;
    next();
  };
};
