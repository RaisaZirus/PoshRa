import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../auth/useAuth.jsx";

const COLORS = {
  pageBg: "#f6f3ea",
  surface: "#fffdf8",
  surfaceSoft: "#fcf7e8",
  primary: "#fee32b",
  primaryDeep: "#c7a90d",
  olive: "#877928",
  ink: "#17140f",
  muted: "#6e6551",
  line: "rgba(23,20,15,0.10)",
  danger: "#dc2626",
  success: "#15803d",
  shadow: "0 20px 60px rgba(23,20,15,0.08)",
  shadowHover: "0 28px 80px rgba(23,20,15,0.14)",
};

const currency = new Intl.NumberFormat("en-BD");

function Card({ children, style, className = "" }) {
  return (
    <div
      className={className}
      style={{
        background: `linear-gradient(180deg, ${COLORS.surface} 0%, #fffaf0 100%)`,
        border: `1px solid ${COLORS.line}`,
        borderRadius: 24,
        boxShadow: COLORS.shadow,
        overflow: "hidden",
        position: "relative",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function StatPill({ label, value, tone = "default" }) {
  const tones = {
    default: {
      bg: "rgba(255,255,255,0.72)",
      color: COLORS.ink,
      border: COLORS.line,
    },
    success: {
      bg: "rgba(21,128,61,0.08)",
      color: COLORS.success,
      border: "rgba(21,128,61,0.16)",
    },
    accent: {
      bg: "rgba(254,227,43,0.22)",
      color: COLORS.ink,
      border: "rgba(254,227,43,0.35)",
    },
  };

  const toneStyle = tones[tone] || tones.default;

  return (
    <div
      style={{
        padding: "12px 14px",
        borderRadius: 18,
        background: toneStyle.bg,
        border: `1px solid ${toneStyle.border}`,
        minWidth: 132,
        backdropFilter: "blur(8px)",
      }}
    >
      <div style={{ fontSize: 11, color: COLORS.muted, marginBottom: 4, letterSpacing: 0.3 }}>
        {label}
      </div>
      <div style={{ fontSize: 16, fontWeight: 900, color: toneStyle.color }}>{value}</div>
    </div>
  );
}

export default function CartPage() {
  const { fetchWithAuth } = useAuth();
  const navigate = useNavigate();

  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyItemId, setBusyItemId] = useState(null);
  const [cartBusy, setCartBusy] = useState(false);

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchWithAuth("/api/cart");
      if (data.success) setCart(data.data);
    } catch (err) {
      console.error("Error fetching cart:", err);
      setError(err.response?.data?.message || "Failed to load cart");
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (cart_item_id, newQuantity) => {
    if (newQuantity < 1) return;

    try {
      setBusyItemId(cart_item_id);
      const data = await fetchWithAuth(`/api/cart/items/${cart_item_id}`, {
        method: "PUT",
        body: JSON.stringify({ quantity: newQuantity }),
      });
      if (data.success) await fetchCart();
    } catch (err) {
      console.error("Error updating quantity:", err);
    } finally {
      setBusyItemId(null);
    }
  };

  const removeItem = async (cart_item_id) => {
    try {
      setBusyItemId(cart_item_id);
      const data = await fetchWithAuth(`/api/cart/items/${cart_item_id}`, {
        method: "DELETE",
      });
      if (data.success) await fetchCart();
    } catch (err) {
      console.error("Error removing item:", err);
    } finally {
      setBusyItemId(null);
    }
  };

  const clearCart = async () => {
    if (window.confirm("Are you sure you want to clear your cart?")) {
      try {
        setCartBusy(true);
        const data = await fetchWithAuth("/api/cart", { method: "DELETE" });
        if (data.success) await fetchCart();
      } catch (err) {
        console.error("Error clearing cart:", err);
      } finally {
        setCartBusy(false);
      }
    }
  };

  const isEmpty = !cart || !cart.items || cart.items.length === 0;

  const savings = useMemo(() => {
    if (!cart?.items?.length) return 0;
    return cart.items.reduce((total, item) => {
      const regular = Number(item.price || 0);
      const sale = Number(item.discount_price || item.price || 0);
      const saved = Math.max(regular - sale, 0);
      return total + saved * Number(item.quantity || 0);
    }, 0);
  }, [cart]);

  const subtotal = Number(cart?.total || 0);
  const itemCount = Number(cart?.itemCount || 0);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: COLORS.pageBg, padding: "32px 16px" }}>
        <style>{sharedStyles}</style>
        <div className="cart-shell">
          <div className="ambient-orb orb-one" />
          <div className="ambient-orb orb-two" />

          <Card style={{ padding: 28 }}>
            <div className="loading-shine" />
            <div style={{ position: "relative", zIndex: 1 }}>
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 24,
                  display: "grid",
                  placeItems: "center",
                  background: "linear-gradient(135deg, rgba(254,227,43,0.9), rgba(255,255,255,0.75))",
                  fontSize: 34,
                  boxShadow: "0 16px 35px rgba(254,227,43,0.25)",
                  marginBottom: 18,
                }}
              >
                🛒
              </div>
              <h2 style={{ fontSize: 26, fontWeight: 900, color: COLORS.ink, marginBottom: 8 }}>
                Preparing your cart
              </h2>
              <p style={{ fontSize: 14, color: COLORS.muted, marginBottom: 22 }}>
                Loading products, prices, and checkout summary...
              </p>

              <div className="skeleton-stack">
                <div className="skeleton-card" />
                <div className="skeleton-card" />
                <div className="skeleton-card short" />
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: "100vh", background: COLORS.pageBg, padding: "32px 16px" }}>
        <style>{sharedStyles}</style>
        <div className="cart-shell">
          <Card style={{ padding: 34, textAlign: "center" }}>
            <div className="floating-icon">⚠️</div>
            <h2 style={{ fontSize: 28, fontWeight: 900, color: COLORS.ink, marginBottom: 10 }}>
              Couldn&apos;t load your cart
            </h2>
            <p style={{ fontSize: 14, color: COLORS.muted, maxWidth: 500, margin: "0 auto 22px" }}>
              {error}
            </p>

            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={fetchCart}
                className="primary-btn"
                style={{ minWidth: 170 }}
              >
                Try Again
              </button>
              <Link to="/" className="ghost-btn" style={{ minWidth: 170, textAlign: "center" }}>
                Back to Shopping
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: `radial-gradient(circle at top left, rgba(254,227,43,0.16), transparent 28%),
                     radial-gradient(circle at 85% 15%, rgba(135,121,40,0.10), transparent 22%),
                     linear-gradient(180deg, #f8f4ea 0%, #f5f1e5 50%, #f6f3ea 100%)`,
        color: COLORS.ink,
        fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif',
        padding: "28px 16px 72px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <style>{sharedStyles}</style>

      <div className="cart-shell">
        <div className="ambient-orb orb-one" />
        <div className="ambient-orb orb-two" />
        <div className="ambient-grid" />

        <section className="hero-card reveal-up">
          <div className="hero-copy">
            <div className="eyebrow-pill">Secure checkout experience</div>
            <h1 className="hero-title">Your cart</h1>
            <p className="hero-subtitle">
              {isEmpty
                ? "Your cart is currently empty. Add products and return here for a faster, cleaner checkout flow."
                : `${itemCount} item${itemCount !== 1 ? "s" : ""} ready for checkout. Review quantities, savings, and order summary below.`}
            </p>
          </div>

          <div className="hero-stats">
            <StatPill label="Items" value={String(itemCount).padStart(2, "0")} tone="accent" />
            <StatPill
              label="Savings"
              value={`৳${currency.format(savings)}`}
              tone={savings > 0 ? "success" : "default"}
            />
            <StatPill label="Checkout" value="Fast & secure" />
          </div>
        </section>

        {isEmpty ? (
          <Card className="reveal-up" style={{ padding: "42px 28px", textAlign: "center" }}>
            <div className="empty-icon-wrap">
              <div className="floating-icon">🛍️</div>
            </div>
            <h2 style={{ fontSize: 30, fontWeight: 900, color: COLORS.ink, marginBottom: 10 }}>
              Your cart is empty
            </h2>
            <p style={{ fontSize: 15, color: COLORS.muted, maxWidth: 560, margin: "0 auto 26px" }}>
              Discover curated products and add them to your cart. Once items are added, this page will show a polished summary, savings, and a cleaner checkout flow.
            </p>

            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <Link to="/" className="primary-btn" style={{ minWidth: 190, textAlign: "center" }}>
                Continue Shopping
              </Link>
              <button
                type="button"
                className="ghost-btn"
                style={{ minWidth: 190 }}
                onClick={() => navigate(-1)}
              >
                Go Back
              </button>
            </div>
          </Card>
        ) : (
          <div className="cart-layout">
            <div className="items-column">
              <div className="section-topbar reveal-up">
                <div>
                  <h2 className="section-title">Cart items</h2>
                  <p className="section-meta">Review each product before checkout</p>
                </div>

                <button
                  type="button"
                  onClick={clearCart}
                  disabled={cartBusy}
                  className="ghost-btn"
                  style={{ minWidth: 140, opacity: cartBusy ? 0.65 : 1 }}
                >
                  {cartBusy ? "Clearing..." : "Clear Cart"}
                </button>
              </div>

              <div className="items-stack">
                {cart.items.map((item, index) => {
                  const price = Number(item.discount_price || item.price || 0);
                  const originalPrice = Number(item.price || 0);
                  const quantity = Number(item.quantity || 0);
                  const stock = Number(item.stock || 0);
                  const lineTotal = price * quantity;
                  const originalTotal = originalPrice * quantity;
                  const hasDiscount = Boolean(item.discount_price) && price < originalPrice;
                  const discount = hasDiscount
                    ? Math.round(((originalPrice - price) / originalPrice) * 100)
                    : 0;
                  const isBusy = busyItemId === item.cart_item_id;

                  return (
                    <Card
                      key={item.cart_item_id}
                      className="cart-item-card"
                      style={{ animationDelay: `${index * 80}ms` }}
                    >
                      <div className="card-glow" />
                      <div className="cart-item-grid">
                        <div className="product-media-wrap">
                          {hasDiscount ? <div className="discount-chip">-{discount}%</div> : null}
                          <img
                            src={item.image_url || "https://via.placeholder.com/300x300?text=Product"}
                            alt={item.product_name}
                            className="product-image"
                          />
                        </div>

                        <div className="product-content">
                          <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
                            <div>
                              <Link to={`/p/${item.product_id}`} className="product-name-link">
                                {item.product_name}
                              </Link>
                              <p className="product-meta">
                                {item.brand || "Brand unavailable"}
                                {item.sku ? ` • ${item.sku}` : ""}
                              </p>
                            </div>

                            <div className="line-total-wrap desktop-only">
                              <div className="line-total">৳{currency.format(lineTotal)}</div>
                              {hasDiscount ? (
                                <div className="line-total-old">৳{currency.format(originalTotal)}</div>
                              ) : null}
                            </div>
                          </div>

                          <div className="badge-row">
                            <span className="soft-badge">Sold by {item.store_name}</span>
                            <span className="soft-badge">Stock: {stock}</span>
                            <span className="soft-badge">Unit: ৳{currency.format(price)}</span>
                          </div>

                          <div className="mobile-total-wrap mobile-only">
                            <div className="line-total">৳{currency.format(lineTotal)}</div>
                            {hasDiscount ? (
                              <div className="line-total-old">৳{currency.format(originalTotal)}</div>
                            ) : null}
                          </div>

                          <div className="item-actions-row">
                            <div className="quantity-wrap">
                              <button
                                type="button"
                                className="qty-btn"
                                onClick={() => updateQuantity(item.cart_item_id, quantity - 1)}
                                disabled={isBusy || quantity <= 1}
                                aria-label={`Decrease quantity of ${item.product_name}`}
                              >
                                −
                              </button>

                              <input
                                type="number"
                                min="1"
                                value={quantity}
                                onChange={(e) =>
                                  updateQuantity(
                                    item.cart_item_id,
                                    Math.max(1, parseInt(e.target.value, 10) || 1)
                                  )
                                }
                                className="qty-input"
                                aria-label={`Quantity of ${item.product_name}`}
                                disabled={isBusy}
                              />

                              <button
                                type="button"
                                className="qty-btn"
                                onClick={() => updateQuantity(item.cart_item_id, quantity + 1)}
                                disabled={isBusy || quantity >= stock}
                                aria-label={`Increase quantity of ${item.product_name}`}
                              >
                                +
                              </button>
                            </div>

                            <div className="action-side">
                              {isBusy ? (
                                <span className="updating-text">Updating...</span>
                              ) : stock > 0 ? (
                                <span className="stock-text in">In stock</span>
                              ) : (
                                <span className="stock-text out">Out of stock</span>
                              )}

                              <button
                                type="button"
                                className="remove-btn"
                                onClick={() => removeItem(item.cart_item_id)}
                                disabled={isBusy}
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>

            <div className="summary-column">
              <Card className="summary-card reveal-up" style={{ padding: 24 }}>
                <div className="summary-header-row">
                  <div>
                    <p className="summary-eyebrow">Order summary</p>
                    <h3 className="summary-title">Checkout overview</h3>
                  </div>
                  <div className="summary-badge">Secure</div>
                </div>

                <div className="summary-items-list">
                  {cart.items.map((item) => {
                    const price = Number(item.discount_price || item.price || 0);
                    return (
                      <div key={item.cart_item_id} className="summary-item-row">
                        <div>
                          <div className="summary-item-name">{item.product_name}</div>
                          <div className="summary-item-meta">Qty {item.quantity}</div>
                        </div>
                        <div className="summary-item-price">
                          ৳{currency.format(price * Number(item.quantity || 0))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="divider" />

                <div className="totals-stack">
                  <div className="total-row">
                    <span>Subtotal</span>
                    <strong>৳{currency.format(subtotal)}</strong>
                  </div>
                  <div className="total-row">
                    <span>Savings</span>
                    <strong style={{ color: savings > 0 ? COLORS.success : COLORS.muted }}>
                      {savings > 0 ? `− ৳${currency.format(savings)}` : "৳0"}
                    </strong>
                  </div>
                  <div className="total-row">
                    <span>Shipping</span>
                    <strong style={{ color: COLORS.success }}>Calculated at checkout</strong>
                  </div>
                  <div className="total-row">
                    <span>Tax</span>
                    <strong>৳0</strong>
                  </div>
                </div>

                <div className="grand-total-row">
                  <span>Total</span>
                  <span>৳{currency.format(subtotal)}</span>
                </div>

                <button
                  type="button"
                  className="primary-btn pulse-btn"
                  style={{ width: "100%", marginBottom: 10 }}
                  onClick={() => navigate("/checkout")}
                >
                  Proceed to Checkout
                </button>

                <Link to="/" className="ghost-btn" style={{ width: "100%", textAlign: "center" }}>
                  Continue Shopping
                </Link>

                <div className="trust-box">
                  <div className="trust-item">
                    <span>✓</span>
                    <p>
                      <strong>Free delivery</strong>
                      <span> on orders above ৳499</span>
                    </p>
                  </div>
                  <div className="trust-item">
                    <span>✓</span>
                    <p>
                      <strong>Easy returns</strong>
                      <span> within 30 days</span>
                    </p>
                  </div>
                  <div className="trust-item">
                    <span>✓</span>
                    <p>
                      <strong>Secure payment</strong>
                      <span> guaranteed</span>
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const sharedStyles = `
  * { box-sizing: border-box; }

  .cart-shell {
    width: min(1240px, 100%);
    margin: 0 auto;
    position: relative;
    z-index: 1;
  }

  .ambient-orb {
    position: absolute;
    border-radius: 999px;
    filter: blur(40px);
    pointer-events: none;
    opacity: 0.9;
    animation: floatOrb 8s ease-in-out infinite;
  }

  .orb-one {
    width: 210px;
    height: 210px;
    top: 30px;
    left: -70px;
    background: rgba(254,227,43,0.18);
  }

  .orb-two {
    width: 270px;
    height: 270px;
    top: 180px;
    right: -100px;
    background: rgba(135,121,40,0.12);
    animation-delay: -2.4s;
  }

  .ambient-grid {
    position: absolute;
    inset: 0;
    background-image: linear-gradient(rgba(23,20,15,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(23,20,15,0.02) 1px, transparent 1px);
    background-size: 36px 36px;
    mask-image: linear-gradient(180deg, rgba(0,0,0,0.3), transparent 85%);
    pointer-events: none;
  }

  .hero-card {
    position: relative;
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 22px;
    flex-wrap: wrap;
    padding: 28px;
    margin-bottom: 28px;
    border-radius: 28px;
    border: 1px solid rgba(23,20,15,0.08);
    background: linear-gradient(135deg, rgba(255,255,255,0.72), rgba(252,247,232,0.9));
    box-shadow: 0 24px 80px rgba(23,20,15,0.07);
    backdrop-filter: blur(16px);
    overflow: hidden;
  }

  .hero-card::before {
    content: "";
    position: absolute;
    inset: -1px;
    background: linear-gradient(130deg, rgba(254,227,43,0.45), transparent 32%, transparent 68%, rgba(255,255,255,0.55));
    opacity: 0.65;
    pointer-events: none;
  }

  .hero-copy, .hero-stats { position: relative; z-index: 1; }

  .eyebrow-pill {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    border-radius: 999px;
    background: rgba(255,255,255,0.7);
    border: 1px solid rgba(23,20,15,0.08);
    color: ${COLORS.olive};
    font-weight: 700;
    font-size: 12px;
    letter-spacing: 0.18px;
    margin-bottom: 14px;
  }

  .hero-title {
    margin: 0;
    font-size: clamp(30px, 4.2vw, 48px);
    line-height: 1.05;
    letter-spacing: -0.04em;
    font-weight: 950;
    color: ${COLORS.ink};
    max-width: 700px;
  }

  .hero-subtitle {
    margin: 14px 0 0;
    max-width: 700px;
    font-size: 15px;
    line-height: 1.7;
    color: ${COLORS.muted};
  }

  .hero-stats {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .cart-layout {
    display: grid;
    grid-template-columns: minmax(0, 1.7fr) minmax(330px, 0.95fr);
    gap: 26px;
    align-items: start;
  }

  .section-topbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
    margin-bottom: 16px;
  }

  .section-title {
    margin: 0 0 4px;
    font-size: 24px;
    font-weight: 900;
    letter-spacing: -0.02em;
  }

  .section-meta {
    margin: 0;
    font-size: 13px;
    color: ${COLORS.muted};
  }

  .items-stack {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .cart-item-card {
    padding: 18px;
    transform: translateY(10px);
    opacity: 0;
    animation: revealUp 0.7s cubic-bezier(.2,.8,.2,1) forwards;
    transition: transform 0.28s ease, box-shadow 0.28s ease, border-color 0.28s ease;
  }

  .cart-item-card:hover {
    transform: translateY(-6px);
    box-shadow: ${COLORS.shadowHover};
    border-color: rgba(23,20,15,0.14);
  }

  .card-glow {
    position: absolute;
    inset: auto auto -20px -20px;
    width: 140px;
    height: 140px;
    background: radial-gradient(circle, rgba(254,227,43,0.16), transparent 70%);
    pointer-events: none;
  }

  .cart-item-grid {
    position: relative;
    z-index: 1;
    display: grid;
    grid-template-columns: 140px minmax(0, 1fr);
    gap: 18px;
    align-items: stretch;
  }

  .product-media-wrap {
    position: relative;
    border-radius: 20px;
    overflow: hidden;
    background: linear-gradient(180deg, #fff, ${COLORS.surfaceSoft});
    min-height: 140px;
    border: 1px solid rgba(23,20,15,0.06);
  }

  .discount-chip {
    position: absolute;
    top: 10px;
    left: 10px;
    z-index: 2;
    padding: 6px 10px;
    border-radius: 999px;
    background: rgba(23,20,15,0.84);
    color: #fff;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.2px;
  }

  .product-image {
    width: 100%;
    height: 100%;
    min-height: 140px;
    object-fit: cover;
    display: block;
    transition: transform 0.55s ease;
  }

  .cart-item-card:hover .product-image {
    transform: scale(1.06);
  }

  .product-content {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 14px;
    min-width: 0;
  }

  .product-name-link {
    color: ${COLORS.ink};
    text-decoration: none;
    font-size: 18px;
    font-weight: 900;
    line-height: 1.35;
    letter-spacing: -0.02em;
    transition: color 0.2s ease;
  }

  .product-name-link:hover {
    color: ${COLORS.primaryDeep};
  }

  .product-meta {
    margin: 6px 0 0;
    color: ${COLORS.muted};
    font-size: 13px;
  }

  .badge-row {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  .soft-badge {
    display: inline-flex;
    align-items: center;
    padding: 9px 11px;
    border-radius: 999px;
    background: rgba(255,255,255,0.72);
    border: 1px solid rgba(23,20,15,0.08);
    color: ${COLORS.muted};
    font-size: 12px;
    font-weight: 700;
  }

  .line-total-wrap,
  .mobile-total-wrap {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    flex-shrink: 0;
  }

  .line-total {
    font-size: 22px;
    font-weight: 950;
    color: ${COLORS.ink};
    letter-spacing: -0.03em;
  }

  .line-total-old {
    margin-top: 4px;
    font-size: 13px;
    color: rgba(23,20,15,0.45);
    text-decoration: line-through;
  }

  .item-actions-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
  }

  .quantity-wrap {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px;
    border-radius: 18px;
    background: rgba(255,255,255,0.76);
    border: 1px solid rgba(23,20,15,0.08);
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.7);
  }

  .qty-btn {
    width: 38px;
    height: 38px;
    border-radius: 12px;
    border: 1px solid rgba(23,20,15,0.12);
    background: linear-gradient(180deg, #fff, #f8f4e6);
    color: ${COLORS.ink};
    font-size: 18px;
    font-weight: 900;
    cursor: pointer;
    transition: transform 0.18s ease, box-shadow 0.18s ease, opacity 0.18s ease;
  }

  .qty-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 10px 22px rgba(23,20,15,0.10);
  }

  .qty-btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .qty-input {
    width: 68px;
    height: 38px;
    border-radius: 12px;
    border: 1px solid rgba(23,20,15,0.12);
    text-align: center;
    font-size: 14px;
    font-weight: 900;
    color: ${COLORS.ink};
    background: #fff;
    outline: none;
  }

  .action-side {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .stock-text,
  .updating-text {
    font-size: 12px;
    font-weight: 800;
    padding: 8px 10px;
    border-radius: 999px;
    letter-spacing: 0.2px;
  }

  .stock-text.in {
    background: rgba(21,128,61,0.09);
    color: ${COLORS.success};
  }

  .stock-text.out,
  .updating-text {
    background: rgba(220,38,38,0.08);
    color: ${COLORS.danger};
  }

  .remove-btn {
    border: none;
    background: transparent;
    color: ${COLORS.danger};
    font-size: 13px;
    font-weight: 800;
    cursor: pointer;
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  .summary-card {
    position: sticky;
    top: 20px;
    overflow: visible;
  }

  .summary-card::before {
    content: "";
    position: absolute;
    inset: -1px;
    border-radius: 24px;
    background: linear-gradient(180deg, rgba(254,227,43,0.22), rgba(255,255,255,0));
    pointer-events: none;
    z-index: 0;
  }

  .summary-header-row,
  .summary-items-list,
  .totals-stack,
  .trust-box,
  .grand-total-row,
  .divider,
  .primary-btn,
  .ghost-btn {
    position: relative;
    z-index: 1;
  }

  .summary-header-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 18px;
  }

  .summary-eyebrow {
    margin: 0 0 4px;
    color: ${COLORS.muted};
    font-size: 12px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.6px;
  }

  .summary-title {
    margin: 0;
    font-size: 24px;
    font-weight: 950;
    letter-spacing: -0.03em;
  }

  .summary-badge {
    padding: 8px 12px;
    border-radius: 999px;
    background: rgba(254,227,43,0.18);
    color: ${COLORS.ink};
    font-size: 12px;
    font-weight: 800;
    border: 1px solid rgba(254,227,43,0.35);
  }

  .summary-items-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 18px;
    max-height: 280px;
    overflow: auto;
    padding-right: 2px;
  }

  .summary-items-list::-webkit-scrollbar { width: 6px; }
  .summary-items-list::-webkit-scrollbar-thumb {
    background: rgba(23,20,15,0.12);
    border-radius: 999px;
  }

  .summary-item-row {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: center;
    padding: 12px 14px;
    border-radius: 16px;
    background: rgba(255,255,255,0.72);
    border: 1px solid rgba(23,20,15,0.06);
  }

  .summary-item-name {
    font-size: 13px;
    color: ${COLORS.ink};
    font-weight: 800;
    line-height: 1.35;
  }

  .summary-item-meta {
    margin-top: 4px;
    font-size: 12px;
    color: ${COLORS.muted};
  }

  .summary-item-price {
    flex-shrink: 0;
    font-size: 13px;
    font-weight: 900;
    color: ${COLORS.ink};
  }

  .divider {
    height: 1px;
    background: ${COLORS.line};
    margin: 18px 0;
  }

  .totals-stack {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 18px;
  }

  .total-row,
  .grand-total-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }

  .total-row {
    font-size: 14px;
    color: ${COLORS.muted};
  }

  .grand-total-row {
    margin: 18px 0;
    padding: 18px;
    border-radius: 20px;
    background: linear-gradient(135deg, rgba(255,255,255,0.85), rgba(254,227,43,0.18));
    border: 1px solid rgba(23,20,15,0.07);
    color: ${COLORS.ink};
    font-size: 20px;
    font-weight: 950;
    letter-spacing: -0.02em;
  }

  .primary-btn,
  .ghost-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 50px;
    padding: 14px 18px;
    border-radius: 16px;
    font-size: 14px;
    font-weight: 900;
    letter-spacing: 0.18px;
    text-decoration: none;
    transition: transform 0.18s ease, box-shadow 0.22s ease, background 0.22s ease, border-color 0.22s ease;
  }

  .primary-btn {
    border: none;
    cursor: pointer;
    color: ${COLORS.ink};
    background: linear-gradient(135deg, ${COLORS.primary} 0%, #ffe85d 100%);
    box-shadow: 0 18px 34px rgba(254,227,43,0.26);
  }

  .ghost-btn {
    cursor: pointer;
    border: 1px solid rgba(23,20,15,0.14);
    color: ${COLORS.ink};
    background: rgba(255,255,255,0.62);
    backdrop-filter: blur(10px);
  }

  .primary-btn:hover,
  .ghost-btn:hover {
    transform: translateY(-2px);
  }

  .primary-btn:hover {
    box-shadow: 0 22px 42px rgba(254,227,43,0.30);
  }

  .ghost-btn:hover {
    box-shadow: 0 16px 34px rgba(23,20,15,0.08);
    border-color: rgba(23,20,15,0.22);
  }

  .primary-btn:disabled,
  .ghost-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  .trust-box {
    margin-top: 18px;
    padding-top: 18px;
    border-top: 1px solid ${COLORS.line};
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .trust-item {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    color: ${COLORS.muted};
    font-size: 13px;
    line-height: 1.55;
  }

  .trust-item span:first-child {
    width: 22px;
    height: 22px;
    border-radius: 999px;
    display: inline-grid;
    place-items: center;
    background: rgba(21,128,61,0.10);
    color: ${COLORS.success};
    font-weight: 900;
    flex-shrink: 0;
    margin-top: 1px;
  }

  .trust-item p { margin: 0; }

  .empty-icon-wrap {
    width: 116px;
    height: 116px;
    margin: 0 auto 20px;
    border-radius: 32px;
    display: grid;
    place-items: center;
    background: linear-gradient(135deg, rgba(254,227,43,0.22), rgba(255,255,255,0.82));
    box-shadow: 0 20px 40px rgba(254,227,43,0.18);
  }

  .floating-icon {
    font-size: 56px;
    animation: floatSmall 2.8s ease-in-out infinite;
  }

  .loading-shine {
    position: absolute;
    inset: 0;
    background: linear-gradient(110deg, transparent 20%, rgba(255,255,255,0.42) 42%, transparent 64%);
    transform: translateX(-100%);
    animation: shimmer 2.2s linear infinite;
  }

  .skeleton-stack {
    display: grid;
    gap: 14px;
  }

  .skeleton-card {
    height: 88px;
    border-radius: 20px;
    background: linear-gradient(180deg, rgba(255,255,255,0.82), rgba(248,244,230,0.78));
    border: 1px solid rgba(23,20,15,0.06);
  }

  .skeleton-card.short { width: 72%; }

  .desktop-only { display: flex; }
  .mobile-only { display: none; }

  .reveal-up {
    opacity: 0;
    transform: translateY(12px);
    animation: revealUp 0.7s cubic-bezier(.2,.8,.2,1) forwards;
  }

  .pulse-btn {
    animation: pulseGlow 2.6s ease-in-out infinite;
  }

  @keyframes revealUp {
    from { opacity: 0; transform: translateY(16px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes shimmer {
    100% { transform: translateX(100%); }
  }

  @keyframes pulseGlow {
    0%, 100% { box-shadow: 0 18px 34px rgba(254,227,43,0.24); }
    50% { box-shadow: 0 20px 48px rgba(254,227,43,0.38); }
  }

  @keyframes floatOrb {
    0%, 100% { transform: translateY(0px) translateX(0px); }
    50% { transform: translateY(-18px) translateX(10px); }
  }

  @keyframes floatSmall {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-8px); }
  }

  @media (max-width: 1080px) {
    .cart-layout {
      grid-template-columns: 1fr;
    }

    .summary-card {
      position: static;
    }
  }

  @media (max-width: 768px) {
    .hero-card {
      padding: 22px;
      border-radius: 24px;
    }

    .cart-item-grid {
      grid-template-columns: 1fr;
    }

    .product-media-wrap {
      min-height: 220px;
    }

    .product-image {
      min-height: 220px;
    }

    .desktop-only { display: none; }
    .mobile-only { display: flex; align-items: flex-start; }

    .line-total-wrap,
    .mobile-total-wrap {
      align-items: flex-start;
    }

    .item-actions-row,
    .action-side {
      justify-content: flex-start;
    }

    .hero-stats {
      justify-content: flex-start;
    }
  }

  @media (max-width: 560px) {
    .cart-shell {
      width: 100%;
    }

    .hero-card,
    .cart-item-card,
    .summary-card {
      border-radius: 22px;
    }

    .hero-title {
      font-size: 30px;
    }

    .section-title,
    .summary-title {
      font-size: 22px;
    }

    .line-total {
      font-size: 20px;
    }

    .primary-btn,
    .ghost-btn {
      width: 100%;
    }

    .quantity-wrap {
      width: 100%;
      justify-content: space-between;
    }

    .qty-input {
      flex: 1;
      width: auto;
    }
  }
`;
