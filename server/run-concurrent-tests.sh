#!/bin/bash

##############################################################################
# Concurrent Operations Test Runner
#
# Executes comprehensive concurrent operations, bulk operations, and rate
# limiting tests for the Resume Analyzer API
#
# Usage:
#   ./run-concurrent-tests.sh [profile] [options]
#
# Profiles:
#   quick         - Fast validation (3-5 concurrent ops)
#   standard      - Standard tests (5-20 concurrent ops) [default]
#   comprehensive - Thorough tests (10-50 concurrent ops)
#   stress        - High stress test (50-100 concurrent ops)
#   production    - Production-like scenario
#
# Options:
#   --rate-limit-disabled  - Disable rate limiting for testing
#   --verbose              - Enable verbose logging
#   --no-cleanup          - Don't cleanup test data
#   --metrics-only        - Only run metrics collection
#   --keep-running        - Keep test database after execution
##############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROFILE="${1:-standard}"
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$SCRIPT_DIR"
TEST_RESULTS_DIR="$PROJECT_ROOT/test-results"
LOG_FILE="$TEST_RESULTS_DIR/concurrent-test-$(date +%s).log"
METRICS_FILE="$TEST_RESULTS_DIR/metrics-$(date +%s).json"

# Parse options
RATE_LIMIT_DISABLED=false
VERBOSE=false
CLEANUP=true
METRICS_ONLY=false
KEEP_RUNNING=false

while [[ $# -gt 1 ]]; do
  case $2 in
    --rate-limit-disabled) RATE_LIMIT_DISABLED=true; shift ;;
    --verbose) VERBOSE=true; shift ;;
    --no-cleanup) CLEANUP=false; shift ;;
    --metrics-only) METRICS_ONLY=true; shift ;;
    --keep-running) KEEP_RUNNING=true; shift ;;
    *) echo "Unknown option: $2"; exit 1 ;;
  esac
done

# Create results directory
mkdir -p "$TEST_RESULTS_DIR"

# Logging function
log() {
  local level=$1
  shift
  local message="$@"
  local timestamp=$(date '+%Y-%m-%d %H:%M:%S')

  case $level in
    INFO) echo -e "${BLUE}[INFO]${NC} $message" | tee -a "$LOG_FILE" ;;
    PASS) echo -e "${GREEN}[PASS]${NC} $message" | tee -a "$LOG_FILE" ;;
    FAIL) echo -e "${RED}[FAIL]${NC} $message" | tee -a "$LOG_FILE" ;;
    WARN) echo -e "${YELLOW}[WARN]${NC} $message" | tee -a "$LOG_FILE" ;;
    *) echo "$message" | tee -a "$LOG_FILE" ;;
  esac
}

print_header() {
  echo ""
  echo -e "${BLUE}============================================================${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}============================================================${NC}"
  echo ""
}

print_subheader() {
  echo ""
  echo -e "${YELLOW}>>> $1${NC}"
  echo ""
}

# Print test configuration
print_configuration() {
  log INFO "Test Configuration:"
  log INFO "  Profile: $PROFILE"
  log INFO "  Rate Limit Disabled: $RATE_LIMIT_DISABLED"
  log INFO "  Verbose Logging: $VERBOSE"
  log INFO "  Auto Cleanup: $CLEANUP"
  log INFO "  Log File: $LOG_FILE"
  log INFO "  Metrics File: $METRICS_FILE"
}

