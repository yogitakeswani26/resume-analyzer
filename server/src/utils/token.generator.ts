import crypto from 'crypto';

/**
 * Generate a cryptographically secure reset token
 * Returns both the token and its hash for database storage
 */
export function generateResetToken(): {
  token: string;
  hash: string;
  expiresAt: Date;
} {
  // Generate a random 32-byte token
  const token = crypto.randomBytes(32).toString('hex');

  // Hash the token for storage (one-way hashing)
  const hash = crypto.createHash('sha256').update(token).digest('hex');

  // Set expiry to 1 hour from now
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  return {
    token,
    hash,
    expiresAt,
  };
}

/**
 * Hash a token for comparison (used when resetting password)
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Verify token hasn't expired
 */
export function isTokenExpired(expiresAt: Date | null | undefined): boolean {
  if (!expiresAt) return true;
  return new Date() > expiresAt;
}
