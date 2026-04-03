import http from 'http';

// allow custom product id via CLI argument (defaults to 5)
const prodId = process.argv[2] || '5';
const options = {
  hostname: 'localhost',
  port: 3000,
  path: `/api/products/${prodId}`,
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      if (result.success) {
        const product = result.data;
        console.log('\n✅ Product Fetched Successfully!\n');
        console.log('📦 Product Details:');
        console.log(`   - ID: ${product.product_id}`);
        console.log(`   - Name: ${product.name}`);
        console.log(`   - Brand: ${product.brand}`);
        console.log(`   - Description: ${product.description}`);
        console.log(`   - Status: ${product.status}`);
        console.log(`   - Created: ${product.created_at}\n`);

        console.log('🎨 Images (${product.images.length}):');
        product.images.forEach((img, idx) => {
          console.log(`   [${idx + 1}] SKU: ${img.image_id}, Primary: ${img.is_primary}`);
          console.log(`       URL: ${img.image_url.substring(0, 80)}${img.image_url.length > 80 ? '...' : ''}`);
        });

        console.log(`\n📌 Variants (${product.variants.length}):`);
        product.variants.forEach((variant, idx) => {
          console.log(`   [${idx + 1}] SKU: ${variant.sku}`);
          console.log(`       Price: ₹${variant.price.toLocaleString('en-IN')}`);
          if (variant.discount_price) {
            const discPercent = Math.round(((variant.price - variant.discount_price) / variant.price) * 100);
            console.log(`       Discount Price: ₹${variant.discount_price.toLocaleString('en-IN')} (${discPercent}% OFF)`);
          }
          console.log(`       Stock: ${variant.stock} units\n`);
        });

        console.log(`📋 Specifications (${product.attributes.length}):`);
        product.attributes.forEach((attr) => {
          console.log(`   • ${attr.name}: ${attr.value}`);
        });

        console.log(`\n✨ Full Product Object (for frontend):`);
        console.log(JSON.stringify(product, null, 2));

        process.exit(0);
      } else {
        console.error('❌ API Error:', result.message);
        process.exit(1);
      }
    } catch (e) {
      console.error('❌ Parse error:', e.message);
      console.error('Response:', data);
      process.exit(1);
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Request error:', e.message);
  process.exit(1);
});

console.log(`📤 Fetching product details for ID ${prodId}...`);
req.end();


