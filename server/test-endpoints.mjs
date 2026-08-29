import axios from 'axios';

const API_BASE = 'http://localhost:5001/api/v1';

async function test() {
  // First login
  const loginRes = await axios.post(`${API_BASE}/auth/login`, {
    email: 'test@example.com',
    password: 'Test@123456'
  }, { validateStatus: () => true });

  if (!loginRes.data?.data?.accessToken) {
    console.log('Login response:', loginRes.data);
    console.log('Creating new user first...');
    const registerRes = await axios.post(`${API_BASE}/auth/register`, {
      name: 'Test',
      email: `test_${Date.now()}@example.com`,
      password: 'Test@123456'
    }, { validateStatus: () => true });
    var token = registerRes.data?.data?.accessToken;
    var resumeId = registerRes.data?.data?._id;
  } else {
    var token = loginRes.data.data.accessToken;
  }

  console.log('Token:', token);

  // List available routes by trying a few known ones
  console.log('\nTesting routes:');

  const routes = [
    { method: 'GET', path: '/auth/me' },
    { method: 'GET', path: '/resumes' },
    { method: 'GET', path: '/analysis' },
    { method: 'GET', path: '/recruiter/candidates' },
  ];

  for (const route of routes) {
    try {
      const res = await axios({
        method: route.method,
        url: API_BASE + route.path,
        headers: { Authorization: `Bearer ${token}` },
        validateStatus: () => true
      });
      console.log(`${route.method} ${route.path}: ${res.status}`);
    } catch (e) {
      console.log(`${route.method} ${route.path}: ERROR -`, e.message);
    }
  }
}

test().catch(console.error);
