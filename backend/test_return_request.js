import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const token = jwt.sign({ userId: 125, role: 'user' }, process.env.JWT_ACCESS_SECRET, { expiresIn: '1h' });

async function test() {
  const response = await fetch('http://localhost:3000/api/orders/items/12/returns', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ reason: 'Defective item' }),
  });
  const text = await response.text();
  console.log('status', response.status);
  console.log('body', text);
}

test().catch(console.error);