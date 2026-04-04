import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const token = jwt.sign({ userId: 136, role: 'user' }, process.env.JWT_ACCESS_SECRET, { expiresIn: '1h' });

async function run() {
  const response = await fetch('http://localhost:3000/api/orders/items/18/returns', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ reason: 'Wrong item received' }),
  });
  const text = await response.text();
  console.log('status', response.status);
  console.log('body', text);
}

run().catch(console.error);