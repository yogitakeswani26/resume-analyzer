// Vercel API proxy to backend
export const config = {
  runtime: 'nodejs',
};

export default async (req: any, res: any) => {
  // Extract path from URL (e.g., /api/proxy/auth/register -> auth/register)
  const urlPath = req.url.replace(/^\/api\/proxy\/?/, '');
  const pathname = urlPath.split('?')[0]; // Remove query string

  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const backendUrl = `https://resume-analyzer-api-k3qm.onrender.com/api/v1/${pathname}`;

    const response = await fetch(backendUrl, {
      method: req.method,
      headers: {
        ...req.headers,
        'Content-Type': 'application/json',
      },
      body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
    });

    const data = await response.json().catch(() => null);

    res.status(response.status).json(data || { error: 'Backend error' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Proxy error' });
  }
};
