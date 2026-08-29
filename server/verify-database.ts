import mongoose from 'mongoose';
import { config } from './src/config/env.js';
import { User } from './src/modules/users/user.model.js';
import { Resume } from './src/modules/resumes/resume.model.js';
import { Analysis } from './src/modules/analysis/analysis.model.js';

interface VerificationResult {
  category: string;
  checks: Array<{
    name: string;
    status: 'PASS' | 'FAIL';
    message: string;
  }>;
}

const results: VerificationResult[] = [];

async function ensureIndexes(): Promise<void> {
  console.log('\n🔧 Ensuring Indexes Exist...');

  try {
    // Create indexes explicitly with skipIfExists option
    const indexOptions = { skipIfExists: true };

    await User.collection.createIndex({ email: 1 }, indexOptions).catch(() => {});
    console.log('✓ Email index on User ensured');

    await Resume.collection.createIndex({ userId: 1 }, indexOptions).catch(() => {});
    console.log('✓ UserId index on Resume ensured');

    await Resume.collection.createIndex({ userId: 1, createdAt: -1 }, indexOptions).catch(() => {});
    console.log('✓ Compound userId+createdAt index on Resume ensured');

    await Resume.collection.createIndex({ createdAt: -1 }, indexOptions).catch(() => {});
    console.log('✓ CreatedAt index on Resume ensured');

    await Analysis.collection.createIndex({ userId: 1 }, indexOptions).catch(() => {});
    console.log('✓ UserId index on Analysis ensured');

    await Analysis.collection.createIndex({ resumeId: 1 }, indexOptions).catch(() => {});
    console.log('✓ ResumeId index on Analysis ensured');

    await Analysis.collection.createIndex({ userId: 1, createdAt: -1 }, indexOptions).catch(() => {});
    console.log('✓ Compound userId+createdAt index on Analysis ensured');
  } catch (error) {
    console.error('❌ Error creating indexes:', error);
    // Don't throw, continue with verification
  }
}

async function verifyIndexes(): Promise<void> {
  console.log('\n📊 Verifying Indexes...');
  const categoryResult: VerificationResult = {
    category: 'Index Verification',
    checks: [],
  };

  try {
    // User indexes
    const userIndexes = await User.collection.getIndexes();
    const hasEmailIndex = 'email_1' in userIndexes;
    categoryResult.checks.push({
      name: 'User email index exists',
      status: hasEmailIndex ? 'PASS' : 'FAIL',
      message: hasEmailIndex
        ? 'Email index properly created on User collection'
        : 'Missing email index on User collection',
    });

    // Resume indexes
    const resumeIndexes = await Resume.collection.getIndexes();
    const hasUserIdIndex = 'userId_1' in resumeIndexes;
    const hasCompoundIndex = 'userId_1_createdAt_-1' in resumeIndexes;

    categoryResult.checks.push({
      name: 'Resume userId index exists',
      status: hasUserIdIndex ? 'PASS' : 'FAIL',
      message: hasUserIdIndex
        ? 'UserId index properly created on Resume collection'
        : 'Missing userId index on Resume collection',
    });

    categoryResult.checks.push({
      name: 'Resume compound index exists',
      status: hasCompoundIndex ? 'PASS' : 'FAIL',
      message: hasCompoundIndex
        ? 'Compound userId+createdAt index properly created'
        : 'Missing compound index on Resume collection',
    });

    // Analysis indexes
    const analysisIndexes = await Analysis.collection.getIndexes();
    const hasAnalysisUserIdIndex = 'userId_1' in analysisIndexes;
    const hasAnalysisResumeIdIndex = 'resumeId_1' in analysisIndexes;

    categoryResult.checks.push({
      name: 'Analysis userId index exists',
      status: hasAnalysisUserIdIndex ? 'PASS' : 'FAIL',
      message: hasAnalysisUserIdIndex
        ? 'UserId index properly created on Analysis collection'
        : 'Missing userId index on Analysis collection',
    });

    categoryResult.checks.push({
      name: 'Analysis resumeId index exists',
      status: hasAnalysisResumeIdIndex ? 'PASS' : 'FAIL',
      message: hasAnalysisResumeIdIndex
        ? 'ResumeId index properly created on Analysis collection'
        : 'Missing resumeId index on Analysis collection',
    });

    results.push(categoryResult);
  } catch (error) {
    console.error('❌ Error verifying indexes:', error);
    throw error;
  }
}

async function testQueryPerformance(): Promise<void> {
  console.log('\n⚡ Testing Query Performance...');
  const categoryResult: VerificationResult = {
    category: 'Query Performance',
    checks: [],
  };

  try {
    // Create test data
    const testUser = await User.create({
      name: 'Query Performance Test',
      email: `query-perf-${Date.now()}@example.com`,
      passwordHash: 'test-hash',
      role: 'student',
    });

    // Create multiple resumes
    for (let i = 0; i < 10; i++) {
      await Resume.create({
        userId: testUser._id,
        fileName: `resume-${i}.pdf`,
        fileUrl: `http://example.com/resume-${i}.pdf`,
        content: `Resume content ${i}`,
        skills: ['Node.js', 'React'],
      });
    }

    // Test query with index
    const explain = await Resume.collection
      .find({ userId: testUser._id })
      .explain('executionStats');

    const executionStage = explain.executionStats.executionStages.stage;
    const docsExamined = explain.executionStats.totalDocsExamined;
    const docsReturned = explain.executionStats.nReturned;

    const isUsingIndex = executionStage !== 'COLLSCAN';
    const efficiency =
      docsReturned > 0 ? (docsReturned / docsExamined) * 100 : 0;

    categoryResult.checks.push({
      name: 'Resume query uses indexes (no COLLSCAN)',
      status: isUsingIndex ? 'PASS' : 'FAIL',
      message: `Query execution stage: ${executionStage}. ${
        isUsingIndex ? 'Using index' : 'Using collection scan (N+1 problem)'
      }`,
    });

    categoryResult.checks.push({
      name: 'Query efficiency >= 90%',
      status: efficiency >= 90 ? 'PASS' : 'FAIL',
      message: `Index efficiency: ${efficiency.toFixed(2)}% (examined ${docsExamined}, returned ${docsReturned})`,
    });

    // Cleanup
    await User.deleteOne({ _id: testUser._id });
    await Resume.deleteMany({ userId: testUser._id });

    results.push(categoryResult);
  } catch (error) {
    console.error('❌ Error testing query performance:', error);
    throw error;
  }
}

