import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const token = jwt.sign({ userId: 123, role: 'seller' }, process.env.JWT_ACCESS_SECRET, { expiresIn: '1h' });

async function run() {
  const response = await fetch('http://localhost:3000/api/seller/returns/31', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status: 'approved' }),
  });
  const text = await response.text();
  console.log('status', response.status);
  console.log('body', text);
}

run().catch(console.error);