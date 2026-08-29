# Concurrent Operations Test Suite

Comprehensive testing suite for concurrent user registrations, bulk operations, and rate limiting enforcement in the Resume Analyzer API.

## Test Coverage

### 1. **Concurrent User Registrations**
- **Test Cases:**
  - 5 concurrent registrations
  - 10 concurrent registrations
  - 20+ registrations (stress test)
- **Validation:**
  - All registrations complete successfully
  - Valid tokens returned
  - Database records created correctly
  - No data corruption

### 2. **Rate Limiting Enforcement**
- **Test Cases:**
  - Registration endpoint rate limiting (5 per 15 min)
  - Login endpoint rate limiting (10 per 15 min)
  - Token refresh rate limiting (20 per minute)
  - Password reset rate limiting (3 per 15 min)
- **Validation:**
  - Excess requests return 429 status
  - Rate limit headers present
  - Limits reset correctly

### 3. **Duplicate Email Prevention**
- **Test Cases:**
  - 5 concurrent requests with same email
  - Race condition detection
  - Database constraint validation
- **Validation:**
  - Only one registration succeeds
  - Other 4 receive 409 Conflict
  - No orphaned records

### 4. **Concurrent Login Operations**
- **Test Cases:**
  - 5 concurrent logins
  - Mixed valid/invalid credentials
  - High-volume concurrent logins
- **Validation:**
  - Valid logins return 200 + token
  - Invalid credentials return 401
  - Tokens are unique and valid

### 5. **Concurrent Authenticated Access**
- **Test Cases:**
  - GET /auth/me with multiple tokens
  - Invalid token rejection
  - Expired token handling
- **Validation:**
  - Authenticated users get correct data
  - Invalid tokens rejected with 401

### 6. **Bulk Token Refresh**
- **Test Cases:**
  - 10 concurrent token refreshes
  - Rate limit enforcement
  - Token rotation
- **Validation:**
  - New tokens generated
  - Old tokens invalidated
  - Rate limits enforced

### 7. **Database Integrity**
- **Test Cases:**
  - Concurrent writes with unique constraints
  - Transaction consistency
  - Data validation
- **Validation:**
  - No duplicate records created
  - All fields properly validated
  - Referential integrity maintained

## Running Tests

### Prerequisites
```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.test
# Edit .env.test with test database URL
export NODE_ENV=test
```

### Running TypeScript Test (Direct Execution)
```bash
# Run the standalone concurrent operations test
npx tsx concurrent-operations-test.ts

# Expected output:
# ✅ PASS: Concurrent Registrations (5 users)
# ✅ PASS: Rate Limiting Enforcement (Registration)
# ❌ FAIL: [test name] (if failures)
# ... summary report
```

### Running Jest Test Suite
```bash
# Run all tests including concurrent operations
npm test

# Run only concurrent operations tests
npm test -- concurrent-operations

# Run with coverage
npm test:coverage -- concurrent-operations

# Run in watch mode
npm test:watch -- concurrent-operations
```

### Running with Specific Concurrency Levels
```bash
# You can modify the test parameters in concurrent-operations-test.ts
# Change the concurrency level parameters:
await this.testConcurrentRegistrations(5);    // 5 concurrent users
await this.testConcurrentRegistrations(10);   // 10 concurrent users
await this.testConcurrentRegistrations(20);   // 20 concurrent users
```

## Test Results Interpretation

### Success Indicators
- ✅ All registrations complete within timeout
- ✅ All tokens are valid and unique
- ✅ Rate limiting blocks excess requests (429)
- ✅ Only one user created per unique email
- ✅ Database shows correct user counts

### Warning Indicators
- ⚠️ Some registrations succeed, others blocked by rate limit
- ⚠️ Partial success in high-concurrency scenarios
- ⚠️ Response time degradation under load

### Failure Indicators
- ❌ Multiple users registered with same email
- ❌ Registrations fail without rate limiting
- ❌ Database inconsistencies
- ❌ Invalid or missing tokens
- ❌ Authentication bypass vulnerabilities

## Performance Metrics Collected

```
totalRequests      - Total concurrent requests sent
successfulRequests - Requests that succeeded (201/200)
failedRequests     - Non-rate-limited failures
rateLimitedRequests - Requests blocked by rate limit (429)
duplicateKeyErrors - Database duplicate key constraint errors
duration           - Total test execution time (ms)
requestsPerSecond  - Throughput metric
concurrencyLevel   - Number of simultaneous operations
```