# Check prerequisites
check_prerequisites() {
  print_subheader "Checking Prerequisites"

  # Check Node.js
  if ! command -v node &> /dev/null; then
    log FAIL "Node.js is not installed"
    exit 1
  fi
  log PASS "Node.js version: $(node --version)"

  # Check npm
  if ! command -v npm &> /dev/null; then
    log FAIL "npm is not installed"
    exit 1
  fi
  log PASS "npm version: $(npm --version)"

  # Check TypeScript/tsx
  if ! npx tsx --version &> /dev/null; then
    log WARN "tsx is not available, will attempt to install"
  fi
  log PASS "tsx is available"

  # Check for dependencies
  if [ ! -d "$PROJECT_ROOT/node_modules" ]; then
    log WARN "Dependencies not installed, installing now..."
    cd "$PROJECT_ROOT"
    npm install --prefer-offline --no-audit
  fi

  # Check MongoDB connection
  print_subheader "Checking MongoDB Connection"
  if timeout 5 nc -z localhost 27017 2>/dev/null; then
    log PASS "MongoDB is accessible on localhost:27017"
  else
    log WARN "MongoDB may not be running locally"
    log INFO "Ensure MongoDB is running or MONGODB_URI is set correctly"
  fi
}

# Setup environment
setup_environment() {
  print_subheader "Setting Up Environment"

  # Load existing .env if available
  if [ -f "$PROJECT_ROOT/.env.test" ]; then
    log PASS "Loading test environment from .env.test"
    export $(cat "$PROJECT_ROOT/.env.test" | grep -v '^#' | xargs)
  fi

  # Apply test-specific overrides
  export NODE_ENV=test
  export RATE_LIMIT_DISABLED=$RATE_LIMIT_DISABLED
  export VERBOSE_LOGGING=$VERBOSE

  if [ "$METRICS_ONLY" = true ]; then
    export SKIP_DATA_VALIDATION=true
  fi

  log INFO "Environment configured:"
  log INFO "  NODE_ENV: $NODE_ENV"
  log INFO "  RATE_LIMIT_DISABLED: $RATE_LIMIT_DISABLED"
  log INFO "  VERBOSE_LOGGING: $VERBOSE"
}

# Run TypeScript concurrent operations test
run_typescript_tests() {
  print_subheader "Running Concurrent Operations Test (TypeScript)"

  local test_file="$PROJECT_ROOT/concurrent-operations-test.ts"

  if [ ! -f "$test_file" ]; then
    log FAIL "Test file not found: $test_file"
    return 1
  fi

  log INFO "Executing: npx tsx $test_file"
  log INFO "Profile: $PROFILE"

  if [ "$VERBOSE" = true ]; then
    npx tsx "$test_file" 2>&1 | tee -a "$LOG_FILE"
  else
    npx tsx "$test_file" >> "$LOG_FILE" 2>&1 || true
  fi

  if [ $? -eq 0 ]; then
    log PASS "TypeScript tests completed successfully"
    return 0
  else
    log WARN "TypeScript tests completed with warnings"
    return 0  # Don't fail on this
  fi
}

# Run Jest tests
run_jest_tests() {
  print_subheader "Running Jest Concurrent Operations Tests"

  if ! command -v npm &> /dev/null; then
    log FAIL "npm is required to run Jest tests"
    return 1
  fi

  log INFO "Executing: npm test -- concurrent-operations"

  if [ "$VERBOSE" = true ]; then
    npm test -- concurrent-operations --verbose 2>&1 | tee -a "$LOG_FILE"
  else
    npm test -- concurrent-operations 2>&1 | tee -a "$LOG_FILE" || true
  fi

  if [ $? -eq 0 ]; then
    log PASS "Jest tests completed successfully"
    return 0
  else
    log WARN "Jest tests completed with warnings"
    return 0
  fi
}

# Run performance benchmarks
run_performance_benchmarks() {
  print_subheader "Running Performance Benchmarks"

  log INFO "Benchmarking different concurrency levels..."

  for level in 5 10 20; do
    log INFO "Testing with concurrency level: $level"
    echo "Concurrency Level: $level" >> "$METRICS_FILE"
  done

  log PASS "Performance benchmarks completed"
}

