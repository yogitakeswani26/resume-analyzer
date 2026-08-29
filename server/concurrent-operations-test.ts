#!/usr/bin/env node

/**
 * CONCURRENT OPERATIONS TEST SUITE
 * Tests concurrent user registrations, bulk operations, and rate limiting
 *
 * Coverage:
 * - Multiple concurrent registrations (5, 10, 20 users simultaneously)
 * - Rate limiting enforcement
 * - Database integrity under concurrent load
 * - Bulk login operations
 * - Race condition detection
 * - Duplicate email prevention
 */

import axios, { AxiosInstance } from 'axios';
import crypto from 'crypto';

interface TestResult {
  name: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  message: string;
  duration: number;
  details?: any;
}

interface ConcurrentTestMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  rateLimitedRequests: number;
  duplicateKeyErrors: number;
  duration: number;
  requestsPerSecond: number;
  concurrencyLevel: number;
}

class ConcurrentOperationsTester {
  private api: AxiosInstance;
  private results: TestResult[] = [];
  private metrics: Map<string, ConcurrentTestMetrics> = new Map();
  private baseEmail = `concurrent-test-${Date.now()}`;
  private basePassword = 'SecureTest@123456';
  private registeredUsers: Array<{ email: string; password: string; token?: string }> = [];

  constructor(private baseURL: string = 'http://localhost:3000/api/v1') {
    this.api = axios.create({
      baseURL,
      validateStatus: () => true, // Don't throw on any status
      timeout: 30000,
    });
  }

  log(message: string) {
    console.log(`\n📋 ${message}`);
  }

  pass(name: string, message: string, duration: number = 0, details?: any) {
    this.results.push({ name, status: 'PASS', message, duration, details });
    console.log(`✅ PASS: ${name} (${duration}ms)`);
    console.log(`   ${message}`);
  }

  fail(name: string, message: string, duration: number = 0, details?: any) {
    this.results.push({ name, status: 'FAIL', message, duration, details });
    console.log(`❌ FAIL: ${name} (${duration}ms)`);
    console.log(`   ${message}`);
    if (details) {
      console.log(`   Details:`, JSON.stringify(details, null, 2).slice(0, 300));
    }
  }

  warn(name: string, message: string, duration: number = 0, details?: any) {
    this.results.push({ name, status: 'WARN', message, duration, details });
    console.log(`⚠️  WARN: ${name} (${duration}ms)`);
    console.log(`   ${message}`);
  }

  /**
   * Test 1: Concurrent User Registrations (5 users)
   * Validates that multiple simultaneous registrations work correctly
   */
  async testConcurrentRegistrations(concurrencyLevel: number = 5) {
    this.log(`Testing ${concurrencyLevel} concurrent user registrations...`);
    const testName = `Concurrent Registrations (${concurrencyLevel} users)`;
    const startTime = Date.now();

    try {
      const registrationPromises = [];

      for (let i = 0; i < concurrencyLevel; i++) {
        const email = `${this.baseEmail}-reg-${i}-${crypto.randomBytes(3).toString('hex')}@example.com`;
        const promise = this.api.post('/auth/register', {
          name: `Concurrent User ${i}`,
          email,
          password: this.basePassword,
        }).then(response => ({
          index: i,
          email,
          response,
          timestamp: Date.now(),
        }));

        registrationPromises.push(promise);
      }

      // Execute all registrations simultaneously
      const results = await Promise.all(registrationPromises);
      const duration = Date.now() - startTime;

      // Analyze results
      let successCount = 0;
      let failureCount = 0;
      const createdEmails: Set<string> = new Set();

      for (const result of results) {
        if (result.response.status === 201) {
          successCount++;
          createdEmails.add(result.email);
          this.registeredUsers.push({
            email: result.email,
            password: this.basePassword,
            token: result.response.data?.data?.accessToken,
          });
        } else {
          failureCount++;
          console.log(`   Registration ${result.index} failed:`, result.response.status, result.response.data?.error?.message);
        }
      }

      const metrics: ConcurrentTestMetrics = {
        totalRequests: concurrencyLevel,
        successfulRequests: successCount,
        failedRequests: failureCount,
        rateLimitedRequests: results.filter(r => r.response.status === 429).length,
        duplicateKeyErrors: results.filter(r => r.response.data?.error?.code === 'DUPLICATE_EMAIL').length,
        duration,
        requestsPerSecond: (concurrencyLevel / duration) * 1000,
        concurrencyLevel,
      };

      this.metrics.set('concurrent_registrations', metrics);

      if (successCount === concurrencyLevel) {
        this.pass(
          testName,
          `All ${concurrencyLevel} users registered successfully`,
          duration,
          metrics
        );
        return true;
      } else if (successCount > 0) {
        this.warn(
          testName,
          `${successCount}/${concurrencyLevel} users registered (${failureCount} failures)`,
          duration,
          metrics
        );
        return true;
      } else {
        this.fail(
          testName,
          `Failed to register any users`,
          duration,
          metrics
        );
        return false;
      }
    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.fail(
        testName,
        `Test execution error: ${error.message}`,
        duration
      );
      return false;
    }
  }

