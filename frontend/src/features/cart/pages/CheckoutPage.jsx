import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../../auth/useAuth.jsx";

const COLORS = {
  bg: "#FDFDF9",
  soft: "#FBEF9C",
  primary: "#FEE32B",
  olive: "#877928",
  ink: "#201D18",
};

function Card({ children, style }) {
  return (
    <div
      style={{
        background: COLORS.bg,
        border: `1px solid rgba(32,29,24,0.12)`,
        borderRadius: 16,
        boxShadow: "0 10px 26px rgba(32,29,24,0.08)",
        overflow: "hidden",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <h2
      style={{
        fontSize: 13,
        fontWeight: 900,
        color: COLORS.ink,
        letterSpacing: 0.5,
        marginBottom: 16,
        textTransform: "uppercase",
      }}
    >
      {children}
    </h2>
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
  const [selectedAddressId, setSelectedAddressId] = React.useState(null);
  const [addressLoading, setAddressLoading] = React.useState(true);

  // Coupon state
  const [couponCode, setCouponCode] = React.useState("");
  const [couponApplied, setCouponApplied] = React.useState(false);
  const [couponError, setCouponError] = React.useState("");

  // Order placement
  const [placing, setPlacing] = React.useState(false);
  const [orderError, setOrderError] = React.useState("");

  // ── Fetch cart ──────────────────────────────────────────────────────────
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

  // ── Fetch addresses ─────────────────────────────────────────────────────
  React.useEffect(() => {
    const fetchAddresses = async () => {
      try {
        setAddressLoading(true);
        const res = await fetch("/api/account/addresses", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const data = await res.json();
        if (data.success) {
          setAddresses(data.data || []);
          // auto-select default address
          const def = data.data?.find((a) => a.is_default);
          if (def) setSelectedAddressId(def.address_id);
          else if (data.data?.length > 0) setSelectedAddressId(data.data[0].address_id);
        }
      } catch (err) {
        console.error("Failed to load addresses:", err);
      } finally {
        setAddressLoading(false);
      }
    };
    if (accessToken) fetchAddresses();
  }, [accessToken]);

  // ── Place order ─────────────────────────────────────────────────────────
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

      // Success — go to payment page
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

  // ── Apply coupon (client-side validation only — real check on submit) ───
  const handleApplyCoupon = () => {
    setCouponError("");
    if (!couponCode.trim()) {
      setCouponError("Enter a coupon code first.");
      return;
    }
    setCouponApplied(true);
  };

  const handleRemoveCoupon = () => {
    setCouponCode("");
    setCouponApplied(false);
    setCouponError("");
  };

  // ── Loading state ───────────────────────────────────────────────────────
  if (cartLoading || addressLoading) {
    return (
      <div style={{ background: COLORS.soft, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
          <p style={{ fontSize: 18, fontWeight: 700, color: COLORS.olive }}>Loading checkout...</p>
        </div>
      </div>
    );
  }

  // ── Empty cart guard ────────────────────────────────────────────────────
  if (!cart?.items?.length) {
    return (
      <div style={{ background: COLORS.soft, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Card style={{ padding: 40, textAlign: "center", maxWidth: 400 }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🛒</div>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: COLORS.ink, marginBottom: 12 }}>Your cart is empty</h2>
          <p style={{ fontSize: 14, color: COLORS.olive, marginBottom: 24 }}>
            Add some items before checking out.
          </p>
          <Link
            to="/"
            style={{ display: "inline-block", padding: "12px 24px", background: COLORS.primary, color: COLORS.ink, fontWeight: 900, borderRadius: 12, textDecoration: "none", fontSize: 14 }}
          >
            Continue Shopping
          </Link>
        </Card>
      </div>
    );
  }

  const total = cart.total;

  return (
    <div
      style={{
        background: COLORS.soft,
        color: COLORS.ink,
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
        minHeight: "100vh",
        paddingBottom: 60,
      }}
    >
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 32, fontWeight: 900, letterSpacing: 0.2 }}>Checkout</h1>
          <p style={{ fontSize: 13, color: COLORS.olive, marginTop: 4 }}>
            {cart.itemCount} item{cart.itemCount !== 1 ? "s" : ""} ·{" "}
            <Link to="/cart" style={{ color: COLORS.olive, fontWeight: 700 }}>
              Edit cart
            </Link>
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ── Left column ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Delivery address */}
            <Card style={{ padding: 20 }}>
              <SectionTitle>Delivery address</SectionTitle>

              {addresses.length === 0 ? (
                <div style={{ textAlign: "center", padding: "20px 0" }}>
                  <p style={{ fontSize: 14, color: COLORS.olive, marginBottom: 16 }}>
                    You have no saved addresses.
                  </p>
                  <Link
                    to="/account/addresses"
                    style={{ padding: "10px 20px", background: COLORS.primary, color: COLORS.ink, fontWeight: 900, borderRadius: 10, textDecoration: "none", fontSize: 13 }}
                  >
                    Add an address
                  </Link>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {addresses.map((a) => {
                    const selected = selectedAddressId === a.address_id;
                    return (
                      <div
                        key={a.address_id}
                        onClick={() => setSelectedAddressId(a.address_id)}
                        style={{
                          border: `2px solid ${selected ? COLORS.primary : "rgba(32,29,24,0.12)"}`,
                          borderRadius: 12,
                          padding: "14px 16px",
                          cursor: "pointer",
                          background: selected ? "rgba(254,227,43,0.08)" : COLORS.bg,
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 12,
                          transition: "border-color 0.15s",
                        }}
                      >
                        {/* Radio indicator */}
                        <div
                          style={{
                            width: 18,
                            height: 18,
                            borderRadius: "50%",
                            border: `2px solid ${selected ? COLORS.primary : COLORS.olive}`,
                            background: selected ? COLORS.primary : "transparent",
                            flexShrink: 0,
                            marginTop: 2,
                          }}
                        />
                        <div>
                          <p style={{ fontWeight: 800, fontSize: 14, color: COLORS.ink, marginBottom: 2 }}>
                            {a.city}{a.area ? `, ${a.area}` : ""}
                            {a.is_default && (
                              <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 900, background: COLORS.primary, color: COLORS.ink, padding: "2px 7px", borderRadius: 6 }}>
                                DEFAULT
                              </span>
                            )}
                          </p>
                          {a.details && (
                            <p style={{ fontSize: 12, color: COLORS.olive, lineHeight: 1.5 }}>{a.details}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  <Link
                    to="/account/addresses"
                    style={{ fontSize: 13, color: COLORS.olive, fontWeight: 700, textDecoration: "underline", marginTop: 4 }}
                  >
                    + Add a new address
                  </Link>
                </div>
              )}
            </Card>

            {/* Order items */}
            <Card style={{ padding: 20 }}>
              <SectionTitle>Items in this order</SectionTitle>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {cart.items.map((item) => {
                  const price = item.discount_price || item.price;
                  return (
                    <div
                      key={item.cart_item_id}
                      style={{ display: "flex", gap: 12, alignItems: "center", borderBottom: `1px solid rgba(32,29,24,0.08)`, paddingBottom: 14 }}
                    >
                      <img
                        src={item.image_url || "https://via.placeholder.com/64?text=?"}
                        alt={item.product_name}
                        style={{ width: 56, height: 56, borderRadius: 8, objectFit: "cover", flexShrink: 0, border: `1px solid rgba(32,29,24,0.1)` }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 800, fontSize: 13, color: COLORS.ink, marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {item.product_name}
                        </p>
                        <p style={{ fontSize: 11, color: COLORS.olive }}>
                          {item.store_name} · Qty {item.quantity}
                        </p>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <p style={{ fontWeight: 900, fontSize: 14, color: COLORS.ink }}>
                          ₹{(price * item.quantity).toLocaleString("en-IN")}
                        </p>
                        {item.discount_price && (
                          <p style={{ fontSize: 11, color: "rgba(32,29,24,0.45)", textDecoration: "line-through" }}>
                            ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Coupon */}
            <Card style={{ padding: 20 }}>
              <SectionTitle>Coupon code</SectionTitle>
              {!couponApplied ? (
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    type="text"
                    placeholder="Enter coupon code"
                    value={couponCode}
                    onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError(""); }}
                    style={{
                      flex: 1,
                      padding: "10px 14px",
                      border: `1.5px solid ${couponError ? "#dc2626" : "rgba(32,29,24,0.2)"}`,
                      borderRadius: 10,
                      fontSize: 13,
                      fontWeight: 700,
                      letterSpacing: 1,
                      background: COLORS.bg,
                      color: COLORS.ink,
                      outline: "none",
                    }}
                  />
                  <button
                    onClick={handleApplyCoupon}
                    style={{ padding: "10px 20px", background: COLORS.ink, color: COLORS.primary, fontWeight: 900, fontSize: 13, borderRadius: 10, border: "none", cursor: "pointer" }}
                  >
                    Apply
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "rgba(22,163,74,0.08)", border: "1.5px solid #16a34a", borderRadius: 10 }}>
                  <span style={{ fontSize: 16 }}>✓</span>
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 800, color: "#16a34a", letterSpacing: 1 }}>{couponCode}</span>
                  <button
                    onClick={handleRemoveCoupon}
                    style={{ fontSize: 12, color: "#dc2626", background: "none", border: "none", cursor: "pointer", fontWeight: 700 }}
                  >
                    Remove
                  </button>
                </div>
              )}
              {couponError && (
                <p style={{ fontSize: 12, color: "#dc2626", marginTop: 6, fontWeight: 700 }}>{couponError}</p>
              )}
              <p style={{ fontSize: 11, color: COLORS.olive, marginTop: 8 }}>
                Coupon discount will be applied at checkout.
              </p>
            </Card>
          </div>

          {/* ── Right column — Order summary ── */}
          <div>
            <Card style={{ padding: 20, position: "sticky", top: 20 }}>
              <SectionTitle>Order summary</SectionTitle>

              <div style={{ borderBottom: `1px solid rgba(32,29,24,0.1)`, paddingBottom: 14, marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: COLORS.olive, marginBottom: 8 }}>
                  <span>Subtotal ({cart.itemCount} items)</span>
                  <span>₹{total.toLocaleString("en-IN")}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: COLORS.olive, marginBottom: 8 }}>
                  <span>Shipping</span>
                  <span style={{ color: "#16a34a", fontWeight: 700 }}>FREE</span>
                </div>
                {couponApplied && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#16a34a", fontWeight: 700 }}>
                    <span>Coupon ({couponCode})</span>
                    <span>Applied at checkout</span>
                  </div>
                )}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, fontWeight: 900, color: COLORS.ink, marginBottom: 20 }}>
                <span>Total</span>
                <span style={{ color: COLORS.primary }}>₹{total.toLocaleString("en-IN")}</span>
              </div>

              {/* Error message */}
              {orderError && (
                <div style={{ background: "#fef2f2", border: "1.5px solid #dc2626", borderRadius: 10, padding: "10px 14px", marginBottom: 14 }}>
                  <p style={{ fontSize: 13, color: "#dc2626", fontWeight: 700, margin: 0 }}>{orderError}</p>
                </div>
              )}

              {/* Place order button */}
              <button
                onClick={handlePlaceOrder}
                disabled={placing || !selectedAddressId || !cart?.items?.length}
                style={{
                  width: "100%",
                  padding: "14px",
                  background: placing ? "rgba(254,227,43,0.5)" : COLORS.primary,
                  color: COLORS.ink,
                  fontWeight: 900,
                  fontSize: 14,
                  borderRadius: 12,
                  border: "none",
                  cursor: placing || !selectedAddressId ? "not-allowed" : "pointer",
                  letterSpacing: 0.3,
                  marginBottom: 10,
                  opacity: !selectedAddressId ? 0.6 : 1,
                  transition: "opacity 0.15s",
                }}
              >
                {placing ? "Placing order..." : "Place order"}
              </button>

              <Link
                to="/cart"
                style={{ display: "block", textAlign: "center", padding: "12px", border: `2px solid ${COLORS.olive}`, color: COLORS.olive, fontWeight: 700, fontSize: 13, borderRadius: 12, textDecoration: "none", letterSpacing: 0.2 }}
              >
                Back to cart
              </Link>

              <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid rgba(32,29,24,0.1)`, fontSize: 12, color: COLORS.olive, lineHeight: 1.8 }}>
                <p>✓ Secure checkout</p>
                <p>✓ Easy 30-day returns</p>
                <p>✓ Free delivery above ₹499</p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}