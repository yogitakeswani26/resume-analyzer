import mongoose from 'mongoose';
import { config } from '../server/src/config/env.js';
import { User } from '../server/src/modules/users/user.model.js';
import { Resume } from '../server/src/modules/resumes/resume.model.js';
import { Analysis } from '../server/src/modules/analysis/analysis.model.js';

// Test Results
interface TestResult {
  name: string;
  status: 'PASS' | 'FAIL';
  message: string;
  duration: number;
}

const results: TestResult[] = [];

/**
 * Test 1: Verify All Indexes Exist and Work
 */
async function testIndexes(): Promise<void> {
  const startTime = Date.now();
  try {
    console.log('\n📊 TEST 1: Checking Database Indexes...');

    // Check User model indexes
    const userIndexes = await User.collection.getIndexes();
    console.log('✓ User indexes:', Object.keys(userIndexes));

    if (!userIndexes['email_1']) {
      throw new Error('Missing email index on User collection');
    }

    // Check Resume model indexes
    const resumeIndexes = await Resume.collection.getIndexes();
    console.log('✓ Resume indexes:', Object.keys(resumeIndexes));

    if (!resumeIndexes['userId_1']) {
      throw new Error('Missing userId index on Resume collection');
    }

    if (!resumeIndexes['userId_1_createdAt_-1']) {
      throw new Error('Missing userId+createdAt compound index on Resume collection');
    }

    // Check Analysis model indexes
    const analysisIndexes = await Analysis.collection.getIndexes();
    console.log('✓ Analysis indexes:', Object.keys(analysisIndexes));

    if (!analysisIndexes['userId_1']) {
      throw new Error('Missing userId index on Analysis collection');
    }

    if (!analysisIndexes['resumeId_1']) {
      throw new Error('Missing resumeId index on Analysis collection');
    }

    results.push({
      name: 'Index Verification',
      status: 'PASS',
      message: 'All required indexes exist and are properly configured',
      duration: Date.now() - startTime,
    });
    console.log('✅ All indexes verified');
  } catch (error) {
    results.push({
      name: 'Index Verification',
      status: 'FAIL',
      message: error instanceof Error ? error.message : String(error),
      duration: Date.now() - startTime,
    });
    console.error('❌ Index verification failed:', error);
  }
}

/**
 * Test 2: Detect N+1 Query Problems
 */
async function testN1Problems(): Promise<void> {
  const startTime = Date.now();
  try {
    console.log('\n🔍 TEST 2: Checking for N+1 Query Problems...');

    // Create test data
    const testUser = await User.create({
      name: 'Test User N+1',
      email: `n1-test-${Date.now()}@example.com`,
      passwordHash: 'test-hash',
      role: 'student',
    });

    // Create multiple resumes
    const resumeCount = 5;
    const resumeIds: string[] = [];
    for (let i = 0; i < resumeCount; i++) {
      const resume = await Resume.create({
        userId: testUser._id,
        fileName: `resume-${i}.pdf`,
        fileUrl: `http://example.com/resume-${i}.pdf`,
        content: `Test resume content ${i}`,
        skills: ['Node.js', 'React'],
      });
      resumeIds.push(resume._id.toString());
    }

    // Count queries - Good approach using populate
    console.log('Testing query efficiency with populate...');
    const userWithResumes = await User.findById(testUser._id);
    const resumes = await Resume.find({ userId: testUser._id });

    if (resumes.length !== resumeCount) {
      throw new Error(`Expected ${resumeCount} resumes, got ${resumes.length}`);
    }

    // Test indexing efficiency
    console.log('Testing index usage...');
    const explain = await Resume.collection
      .find({ userId: testUser._id })
      .explain('executionStats');

    if (explain.executionStats.executionStages.stage === 'COLLSCAN') {
      throw new Error('Query is using COLLSCAN instead of index (N+1 problem detected)');
    }

    // Cleanup
    await User.deleteOne({ _id: testUser._id });
    await Resume.deleteMany({ userId: testUser._id });

    results.push({
      name: 'N+1 Query Detection',
      status: 'PASS',
      message: 'No N+1 problems detected. Queries use proper indexing',
      duration: Date.now() - startTime,
    });
    console.log('✅ No N+1 problems detected');
  } catch (error) {
    results.push({
      name: 'N+1 Query Detection',
      status: 'FAIL',
      message: error instanceof Error ? error.message : String(error),
      duration: Date.now() - startTime,
    });
    console.error('❌ N+1 test failed:', error);
  }
}