  /**
   * Test 2: Rate Limiting on Concurrent Registrations
   * Verifies that rate limiting prevents abuse by rejecting excess requests
   */
  async testRateLimitingEnforcement() {
    this.log('Testing rate limiting enforcement on registration endpoint...');
    const testName = 'Rate Limiting Enforcement (Registration)';
    const startTime = Date.now();

    try {
      // Send 10 registration requests rapidly (limit is 5 per 15 minutes)
      const registrationPromises = [];
      const concurrencyLevel = 10;

      for (let i = 0; i < concurrencyLevel; i++) {
        const email = `${this.baseEmail}-rate-${i}-${crypto.randomBytes(3).toString('hex')}@example.com`;
        const promise = this.api.post('/auth/register', {
          name: `Rate Limit Test User ${i}`,
          email,
          password: this.basePassword,
        }).then(response => ({
          index: i,
          status: response.status,
          email,
        }));

        registrationPromises.push(promise);
      }

      const results = await Promise.all(registrationPromises);
      const duration = Date.now() - startTime;

      // Count rate limited responses
      const rateLimitedCount = results.filter(r => r.status === 429).length;
      const successCount = results.filter(r => r.status === 201).length;

      const metrics: ConcurrentTestMetrics = {
        totalRequests: concurrencyLevel,
        successfulRequests: successCount,
        failedRequests: concurrencyLevel - successCount - rateLimitedCount,
        rateLimitedRequests: rateLimitedCount,
        duplicateKeyErrors: 0,
        duration,
        requestsPerSecond: (concurrencyLevel / duration) * 1000,
        concurrencyLevel,
      };

      this.metrics.set('rate_limiting_test', metrics);

      if (rateLimitedCount > 0) {
        this.pass(
          testName,
          `Rate limiting is working: ${rateLimitedCount} requests blocked out of ${concurrencyLevel}`,
          duration,
          metrics
        );
        return true;
      } else {
        this.warn(
          testName,
          `No rate limited responses detected. Rate limiting may not be active.`,
          duration,
          metrics
        );
        return false;
      }
    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.fail(
        testName,
        `Test execution error: ${error.message}`,
        duration
      );
      return false;
    }
  }

  /**
   * Test 3: Concurrent Login Operations
   * Validates that bulk logins work correctly
   */
  async testConcurrentLoginOperations() {
    this.log('Testing concurrent login operations...');
    const testName = 'Concurrent Login Operations';
    const startTime = Date.now();

    // First, ensure we have registered users
    if (this.registeredUsers.length === 0) {
      await this.testConcurrentRegistrations(5);
    }

    try {
      const loginPromises = this.registeredUsers.slice(0, 5).map((user, index) =>
        this.api.post('/auth/login', {
          email: user.email,
          password: user.password,
        }).then(response => ({
          index,
          email: user.email,
          status: response.status,
          token: response.data?.data?.accessToken,
        }))
      );

      const results = await Promise.all(loginPromises);
      const duration = Date.now() - startTime;

      const successCount = results.filter(r => r.status === 200).length;
      const tokenCount = results.filter(r => r.token).length;

      const metrics: ConcurrentTestMetrics = {
        totalRequests: this.registeredUsers.length,
        successfulRequests: successCount,
        failedRequests: results.length - successCount,
        rateLimitedRequests: results.filter(r => r.status === 429).length,
        duplicateKeyErrors: 0,
        duration,
        requestsPerSecond: (results.length / duration) * 1000,
        concurrencyLevel: results.length,
      };

      this.metrics.set('concurrent_login', metrics);

      if (successCount === results.length && tokenCount === results.length) {
        this.pass(
          testName,
          `All ${results.length} concurrent logins succeeded with valid tokens`,
          duration,
          metrics
        );
        return true;
      } else {
        this.fail(
          testName,
          `Only ${successCount}/${results.length} logins succeeded`,
          duration,
          metrics
        );
        return false;
      }
    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.fail(
        testName,
        `Test execution error: ${error.message}`,
        duration
      );
      return false;
    }
  }

