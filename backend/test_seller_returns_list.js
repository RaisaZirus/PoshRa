import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const token = jwt.sign({ userId: 123, role: 'seller' }, process.env.JWT_ACCESS_SECRET, { expiresIn: '1h' });

async function run() {
  const response = await fetch('http://localhost:3000/api/seller/returns', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await response.json();
  console.log('status', response.status);
  console.log(JSON.stringify(data, null, 2));
}

run().catch(console.error);