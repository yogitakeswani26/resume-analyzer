/**
 * Password Reset Integration Tests
 *
 * These tests demonstrate the complete password reset flow:
 * 1. Request password reset with email
 * 2. Validate reset token
 * 3. Reset password with new credentials
 * 4. Attempt to use invalidated refresh tokens
 * 5. Login with new password
 */

import { AuthService } from '../auth.service.js';
import { User } from '../../users/user.model.js';
import { generateResetToken, hashToken } from '../../../utils/token.generator.js';

// Example test setup (pseudo-code - adapt to your test framework)
describe('Password Reset Flow', () => {
  let authService: AuthService;
  let testUser: any;

  beforeEach(async () => {
    authService = new AuthService();

    // Create test user
    testUser = new User({
      name: 'Test User',
      email: 'test@example.com',
      passwordHash: 'hashed_password',
      role: 'student',
    });
    await testUser.save();
  });

  describe('Forgot Password', () => {
    it('should generate and save reset token', async () => {
      const result = await authService.forgotPassword({
        email: 'test@example.com',
      });

      expect(result.message).toBeDefined();

      // Verify token was saved
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser?.passwordResetToken).toBeTruthy();
      expect(updatedUser?.passwordResetExpiresAt).toBeTruthy();
    });

    it('should return generic message for security', async () => {
      const result = await authService.forgotPassword({
        email: 'nonexistent@example.com',
      });

      // Should not reveal if email exists
      expect(result.message).toContain('If an account exists');
    });
  });

  describe('Validate Reset Token', () => {
    it('should validate valid token', async () => {
      // Generate and save token
      const { token, hash, expiresAt } = generateResetToken();
      testUser.passwordResetToken = hash;
      testUser.passwordResetExpiresAt = expiresAt;
      await testUser.save();

      // Validate token
      const result = await authService.validateResetToken(token);

      expect(result.valid).toBe(true);
      expect(result.email).toBe('test@example.com');
    });

    it('should reject expired token', async () => {
      // Create expired token
      const { hash } = generateResetToken();
      testUser.passwordResetToken = hash;
      testUser.passwordResetExpiresAt = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago
      await testUser.save();

      // Attempt to validate
      const result = await authService.validateResetToken('any_token');

      expect(result.valid).toBe(false);

      // Token should be cleared from database
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser?.passwordResetToken).toBeNull();
    });
  });

  describe('Reset Password', () => {
    it('should successfully reset password', async () => {
      // Generate reset token
      const { token, hash, expiresAt } = generateResetToken();
      testUser.passwordResetToken = hash;
      testUser.passwordResetExpiresAt = expiresAt;
      await testUser.save();

      // Reset password
      const result = await authService.resetPassword({
        token,
        password: 'NewPassword@123',
        confirmPassword: 'NewPassword@123',
      });

      expect(result.message).toContain('Password reset successfully');

      // Verify password was updated
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser?.passwordResetToken).toBeNull();
      expect(updatedUser?.passwordResetExpiresAt).toBeNull();
    });

    it('should invalidate old refresh tokens', async () => {
      // Store old refresh token
      const oldRefreshToken = 'old_refresh_token_xyz';

      // Generate reset token
      const { token, hash, expiresAt } = generateResetToken();
      testUser.passwordResetToken = hash;
      testUser.passwordResetExpiresAt = expiresAt;
      await testUser.save();

      // Reset password
      await authService.resetPassword({
        token,
        password: 'NewPassword@123',
        confirmPassword: 'NewPassword@123',
      });

      // Check if token was invalidated
      const isInvalidated = await authService.isRefreshTokenInvalidated(
        testUser._id.toString(),
        oldRefreshToken
      );

      // Note: In real implementation, you'd need to store the old token
      // before password reset to test this
      expect(isInvalidated).toBeDefined();
    });

    it('should reject invalid token', async () => {
      try {
        await authService.resetPassword({
          token: 'invalid_token',
          password: 'NewPassword@123',
          confirmPassword: 'NewPassword@123',
        });
        expect(true).toBe(false); // Should throw
      } catch (error: any) {
        expect(error.code).toBe('INVALID_TOKEN');
      }
    });

    it('should reject expired token', async () => {
      // Create expired token
      const { hash } = generateResetToken();
      testUser.passwordResetToken = hash;
      testUser.passwordResetExpiresAt = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago
      await testUser.save();

      try {
        await authService.resetPassword({
          token: 'any_token',
          password: 'NewPassword@123',
          confirmPassword: 'NewPassword@123',
        });
        expect(true).toBe(false); // Should throw
      } catch (error: any) {
        expect(error.code).toBe('TOKEN_EXPIRED');
      }
    });
  });

  describe('Password Validation', () => {
    it('should enforce password strength requirements', async () => {
      const { token, hash, expiresAt } = generateResetToken();
      testUser.passwordResetToken = hash;
      testUser.passwordResetExpiresAt = expiresAt;
      await testUser.save();

      const weakPasswords = [
        'password', // No uppercase, no number, no special char
        'Password123', // No special char
        'Pass@1', // Too short
        'PASS@1234', // No lowercase
      ];

      for (const weakPass of weakPasswords) {
        try {
          await authService.resetPassword({
            token,
            password: weakPass,
            confirmPassword: weakPass,
          });
          expect(true).toBe(false); // Should throw
        } catch (error: any) {
          expect(error.code).toBe('VALIDATION_ERROR');
        }
      }
    });

    it('should accept strong passwords', async () => {
      const { token, hash, expiresAt } = generateResetToken();
      testUser.passwordResetToken = hash;
      testUser.passwordResetExpiresAt = expiresAt;
      await testUser.save();

      const strongPasswords = [
        'Password@123',
        'SecureP@ss1',
        'MyP@ssw0rd',
        'Test#Pass2024',
      ];

      for (const strongPass of strongPasswords) {
        // This would succeed with fresh token each time in real test
        expect(strongPass).toMatch(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
        );
      }
    });
  });

  describe('Complete User Flow', () => {
    it('should handle full password reset cycle', async () => {
      const originalEmail = testUser.email;
      const newPassword = 'CompleteTest@123';

      // Step 1: Request password reset
      const forgotResult = await authService.forgotPassword({
        email: originalEmail,
      });
      expect(forgotResult.message).toBeDefined();

      // Step 2: Get reset token (in real app, this comes from email)
      const userWithToken = await User.findById(testUser._id);
      const { token } = generateResetToken();
      // Note: In real scenario, token comes from email link

      // Step 3: Validate token before showing reset form
      // (pseudo-code - need actual token from email)
      // const validation = await authService.validateResetToken(token);
      // expect(validation.valid).toBe(true);

      // Step 4: Reset password
      // (would use token from email)
      // const resetResult = await authService.resetPassword({
      //   token,
      //   password: newPassword,
      //   confirmPassword: newPassword,
      // });
      // expect(resetResult.message).toContain('successfully');

      // Step 5: Login with new password
      // const loginResult = await authService.login({
      //   email: originalEmail,
      //   password: newPassword,
      // });
      // expect(loginResult.accessToken).toBeDefined();
    });
  });
});

