import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { User } from './user.model.js';
import { Resume } from '../resumes/resume.model.js';
import { Analysis } from '../analysis/analysis.model.js';
import { AppError } from '../../middleware/error.middleware.js';
import { AuditLogger } from '../../utils/auditLogger.js';
import { IUser } from '../../types/index.js';

export class UserService {
  /**
   * Delete user account with all related data
   * Note: Uses individual operations instead of transactions due to MongoDB standalone limitations
   * @param userId - The ID of the user to delete
   * @param password - The user's password for confirmation
   * @param ipAddress - Optional IP address for audit logging
   * @param userAgent - Optional user agent for audit logging
   * @throws AppError if password is invalid or user not found
   */
  async deleteAccount(
    userId: string,
    password: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    // Validate inputs
    if (!userId || !password) {
      throw new AppError('INVALID_INPUT', 'User ID and password are required', 400);
    }

    try {
      // 1. Find and verify user exists
      const user = await User.findById(userId);
      if (!user) {
        throw new AppError('USER_NOT_FOUND', 'User not found', 404);
      }

      // 2. Verify password
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        // Log failed attempt
        await AuditLogger.logInvalidPasswordAttempt(
          userId,
          user.email,
          ipAddress,
          userAgent
        );
        throw new AppError('INVALID_PASSWORD', 'Invalid password', 401);
      }

      // 3. Delete all analyses related to this user
      const deleteAnalysisResult = await Analysis.deleteMany({ userId });

      // 4. Delete all resumes related to this user
      const deleteResumeResult = await Resume.deleteMany({ userId });

      // 5. Delete the user account
      const deleteUserResult = await User.deleteOne({ _id: userId });

      if (deleteUserResult.deletedCount === 0) {
        throw new AppError('DELETION_FAILED', 'Failed to delete user account', 500);
      }

      // 6. Log successful deletion
      await AuditLogger.logAccountDeletion(userId, user.email, ipAddress, userAgent);

    } catch (error) {
      // If it's already an AppError, rethrow it
      if (error instanceof AppError) {
        throw error;
      }

      // Log unexpected errors
      try {
        const user = await User.findById(userId);
        if (user) {
          await AuditLogger.logAccountDeletionFailure(
            userId,
            user.email,
            error instanceof Error ? error.message : 'Unknown error',
            ipAddress,
            userAgent
          );
        }
      } catch (auditError) {
        // Audit logging failed - log to stderr silently
      }
      throw new AppError(
        'DELETION_ERROR',
        'Failed to delete account. Please try again later.',
        500
      );
    }
  }

  /**
   * Get user profile (basic info without sensitive data)
   */
  async getUserProfile(userId: string): Promise<Partial<IUser>> {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('USER_NOT_FOUND', 'User not found', 404);
    }
    return user.toJSON();
  }

  /**
   * Update user profile (name, location, bio, email, etc.)
   */
  async updateProfile(
    userId: string,
    updateData: Partial<IUser>
  ): Promise<Partial<IUser>> {
    // Don't allow updating password through this method
    const { passwordHash, ...safeData } = updateData;

    // If email is being updated, check for uniqueness (excluding current user)
    if (safeData.email) {
      const existingUser = await User.findOne({
        email: safeData.email.toLowerCase().trim(),
        _id: { $ne: userId },
      });

      if (existingUser) {
        throw new AppError(
          'EMAIL_DUPLICATE',
          'Email already in use by another user',
          409
        );
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(safeData.email)) {
        throw new AppError('INVALID_EMAIL', 'Invalid email format', 400);
      }

      safeData.email = safeData.email.toLowerCase().trim();
    }

    // Validate name if provided
    if (safeData.name !== undefined && safeData.name) {
      safeData.name = (safeData.name as string).trim();
      if (!safeData.name) {
        throw new AppError(
          'INVALID_NAME',
          'Name cannot be empty',
          400
        );
      }
    }

    const user = await User.findByIdAndUpdate(userId, safeData, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      throw new AppError('USER_NOT_FOUND', 'User not found', 404);
    }

    return user.toJSON();
  }

  /**
   * Change password
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    if (!currentPassword || !newPassword) {
      throw new AppError('INVALID_INPUT', 'Current and new passwords are required', 400);
    }

    if (newPassword.length < 8) {
      throw new AppError('WEAK_PASSWORD', 'Password must be at least 8 characters', 400);
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('USER_NOT_FOUND', 'User not found', 404);
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isPasswordValid) {
      throw new AppError('INVALID_PASSWORD', 'Current password is incorrect', 401);
    }

    // Hash and save new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    user.passwordHash = newPasswordHash;

    try {
      await user.save();
    } catch (error: any) {
      console.error('Error saving password:', error);
      throw new AppError('PASSWORD_UPDATE_FAILED', 'Failed to update password', 500);
    }
  }

  /**
   * Get user statistics (useful for dashboard)
   */
  async getUserStats(userId: string): Promise<{
    resumeCount: number;
    analysisCount: number;
    createdAt: Date | undefined;
  }> {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('USER_NOT_FOUND', 'User not found', 404);
    }

    const [resumeCount, analysisCount] = await Promise.all([
      Resume.countDocuments({ userId }),
      Analysis.countDocuments({ userId }),
    ]);

    return {
      resumeCount,
      analysisCount,
      createdAt: user.createdAt,
    };
  }
}
