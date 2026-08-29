import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { JWTPayload } from '../types/index.js';

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  // Extract authorization header
  const authHeader = req.headers.authorization;
  let token: string | undefined;

  if (typeof authHeader === 'string') {
    // Handle "Bearer <token>" format
    const parts = authHeader.trim().split(/\s+/);
    if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
      token = parts[1];
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Access token required',
      },
    });
  }

  try {
    if (!config.jwt_secret || config.jwt_secret === 'dev_secret_key_change_in_production') {
      return res.status(500).json({
        success: false,
        error: {
          code: 'CONFIG_ERROR',
          message: 'Server configuration error - JWT_SECRET not set',
        },
      });
    }

    const decoded = jwt.verify(token, config.jwt_secret, { algorithms: ['HS256'] }) as JWTPayload;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Invalid or expired token',
      },
    });
  }
};

export const authorize = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.role || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
        },
      });
    }
    next();
  };
};
