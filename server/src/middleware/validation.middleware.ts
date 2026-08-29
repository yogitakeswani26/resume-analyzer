import { Request, Response, NextFunction } from 'express';
import { isValidObjectId } from 'mongoose';
import { AppError } from '../middleware/error.middleware.js';

export const validateObjectId = (paramName: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const id = req.params[paramName];
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: `Invalid ${paramName}. Must be a valid MongoDB ID.`,
        },
      });
    }
    next();
  };
};

export const validateObjectIdArray = (fieldName: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const ids = req.body[fieldName];
    if (!Array.isArray(ids)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: `${fieldName} must be an array.`,
        },
      });
    }

    for (const id of ids) {
      if (!isValidObjectId(id)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_ID',
            message: `Invalid ID in ${fieldName}: "${id}". Must be a valid MongoDB ID.`,
          },
        });
      }
    }

    next();
  };
};