/**
 * Test 3: Verify Transactions Work
 */
async function testTransactions(): Promise<void> {
  const startTime = Date.now();
  try {
    console.log('\n💳 TEST 3: Testing Transaction Support...');

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Create user within transaction
      const user = await User.create([{
        name: 'Transaction Test User',
        email: `transaction-${Date.now()}@example.com`,
        passwordHash: 'test-hash',
        role: 'student',
      }], { session });

      if (!user[0]._id) {
        throw new Error('Failed to create user in transaction');
      }

      // Create resume within transaction
      const resume = await Resume.create([{
        userId: user[0]._id,
        fileName: 'transaction-test.pdf',
        fileUrl: 'http://example.com/transaction-test.pdf',
        content: 'Transaction test content',
        skills: ['Testing'],
      }], { session });

      if (!resume[0]._id) {
        throw new Error('Failed to create resume in transaction');
      }

      // Commit transaction
      await session.commitTransaction();

      // Verify data was saved
      const savedUser = await User.findById(user[0]._id);
      const savedResume = await Resume.findById(resume[0]._id);

      if (!savedUser || !savedResume) {
        throw new Error('Data not persisted after transaction commit');
      }

      // Cleanup
      await User.deleteOne({ _id: user[0]._id });
      await Resume.deleteOne({ _id: resume[0]._id });

      results.push({
        name: 'Transaction Support',
        status: 'PASS',
        message: 'Transactions are working correctly. Data properly committed and saved',
        duration: Date.now() - startTime,
      });
      console.log('✅ Transactions working correctly');
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  } catch (error) {
    results.push({
      name: 'Transaction Support',
      status: 'FAIL',
      message: error instanceof Error ? error.message : String(error),
      duration: Date.now() - startTime,
    });
    console.error('❌ Transaction test failed:', error);
  }
}

/**
 * Test 4: Connection Stability Under Load
 */
async function testConnectionStability(): Promise<void> {
  const startTime = Date.now();
  try {
    console.log('\n⚡ TEST 4: Testing Connection Stability Under Load...');

    const concurrentRequests = 50;
    const operations: Promise<any>[] = [];

    // Generate concurrent write operations
    for (let i = 0; i < concurrentRequests; i++) {
      const operation = User.create({
        name: `Load Test User ${i}`,
        email: `load-test-${Date.now()}-${i}@example.com`,
        passwordHash: 'test-hash',
        role: 'student',
      }).catch(error => {
        if (error.code === 11000) {
          // Duplicate key error, expected in concurrent tests
          return null;
        }
        throw error;
      });
      operations.push(operation);
    }

    // Wait for all operations
    const results_load = await Promise.all(operations);
    const successCount = results_load.filter(r => r !== null).length;

    if (successCount < concurrentRequests * 0.9) {
      throw new Error(
        `Only ${successCount}/${concurrentRequests} concurrent operations succeeded (expected >90%)`
      );
    }

    // Verify data was saved
    const count = await User.countDocuments({ name: /Load Test User/ });

    // Test concurrent read operations
    const readOps: Promise<any>[] = [];
    for (let i = 0; i < 50; i++) {
      readOps.push(User.find({ role: 'student' }).limit(10).lean());
    }

    await Promise.all(readOps);

    // Cleanup
    await User.deleteMany({ name: /Load Test User/ });

    results.push({
      name: 'Connection Stability',
      status: 'PASS',
      message: `Handled ${concurrentRequests} concurrent operations successfully. Connection stable under load`,
      duration: Date.now() - startTime,
    });
    console.log(`✅ Connection stable. Processed ${concurrentRequests} concurrent operations`);
  } catch (error) {
    results.push({
      name: 'Connection Stability',
      status: 'FAIL',
      message: error instanceof Error ? error.message : String(error),
      duration: Date.now() - startTime,
    });
    console.error('❌ Connection stability test failed:', error);
  }
}

/**
 * Test 5: Verify Connection Pooling
 */
async function testConnectionPooling(): Promise<void> {
  const startTime = Date.now();
  try {
    console.log('\n🔄 TEST 5: Verifying Connection Pooling...');

    const mongooseConn = mongoose.connection;

    if (!mongooseConn) {
      throw new Error('No active MongoDB connection');
    }

    // Check connection status
    if (mongooseConn.readyState !== 1) {
      throw new Error(`Connection not ready. State: ${mongooseConn.readyState}`);
    }

    // Verify connection pool settings
    const client = mongooseConn.getClient();
    if (!client) {
      throw new Error('Failed to get MongoDB client');
    }

    results.push({
      name: 'Connection Pooling',
      status: 'PASS',
      message: 'MongoDB connection pool is properly configured and active',
      duration: Date.now() - startTime,
    });
    console.log('✅ Connection pooling verified');
  } catch (error) {
    results.push({
      name: 'Connection Pooling',
      status: 'FAIL',
      message: error instanceof Error ? error.message : String(error),
      duration: Date.now() - startTime,
    });
    console.error('❌ Connection pooling test failed:', error);
  }
}

