import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../auth/useAuth.jsx";

// HomePage color palette
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

export default function CartPage() {
  const { fetchWithAuth } = useAuth();
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      setLoading(true);
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
      const data = await fetchWithAuth(`/api/cart/items/${cart_item_id}`, {
        method: "PUT",
        body: JSON.stringify({ quantity: newQuantity }),
      });
      if (data.success) fetchCart();
    } catch (err) {
      console.error("Error updating quantity:", err);
    }
  };

  const removeItem = async (cart_item_id) => {
    try {
      const data = await fetchWithAuth(`/api/cart/items/${cart_item_id}`, { method: "DELETE" });
      if (data.success) fetchCart();
    } catch (err) {
      console.error("Error removing item:", err);
    }
  };

  const clearCart = async () => {
    if (window.confirm("Are you sure you want to clear your cart?")) {
      try {
        const data = await fetchWithAuth("/api/cart", { method: "DELETE" });
        if (data.success) fetchCart();
      } catch (err) {
        console.error("Error clearing cart:", err);
      }
    }
  };

  if (loading) {
    return (
      <div style={{ background: COLORS.soft, minHeight: "100vh", padding: "32px 16px" }}>
        <div className="container mx-auto text-center">
          <div style={{ fontSize: 48 }}>🛒</div>
          <p style={{ fontSize: 18, color: COLORS.olive, fontWeight: 700, marginTop: 16 }}>
            Loading your cart...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ background: COLORS.soft, minHeight: "100vh", padding: "32px 16px" }}>
        <div className="container mx-auto text-center">
          <div style={{ fontSize: 48 }}>⚠️</div>
          <p style={{ fontSize: 18, color: COLORS.ink, fontWeight: 700, marginTop: 16 }}>
            {error}
          </p>
          <Link
            to="/"
            style={{
              display: "inline-block",
              marginTop: 20,
              padding: "12px 20px",
              background: COLORS.primary,
              color: COLORS.ink,
              fontWeight: 900,
              borderRadius: 12,
              textDecoration: "none",
              fontSize: 14,
            }}
          >
            Back to Shopping
          </Link>
        </div>
      </div>
    );
  }

  const isEmpty = !cart || !cart.items || cart.items.length === 0;

  return (
    <div style={{ background: COLORS.soft, color: COLORS.ink, fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif", minHeight: "100vh", paddingBottom: 60 }}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <h1 style={{ fontSize: 36, fontWeight: 900, letterSpacing: 0.2 }}>
            🛒 Your Cart
          </h1>
          <p style={{ fontSize: 14, color: COLORS.olive, marginTop: 4 }}>
            {isEmpty ? "Your cart is empty" : `${cart.itemCount} item${cart.itemCount !== 1 ? "s" : ""} in cart`}
          </p>
        </div>

        {isEmpty ? (
          <Card style={{ padding: 40, textAlign: "center" }}>
            <div style={{ fontSize: 80, marginBottom: 20 }}>🛍️</div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: COLORS.ink, marginBottom: 12 }}>
              Your cart is empty
            </h2>
            <p style={{ fontSize: 14, color: COLORS.olive, marginBottom: 24 }}>
              Start shopping to add items to your cart
            </p>
            <Link
              to="/"
              style={{
                display: "inline-block",
                padding: "12px 24px",
                background: COLORS.primary,
                color: COLORS.ink,
                fontWeight: 900,
                borderRadius: 12,
                textDecoration: "none",
                fontSize: 14,
              }}
            >
              Continue Shopping
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cart.items.map((item) => {
                const price = item.discount_price || item.price;
                const originalPrice = item.price;
                const discount = item.discount_price
                  ? Math.round(((originalPrice - item.discount_price) / originalPrice) * 100)
                  : 0;

                return (
                  <Card key={item.cart_item_id} style={{ padding: 16 }}>
                    <div className="grid grid-cols-4 gap-4 items-start">
                      {/* Product Image */}
                      <div style={{ borderRadius: 12, overflow: "hidden", background: COLORS.bg }}>
                        <img
                          src={item.image_url || "https://via.placeholder.com/150?text=Product"}
                          alt={item.product_name}
                          style={{ width: "100%", height: 120, objectFit: "cover" }}
                        />
                      </div>

                      {/* Product Info */}
                      <div className="col-span-2">
                        <Link
                          to={`/p/${item.product_id}`}
                          style={{
                            textDecoration: "none",
                            color: COLORS.ink,
                            fontWeight: 800,
                            fontSize: 14,
                            display: "block",
                            marginBottom: 4,
                          }}
                        >
                          {item.product_name}
                        </Link>
                        <p style={{ fontSize: 12, color: COLORS.olive, marginBottom: 8 }}>
                          {item.brand} • {item.sku}
                        </p>
                        <p style={{ fontSize: 12, color: COLORS.olive }}>
                          Sold by <strong>{item.store_name}</strong>
                        </p>
                      </div>

                      {/* Price and Actions */}
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 16, fontWeight: 900, color: COLORS.primary, marginBottom: 8 }}>
                          ৳{(price * item.quantity).toLocaleString("en-BD")}
                        </div>
                        {discount > 0 && (
                          <p style={{ fontSize: 12, color: "rgba(32,29,24,0.6)", textDecoration: "line-through", marginBottom: 8 }}>
                            ৳{(originalPrice * item.quantity).toLocaleString("en-BD")}
                          </p>
                        )}

                        {/* Quantity Control */}
                        <div style={{ display: "flex", gap: 4, alignItems: "center", justifyContent: "flex-end", marginBottom: 8 }}>
                          <button
                            onClick={() => updateQuantity(item.cart_item_id, item.quantity - 1)}
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: 6,
                              border: `1px solid ${COLORS.olive}`,
                              background: COLORS.bg,
                              color: COLORS.olive,
                              fontWeight: 700,
                              cursor: "pointer",
                              fontSize: 12,
                            }}
                          >
                            −
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateQuantity(item.cart_item_id, Math.max(1, parseInt(e.target.value) || 1))}
                            style={{
                              width: 40,
                              height: 28,
                              textAlign: "center",
                              border: `1px solid ${COLORS.olive}`,
                              borderRadius: 6,
                              fontWeight: 700,
                              fontSize: 12,
                            }}
                          />
                          <button
                            onClick={() => updateQuantity(item.cart_item_id, item.quantity + 1)}
                            disabled={item.quantity >= item.stock}
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: 6,
                              border: `1px solid ${COLORS.olive}`,
                              background: COLORS.bg,
                              color: COLORS.olive,
                              fontWeight: 700,
                              cursor: item.quantity >= item.stock ? "not-allowed" : "pointer",
                              fontSize: 12,
                              opacity: item.quantity >= item.stock ? 0.5 : 1,
                            }}
                          >
                            +
                          </button>
                        </div>

                        {/* Remove Button */}
                        <button
                          onClick={() => removeItem(item.cart_item_id)}
                          style={{
                            fontSize: 12,
                            color: "#dc2626",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            fontWeight: 700,
                            textDecoration: "underline",
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </Card>
                );
              })}

              {/* Clear Cart Button */}
              <button
                onClick={clearCart}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  border: `2px solid ${COLORS.olive}`,
                  background: "transparent",
                  color: COLORS.olive,
                  fontWeight: 700,
                  fontSize: 13,
                  borderRadius: 12,
                  cursor: "pointer",
                  letterSpacing: 0.2,
                }}
              >
                CLEAR CART
              </button>
            </div>

            {/* Order Summary */}
            <div>
              <Card style={{ padding: 20, position: "sticky", top: 20 }}>
                <h3 style={{ fontSize: 14, fontWeight: 900, color: COLORS.ink, marginBottom: 16, letterSpacing: 0.2 }}>
                  ORDER SUMMARY
                </h3>

                {/* Price Breakdown */}
                <div style={{ borderBottom: `1px solid rgba(32,29,24,0.12)`, paddingBottom: 16, marginBottom: 16 }}>
                  {cart.items.map((item) => {
                    const price = item.discount_price || item.price;
                    return (
                      <div key={item.cart_item_id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: COLORS.olive, marginBottom: 8 }}>
                        <span>{item.product_name} x {item.quantity}</span>
                        <span>৳{(price * item.quantity).toLocaleString("en-BD")}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Totals */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: COLORS.olive, marginBottom: 8 }}>
                    <span>Subtotal</span>
                    <span>৳{cart.total.toLocaleString("en-BD")}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: COLORS.olive, marginBottom: 8 }}>
                    <span>Shipping</span>
                    <span style={{ color: "#16a34a", fontWeight: 700 }}>FREE</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: COLORS.olive }}>
                    <span>Tax (0%)</span>
                    <span>৳0</span>
                  </div>
                </div>

                {/* Grand Total */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 16,
                    fontWeight: 900,
                    color: COLORS.ink,
                    borderTop: `1px solid rgba(32,29,24,0.12)`,
                    paddingTop: 16,
                    marginBottom: 16,
                  }}
                >
                  <span>TOTAL</span>
                  <span style={{ color: COLORS.primary }}>৳{cart.total.toLocaleString("en-BD")}</span>
                </div>

                {/* Checkout Buttons */}
                <button
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    background: COLORS.primary,
                    color: COLORS.ink,
                    fontWeight: 900,
                    fontSize: 13,
                    borderRadius: 12,
                    border: "none",
                    cursor: "pointer",
                    letterSpacing: 0.2,
                    marginBottom: 8,
                  }}
                  onClick={() => navigate("/checkout")}
                >
                  PROCEED TO CHECKOUT
                </button>

                <Link
                  to="/"
                  style={{
                    display: "block",
                    textAlign: "center",
                    padding: "12px 14px",
                    border: `2px solid ${COLORS.olive}`,
                    color: COLORS.olive,
                    fontWeight: 700,
                    fontSize: 13,
                    borderRadius: 12,
                    textDecoration: "none",
                    letterSpacing: 0.2,
                  }}
                >
                  CONTINUE SHOPPING
                </Link>

                {/* Info Pills */}
                <div style={{ marginTop: 20, paddingTop: 20, borderTop: `1px solid rgba(32,29,24,0.12)`, fontSize: 12, color: COLORS.olive, lineHeight: 1.6 }}>
                  <p style={{ marginBottom: 12 }}>
                    <strong>✓ Free delivery</strong> on orders above ৳499
                  </p>
                  <p style={{ marginBottom: 12 }}>
                    <strong>✓ Easy returns</strong> within 30 days
                  </p>
                  <p>
                    <strong>✓ Secure payment</strong> guaranteed
                  </p>
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

