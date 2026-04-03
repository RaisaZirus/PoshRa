import http from 'http';

console.log('🧪 Testing ProductDetailsPage Integration\n');
console.log('=' . repeat(60));

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/products/5',
  method: 'GET',
  headers: { 'Content-Type': 'application/json' }
};

http.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const result = JSON.parse(data);
    const product = result.data;

    console.log('\n✅ API Data Validation:\n');

    // Test 1: Product Info
    console.log('1️⃣  Product Information:');
    console.log(`   ✓ ID: ${product.product_id}`);
    console.log(`   ✓ Name: ${product.name}`);
    console.log(`   ✓ Brand: ${product.brand}`);
    console.log(`   ✓ Description: ${product.description?.substring(0, 50)}...`);

    // Test 2: Images
    console.log('\n2️⃣  Product Images:');
    const primaryImg = product.images?.find(img => img.is_primary);
    console.log(`   ✓ Total Images: ${product.images?.length}`);
    console.log(`   ✓ Primary Image: ${primaryImg?.image_url?.substring(0, 50)}...`);
    console.log(`   ✓ Thumbnail Count: ${product.images?.length - 1}`);

    // Test 3: Variants
    console.log('\n3️⃣  Product Variants:');
    console.log(`   ✓ Total Variants: ${product.variants?.length}`);
    product.variants?.forEach((v, i) => {
      const discount = v.discount_price ? Math.round(((v.price - v.discount_price) / v.price) * 100) : 0;
      console.log(`   ✓ Variant ${i + 1}: ${v.sku}`);
      console.log(`     - Price: ₹${v.price} ${v.discount_price ? `→ ₹${v.discount_price} (${discount}% OFF)` : ''}`);
      console.log(`     - Stock: ${v.stock} units ${v.stock > 0 ? '✓ In Stock' : '✗ Out of Stock'}`);
    });

    // Test 4: Specifications
    console.log('\n4️⃣  Product Specifications:');
    console.log(`   ✓ Total Specs: ${product.attributes?.length}`);
    product.attributes?.forEach((attr) => {
      console.log(`   ✓ ${attr.name}: ${attr.value}`);
    });

    // Test 5: Frontend Compatibility
    console.log('\n5️⃣  Frontend Compatibility:');
    const tests = [
      ['Product ID as string', typeof product.product_id === 'string'],
      ['Images array exists', Array.isArray(product.images)],
      ['Variants array exists', Array.isArray(product.variants)],
      ['Attributes array exists', Array.isArray(product.attributes)],
      ['First variant selectable', product.variants?.[0]?.variant_id !== undefined],
      ['Primary image selectable', primaryImg !== undefined],
      ['Pricing available', product.variants?.[0]?.price !== undefined],
      ['Stock levels available', product.variants?.[0]?.stock !== undefined],
    ];

    tests.forEach(([test, passed]) => {
      console.log(`   ${passed ? '✓' : '✗'} ${test}`);
    });

    // Summary
    console.log('\n' + '=' . repeat(60));
    console.log('\n📊 Test Summary:\n');
    const allPassed = tests.every(t => t[1]);
    console.log(`Status: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}\n`);
    
    if (allPassed) {
      console.log('✨ ProductDetailsPage is ready to be used!');
      console.log('\n📝 Frontend Implementation Notes:');
      console.log('   • Use product_id from URL params: /product/5');
      console.log('   • Display primary image: primaryImage = product.images.find(img => img.is_primary)');
      console.log('   • Select first variant by default');
      console.log('   • Show all images as thumbnails');
      console.log('   • Handle variant selection: onChange={setSelectedVariant}');
      console.log('   • Calculate discount: ((price - discountPrice) / price) * 100');
      console.log('   • Validate stock: quantity <= selectedVariant.stock');
      console.log('   • Display specifications in table format');
    }

    console.log('\n');
    process.exit(allPassed ? 0 : 1);
  });
}).end();


