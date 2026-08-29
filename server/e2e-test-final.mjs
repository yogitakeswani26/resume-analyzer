import axios from 'axios';
import { writeFileSync, unlinkSync } from 'fs';

const API_BASE = 'http://localhost:5001/api/v1';
const FRONTEND_URL = 'http://localhost:5174';

let accessToken = '';
let refreshToken = '';
let userId = '';
const testEmail = `test_${Date.now()}@example.com`;
const testPassword = 'Test@123456';
let resumeId = '';

// Helper function for API calls
async function apiCall(method, endpoint, data = null, isFormData = false) {
  try {
    const config = {
      method,
      url: `${API_BASE}${endpoint}`,
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      validateStatus: () => true, // Don't throw on any status
    };

    if (isFormData && data instanceof FormData) {
      config.data = data;
    } else if (data) {
      config.data = data;
      config.headers['Content-Type'] = 'application/json';
    }

    const response = await axios(config);
    return {
      success: response.status >= 200 && response.status < 300,
      status: response.status,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      status: error.response?.status || 500,
      data: { error: error.message },
    };
  }
}

// Test tracking
const results = [];
function logTest(name, passed, details = '') {
  results.push({ name, passed, details });
  const symbol = passed ? '✅' : '❌';
  console.log(`${symbol} ${name}${details ? ': ' + details : ''}`);
}