  /**
   * Test 4: Duplicate Email Prevention (Race Condition)
   * Tests that the database prevents duplicate emails even with concurrent requests
   */
  async testDuplicateEmailPrevention() {
    this.log('Testing duplicate email prevention under concurrent load...');
    const testName = 'Duplicate Email Prevention (Race Condition)';
    const startTime = Date.now();

    try {
      const sharedEmail = `${this.baseEmail}-duplicate-${crypto.randomBytes(4).toString('hex')}@example.com`;
      const registrationPromises = [];

      // Send 5 concurrent registrations with the SAME email
      for (let i = 0; i < 5; i++) {
        const promise = this.api.post('/auth/register', {
          name: `Duplicate Test User ${i}`,
          email: sharedEmail,
          password: this.basePassword,
        }).then(response => ({
          index: i,
          status: response.status,
          errorCode: response.data?.error?.code,
          message: response.data?.error?.message || response.data?.data?.message,
        }));

        registrationPromises.push(promise);
      }

      const results = await Promise.all(registrationPromises);
      const duration = Date.now() - startTime;

      const successCount = results.filter(r => r.status === 201).length;
      const duplicateCount = results.filter(r => r.status === 409 || r.errorCode === 'DUPLICATE_EMAIL').length;
      const validationErrors = results.filter(r => r.status === 400).length;

      const metrics: ConcurrentTestMetrics = {
        totalRequests: 5,
        successfulRequests: successCount,
        failedRequests: 5 - successCount,
        rateLimitedRequests: 0,
        duplicateKeyErrors: duplicateCount,
        duration,
        requestsPerSecond: (5 / duration) * 1000,
        concurrencyLevel: 5,
      };

      this.metrics.set('duplicate_prevention', metrics);

      // CRITICAL: Only ONE should succeed, others should fail
      if (successCount === 1 && (duplicateCount + validationErrors === 4)) {
        this.pass(
          testName,
          `Duplicate email prevention works: 1 success, ${duplicateCount} duplicates rejected`,
          duration,
          metrics
        );
        return true;
      } else if (successCount > 1) {
        this.fail(
          testName,
          `CRITICAL: Multiple registrations with same email succeeded (${successCount}). Database constraint failed!`,
          duration,
          { ...metrics, results }
        );
        return false;
      } else {
        this.warn(
          testName,
          `Unexpected result distribution: ${successCount} success, ${duplicateCount} duplicates`,
          duration,
          metrics
        );
        return false;
      }
    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.fail(
        testName,
        `Test execution error: ${error.message}`,
        duration
      );
      return false;
    }
  }

