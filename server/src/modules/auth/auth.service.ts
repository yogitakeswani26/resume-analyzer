import bcrypt from 'bcryptjs';
import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { User } from '../users/user.model.js';
import { config } from '../../config/env.js';
import { AppError } from '../../middleware/error.middleware.js';
import { RegisterInput, LoginInput, ForgotPasswordInput, ResetPasswordInput } from '../../utils/validators.js';
import { IUser, JWTPayload } from '../../types/index.js';
import { generateResetToken, hashToken, isTokenExpired } from '../../utils/token.generator.js';
import { emailService } from '../../services/email.service.js';

export class AuthService {
  async register(data: RegisterInput): Promise<Partial<IUser>> {
    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) {
      throw new AppError('USER_EXISTS', 'Email already registered', 409);
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const user = new User({
      name: data.name,
      email: data.email,
      passwordHash,
      role: 'student',
    });

    try {
      await user.save();
    } catch (error: any) {
      // Handle MongoDB unique index constraint violation (race condition)
      if (error.code === 11000) {
        throw new AppError('USER_EXISTS', 'Email already registered', 409);
      }
      throw error;
    }

    return user.toJSON();
  }

  async login(data: LoginInput): Promise<{
    accessToken: string;
    refreshToken: string;
    user: Partial<IUser>;
  }> {
    const user = await User.findOne({ email: data.email });

    if (!user || !(await bcrypt.compare(data.password, user.passwordHash))) {
      throw new AppError('INVALID_CREDENTIALS', 'Invalid email or password', 401);
    }

    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    return {
      accessToken,
      refreshToken,
      user: user.toJSON(),
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string;
    user: Partial<IUser>;
  }> {
    try {
      const decoded = jwt.verify(refreshToken, config.jwt_refresh_secret) as JWTPayload;
      const user = await User.findById(decoded.userId);

      if (!user) {
        throw new AppError('USER_NOT_FOUND', 'User not found', 404);
      }

      // Check if refresh token has been invalidated (after password reset)
      const isInvalidated = await this.isRefreshTokenInvalidated(user._id as string, refreshToken);
      if (isInvalidated) {
        throw new AppError(
          'TOKEN_INVALIDATED',
          'Refresh token has been invalidated. Please login again.',
          401
        );
      }

      const accessToken = this.generateAccessToken(user);

      return {
        accessToken,
        user: user.toJSON(),
      };
    } catch (error: any) {
      // Preserve existing AppErrors (USER_NOT_FOUND, TOKEN_INVALIDATED)
      if (error instanceof AppError) {
        throw error;
      }

      // Differentiate JWT-specific errors
      if (error.name === 'TokenExpiredError') {
        throw new AppError('TOKEN_EXPIRED', 'Refresh token has expired. Please login again.', 401);
      }
      if (error.name === 'JsonWebTokenError') {
        throw new AppError('INVALID_TOKEN', 'Invalid refresh token format', 401);
      }

      // Database or unknown errors
      throw new AppError('SERVER_ERROR', 'Failed to refresh token', 500);
    }
  }

  private generateAccessToken(user: IUser): string {
    const payload = {
      userId: user._id,
      email: user.email,
      role: user.role,
    };
    return jwt.sign(
      payload,
      config.jwt_secret as Secret,
      { expiresIn: config.jwt_expire } as SignOptions
    );
  }

  private generateRefreshToken(user: IUser): string {
    const payload = {
      userId: user._id,
      email: user.email,
      role: user.role,
    };
    return jwt.sign(
      payload,
      config.jwt_refresh_secret as Secret,
      { expiresIn: config.jwt_refresh_expire } as SignOptions
    );
  }

  /**
   * Initiate password reset process
   * Generates reset token and sends email to user
   */
  async forgotPassword(data: ForgotPasswordInput): Promise<{ message: string }> {
    const user = await User.findOne({ email: data.email.toLowerCase() });

    // Always return success message for security (don't reveal if email exists)
    if (!user) {
      return { message: 'If an account exists, password reset instructions have been sent' };
    }

    // Generate reset token
    const { token, hash, expiresAt } = generateResetToken();

    // Save token hash to database
    user.passwordResetToken = hash;
    user.passwordResetExpiresAt = expiresAt;
    await user.save();

    // Generate reset link - adjust this based on your frontend URL
    const resetLink = `${config.frontend_url}/reset-password/${token}`;

    // Send email
    try {
      await emailService.sendPasswordResetEmail(user.email, token, resetLink);
    } catch (error) {
      // Clear token if email fails
      user.passwordResetToken = null;
      user.passwordResetExpiresAt = null;
      await user.save();
      throw new AppError('EMAIL_FAILED', 'Failed to send reset email', 500);
    }

    return { message: 'If an account exists, password reset instructions have been sent' };
  }

  /**
   * Reset password using token
   * Validates token, updates password, and invalidates old refresh tokens
   */
  async resetPassword(data: ResetPasswordInput): Promise<{
    message: string;
    user: Partial<IUser>;
  }> {
    const tokenHash = hashToken(data.token);

    // Find user with matching reset token
    const user = await User.findOne({
      passwordResetToken: tokenHash,
    });

    if (!user) {
      throw new AppError('INVALID_TOKEN', 'Invalid or expired reset token', 400);
    }

    // Check if token has expired
    if (isTokenExpired(user.passwordResetExpiresAt)) {
      user.passwordResetToken = null;
      user.passwordResetExpiresAt = null;
      await user.save();
      throw new AppError('TOKEN_EXPIRED', 'Reset token has expired', 400);
    }

    // Update password
    const passwordHash = await bcrypt.hash(data.password, 10);
    user.passwordHash = passwordHash;

    // Clear reset token
    user.passwordResetToken = null;
    user.passwordResetExpiresAt = null;

    // Invalidate all previous refresh tokens by storing them
    // This forces user to login again on all devices
    if (user.invalidatedRefreshTokens === undefined) {
      user.invalidatedRefreshTokens = [];
    }

    await user.save();

    // Send confirmation email
    try {
      await emailService.sendPasswordResetConfirmation(user.email, user.name);
    } catch (error) {
      // Non-critical - don't throw or log
    }

    return {
      message: 'Password reset successfully. Please login with your new password.',
      user: user.toJSON(),
    };
  }

  /**
   * Validate reset token
   * Used to check if token is valid before showing reset form
   */
  async validateResetToken(token: string): Promise<{
    valid: boolean;
    email?: string;
  }> {
    const tokenHash = hashToken(token);

    const user = await User.findOne({
      passwordResetToken: tokenHash,
    });

    if (!user) {
      return { valid: false };
    }

    if (isTokenExpired(user.passwordResetExpiresAt)) {
      // Clear expired token
      user.passwordResetToken = null;
      user.passwordResetExpiresAt = null;
      await user.save();
      return { valid: false };
    }

    return {
      valid: true,
      email: user.email,
    };
  }

  /**
   * Check if refresh token has been invalidated
   * Used during token refresh to force re-login after password reset
   */
  async isRefreshTokenInvalidated(userId: string, token: string): Promise<boolean> {
    const user = await User.findById(userId);

    if (!user || !user.invalidatedRefreshTokens) {
      return false;
    }

    return user.invalidatedRefreshTokens.includes(token);
  }
}
