import axios from 'axios';
import { writeFileSync, unlinkSync } from 'fs';

const API_BASE = 'http://localhost:5001/api/v1';
const FRONTEND_URL = 'http://localhost:5174';

let accessToken = '';
let refreshToken = '';
let userId = '';
const testEmail = `test_${Date.now()}@example.com`;
const testPassword = 'Test@123456';

// Helper function for API calls
async function apiCall(method, endpoint, data = null, isFormData = false) {
  try {
    const config = {
      method,
      url: `${API_BASE}${endpoint}`,
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    };

    if (isFormData && data instanceof FormData) {
      config.data = data;
      // FormData headers are handled by axios
    } else if (data) {
      config.data = data;
      config.headers['Content-Type'] = 'application/json';
    }

    const response = await axios(config);
    return { success: true, status: response.status, data: response.data };
  } catch (error) {
    return {
      success: false,
      status: error.response?.status,
      statusText: error.response?.statusText,
      error: error.response?.data?.message || error.message,
      errorData: error.response?.data,
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
  console.log('\n========== E2E FLOW DEBUG START ==========\n');

  // STEP 1: User visits app → should load homepage
  console.log('STEP 1: User visits app → load homepage');
  try {
    const response = await axios.get(FRONTEND_URL);
    logTest('Homepage loads', response.status === 200);
  } catch (error) {
    logTest('Homepage loads', false, error.message);
  }

  // STEP 2: Register new account → auto-login → dashboard
  console.log('\nSTEP 2: Register new account');
  const registerRes = await apiCall('POST', '/auth/register', {
    email: testEmail,
    password: testPassword,
    fullName: 'Test User',
  });
  logTest('Register user', registerRes.success, registerRes.error || 'Status: ' + registerRes.status);

  if (registerRes.success) {
    accessToken = registerRes.data?.accessToken;
    refreshToken = registerRes.data?.refreshToken;
    userId = registerRes.data?.user?._id;
    logTest('Access token received', !!accessToken);
    logTest('Refresh token received', !!refreshToken);
    logTest('User ID received', !!userId);
  } else {
    console.log('   Error details:', registerRes.errorData);
  }

  // STEP 3: Upload resume → file parses → analysis shows → recommendations display
  console.log('\nSTEP 3: Upload resume and analyze');

  // Create a simple test resume file
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
    // For file upload, we need to use FormData-like API with axios
    const formData = new FormData();
    const fileBlob = new Blob([testResumeContent], { type: 'text/plain' });
    formData.append('file', fileBlob, 'test_resume.txt');
    formData.append('jobTitle', 'Software Engineer');
    formData.append('industry', 'Technology');

    const uploadRes = await apiCall('POST', '/resumes/upload', formData, true);
    logTest('Resume upload', uploadRes.success, uploadRes.error || 'Status: ' + uploadRes.status);

    if (uploadRes.success) {
      const resumeId = uploadRes.data?.resume?._id || uploadRes.data?._id;
      logTest('Resume ID received', !!resumeId);

      // STEP 4: Click AI analysis → Claude API called → results shown
      console.log('\nSTEP 4: AI analysis');
      if (resumeId) {
        const analysisRes = await apiCall('POST', `/resumes/${resumeId}/analyze`, {
          analysisType: 'comprehensive',
        });
        logTest('AI analysis triggered', analysisRes.success, analysisRes.error || 'Status: ' + analysisRes.status);
        if (analysisRes.success) {
          logTest('Analysis results received',
            analysisRes.data?.analysis?.sections?.length > 0 || analysisRes.data?.analysis,
            'Sections: ' + (analysisRes.data?.analysis?.sections?.length || 0)
          );
        }
      }
    } else {
      console.log('   Upload error details:', uploadRes.errorData);
    }
  } catch (error) {
    logTest('Resume operations', false, error.message);
  } finally {
    try { unlinkSync(resumePath); } catch (e) {}
  }

  // STEP 5: View profile → edit details → save → verify saved
  console.log('\nSTEP 5: Profile management');

  // Get current profile
  const profileRes = await apiCall('GET', '/auth/profile');
  logTest('Get profile', profileRes.success, profileRes.error || 'Status: ' + profileRes.status);

  // Update profile
  const updateRes = await apiCall('PATCH', '/auth/profile', {
    fullName: 'Updated Test User',
    phone: '987-654-3210',
    location: 'San Francisco, CA',
  });
  logTest('Update profile', updateRes.success, updateRes.error || 'Status: ' + updateRes.status);

  // Verify profile update
  const verifyRes = await apiCall('GET', '/auth/profile');
  const nameMatches = verifyRes.data?.user?.fullName === 'Updated Test User';
  logTest('Profile saved correctly', nameMatches, verifyRes.data?.user?.fullName || 'Name not updated');

  // STEP 6: Logout → redirect to login
  console.log('\nSTEP 6: Logout');
  const logoutRes = await apiCall('POST', '/auth/logout', {});
  logTest('Logout successful', logoutRes.success, logoutRes.error || 'Status: ' + logoutRes.status);

  // Clear tokens
  accessToken = '';
  refreshToken = '';

  // Verify token is cleared - try to access protected route
  const protectedRes = await apiCall('GET', '/auth/profile');
  logTest('Token cleared after logout', !protectedRes.success && protectedRes.status === 401, 'Status: ' + protectedRes.status);

  // STEP 7: Login again → dashboard loads
  console.log('\nSTEP 7: Login again');
  const loginRes = await apiCall('POST', '/auth/login', {
    email: testEmail,
    password: testPassword,
  });
  logTest('Login successful', loginRes.success, loginRes.error || 'Status: ' + loginRes.status);

  if (loginRes.success) {
    accessToken = loginRes.data?.accessToken;
    refreshToken = loginRes.data?.refreshToken;
    logTest('Token re-issued', !!accessToken);
  } else {
    console.log('   Login error:', loginRes.errorData);
  }

  // STEP 8: Go to recruiter tools → all 5 tools work (no 401)
  console.log('\nSTEP 8: Recruiter tools access');

  // 1. Upload candidate
  const recruiterRes = await apiCall('POST', '/recruiter/candidates/upload', {
    name: 'Candidate One',
    email: 'candidate1@example.com',
    resumeUrl: 'http://example.com/resume.pdf',
  });
  logTest('Tool 1: Upload candidate', recruiterRes.success, recruiterRes.error || 'Status: ' + recruiterRes.status);
  let candidateId = recruiterRes.data?.candidate?._id || recruiterRes.data?._id;

  // 2. List candidates
  const listRes = await apiCall('GET', '/recruiter/candidates');
  logTest('Tool 2: List candidates', listRes.success, listRes.error || 'Status: ' + listRes.status);
  if (listRes.success) {
    logTest('Candidates fetched', true, 'Count: ' + (listRes.data?.candidates?.length || 0));
  }

  // 3. Compare candidates
  if (candidateId) {
    const compareRes = await apiCall('POST', '/recruiter/candidates/compare', {
      candidateIds: [candidateId],
    });
    logTest('Tool 3: Compare candidates', compareRes.success, compareRes.error || 'Status: ' + compareRes.status);
  } else {
    logTest('Tool 3: Compare candidates', false, 'No candidate ID available');
  }

  // 4. Match job
  if (candidateId) {
    const matchRes = await apiCall('POST', `/recruiter/candidates/${candidateId}/match-job`, {
      jobDescription: 'Senior Engineer role',
      requiredSkills: ['JavaScript', 'React'],
    });
    logTest('Tool 4: Match job', matchRes.success, matchRes.error || 'Status: ' + matchRes.status);
  } else {
    logTest('Tool 4: Match job', false, 'No candidate ID available');
  }

  // 5. Pipeline management
  const pipelineRes = await apiCall('GET', '/recruiter/pipeline');
  logTest('Tool 5: Pipeline access', pipelineRes.success, pipelineRes.error || 'Status: ' + pipelineRes.status);

  // Analytics/Dashboard
  const analyticsRes = await apiCall('GET', '/recruiter/analytics');
  logTest('Analytics dashboard', analyticsRes.success, analyticsRes.error || 'Status: ' + analyticsRes.status);

  // STEP 9: Logout completely → token cleared
  console.log('\nSTEP 9: Final logout and session cleanup');
  const finalLogoutRes = await apiCall('POST', '/auth/logout', {});
  logTest('Final logout', finalLogoutRes.success, finalLogoutRes.error || 'Status: ' + finalLogoutRes.status);

  accessToken = '';
  const finalCheck = await apiCall('GET', '/auth/profile');
  logTest('Session completely cleared', !finalCheck.success && finalCheck.status === 401, 'Status: ' + finalCheck.status);

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
    failed.forEach(test => {
      console.log(`❌ ${test.name}${test.details ? ': ' + test.details : ''}`);
    });
  }

  console.log('\n========== E2E TEST END ==========\n');

  return {
    totalTests: total,
    passed,
    failed: total - passed,
    successRate: ((passed / total) * 100).toFixed(2),
    failures: failed.map(t => ({ test: t.name, details: t.details })),
  };
}

runTests().catch(console.error);
