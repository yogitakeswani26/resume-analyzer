import { Request, Response, NextFunction } from 'express';
import { UserService } from './user.service.js';
import { APIResponse } from '../../types/index.js';

const userService = new UserService();

export class UserController {
  /**
   * Delete user account
   * DELETE /users/:id
   * Body: { password: string }
   * Response: 204 No Content
   */
  async deleteAccount(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { password } = req.body;

      // Validate password provided
      if (!password) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_PASSWORD',
            message: 'Password is required to delete account',
          },
        });
      }

      // Ensure user can only delete their own account
      if (req.user?.userId !== id) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You can only delete your own account',
          },
        });
      }

      // Get IP address and user agent for audit logging
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('user-agent');

      // Perform deletion with transaction
      await userService.deleteAccount(id, password, ipAddress, userAgent);

      // Return 204 No Content on success
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user profile
   * GET /users/:id
   */
  async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      // Ensure user can only view their own profile
      if (req.user?.userId !== id) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You can only view your own profile',
          },
        });
      }

      const profile = await userService.getUserProfile(id);

      const response: APIResponse<any> = {
        success: true,
        data: { user: profile },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user profile
   * PATCH /users/:id
   */
  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Ensure user can only update their own profile
      if (req.user?.userId !== id) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You can only update your own profile',
          },
        });
      }

      const updatedProfile = await userService.updateProfile(id, updateData);

      const response: APIResponse<any> = {
        success: true,
        data: { user: updatedProfile },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Change password
   * POST /users/:id/change-password
   */
  async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { currentPassword, newPassword } = req.body;

      // Ensure user can only change their own password
      if (req.user?.userId !== id) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You can only change your own password',
          },
        });
      }

      // Validate input
      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_FIELDS',
            message: 'Current password and new password are required',
          },
        });
      }

      await userService.changePassword(id, currentPassword, newPassword);

      const response: APIResponse<any> = {
        success: true,
        data: { message: 'Password changed successfully' },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user statistics
   * GET /users/:id/stats
   */
  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      // Ensure user can only view their own stats
      if (req.user?.userId !== id) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You can only view your own statistics',
          },
        });
      }

      const stats = await userService.getUserStats(id);

      const response: APIResponse<any> = {
        success: true,
        data: stats,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
}
