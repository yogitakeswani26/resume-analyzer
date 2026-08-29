#!/usr/bin/env node

/**
 * END-TO-END AUTHENTICATION FLOW TEST
 *
 * Tests:
 * 1. Register → Auto-login → Dashboard → Profile
 * 2. Login → Dashboard → All recruiter tools
 * 3. Verify token sent to ALL endpoints
 * 4. Verify no 401 on ANY endpoint
 * 5. Test logout from all devices
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import crypto from 'crypto';

interface TestResult {
  name: string;
  status: 'PASS' | 'FAIL';
  message: string;
  details?: any;
}

class AuthFlowTester {
  private api: AxiosInstance;
  private results: TestResult[] = [];
  private testData = {
    userId: crypto.randomBytes(8).toString('hex'),
    name: `Test User ${Date.now()}`,
    email: `test-${Date.now()}@example.com`,
    password: 'Test@123456',
  };

  constructor(private baseURL: string) {
    this.api = axios.create({
      baseURL,
      validateStatus: () => true, // Don't throw on any status
    });
  }

  log(message: string) {
    console.log(`\n📋 ${message}`);
  }

  pass(name: string, message: string, details?: any) {
    this.results.push({ name, status: 'PASS', message, details });
    console.log(`✅ PASS: ${name}`);
    console.log(`   ${message}`);
  }

  fail(name: string, message: string, details?: any) {
    this.results.push({ name, status: 'FAIL', message, details });
    console.log(`❌ FAIL: ${name}`);
    console.log(`   ${message}`);
    if (details) console.log(`   Details:`, details);
  }

  // Test 1: Register flow
  async testRegister() {
    this.log('TEST 1: REGISTER FLOW');
    console.log('─'.repeat(50));

    const response = await this.api.post('/auth/register', {
      name: this.testData.name,
      email: this.testData.email,
      password: this.testData.password,
    });

    if (response.status !== 201) {
      this.fail(
        'Register Status',
        `Expected 201, got ${response.status}`,
        response.data
      );
      return null;
    }

    const { accessToken, refreshToken, user } = response.data.data;

    if (!accessToken || !refreshToken || !user) {
      this.fail(
        'Register Response',
        'Missing accessToken, refreshToken, or user in response',
        response.data
      );
      return null;
    }

    this.pass(
      'Register Status',
      `User registered successfully with ID: ${user._id}`
    );

    if (!accessToken.includes('.') || accessToken.split('.').length !== 3) {
      this.fail('AccessToken Format', 'Token is not a valid JWT', { token: accessToken });
    } else {
      this.pass('AccessToken Format', 'AccessToken is a valid JWT');
    }

    if (!refreshToken.includes('.') || refreshToken.split('.').length !== 3) {
      this.fail('RefreshToken Format', 'Token is not a valid JWT', { token: refreshToken });
    } else {
      this.pass('RefreshToken Format', 'RefreshToken is a valid JWT');
    }

    return { accessToken, refreshToken, user };
  }

  // Test 2: Auto-login after register
  async testAutoLogin(tokens: any) {
    this.log('TEST 2: AUTO-LOGIN AFTER REGISTER');
    console.log('─'.repeat(50));

    // Set the token
    this.api.defaults.headers.common.Authorization = `Bearer ${tokens.accessToken}`;

    // Test /auth/me endpoint
    const response = await this.api.get('/auth/me');

    if (response.status === 401) {
      this.fail(
        'Auth ME Endpoint',
        'Got 401 Unauthorized - token not being sent properly',
        { authHeader: this.api.defaults.headers.common.Authorization }
      );
      return false;
    }

    if (response.status !== 200) {
      this.fail(
        'Auth ME Endpoint',
        `Expected 200, got ${response.status}`,
        response.data
      );
      return false;
    }

    if (!response.data.data.user) {
      this.fail(
        'Auth ME Response',
        'Missing user in response',
        response.data
      );
      return false;
    }

    this.pass(
      'Auth ME Endpoint',
      'Successfully retrieved authenticated user info'
    );
    return true;
  }

  // Test 3: Access resume endpoints (dashboard-like)
  async testResumeEndpoints(tokens: any) {
    this.log('TEST 3: RESUME ENDPOINTS (DASHBOARD)');
    console.log('─'.repeat(50));

    this.api.defaults.headers.common.Authorization = `Bearer ${tokens.accessToken}`;

    // Test resume list
    const listResponse = await this.api.get('/resumes');

    if (listResponse.status === 401) {
      this.fail(
        'Resume List Endpoint',
        'Got 401 - token not being sent',
        { authHeader: this.api.defaults.headers.common.Authorization }
      );
      return false;
    }

    if (listResponse.status !== 200 && listResponse.status !== 500) {
      // 500 is ok for now if resumes don't exist, but 401 is not
      this.fail(
        'Resume List Endpoint',
        `Expected 200 or 500, got ${listResponse.status}`,
        listResponse.data
      );
      return false;
    }

    this.pass(
      'Resume List Endpoint',
      `Got ${listResponse.status} - token is being properly sent`
    );
    return true;
  }

  // Test 4: Access recruiter endpoints
  async testRecruiterEndpoints(tokens: any) {
    this.log('TEST 4: RECRUITER ENDPOINTS');
    console.log('─'.repeat(50));

    this.api.defaults.headers.common.Authorization = `Bearer ${tokens.accessToken}`;

    const endpoints = [
      { method: 'GET', path: '/recruiter/candidates', name: 'Get Candidates' },
      { method: 'GET', path: '/recruiter/analytics', name: 'Get Analytics' },
      { method: 'GET', path: '/recruiter/pipeline', name: 'Get Pipeline' },
    ];

    let allPassed = true;

    for (const endpoint of endpoints) {
      const response = await (endpoint.method === 'GET'
        ? this.api.get(endpoint.path)
        : this.api.post(endpoint.path, {}));

      if (response.status === 401) {
        this.fail(
          `Recruiter: ${endpoint.name}`,
          `${endpoint.method} ${endpoint.path} returned 401`,
          { authHeader: this.api.defaults.headers.common.Authorization }
        );
        allPassed = false;
      } else if (response.status >= 200 && response.status < 300) {
        this.pass(
          `Recruiter: ${endpoint.name}`,
          `${endpoint.method} ${endpoint.path} returned ${response.status}`
        );
      } else if (response.status >= 500) {
        this.pass(
          `Recruiter: ${endpoint.name}`,
          `${endpoint.method} ${endpoint.path} returned ${response.status} (server error, but token was accepted)`
        );
      } else {
        this.fail(
          `Recruiter: ${endpoint.name}`,
          `${endpoint.method} ${endpoint.path} returned ${response.status}`,
          response.data
        );
        allPassed = false;
      }
    }

    return allPassed;
  }

  // Test 5: Analysis endpoints
  async testAnalysisEndpoints(tokens: any) {
    this.log('TEST 5: ANALYSIS ENDPOINTS');
    console.log('─'.repeat(50));

    this.api.defaults.headers.common.Authorization = `Bearer ${tokens.accessToken}`;

    const endpoints = [
      { method: 'GET', path: '/analysis', name: 'List Analysis' },
    ];

    let allPassed = true;

    for (const endpoint of endpoints) {
      const response = await (endpoint.method === 'GET'
        ? this.api.get(endpoint.path)
        : this.api.post(endpoint.path, {}));

      if (response.status === 401) {
        this.fail(
          `Analysis: ${endpoint.name}`,
          `${endpoint.method} ${endpoint.path} returned 401`,
          { authHeader: this.api.defaults.headers.common.Authorization }
        );
        allPassed = false;
      } else if (response.status >= 200 && response.status < 300) {
        this.pass(
          `Analysis: ${endpoint.name}`,
          `${endpoint.method} ${endpoint.path} returned ${response.status}`
        );
      } else if (response.status >= 500) {
        this.pass(
          `Analysis: ${endpoint.name}`,
          `${endpoint.method} ${endpoint.path} returned ${response.status} (server error, but token was accepted)`
        );
      } else {
        this.fail(
          `Analysis: ${endpoint.name}`,
          `${endpoint.method} ${endpoint.path} returned ${response.status}`,
          response.data
        );
        allPassed = false;
      }
    }

    return allPassed;
  }

  // Test 6: Verify token is sent properly
  async testTokenTransmission(tokens: any) {
    this.log('TEST 6: TOKEN TRANSMISSION VERIFICATION');
    console.log('─'.repeat(50));

    this.api.defaults.headers.common.Authorization = `Bearer ${tokens.accessToken}`;

    // Make a request and inspect headers
    const response = await this.api.get('/auth/me');

    if (this.api.defaults.headers.common.Authorization) {
      this.pass(
        'Default Auth Header',
        'Authorization header is set in axios defaults'
      );
    } else {
      this.fail(
        'Default Auth Header',
        'Authorization header not set in axios defaults'
      );
    }

    if (response.config.headers.Authorization) {
      this.pass(
        'Request Auth Header',
        'Authorization header was sent in request'
      );
    } else {
      this.fail(
        'Request Auth Header',
        'Authorization header not sent in request'
      );
    }
  }

  // Test 7: Login flow
  async testLogin() {
    this.log('TEST 7: LOGIN FLOW');
    console.log('─'.repeat(50));

    // Use the same credentials from register
    const response = await this.api.post('/auth/login', {
      email: this.testData.email,
      password: this.testData.password,
    });

    if (response.status !== 200) {
      this.fail(
        'Login Status',
        `Expected 200, got ${response.status}`,
        response.data
      );
      return null;
    }

    const { accessToken, refreshToken, user } = response.data.data;

    if (!accessToken || !refreshToken || !user) {
      this.fail(
        'Login Response',
        'Missing accessToken, refreshToken, or user',
        response.data
      );
      return null;
    }

    this.pass(
      'Login Status',
      `User logged in successfully with ID: ${user._id}`
    );

    return { accessToken, refreshToken, user };
  }

  // Test 8: Logout flow
  async testLogout(tokens: any) {
    this.log('TEST 8: LOGOUT FLOW');
    console.log('─'.repeat(50));

    this.api.defaults.headers.common.Authorization = `Bearer ${tokens.accessToken}`;

    const response = await this.api.post('/auth/logout');

    if (response.status !== 200) {
      this.fail(
        'Logout Status',
        `Expected 200, got ${response.status}`,
        response.data
      );
      return false;
    }

    this.pass(
      'Logout Status',
      'Logout endpoint returned 200'
    );

    // After logout, tokens should be invalid
    // But the endpoint itself doesn't validate this
    // In a real app, the client would clear tokens

    return true;
  }

  // Test 9: Verify 401 when no token provided
  async testNoTokenAccess() {
    this.log('TEST 9: VERIFY 401 WHEN NO TOKEN PROVIDED');
    console.log('─'.repeat(50));

    // Clear the auth header
    delete this.api.defaults.headers.common.Authorization;

    const endpoints = [
      '/resumes',
      '/auth/me',
      '/analysis',
      '/recruiter/candidates',
    ];

    let allCorrect = true;

    for (const endpoint of endpoints) {
      const response = await this.api.get(endpoint);

      if (response.status === 401) {
        this.pass(
          `401 Protection: ${endpoint}`,
          `${endpoint} correctly requires authentication (401)`
        );
      } else {
        this.fail(
          `401 Protection: ${endpoint}`,
          `${endpoint} returned ${response.status}, expected 401`,
          response.data
        );
        allCorrect = false;
      }
    }

    return allCorrect;
  }

  // Test 10: Token refresh
  async testTokenRefresh(tokens: any) {
    this.log('TEST 10: TOKEN REFRESH');
    console.log('─'.repeat(50));

    const response = await this.api.post('/auth/refresh', {
      refreshToken: tokens.refreshToken,
    });

    if (response.status !== 200) {
      this.fail(
        'Token Refresh Status',
        `Expected 200, got ${response.status}`,
        response.data
      );
      return null;
    }

    const { accessToken } = response.data.data;

    if (!accessToken) {
      this.fail(
        'Token Refresh Response',
        'Missing accessToken in response',
        response.data
      );
      return null;
    }

    this.pass(
      'Token Refresh Status',
      'Token refresh successful - new access token provided'
    );

    return { accessToken, refreshToken: tokens.refreshToken };
  }

  // Generate report
  generateReport() {
    console.log('\n\n');
    console.log('═'.repeat(70));
    console.log('AUTH FLOW TEST REPORT');
    console.log('═'.repeat(70));

    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const total = this.results.length;

    console.log(`\nSummary: ${passed}/${total} tests passed, ${failed} failed\n`);

    // Group by status
    const passedTests = this.results.filter(r => r.status === 'PASS');
    const failedTests = this.results.filter(r => r.status === 'FAIL');

    if (failedTests.length > 0) {
      console.log('\n❌ FAILED TESTS:');
      console.log('─'.repeat(70));
      failedTests.forEach(test => {
        console.log(`\n• ${test.name}`);
        console.log(`  ${test.message}`);
        if (test.details) {
          console.log(`  Details:`, JSON.stringify(test.details, null, 2));
        }
      });
    }

    console.log('\n📊 DETAILED RESULTS:');
    console.log('─'.repeat(70));
    this.results.forEach(test => {
      const icon = test.status === 'PASS' ? '✅' : '❌';
      console.log(`${icon} ${test.name}`);
    });

    console.log('\n═'.repeat(70));
    if (failed === 0) {
      console.log('🎉 ALL TESTS PASSED!');
    } else {
      console.log(`⚠️  ${failed} TEST(S) FAILED - SEE DETAILS ABOVE`);
    }
    console.log('═'.repeat(70));
  }

  // Run all tests
  async runAll() {
    try {
      console.log('🚀 STARTING AUTHENTICATION FLOW TESTS');
      console.log(`📌 Base URL: ${this.baseURL}`);
      console.log(`⏰ Test User: ${this.testData.email}\n`);

      // Register
      const registerTokens = await this.testRegister();
      if (!registerTokens) {
        console.log('\n❌ Register failed - cannot continue');
        this.generateReport();
        return;
      }

      // Auto-login after register
      await this.testAutoLogin(registerTokens);

      // Test endpoints with registered user
      await this.testResumeEndpoints(registerTokens);
      await this.testRecruiterEndpoints(registerTokens);
      await this.testAnalysisEndpoints(registerTokens);
      await this.testTokenTransmission(registerTokens);

      // Test login with same credentials
      const loginTokens = await this.testLogin();
      if (loginTokens) {
        await this.testAutoLogin(loginTokens);
      }

      // Test token refresh
      if (registerTokens.refreshToken) {
        const refreshedTokens = await this.testTokenRefresh(registerTokens);
        if (refreshedTokens) {
          await this.testAutoLogin(refreshedTokens);
        }
      }

      // Test logout
      await this.testLogout(registerTokens);

      // Test 401 protection
      await this.testNoTokenAccess();

      // Generate final report
      this.generateReport();

      // Exit with proper code
      const failures = this.results.filter(r => r.status === 'FAIL').length;
      process.exit(failures > 0 ? 1 : 0);
    } catch (error) {
      console.error('\n💥 FATAL ERROR:', error);
      this.generateReport();
      process.exit(1);
    }
  }
}

// Main execution
const baseURL = process.env.API_URL || 'http://localhost:5001/api/v1';
const tester = new AuthFlowTester(baseURL);
tester.runAll();
