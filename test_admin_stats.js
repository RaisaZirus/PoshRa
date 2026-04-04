import http from 'http';

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/admin/stats',
  method: 'GET',
  headers: { 'Content-Type': 'application/json' }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      console.log('Admin Stats API Response:');
      console.log('Full response:', JSON.stringify(result, null, 2));
    } catch (err) {
      console.error('Error parsing response:', err.message);
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (err) => {
  console.error('Request error:', err.message);
});

req.end();