import http from 'http';

const productData = {
  store_id: 1,
  category_id: 1,
  name: "Test Wireless Headphones",
  description: "High-quality wireless headphones with noise cancellation",
  brand: "TechBrand",
  variants: [
    {
      sku: "WH-01-BLK",
      price: "4999.00",
      discount_price: "3999.00",
      stock: 50
    },
    {
      sku: "WH-01-WHT",
      price: "4999.00",
      discount_price: "3999.00",
      stock: 30
    }
  ],
  images: [
    {
      image_url: "https://via.placeholder.com/400?text=Headphones+Black",
      is_primary: true
    },
    {
      image_url: "https://via.placeholder.com/400?text=Headphones+Side",
      is_primary: false
    }
  ],
  attributes: [
    { name: "Connectivity", value: "Bluetooth 5.0" },
    { name: "Battery Life", value: "40 hours" },
    { name: "Warranty", value: "1 Year" }
  ]
};

const postData = JSON.stringify(productData);

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/products',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
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
        console.log('\n✅ Product Created Successfully!\n');
        console.log('Product Details:');
        console.log(`  - Product ID: ${result.data.product_id}`);
        console.log(`  - Name: ${result.data.name}`);
        console.log(`  - Brand: ${result.data.brand}`);
        console.log(`  - Status: ${result.data.status}`);
        console.log(`  - Created At: ${result.data.created_at}\n`);
        process.exit(0);
      } else {
        console.error('\n❌ API Error:');
        console.error(`  - Message: ${result.message}`);
        console.error(`  - Full Response: ${JSON.stringify(result, null, 2)}\n`);
        process.exit(1);
      }
    } catch (e) {
      console.error('❌ Error parsing response:', e.message);
      console.error('Response:', data);
      process.exit(1);
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Request error:', e.message);
  console.error('Make sure the server is running on port 3000');
  process.exit(1);
});

console.log('📤 Creating test product...');
console.log('📋 Request body:', JSON.stringify(productData, null, 2));
req.write(postData);
req.end();


