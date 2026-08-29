# Quick Start Guide - Concurrent Operations Testing

## 30-Second Setup

### 1. Install Dependencies
```bash
cd /Users/chetanya/Documents/RESUME-ANALYZER/server
npm install
```

### 2. Configure Environment
```bash
# Copy test configuration
cp .env.example .env.test

# Ensure MongoDB is running (or update connection string in .env.test)
# export MONGODB_URI=mongodb://localhost:27017/resume-analyzer-test
```

### 3. Run Tests

#### Option A: TypeScript Direct Execution (Fast)
```bash
npx tsx concurrent-operations-test.ts
```

#### Option B: Jest Test Suite (Detailed)
```bash
npm test -- concurrent-operations
```

#### Option C: Full Test Runner (Comprehensive)
```bash
./run-concurrent-tests.sh standard
```

---

## Test Profiles

| Profile | Duration | Use Case | Command |
|---------|----------|----------|---------|
| **QUICK** | 3-5 min | Fast feedback, CI/CD | `./run-concurrent-tests.sh quick` |
| **STANDARD** | 5-10 min | Regular testing | `./run-concurrent-tests.sh standard` |
| **COMPREHENSIVE** | 15-30 min | Full regression | `./run-concurrent-tests.sh comprehensive` |
| **STRESS** | 30-60 min | Performance baseline | `./run-concurrent-tests.sh stress` |
| **PRODUCTION** | Variable | Pre-release validation | `./run-concurrent-tests.sh production` |

---

## What Gets Tested

### ✅ Core Features
1. **Concurrent User Registration** (5, 10, 20+ users)
2. **Rate Limiting** (enforces request limits)
3. **Duplicate Prevention** (no race condition bugs)
4. **Concurrent Login** (bulk authentication)
5. **Token Refresh** (bulk token operations)
6. **Authenticated Access** (authorization checks)
7. **Database Integrity** (data consistency)

### ✅ Security Checks
- Email uniqueness enforced
- Rate limiting working correctly
- Invalid tokens rejected
- Authorization verified
- Input validation active

### ✅ Performance Metrics
- Throughput (requests/second)
- Response time (min/max/avg)
- Success rates
- Concurrent handling

---

## Understanding Results

### Success Indicators ✅
```
✅ PASS: Concurrent Registrations (5 users)
   All 5 users registered successfully
   Duration: 1234ms
```
**Meaning:** Test passed, no issues. ✨

### Warning Indicators ⚠️
```
⚠️ WARN: Rate Limiting Enforcement
   3/10 requests rate limited (as expected)
   Duration: 2345ms
```
**Meaning:** Test passed but with warnings. Investigate if unexpected.

### Failure Indicators ❌
```
❌ FAIL: Duplicate Email Prevention
   Multiple users with same email created!
   Duration: 1234ms
```
**Meaning:** Critical issue detected. Must fix immediately. 🚨

---

## Common Commands

### Run All Concurrent Tests
```bash
npm test -- concurrent-operations
```

### Run Tests with Coverage
```bash
npm test:coverage -- concurrent-operations
```

### Run in Watch Mode
```bash
npm test:watch -- concurrent-operations
```

### Run with Verbose Output
```bash
NODE_ENV=test VERBOSE_LOGGING=true npx tsx concurrent-operations-test.ts
```

### Run Specific Test Scenario
```bash
# Edit concurrent-operations-test.ts and comment out scenarios you don't want
# Then run:
npx tsx concurrent-operations-test.ts
```

### View Test Results
```bash
# Last test logs
tail -f server/test-results/concurrent-test-*.log

# Metrics
cat server/test-results/metrics-*.json
```

---

## Troubleshooting

### Problem: "Connection refused"
```
Solution: Start MongoDB
mongod
```

### Problem: "Rate limiting not working"
```
Solution: Check it's not disabled
grep RATE_LIMIT_DISABLED .env.test
# Should be: RATE_LIMIT_DISABLED=false
```

