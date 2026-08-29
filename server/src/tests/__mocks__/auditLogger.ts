export interface AuditLogEntry {
  timestamp: string;
  action: string;
  userId: string;
  userEmail?: string;
  status: 'SUCCESS' | 'FAILURE';
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export class AuditLogger {
  static log(entry: AuditLogEntry): void {
    // Mock implementation - do nothing
  }

  static async logAccountDeletion(
    userId: string,
    userEmail: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    // Mock implementation
  }

  static async logAccountDeletionFailure(
    userId: string,
    userEmail: string,
    reason: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    // Mock implementation
  }

  static async logUnauthorizedDeletionAttempt(
    attemptedUserId: string,
    authenticatedUserId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    // Mock implementation
  }

  static async logInvalidPasswordAttempt(
    userId: string,
    userEmail: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    // Mock implementation
  }
}