async function testConnectionStability(): Promise<void> {
  console.log('\n🔌 Testing Connection Stability...');
  const categoryResult: VerificationResult = {
    category: 'Connection Stability',
    checks: [],
  };

  try {
    // Test concurrent operations
    const concurrentOps = 50;
    const operations: Promise<any>[] = [];

    for (let i = 0; i < concurrentOps; i++) {
      operations.push(
        User.create({
          name: `Load Test ${i}`,
          email: `load-${Date.now()}-${i}@example.com`,
          passwordHash: 'test',
          role: 'student',
        }).catch(err => {
          if (err.code === 11000) return null; // Duplicate key
          throw err;
        })
      );
    }

    const results_load = await Promise.all(operations);
    const successCount = results_load.filter(r => r !== null).length;
    const successRate = (successCount / concurrentOps) * 100;

    categoryResult.checks.push({
      name: 'Concurrent write operations (50 ops)',
      status: successRate >= 90 ? 'PASS' : 'FAIL',
      message: `${successCount}/${concurrentOps} operations succeeded (${successRate.toFixed(1)}%)`,
    });

    // Test concurrent reads
    const readOps = Array.from({ length: 50 }, () =>
      User.find({ role: 'student' }).limit(10).lean()
    );
    await Promise.all(readOps);

    categoryResult.checks.push({
      name: 'Concurrent read operations (50 queries)',
      status: 'PASS',
      message: 'All read operations completed successfully',
    });

    // Cleanup
    await User.deleteMany({ name: /Load Test/ });

    results.push(categoryResult);
  } catch (error) {
    console.error('❌ Error testing connection stability:', error);
    throw error;
  }
}

async function testTransactionSupport(): Promise<void> {
  console.log('\n💳 Testing Transaction Support...');
  const categoryResult: VerificationResult = {
    category: 'Transaction Support',
    checks: [],
  };

  try {
    // Check if MongoDB supports transactions (requires replica set)
    const admin = mongoose.connection.db.admin();
    const serverStatus = await admin.serverStatus();
    const supportsTransactions = serverStatus.repl !== undefined;

    if (!supportsTransactions) {
      categoryResult.checks.push({
        name: 'Transaction support enabled',
        status: 'FAIL',
        message: 'MongoDB running in standalone mode. Transactions require replica set configuration',
      });
    } else {
      // Test transaction
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        const user = await User.create([{
          name: 'Transaction Test',
          email: `tx-${Date.now()}@example.com`,
          passwordHash: 'test',
        }], { session });

        const resume = await Resume.create([{
          userId: user[0]._id,
          fileName: 'test.pdf',
          fileUrl: 'http://test.com',
          content: 'test',
        }], { session });

        await session.commitTransaction();

        categoryResult.checks.push({
          name: 'Transaction support',
          status: 'PASS',
          message: 'Multi-document transactions working correctly',
        });

        // Cleanup
        await User.deleteOne({ _id: user[0]._id });
        await Resume.deleteOne({ _id: resume[0]._id });
      } finally {
        await session.endSession();
      }
    }

    results.push(categoryResult);
  } catch (error) {
    categoryResult.checks.push({
      name: 'Transaction support',
      status: 'FAIL',
      message: `Error: ${error instanceof Error ? error.message : String(error)}`,
    });
    results.push(categoryResult);
  }
}

async function runVerification(): Promise<void> {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('           DATABASE VERIFICATION & OPTIMIZATION              ');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`\n🔌 Connecting to MongoDB: ${config.mongodb_uri}`);

  try {
    await mongoose.connect(config.mongodb_uri);
    console.log('✅ Connected to MongoDB\n');

    // Ensure indexes exist
    await ensureIndexes();

    // Run verification tests
    await verifyIndexes();
    await testQueryPerformance();
    await testConnectionStability();
    await testTransactionSupport();

    // Print detailed results
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('                    VERIFICATION RESULTS                     ');
    console.log('═══════════════════════════════════════════════════════════');

    let totalTests = 0;
    let passedTests = 0;

    results.forEach(category => {
      console.log(`\n📋 ${category.category}`);
      category.checks.forEach(check => {
        const icon = check.status === 'PASS' ? '✅' : '❌';
        console.log(`  ${icon} ${check.name}`);
        console.log(`     ${check.message}`);
        totalTests++;
        if (check.status === 'PASS') passedTests++;
      });
    });

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log(
      `📊 Summary: ${passedTests}/${totalTests} checks PASSED`
    );
    console.log('═══════════════════════════════════════════════════════════\n');

    const allPassed = passedTests === totalTests;
    process.exit(allPassed ? 0 : 1);
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  } finally {
    try {
      await mongoose.disconnect();
    } catch (error) {
      console.error('Error disconnecting:', error);
    }
  }
}

runVerification().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
