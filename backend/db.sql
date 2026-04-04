
CREATE TABLE users (
  user_id           BIGSERIAL PRIMARY KEY,
  name              VARCHAR(150) NOT NULL,
  email             VARCHAR(255) UNIQUE NOT NULL,
  phone             VARCHAR(30) UNIQUE,
  password_hash     VARCHAR(255) NOT NULL,
  role              VARCHAR(20) NOT NULL CHECK (role IN ('user','seller','admin')),
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  email_verified    BOOLEAN NOT NULL DEFAULT FALSE,
  phone_verified    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE refresh_tokens (
  token_id          BIGSERIAL PRIMARY KEY,
  user_id           BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  token_hash        VARCHAR(255) NOT NULL,        
  issued_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at        TIMESTAMPTZ NOT NULL,
  revoked_at        TIMESTAMPTZ,
  user_agent        TEXT,
  ip_address        INET
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);

CREATE TABLE password_reset_tokens (
  reset_id          BIGSERIAL PRIMARY KEY,
  user_id           BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  token_hash        VARCHAR(255) NOT NULL,
  expires_at        TIMESTAMPTZ NOT NULL,
  used_at           TIMESTAMPTZ
);

CREATE INDEX idx_password_reset_user_id ON password_reset_tokens(user_id);

CREATE TABLE customers (
  customer_id       BIGSERIAL PRIMARY KEY,
  user_id           BIGINT NOT NULL UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE sellers (
  seller_id         BIGSERIAL PRIMARY KEY,
  user_id           BIGINT NOT NULL UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
  business_name     VARCHAR(255),
  kyc_status        VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (kyc_status IN ('pending','verified','rejected')),
  rating            NUMERIC(3,2) NOT NULL DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE admins (
  admin_id          BIGSERIAL PRIMARY KEY,
  user_id           BIGINT NOT NULL UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
  access_level      VARCHAR(30) NOT NULL DEFAULT 'standard' CHECK (access_level IN ('standard','super')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE addresses (
  address_id        BIGSERIAL PRIMARY KEY,
  user_id           BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  city              VARCHAR(100),
  area              VARCHAR(100),
  details           TEXT,
  is_default        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_addresses_user_id ON addresses(user_id);

CREATE TABLE categories (
  category_id       BIGSERIAL PRIMARY KEY,
  parent_id         BIGINT REFERENCES categories(category_id) ON DELETE SET NULL,
  name              VARCHAR(255) NOT NULL,
  slug              VARCHAR(255) UNIQUE NOT NULL
);

CREATE INDEX idx_categories_parent_id ON categories(parent_id);

CREATE TABLE stores (
  store_id          BIGSERIAL PRIMARY KEY,
  seller_id         BIGINT NOT NULL REFERENCES sellers(seller_id) ON DELETE CASCADE,
  store_name        VARCHAR(255) NOT NULL,
  store_slug        VARCHAR(255) UNIQUE NOT NULL,
  store_rating      NUMERIC(3,2) NOT NULL DEFAULT 0 CHECK (store_rating >= 0 AND store_rating <= 5),
  store_status      VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (store_status IN ('active','inactive','suspended')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_stores_seller_id ON stores(seller_id);

CREATE TABLE products (
  product_id        BIGSERIAL PRIMARY KEY,
  store_id          BIGINT NOT NULL REFERENCES stores(store_id) ON DELETE CASCADE,
  category_id       BIGINT REFERENCES categories(category_id) ON DELETE SET NULL,
  name              VARCHAR(255) NOT NULL,
  description       TEXT,
  brand             VARCHAR(100),
  status            VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','blocked')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_store_id ON products(store_id);
CREATE INDEX idx_products_category_id ON products(category_id);

CREATE TABLE product_variants (
  variant_id        BIGSERIAL PRIMARY KEY,
  product_id        BIGINT NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
  sku               VARCHAR(100) UNIQUE NOT NULL,
  price             NUMERIC(12,2) NOT NULL CHECK (price >= 0),
  discount_price    NUMERIC(12,2) CHECK (discount_price >= 0),
  stock             INT NOT NULL DEFAULT 0 CHECK (stock >= 0)
);

CREATE INDEX idx_variants_product_id ON product_variants(product_id);

CREATE TABLE product_images (
  image_id          BIGSERIAL PRIMARY KEY,
  product_id        BIGINT NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
  image_url         TEXT NOT NULL,
  is_primary        BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE product_attributes (
  attribute_id      BIGSERIAL PRIMARY KEY,
  product_id        BIGINT NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
  name              VARCHAR(100) NOT NULL,
  value             VARCHAR(255) NOT NULL
);

CREATE TABLE carts (
  cart_id           BIGSERIAL PRIMARY KEY,
  customer_id       BIGINT NOT NULL REFERENCES customers(customer_id) ON DELETE CASCADE,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX uq_cart_customer ON carts(customer_id);

CREATE TABLE cart_items (
  cart_item_id      BIGSERIAL PRIMARY KEY,
  cart_id           BIGINT NOT NULL REFERENCES carts(cart_id) ON DELETE CASCADE,
  variant_id        BIGINT NOT NULL REFERENCES product_variants(variant_id),
  quantity          INT NOT NULL DEFAULT 1 CHECK (quantity > 0)
);

CREATE INDEX idx_cart_items_cart_id ON cart_items(cart_id);

CREATE TABLE orders (
  order_id          BIGSERIAL PRIMARY KEY,
  customer_id       BIGINT NOT NULL REFERENCES customers(customer_id),
  address_id        BIGINT REFERENCES addresses(address_id) ON DELETE SET NULL,
  total_amount      NUMERIC(12,2) NOT NULL CHECK (total_amount >= 0),
  order_status      VARCHAR(30) NOT NULL CHECK (order_status IN ('pending','processing','shipped','delivered','cancelled','returned')),
  payment_status    VARCHAR(30) NOT NULL CHECK (payment_status IN ('pending','paid','failed','refunded')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_customer_id ON orders(customer_id);

CREATE TABLE seller_orders (
  seller_order_id   BIGSERIAL PRIMARY KEY,
  order_id          BIGINT NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
  seller_id         BIGINT NOT NULL REFERENCES sellers(seller_id),
  subtotal          NUMERIC(12,2) NOT NULL CHECK (subtotal >= 0),
  status            VARCHAR(30) NOT NULL CHECK (status IN ('pending','processing','shipped','delivered','cancelled')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_seller_orders_order_id ON seller_orders(order_id);
CREATE INDEX idx_seller_orders_seller_id ON seller_orders(seller_id);

CREATE TABLE order_items (
  order_item_id     BIGSERIAL PRIMARY KEY,
  seller_order_id   BIGINT NOT NULL REFERENCES seller_orders(seller_order_id) ON DELETE CASCADE,
  variant_id        BIGINT NOT NULL REFERENCES product_variants(variant_id),
  quantity          INT NOT NULL CHECK (quantity > 0),
  price             NUMERIC(12,2) NOT NULL CHECK (price >= 0)
);

CREATE INDEX idx_order_items_seller_order_id ON order_items(seller_order_id);

CREATE TABLE payments (
  payment_id        BIGSERIAL PRIMARY KEY,
  order_id          BIGINT NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
  method            VARCHAR(50) NOT NULL,
  transaction_id    VARCHAR(255),
  amount            NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  status            VARCHAR(30) NOT NULL CHECK (status IN ('pending','completed','failed','refunded')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_order_id ON payments(order_id);

CREATE TABLE couriers (
  courier_id        BIGSERIAL PRIMARY KEY,
  name              VARCHAR(255) NOT NULL,
  contact_info      TEXT
);

CREATE TABLE shipments (
  shipment_id       BIGSERIAL PRIMARY KEY,
  seller_order_id   BIGINT NOT NULL REFERENCES seller_orders(seller_order_id) ON DELETE CASCADE,
  courier_id        BIGINT REFERENCES couriers(courier_id) ON DELETE SET NULL,
  tracking_number   VARCHAR(120),
  status            VARCHAR(30) NOT NULL CHECK (status IN ('pending','shipped','in_transit','delivered','returned')),
  shipped_at        TIMESTAMPTZ,
  delivered_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_shipments_seller_order_id ON shipments(seller_order_id);

CREATE TABLE return_requests (
  return_id         BIGSERIAL PRIMARY KEY,
  order_item_id     BIGINT NOT NULL REFERENCES order_items(order_item_id) ON DELETE CASCADE,
  reason            TEXT,
  status            VARCHAR(30) NOT NULL CHECK (status IN ('requested','approved','rejected','completed')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE refunds (
  refund_id         BIGSERIAL PRIMARY KEY,
  payment_id        BIGINT NOT NULL REFERENCES payments(payment_id) ON DELETE CASCADE,
  amount            NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  status            VARCHAR(30) NOT NULL CHECK (status IN ('pending','processed','rejected')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE reviews (
  review_id         BIGSERIAL PRIMARY KEY,
  product_id        BIGINT NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
  customer_id       BIGINT NOT NULL REFERENCES customers(customer_id) ON DELETE CASCADE,
  rating            INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment           TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reviews_product_id ON reviews(product_id);

CREATE TABLE questions (
  question_id       BIGSERIAL PRIMARY KEY,
  product_id        BIGINT NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
  customer_id       BIGINT NOT NULL REFERENCES customers(customer_id) ON DELETE CASCADE,
  content           TEXT NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE answers (
  answer_id         BIGSERIAL PRIMARY KEY,
  question_id       BIGINT NOT NULL REFERENCES questions(question_id) ON DELETE CASCADE,
  seller_id         BIGINT NOT NULL REFERENCES sellers(seller_id) ON DELETE CASCADE,
  content           TEXT NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE coupons (
  coupon_id         BIGSERIAL PRIMARY KEY,
  code              VARCHAR(50) UNIQUE NOT NULL,
  discount_type     VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage','fixed')),
  discount_value    NUMERIC(12,2) NOT NULL CHECK (discount_value >= 0),
  expiry_date       DATE
);

CREATE TABLE order_coupons (
  order_coupon_id   BIGSERIAL PRIMARY KEY,
  order_id          BIGINT NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
  coupon_id         BIGINT NOT NULL REFERENCES coupons(coupon_id) ON DELETE CASCADE,
  applied_amount    NUMERIC(12,2) NOT NULL CHECK (applied_amount >= 0)
);

CREATE TABLE campaigns (
  campaign_id       BIGSERIAL PRIMARY KEY,
  name              VARCHAR(255) NOT NULL,
  start_time        TIMESTAMPTZ NOT NULL,
  end_time          TIMESTAMPTZ NOT NULL
);

CREATE TABLE campaign_products (
  campaign_id       BIGINT NOT NULL REFERENCES campaigns(campaign_id) ON DELETE CASCADE,
  variant_id        BIGINT NOT NULL REFERENCES product_variants(variant_id) ON DELETE CASCADE,
  discount_price    NUMERIC(12,2) CHECK (discount_price >= 0),
  original_discount_price NUMERIC(12,2),
  PRIMARY KEY (campaign_id, variant_id)
);

CREATE TABLE commissions (
  commission_id     BIGSERIAL PRIMARY KEY,
  category_id       BIGINT REFERENCES categories(category_id) ON DELETE SET NULL,
  percentage        NUMERIC(5,2) NOT NULL CHECK (percentage >= 0 AND percentage <= 100)
);

CREATE TABLE payouts (
  payout_id         BIGSERIAL PRIMARY KEY,
  seller_id         BIGINT NOT NULL REFERENCES sellers(seller_id) ON DELETE CASCADE,
  amount            NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  status            VARCHAR(30) NOT NULL CHECK (status IN ('requested','processed','failed')),
  requested_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE warehouses (
  warehouse_id      BIGSERIAL PRIMARY KEY,
  name              VARCHAR(255) NOT NULL,
  location          TEXT
);

CREATE TABLE inventory (
  inventory_id      BIGSERIAL PRIMARY KEY,
  variant_id        BIGINT NOT NULL REFERENCES product_variants(variant_id) ON DELETE CASCADE,
  warehouse_id      BIGINT NOT NULL REFERENCES warehouses(warehouse_id) ON DELETE CASCADE,
  quantity          INT NOT NULL CHECK (quantity >= 0),
  UNIQUE (variant_id, warehouse_id)
);

CREATE TABLE wishlists (
  wishlist_id       BIGSERIAL PRIMARY KEY,
  customer_id       BIGINT NOT NULL REFERENCES customers(customer_id) ON DELETE CASCADE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE wishlist_items (
  wishlist_item_id  BIGSERIAL PRIMARY KEY,
  wishlist_id       BIGINT NOT NULL REFERENCES wishlists(wishlist_id) ON DELETE CASCADE,
  variant_id        BIGINT NOT NULL REFERENCES product_variants(variant_id) ON DELETE CASCADE,
  UNIQUE (wishlist_id, variant_id)
);

CREATE TABLE conversations (
  conversation_id   BIGSERIAL PRIMARY KEY,
  customer_id       BIGINT NOT NULL REFERENCES customers(customer_id) ON DELETE CASCADE,
  seller_id         BIGINT NOT NULL REFERENCES sellers(seller_id) ON DELETE CASCADE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (customer_id, seller_id)
);

CREATE TABLE messages (
  message_id        BIGSERIAL PRIMARY KEY,
  conversation_id   BIGINT NOT NULL REFERENCES conversations(conversation_id) ON DELETE CASCADE,
  sender_user_id    BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  content           TEXT NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE notifications (
  notification_id   BIGSERIAL PRIMARY KEY,
  user_id           BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  type              VARCHAR(50),
  message           TEXT,
  is_read           BOOLEAN NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE notification_events (
  event_id          BIGSERIAL PRIMARY KEY,
  user_id           BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  event_type        VARCHAR(100) NOT NULL,
  payload           JSONB,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE search_logs (
  search_id         BIGSERIAL PRIMARY KEY,
  user_id           BIGINT REFERENCES users(user_id) ON DELETE SET NULL,
  query             TEXT NOT NULL,
  filters           JSONB,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_search_logs_query ON search_logs(LOWER(query));
CREATE INDEX idx_search_logs_created_at ON search_logs(created_at);
CREATE INDEX idx_search_logs_user_id ON search_logs(user_id);

CREATE TABLE click_logs (
  click_id          BIGSERIAL PRIMARY KEY,
  user_id           BIGINT REFERENCES users(user_id) ON DELETE SET NULL,
  product_id        BIGINT REFERENCES products(product_id) ON DELETE SET NULL,
  source_page       VARCHAR(100),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE view_logs (
  view_id           BIGSERIAL PRIMARY KEY,
  user_id           BIGINT REFERENCES users(user_id) ON DELETE SET NULL,
  product_id        BIGINT REFERENCES products(product_id) ON DELETE SET NULL,
  duration_seconds  INT CHECK (duration_seconds >= 0),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE price_history (
  history_id        BIGSERIAL PRIMARY KEY,
  variant_id        BIGINT NOT NULL REFERENCES product_variants(variant_id) ON DELETE CASCADE,
  price             NUMERIC(12,2) NOT NULL CHECK (price >= 0),
  changed_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE recommendation_feedback (
  feedback_id       BIGSERIAL PRIMARY KEY,
  user_id           BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  product_id        BIGINT NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
  action            VARCHAR(30) NOT NULL CHECK (action IN ('clicked','ignored','purchased')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE reports (
  report_id         BIGSERIAL PRIMARY KEY,
  reported_by_user  BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  entity_type       VARCHAR(30) NOT NULL CHECK (entity_type IN ('product','review','seller')),
  entity_id         BIGINT NOT NULL,
  reason            TEXT,
  status            VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','resolved','rejected')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE seller_violations (
  violation_id      BIGSERIAL PRIMARY KEY,
  seller_id         BIGINT NOT NULL REFERENCES sellers(seller_id) ON DELETE CASCADE,
  violation_type    VARCHAR(255),
  penalty           TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE audit_logs (
  audit_id          BIGSERIAL PRIMARY KEY,
  admin_id          BIGINT NOT NULL REFERENCES admins(admin_id) ON DELETE CASCADE,
  action            TEXT NOT NULL,
  entity_type       VARCHAR(50),
  entity_id         BIGINT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_admin_id ON audit_logs(admin_id);

CREATE TABLE admin_dashboards (
  dashboard_id      BIGSERIAL PRIMARY KEY,
  admin_id          BIGINT NOT NULL REFERENCES admins(admin_id) ON DELETE CASCADE,
  name              VARCHAR(120) NOT NULL,
  layout            JSONB NOT NULL, 
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE site_kpis_daily (
  kpi_date          DATE PRIMARY KEY,
  new_users         INT NOT NULL DEFAULT 0,
  new_sellers       INT NOT NULL DEFAULT 0,
  total_orders      INT NOT NULL DEFAULT 0,
  gross_merch_value NUMERIC(14,2) NOT NULL DEFAULT 0,
  net_revenue       NUMERIC(14,2) NOT NULL DEFAULT 0,
  refunds_total     NUMERIC(14,2) NOT NULL DEFAULT 0
);

CREATE TABLE traffic_kpis_daily (
  kpi_date          DATE PRIMARY KEY,
  searches          INT NOT NULL DEFAULT 0,
  product_clicks    INT NOT NULL DEFAULT 0,
  product_views     INT NOT NULL DEFAULT 0,
  avg_view_seconds  NUMERIC(10,2) NOT NULL DEFAULT 0
);

CREATE TABLE finance_kpis_daily (
  kpi_date          DATE PRIMARY KEY,
  commission_total  NUMERIC(14,2) NOT NULL DEFAULT 0,
  payouts_requested NUMERIC(14,2) NOT NULL DEFAULT 0,
  payouts_processed NUMERIC(14,2) NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_product_images_product_id
  ON product_images(product_id);

CREATE INDEX IF NOT EXISTS idx_product_attributes_product_id
  ON product_attributes(product_id);

CREATE INDEX IF NOT EXISTS idx_orders_address_id
  ON orders(address_id);

CREATE INDEX IF NOT EXISTS idx_order_items_variant_id
  ON order_items(variant_id);

CREATE INDEX IF NOT EXISTS idx_reviews_customer_id
  ON reviews(customer_id);

CREATE INDEX IF NOT EXISTS idx_questions_product_id
  ON questions(product_id);

CREATE INDEX IF NOT EXISTS idx_questions_customer_id
  ON questions(customer_id);

CREATE INDEX IF NOT EXISTS idx_answers_seller_id
  ON answers(seller_id);

CREATE INDEX IF NOT EXISTS idx_answers_question_id
  ON answers(question_id);

CREATE INDEX IF NOT EXISTS idx_shipments_courier_id
  ON shipments(courier_id);

CREATE INDEX IF NOT EXISTS idx_refunds_payment_id
  ON refunds(payment_id);

CREATE INDEX IF NOT EXISTS idx_reports_reported_by_user
  ON reports(reported_by_user);

CREATE INDEX IF NOT EXISTS idx_messages_sender_user_id
  ON messages(sender_user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id
  ON notifications(user_id);

CREATE INDEX IF NOT EXISTS idx_recommendation_feedback_user_id
  ON recommendation_feedback(user_id);

CREATE INDEX IF NOT EXISTS idx_recommendation_feedback_product_id
  ON recommendation_feedback(product_id);
-- =============================================================================
-- db_extensions.sql
-- Run this ONCE against your database after db.sql has been applied.
-- Contains: Triggers, Functions, Procedures, and Complex Query Views
-- =============================================================================


-- =============================================================================
-- SECTION 1: TRIGGERS
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Trigger 1: Auto-update seller rating when a review is inserted or deleted
-- Updates sellers.rating by averaging all ratings across all their products.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_update_seller_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE sellers
  SET rating = (
    SELECT COALESCE(AVG(r.rating), 0)
    FROM reviews r
    JOIN products p    ON p.product_id = r.product_id
    JOIN stores   st   ON st.store_id  = p.store_id
    WHERE st.seller_id = (
      SELECT st2.seller_id
      FROM products p2
      JOIN stores st2 ON st2.store_id = p2.store_id
      WHERE p2.product_id = COALESCE(NEW.product_id, OLD.product_id)
      LIMIT 1
    )
  )
  WHERE seller_id = (
    SELECT st3.seller_id
    FROM products p3
    JOIN stores st3 ON st3.store_id = p3.store_id
    WHERE p3.product_id = COALESCE(NEW.product_id, OLD.product_id)
    LIMIT 1
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_seller_rating ON reviews;
CREATE TRIGGER trg_update_seller_rating
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH ROW EXECUTE FUNCTION fn_update_seller_rating();


-- -----------------------------------------------------------------------------
-- Trigger 2: Auto-update store rating when a review is inserted or deleted
-- Updates stores.store_rating from the average of all reviews on their products.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_update_store_rating()
RETURNS TRIGGER AS $$
DECLARE
  v_store_id BIGINT;
BEGIN
  SELECT p.store_id INTO v_store_id
  FROM products p
  WHERE p.product_id = COALESCE(NEW.product_id, OLD.product_id)
  LIMIT 1;

  UPDATE stores
  SET store_rating = (
    SELECT COALESCE(AVG(r.rating), 0)
    FROM reviews r
    JOIN products p ON p.product_id = r.product_id
    WHERE p.store_id = v_store_id
  )
  WHERE store_id = v_store_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_store_rating ON reviews;
CREATE TRIGGER trg_update_store_rating
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH ROW EXECUTE FUNCTION fn_update_store_rating();


-- -----------------------------------------------------------------------------
-- Trigger 3: Prevent stock from going negative on product_variants updates
-- Raises an exception if any UPDATE tries to set stock below 0.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_prevent_negative_stock()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.stock < 0 THEN
    RAISE EXCEPTION 'Stock cannot go below 0 for variant_id %', NEW.variant_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_negative_stock ON product_variants;
CREATE TRIGGER trg_prevent_negative_stock
BEFORE UPDATE OF stock ON product_variants
FOR EACH ROW EXECUTE FUNCTION fn_prevent_negative_stock();


-- -----------------------------------------------------------------------------
-- Trigger 4: Log price changes to price_history automatically
-- Fires whenever a variant's price column is updated.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_log_price_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.price IS DISTINCT FROM OLD.price THEN
    INSERT INTO price_history (variant_id, price, changed_at)
    VALUES (NEW.variant_id, NEW.price, NOW());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_log_price_change ON product_variants;
CREATE TRIGGER trg_log_price_change
AFTER UPDATE OF price ON product_variants
FOR EACH ROW EXECUTE FUNCTION fn_log_price_change();


-- -----------------------------------------------------------------------------
-- Trigger 5: Increment daily search KPI on each search log insert
-- Keeps traffic_kpis_daily.searches in sync with the raw search log table.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_increment_search_traffic()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO traffic_kpis_daily (kpi_date, searches)
  VALUES (DATE(NEW.created_at), 1)
  ON CONFLICT (kpi_date) DO UPDATE
  SET searches = traffic_kpis_daily.searches + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_increment_search_traffic ON search_logs;
CREATE TRIGGER trg_increment_search_traffic
AFTER INSERT ON search_logs
FOR EACH ROW EXECUTE FUNCTION fn_increment_search_traffic();


-- -----------------------------------------------------------------------------
-- Trigger 6: Increment daily site KPI for new users
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_increment_new_users()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO site_kpis_daily (kpi_date, new_users)
  VALUES (DATE(NEW.created_at), 1)
  ON CONFLICT (kpi_date) DO UPDATE
  SET new_users = site_kpis_daily.new_users + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_increment_new_users ON users;
CREATE TRIGGER trg_increment_new_users
AFTER INSERT ON users
FOR EACH ROW EXECUTE FUNCTION fn_increment_new_users();


-- -----------------------------------------------------------------------------
-- Trigger 7: Increment daily site KPI for new sellers
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_increment_new_sellers()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO site_kpis_daily (kpi_date, new_sellers)
  VALUES (DATE(NEW.created_at), 1)
  ON CONFLICT (kpi_date) DO UPDATE
  SET new_sellers = site_kpis_daily.new_sellers + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_increment_new_sellers ON sellers;
CREATE TRIGGER trg_increment_new_sellers
AFTER INSERT ON sellers
FOR EACH ROW EXECUTE FUNCTION fn_increment_new_sellers();


-- -----------------------------------------------------------------------------
-- Trigger 8: Increment daily site KPI for orders and GMV
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_increment_orders_gmv()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO site_kpis_daily (kpi_date, total_orders, gross_merch_value)
  VALUES (DATE(NEW.created_at), 1, NEW.total_amount)
  ON CONFLICT (kpi_date) DO UPDATE
  SET total_orders = site_kpis_daily.total_orders + 1,
      gross_merch_value = site_kpis_daily.gross_merch_value + NEW.total_amount;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_increment_orders_gmv ON orders;
CREATE TRIGGER trg_increment_orders_gmv
AFTER INSERT ON orders
FOR EACH ROW EXECUTE FUNCTION fn_increment_orders_gmv();


-- -----------------------------------------------------------------------------
-- Trigger 9: Increment daily site KPI for refunds
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_increment_refunds()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO site_kpis_daily (kpi_date, refunds_total)
  VALUES (DATE(NEW.created_at), NEW.amount)
  ON CONFLICT (kpi_date) DO UPDATE
  SET refunds_total = site_kpis_daily.refunds_total + NEW.amount;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_increment_refunds ON refunds;
CREATE TRIGGER trg_increment_refunds
AFTER INSERT ON refunds
FOR EACH ROW EXECUTE FUNCTION fn_increment_refunds();


-- =============================================================================
-- SECTION 2: FUNCTIONS
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Function 1: Get seller revenue summary
-- Returns total delivered revenue and total orders for a given seller_id.
-- Usage: SELECT * FROM fn_seller_revenue_summary(1);
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_seller_revenue_summary(p_seller_id BIGINT)
RETURNS TABLE(
  total_delivered_orders  INT,
  total_revenue           NUMERIC,
  avg_order_value         NUMERIC,
  total_products          INT,
  avg_product_rating      NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(so.seller_order_id)::INT                         AS total_delivered_orders,
    COALESCE(SUM(so.subtotal), 0)                         AS total_revenue,
    COALESCE(AVG(so.subtotal), 0)                         AS avg_order_value,
    COUNT(DISTINCT p.product_id)::INT                     AS total_products,
    COALESCE(AVG(r.rating), 0)                            AS avg_product_rating
  FROM sellers s
  LEFT JOIN seller_orders so ON so.seller_id = s.seller_id AND so.status = 'delivered'
  LEFT JOIN stores st        ON st.seller_id  = s.seller_id
  LEFT JOIN products p       ON p.store_id    = st.store_id
  LEFT JOIN reviews r        ON r.product_id  = p.product_id
  WHERE s.seller_id = p_seller_id;
END;
$$ LANGUAGE plpgsql;


-- -----------------------------------------------------------------------------
-- Function 2: Calculate commission owed for a seller order
-- Returns the commission amount based on the category commission rate.
-- Usage: SELECT fn_calculate_commission(seller_order_id);
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_calculate_commission(p_seller_order_id BIGINT)
RETURNS NUMERIC AS $$
DECLARE
  v_total_commission NUMERIC := 0;
  v_item             RECORD;
  v_rate             NUMERIC;
BEGIN
  FOR v_item IN
    SELECT oi.price, oi.quantity, p.category_id
    FROM order_items oi
    JOIN product_variants pv ON pv.variant_id  = oi.variant_id
    JOIN products p          ON p.product_id   = pv.product_id
    WHERE oi.seller_order_id = p_seller_order_id
  LOOP
    -- Try category-specific rate first, fall back to global (NULL category) rate
    SELECT percentage INTO v_rate
    FROM commissions
    WHERE category_id = v_item.category_id
    LIMIT 1;

    IF v_rate IS NULL THEN
      SELECT percentage INTO v_rate
      FROM commissions
      WHERE category_id IS NULL
      LIMIT 1;
    END IF;

    IF v_rate IS NOT NULL THEN
      v_total_commission := v_total_commission + (v_item.price * v_item.quantity * v_rate / 100);
    END IF;
  END LOOP;

  RETURN ROUND(v_total_commission, 2);
END;
$$ LANGUAGE plpgsql;


-- -----------------------------------------------------------------------------
-- Function 3: Get platform-wide sales analytics for a date range
-- Returns aggregated GMV, orders, new users for reporting.
-- Usage: SELECT * FROM fn_platform_analytics('2025-01-01', '2025-12-31');
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_platform_analytics(p_from DATE, p_to DATE)
RETURNS TABLE(
  total_orders    BIGINT,
  total_gmv       NUMERIC,
  total_revenue   NUMERIC,
  new_users       BIGINT,
  new_sellers     BIGINT,
  avg_order_value NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(DISTINCT o.order_id)                            AS total_orders,
    COALESCE(SUM(o.total_amount), 0)                     AS total_gmv,
    COALESCE(SUM(fk.commission_total), 0)                AS total_revenue,
    (SELECT COUNT(*) FROM users   WHERE created_at::date BETWEEN p_from AND p_to)  AS new_users,
    (SELECT COUNT(*) FROM sellers
       JOIN users u ON u.user_id = sellers.user_id
       WHERE u.created_at::date BETWEEN p_from AND p_to) AS new_sellers,
    COALESCE(AVG(o.total_amount), 0)                     AS avg_order_value
  FROM orders o
  LEFT JOIN finance_kpis_daily fk ON fk.kpi_date BETWEEN p_from AND p_to
  WHERE o.created_at::date BETWEEN p_from AND p_to;
END;
$$ LANGUAGE plpgsql;


-- =============================================================================
-- SECTION 3: STORED PROCEDURES
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Procedure 1: place_order
-- Full order placement workflow: validates cart, applies coupon, creates order,
-- seller_orders, order_items, decrements stock, clears cart, sends notification.
-- All in a single explicit transaction with COMMIT / ROLLBACK.
--
-- Usage (from psql):
--   CALL place_order(customer_id, address_id, coupon_code, OUT result_order_id, OUT result_total);
-- The Node.js layer calls this via: SELECT * FROM place_order(...) — see note below.
--
-- NOTE: PostgreSQL procedures with OUT params are called differently depending
-- on the driver. We expose a wrapper function for Node.js compatibility.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE place_order(
  p_customer_id  BIGINT,
  p_address_id   BIGINT,
  p_coupon_code  TEXT,
  OUT p_order_id    BIGINT,
  OUT p_total       NUMERIC
)
LANGUAGE plpgsql AS $$
DECLARE
  v_cart_id      BIGINT;
  v_coupon_id    BIGINT;
  v_discount     NUMERIC := 0;
  v_total        NUMERIC := 0;
  v_seller_id    BIGINT;
  v_subtotal     NUMERIC;
  v_so_id        BIGINT;
  v_item         RECORD;
  v_disc_type    TEXT;
  v_disc_val     NUMERIC;
  v_user_id      BIGINT;
BEGIN
  -- Get user_id for notification
  SELECT user_id INTO v_user_id FROM customers WHERE customer_id = p_customer_id;

  -- Get cart_id
  SELECT cart_id INTO v_cart_id FROM carts WHERE customer_id = p_customer_id;
  IF v_cart_id IS NULL THEN
    RAISE EXCEPTION 'Cart not found for customer %', p_customer_id;
  END IF;

  -- Check cart is not empty
  IF NOT EXISTS (SELECT 1 FROM cart_items WHERE cart_id = v_cart_id) THEN
    RAISE EXCEPTION 'Cart is empty';
  END IF;

  -- Calculate raw total and check stock
  FOR v_item IN
    SELECT ci.variant_id, ci.quantity,
           COALESCE(pv.discount_price, pv.price) AS unit_price,
           pv.stock
    FROM cart_items ci
    JOIN product_variants pv ON pv.variant_id = ci.variant_id
    WHERE ci.cart_id = v_cart_id
  LOOP
    IF v_item.quantity > v_item.stock THEN
      RAISE EXCEPTION 'Insufficient stock for variant %', v_item.variant_id;
    END IF;
    v_total := v_total + (v_item.unit_price * v_item.quantity);
  END LOOP;

  -- Apply coupon if provided
  IF p_coupon_code IS NOT NULL AND p_coupon_code <> '' THEN
    SELECT coupon_id, discount_type, discount_value
    INTO v_coupon_id, v_disc_type, v_disc_val
    FROM coupons
    WHERE code = p_coupon_code
      AND (expiry_date IS NULL OR expiry_date >= CURRENT_DATE);

    IF v_coupon_id IS NULL THEN
      RAISE EXCEPTION 'Invalid or expired coupon: %', p_coupon_code;
    END IF;

    -- Enforce one-time use per customer within coupon validity period
    IF EXISTS (
      SELECT 1
      FROM order_coupons oc
      JOIN orders o ON o.order_id = oc.order_id
      WHERE o.customer_id = p_customer_id
        AND oc.coupon_id = v_coupon_id
    ) THEN
      RAISE EXCEPTION 'Coupon % has already been used by this customer', p_coupon_code;
    END IF;

    IF v_disc_type = 'percentage' THEN
      v_discount := v_total * v_disc_val / 100;
    ELSE
      v_discount := v_disc_val;
    END IF;
    v_total := GREATEST(0, v_total - v_discount);
  END IF;

  -- Insert master order
  INSERT INTO orders (customer_id, address_id, total_amount, order_status, payment_status)
  VALUES (p_customer_id, p_address_id, ROUND(v_total, 2), 'pending', 'pending')
  RETURNING order_id INTO p_order_id;

  -- Group cart items by seller and create seller_orders + order_items
  FOR v_seller_id IN
    SELECT DISTINCT s.seller_id
    FROM cart_items ci
    JOIN product_variants pv ON pv.variant_id = ci.variant_id
    JOIN products p          ON p.product_id  = pv.product_id
    JOIN stores s            ON s.store_id    = p.store_id
    WHERE ci.cart_id = v_cart_id
  LOOP
    SELECT COALESCE(SUM(COALESCE(pv.discount_price, pv.price) * ci.quantity), 0)
    INTO v_subtotal
    FROM cart_items ci
    JOIN product_variants pv ON pv.variant_id = ci.variant_id
    JOIN products p          ON p.product_id  = pv.product_id
    JOIN stores s            ON s.store_id    = p.store_id
    WHERE ci.cart_id = v_cart_id AND s.seller_id = v_seller_id;

    INSERT INTO seller_orders (order_id, seller_id, subtotal, status)
    VALUES (p_order_id, v_seller_id, ROUND(v_subtotal, 2), 'pending')
    RETURNING seller_order_id INTO v_so_id;

    -- Insert order_items and decrement stock for this seller
    FOR v_item IN
      SELECT ci.variant_id, ci.quantity,
             COALESCE(pv.discount_price, pv.price) AS unit_price
      FROM cart_items ci
      JOIN product_variants pv ON pv.variant_id = ci.variant_id
      JOIN products p          ON p.product_id  = pv.product_id
      JOIN stores s            ON s.store_id    = p.store_id
      WHERE ci.cart_id = v_cart_id AND s.seller_id = v_seller_id
    LOOP
      INSERT INTO order_items (seller_order_id, variant_id, quantity, price)
      VALUES (v_so_id, v_item.variant_id, v_item.quantity, ROUND(v_item.unit_price, 2));

      UPDATE product_variants
      SET stock = stock - v_item.quantity
      WHERE variant_id = v_item.variant_id;
    END LOOP;
  END LOOP;

  -- Record coupon usage if applied
  IF v_coupon_id IS NOT NULL THEN
    INSERT INTO order_coupons (order_id, coupon_id, applied_amount)
    VALUES (p_order_id, v_coupon_id, ROUND(v_discount, 2));
  END IF;

  -- Clear cart
  DELETE FROM cart_items WHERE cart_id = v_cart_id;

  -- Send notification
  INSERT INTO notifications (user_id, type, message)
  VALUES (v_user_id, 'order',
          'Your order #' || p_order_id || ' has been placed. Total: ' || ROUND(v_total, 2));

  p_total := ROUND(v_total, 2);
END;
$$;

-- Node.js-callable wrapper (returns a row so pg driver can read OUT params easily)
CREATE OR REPLACE FUNCTION fn_place_order(
  p_customer_id BIGINT,
  p_address_id  BIGINT,
  p_coupon_code TEXT
)
RETURNS TABLE(order_id BIGINT, total NUMERIC) AS $$
DECLARE
  v_order_id BIGINT;
  v_total    NUMERIC;
BEGIN
  CALL place_order(p_customer_id, p_address_id, p_coupon_code, v_order_id, v_total);
  RETURN QUERY SELECT v_order_id, v_total;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------- 
-- Function: revert_campaign_prices
-- Reverts discount_price for variants in ended campaigns
-- Call periodically or via cron to clean up expired campaigns
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION revert_campaign_prices()
RETURNS VOID AS $$
BEGIN
  UPDATE product_variants
  SET discount_price = cp.original_discount_price
  FROM campaign_products cp
  JOIN campaigns c ON c.campaign_id = cp.campaign_id
  WHERE product_variants.variant_id = cp.variant_id
    AND NOW() > c.end_time;

  -- Optionally delete ended campaign_products after reverting
  DELETE FROM campaign_products
  WHERE campaign_id IN (
    SELECT campaign_id FROM campaigns WHERE NOW() > end_time
  );
END;
$$ LANGUAGE plpgsql;


-- =============================================================================
-- SECTION 4: COMPLEX QUERY VIEWS
-- (Used by the admin analytics endpoints — satisfies the "3+ complex queries" requirement)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Complex Query 1: Top sellers by delivered revenue
-- Multi-table join with aggregation across sellers, orders, users
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW vw_top_sellers AS
SELECT
  s.seller_id,
  u.name                                          AS seller_name,
  u.email                                         AS seller_email,
  s.kyc_status,
  s.rating                                        AS seller_rating,
  COUNT(DISTINCT so.seller_order_id)::INT         AS total_orders,
  COALESCE(SUM(so.subtotal), 0)                  AS total_revenue,
  COUNT(DISTINCT p.product_id)::INT               AS total_products,
  COALESCE(AVG(r.rating), 0)::NUMERIC(3,2)       AS avg_product_rating,
  COUNT(DISTINCT r.review_id)::INT                AS total_reviews
FROM sellers s
JOIN users u                ON u.user_id     = s.user_id
LEFT JOIN seller_orders so  ON so.seller_id  = s.seller_id AND so.status = 'delivered'
LEFT JOIN stores st         ON st.seller_id  = s.seller_id
LEFT JOIN products p        ON p.store_id    = st.store_id
LEFT JOIN reviews r         ON r.product_id  = p.product_id
GROUP BY s.seller_id, u.name, u.email, s.kyc_status, s.rating
ORDER BY total_revenue DESC;


-- -----------------------------------------------------------------------------
-- Complex Query 2: Best-selling products with revenue and review data
-- Joins products, variants, order_items, reviews, categories, stores
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW vw_best_selling_products AS
SELECT
  p.product_id,
  p.name                                          AS product_name,
  p.brand,
  p.status,
  cat.name                                        AS category_name,
  st.store_name,
  u.name                                          AS seller_name,
  MIN(pv.price)                                  AS min_price,
  COALESCE(SUM(oi.quantity), 0)::INT             AS total_units_sold,
  COALESCE(SUM(oi.quantity * oi.price), 0)       AS total_revenue,
  COALESCE(AVG(r.rating), 0)::NUMERIC(3,2)       AS avg_rating,
  COUNT(DISTINCT r.review_id)::INT                AS review_count,
  COALESCE(SUM(pv.stock), 0)::INT                AS current_stock
FROM products p
JOIN stores st              ON st.store_id    = p.store_id
JOIN sellers s              ON s.seller_id    = st.seller_id
JOIN users u                ON u.user_id      = s.user_id
LEFT JOIN categories cat    ON cat.category_id = p.category_id
LEFT JOIN product_variants pv ON pv.product_id = p.product_id
LEFT JOIN order_items oi    ON oi.variant_id  = pv.variant_id
LEFT JOIN reviews r         ON r.product_id   = p.product_id
GROUP BY p.product_id, p.name, p.brand, p.status,
         cat.name, st.store_name, u.name
ORDER BY total_units_sold DESC;


-- -----------------------------------------------------------------------------
-- Complex Query 3: Category performance report
-- Aggregates orders, revenue, and product counts per category
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW vw_category_performance AS
SELECT
  cat.category_id,
  cat.name                                         AS category_name,
  cat.slug,
  parent.name                                      AS parent_category,
  COUNT(DISTINCT p.product_id)::INT               AS total_products,
  COUNT(DISTINCT oi.order_item_id)::INT           AS total_orders,
  COALESCE(SUM(oi.quantity), 0)::INT              AS total_units_sold,
  COALESCE(SUM(oi.quantity * oi.price), 0)        AS total_revenue,
  COALESCE(AVG(r.rating), 0)::NUMERIC(3,2)        AS avg_rating,
  COALESCE(cm.percentage, 0)                      AS commission_rate
FROM categories cat
LEFT JOIN categories parent     ON parent.category_id = cat.parent_id
LEFT JOIN products p            ON p.category_id      = cat.category_id
LEFT JOIN product_variants pv   ON pv.product_id      = p.product_id
LEFT JOIN order_items oi        ON oi.variant_id      = pv.variant_id
LEFT JOIN reviews r             ON r.product_id       = p.product_id
LEFT JOIN commissions cm        ON cm.category_id     = cat.category_id
GROUP BY cat.category_id, cat.name, cat.slug, parent.name, cm.percentage
ORDER BY total_revenue DESC;


-- -----------------------------------------------------------------------------
-- Complex Query 4: Customer lifetime value report
-- Joins users, customers, orders, payments — used for admin analytics
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW vw_customer_ltv AS
SELECT
  c.customer_id,
  u.name                                          AS customer_name,
  u.email,
  u.created_at                                    AS joined_at,B
  COUNT(DISTINCT o.order_id)::INT                 AS total_orders,
  COALESCE(SUM(o.total_amount), 0)               AS lifetime_value,
  COALESCE(AVG(o.total_amount), 0)               AS avg_order_value,
  MAX(o.created_at)                               AS last_order_at,
  COUNT(DISTINCT r.review_id)::INT                AS reviews_written
FROM customers c
JOIN users u                ON u.user_id      = c.user_id
LEFT JOIN orders o          ON o.customer_id  = c.customer_id
                           AND o.payment_status = 'paid'
LEFT JOIN reviews r         ON r.customer_id  = c.customer_id
GROUP BY c.customer_id, u.name, u.email, u.created_at
ORDER BY lifetime_value DESC;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS notified_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_fee NUMERIC(12,2) NOT NULL DEFAULT 0;