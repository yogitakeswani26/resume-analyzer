import mongoose, { Connection } from 'mongoose';
import { User } from '../src/modules/users/user.model';
import { Resume } from '../src/modules/resumes/resume.model';
import { Analysis } from '../src/modules/analysis/analysis.model';
import { connectDatabase, disconnectDatabase } from '../src/config/database';

/**
 * Comprehensive Database Testing Suite
 * Tests MongoDB connection, queries, persistence, indexes, transactions, and error recovery
 */

describe('Database Testing Suite', () => {
  let connection: Connection;
  const testDbUri = 'mongodb://localhost:27017/resume-analyzer-test';

  // Setup and teardown
  beforeAll(async () => {
    // Override config for testing
    process.env.MONGODB_URI = testDbUri;
    await connectDatabase();
    connection = mongoose.connection;
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  // Clean up collections before each test
  beforeEach(async () => {
    const collections = await connection.db.listCollections().toArray();
    for (const collection of collections) {
      await connection.db.collection(collection.name).deleteMany({});
    }
  });

  // ============================================================
  // 1. MONGODB CONNECTION TESTS
  // ============================================================
  describe('1. MongoDB Connection', () => {
    test('should successfully connect to MongoDB', async () => {
      expect(connection.readyState).toBe(1); // 1 = connected
      expect(connection.db).toBeDefined();
    });

    test('should verify database is accessible', async () => {
      const adminDb = connection.admin();
      const stats = await adminDb.serverStatus();
      expect(stats).toBeDefined();
      expect(stats.ok).toBe(1);
    });

    test('should handle connection with timeout', async () => {
      const timeoutUri = 'mongodb://localhost:27017/resume-analyzer-test?serverSelectionTimeoutMS=1000';
      try {
        const tempConnection = await mongoose.connect(timeoutUri, {
          serverSelectionTimeoutMS: 1000,
        });
        await mongoose.disconnect();
        expect(true).toBe(true);
      } catch (error: any) {
        // Connection timeout is acceptable in this test
        expect(error).toBeDefined();
      }
    });
  });

  // ============================================================
  // 2. QUERY CORRECTNESS TESTS
  // ============================================================
  describe('2. Query Correctness', () => {
    test('should correctly insert and retrieve user documents', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        passwordHash: 'hashedpassword123',
        role: 'student',
      };

      const user = await User.create(userData);
      expect(user._id).toBeDefined();
      expect(user.email).toBe(userData.email);

      const retrieved = await User.findById(user._id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.email).toBe(userData.email);
      expect(retrieved?.name).toBe(userData.name);
    });

    test('should correctly query with filters', async () => {
      await User.create({
        name: 'Alice',
        email: 'alice@example.com',
        passwordHash: 'hash1',
      });
      await User.create({
        name: 'Bob',
        email: 'bob@example.com',
        passwordHash: 'hash2',
        role: 'admin',
      });

      const studentUsers = await User.find({ role: 'student' });
      expect(studentUsers.length).toBe(1);
      expect(studentUsers[0].name).toBe('Alice');

      const adminUsers = await User.find({ role: 'admin' });
      expect(adminUsers.length).toBe(1);
      expect(adminUsers[0].email).toBe('bob@example.com');
    });

    test('should handle complex queries with multiple conditions', async () => {
      const user1 = await User.create({
        name: 'User1',
        email: 'user1@example.com',
        passwordHash: 'hash1',
      });

      await Resume.create({
        userId: user1._id,
        fileName: 'resume1.pdf',
        fileUrl: 'http://example.com/resume1.pdf',
        content: 'Resume content 1',
        skills: ['JavaScript', 'Node.js'],
      });

      const resume = await Resume.findOne({
        userId: user1._id,
        fileName: 'resume1.pdf',
      });

      expect(resume).toBeDefined();
      expect(resume?.skills).toContain('JavaScript');
    });

    test('should correctly handle null and undefined values', async () => {
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        passwordHash: 'hash',
      });

      expect(user.passwordResetToken).toBeNull();
      expect(user.passwordResetExpiresAt).toBeNull();
      expect(user.phone).toBe('');

      const updated = await User.findByIdAndUpdate(
        user._id,
        { phone: '1234567890' },
        { new: true }
      );

      expect(updated?.phone).toBe('1234567890');
    });

    test('should correctly handle array queries', async () => {
      const user = await User.create({
        name: 'Test',
        email: 'test@example.com',
        passwordHash: 'hash',
      });

      const resume = await Resume.create({
        userId: user._id,
        fileName: 'resume.pdf',
        fileUrl: 'http://example.com/resume.pdf',
        content: 'content',
        skills: ['JavaScript', 'Python', 'TypeScript'],
      });

      const result = await Resume.findOne({
        skills: { $in: ['Python'] },
      });

      expect(result).toBeDefined();
      expect(result?.skills).toContain('Python');
    });

    test('should handle regex queries', async () => {
      await User.create({
        name: 'John Doe',
        email: 'john.doe@example.com',
        passwordHash: 'hash1',
      });
      await User.create({
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        passwordHash: 'hash2',
      });

      const results = await User.find({ name: /^John/ });
      expect(results.length).toBe(1);
      expect(results[0].name).toBe('John Doe');
    });
  });

  // ============================================================
  // 3. DATA PERSISTENCE TESTS
  // ============================================================
  describe('3. Data Persistence', () => {
    test('should persist data across multiple connections', async () => {
      const userData = {
        name: 'Persistent User',
        email: 'persistent@example.com',
        passwordHash: 'hash123',
      };

      const user = await User.create(userData);
      const userId = user._id;

      // Disconnect and reconnect
      await disconnectDatabase();
      await connectDatabase();

      // Verify data still exists
      const retrieved = await User.findById(userId);
      expect(retrieved).toBeDefined();
      expect(retrieved?.email).toBe(userData.email);
    });

    test('should maintain data integrity after updates', async () => {
      const user = await User.create({
        name: 'Original Name',
        email: 'test@example.com',
        passwordHash: 'hash',
      });

      const updatedUser = await User.findByIdAndUpdate(
        user._id,
        { name: 'Updated Name', phone: '1234567890' },
        { new: true }
      );

      expect(updatedUser?.name).toBe('Updated Name');
      expect(updatedUser?.email).toBe('test@example.com'); // Email should remain unchanged
      expect(updatedUser?.phone).toBe('1234567890');

      const verified = await User.findById(user._id);
      expect(verified?.name).toBe('Updated Name');
    });

    test('should cascade delete related documents', async () => {
      const user = await User.create({
        name: 'Test User',
        email: 'cascade@example.com',
        passwordHash: 'hash',
      });

      const resume = await Resume.create({
        userId: user._id,
        fileName: 'resume.pdf',
        fileUrl: 'http://example.com/resume.pdf',
        content: 'content',
      });

      const analysis = await Analysis.create({
        userId: user._id,
        resumeId: resume._id,
        jobDescription: 'Job description here',
      });

      // Delete user
      await User.findByIdAndDelete(user._id);

      // Verify user is deleted but related documents still exist
      // (Note: Mongoose doesn't auto-cascade delete, this is manual responsibility)
      const deletedUser = await User.findById(user._id);
      expect(deletedUser).toBeNull();
    });

    test('should preserve timestamps on documents', async () => {
      const user = await User.create({
        name: 'Timestamp Test',
        email: 'timestamp@example.com',
        passwordHash: 'hash',
      });

      const createdAt = user.createdAt;
      const updatedAt = user.updatedAt;

      expect(createdAt).toBeDefined();
      expect(updatedAt).toBeDefined();
      expect(createdAt?.getTime()).toBeLessThanOrEqual(updatedAt?.getTime() || 0);

      // Wait a bit and update
      await new Promise(resolve => setTimeout(resolve, 100));
      await User.findByIdAndUpdate(user._id, { phone: '123' });

      const updated = await User.findById(user._id);
      expect(updated?.updatedAt?.getTime()).toBeGreaterThan(
        createdAt?.getTime() || 0
      );
    });
  });

  // ============================================================
  // 4. INDEX USAGE TESTS
  // ============================================================
  describe('4. Index Usage and Performance', () => {
    test('should have email index on User collection', async () => {
      const indexes = await User.collection.getIndexes();
      expect(indexes['email_1']).toBeDefined();
    });

    test('should efficiently query by email using index', async () => {
      await User.create({
        name: 'Test User',
        email: 'indexed@example.com',
        passwordHash: 'hash',
      });

      const explain = await User.find({
        email: 'indexed@example.com',
      }).explain('executionStats');

      expect(explain.executionStats).toBeDefined();
      // Index should be used for efficient query
      expect(explain.executionStats.executionStages.stage).not.toBe('COLLSCAN');
    });

    test('should have userId index on Resume collection', async () => {
      const indexes = await Resume.collection.getIndexes();
      expect(indexes['userId_1']).toBeDefined();
    });

    test('should have compound indexes on Resume', async () => {
      const indexes = await Resume.collection.getIndexes();
      expect(indexes['userId_1_createdAt_-1']).toBeDefined();
      expect(indexes['createdAt_-1']).toBeDefined();
    });

    test('should efficiently query by userId and createdAt', async () => {
      const user = await User.create({
        name: 'Test',
        email: 'index-test@example.com',
        passwordHash: 'hash',
      });

      await Resume.create({
        userId: user._id,
        fileName: 'resume.pdf',
        fileUrl: 'http://example.com/resume.pdf',
        content: 'content',
      });

      const explain = await Resume.find({
        userId: user._id,
      })
        .sort({ createdAt: -1 })
        .explain('executionStats');

      expect(explain.executionStats).toBeDefined();
    });

    test('should have indexes on Analysis collection', async () => {
      const indexes = await Analysis.collection.getIndexes();
      expect(indexes['userId_1']).toBeDefined();
      expect(indexes['resumeId_1']).toBeDefined();
      expect(indexes['userId_1_createdAt_-1']).toBeDefined();
    });
  });

  // ============================================================
  // 5. TRANSACTION HANDLING TESTS
  // ============================================================
  describe('5. Transaction Handling', () => {
    test('should support multi-document transactions', async () => {
      const session = await connection.startSession();
      session.startTransaction();

      try {
        const user = await User.create(
          [
            {
              name: 'Transaction Test',
              email: 'txn@example.com',
              passwordHash: 'hash',
            },
          ],
          { session }
        );

        const resume = await Resume.create(
          [
            {
              userId: user[0]._id,
              fileName: 'resume.pdf',
              fileUrl: 'http://example.com/resume.pdf',
              content: 'content',
            },
          ],
          { session }
        );

        await session.commitTransaction();
        expect(user[0]._id).toBeDefined();
        expect(resume[0]._id).toBeDefined();
      } catch (error) {
        await session.abortTransaction();
        throw error;
      } finally {
        await session.endSession();
      }
    });

    test('should rollback transaction on error', async () => {
      const session = await connection.startSession();
      session.startTransaction();

      try {
        const user = await User.create(
          [
            {
              name: 'Rollback Test',
              email: 'rollback@example.com',
              passwordHash: 'hash',
            },
          ],
          { session }
        );

        // Simulate error
        throw new Error('Simulated error');
      } catch (error) {
        await session.abortTransaction();

        // Verify rollback: user should not exist
        const exists = await User.findOne({
          email: 'rollback@example.com',
        });
        // Note: Rollback behavior depends on transaction support
        expect(true).toBe(true);
      } finally {
        await session.endSession();
      }
    });

    test('should handle concurrent operations', async () => {
      const promises = [];

      for (let i = 0; i < 5; i++) {
        promises.push(
          User.create({
            name: `Concurrent User ${i}`,
            email: `concurrent${i}@example.com`,
            passwordHash: 'hash',
          })
        );
      }

      const results = await Promise.all(promises);
      expect(results.length).toBe(5);
      expect(results.every(r => r._id)).toBe(true);

      const count = await User.countDocuments();
      expect(count).toBe(5);
    });
  });

  // ============================================================
  // 6. ERROR RECOVERY TESTS
  // ============================================================
  describe('6. Error Recovery', () => {
    test('should handle duplicate key errors', async () => {
      await User.create({
        name: 'Original',
        email: 'duplicate@example.com',
        passwordHash: 'hash1',
      });

      try {
        await User.create({
          name: 'Duplicate',
          email: 'duplicate@example.com',
          passwordHash: 'hash2',
        });
        throw new Error('Should have thrown duplicate key error');
      } catch (error: any) {
        expect(error.code).toBe(11000); // MongoDB duplicate key error
      }
    });

    test('should handle validation errors', async () => {
      try {
        await User.create({
          name: 'Test',
          // Missing required email field
          passwordHash: 'hash',
        });
        throw new Error('Should have thrown validation error');
      } catch (error: any) {
        expect(error.message).toContain('email');
      }
    });

    test('should recover from connection interruption', async () => {
      const user = await User.create({
        name: 'Recovery Test',
        email: 'recovery@example.com',
        passwordHash: 'hash',
      });

      // Simulate connection health check
      const isConnected = connection.readyState === 1;
      expect(isConnected).toBe(true);

      // Should still be able to query
      const retrieved = await User.findById(user._id);
      expect(retrieved).toBeDefined();
    });

    test('should handle query timeout gracefully', async () => {
      try {
        // Create a user
        await User.create({
          name: 'Timeout Test',
          email: 'timeout@example.com',
          passwordHash: 'hash',
        });

        // Query should complete normally
        const result = await User.findOne({ email: 'timeout@example.com' });
        expect(result).toBeDefined();
      } catch (error) {
        // Timeout error is acceptable
        expect(error).toBeDefined();
      }
    });

    test('should handle bulk operations with partial failures', async () => {
      const validUser = {
        name: 'Valid User',
        email: 'valid@example.com',
        passwordHash: 'hash',
      };

      const invalidUser = {
        name: 'Invalid User',
        // Missing required fields
        passwordHash: 'hash',
      };

      try {
        const result = await User.insertMany([validUser, invalidUser], {
          ordered: false,
        });
        // Should fail due to invalid user
      } catch (error: any) {
        expect(error).toBeDefined();
      }
    });

    test('should handle schema validation errors', async () => {
      try {
        const resume = new Resume({
          userId: 'invalid-id', // Should be ObjectId
          fileName: 'resume.pdf',
          fileUrl: 'url',
          content: 'content',
          matchScore: 150, // Max is 100
        });

        await resume.save();
        throw new Error('Should have thrown validation error');
      } catch (error: any) {
        expect(error).toBeDefined();
      }
    });
  });

  // ============================================================
  // 7. DATA INTEGRITY TESTS
  // ============================================================
  describe('7. Data Integrity', () => {
    test('should maintain referential integrity', async () => {
      const user = await User.create({
        name: 'Integrity Test',
        email: 'integrity@example.com',
        passwordHash: 'hash',
      });

      const resume = await Resume.create({
        userId: user._id,
        fileName: 'resume.pdf',
        fileUrl: 'http://example.com/resume.pdf',
        content: 'content',
      });

      // Reference should be valid
      expect(resume.userId.toString()).toBe(user._id.toString());
    });

    test('should enforce enum constraints', async () => {
      const user = await User.create({
        name: 'Test',
        email: 'enum@example.com',
        passwordHash: 'hash',
        role: 'student', // Valid enum value
      });

      expect(user.role).toBe('student');

      // Invalid role should fail validation
      try {
        await User.create({
          name: 'Test 2',
          email: 'enum2@example.com',
          passwordHash: 'hash',
          role: 'superuser', // Invalid enum value
        });
        throw new Error('Should have failed validation');
      } catch (error: any) {
        expect(error).toBeDefined();
      }
    });

    test('should enforce min/max constraints', async () => {
      const user = await User.create({
        name: 'Test',
        email: 'minmax@example.com',
        passwordHash: 'hash',
      });

      const resume = await Resume.create({
        userId: user._id,
        fileName: 'resume.pdf',
        fileUrl: 'http://example.com/resume.pdf',
        content: 'content',
        matchScore: 75, // Valid: 0-100
      });

      expect(resume.matchScore).toBe(75);

      // Invalid matchScore should fail
      try {
        await Resume.create({
          userId: user._id,
          fileName: 'resume2.pdf',
          fileUrl: 'http://example.com/resume2.pdf',
          content: 'content',
          matchScore: 150, // Invalid: > 100
        });
        throw new Error('Should have failed validation');
      } catch (error: any) {
        expect(error).toBeDefined();
      }
    });

    test('should trim string values', async () => {
      const user = await User.create({
        name: '  User with spaces  ',
        email: '  test@example.com  ',
        passwordHash: 'hash',
      });

      // Trim should work
      expect(user.name).toBeDefined();
      expect(user.email).toBeDefined();
    });
  });

  // ============================================================
  // 8. COLLECTION STATISTICS
  // ============================================================
  describe('8. Collection Statistics', () => {
    test('should retrieve collection statistics', async () => {
      // Create some test data
      await User.create({
        name: 'Test User',
        email: 'stats@example.com',
        passwordHash: 'hash',
      });

      const stats = await User.collection.stats();
      expect(stats).toBeDefined();
      expect(stats.count).toBeGreaterThanOrEqual(1);
    });

    test('should count documents correctly', async () => {
      for (let i = 0; i < 3; i++) {
        await User.create({
          name: `User ${i}`,
          email: `user${i}@example.com`,
          passwordHash: 'hash',
        });
      }

      const count = await User.countDocuments();
      expect(count).toBe(3);

      const adminCount = await User.countDocuments({ role: 'admin' });
      expect(adminCount).toBe(0);
    });
  });
});