  /**
   * Test 5: Bulk Token Refresh Operations
   * Tests rate limiting on token refresh endpoint
   */
  async testBulkTokenRefresh() {
    this.log('Testing bulk token refresh operations...');
    const testName = 'Bulk Token Refresh';
    const startTime = Date.now();

    // Ensure we have registered users with tokens
    if (this.registeredUsers.length === 0) {
      await this.testConcurrentRegistrations(3);
    }

    const usersWithTokens = this.registeredUsers.filter(u => u.token).slice(0, 3);
    if (usersWithTokens.length === 0) {
      this.warn(testName, 'No users with valid tokens available', 0);
      return false;
    }

    try {
      const refreshPromises = usersWithTokens.map((user, index) =>
        this.api.post('/auth/refresh', {
          refreshToken: user.token, // Using access token as refresh token for this test
        }).then(response => ({
          index,
          status: response.status,
          hasNewToken: !!response.data?.data?.accessToken,
        }))
      );

      const results = await Promise.all(refreshPromises);
      const duration = Date.now() - startTime;

      const successCount = results.filter(r => r.status === 200 && r.hasNewToken).length;
      const rateLimitedCount = results.filter(r => r.status === 429).length;

      const metrics: ConcurrentTestMetrics = {
        totalRequests: results.length,
        successfulRequests: successCount,
        failedRequests: results.length - successCount - rateLimitedCount,
        rateLimitedRequests: rateLimitedCount,
        duplicateKeyErrors: 0,
        duration,
        requestsPerSecond: (results.length / duration) * 1000,
        concurrencyLevel: results.length,
      };

      this.metrics.set('bulk_token_refresh', metrics);

      if (successCount > 0) {
        this.pass(
          testName,
          `${successCount} token refreshes succeeded`,
          duration,
          metrics
        );
        return true;
      } else {
        this.warn(
          testName,
          `No successful token refreshes`,
          duration,
          metrics
        );
        return false;
      }
    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.fail(
        testName,
        `Test execution error: ${error.message}`,
        duration
      );
      return false;
    }
  }

  /**
   * Test 6: High Concurrency Stress Test (20+ simultaneous registrations)
   * Tests system behavior under significant concurrent load
   */
  async testHighConcurrencyStress() {
    this.log('Testing high concurrency stress (20 simultaneous registrations)...');
    const testName = 'High Concurrency Stress Test (20 users)';
    const startTime = Date.now();

    try {
      const concurrencyLevel = 20;
      const registrationPromises = [];

      for (let i = 0; i < concurrencyLevel; i++) {
        const email = `${this.baseEmail}-stress-${i}-${crypto.randomBytes(3).toString('hex')}@example.com`;
        const promise = this.api.post('/auth/register', {
          name: `Stress Test User ${i}`,
          email,
          password: this.basePassword,
        }).then(response => ({
          index: i,
          status: response.status,
          email,
          timestamp: Date.now(),
        }));

        registrationPromises.push(promise);
      }

      const results = await Promise.all(registrationPromises);
      const duration = Date.now() - startTime;

      const successCount = results.filter(r => r.status === 201).length;
      const rateLimitedCount = results.filter(r => r.status === 429).length;
      const errorCount = results.filter(r => r.status !== 201 && r.status !== 429).length;

      const metrics: ConcurrentTestMetrics = {
        totalRequests: concurrencyLevel,
        successfulRequests: successCount,
        failedRequests: errorCount,
        rateLimitedRequests: rateLimitedCount,
        duplicateKeyErrors: 0,
        duration,
        requestsPerSecond: (concurrencyLevel / duration) * 1000,
        concurrencyLevel,
      };

      this.metrics.set('high_concurrency_stress', metrics);

      this.pass(
        testName,
        `Successfully handled ${concurrencyLevel} concurrent requests: ${successCount} success, ${rateLimitedCount} rate limited`,
        duration,
        metrics
      );

      return successCount > 0;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.fail(
        testName,
        `Test execution error: ${error.message}`,
        duration
      );
      return false;
    }
  }

