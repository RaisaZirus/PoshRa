

-- =========
-- 0) TYPES / ENUMS (optional; using CHECK constraints keeps it simple)
-- =========

-- =========
-- 1) USERS + AUTH (JWT)
-- =========
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

-- Refresh tokens for JWT rotation (recommended)
CREATE TABLE refresh_tokens (
  token_id          BIGSERIAL PRIMARY KEY,
  user_id           BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  token_hash        VARCHAR(255) NOT NULL,        -- store hashed refresh token
  issued_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at        TIMESTAMPTZ NOT NULL,
  revoked_at        TIMESTAMPTZ,
  user_agent        TEXT,
  ip_address        INET
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);

-- Optional: password reset flow
CREATE TABLE password_reset_tokens (
  reset_id          BIGSERIAL PRIMARY KEY,
  user_id           BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  token_hash        VARCHAR(255) NOT NULL,
  expires_at        TIMESTAMPTZ NOT NULL,
  used_at           TIMESTAMPTZ
);

CREATE INDEX idx_password_reset_user_id ON password_reset_tokens(user_id);

-- =========
-- 2) ROLE PROFILES (distinct tables; NOT same account)
-- =========

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

-- =========
-- 3) ADDRESSES
-- =========
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

-- =========
-- 4) CATEGORY TREE
-- =========
CREATE TABLE categories (
  category_id       BIGSERIAL PRIMARY KEY,
  parent_id         BIGINT REFERENCES categories(category_id) ON DELETE SET NULL,
  name              VARCHAR(255) NOT NULL,
  slug              VARCHAR(255) UNIQUE NOT NULL
);

CREATE INDEX idx_categories_parent_id ON categories(parent_id);

-- =========
-- 5) STORE
-- =========
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

-- =========
-- 6) PRODUCTS (Daraz-style: Product + Variant)
-- =========
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

-- =========
-- 7) CART
-- =========
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

-- =========
-- 8) ORDERS (Daraz: Order -> SellerOrder -> OrderItem)
-- =========
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

-- =========
-- 9) PAYMENTS
-- =========
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

-- =========
-- 10) LOGISTICS: COURIER + SHIPMENT (per seller_order)
-- =========
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

-- =========
-- 11) RETURNS & REFUNDS
-- =========
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

-- =========
-- 12) REVIEWS + Q&A
-- =========
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

-- =========
-- 13) COUPONS + CAMPAIGNS
-- =========
CREATE TABLE coupons (
  coupon_id         BIGSERIAL PRIMARY KEY,
  code              VARCHAR(50) UNIQUE NOT NULL,
  discount_type     VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage','fixed')),
  discount_value    NUMERIC(12,2) NOT NULL CHECK (discount_value >= 0),
  expiry_date       DATE
);

-- If coupon used in an order (many-to-many over time)
CREATE TABLE order_coupons (
  order_coupon_id   BIGSERIAL PRIMARY KEY,
  order_id          BIGINT NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
  coupon_id         BIGINT NOT NULL REFERENCES coupons(coupon_id),
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
  PRIMARY KEY (campaign_id, variant_id)
);

-- =========
-- 14) COMMISSION + PAYOUTS
-- =========
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

-- =========
-- 15) INVENTORY + WAREHOUSE
-- =========
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

-- =========
-- 16) WISHLIST
-- =========
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

-- =========
-- 17) CHAT
-- =========
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

-- =========
-- 18) NOTIFICATIONS + EVENTS
-- =========
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

-- =========
-- 19) ANALYTICS (Advanced)
-- =========
CREATE TABLE search_logs (
  search_id         BIGSERIAL PRIMARY KEY,
  user_id           BIGINT REFERENCES users(user_id) ON DELETE SET NULL,
  query             TEXT NOT NULL,
  filters           JSONB,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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

-- =========
-- 20) MODERATION + AUDIT (Admin controls)
-- =========
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

-- =========
-- 21) ADMIN DIAGNOSTICS (overall website health/KPIs)
-- =========

-- Saved dashboard configurations (widgets, filters, etc.)
CREATE TABLE admin_dashboards (
  dashboard_id      BIGSERIAL PRIMARY KEY,
  admin_id          BIGINT NOT NULL REFERENCES admins(admin_id) ON DELETE CASCADE,
  name              VARCHAR(120) NOT NULL,
  layout            JSONB NOT NULL, -- stores widget layout config
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Daily site KPIs (orders, users, sellers, etc.)
CREATE TABLE site_kpis_daily (
  kpi_date          DATE PRIMARY KEY,
  new_users         INT NOT NULL DEFAULT 0,
  new_sellers       INT NOT NULL DEFAULT 0,
  total_orders      INT NOT NULL DEFAULT 0,
  gross_merch_value NUMERIC(14,2) NOT NULL DEFAULT 0,
  net_revenue       NUMERIC(14,2) NOT NULL DEFAULT 0,
  refunds_total     NUMERIC(14,2) NOT NULL DEFAULT 0
);

-- Traffic KPIs (from logs)
CREATE TABLE traffic_kpis_daily (
  kpi_date          DATE PRIMARY KEY,
  searches          INT NOT NULL DEFAULT 0,
  product_clicks    INT NOT NULL DEFAULT 0,
  product_views     INT NOT NULL DEFAULT 0,
  avg_view_seconds  NUMERIC(10,2) NOT NULL DEFAULT 0
);

-- Finance KPIs (payouts/commission)
CREATE TABLE finance_kpis_daily (
  kpi_date          DATE PRIMARY KEY,
  commission_total  NUMERIC(14,2) NOT NULL DEFAULT 0,
  payouts_requested NUMERIC(14,2) NOT NULL DEFAULT 0,
  payouts_processed NUMERIC(14,2) NOT NULL DEFAULT 0
);

