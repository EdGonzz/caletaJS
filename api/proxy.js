export default async function handler(req, res) {
  const { endpoint, ...queryParams } = req.query;

  if (!endpoint) {
    return res.status(400).json({ error: 'Endpoint query parameter is required' });
  }

  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(queryParams)) {
    if (Array.isArray(value)) {
      value.forEach(v => searchParams.append(key, v));
    } else {
      searchParams.append(key, value);
    }
  }

  const queryString = searchParams.toString();
  const API_URL = process.env.API_URL || 'https://api.coingecko.com/api/v3';
  const API_KEY = process.env.API_KEY;

  const url = `${API_URL}${endpoint}${queryString ? `?${queryString}` : ''}`;

  const headers = {
    'Content-Type': 'application/json',
  };

  if (API_KEY) {
    headers['x-cg-demo-api-key'] = API_KEY;
  }

  try {
    const response = await fetch(url, {
      method: req.method,
      headers: headers,
    });

    // Handle responses that might not be JSON
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      res.status(response.status).json(data);
    } else {
      const text = await response.text();
      res.status(response.status).send(text);
    }
  } catch (error) {
    console.error('Proxy API error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
