import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service.js';
import {
  validateRegister,
  validateLogin,
  validateRefreshToken,
  validateForgotPassword,
  validateResetPassword,
} from '../../utils/validators.js';
import { APIResponse } from '../../types/index.js';

const authService = new AuthService();

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { valid, errors } = validateRegister(req.body);
      if (!valid) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: errors.join(', ') },
        });
      }
      const input = req.body;
      const user = await authService.register(input);

      const response: APIResponse<any> = {
        success: true,
        data: {
          user,
          message: 'Registration successful. Please log in with your credentials.',
        },
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { valid, errors } = validateLogin(req.body);
      if (!valid) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: errors.join(', ') },
        });
      }
      const input = req.body;
      const result = await authService.login(input);

      const response: APIResponse<any> = {
        success: true,
        data: {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          user: result.user,
        },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.body.refreshToken || req.cookies?.refreshToken;
      const { valid, errors } = validateRefreshToken({ refreshToken });
      if (!valid) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: errors.join(', ') },
        });
      }
      const input = { refreshToken };
      const result = await authService.refreshAccessToken(input.refreshToken);

      const response: APIResponse<any> = {
        success: true,
        data: {
          accessToken: result.accessToken,
          user: result.user,
        },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response) {
    res.json({
      success: true,
      data: { message: 'Logout successful' },
    });
  }

  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { valid, errors } = validateForgotPassword(req.body);
      if (!valid) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: errors.join(', ') },
        });
      }

      const result = await authService.forgotPassword(req.body);

      const response: APIResponse<any> = {
        success: true,
        data: result,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { valid, errors } = validateResetPassword(req.body);
      if (!valid) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: errors.join(', ') },
        });
      }

      const result = await authService.resetPassword(req.body);

      const response: APIResponse<any> = {
        success: true,
        data: result,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  async validateToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.params;

      if (!token) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Reset token is required' },
        });
      }

      const result = await authService.validateResetToken(token);

      const response: APIResponse<any> = {
        success: true,
        data: result,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
}
