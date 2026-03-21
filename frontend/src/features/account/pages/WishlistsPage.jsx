import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../auth/useAuth.jsx";

const COLORS = {
  bg: "#FDFDF9", soft: "#FBEF9C",
  primary: "#FEE32B", olive: "#877928", ink: "#201D18",
};

function Card({ children, style }) {
  return (
    <div style={{
      background: COLORS.bg, border: `1px solid rgba(32,29,24,0.12)`,
      borderRadius: 16, boxShadow: "0 10px 26px rgba(32,29,24,0.08)",
      overflow: "hidden", ...style,
    }}>
      {children}
    </div>
  );
}

export default function WishlistsPage() {
  const { fetchWithAuth } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [addingToCart, setAddingToCart] = React.useState(null);

  const fetchWishlist = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchWithAuth("/api/wishlist");
      setItems(data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth]);

  React.useEffect(() => { fetchWishlist(); }, [fetchWishlist]);

  const removeItem = async (variantId) => {
    try {
      await fetchWithAuth(`/api/wishlist/items/${variantId}`, { method: "DELETE" });
      setItems((prev) => prev.filter((i) => i.variant_id !== variantId));
    } catch (err) {
      alert(err.message);
    }
  };

  const addToCart = async (variantId) => {
    setAddingToCart(variantId);
    try {
      await fetchWithAuth("/api/cart/items", {
        method: "POST",
        body: JSON.stringify({ variant_id: variantId, quantity: 1 }),
      });
      navigate("/cart");
    } catch (err) {
      alert(err.message || "Failed to add to cart");
    } finally {
      setAddingToCart(null);
    }
  };

  if (loading) return (
    <div style={{ padding: 24, textAlign: "center", color: COLORS.olive, fontWeight: 700 }}>
      Loading wishlist...
    </div>
  );

  return (
    <div style={{ padding: 12, fontFamily: "system-ui, sans-serif" }}>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: COLORS.ink }}>
          Wishlist
          <span style={{ marginLeft: 8, fontSize: 14, fontWeight: 400, color: COLORS.olive }}>
            {items.length} item{items.length !== 1 ? "s" : ""}
          </span>
        </h2>
      </div>

      {error && (
        <div style={{ color: "#dc2626", fontWeight: 700, marginBottom: 12 }}>❌ {error}</div>
      )}

      {items.length === 0 ? (
        <Card style={{ padding: 40, textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>♡</div>
          <p style={{ fontWeight: 700, color: COLORS.ink, marginBottom: 8 }}>Your wishlist is empty</p>
          <p style={{ fontSize: 13, color: COLORS.olive, marginBottom: 20 }}>
            Save items you love by clicking the heart on any product.
          </p>
          <Link
            to="/"
            style={{
              display: "inline-block", padding: "10px 20px",
              background: COLORS.primary, color: COLORS.ink,
              fontWeight: 900, borderRadius: 10, textDecoration: "none",
            }}
          >
            Start shopping
          </Link>
        </Card>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14 }}>
          {items.map((item) => {
            const price = item.discount_price || item.price;
            const hasDiscount = item.discount_price && Number(item.discount_price) < Number(item.price);
            const outOfStock = item.stock <= 0;

            return (
              <Card key={item.wishlist_item_id} style={{ display: "flex", flexDirection: "column" }}>
                {/* Image */}
                <Link to={`/p/${item.product_id}`} style={{ textDecoration: "none" }}>
                  <div style={{ position: "relative" }}>
                    <img
                      src={item.image_url || "https://via.placeholder.com/300?text=Product"}
                      alt={item.product_name}
                      style={{ width: "100%", height: 160, objectFit: "cover", background: COLORS.soft }}
                    />
                    {outOfStock && (
                      <div style={{
                        position: "absolute", inset: 0, background: "rgba(255,255,255,0.7)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <span style={{ fontWeight: 900, fontSize: 13, color: "#dc2626" }}>Out of stock</span>
                      </div>
                    )}
                  </div>
                </Link>

                {/* Info */}
                <div style={{ padding: "12px 14px", flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                  <Link to={`/p/${item.product_id}`} style={{ textDecoration: "none" }}>
                    <p style={{ fontWeight: 800, fontSize: 13, color: COLORS.ink, margin: 0 }}>
                      {item.product_name}
                    </p>
                  </Link>
                  <p style={{ fontSize: 12, color: COLORS.olive, margin: 0 }}>{item.store_name}</p>

                  {/* Price */}
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                    <span style={{ fontWeight: 900, fontSize: 15, color: COLORS.ink }}>
                      ₹{Number(price).toLocaleString("en-IN")}
                    </span>
                    {hasDiscount && (
                      <span style={{ fontSize: 12, color: "rgba(32,29,24,0.45)", textDecoration: "line-through" }}>
                        ₹{Number(item.price).toLocaleString("en-IN")}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 8, marginTop: "auto", paddingTop: 8 }}>
                    <button
                      onClick={() => addToCart(item.variant_id)}
                      disabled={outOfStock || addingToCart === item.variant_id}
                      style={{
                        flex: 1, padding: "9px 0",
                        background: outOfStock ? "rgba(32,29,24,0.08)" : COLORS.primary,
                        color: outOfStock ? COLORS.olive : COLORS.ink,
                        fontWeight: 900, fontSize: 12, borderRadius: 10,
                        border: "none", cursor: outOfStock ? "not-allowed" : "pointer",
                      }}
                    >
                      {addingToCart === item.variant_id ? "Adding..." : "Add to cart"}
                    </button>
                    <button
                      onClick={() => removeItem(item.variant_id)}
                      style={{
                        width: 36, height: 36, borderRadius: 10,
                        border: "1.5px solid #dc2626", background: "transparent",
                        color: "#dc2626", fontSize: 16, cursor: "pointer",
                      }}
                    >
                      ×
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}