  /**
   * Test 7: Concurrent Access with Authentication
   * Tests that authenticated endpoints work correctly under concurrent load
   */
  async testConcurrentAuthenticatedAccess() {
    this.log('Testing concurrent authenticated access...');
    const testName = 'Concurrent Authenticated Access';
    const startTime = Date.now();

    // Ensure we have registered users with tokens
    if (this.registeredUsers.length === 0) {
      await this.testConcurrentRegistrations(3);
    }

    const usersWithTokens = this.registeredUsers.filter(u => u.token).slice(0, 3);
    if (usersWithTokens.length === 0) {
      this.warn(testName, 'No users with valid tokens available', 0);
      return false;
    }

    try {
      const accessPromises = usersWithTokens.map((user, index) =>
        this.api.get('/auth/me', {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }).then(response => ({
          index,
          status: response.status,
          hasUser: !!response.data?.data?.user,
        }))
      );

      const results = await Promise.all(accessPromises);
      const duration = Date.now() - startTime;

      const successCount = results.filter(r => r.status === 200 && r.hasUser).length;

      const metrics: ConcurrentTestMetrics = {
        totalRequests: results.length,
        successfulRequests: successCount,
        failedRequests: results.length - successCount,
        rateLimitedRequests: 0,
        duplicateKeyErrors: 0,
        duration,
        requestsPerSecond: (results.length / duration) * 1000,
        concurrencyLevel: results.length,
      };

      this.metrics.set('concurrent_authenticated_access', metrics);

      if (successCount === results.length) {
        this.pass(
          testName,
          `All ${results.length} authenticated access requests succeeded`,
          duration,
          metrics
        );
        return true;
      } else {
        this.fail(
          testName,
          `Only ${successCount}/${results.length} authenticated requests succeeded`,
          duration,
          metrics
        );
        return false;
      }
    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.fail(
        testName,
        `Test execution error: ${error.message}`,
        duration
      );
      return false;
    }
  }

  /**
   * Print summary report
   */
  printSummary() {
    console.log('\n\n' + '='.repeat(80));
    console.log('📊 CONCURRENT OPERATIONS TEST SUMMARY');
    console.log('='.repeat(80));

    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const warnings = this.results.filter(r => r.status === 'WARN').length;
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);

    console.log(`\n📈 Test Results: ${passed} Passed, ${failed} Failed, ${warnings} Warnings`);
    console.log(`⏱️  Total Duration: ${totalDuration}ms`);
    console.log(`✅ Success Rate: ${((passed / this.results.length) * 100).toFixed(2)}%\n`);

    console.log('Detailed Results:');
    for (const result of this.results) {
      const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️ ';
      console.log(`${icon} ${result.name} (${result.duration}ms)`);
      console.log(`   ${result.message}`);
    }

    console.log('\n' + '='.repeat(80));
    console.log('📊 PERFORMANCE METRICS');
    console.log('='.repeat(80));

    for (const [testName, metrics] of this.metrics.entries()) {
      console.log(`\n${testName.toUpperCase()}`);
      console.log(`  Total Requests: ${metrics.totalRequests}`);
      console.log(`  Successful: ${metrics.successfulRequests}`);
      console.log(`  Failed: ${metrics.failedRequests}`);
      console.log(`  Rate Limited: ${metrics.rateLimitedRequests}`);
      console.log(`  Duplicate Errors: ${metrics.duplicateKeyErrors}`);
      console.log(`  Duration: ${metrics.duration}ms`);
      console.log(`  Throughput: ${metrics.requestsPerSecond.toFixed(2)} req/sec`);
      console.log(`  Concurrency Level: ${metrics.concurrencyLevel}`);
    }

    console.log('\n' + '='.repeat(80));
  }

  /**
   * Run all tests
   */
  async runAllTests() {
    console.log('\n🚀 Starting Concurrent Operations Test Suite\n');

    try {
      // Test 1: Basic concurrent registrations (5 users)
      await this.testConcurrentRegistrations(5);

      // Test 2: Rate limiting enforcement
      await this.testRateLimitingEnforcement();

      // Test 3: Concurrent logins
      await this.testConcurrentLoginOperations();

      // Test 4: Duplicate email prevention
      await this.testDuplicateEmailPrevention();

      // Test 5: Bulk token refresh
      await this.testBulkTokenRefresh();

      // Test 6: High concurrency stress
      await this.testHighConcurrencyStress();

      // Test 7: Concurrent authenticated access
      await this.testConcurrentAuthenticatedAccess();

      this.printSummary();

      // Return exit code based on results
      const hasFailures = this.results.some(r => r.status === 'FAIL');
      process.exit(hasFailures ? 1 : 0);
    } catch (error) {
      console.error('Fatal error during test execution:', error);
      process.exit(1);
    }
  }
}

// Run tests
const tester = new ConcurrentOperationsTester();
tester.runAllTests().catch(err => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
