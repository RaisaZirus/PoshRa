import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../../auth/useAuth.jsx";

const COLORS = {
  pageBg: "#f6f3ea",
  panel: "rgba(255,255,255,0.82)",
  card: "#fffdf7",
  soft: "#f8efb9",
  primary: "#fee32b",
  primaryDeep: "#f5d700",
  olive: "#877928",
  ink: "#201d18",
  muted: "#6f6658",
  border: "rgba(32,29,24,0.1)",
  borderStrong: "rgba(32,29,24,0.16)",
  success: "#169b56",
  successBg: "rgba(22,155,86,0.08)",
  danger: "#dc2626",
  dangerBg: "#fff1f1",
  shadow: "0 18px 45px rgba(32,29,24,0.08)",
  shadowHover: "0 22px 60px rgba(32,29,24,0.14)",
};

const formatMoney = (value) =>
  Number(value || 0).toLocaleString("en-BD");

const getShippingByCity = (city) => {
  const normalized = (city || "").toLowerCase().trim();
  return normalized === "dhaka" ? 60 : 120;
};

function Card({ children, className = "", style }) {
  return (
    <div
      className={`premium-card ${className}`}
      style={{
        background: COLORS.panel,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 24,
        boxShadow: COLORS.shadow,
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        overflow: "hidden",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function SectionTitle({ children, subtitle }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div className="section-chip">Section</div>
      <h2
        style={{
          fontSize: 18,
          fontWeight: 900,
          color: COLORS.ink,
          letterSpacing: 0.1,
          marginTop: 8,
          marginBottom: subtitle ? 4 : 0,
        }}
      >
        {children}
      </h2>
      {subtitle && (
        <p
          style={{
            fontSize: 13,
            color: COLORS.muted,
            margin: 0,
            lineHeight: 1.6,
          }}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}

function SummaryRow({ label, value, strong = false, green = false }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
        marginBottom: 10,
        fontSize: strong ? 16 : 13,
        fontWeight: strong ? 900 : 700,
        color: strong ? COLORS.ink : COLORS.muted,
      }}
    >
      <span>{label}</span>
      <span style={{ color: green ? COLORS.success : strong ? COLORS.ink : COLORS.olive }}>
        {value}
      </span>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="checkout-loading-shell">
      <div className="checkout-loader-card">
        <div className="loader-orb" />
        <div className="loader-line loader-line-lg" />
        <div className="loader-line" />
        <div className="loader-line loader-line-sm" />
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  const { accessToken } = useAuth();
  const navigate = useNavigate();

  // Cart state
  const [cart, setCart] = React.useState(null);
  const [cartLoading, setCartLoading] = React.useState(true);

  // Addresses state
  const [addresses, setAddresses] = React.useState([]);
  const [shippingFee, setShippingFee] = React.useState(0);
  const [selectedAddressId, setSelectedAddressId] = React.useState(null);
  const [addressLoading, setAddressLoading] = React.useState(true);

  // Coupon state
  const [couponCode, setCouponCode] = React.useState("");
  const [couponApplied, setCouponApplied] = React.useState(false);
  const [appliedCoupon, setAppliedCoupon] = React.useState(null);
  const [couponError, setCouponError] = React.useState("");
  const [availableCoupons, setAvailableCoupons] = React.useState([]);
  const [loadingCoupons, setLoadingCoupons] = React.useState(true);

  // Order placement
  const [placing, setPlacing] = React.useState(false);
  const [orderError, setOrderError] = React.useState("");

  // Fetch cart
  React.useEffect(() => {
    const fetchCart = async () => {
      try {
        setCartLoading(true);
        const res = await fetch("/api/cart", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const data = await res.json();
        if (data.success) setCart(data.data);
      } catch (err) {
        console.error("Failed to load cart:", err);
      } finally {
        setCartLoading(false);
      }
    };

    if (accessToken) fetchCart();
  }, [accessToken]);

  // Fetch addresses
  React.useEffect(() => {
    const fetchAddresses = async () => {
      try {
        setAddressLoading(true);
        const res = await fetch("/api/account/addresses", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const data = await res.json();

        if (data.success) {
          const list = data.data || [];
          setAddresses(list);

          const def = list.find((a) => a.is_default);
          const initial = def || list[0] || null;

          if (initial) {
            setSelectedAddressId(initial.address_id);
            setShippingFee(getShippingByCity(initial.city));
          } else {
            setSelectedAddressId(null);
            setShippingFee(0);
          }
        }
      } catch (err) {
        console.error("Failed to load addresses:", err);
      } finally {
        setAddressLoading(false);
      }
    };

    if (accessToken) fetchAddresses();
  }, [accessToken]);

  // Fetch coupons
  React.useEffect(() => {
    const fetchCoupons = async () => {
      try {
        setLoadingCoupons(true);
        const res = await fetch("/api/coupons", {
          headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        });
        const data = await res.json();
        if (data.success) {
          setAvailableCoupons(data.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch coupons:", err);
      } finally {
        setLoadingCoupons(false);
      }
    };

    fetchCoupons();
  }, [accessToken]);

  const total = React.useMemo(() => Number(cart?.total || 0), [cart]);

  const coupon = React.useMemo(() => {
    if (!couponApplied) return null;
    return (
      appliedCoupon ||
      availableCoupons.find(
        (c) => c.code?.toUpperCase() === couponCode?.trim()?.toUpperCase()
      ) ||
      null
    );
  }, [couponApplied, appliedCoupon, availableCoupons, couponCode]);

  const discountAmount = React.useMemo(() => {
    if (!coupon) return 0;

    if (coupon.discount_type === "percentage") {
      return Number(((total * Number(coupon.discount_value || 0)) / 100).toFixed(2));
    }

    return Math.min(total, Number(coupon.discount_value || 0));
  }, [coupon, total]);

  const payableTotal = React.useMemo(
    () => Math.max(0, Number((total - discountAmount).toFixed(2))),
    [total, discountAmount]
  );

  const grandTotal = React.useMemo(
    () => Number((payableTotal + shippingFee).toFixed(2)),
    [payableTotal, shippingFee]
  );

  const handleSelectAddress = (address) => {
    setSelectedAddressId(address.address_id);
    setShippingFee(getShippingByCity(address.city));
    setOrderError("");
  };

  const handleApplyCoupon = () => {
    setCouponError("");

    if (!couponCode.trim()) {
      setCouponError("Enter a coupon code first.");
      return;
    }

    const selected = availableCoupons.find(
      (c) => c.code?.toUpperCase() === couponCode.trim().toUpperCase()
    );

    if (!selected) {
      setCouponError("Invalid or expired coupon code.");
      setCouponApplied(false);
      setAppliedCoupon(null);
      return;
    }

    setCouponCode(selected.code);
    setCouponApplied(true);
    setAppliedCoupon(selected);
  };

  const handleRemoveCoupon = () => {
    setCouponCode("");
    setCouponApplied(false);
    setAppliedCoupon(null);
    setCouponError("");
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      setOrderError("Please select a delivery address.");
      return;
    }

    if (!cart?.items?.length) {
      setOrderError("Your cart is empty.");
      return;
    }

    setPlacing(true);
    setOrderError("");

    try {
      const body = { address_id: selectedAddressId };

      if (couponApplied && couponCode.trim()) {
        body.coupon_code = couponCode.trim().toUpperCase();
      }

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setOrderError(data.message || "Failed to place order.");
        return;
      }

      navigate(`/payment/${data.data.order_id}`, {
        state: { justPlaced: true, total: data.data.total_amount },
      });
    } catch (err) {
      console.error("Place order error:", err);
      setOrderError("Something went wrong. Please try again.");
    } finally {
      setPlacing(false);
    }
  };

  if (cartLoading || addressLoading) {
    return (
      <>
        <style>{styles}</style>
        <div className="checkout-page">
          <div className="bg-blob bg-blob-1" />
          <div className="bg-blob bg-blob-2" />
          <div className="bg-grid" />
          <LoadingSkeleton />
        </div>
      </>
    );
  }

  if (!cart?.items?.length) {
    return (
      <>
        <style>{styles}</style>
        <div className="checkout-page">
          <div className="bg-blob bg-blob-1" />
          <div className="bg-blob bg-blob-2" />
          <div className="bg-grid" />

          <div className="container mx-auto px-4 py-10">
            <Card
              className="fade-up"
              style={{
                padding: 40,
                textAlign: "center",
                maxWidth: 520,
                margin: "7vh auto 0",
              }}
            >
              <div className="empty-icon-wrap">
                <div className="empty-icon">🛒</div>
              </div>

              <h2
                style={{
                  fontSize: 28,
                  fontWeight: 900,
                  color: COLORS.ink,
                  marginBottom: 10,
                }}
              >
                Your cart is empty
              </h2>

              <p
                style={{
                  fontSize: 14,
                  color: COLORS.muted,
                  marginBottom: 26,
                  lineHeight: 1.7,
                  maxWidth: 360,
                  marginInline: "auto",
                }}
              >
                Add some items before checking out to unlock a smoother, faster purchase experience.
              </p>

              <Link to="/" className="cta-button" style={{ display: "inline-flex", textDecoration: "none" }}>
                Continue Shopping
              </Link>
            </Card>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{styles}</style>

      <div className="checkout-page">
        <div className="bg-blob bg-blob-1" />
        <div className="bg-blob bg-blob-2" />
        <div className="bg-grid" />

        <div className="container mx-auto px-4 py-6 md:py-10">
          {/* Hero */}
          <div className="hero-panel fade-up">
            <div>
              <div className="hero-badge">Secure checkout</div>
              <h1 className="hero-title">Checkout</h1>
              <p className="hero-subtitle">
                Complete your order with a refined, distraction-free experience.
              </p>
            </div>

            <div className="hero-meta">
              <div className="hero-stat">
                <span className="hero-stat-value">{cart.itemCount}</span>
                <span className="hero-stat-label">
                  item{cart.itemCount !== 1 ? "s" : ""}
                </span>
              </div>

              <div className="hero-meta-divider" />

              <div className="hero-links">
                <span className="hero-total-preview">৳{formatMoney(grandTotal)}</span>
                <Link to="/cart" className="hero-edit-link">
                  Edit cart
                </Link>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
            {/* Left */}
            <div className="lg:col-span-2 space-y-6">
              {/* Delivery Address */}
              <Card className="fade-up card-delay-1" style={{ padding: 24 }}>
                <SectionTitle
                  subtitle="Choose the best delivery location for this order."
                >
                  Delivery address
                </SectionTitle>

                {addresses.length === 0 ? (
                  <div className="state-block">
                    <div className="state-icon">📍</div>
                    <p className="state-text">You have no saved addresses yet.</p>
                    <Link to="/account/addresses" className="cta-button" style={{ textDecoration: "none" }}>
                      Add an address
                    </Link>
                  </div>
                ) : (
                  <div className="address-list">
                    {addresses.map((a, index) => {
                      const selected = selectedAddressId === a.address_id;

                      return (
                        <button
                          type="button"
                          key={a.address_id}
                          onClick={() => handleSelectAddress(a)}
                          className={`address-option ${selected ? "address-option--selected" : ""}`}
                          style={{ animationDelay: `${index * 90}ms` }}
                        >
                          <div className="address-radio">
                            <div className="address-radio-dot" />
                          </div>

                          <div className="address-content">
                            <div className="address-heading-row">
                              <p className="address-title">
                                {a.city}
                                {a.area ? `, ${a.area}` : ""}
                              </p>

                              <div className="address-tags">
                                {a.is_default && (
                                  <span className="mini-tag mini-tag--default">Default</span>
                                )}
                                {selected && (
                                  <span className="mini-tag mini-tag--selected">Selected</span>
                                )}
                              </div>
                            </div>

                            {a.details && (
                              <p className="address-details">{a.details}</p>
                            )}

                            <div className="address-footer">
                              <span>
                                Shipping: ৳{formatMoney(getShippingByCity(a.city))}
                              </span>
                            </div>
                          </div>
                        </button>
                      );
                    })}

                    <Link to="/account/addresses" className="inline-link">
                      + Add a new address
                    </Link>
                  </div>
                )}
              </Card>

              {/* Order Items */}
              <Card className="fade-up card-delay-2" style={{ padding: 24 }}>
                <SectionTitle subtitle="Review every item before placing the order.">
                  Items in this order
                </SectionTitle>

                <div className="items-list">
                  {cart.items.map((item, index) => {
                    const unitPrice = Number(item.discount_price || item.price || 0);
                    const regularPrice = Number(item.price || 0);
                    const rowTotal = unitPrice * Number(item.quantity || 0);
                    const rowOriginal = regularPrice * Number(item.quantity || 0);

                    return (
                      <div
                        key={item.cart_item_id}
                        className="order-item fade-up"
                        style={{ animationDelay: `${120 + index * 70}ms` }}
                      >
                        <div className="product-thumb-wrap">
                          <img
                            src={item.image_url || "https://via.placeholder.com/90?text=?"}
                            alt={item.product_name}
                            className="product-thumb"
                          />
                        </div>

                        <div className="product-info">
                          <p className="product-name">{item.product_name}</p>
                          <p className="product-meta">
                            {item.store_name} · Qty {item.quantity}
                          </p>
                        </div>

                        <div className="product-price-wrap">
                          <p className="product-price">৳{formatMoney(rowTotal)}</p>
                          {item.discount_price && (
                            <p className="product-price-old">
                              ৳{formatMoney(rowOriginal)}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* Coupon */}
              <Card className="fade-up card-delay-3" style={{ padding: 24 }}>
                <SectionTitle subtitle="Apply a coupon for instant savings.">
                  Coupon code
                </SectionTitle>

                {!couponApplied && (
                  <div style={{ marginBottom: 14 }}>
                    <label className="field-label">Choose from active coupons</label>

                    {loadingCoupons ? (
                      <p className="field-hint" style={{ marginTop: 0 }}>
                        Loading coupons…
                      </p>
                    ) : availableCoupons.length > 0 ? (
                      <select
                        value={couponCode}
                        onChange={(e) => {
                          setCouponCode(e.target.value);
                          setCouponError("");
                        }}
                        className="premium-field"
                      >
                        <option value="">Select a coupon</option>
                        {availableCoupons.map((c) => (
                          <option key={c.coupon_id} value={c.code}>
                            {c.code} •{" "}
                            {c.discount_type === "percentage"
                              ? `${c.discount_value}% off`
                              : `৳${c.discount_value} off`}
                            {c.expiry_date
                              ? ` (valid until ${new Date(c.expiry_date).toLocaleDateString("en-BD")})`
                              : ""}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p className="field-hint" style={{ marginTop: 0 }}>
                        No active coupons currently.
                      </p>
                    )}
                  </div>
                )}

                {!couponApplied ? (
                  <div className="coupon-row">
                    <input
                      type="text"
                      placeholder="Enter coupon code"
                      value={couponCode}
                      onChange={(e) => {
                        setCouponCode(e.target.value.toUpperCase());
                        setCouponError("");
                      }}
                      className={`premium-field premium-field-input ${
                        couponError ? "premium-field-error" : ""
                      }`}
                    />

                    <button type="button" onClick={handleApplyCoupon} className="dark-button">
                      Apply
                    </button>
                  </div>
                ) : (
                  <div className="coupon-success-box">
                    <div className="coupon-check">✓</div>
                    <div style={{ flex: 1 }}>
                      <p className="coupon-success-code">{couponCode}</p>
                      <p className="coupon-success-text">
                        Discount of ৳{formatMoney(discountAmount)} applied successfully.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="danger-link-btn"
                    >
                      Remove
                    </button>
                  </div>
                )}

                {couponError && <p className="error-text">{couponError}</p>}

                {!couponApplied && (
                  <p className="field-hint">
                    Enter a valid coupon code to get a discount.
                  </p>
                )}
              </Card>
            </div>

            {/* Right */}
            <div>
              <Card className="summary-sticky fade-up card-delay-2" style={{ padding: 24 }}>
                <SectionTitle subtitle="A clear breakdown before you continue.">
                  Order summary
                </SectionTitle>

                <div className="summary-banner">
                  <div className="summary-banner-glow" />
                  <div>
                    <p className="summary-banner-title">Estimated total</p>
                    <h3 className="summary-banner-price">৳{formatMoney(grandTotal)}</h3>
                  </div>
                  <div className="summary-banner-badge">Fast checkout</div>
                </div>

                <div className="summary-block">
                  <SummaryRow
                    label={`Subtotal (${cart.itemCount} item${cart.itemCount !== 1 ? "s" : ""})`}
                    value={`৳${formatMoney(total)}`}
                  />
                  <SummaryRow
                    label="Shipping"
                    value={`৳${formatMoney(shippingFee)}`}
                    green
                  />
                  {couponApplied && coupon && (
                    <SummaryRow
                      label={`Coupon (${coupon.code})`}
                      value={`-৳${formatMoney(discountAmount)}`}
                      green
                    />
                  )}
                </div>

                <div className="summary-total-box">
                  <SummaryRow label="Total" value={`৳${formatMoney(grandTotal)}`} strong />
                </div>

                {orderError && (
                  <div className="error-box">
                    <p className="error-box-text">{orderError}</p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handlePlaceOrder}
                  disabled={placing || !selectedAddressId || !cart?.items?.length}
                  className="cta-button full-width-button"
                >
                  {placing ? "Placing order..." : "Place order"}
                </button>

                <Link to="/cart" className="ghost-button">
                  Back to cart
                </Link>

                <div className="trust-list">
                  <div className="trust-item">
                    <span className="trust-icon">✓</span>
                    <span>Secure checkout</span>
                  </div>
                  <div className="trust-item">
                    <span className="trust-icon">✓</span>
                    <span>Easy 30-day returns</span>
                  </div>
                  <div className="trust-item">
                    <span className="trust-icon">✓</span>
                    <span>Free delivery above ৳499</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

const styles = `
  .checkout-page {
    position: relative;
    min-height: 100vh;
    overflow: hidden;
    background:
      radial-gradient(circle at top left, rgba(254,227,43,0.20), transparent 35%),
      radial-gradient(circle at 85% 10%, rgba(135,121,40,0.12), transparent 26%),
      linear-gradient(180deg, #fbf8f1 0%, #f6f3ea 55%, #f3efe6 100%);
    color: ${COLORS.ink};
    font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    padding-bottom: 56px;
  }

  .bg-grid {
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(32,29,24,0.025) 1px, transparent 1px),
      linear-gradient(90deg, rgba(32,29,24,0.025) 1px, transparent 1px);
    background-size: 42px 42px;
    mask-image: linear-gradient(to bottom, rgba(0,0,0,0.35), transparent 75%);
    pointer-events: none;
  }

  .bg-blob {
    position: absolute;
    border-radius: 999px;
    filter: blur(12px);
    opacity: 0.55;
    pointer-events: none;
    animation: floatBlob 12s ease-in-out infinite;
  }

  .bg-blob-1 {
    width: 360px;
    height: 360px;
    background: rgba(254,227,43,0.22);
    top: -70px;
    left: -70px;
  }

  .bg-blob-2 {
    width: 300px;
    height: 300px;
    background: rgba(135,121,40,0.12);
    right: -70px;
    top: 120px;
    animation-delay: 1.8s;
  }

  .hero-panel {
    position: relative;
    z-index: 1;
    border: 1px solid ${COLORS.border};
    border-radius: 28px;
    padding: 28px;
    background:
      linear-gradient(135deg, rgba(255,255,255,0.92), rgba(255,250,231,0.78));
    box-shadow: 0 18px 45px rgba(32,29,24,0.08);
    backdrop-filter: blur(18px);
    display: flex;
    gap: 24px;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
  }

  .hero-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 14px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 900;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: ${COLORS.olive};
    background: rgba(254,227,43,0.22);
    border: 1px solid rgba(135,121,40,0.12);
  }

  .hero-title {
    font-size: clamp(32px, 4vw, 48px);
    font-weight: 950;
    line-height: 1.02;
    letter-spacing: -0.03em;
    margin: 14px 0 10px;
    color: ${COLORS.ink};
  }

  .hero-subtitle {
    margin: 0;
    font-size: 14px;
    color: ${COLORS.muted};
    line-height: 1.75;
    max-width: 560px;
  }

  .hero-meta {
    display: flex;
    align-items: center;
    gap: 18px;
    min-width: 260px;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .hero-stat {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    background: rgba(255,255,255,0.72);
    border: 1px solid ${COLORS.border};
    padding: 14px 18px;
    border-radius: 18px;
    min-width: 110px;
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.45);
  }

  .hero-stat-value {
    font-size: 26px;
    line-height: 1;
    font-weight: 950;
    color: ${COLORS.ink};
  }

  .hero-stat-label {
    font-size: 12px;
    color: ${COLORS.muted};
    margin-top: 6px;
    font-weight: 700;
  }

  .hero-meta-divider {
    width: 1px;
    height: 52px;
    background: ${COLORS.border};
  }

  .hero-links {
    display: flex;
    flex-direction: column;
    gap: 6px;
    align-items: flex-start;
  }

  .hero-total-preview {
    font-size: 22px;
    font-weight: 950;
    color: ${COLORS.ink};
  }

  .hero-edit-link {
    font-size: 13px;
    font-weight: 800;
    color: ${COLORS.olive};
    text-decoration: none;
    position: relative;
  }

  .hero-edit-link::after {
    content: "";
    position: absolute;
    left: 0;
    bottom: -3px;
    width: 100%;
    height: 2px;
    background: ${COLORS.primary};
    transform: scaleX(0.45);
    transform-origin: left;
    transition: transform 0.25s ease;
  }

  .hero-edit-link:hover::after {
    transform: scaleX(1);
  }

  .premium-card {
    position: relative;
    z-index: 1;
    transition:
      transform 0.35s ease,
      box-shadow 0.35s ease,
      border-color 0.35s ease;
  }

  .premium-card:hover {
    transform: translateY(-4px);
    box-shadow: ${COLORS.shadowHover};
    border-color: ${COLORS.borderStrong};
  }

  .section-chip {
    display: inline-flex;
    padding: 7px 12px;
    font-size: 10px;
    font-weight: 900;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: ${COLORS.olive};
    border: 1px solid rgba(135,121,40,0.14);
    border-radius: 999px;
    background: rgba(254,227,43,0.16);
  }

  .address-list,
  .items-list {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .address-option {
    position: relative;
    width: 100%;
    text-align: left;
    display: flex;
    align-items: flex-start;
    gap: 14px;
    border: 1.5px solid ${COLORS.border};
    border-radius: 20px;
    padding: 16px;
    background:
      linear-gradient(180deg, rgba(255,255,255,0.86), rgba(255,253,247,0.92));
    cursor: pointer;
    transition:
      transform 0.28s ease,
      border-color 0.28s ease,
      background 0.28s ease,
      box-shadow 0.28s ease;
    animation: riseIn 0.65s ease both;
  }

  .address-option:hover {
    transform: translateY(-2px);
    border-color: rgba(135,121,40,0.28);
    box-shadow: 0 16px 34px rgba(32,29,24,0.08);
  }

  .address-option--selected {
    border-color: rgba(254,227,43,0.95);
    background:
      linear-gradient(135deg, rgba(254,227,43,0.16), rgba(255,255,255,0.92));
    box-shadow:
      0 0 0 5px rgba(254,227,43,0.14),
      0 18px 42px rgba(32,29,24,0.08);
  }

  .address-radio {
    position: relative;
    width: 22px;
    height: 22px;
    border-radius: 999px;
    border: 2px solid ${COLORS.olive};
    flex-shrink: 0;
    margin-top: 3px;
    display: grid;
    place-items: center;
    transition: all 0.28s ease;
    background: rgba(255,255,255,0.72);
  }

  .address-option--selected .address-radio {
    border-color: ${COLORS.primaryDeep};
    background: rgba(254,227,43,0.22);
    box-shadow: 0 0 0 8px rgba(254,227,43,0.13);
  }

  .address-radio-dot {
    width: 10px;
    height: 10px;
    border-radius: 999px;
    background: ${COLORS.primaryDeep};
    transform: scale(0);
    transition: transform 0.25s ease;
  }

  .address-option--selected .address-radio-dot {
    transform: scale(1);
  }

  .address-content {
    min-width: 0;
    flex: 1;
  }

  .address-heading-row {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .address-title {
    margin: 0;
    font-size: 15px;
    font-weight: 900;
    color: ${COLORS.ink};
  }

  .address-details {
    margin: 8px 0 10px;
    font-size: 12px;
    color: ${COLORS.muted};
    line-height: 1.65;
  }

  .address-footer {
    font-size: 11px;
    color: ${COLORS.olive};
    font-weight: 800;
    letter-spacing: 0.02em;
  }

  .address-tags {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .mini-tag {
    display: inline-flex;
    padding: 5px 10px;
    border-radius: 999px;
    font-size: 10px;
    font-weight: 900;
    letter-spacing: 0.07em;
    text-transform: uppercase;
  }

  .mini-tag--default {
    background: rgba(254,227,43,0.22);
    color: ${COLORS.ink};
  }

  .mini-tag--selected {
    background: rgba(22,155,86,0.12);
    color: ${COLORS.success};
  }

  .inline-link {
    display: inline-flex;
    margin-top: 6px;
    width: fit-content;
    font-size: 13px;
    font-weight: 800;
    color: ${COLORS.olive};
    text-decoration: none;
    position: relative;
  }

  .inline-link::after {
    content: "";
    position: absolute;
    left: 0;
    bottom: -3px;
    width: 100%;
    height: 2px;
    background: ${COLORS.primary};
    transform: scaleX(0.4);
    transform-origin: left;
    transition: transform 0.25s ease;
  }

  .inline-link:hover::after {
    transform: scaleX(1);
  }

  .order-item {
    display: flex;
    gap: 14px;
    align-items: center;
    padding: 14px 0;
    border-bottom: 1px solid rgba(32,29,24,0.07);
  }

  .order-item:last-child {
    border-bottom: none;
    padding-bottom: 2px;
  }

  .product-thumb-wrap {
    position: relative;
    width: 74px;
    height: 74px;
    flex-shrink: 0;
    border-radius: 18px;
    overflow: hidden;
    border: 1px solid rgba(32,29,24,0.08);
    box-shadow: 0 10px 18px rgba(32,29,24,0.06);
    background: #fff;
  }

  .product-thumb-wrap::after {
    content: "";
    position: absolute;
    inset: 0;
    background:
      linear-gradient(135deg, rgba(255,255,255,0.16), transparent 45%);
    pointer-events: none;
  }

  .product-thumb {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.45s ease;
  }

  .order-item:hover .product-thumb {
    transform: scale(1.06);
  }

  .product-info {
    flex: 1;
    min-width: 0;
  }

  .product-name {
    margin: 0 0 4px;
    font-size: 14px;
    font-weight: 900;
    color: ${COLORS.ink};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .product-meta {
    margin: 0;
    font-size: 12px;
    color: ${COLORS.muted};
    line-height: 1.6;
  }

  .product-price-wrap {
    text-align: right;
    flex-shrink: 0;
  }

  .product-price {
    margin: 0;
    font-size: 15px;
    font-weight: 950;
    color: ${COLORS.ink};
  }

  .product-price-old {
    margin: 6px 0 0;
    font-size: 11px;
    color: rgba(32,29,24,0.42);
    text-decoration: line-through;
  }

  .field-label {
    display: block;
    margin-bottom: 8px;
    font-size: 12px;
    font-weight: 900;
    color: ${COLORS.olive};
    letter-spacing: 0.02em;
  }

  .premium-field {
    width: 100%;
    padding: 13px 14px;
    border-radius: 16px;
    border: 1.5px solid rgba(32,29,24,0.14);
    background: rgba(255,255,255,0.76);
    color: ${COLORS.ink};
    font-size: 13px;
    font-weight: 700;
    outline: none;
    transition:
      border-color 0.25s ease,
      box-shadow 0.25s ease,
      transform 0.25s ease;
  }

  .premium-field:focus {
    border-color: rgba(254,227,43,0.95);
    box-shadow: 0 0 0 5px rgba(254,227,43,0.16);
    transform: translateY(-1px);
  }

  .premium-field-input {
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .premium-field-error {
    border-color: ${COLORS.danger};
    box-shadow: 0 0 0 4px rgba(220,38,38,0.08);
  }

  .coupon-row {
    display: flex;
    gap: 10px;
    align-items: stretch;
  }

  .coupon-success-box {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 14px 15px;
    border-radius: 18px;
    border: 1.5px solid rgba(22,155,86,0.28);
    background: ${COLORS.successBg};
  }

  .coupon-check {
    width: 30px;
    height: 30px;
    border-radius: 999px;
    display: grid;
    place-items: center;
    background: rgba(22,155,86,0.14);
    color: ${COLORS.success};
    font-weight: 900;
    flex-shrink: 0;
  }

  .coupon-success-code {
    margin: 0;
    font-size: 13px;
    font-weight: 950;
    color: ${COLORS.success};
    letter-spacing: 0.08em;
  }

  .coupon-success-text {
    margin: 4px 0 0;
    font-size: 12px;
    color: ${COLORS.success};
    line-height: 1.6;
  }

  .dark-button,
  .cta-button,
  .ghost-button {
    border: none;
    cursor: pointer;
    transition:
      transform 0.25s ease,
      box-shadow 0.25s ease,
      opacity 0.25s ease,
      background 0.25s ease,
      color 0.25s ease;
  }

  .dark-button {
    min-width: 118px;
    padding: 0 20px;
    border-radius: 16px;
    background: ${COLORS.ink};
    color: ${COLORS.primary};
    font-size: 13px;
    font-weight: 900;
    letter-spacing: 0.03em;
  }

  .dark-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 14px 26px rgba(32,29,24,0.18);
  }

  .danger-link-btn {
    border: none;
    background: none;
    color: ${COLORS.danger};
    font-size: 12px;
    font-weight: 900;
    cursor: pointer;
    padding: 0;
    white-space: nowrap;
  }

  .field-hint {
    margin: 10px 0 0;
    font-size: 12px;
    color: ${COLORS.muted};
    line-height: 1.6;
  }

  .error-text {
    margin: 10px 0 0;
    font-size: 12px;
    font-weight: 800;
    color: ${COLORS.danger};
  }

  .summary-sticky {
    position: sticky;
    top: 20px;
  }

  .summary-banner {
    position: relative;
    overflow: hidden;
    display: flex;
    justify-content: space-between;
    gap: 16px;
    align-items: center;
    padding: 18px;
    border-radius: 22px;
    background:
      linear-gradient(135deg, rgba(254,227,43,0.96), rgba(255,247,180,0.9));
    margin-bottom: 18px;
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.35);
  }

  .summary-banner-glow {
    position: absolute;
    width: 170px;
    height: 170px;
    border-radius: 999px;
    background: rgba(255,255,255,0.24);
    right: -50px;
    top: -70px;
    filter: blur(10px);
  }

  .summary-banner-title {
    position: relative;
    margin: 0 0 5px;
    font-size: 12px;
    font-weight: 900;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: rgba(32,29,24,0.72);
  }

  .summary-banner-price {
    position: relative;
    margin: 0;
    font-size: 28px;
    line-height: 1;
    font-weight: 950;
    color: ${COLORS.ink};
  }

  .summary-banner-badge {
    position: relative;
    flex-shrink: 0;
    padding: 9px 12px;
    border-radius: 999px;
    background: rgba(255,255,255,0.45);
    font-size: 11px;
    font-weight: 900;
    color: ${COLORS.ink};
    letter-spacing: 0.04em;
  }

  .summary-block {
    border-bottom: 1px solid rgba(32,29,24,0.08);
    padding-bottom: 10px;
    margin-bottom: 14px;
  }

  .summary-total-box {
    margin-bottom: 16px;
  }

  .error-box {
    background: ${COLORS.dangerBg};
    border: 1.5px solid rgba(220,38,38,0.22);
    border-radius: 16px;
    padding: 12px 14px;
    margin-bottom: 14px;
  }

  .error-box-text {
    margin: 0;
    font-size: 13px;
    font-weight: 800;
    color: ${COLORS.danger};
    line-height: 1.55;
  }

  .cta-button {
    position: relative;
    overflow: hidden;
    display: inline-flex;
    justify-content: center;
    align-items: center;
    gap: 10px;
    padding: 15px 22px;
    border-radius: 18px;
    background: linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDeep});
    color: ${COLORS.ink};
    font-size: 14px;
    font-weight: 950;
    letter-spacing: 0.02em;
    box-shadow: 0 16px 28px rgba(254,227,43,0.2);
  }

  .cta-button::after {
    content: "";
    position: absolute;
    inset: 0;
    transform: translateX(-120%);
    background: linear-gradient(
      110deg,
      transparent 20%,
      rgba(255,255,255,0.35) 50%,
      transparent 80%
    );
    animation: shineSweep 3.2s ease-in-out infinite;
  }

  .cta-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 18px 34px rgba(254,227,43,0.32);
  }

  .cta-button:disabled,
  .full-width-button:disabled {
    opacity: 0.62;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  .full-width-button {
    width: 100%;
    margin-bottom: 10px;
  }

  .ghost-button {
    display: block;
    width: 100%;
    text-align: center;
    text-decoration: none;
    padding: 14px 16px;
    border-radius: 18px;
    border: 1.5px solid rgba(135,121,40,0.34);
    color: ${COLORS.olive};
    background: rgba(255,255,255,0.52);
    font-size: 13px;
    font-weight: 900;
    letter-spacing: 0.02em;
  }

  .ghost-button:hover {
    transform: translateY(-1px);
    background: rgba(255,255,255,0.82);
  }

  .trust-list {
    margin-top: 18px;
    padding-top: 18px;
    border-top: 1px solid rgba(32,29,24,0.08);
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .trust-item {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 12px;
    font-weight: 700;
    color: ${COLORS.muted};
  }

  .trust-icon {
    width: 22px;
    height: 22px;
    border-radius: 999px;
    display: grid;
    place-items: center;
    font-size: 12px;
    background: rgba(22,155,86,0.08);
    color: ${COLORS.success};
    flex-shrink: 0;
  }

  .state-block {
    text-align: center;
    padding: 18px 0 4px;
  }

  .state-icon {
    width: 72px;
    height: 72px;
    display: grid;
    place-items: center;
    margin: 0 auto 14px;
    border-radius: 999px;
    background: linear-gradient(135deg, rgba(254,227,43,0.18), rgba(255,255,255,0.85));
    font-size: 28px;
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.35);
  }

  .state-text {
    margin: 0 0 16px;
    font-size: 14px;
    color: ${COLORS.muted};
  }

  .empty-icon-wrap {
    width: 92px;
    height: 92px;
    border-radius: 999px;
    margin: 0 auto 18px;
    display: grid;
    place-items: center;
    background: linear-gradient(135deg, rgba(254,227,43,0.25), rgba(255,255,255,0.9));
    box-shadow: 0 16px 28px rgba(32,29,24,0.08);
  }

  .empty-icon {
    font-size: 42px;
    animation: floatBlob 5.5s ease-in-out infinite;
  }

  .checkout-loading-shell {
    min-height: 100vh;
    display: grid;
    place-items: center;
    padding: 24px;
    position: relative;
    z-index: 1;
  }

  .checkout-loader-card {
    width: min(92vw, 520px);
    border-radius: 28px;
    padding: 34px 28px;
    background: rgba(255,255,255,0.78);
    border: 1px solid ${COLORS.border};
    box-shadow: ${COLORS.shadow};
    backdrop-filter: blur(18px);
  }

  .loader-orb {
    width: 70px;
    height: 70px;
    border-radius: 999px;
    background: linear-gradient(135deg, rgba(254,227,43,0.95), rgba(255,247,180,0.82));
    margin: 0 auto 22px;
    position: relative;
    animation: pulseGlow 1.8s ease-in-out infinite;
  }

  .loader-line {
    height: 14px;
    width: 100%;
    border-radius: 999px;
    background:
      linear-gradient(
        90deg,
        rgba(32,29,24,0.07) 0%,
        rgba(255,255,255,0.8) 45%,
        rgba(32,29,24,0.07) 100%
      );
    background-size: 220% 100%;
    animation: shimmer 1.4s linear infinite;
    margin-bottom: 14px;
  }

  .loader-line-lg {
    width: 76%;
    margin-inline: auto;
  }

  .loader-line-sm {
    width: 54%;
    margin-inline: auto;
    margin-bottom: 0;
  }

  .fade-up {
    animation: fadeUp 0.7s ease both;
  }

  .card-delay-1 {
    animation-delay: 100ms;
  }

  .card-delay-2 {
    animation-delay: 180ms;
  }

  .card-delay-3 {
    animation-delay: 260ms;
  }

  @keyframes floatBlob {
    0%, 100% { transform: translateY(0) translateX(0) scale(1); }
    50% { transform: translateY(16px) translateX(8px) scale(1.04); }
  }

  @keyframes pulseGlow {
    0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(254,227,43,0.25); }
    50% { transform: scale(1.06); box-shadow: 0 0 0 16px rgba(254,227,43,0); }
  }

  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -20% 0; }
  }

  @keyframes riseIn {
    from {
      opacity: 0;
      transform: translateY(16px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes fadeUp {
    from {
      opacity: 0;
      transform: translateY(18px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes shineSweep {
    0% { transform: translateX(-120%); }
    35%, 100% { transform: translateX(120%); }
  }

  @media (max-width: 1024px) {
    .summary-sticky {
      position: relative;
      top: 0;
    }
  }

  @media (max-width: 768px) {
    .hero-panel {
      padding: 22px;
      border-radius: 24px;
    }

    .hero-meta {
      width: 100%;
      justify-content: flex-start;
    }

    .hero-meta-divider {
      display: none;
    }

    .coupon-row {
      flex-direction: column;
    }

    .dark-button {
      min-height: 50px;
    }

    .summary-banner {
      flex-direction: column;
      align-items: flex-start;
    }

    .order-item {
      align-items: flex-start;
    }

    .product-price-wrap {
      min-width: 82px;
    }
  }

  @media (max-width: 520px) {
    .hero-title {
      font-size: 30px;
    }

    .address-option,
    .premium-card {
      border-radius: 20px !important;
    }

    .product-thumb-wrap {
      width: 64px;
      height: 64px;
      border-radius: 16px;
    }

    .product-name {
      font-size: 13px;
      white-space: normal;
    }

    .summary-banner-price {
      font-size: 24px;
    }
  }
`;