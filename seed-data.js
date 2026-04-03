import http from 'http';

// First, we need to seed the database with necessary tables
// This script will create initial data for testing

const seedSQL = `
-- Create a user (seller)
INSERT INTO users (name, email, phone, password_hash, role, is_active, email_verified) VALUES
('Test Seller', 'seller@test.com', '9999999999', 'hash123', 'seller', true, true)
ON CONFLICT DO NOTHING;

-- Create a seller entry
INSERT INTO sellers (user_id, business_name, kyc_status, rating) VALUES
((SELECT user_id FROM users WHERE email = 'seller@test.com' LIMIT 1), 'Test Store', 'verified', 4.5)
ON CONFLICT DO NOTHING;

-- Create a store
INSERT INTO stores (seller_id, store_name, store_slug, store_rating, store_status) VALUES
((SELECT seller_id FROM sellers WHERE business_name = 'Test Store' LIMIT 1), 'Test Store', 'test-store', 4.5, 'active')
ON CONFLICT DO NOTHING;

-- Create a category
INSERT INTO categories (name, slug) VALUES
('Electronics', 'electronics')
ON CONFLICT DO NOTHING;
`;

console.log('⚠️  Manual Setup Required');
console.log('\nPlease execute the following SQL in your PostgreSQL database:\n');
console.log(seedSQL);
console.log('\nOr run this in psql:');
console.log('psql -h localhost -p 5433 -U postgres -d Poshra << EOF');
console.log(seedSQL);
console.log('EOF');