### Problem: "Tests timeout"
```
Solution: Increase timeout
export JEST_TIMEOUT=60000
npm test -- concurrent-operations
```

### Problem: "Duplicate users created"
```
Solution: CRITICAL BUG - Stop and investigate
1. Check database unique index
2. Review auth.service.ts for race conditions
3. Run: npm run db:verify
```

---

## Test File Locations

```
server/
├── concurrent-operations-test.ts              ← Main test (run directly)
├── src/tests/concurrent-operations.test.ts   ← Jest tests
├── concurrent-test-config.ts                 ← Configuration
├── concurrent-test-utils.ts                  ← Helper functions
├── run-concurrent-tests.sh                   ← Test runner script
│
├── CONCURRENT_TESTS_README.md                ← Full documentation
├── CONCURRENT_TEST_SUITE_SUMMARY.md          ← Detailed summary
└── QUICK_START_GUIDE.md                      ← This file
```

---

## Performance Expectations

### Registration (5 users concurrently)
- Expected success: 100%
- Expected duration: < 2 seconds
- Throughput: 5-10 req/sec

### Rate Limiting (10 requests)
- Expected rate limited: 5+ (limit is 5 per 15 min)
- Expected duration: < 3 seconds
- HTTP 429 responses: Yes

### Duplicate Prevention (5 same email)
- Expected success: 1 only
- Expected failures: 4
- Expected duration: < 2 seconds

### High Concurrency (20 users)
- Expected success: > 80%
- Expected duration: < 5 seconds
- Database consistency: Yes

---

## Integration with CI/CD

### GitHub Actions
```yaml
- name: Run Concurrent Tests
  run: cd server && npm test -- concurrent-operations
  timeout-minutes: 10
```

### Pre-commit Hook
```bash
#!/bin/bash
npm test -- concurrent-operations || exit 1
```

### Pre-push Hook
```bash
#!/bin/bash
./run-concurrent-tests.sh quick || exit 1
```

---

## Test Execution Flow

```
Start Tests
    ↓
Check Prerequisites (Node.js, npm, MongoDB)
    ↓
Setup Environment (.env configuration)
    ↓
Concurrent Registrations (5 users)
    ↓
Rate Limiting Test (10 requests)
    ↓
Duplicate Prevention (5 same email)
    ↓
Concurrent Logins (5 users)
    ↓
Bulk Token Refresh (10 requests)
    ↓
Authenticated Access (5 users)
    ↓
High Concurrency Stress (20 users)
    ↓
Generate Report & Metrics
    ↓
Cleanup Test Data
    ↓
Display Summary
    ↓
Done ✅
```

---

## Key Metrics to Monitor

1. **Success Rate** - % of requests that succeeded
2. **Throughput** - Requests per second
3. **Response Time** - min/max/avg (milliseconds)
4. **Rate Limit Hits** - Requests blocked (should be > 0 if testing limits)
5. **Database Integrity** - Consistency checks

---

## When Should I Run These Tests?

- ✅ **Before Committing Code** - Local validation
- ✅ **On Every PR** - CI/CD validation
- ✅ **Before Release** - Production safety check
- ✅ **After Database Migration** - Integrity verification
- ✅ **Performance Baseline** - Capacity planning
- ✅ **After Configuration Changes** - Rate limit updates
- ✅ **Weekly** - Regression detection

---

## Next Steps

1. **Run tests locally** to ensure setup is correct
   ```bash
   npx tsx concurrent-operations-test.ts
   ```

2. **Review results** in console output and logs

3. **Add to CI/CD** for automated testing

4. **Monitor performance** over time

5. **Alert on failures** to catch issues early

---

## Support

- Full documentation: `CONCURRENT_TESTS_README.md`
- Detailed breakdown: `CONCURRENT_TEST_SUITE_SUMMARY.md`
- API docs: `/api-docs` (Swagger)
- Database schema: `src/config/database.ts`

---

**Ready to test?**
```bash
cd /Users/chetanya/Documents/RESUME-ANALYZER/server
npm test -- concurrent-operations
```

Good luck! 🚀
