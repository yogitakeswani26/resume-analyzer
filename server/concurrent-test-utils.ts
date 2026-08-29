/**
 * Concurrent Operations Test Utilities
 *
 * Helper functions and utilities for concurrent testing
 */

import crypto from 'crypto';

/**
 * Generate unique email for testing
 */
export function generateUniqueEmail(prefix: string = 'test'): string {
  return `${prefix}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}@test.example.com`;
}

/**
 * Generate unique username for testing
 */
export function generateUniqueUsername(prefix: string = 'user'): string {
  return `${prefix}-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
}

/**
 * Sleep function for delays
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry logic for flaky operations
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number;
    delayMs?: number;
    backoffMultiplier?: number;
    onRetry?: (attempt: number, error: Error) => void;
  } = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    delayMs = 100,
    backoffMultiplier = 2,
    onRetry,
  } = options;

  let lastError: Error | null = null;
  let delay = delayMs;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (onRetry) {
        onRetry(attempt, lastError);
      }

      if (attempt < maxAttempts) {
        await sleep(delay);
        delay *= backoffMultiplier;
      }
    }
  }

  throw lastError || new Error('All retry attempts failed');
}

/**
 * Batch array into chunks
 */
export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Execute operations with concurrency limit
 */
export async function executeWithConcurrencyLimit<T>(
  operations: Array<() => Promise<T>>,
  concurrencyLimit: number,
  onProgress?: (completed: number, total: number) => void
): Promise<T[]> {
  const results: T[] = [];
  const chunks = chunk(operations, concurrencyLimit);

  for (const chunkOperations of chunks) {
    const chunkResults = await Promise.all(
      chunkOperations.map(op => op())
    );
    results.push(...chunkResults);

    if (onProgress) {
      onProgress(results.length, operations.length);
    }
  }

  return results;
}

/**
 * Measure operation performance
 */
export interface PerformanceMetrics {
  duration: number;
  successCount: number;
  failureCount: number;
  throughput: number; // operations per second
  minDuration: number;
  maxDuration: number;
  avgDuration: number;
}

export async function measurePerformance<T>(
  operations: Array<() => Promise<T>>,
  options: { concurrency?: number } = {}
): Promise<{ results: T[]; metrics: PerformanceMetrics }> {
  const { concurrency = 5 } = options;
  const startTime = Date.now();
  const operationDurations: number[] = [];

  const instrumentedOps = operations.map(op => async () => {
    const opStart = Date.now();
    try {
      const result = await op();
      operationDurations.push(Date.now() - opStart);
      return result;
    } catch (error) {
      operationDurations.push(Date.now() - opStart);
      throw error;
    }
  });

  const results = await executeWithConcurrencyLimit(instrumentedOps, concurrency);
  const duration = Date.now() - startTime;

  const successCount = results.filter(r => r !== undefined && r !== null).length;
  const failureCount = results.length - successCount;
  const avgDuration = operationDurations.reduce((a, b) => a + b, 0) / operationDurations.length;
  const minDuration = Math.min(...operationDurations);
  const maxDuration = Math.max(...operationDurations);

  return {
    results,
    metrics: {
      duration,
      successCount,
      failureCount,
      throughput: (operations.length / duration) * 1000,
      minDuration,
      maxDuration,
      avgDuration,
    },
  };
}

/**
 * Calculate statistics from array of numbers
 */
export interface Statistics {
  min: number;
  max: number;
  mean: number;
  median: number;
  stdDev: number;
  p95: number;
  p99: number;
}

export function calculateStatistics(values: number[]): Statistics {
  if (values.length === 0) {
    throw new Error('Cannot calculate statistics from empty array');
  }

  const sorted = [...values].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const mean = values.reduce((a, b) => a + b, 0) / values.length;

  const median = sorted.length % 2 === 0
    ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
    : sorted[Math.floor(sorted.length / 2)];

  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);

  const p95Index = Math.ceil(sorted.length * 0.95) - 1;
  const p99Index = Math.ceil(sorted.length * 0.99) - 1;

  return {
    min,
    max,
    mean,
    median,
    stdDev,
    p95: sorted[p95Index] || max,
    p99: sorted[p99Index] || max,
  };
}

/**
 * Format bytes to human readable format
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Format duration to human readable format
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
  if (ms < 3600000) return `${(ms / 60000).toFixed(2)}m`;
  return `${(ms / 3600000).toFixed(2)}h`;
}

/**
 * Create test report
 */
export interface TestReport {
  name: string;
  timestamp: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  duration: number;
  tests: {
    name: string;
    status: 'PASS' | 'FAIL' | 'WARN';
    duration: number;
    message: string;
  }[];
  metrics?: {
    [key: string]: any;
  };
}

export function createTestReport(name: string, tests: TestReport['tests'], metrics?: any): TestReport {
  return {
    name,
    timestamp: new Date().toISOString(),
    status: tests.some(t => t.status === 'FAIL') ? 'FAIL' : tests.some(t => t.status === 'WARN') ? 'WARN' : 'PASS',
    duration: tests.reduce((sum, t) => sum + t.duration, 0),
    tests,
    metrics,
  };
}

/**
 * Check if response indicates rate limiting
 */
export function isRateLimited(status: number): boolean {
  return status === 429;
}

/**
 * Check if response indicates conflict (duplicate)
 */
export function isConflict(status: number): boolean {
  return status === 409;
}

/**
 * Check if response is successful
 */
export function isSuccess(status: number): boolean {
  return status >= 200 && status < 300;
}

/**
 * Check if response is unauthorized
 */
export function isUnauthorized(status: number): boolean {
  return status === 401;
}

/**
 * Check if response is forbidden
 */
export function isForbidden(status: number): boolean {
  return status === 403;
}

/**
 * Check if response indicates validation error
 */
export function isValidationError(status: number): boolean {
  return status === 400;
}

/**
 * Concurrent operation executor with detailed logging
 */
export class ConcurrentExecutor {
  private operationCount = 0;
  private completedCount = 0;
  private failedCount = 0;
  private startTime = Date.now();

  constructor(private logFn: (message: string) => void = console.log) {}

  async executeOperation<T>(
    id: string,
    operation: () => Promise<T>
  ): Promise<{ id: string; result: T; error?: Error; duration: number }> {
    const startTime = Date.now();
    this.operationCount++;

    try {
      const result = await operation();
      this.completedCount++;
      const duration = Date.now() - startTime;
      this.logFn(`✓ ${id} completed in ${duration}ms`);
      return { id, result, duration };
    } catch (error) {
      this.failedCount++;
      const duration = Date.now() - startTime;
      this.logFn(`✗ ${id} failed after ${duration}ms: ${error instanceof Error ? error.message : String(error)}`);
      return { id, result: undefined as any, error: error as Error, duration };
    }
  }

  async executeAll<T>(
    operations: { id: string; operation: () => Promise<T> }[],
    concurrency: number = 5
  ): Promise<Array<{ id: string; result?: T; error?: Error; duration: number }>> {
    const operationFns = operations.map(op => () => this.executeOperation(op.id, op.operation));
    return executeWithConcurrencyLimit(operationFns, concurrency);
  }

  getProgress(): { completed: number; failed: number; total: number; percentage: number } {
    return {
      completed: this.completedCount,
      failed: this.failedCount,
      total: this.operationCount,
      percentage: this.operationCount > 0 ? (this.completedCount / this.operationCount) * 100 : 0,
    };
  }

  getSummary(): {
    totalDuration: number;
    totalOperations: number;
    successCount: number;
    failureCount: number;
    successRate: number;
    averageDuration: number;
  } {
    const totalDuration = Date.now() - this.startTime;
    const successCount = this.completedCount;
    const failureCount = this.failedCount;
    const totalOps = this.operationCount;

    return {
      totalDuration,
      totalOperations: totalOps,
      successCount,
      failureCount,
      successRate: totalOps > 0 ? (successCount / totalOps) * 100 : 0,
      averageDuration: totalOps > 0 ? totalDuration / totalOps : 0,
    };
  }
}
