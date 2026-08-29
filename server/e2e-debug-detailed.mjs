import axios from 'axios';
import { writeFileSync, unlinkSync } from 'fs';

const API_BASE = 'http://localhost:5001/api/v1';

let accessToken = '';
const testEmail = `test_${Date.now()}@example.com`;
const testPassword = 'Test@123456';
let resumeId = '';

async function apiCall(method, endpoint, data = null, isFormData = false) {
  try {
    const config = {
      method,
      url: `${API_BASE}${endpoint}`,
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      validateStatus: () => true,
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

async function debug() {
  console.log('\n========== DETAILED ISSUE DEBUG ==========\n');

  // Register and login
  const registerRes = await apiCall('POST', '/auth/register', {
    name: 'Debug User',
    email: testEmail,
    password: testPassword,
  });

  accessToken = registerRes.data?.data?.accessToken;
  console.log('✅ Registered and logged in\n');

  // Upload resume
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

  const formData = new FormData();
  const fileBlob = new Blob([testResumeContent], { type: 'text/plain' });
  formData.append('file', fileBlob, 'test_resume.txt');

  const uploadRes = await apiCall('POST', '/resumes/upload-file', formData, true);
  resumeId = uploadRes.data?.data?.resume?._id || uploadRes.data?.data?._id;
  console.log('✅ Resume uploaded, ID:', resumeId, '\n');

  // ISSUE 1: AI Analysis
  console.log('ISSUE 1: AI Analysis Endpoint\n');
  if (resumeId) {
    const analysisRes = await apiCall('POST', '/analysis/ai/' + resumeId, {});
    console.log('Status:', analysisRes.status);
    console.log('Response:', JSON.stringify(analysisRes.data, null, 2));
    console.log('\n');
  }

  // ISSUE 2: Compare Resumes
  console.log('ISSUE 2: Compare Resumes Endpoint\n');
  if (resumeId) {
    const compareRes = await apiCall('POST', '/recruiter/compare', {
      resumeIds: [resumeId],
    });
    console.log('Status:', compareRes.status);
    console.log('Response:', JSON.stringify(compareRes.data, null, 2));
    console.log('\n');

    // Try alternative payload
    const compareRes2 = await apiCall('POST', '/recruiter/compare', {
      resumeId: resumeId,
    });
    console.log('Alternative payload - Status:', compareRes2.status);
    console.log('Response:', JSON.stringify(compareRes2.data, null, 2));
    console.log('\n');
  }

  unlinkSync(resumePath);
  console.log('========== DEBUG COMPLETE ==========\n');
}

debug().catch(console.error);