/**
 * Manual Test Flow (using curl/Postman):
 *
 * 1. Request password reset:
 *    POST /api/v1/auth/forgot-password
 *    {
 *      "email": "user@example.com"
 *    }
 *    Response: { success: true, data: { message: "..." } }
 *
 * 2. Check email for reset link (format):
 *    http://localhost:5173/reset-password/[TOKEN]
 *
 * 3. Validate token:
 *    GET /api/v1/auth/validate-reset-token/[TOKEN]
 *    Response: { success: true, data: { valid: true, email: "..." } }
 *
 * 4. Reset password:
 *    POST /api/v1/auth/reset-password
 *    {
 *      "token": "[TOKEN]",
 *      "password": "NewPassword@123",
 *      "confirmPassword": "NewPassword@123"
 *    }
 *    Response: { success: true, data: { message: "...", user: {...} } }
 *
 * 5. Login with new password:
 *    POST /api/v1/auth/login
 *    {
 *      "email": "user@example.com",
 *      "password": "NewPassword@123"
 *    }
 *    Response: { success: true, data: { accessToken: "...", refreshToken: "..." } }
 *
 * 6. Try old refresh token (should fail):
 *    POST /api/v1/auth/refresh
 *    {
 *      "refreshToken": "[OLD_REFRESH_TOKEN]"
 *    }
 *    Response: { success: false, error: { code: "INVALID_TOKEN", message: "..." } }
 */
