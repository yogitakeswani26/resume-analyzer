import fs from 'fs';
import path from 'path';

let logsDir: string;

// Initialize logs directory lazily to avoid issues in test environments
function initializeLogsDir(): string {
  if (!logsDir) {
    // Use process.cwd() to get the project root directory
    // In test environments and production, this will resolve correctly
    const projectRoot = process.cwd();
    logsDir = path.join(projectRoot, 'logs');

    // Ensure logs directory exists
    if (!fs.existsSync(logsDir)) {
      try {
        fs.mkdirSync(logsDir, { recursive: true });
      } catch (error) {
        // In test environments, logs directory might not be writable, ignore error
        if (process.env.NODE_ENV !== 'test') {
          console.error('Failed to create logs directory:', error);
        }
      }
    }
  }
  return logsDir;
}

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
    try {
      const logsDirectory = initializeLogsDir();
      const auditLogFile = path.join(logsDirectory, 'audit.log');

      const logEntry = {
        ...entry,
        timestamp: new Date().toISOString(),
      };

      const logLine = JSON.stringify(logEntry) + '\n';
      fs.appendFileSync(auditLogFile, logLine, 'utf8');

      // Also log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`[AUDIT] ${logEntry.action} - User: ${logEntry.userId} - Status: ${logEntry.status}`);
      }
    } catch (error) {
      console.error('Error writing to audit log:', error);
    }
  }

  static async logAccountDeletion(
    userId: string,
    userEmail: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    this.log({
      timestamp: new Date().toISOString(),
      action: 'ACCOUNT_DELETION',
      userId,
      userEmail,
      status: 'SUCCESS',
      details: {
        action: 'User account and all associated data deleted',
        dataDeleted: {
          user: 'User account',
          resumes: 'All user resumes',
          analyses: 'All analysis records',
        },
      },
      ipAddress,
      userAgent,
    });
  }

  static async logAccountDeletionFailure(
    userId: string,
    userEmail: string,
    reason: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    this.log({
      timestamp: new Date().toISOString(),
      action: 'ACCOUNT_DELETION_FAILED',
      userId,
      userEmail,
      status: 'FAILURE',
      details: {
        reason,
      },
      ipAddress,
      userAgent,
    });
  }

  static async logUnauthorizedDeletionAttempt(
    attemptedUserId: string,
    authenticatedUserId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    this.log({
      timestamp: new Date().toISOString(),
      action: 'UNAUTHORIZED_DELETION_ATTEMPT',
      userId: authenticatedUserId,
      status: 'FAILURE',
      details: {
        reason: 'User attempted to delete another user account',
        attemptedTargetUserId: attemptedUserId,
      },
      ipAddress,
      userAgent,
    });
  }

  static async logInvalidPasswordAttempt(
    userId: string,
    userEmail: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    this.log({
      timestamp: new Date().toISOString(),
      action: 'INVALID_PASSWORD_FOR_DELETION',
      userId,
      userEmail,
      status: 'FAILURE',
      details: {
        reason: 'Invalid password provided for account deletion',
      },
      ipAddress,
      userAgent,
    });
  }
}
