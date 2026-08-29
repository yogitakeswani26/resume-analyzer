/**
 * Concurrent Operations Test Configuration
 *
 * Centralized configuration for all concurrent testing scenarios
 */

export interface ConcurrentTestConfig {
  // Server configuration
  baseURL: string;
  timeout: number;
  retryAttempts: number;

  // Test scenarios
  scenarios: {
    basicConcurrency: {
      enabled: boolean;
      concurrencyLevel: number;
      description: string;
    };
    rateLimiting: {
      enabled: boolean;
      requestsPerTest: number;
      description: string;
    };
    duplicatePrevention: {
      enabled: boolean;
      concurrencyLevel: number;
      description: string;
    };
    highConcurrency: {
      enabled: boolean;
      concurrencyLevel: number;
      description: string;
    };
    bulkOperations: {
      enabled: boolean;
      operationsCount: number;
      description: string;
    };
    authenticatedAccess: {
      enabled: boolean;
      concurrencyLevel: number;
      description: string;
    };
  };

  // Rate limiting expectations
  rateLimits: {
    register: {
      windowMs: number;
      maxRequests: number;
      expectedHttpStatus: number;
    };
    login: {
      windowMs: number;
      maxRequests: number;
      expectedHttpStatus: number;
    };
    refresh: {
      windowMs: number;
      maxRequests: number;
      expectedHttpStatus: number;
    };
    passwordReset: {
      windowMs: number;
      maxRequests: number;
      expectedHttpStatus: number;
    };
  };

  // Test credentials
  credentials: {
    password: string;
    passwordRequirements: {
      minLength: number;
      requireUppercase: boolean;
      requireLowercase: boolean;
      requireNumbers: boolean;
      requireSpecialChars: boolean;
    };
  };

  // Performance thresholds
  performance: {
    maxResponseTimeMs: number;
    minThroughputPerSecond: number;
    timeoutMs: number;
  };

  // Database configuration
  database: {
    testDatabase: string;
    cleanupAfterTests: boolean;
    connectionTimeout: number;
  };

  // Reporting
  reporting: {
    verboseLogging: boolean;
    captureMetrics: boolean;
    metricsFile: string;
    failOnWarnings: boolean;
  };
}

/**
 * Default configuration for concurrent operations tests
 */
export const defaultConfig: ConcurrentTestConfig = {
  baseURL: process.env.API_BASE_URL || 'http://localhost:3000/api/v1',
  timeout: 30000,
  retryAttempts: 0,

  scenarios: {
    basicConcurrency: {
      enabled: true,
      concurrencyLevel: 5,
      description: 'Test 5 concurrent user registrations',
    },
    rateLimiting: {
      enabled: true,
      requestsPerTest: 15,
      description: 'Test rate limiting enforcement',
    },
    duplicatePrevention: {
      enabled: true,
      concurrencyLevel: 5,
      description: 'Test duplicate email prevention with race conditions',
    },
    highConcurrency: {
      enabled: true,
      concurrencyLevel: 20,
      description: 'Test 20 concurrent registrations (stress test)',
    },
    bulkOperations: {
      enabled: true,
      operationsCount: 10,
      description: 'Test bulk operations (logins, refreshes)',
    },
    authenticatedAccess: {
      enabled: true,
      concurrencyLevel: 5,
      description: 'Test concurrent authenticated access',
    },
  },

  rateLimits: {
    register: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 5,
      expectedHttpStatus: 429,
    },
    login: {
      windowMs: 15 * 60 * 1000,
      maxRequests: 10,
      expectedHttpStatus: 429,
    },
    refresh: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 20,
      expectedHttpStatus: 429,
    },
    passwordReset: {
      windowMs: 15 * 60 * 1000,
      maxRequests: 3,
      expectedHttpStatus: 429,
    },
  },

  credentials: {
    password: 'TestPassword@12345',
    passwordRequirements: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: false,
    },
  },

  performance: {
    maxResponseTimeMs: 5000, // 5 seconds
    minThroughputPerSecond: 2, // 2 requests/second minimum
    timeoutMs: 30000, // 30 seconds total timeout
  },

  database: {
    testDatabase: process.env.MONGODB_URI || 'mongodb://localhost:27017/resume-analyzer-test',
    cleanupAfterTests: true,
    connectionTimeout: 10000,
  },

  reporting: {
    verboseLogging: process.env.VERBOSE_LOGGING === 'true',
    captureMetrics: true,
    metricsFile: './concurrent-test-metrics.json',
    failOnWarnings: false,
  },
};

/**
 * Get configuration with environment variable overrides
 */
