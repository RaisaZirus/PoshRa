import { pool } from './db.js';

(async () => {
  try {
    const sql = `SELECT p.product_id,p.store_id,p.category_id,p.name,p.description,p.brand,p.status,p.created_at,s.store_name,s.store_slug,COALESCE(AVG(r.rating),0)::numeric(3,1) AS avg_rating,COUNT(DISTINCT r.review_id)::int AS reviews_count,COALESCE((SELECT SUM(oi.quantity) FROM order_items oi JOIN product_variants pv2 ON pv2.variant_id = oi.variant_id WHERE pv2.product_id = p.product_id),0)::int AS total_sold,COALESCE(json_agg(DISTINCT jsonb_build_object('variant_id',pv.variant_id,'sku',pv.sku,'price',pv.price,'discount_price',COALESCE(cp.discount_price,pv.discount_price),'stock',pv.stock)) FILTER (WHERE pv.variant_id IS NOT NULL),'[]'::json) AS variants,COALESCE(json_agg(DISTINCT jsonb_build_object('image_id',pi.image_id,'image_url',pi.image_url,'is_primary',pi.is_primary)) FILTER (WHERE pi.image_id IS NOT NULL),'[]'::json) AS images,COALESCE(json_agg(DISTINCT jsonb_build_object('attribute_id',pa.attribute_id,'name',pa.name,'value',pa.value)) FILTER (WHERE pa.attribute_id IS NOT NULL),'[]'::json) AS attributes FROM products p JOIN stores s ON s.store_id = p.store_id LEFT JOIN reviews r ON r.product_id = p.product_id LEFT JOIN product_variants pv ON pv.product_id = p.product_id LEFT JOIN campaign_products cp ON cp.variant_id = pv.variant_id LEFT JOIN campaigns c ON c.campaign_id = cp.campaign_id AND NOW() BETWEEN c.start_time AND c.end_time LEFT JOIN product_images pi ON pi.product_id = p.product_id LEFT JOIN product_attributes pa ON pa.product_id = p.product_id WHERE p.product_id = $1 GROUP BY p.product_id,s.store_name,s.store_slug`;
    const result = await pool.query(sql, [1]);
    console.log('result row count', result.rowCount);
    console.log(JSON.stringify(result.rows, null, 2));
  } catch (err) {
    console.error('query failed', err);
  } finally {
    await pool.end();
  }
})();