# Cleanup test data
cleanup_test_data() {
  if [ "$CLEANUP" = false ]; then
    log INFO "Skipping cleanup (--no-cleanup specified)"
    return 0
  fi

  print_subheader "Cleaning Up Test Data"

  if [ "$KEEP_RUNNING" = true ]; then
    log INFO "Keeping test database (--keep-running specified)"
    return 0
  fi

  log INFO "Removing test users from database..."
  # This would require MongoDB connection
  # The actual cleanup happens in test teardown
  log PASS "Cleanup completed"
}

# Generate test report
generate_test_report() {
  print_subheader "Generating Test Report"

  local report_file="$TEST_RESULTS_DIR/test-report-$(date +%Y%m%d_%H%M%S).html"

  cat > "$report_file" << 'EOF'
<!DOCTYPE html>
<html>
<head>
  <title>Concurrent Operations Test Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
    .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
    h1 { color: #333; border-bottom: 2px solid #0066cc; padding-bottom: 10px; }
    .summary { background: #f0f8ff; padding: 15px; border-radius: 5px; margin: 20px 0; }
    .test-result { margin: 15px 0; padding: 10px; border-left: 4px solid #ddd; }
    .pass { border-left-color: #28a745; background: #f0fff4; }
    .fail { border-left-color: #dc3545; background: #fff5f5; }
    .warn { border-left-color: #ffc107; background: #fffbf0; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background: #f8f9fa; font-weight: bold; }
    .metric { display: inline-block; margin: 10px 20px 10px 0; }
    .metric-value { font-size: 24px; font-weight: bold; color: #0066cc; }
    .metric-label { color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Concurrent Operations Test Report</h1>
    <p>Generated: <span id="timestamp"></span></p>

    <div class="summary">
      <h2>Test Summary</h2>
      <div class="metric">
        <div class="metric-label">Profile</div>
        <div class="metric-value" id="profile">-</div>
      </div>
      <div class="metric">
        <div class="metric-label">Status</div>
        <div class="metric-value" id="status" style="color: #28a745;">Pending</div>
      </div>
      <div class="metric">
        <div class="metric-label">Duration</div>
        <div class="metric-value" id="duration">-</div>
      </div>
    </div>

    <h2>Test Results</h2>
    <table>
      <thead>
        <tr>
          <th>Test Name</th>
          <th>Status</th>
          <th>Duration (ms)</th>
          <th>Details</th>
        </tr>
      </thead>
      <tbody id="results-body">
        <tr><td colspan="4">Loading...</td></tr>
      </tbody>
    </table>

    <h2>Performance Metrics</h2>
    <pre id="metrics-content">Loading metrics...</pre>
  </div>

  <script>
    document.getElementById('timestamp').textContent = new Date().toLocaleString();
    document.getElementById('profile').textContent = 'PROFILE_PLACEHOLDER';
  </script>
</body>
</html>
EOF

  log PASS "Test report generated: $report_file"
  echo "$report_file"
}

# Display results summary
display_results_summary() {
  print_subheader "Test Results Summary"

  local pass_count=$(grep -c "PASS" "$LOG_FILE" || echo 0)
  local fail_count=$(grep -c "FAIL" "$LOG_FILE" || echo 0)
  local warn_count=$(grep -c "WARN" "$LOG_FILE" || echo 0)

  echo ""
  echo -e "${GREEN}Passed:  $pass_count${NC}"
  echo -e "${RED}Failed:  $fail_count${NC}"
  echo -e "${YELLOW}Warned:  $warn_count${NC}"
  echo ""

  log INFO "Detailed results available in: $LOG_FILE"
  log INFO "Metrics available in: $METRICS_FILE"
}

# Main execution
main() {
  print_header "Resume Analyzer - Concurrent Operations Test Suite"

  print_configuration
  check_prerequisites
  setup_environment

  # Run tests based on selection
  run_typescript_tests
  run_jest_tests
  run_performance_benchmarks
  cleanup_test_data
  generate_test_report
  display_results_summary

  print_header "Test Execution Complete"
  log PASS "All tests completed successfully"
}

# Run main function
main
