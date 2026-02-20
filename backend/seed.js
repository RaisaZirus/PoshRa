//to generate random products to change the DB state and test the API
import { pool } from "./db.js";
import dotenv from "dotenv";

dotenv.config();

const sampleProducts = [
  { name: "Red Shirt", price: 29.99, image: "https://via.placeholder.com/300?text=Red+Shirt" },
  { name: "Blue Jeans", price: 49.99, image: "https://via.placeholder.com/300?text=Blue+Jeans" },
  { name: "Black Shoes", price: 89.99, image: "https://via.placeholder.com/300?text=Black+Shoes" },
  { name: "White T-Shirt", price: 19.99, image: "https://via.placeholder.com/300?text=White+T-Shirt" },
  { name: "Red Sneakers", price: 69.99, image: "https://via.placeholder.com/300?text=Red+Sneakers" },
  { name: "Blue Hoodie", price: 59.99, image: "https://via.placeholder.com/300?text=Blue+Hoodie" },
  { name: "Green Hat", price: 24.99, image: "https://via.placeholder.com/300?text=Green+Hat" },
  { name: "Black Jacket", price: 129.99, image: "https://via.placeholder.com/300?text=Black+Jacket" },
];

const insertProducts = async () => {
  try {
    console.log("Setting up sample data...\n");

    // Get or create a store (use first store or create one)
    let storeId;
    const storeRes = await pool.query("SELECT store_id FROM stores LIMIT 1");
    if (storeRes.rows.length > 0) {
      storeId = storeRes.rows[0].store_id;
      console.log(`✓ Using existing store: ${storeId}`);
    } else {
      // Create a test seller if none exists
      const sellerRes = await pool.query("SELECT seller_id FROM sellers LIMIT 1");
      let sellerId;
      if (sellerRes.rows.length > 0) {
        sellerId = sellerRes.rows[0].seller_id;
      } else {
        const userRes = await pool.query(
          `INSERT INTO users (name, email, password_hash, role) 
           VALUES ('Test Seller', 'seller@test.com', 'hash', 'seller') 
           RETURNING user_id`
        );
        const userId = userRes.rows[0].user_id;
        const newSellerRes = await pool.query(
          `INSERT INTO sellers (user_id, business_name) VALUES ($1, 'Test Store') RETURNING seller_id`,
          [userId]
        );
        sellerId = newSellerRes.rows[0].seller_id;
      }

      const newStoreRes = await pool.query(
        `INSERT INTO stores (seller_id, store_name, store_slug) VALUES ($1, 'Test Store', 'test-store') RETURNING store_id`,
        [sellerId]
      );
      storeId = newStoreRes.rows[0].store_id;
      console.log(`✓ Created new store: ${storeId}\n`);
    }

    // Insert products
    for (const product of sampleProducts) {
      const productRes = await pool.query(
        `INSERT INTO products (store_id, name, description) VALUES ($1, $2, $3) RETURNING product_id, name`,
        [storeId, product.name, `Sample ${product.name} product`]
      );
      const productId = productRes.rows[0].product_id;

      // Insert variant with price
      await pool.query(
        `INSERT INTO product_variants (product_id, sku, price, stock) VALUES ($1, $2, $3, $4)`,
        [productId, `SKU-${productId}`, product.price, 50]
      );

      // Insert image
      await pool.query(
        `INSERT INTO product_images (product_id, image_url, is_primary) VALUES ($1, $2, $3)`,
        [productId, product.image, true]
      );

      console.log(`✓ Added: ${product.name} - $${product.price}`);
    }

    console.log("\n✓ All products inserted successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
};

insertProducts();