## Environment Configuration

### For Rate Limit Testing (Disable Rate Limits)
```bash
export RATE_LIMIT_DISABLED=true
npm test -- concurrent-operations
```

### For Production-Like Testing
```bash
export RATE_LIMIT_DISABLED=false
export NODE_ENV=test
npm test -- concurrent-operations
```

### Database Configuration
```bash
# Use test database
export MONGODB_URI=mongodb://localhost:27017/resume-analyzer-test

# Or MongoDB Atlas
export MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/resume-analyzer-test
```

## Troubleshooting

### Issue: "Too many connection refused" errors
**Solution:** Ensure MongoDB is running and accessible
```bash
# Check MongoDB status
mongod --version

# Or use test database
export MONGODB_URI=mongodb://localhost:27017/test-db
```

### Issue: Rate limiting not enforced
**Solution:** Verify rate limit middleware is enabled
```bash
# In .env.test
RATE_LIMIT_DISABLED=false

# Or check security.middleware.ts
```

### Issue: Tests timeout
**Solution:** Increase Jest timeout
```bash
# In jest.config.cjs
testTimeout: 60000, // 60 seconds
```

### Issue: "Email already registered" on first run
**Solution:** Clean test database between runs
```bash
# Add to package.json scripts
"test:clean": "mongo resume-analyzer-test --eval 'db.users.deleteMany({})'",
"test:concurrent": "npm run test:clean && npx tsx concurrent-operations-test.ts"
```

## Expected Performance Benchmarks

| Test | Concurrency | Expected Duration | Success Rate |
|------|-------------|-------------------|--------------|
| Basic Registrations | 5 | < 2s | 100% |
| Rate Limit Test | 10 | < 3s | > 50% (rest rate limited) |
| Login Operations | 5 | < 2s | 100% |
| Duplicate Prevention | 5 | < 2s | 1 success, 4 fail |
| High Concurrency | 20 | < 5s | > 80% |
| Authenticated Access | 5 | < 1s | 100% |
| Bulk Token Refresh | 10 | < 2s | > 80% |

## Integration with CI/CD

### GitHub Actions Example
```yaml
- name: Run concurrent operations tests
  run: |
    export NODE_ENV=test
    npm test -- concurrent-operations
    npx tsx concurrent-operations-test.ts
  timeout-minutes: 5
```

### Error Reporting
Tests that fail return exit code 1, suitable for CI/CD pipelines.

## Security Considerations

1. **Email Uniqueness:** Tests verify emails cannot be duplicated via race conditions
2. **Token Security:** Tests ensure tokens are unique and properly validated
3. **Rate Limiting:** Tests confirm limits prevent brute force attacks
4. **Input Validation:** Tests verify malformed data is rejected
5. **Authentication:** Tests ensure endpoints require proper authorization

## Extending the Test Suite

### Adding New Concurrent Tests
```typescript
async testMyNewScenario() {
  const testName = 'My New Scenario';
  const startTime = Date.now();

  try {
    const promises = [];
    // Create concurrent operations
    const results = await Promise.all(promises);
    const duration = Date.now() - startTime;

    if (/* success condition */) {
      this.pass(testName, 'Message', duration, metrics);
    } else {
      this.fail(testName, 'Message', duration, metrics);
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    this.fail(testName, `Error: ${error.message}`, duration);
  }
}
```

## Related Documentation
- [Rate Limiting Configuration](src/middleware/security.middleware.ts)
- [Authentication Flow](src/modules/auth/README.md)
- [Database Schema](src/config/database.ts)
- [API Documentation](src/docs/swagger.ts)

## Test Maintenance

### Regular Review Checklist
- [ ] Run tests weekly to catch regressions
- [ ] Update rate limit thresholds if changed
- [ ] Add tests for new endpoints
- [ ] Review performance metrics monthly
- [ ] Verify database integrity after schema changes
- [ ] Update documentation with findings

## Support & Issues

For test failures or issues:
1. Check logs in `/server/logs`
2. Verify environment configuration
3. Review recent code changes
4. Run individual test cases for debugging
5. Check database state manually

## Future Enhancements

- [ ] Add concurrent password reset tests
- [ ] Add concurrent file upload tests
- [ ] Add distributed load testing (multiple machines)
- [ ] Add monitoring/metrics collection
- [ ] Add chaos engineering tests (network failures, timeouts)
- [ ] Add memory leak detection
- [ ] Add database connection pool stress tests
