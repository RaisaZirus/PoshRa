import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5433,
  database: process.env.DB_NAME || 'Poshra',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
});

async function seedDatabase() {
  const client = await pool.connect();
  try {
    console.log('🌱 Seeding database...\n');

    // Create user
    console.log('📝 Creating seller user...');
    const userResult = await client.query(
      `INSERT INTO users (name, email, phone, password_hash, role, is_active, email_verified)
       VALUES ($1, $2, $3, $4, $5, true, true)
       ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role
       RETURNING user_id`,
      ['Test Seller', 'seller@test.com', '9999999999', 'hash123', 'seller']
    );
    const userId = userResult.rows[0]?.user_id;
    console.log(`  ✓ User created with ID: ${userId}\n`);

    // Create seller
    console.log('🏪 Creating seller...');
    const sellerResult = await client.query(
      `INSERT INTO sellers (user_id, business_name, kyc_status, rating)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id) DO UPDATE SET rating = EXCLUDED.rating
       RETURNING seller_id`,
      [userId, 'Test Store', 'verified', 4.5]
    );
    const sellerId = sellerResult.rows[0]?.seller_id;
    console.log(`  ✓ Seller created with ID: ${sellerId}\n`);

    // Create store
    console.log('🛍️  Creating store...');
    const storeResult = await client.query(
      `INSERT INTO stores (seller_id, store_name, store_slug, store_rating, store_status)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (store_slug) DO UPDATE SET store_name = EXCLUDED.store_name
       RETURNING store_id`,
      [sellerId, 'Test Store', 'test-store', 4.5, 'active']
    );
    const storeId = storeResult.rows[0]?.store_id;
    console.log(`  ✓ Store created with ID: ${storeId}\n`);

    // Create category
    console.log('📂 Creating category...');
    const categoryResult = await client.query(
      `INSERT INTO categories (name, slug)
       VALUES ($1, $2)
       ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
       RETURNING category_id`,
      ['Electronics', 'electronics']
    );
    const categoryId = categoryResult.rows[0]?.category_id;
    console.log(`  ✓ Category created with ID: ${categoryId}\n`);

    // --- insert a few sample products matching the HomePage mock data ---
    console.log('📦 Creating sample products for homepage...');
    const sampleProducts = [
      {
        product_id: 11,
        name: 'Wireless Earbuds',
        brand: 'PoshSound',
        image_url: 'https://picsum.photos/seed/poshra-earbuds/640/480',
        min_price: 1999,
        discount_price: 1499,
        stock: 28,
      },
      {
        product_id: 12,
        name: 'Classic Hoodie',
        brand: 'PoshWear',
        image_url: 'https://picsum.photos/seed/poshra-hoodie/640/480',
        min_price: 1099,
        discount_price: 899,
        stock: 54,
      },
      {
        product_id: 13,
        name: 'Smart Watch',
        brand: 'PoshFit',
        image_url: 'https://picsum.photos/seed/poshra-watch/640/480',
        min_price: 2999,
        discount_price: 2499,
        stock: 12,
      },
      {
        product_id: 14,
        name: 'Minimal Desk Lamp',
        brand: 'NestLite',
        image_url: 'https://picsum.photos/seed/poshra-lamp/640/480',
        min_price: 799,
        discount_price: null,
        stock: 33,
      },
    ];

    for (const p of sampleProducts) {
      // insert basic product row
      await client.query(
        `INSERT INTO products (product_id, store_id, category_id, name, description, brand, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (product_id) DO NOTHING`,
        [p.product_id, storeId, categoryId, p.name, '', p.brand, 'active']
      );
      // insert one variant per product (the "minimum" variant to satisfy UI)
      await client.query(
        `INSERT INTO product_variants (product_id, sku, price, discount_price, stock)
         VALUES ($1, $2, $3, $4, $5)`,
        [p.product_id, `SKU-${p.product_id}`, p.min_price, p.discount_price, p.stock]
      );
      // insert primary image
      await client.query(
        `INSERT INTO product_images (product_id, image_url, is_primary)
         VALUES ($1, $2, $3)`,
        [p.product_id, p.image_url, true]
      );
      // add a simple attribute record so details page has at least one spec
      await client.query(
        `INSERT INTO product_attributes (product_id, name, value)
         VALUES ($1, $2, $3)`,
        [p.product_id, 'Seeded', 'true']
      );
      console.log(`  • sample product ${p.product_id} inserted`);
    }
    console.log('  ✓ Sample products created\n');

    console.log('✅ Database seeded successfully!\n');
    console.log(`📊 Setup Summary:`);
    console.log(`   - User ID: ${userId}`);
    console.log(`   - Seller ID: ${sellerId}`);
    console.log(`   - Store ID: ${storeId}`);
    console.log(`   - Category ID: ${categoryId}`);
    console.log(`   - Seeded products: ${sampleProducts.map(p => p.product_id).join(', ')}`);
    console.log(`\nYou can now visit /p/11 through /p/14 for product pages\n`);

  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

seedDatabase();


