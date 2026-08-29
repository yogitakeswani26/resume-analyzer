export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RefreshTokenInput {
  refreshToken: string;
}

export interface ForgotPasswordInput {
  email: string;
}

export interface ResetPasswordInput {
  token: string;
  password: string;
  confirmPassword: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Password strength validation:
// - At least 8 characters
// - At least one uppercase letter
// - At least one lowercase letter
// - At least one number
// - At least one special character
const PASSWORD_STRENGTH_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export function validatePasswordStrength(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!password) errors.push('Password is required');
  if (password.length < 8) errors.push('Password must be at least 8 characters');
  if (!/[A-Z]/.test(password)) errors.push('Password must contain at least one uppercase letter');
  if (!/[a-z]/.test(password)) errors.push('Password must contain at least one lowercase letter');
  if (!/\d/.test(password)) errors.push('Password must contain at least one number');
  if (!/[@$!%*?&]/.test(password)) errors.push('Password must contain at least one special character (@$!%*?&)');
  return { valid: errors.length === 0, errors };
}

export function validateRegister(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!data.name || data.name.length < 2) errors.push('Name must be at least 2 characters');
  if (!data.email || !EMAIL_REGEX.test(data.email.trim())) errors.push('Invalid email format');

  if (data.password) {
    const passwordValidation = validatePasswordStrength(data.password);
    if (!passwordValidation.valid) {
      errors.push(...passwordValidation.errors);
    }
  } else {
    errors.push('Password is required');
  }

  return { valid: errors.length === 0, errors };
}

export function validateLogin(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!data.email || !EMAIL_REGEX.test(data.email.trim())) errors.push('Invalid email format');
  if (!data.password) errors.push('Password required');
  return { valid: errors.length === 0, errors };
}

export function validateRefreshToken(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!data.refreshToken) errors.push('Refresh token required');
  return { valid: errors.length === 0, errors };
}

export function validateForgotPassword(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!data.email || !EMAIL_REGEX.test(data.email.trim())) errors.push('Invalid email format');
  return { valid: errors.length === 0, errors };
}

export function validateResetPassword(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!data.token) errors.push('Reset token is required');
  if (!data.password) errors.push('Password is required');
  if (!data.confirmPassword) errors.push('Password confirmation is required');
  if (data.password !== data.confirmPassword) errors.push('Passwords do not match');

  // Validate password strength
  if (data.password) {
    const passwordValidation = validatePasswordStrength(data.password);
    if (!passwordValidation.valid) {
      errors.push(...passwordValidation.errors);
    }
  }

  return { valid: errors.length === 0, errors };
}
