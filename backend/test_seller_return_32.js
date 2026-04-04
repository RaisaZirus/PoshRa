import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const token = jwt.sign({ userId: 139, role: 'seller' }, process.env.JWT_ACCESS_SECRET, { expiresIn: '1h' });

async function listReturns() {
  const response = await fetch('http://localhost:3000/api/seller/returns', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json();
  console.log('LIST status', response.status);
  console.log(JSON.stringify(data, null, 2));
}

async function approveReturn() {
  const response = await fetch('http://localhost:3000/api/seller/returns/32', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status: 'approved' }),
  });
  const data = await response.json();
  console.log('APPROVE status', response.status);
  console.log(JSON.stringify(data, null, 2));
}

async function completeReturn() {
  const response = await fetch('http://localhost:3000/api/seller/returns/32', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status: 'completed' }),
  });
  const data = await response.json();
  console.log('COMPLETE status', response.status);
  console.log(JSON.stringify(data, null, 2));
}

async function run() {
  await listReturns();
  await approveReturn();
  await completeReturn();
}

run().catch(console.error);