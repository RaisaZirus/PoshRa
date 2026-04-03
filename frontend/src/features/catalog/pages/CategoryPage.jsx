import React from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
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

function ProductCard({ p, onAddToCart }) {
  const price = p.discount_price || p.min_price;
  const hasDiscount = p.discount_price && Number(p.discount_price) < Number(p.min_price);
  const outOfStock = Number(p.stock) <= 0;

  return (
    <Card style={{ display: "flex", flexDirection: "column" }}>
      <Link to={`/p/${p.product_id}`} style={{ textDecoration: "none", color: "inherit" }}>
        <div style={{ position: "relative" }}>
          <img
            src={p.image_url || "https://via.placeholder.com/300?text=Product"}
            alt={p.name}
            style={{ width: "100%", height: 160, objectFit: "cover", background: COLORS.soft }}
          />
          {hasDiscount && (
            <span style={{
              position: "absolute", top: 8, left: 8,
              background: COLORS.primary, color: COLORS.ink,
              fontSize: 11, fontWeight: 900, padding: "3px 8px", borderRadius: 6,
            }}>
              {Math.round(((Number(p.min_price) - Number(p.discount_price)) / Number(p.min_price)) * 100)}% OFF
            </span>
          )}
          {outOfStock && (
            <div style={{
              position: "absolute", inset: 0, background: "rgba(255,255,255,0.7)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ fontWeight: 900, fontSize: 12, color: "#dc2626" }}>Out of stock</span>
            </div>
          )}
        </div>
        <div style={{ padding: "10px 12px" }}>
          <p style={{ fontWeight: 800, fontSize: 13, color: COLORS.ink, margin: "0 0 2px", lineHeight: 1.3 }}>{p.name}</p>
          <p style={{ fontSize: 11, color: COLORS.olive, margin: "0 0 8px" }}>{p.brand || p.store_name}</p>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <span style={{ fontWeight: 900, fontSize: 15, color: COLORS.ink }}>
              ₹{Number(price).toLocaleString("en-BD")}
            </span>
            {hasDiscount && (
              <span style={{ fontSize: 12, color: "rgba(32,29,24,0.45)", textDecoration: "line-through" }}>
                ₹{Number(p.min_price).toLocaleString("en-BD")}
              </span>
            )}
          </div>
        </div>
      </Link>
      <div style={{ padding: "0 12px 12px" }}>
        <button
          onClick={() => onAddToCart(p.product_id)}
          disabled={outOfStock}
          style={{
            width: "100%", padding: "9px 0",
            background: outOfStock ? "rgba(32,29,24,0.08)" : COLORS.primary,
            color: outOfStock ? COLORS.olive : COLORS.ink,
            fontWeight: 900, fontSize: 12, borderRadius: 10,
            border: "none", cursor: outOfStock ? "not-allowed" : "pointer",
          }}
        >
          {outOfStock ? "Out of stock" : "Add to cart"}
        </button>
      </div>
    </Card>
  );
}

export default function CategoryPage() {
  const { slug } = useParams();
  const { fetchWithAuth, user } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [page, setPage] = React.useState(1);

  React.useEffect(() => {
    const fetchCategory = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/categories/${slug}/products?page=${page}&limit=20`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to load category");
        setData(json);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchCategory();
  }, [slug, page]);

  const handleAddToCart = async (productId) => {
    if (!user) { navigate("/auth/login"); return; }
    try {
      const res = await fetch(`/api/products/${productId}`);
      const json = await res.json();
      const variant = json?.data?.variants?.[0];
      if (!variant) { alert("No variant available"); return; }
      await fetchWithAuth("/api/cart/items", {
        method: "POST",
        body: JSON.stringify({ variant_id: variant.variant_id, quantity: 1 }),
      });
      navigate("/cart");
    } catch (err) {
      alert(err.message || "Failed to add to cart");
    }
  };

  if (loading) return (
    <div style={{ background: COLORS.soft, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ fontWeight: 700, color: COLORS.olive, fontSize: 16 }}>Loading...</p>
    </div>
  );

  if (error) return (
    <div style={{ background: COLORS.soft, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Card style={{ padding: 40, textAlign: "center" }}>
        <p style={{ fontWeight: 700, color: COLORS.ink, marginBottom: 16 }}>{error}</p>
        <Link to="/" style={{ padding: "10px 20px", background: COLORS.primary, color: COLORS.ink, fontWeight: 900, borderRadius: 10, textDecoration: "none" }}>
          Go home
        </Link>
      </Card>
    </div>
  );

  const { category, products, meta } = data;
  const totalPages = Math.ceil(meta.total / meta.limit);

  return (
    <div style={{ background: COLORS.soft, minHeight: "100vh", paddingBottom: 60, fontFamily: "system-ui, sans-serif" }}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <Link to="/" style={{ fontSize: 13, color: COLORS.olive, fontWeight: 700, textDecoration: "none" }}>← Home</Link>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: COLORS.ink, margin: "8px 0 4px" }}>
            {category.name}
          </h1>
          <p style={{ fontSize: 13, color: COLORS.olive, margin: 0 }}>
            {meta.total} product{meta.total !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Products grid */}
        {products.length === 0 ? (
          <Card style={{ padding: 48, textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
            <p style={{ fontWeight: 700, color: COLORS.ink, marginBottom: 8 }}>No products in this category yet</p>
            <Link to="/" style={{ display: "inline-block", padding: "10px 20px", background: COLORS.primary, color: COLORS.ink, fontWeight: 900, borderRadius: 10, textDecoration: "none" }}>
              Browse all products
            </Link>
          </Card>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16, marginBottom: 32 }}>
              {products.map((p) => (
                <ProductCard key={p.product_id} p={p} onAddToCart={handleAddToCart} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  style={{ padding: "8px 16px", borderRadius: 10, border: `1.5px solid ${COLORS.olive}`, background: "transparent", color: COLORS.olive, fontWeight: 700, cursor: page === 1 ? "not-allowed" : "pointer", opacity: page === 1 ? 0.5 : 1 }}
                >
                  ← Prev
                </button>
                <span style={{ padding: "8px 16px", fontWeight: 700, color: COLORS.ink }}>
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  style={{ padding: "8px 16px", borderRadius: 10, border: `1.5px solid ${COLORS.olive}`, background: "transparent", color: COLORS.olive, fontWeight: 700, cursor: page === totalPages ? "not-allowed" : "pointer", opacity: page === totalPages ? 0.5 : 1 }}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

