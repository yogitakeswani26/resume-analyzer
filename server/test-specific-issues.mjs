import axios from 'axios';
import { writeFileSync, unlinkSync } from 'fs';

const API_BASE = 'http://localhost:5001/api/v1';

async function test() {
  // Register user
  const registerRes = await axios.post(`${API_BASE}/auth/register`, {
    name: 'Issue Test',
    email: `test_${Date.now()}@example.com`,
    password: 'Test@123456'
  }, { validateStatus: () => true });

  const token = registerRes.data?.data?.accessToken;
  console.log('User created, token:', token.slice(0, 20) + '...');

  // Upload a resume
  const resumePath = './test_resume.txt';
  const testResumeContent = `JOHN DOE
john@example.com

EXPERIENCE
Senior Developer at TechCorp (2020-2024)

EDUCATION
BS Computer Science

SKILLS
JavaScript, React, Node.js
`;

  writeFileSync(resumePath, testResumeContent);
  
  const formData = new FormData();
  const fileBlob = new Blob([testResumeContent], { type: 'text/plain' });
  formData.append('file', fileBlob, 'test_resume.txt');

  const uploadRes = await axios.post(`${API_BASE}/resumes/upload-file`, formData, {
    headers: { Authorization: `Bearer ${token}` },
    validateStatus: () => true
  });

  const resumeId = uploadRes.data?.data?.resume?._id || uploadRes.data?.data?._id;
  console.log('Resume uploaded, ID:', resumeId);
  console.log('Upload response:', JSON.stringify(uploadRes.data, null, 2).slice(0, 300));

  // TEST ISSUE 1: AI Analysis with GET
  console.log('\n=== ISSUE 1: AI Analysis (GET) ===');
  const aiRes = await axios.get(`${API_BASE}/analysis/ai/${resumeId}`, {
    headers: { Authorization: `Bearer ${token}` },
    validateStatus: () => true
  });
  console.log('Status:', aiRes.status);
  console.log('Response:', JSON.stringify(aiRes.data, null, 2));

  // TEST ISSUE 2: Compare Resumes (need 2+ resumes)
  console.log('\n=== ISSUE 2: Compare Resumes ===');
  // Upload a second resume
  const formData2 = new FormData();
  formData2.append('file', new Blob([testResumeContent], { type: 'text/plain' }), 'test_resume2.txt');
  
  const uploadRes2 = await axios.post(`${API_BASE}/resumes/upload-file`, formData2, {
    headers: { Authorization: `Bearer ${token}` },
    validateStatus: () => true
  });

  const resumeId2 = uploadRes2.data?.data?.resume?._id || uploadRes2.data?.data?._id;
  console.log('Second resume uploaded, ID:', resumeId2);

  const compareRes = await axios.post(`${API_BASE}/recruiter/compare`, {
    resumeIds: [resumeId, resumeId2]
  }, {
    headers: { Authorization: `Bearer ${token}` },
    validateStatus: () => true
  });
  console.log('Status:', compareRes.status);
  console.log('Response:', JSON.stringify(compareRes.data, null, 2));

  unlinkSync(resumePath);
  console.log('\n✅ Tests complete');
}

test().catch(console.error);