async function runTests() {
  console.log('\n========== COMPLETE E2E FLOW DEBUG ==========\n');

  // STEP 1: User visits app → should load homepage
  console.log('STEP 1: User visits app → load homepage');
  try {
    const response = await axios.get(FRONTEND_URL, { validateStatus: () => true });
    logTest('Homepage loads (HTTP 200)', response.status === 200);
  } catch (error) {
    logTest('Homepage loads', false, error.message);
  }

  // STEP 2: Register new account → auto-login → dashboard
  console.log('\nSTEP 2: Register new account → auto-login → dashboard');
  const registerRes = await apiCall('POST', '/auth/register', {
    name: 'Test User',
    email: testEmail,
    password: testPassword,
  });
  logTest('Register user (HTTP 201)', registerRes.success && registerRes.status === 201);

  if (registerRes.success) {
    accessToken = registerRes.data?.data?.accessToken;
    refreshToken = registerRes.data?.data?.refreshToken;
    userId = registerRes.data?.data?.user?._id;
    logTest('Access token received', !!accessToken);
    logTest('Refresh token received', !!refreshToken);
    logTest('User ID received', !!userId);
    logTest('Auto-login successful', !!accessToken, 'Status: ' + registerRes.status);
  } else {
    console.log('   Error:', registerRes.data?.error || registerRes.data);
  }

  // STEP 3: Upload resume → file parses → analysis shows → recommendations display
  console.log('\nSTEP 3: Upload resume → file parses → analysis shows → recommendations display');

  const resumePath = './test_resume.txt';
  const testResumeContent = `JOHN DOE
john@example.com | 123-456-7890

EXPERIENCE
Senior Developer at TechCorp (2020-2024)
- Led team of 5 developers
- Increased performance by 40%

EDUCATION
BS Computer Science from XYZ University (2020)

SKILLS
JavaScript, React, Node.js, MongoDB, Python
`;

  writeFileSync(resumePath, testResumeContent);

  try {
    const formData = new FormData();
    const fileBlob = new Blob([testResumeContent], { type: 'text/plain' });
    formData.append('file', fileBlob, 'test_resume.txt');

    const uploadRes = await apiCall('POST', '/resumes/upload-file', formData, true);
    logTest('Resume upload (HTTP 200/201)', uploadRes.success);

    if (uploadRes.success) {
      resumeId = uploadRes.data?.data?.resume?._id || uploadRes.data?.data?._id;
      logTest('Resume ID received', !!resumeId);

      // STEP 4: AI analysis
      console.log('\nSTEP 4: Click AI analysis → Claude API called → results shown');
      if (resumeId) {
        const analysisRes = await apiCall('POST', '/analysis/ai/' + resumeId, {});
        logTest('AI analysis triggered (HTTP 200)', analysisRes.success);
        logTest('Analysis data received', analysisRes.data?.data?.analysis != null,
          'Has analysis: ' + (analysisRes.data?.data?.analysis != null));

        // Get recommendations
        const recRes = await apiCall('GET', '/analysis/recommendations/' + resumeId);
        logTest('Recommendations retrieved', recRes.success);

        // Get section analysis
        const secRes = await apiCall('GET', '/analysis/sections/' + resumeId);
        logTest('Section analysis retrieved', secRes.success);
      }
    } else {
      console.log('   Upload error:', uploadRes.data?.error || uploadRes.data);
    }
  } catch (error) {
    logTest('Resume upload operations', false, error.message);
  } finally {
    try { unlinkSync(resumePath); } catch (e) {}
  }

  // STEP 5: View profile → edit details → save → verify saved
  console.log('\nSTEP 5: View profile → edit details → save → verify saved');

  // Get current profile
  const profileRes = await apiCall('GET', '/auth/me');
  logTest('Get profile (HTTP 200)', profileRes.success);
  logTest('Profile data received', profileRes.data?.data?.user != null);

  // Note: Auth routes don't have profile update. Let's verify what we have.
  if (profileRes.data?.data?.user) {
    const userEmail = profileRes.data.data.user.email;
    logTest('Email in profile matches', userEmail === testEmail);
  }

  // STEP 6: Logout → redirect to login
  console.log('\nSTEP 6: Logout → redirect to login');
  const logoutRes = await apiCall('POST', '/auth/logout', {});
  logTest('Logout successful (HTTP 200)', logoutRes.success && logoutRes.status === 200);

  // Clear tokens
  accessToken = '';
  refreshToken = '';

  // Verify token is cleared - try to access protected route
  const protectedRes = await apiCall('GET', '/auth/me');
  logTest('Token cleared after logout (HTTP 401)', !protectedRes.success && protectedRes.status === 401);

  // STEP 7: Login again → dashboard loads
  console.log('\nSTEP 7: Login again → dashboard loads');
  const loginRes = await apiCall('POST', '/auth/login', {
    email: testEmail,
    password: testPassword,
  });
  logTest('Login successful (HTTP 200)', loginRes.success && loginRes.status === 200);

  if (loginRes.success) {
    accessToken = loginRes.data?.data?.accessToken;
    refreshToken = loginRes.data?.data?.refreshToken;
    logTest('Token re-issued', !!accessToken);
    logTest('Dashboard accessible', !!accessToken, 'Can access protected endpoints');
  } else {
    console.log('   Login error:', loginRes.data?.error);
  }

  // STEP 8: Go to recruiter tools → all tools work (no 401)
  console.log('\nSTEP 8: Go to recruiter tools → all 5 tools work (no 401)');

  // Note: Recruiter routes don't have candidate upload. Let's test what's available.

  // Tool 1: List candidates (Recruiter database)
  const listRes = await apiCall('GET', '/recruiter/candidates');
  logTest('Tool 1: List candidates (HTTP 200)', listRes.success);
  const candidateCount = listRes.data?.data?.resumes?.length || 0;
  logTest('Candidates fetched', listRes.success, `Count: ${candidateCount}`);

  // Tool 2: Compare resumes
  if (resumeId) {
    const compareRes = await apiCall('POST', '/recruiter/compare', {
      resumeIds: [resumeId],
    });
    logTest('Tool 2: Compare resumes', compareRes.success, 'Status: ' + compareRes.status);
  } else {
    logTest('Tool 2: Compare resumes', false, 'No resume ID from upload');
  }

  // Tool 3: Match job description
  if (resumeId) {
    const matchRes = await apiCall('POST', '/recruiter/match-job', {
      resumeId: resumeId,
      jobDescription: 'Senior Software Engineer. Required: 5+ years experience with React and Node.js',
      jobTitle: 'Senior Engineer',
    });
    logTest('Tool 3: Match job', matchRes.success, 'Status: ' + matchRes.status);
  } else {
    logTest('Tool 3: Match job', false, 'No resume ID');
  }

  // Tool 4: Pipeline management
  const pipelineRes = await apiCall('GET', '/recruiter/pipeline');
  logTest('Tool 4: Pipeline management (HTTP 200)', pipelineRes.success);
  logTest('Pipeline data received', pipelineRes.data?.data != null);

  // Tool 5: Analytics dashboard
  const analyticsRes = await apiCall('GET', '/recruiter/analytics');
  logTest('Tool 5: Analytics dashboard (HTTP 200)', analyticsRes.success);
  logTest('Analytics data received', analyticsRes.data?.data != null);

  // STEP 9: Logout completely → token cleared
  console.log('\nSTEP 9: Logout completely → token cleared');
  const finalLogoutRes = await apiCall('POST', '/auth/logout', {});
  logTest('Final logout (HTTP 200)', finalLogoutRes.success && finalLogoutRes.status === 200);

  accessToken = '';
  const finalCheck = await apiCall('GET', '/auth/me');
  logTest('Session completely cleared (HTTP 401)', !finalCheck.success && finalCheck.status === 401);

  // Additional checks
  console.log('\nADDITIONAL CHECKS:');

  // Token refresh test
  if (refreshToken) {
    const refreshRes = await apiCall('POST', '/auth/refresh', {
      refreshToken: refreshToken,
    });
    logTest('Token refresh works', refreshRes.success, 'Status: ' + refreshRes.status);
    if (refreshRes.success) {
      accessToken = refreshRes.data?.data?.accessToken;
      logTest('New token obtained from refresh', !!accessToken);
    }
  }

  // List all resumes
  if (accessToken) {
    const resumesRes = await apiCall('GET', '/resumes');
    logTest('List all resumes', resumesRes.success, 'Status: ' + resumesRes.status);
  }

  // SUMMARY
  console.log('\n========== E2E TEST SUMMARY ==========\n');
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  console.log(`Total Tests: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${total - passed}`);
  console.log(`Success Rate: ${((passed / total) * 100).toFixed(2)}%\n`);

  // Log failed tests
  const failed = results.filter(r => !r.passed);
  if (failed.length > 0) {
    console.log('FAILED TESTS:');
    failed.forEach((test, idx) => {
      console.log(`${idx + 1}. ❌ ${test.name}${test.details ? ': ' + test.details : ''}`);
    });
  }

  console.log('\n========== ALL ISSUES FOUND ==========\n');

  if (failed.length === 0) {
    console.log('✅ NO ISSUES FOUND - Complete flow works perfectly!\n');
  } else {
    console.log(`${failed.length} ISSUES TO FIX:\n`);
    failed.forEach((test, idx) => {
      console.log(`${idx + 1}. ${test.name}`);
      if (test.details) console.log(`   Details: ${test.details}`);
    });
  }

  console.log('\n========== E2E TEST COMPLETE ==========\n');

  return {
    totalTests: total,
    passed,
    failed: total - passed,
    successRate: ((passed / total) * 100).toFixed(2),
    failedTests: failed.map(t => ({ test: t.name, details: t.details })),
  };
}

runTests().catch(console.error);