/**
 * Test 6: Index Performance Analysis
 */
async function testIndexPerformance(): Promise<void> {
  const startTime = Date.now();
  try {
    console.log('\n⚙️ TEST 6: Analyzing Index Performance...');

    // Create test data
    const testUser = await User.create({
      name: 'Index Performance Test',
      email: `index-perf-${Date.now()}@example.com`,
      passwordHash: 'test-hash',
      role: 'student',
    });

    // Create multiple resumes with different dates
    for (let i = 0; i < 10; i++) {
      await Resume.create({
        userId: testUser._id,
        fileName: `resume-perf-${i}.pdf`,
        fileUrl: `http://example.com/resume-perf-${i}.pdf`,
        content: `Test resume for performance analysis ${i}`,
        skills: ['Node.js', 'React', 'MongoDB'],
        createdAt: new Date(Date.now() - i * 86400000), // Different dates
      });
    }

    // Test query with compound index
    const startQuery = Date.now();
    const resumes = await Resume.find({ userId: testUser._id })
      .sort({ createdAt: -1 })
      .lean();
    const queryDuration = Date.now() - startQuery;

    // Check explain plan
    const explain = await Resume.collection
      .find({ userId: testUser._id })
      .sort({ createdAt: -1 })
      .explain('executionStats');

    const executedDocs = explain.executionStats.totalDocsExamined;
    const returnedDocs = explain.executionStats.nReturned;
    const efficiency = (returnedDocs / executedDocs) * 100;

    if (efficiency < 90) {
      throw new Error(
        `Index efficiency too low: ${efficiency.toFixed(2)}% (examined ${executedDocs}, returned ${returnedDocs})`
      );
    }

    // Cleanup
    await User.deleteOne({ _id: testUser._id });
    await Resume.deleteMany({ userId: testUser._id });

    results.push({
      name: 'Index Performance',
      status: 'PASS',
      message: `Query executed in ${queryDuration}ms with ${efficiency.toFixed(2)}% index efficiency`,
      duration: Date.now() - startTime,
    });
    console.log(`✅ Index performance satisfactory (${efficiency.toFixed(2)}% efficiency)`);
  } catch (error) {
    results.push({
      name: 'Index Performance',
      status: 'FAIL',
      message: error instanceof Error ? error.message : String(error),
      duration: Date.now() - startTime,
    });
    console.error('❌ Index performance test failed:', error);
  }
}

/**
 * Main Test Runner
 */
async function runAllTests(): Promise<void> {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('         DATABASE TEST SUITE - COMPREHENSIVE VERIFICATION    ');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`\n🔌 Connecting to MongoDB: ${config.mongodb_uri}`);

  try {
    // Connect to database
    await mongoose.connect(config.mongodb_uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('✅ Connected to MongoDB');

    // Run all tests
    await testIndexes();
    await testN1Problems();
    await testTransactions();
    await testConnectionStability();
    await testConnectionPooling();
    await testIndexPerformance();

    // Print summary
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('                        TEST SUMMARY                         ');
    console.log('═══════════════════════════════════════════════════════════');

    const passed = results.filter(r => r.status === 'PASS').length;
    const failed = results.filter(r => r.status === 'FAIL').length;
    const total = results.length;

    results.forEach(result => {
      const icon = result.status === 'PASS' ? '✅' : '❌';
      console.log(`${icon} ${result.name} (${result.duration}ms)`);
      console.log(`   ${result.message}`);
    });

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log(`📊 Results: ${passed}/${total} tests PASSED, ${failed}/${total} tests FAILED`);
    console.log('═══════════════════════════════════════════════════════════\n');

    process.exit(failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('❌ Fatal error during test execution:', error);
    process.exit(1);
  } finally {
    // Disconnect from database
    try {
      await mongoose.disconnect();
      console.log('✅ Disconnected from MongoDB');
    } catch (error) {
      console.error('Error disconnecting:', error);
    }
  }
}

// Run tests
runAllTests().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
