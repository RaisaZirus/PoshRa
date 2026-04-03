import React from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../auth/useAuth.jsx";
import ReportModal from "../../../components/ReportModal.jsx";

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

function Stars({ rating, count }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      {[...Array(5)].map((_, i) => (
        <span key={i} style={{ fontSize: 13, color: i < Math.round(rating) ? COLORS.primary : "#D3D1C7" }}>★</span>
      ))}
      {count > 0 && <span style={{ fontSize: 12, color: COLORS.olive, marginLeft: 2 }}>{count}</span>}
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
          <div style={{ position: "absolute", top: 8, left: 8, display: "flex", gap: 4, flexWrap: "wrap" }}>
            {hasDiscount && (
              <span style={{ background: COLORS.primary, color: COLORS.ink, fontSize: 11, fontWeight: 900, padding: "3px 8px", borderRadius: 6 }}>
                {Math.round(((Number(p.min_price) - Number(p.discount_price)) / Number(p.min_price)) * 100)}% OFF
              </span>
            )}
            {Number(p.stock) > 0 && Number(p.stock) <= 5 && (
              <span style={{ background: "#fef9c3", color: "#854D0E", fontSize: 11, fontWeight: 800, padding: "3px 8px", borderRadius: 6 }}>
                Only {p.stock} left
              </span>
            )}
            {Number(p.total_sold) >= 50 && (
              <span style={{ background: "#ede9fe", color: "#7c3aed", fontSize: 11, fontWeight: 800, padding: "3px 8px", borderRadius: 6 }}>
                Bestseller
              </span>
            )}
            {outOfStock && (
              <span style={{ background: "#fee2e2", color: "#991B1B", fontSize: 11, fontWeight: 800, padding: "3px 8px", borderRadius: 6 }}>
                Out of stock
              </span>
            )}
          </div>
        </div>
        <div style={{ padding: "10px 12px" }}>
          <p style={{ fontWeight: 800, fontSize: 13, color: COLORS.ink, margin: "0 0 2px", lineHeight: 1.3 }}>{p.name}</p>
          {p.brand && <p style={{ fontSize: 11, color: COLORS.olive, margin: "0 0 6px" }}>{p.brand}</p>}
          {p.reviews_count > 0 && (
            <div style={{ marginBottom: 6 }}>
              <Stars rating={p.avg_rating} count={p.reviews_count} />
            </div>
          )}
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

export default function StorePage() {
  const { store_slug } = useParams();
  const { fetchWithAuth, user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [sort, setSort] = React.useState("newest");
  const [showReportModal, setShowReportModal] = React.useState(false);

  React.useEffect(() => {
    fetch(`/api/stores/${store_slug}`)
      .then((r) => r.json())
      .then((d) => {
        if (!d.success) throw new Error(d.message || "Store not found");
        setData(d.data);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [store_slug]);

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
      <p style={{ fontWeight: 700, color: COLORS.olive, fontSize: 16 }}>Loading store...</p>
    </div>
  );

  if (error || !data) return (
    <div style={{ background: COLORS.soft, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Card style={{ padding: 40, textAlign: "center", maxWidth: 400 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🏪</div>
        <p style={{ fontWeight: 700, color: COLORS.ink, marginBottom: 16 }}>{error || "Store not found"}</p>
        <Link to="/" style={{ padding: "10px 20px", background: COLORS.primary, color: COLORS.ink, fontWeight: 900, borderRadius: 10, textDecoration: "none" }}>
          Back to home
        </Link>
      </Card>
    </div>
  );

  const { store, products } = data;

  // Filter + sort
  const filtered = products
    .filter((p) => !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.brand || "").toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sort === "price_asc") return Number(a.min_price) - Number(b.min_price);
      if (sort === "price_desc") return Number(b.min_price) - Number(a.min_price);
      if (sort === "rating") return Number(b.avg_rating) - Number(a.avg_rating);
      if (sort === "popular") return Number(b.total_sold) - Number(a.total_sold);
      return new Date(b.created_at) - new Date(a.created_at); // newest
    });

  return (
    <div style={{
      background: COLORS.soft, color: COLORS.ink,
      fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
      minHeight: "100vh", paddingBottom: 60,
    }}>
      {/* Store header */}
      <div style={{
        background: COLORS.ink, color: COLORS.bg,
        padding: "32px 24px", marginBottom: 0,
      }}>
        <div className="container mx-auto">
          <Link to="/" style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", textDecoration: "none", fontWeight: 700 }}>
            ← Home
          </Link>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginTop: 16 }}>
            <div>
              {/* Store avatar */}
              <div style={{
                width: 64, height: 64, borderRadius: 16,
                background: COLORS.primary, display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 26, fontWeight: 900, color: COLORS.ink, marginBottom: 12,
              }}>
                {store.store_name.charAt(0).toUpperCase()}
              </div>
              <h1 style={{ fontSize: 28, fontWeight: 900, margin: "0 0 6px", color: "#fff" }}>
                {store.store_name}
              </h1>
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                {/* Rating */}
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  {[...Array(5)].map((_, i) => (
                    <span key={i} style={{ fontSize: 14, color: i < Math.round(store.store_rating) ? COLORS.primary : "rgba(255,255,255,0.3)" }}>★</span>
                  ))}
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", marginLeft: 2 }}>
                    {Number(store.store_rating).toFixed(1)}
                  </span>
                </div>
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>·</span>
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
                  {store.product_count} product{store.product_count !== 1 ? "s" : ""}
                </span>
                {store.kyc_status === "verified" && (
                  <>
                    <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>·</span>
                    <span style={{ fontSize: 12, fontWeight: 800, background: "#dcfce7", color: "#166534", padding: "2px 8px", borderRadius: 6 }}>
                      ✓ Verified seller
                    </span>
                  </>
                )}
              </div>
              {store.business_name && (
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", margin: "6px 0 0" }}>
                  {store.business_name}
                </p>
              )}
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: 0 }}>
                Member since {new Date(store.created_at).getFullYear()}
              </p>
              {user && (
                <button
                  onClick={() => setShowReportModal(true)}
                  style={{
                    background: "none",
                    border: "1px solid rgba(255,255,255,0.2)",
                    borderRadius: 8,
                    padding: "5px 12px",
                    fontSize: 11,
                    fontWeight: 700,
                    color: "rgba(255,255,255,0.45)",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  🚩 Report seller
                </button>
              )}
            </div>

          {showReportModal && (
            <ReportModal
              entityType="seller"
              entityId={store.seller_id}
              entityLabel={store.store_name}
              onClose={() => setShowReportModal(false)}
            />
          )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Search + sort */}
        <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap", alignItems: "center" }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search this store..."
            style={{
              flex: 1, minWidth: 200, padding: "10px 14px", borderRadius: 10,
              border: `1.5px solid rgba(32,29,24,0.2)`, fontSize: 14, background: COLORS.bg,
            }}
          />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            style={{ padding: "10px 14px", borderRadius: 10, border: `1.5px solid rgba(32,29,24,0.2)`, fontSize: 13, background: COLORS.bg }}
          >
            <option value="newest">Newest</option>
            <option value="price_asc">Price: Low to high</option>
            <option value="price_desc">Price: High to low</option>
            <option value="rating">Top rated</option>
            <option value="popular">Most popular</option>
          </select>
          <span style={{ fontSize: 13, color: COLORS.olive }}>
            {filtered.length} product{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Products */}
        {filtered.length === 0 ? (
          <Card style={{ padding: 48, textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
            <p style={{ fontWeight: 700, color: COLORS.ink, marginBottom: 8 }}>
              {search ? `No products match "${search}"` : "No products in this store yet"}
            </p>
            {search && (
              <button onClick={() => setSearch("")}
                style={{ padding: "10px 20px", background: COLORS.primary, color: COLORS.ink, fontWeight: 900, borderRadius: 10, border: "none", cursor: "pointer" }}>
                Clear search
              </button>
            )}
          </Card>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
            {filtered.map((p) => (
              <ProductCard key={p.product_id} p={p} onAddToCart={handleAddToCart} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

