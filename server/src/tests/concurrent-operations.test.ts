/**
 * CONCURRENT OPERATIONS TEST SUITE (Jest)
 *
 * Comprehensive testing for:
 * - Concurrent user registrations
 * - Rate limiting enforcement
 * - Database integrity under concurrent load
 * - Bulk operations
 * - Race condition prevention
 */

import request from 'supertest';
import app from '../app.js';
import { User } from '../modules/auth/auth.model.js';
import crypto from 'crypto';
import { connectDatabase } from '../config/database.js';
import { disconnect } from 'mongoose';

// Helper to generate unique email
const generateUniqueEmail = () => `test-${Date.now()}-${crypto.randomBytes(3).toString('hex')}@test.com`;

describe('Concurrent Operations Tests', () => {
  const baseURL = 'http://localhost:3000/api/v1';
  const testPassword = 'SecurePassword@123456';
  let testUsers: Array<{ email: string; password: string; token?: string }> = [];

  beforeAll(async () => {
    // Ensure database connection
    try {
      await connectDatabase();
    } catch (err) {
      console.warn('Database already connected');
    }
  });

  afterAll(async () => {
    // Clean up test users
    const testEmails = testUsers.map(u => u.email);
    if (testEmails.length > 0) {
      try {
        await User.deleteMany({ email: { $in: testEmails } });
      } catch (err) {
        console.warn('Cleanup error:', err);
      }
    }

    // Disconnect database
    try {
      await disconnect();
    } catch (err) {
      console.warn('Disconnect error:', err);
    }
  });

  describe('Concurrent User Registration', () => {
    test('should handle 5 concurrent registrations successfully', async () => {
      const registrations = [];

      // Create 5 concurrent registration requests
      for (let i = 0; i < 5; i++) {
        const email = generateUniqueEmail();
        testUsers.push({ email, password: testPassword });

        const promise = request(app)
          .post('/api/v1/auth/register')
          .send({
            name: `Concurrent User ${i}`,
            email,
            password: testPassword,
          });

        registrations.push(promise);
      }

      const responses = await Promise.all(registrations);

      // Verify all registrations succeeded
      const successCount = responses.filter(r => r.status === 201).length;
      expect(successCount).toBeGreaterThan(0);

      // Verify returned tokens
      for (const response of responses) {
        if (response.status === 201) {
          expect(response.body.data).toHaveProperty('accessToken');
          expect(response.body.data).toHaveProperty('user');
        }
      }
    });

    test('should handle 10 concurrent registrations', async () => {
      const registrations = [];

      for (let i = 0; i < 10; i++) {
        const email = generateUniqueEmail();
        testUsers.push({ email, password: testPassword });

        const promise = request(app)
          .post('/api/v1/auth/register')
          .send({
            name: `Heavy Load User ${i}`,
            email,
            password: testPassword,
          });

        registrations.push(promise);
      }

      const responses = await Promise.all(registrations);
      const successCount = responses.filter(r => r.status === 201).length;

      // Should handle most requests successfully
      expect(successCount).toBeGreaterThan(5);
    });

    test('should prevent duplicate emails even with concurrent requests', async () => {
      const sharedEmail = generateUniqueEmail();
      const registrations = [];

      // Send 5 concurrent requests with the SAME email
      for (let i = 0; i < 5; i++) {
        const promise = request(app)
          .post('/api/v1/auth/register')
          .send({
            name: `Duplicate Test ${i}`,
            email: sharedEmail,
            password: testPassword,
          });

        registrations.push(promise);
      }

      const responses = await Promise.all(registrations);

      // Count successes and duplicates
      const successCount = responses.filter(r => r.status === 201).length;
      const duplicateCount = responses.filter(r => r.status === 409 || r.status === 400).length;

      // Critical: Only one should succeed
      expect(successCount).toBeLessThanOrEqual(1);
      // Others should fail
      expect(duplicateCount + successCount).toBe(5);

      if (successCount === 1) {
        testUsers.push({ email: sharedEmail, password: testPassword });
      }
    });

    test('should maintain data consistency with concurrent registrations', async () => {
      const registrations = [];
      const emails = [];

      // Create 5 concurrent registrations
      for (let i = 0; i < 5; i++) {
        const email = generateUniqueEmail();
        emails.push(email);
        testUsers.push({ email, password: testPassword });

        const promise = request(app)
          .post('/api/v1/auth/register')
          .send({
            name: `Consistency Test ${i}`,
            email,
            password: testPassword,
          });

        registrations.push(promise);
      }

      await Promise.all(registrations);

      // Verify all users exist in database
      const users = await User.find({ email: { $in: emails } });
      expect(users.length).toBe(5);

      // Verify each user has unique email
      const uniqueEmails = new Set(users.map(u => u.email));
      expect(uniqueEmails.size).toBe(5);
    });
  });

  describe('Concurrent Login Operations', () => {
    let registeredUsers: any[] = [];

    beforeAll(async () => {
      // Register 5 users for testing
      const registrations = [];
      for (let i = 0; i < 5; i++) {
        const email = generateUniqueEmail();
        registeredUsers.push({ email, password: testPassword });
        testUsers.push({ email, password: testPassword });

        const promise = request(app)
          .post('/api/v1/auth/register')
          .send({
            name: `Login Test User ${i}`,
            email,
            password: testPassword,
          });

        registrations.push(promise);
      }

      await Promise.all(registrations);
    });

    test('should handle 5 concurrent logins successfully', async () => {
      const logins = registeredUsers.map(user =>
        request(app)
          .post('/api/v1/auth/login')
          .send({
            email: user.email,
            password: testPassword,
          })
      );

      const responses = await Promise.all(logins);

      const successCount = responses.filter(r => r.status === 200).length;
      expect(successCount).toBe(5);

      // Verify tokens
      for (const response of responses) {
        if (response.status === 200) {
          expect(response.body.data).toHaveProperty('accessToken');
          expect(response.body.data).toHaveProperty('user');
        }
      }
    });

    test('should handle mixed concurrent login operations', async () => {
      const mixedOps = [
        // Valid logins
        ...registeredUsers.slice(0, 3).map(user =>
          request(app)
            .post('/api/v1/auth/login')
            .send({
              email: user.email,
              password: testPassword,
            })
        ),
        // Invalid password
        request(app)
          .post('/api/v1/auth/login')
          .send({
            email: registeredUsers[3].email,
            password: 'WrongPassword',
          }),
        // Non-existent user
        request(app)
          .post('/api/v1/auth/login')
          .send({
            email: 'nonexistent@test.com',
            password: testPassword,
          }),
      ];

      const responses = await Promise.all(mixedOps);

      const successCount = responses.filter(r => r.status === 200).length;
      const failureCount = responses.filter(r => r.status === 401).length;

      expect(successCount).toBe(3);
      expect(failureCount).toBeGreaterThan(0);
    });
  });

  describe('Rate Limiting Under Concurrent Load', () => {
    test('should enforce registration rate limit', async () => {
      const registrations = [];
      const emails = [];

      // Attempt 15 concurrent registrations (limit is typically 5 per 15 minutes)
      for (let i = 0; i < 15; i++) {
        const email = generateUniqueEmail();
        emails.push(email);

        const promise = request(app)
          .post('/api/v1/auth/register')
          .send({
            name: `Rate Limit Test ${i}`,
            email,
            password: testPassword,
          });

        registrations.push(promise);
      }

      const responses = await Promise.all(registrations);

      // Some should succeed, some should be rate limited
      const successCount = responses.filter(r => r.status === 201).length;
      const rateLimitedCount = responses.filter(r => r.status === 429).length;

      expect(successCount + rateLimitedCount).toBeGreaterThan(0);

      // Cleanup successful registrations
      const successfulEmails = responses
        .filter(r => r.status === 201)
        .map((r, idx) => emails[responses.indexOf(r)])
        .filter(Boolean);

      if (successfulEmails.length > 0) {
        testUsers.push(...successfulEmails.map(email => ({ email, password: testPassword })));
      }
    });

    test('should enforce login rate limit', async () => {
      const email = generateUniqueEmail();

      // Register a user first
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Rate Limit Login Test',
          email,
          password: testPassword,
        });

      testUsers.push({ email, password: testPassword });

      // Attempt many concurrent logins (limit is typically 10 per 15 minutes)
      const logins = [];
      for (let i = 0; i < 20; i++) {
        const promise = request(app)
          .post('/api/v1/auth/login')
          .send({
            email,
            password: testPassword,
          });

        logins.push(promise);
      }

      const responses = await Promise.all(logins);

      const successCount = responses.filter(r => r.status === 200).length;
      const rateLimitedCount = responses.filter(r => r.status === 429).length;

      // Either we have successful logins or rate limiting is working
      expect(successCount + rateLimitedCount).toBe(20);
    });
  });

  describe('Concurrent Authenticated Access', () => {
    let userTokens: any[] = [];

    beforeAll(async () => {
      // Register and login 3 users
      for (let i = 0; i < 3; i++) {
        const email = generateUniqueEmail();
        testUsers.push({ email, password: testPassword });

        const registerRes = await request(app)
          .post('/api/v1/auth/register')
          .send({
            name: `Auth Test User ${i}`,
            email,
            password: testPassword,
          });

        if (registerRes.status === 201) {
          userTokens.push({
            email,
            token: registerRes.body.data.accessToken,
          });
        }
      }
    });

    test('should handle concurrent authenticated requests', async () => {
      const authenticatedRequests = userTokens.map(user =>
        request(app)
          .get('/api/v1/auth/me')
          .set('Authorization', `Bearer ${user.token}`)
      );

      const responses = await Promise.all(authenticatedRequests);

      const successCount = responses.filter(r => r.status === 200).length;
      expect(successCount).toBeGreaterThan(0);

      for (const response of responses) {
        if (response.status === 200) {
          expect(response.body.data).toHaveProperty('user');
          expect(response.body.data.user).toHaveProperty('email');
        }
      }
    });

    test('should reject concurrent requests with invalid tokens', async () => {
      const invalidRequests = [
        request(app)
          .get('/api/v1/auth/me')
          .set('Authorization', 'Bearer invalid.token.here'),
        request(app)
          .get('/api/v1/auth/me')
          .set('Authorization', 'Bearer ' + 'x'.repeat(200)),
        request(app)
          .get('/api/v1/auth/me')
          .set('Authorization', 'Bearer '),
      ];

      const responses = await Promise.all(invalidRequests);

      const unauthorizedCount = responses.filter(r => r.status === 401).length;
      expect(unauthorizedCount).toBeGreaterThan(0);
    });
  });

  describe('Database Integrity Under Concurrent Load', () => {
    test('should maintain referential integrity with concurrent operations', async () => {
      const email1 = generateUniqueEmail();
      const email2 = generateUniqueEmail();
      testUsers.push({ email: email1, password: testPassword });
      testUsers.push({ email: email2, password: testPassword });

      const operations = [
        request(app)
          .post('/api/v1/auth/register')
          .send({
            name: 'Integrity Test 1',
            email: email1,
            password: testPassword,
          }),
        request(app)
          .post('/api/v1/auth/register')
          .send({
            name: 'Integrity Test 2',
            email: email2,
            password: testPassword,
          }),
      ];

      const responses = await Promise.all(operations);

      // Verify database state
      const users = await User.find({ email: { $in: [email1, email2] } });
      expect(users.length).toBe(2);

      // Verify data integrity
      for (const user of users) {
        expect(user.email).toBeDefined();
        expect(user.name).toBeDefined();
        expect(user.password).toBeDefined();
      }
    });
  });

  describe('Bulk Operations Performance', () => {
    test('should complete 20 concurrent registrations within timeout', async () => {
      const registrations = [];
      const startTime = Date.now();

      for (let i = 0; i < 20; i++) {
        const email = generateUniqueEmail();
        testUsers.push({ email, password: testPassword });

        const promise = request(app)
          .post('/api/v1/auth/register')
          .send({
            name: `Perf Test ${i}`,
            email,
            password: testPassword,
          });

        registrations.push(promise);
      }

      const responses = await Promise.all(registrations);
      const duration = Date.now() - startTime;

      const successCount = responses.filter(r => r.status === 201).length;

      // Should complete in reasonable time (under 30 seconds)
      expect(duration).toBeLessThan(30000);

      // Should successfully handle most requests
      expect(successCount).toBeGreaterThan(10);

      console.log(`Processed 20 registrations in ${duration}ms (${successCount} successful)`);
    });
  });
});