export function getConfig(overrides?: Partial<ConcurrentTestConfig>): ConcurrentTestConfig {
  const config = { ...defaultConfig, ...overrides };

  // Apply environment variable overrides
  if (process.env.CONCURRENCY_LEVEL) {
    config.scenarios.basicConcurrency.concurrencyLevel = parseInt(process.env.CONCURRENCY_LEVEL, 10);
    config.scenarios.highConcurrency.concurrencyLevel = parseInt(process.env.CONCURRENCY_LEVEL, 10);
  }

  if (process.env.API_BASE_URL) {
    config.baseURL = process.env.API_BASE_URL;
  }

  if (process.env.TEST_TIMEOUT) {
    config.timeout = parseInt(process.env.TEST_TIMEOUT, 10);
  }

  return config;
}

/**
 * Validate configuration
 */
export function validateConfig(config: ConcurrentTestConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config.baseURL) {
    errors.push('baseURL is required');
  }

  if (config.timeout < 1000) {
    errors.push('timeout should be at least 1000ms');
  }

  if (config.credentials.password.length < config.credentials.passwordRequirements.minLength) {
    errors.push('Test password does not meet minimum length requirement');
  }

  if (config.performance.maxResponseTimeMs < 100) {
    errors.push('maxResponseTimeMs should be at least 100ms');
  }

  Object.entries(config.scenarios).forEach(([key, scenario]) => {
    if (scenario.enabled && scenario.concurrencyLevel < 1) {
      errors.push(`${key}.concurrencyLevel must be at least 1`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Test scenarios based on configuration
 */
export const testScenarios = {
  // Lightweight test for quick validation
  QUICK: {
    ...defaultConfig,
    scenarios: {
      ...defaultConfig.scenarios,
      basicConcurrency: { ...defaultConfig.scenarios.basicConcurrency, concurrencyLevel: 3 },
      highConcurrency: { ...defaultConfig.scenarios.highConcurrency, concurrencyLevel: 5 },
      bulkOperations: { ...defaultConfig.scenarios.bulkOperations, operationsCount: 3 },
    },
  },

  // Standard test for normal validation
  STANDARD: defaultConfig,

  // Comprehensive test for thorough validation
  COMPREHENSIVE: {
    ...defaultConfig,
    scenarios: {
      ...defaultConfig.scenarios,
      basicConcurrency: { ...defaultConfig.scenarios.basicConcurrency, concurrencyLevel: 10 },
      highConcurrency: { ...defaultConfig.scenarios.highConcurrency, concurrencyLevel: 50 },
      bulkOperations: { ...defaultConfig.scenarios.bulkOperations, operationsCount: 25 },
      rateLimiting: { ...defaultConfig.scenarios.rateLimiting, requestsPerTest: 30 },
    },
    timeout: 60000,
  },

  // Stress test for maximum load
  STRESS: {
    ...defaultConfig,
    scenarios: {
      ...defaultConfig.scenarios,
      basicConcurrency: { ...defaultConfig.scenarios.basicConcurrency, concurrencyLevel: 50 },
      highConcurrency: { ...defaultConfig.scenarios.highConcurrency, concurrencyLevel: 100 },
      bulkOperations: { ...defaultConfig.scenarios.bulkOperations, operationsCount: 50 },
      rateLimiting: { ...defaultConfig.scenarios.rateLimiting, requestsPerTest: 100 },
    },
    timeout: 120000,
  },

  // Production-like test
  PRODUCTION: {
    ...defaultConfig,
    scenarios: {
      ...defaultConfig.scenarios,
      basicConcurrency: { ...defaultConfig.scenarios.basicConcurrency, concurrencyLevel: 25 },
      highConcurrency: { ...defaultConfig.scenarios.highConcurrency, concurrencyLevel: 100 },
      bulkOperations: { ...defaultConfig.scenarios.bulkOperations, operationsCount: 50 },
    },
    timeout: 90000,
    reporting: {
      ...defaultConfig.reporting,
      failOnWarnings: true,
    },
  },
};

/**
 * Get test scenario by name
 */
export function getTestScenario(name: 'QUICK' | 'STANDARD' | 'COMPREHENSIVE' | 'STRESS' | 'PRODUCTION'): ConcurrentTestConfig {
  return testScenarios[name] || testScenarios.STANDARD;
}

/**
 * Export test configuration profiles
 */
export const TEST_PROFILES = {
  QUICK: 'QUICK',
  STANDARD: 'STANDARD',
  COMPREHENSIVE: 'COMPREHENSIVE',
  STRESS: 'STRESS',
  PRODUCTION: 'PRODUCTION',
};
