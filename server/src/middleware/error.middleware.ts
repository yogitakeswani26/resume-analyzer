import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number = 400
  ) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof AppError) {
    console.error('[Recruiter API Error]', {
      code: err.code,
      message: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
    });
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
      },
    });
  }

  console.error('[Recruiter API Error - Unexpected]', {
    code: 'INTERNAL_SERVER_ERROR',
    message: err?.message || 'Unknown error',
    stack: err?.stack,
    path: req.path,
    method: req.method,
  });

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
    },
  });
};
