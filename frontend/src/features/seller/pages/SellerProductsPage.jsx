import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../auth/useAuth.jsx";

const COLORS = { bg: "#FDFDF9", soft: "#FBEF9C", primary: "#FEE32B", olive: "#877928", ink: "#201D18" };

export default function SellerProductsPage() {
  const { fetchWithAuth } = useAuth();
  const [products, setProducts] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetchWithAuth("/api/seller/products")
      .then((d) => setProducts(d.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: COLORS.ink, margin: 0 }}>Products</h1>
        <Link to="/seller/products/new"
          style={{ padding: "10px 20px", background: COLORS.primary, color: COLORS.ink, fontWeight: 900, fontSize: 13, borderRadius: 10, textDecoration: "none" }}>
          + Add product
        </Link>
      </div>

      {loading ? (
        <p style={{ color: COLORS.olive, fontWeight: 700 }}>Loading...</p>
      ) : products.length === 0 ? (
        <div style={{ background: COLORS.bg, borderRadius: 16, padding: 48, textAlign: "center", border: `1px solid rgba(32,29,24,0.1)` }}>
          <p style={{ fontWeight: 700, color: COLORS.ink, marginBottom: 16 }}>No products yet</p>
          <Link to="/seller/products/new"
            style={{ padding: "10px 20px", background: COLORS.primary, color: COLORS.ink, fontWeight: 900, fontSize: 13, borderRadius: 10, textDecoration: "none" }}>
            Add your first product
          </Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {products.map((p) => (
            <div key={p.product_id} style={{ background: COLORS.bg, border: `1px solid rgba(32,29,24,0.1)`, borderRadius: 14, padding: "14px 18px", display: "flex", gap: 14, alignItems: "center" }}>
              <img src={p.image_url || "https://via.placeholder.com/56?text=?"} alt={p.name}
                style={{ width: 56, height: 56, borderRadius: 10, objectFit: "cover", flexShrink: 0, background: COLORS.soft }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 900, fontSize: 14, color: COLORS.ink, margin: "0 0 3px" }}>{p.name}</p>
                <p style={{ fontSize: 12, color: COLORS.olive, margin: 0 }}>
                  {p.brand && `${p.brand} · `}{p.variant_count} variant{p.variant_count !== 1 ? "s" : ""} · {p.total_stock} in stock
                </p>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <p style={{ fontWeight: 900, fontSize: 14, color: COLORS.ink, margin: "0 0 4px" }}>
                  from ₹{Number(p.min_price).toLocaleString("en-IN")}
                </p>
                <span style={{
                  fontSize: 11, fontWeight: 800, padding: "2px 8px", borderRadius: 6,
                  background: p.status === "active" ? "#DCFCE7" : "#FEE2E2",
                  color: p.status === "active" ? "#166534" : "#991B1B",
                }}>
                  {p.status}
                </span>
              </div>
              <Link to={`/seller/products/${p.product_id}`}
                style={{ padding: "8px 14px", background: COLORS.soft, color: COLORS.ink, fontWeight: 700, fontSize: 12, borderRadius: 8, textDecoration: "none", flexShrink: 0 }}>
                Edit
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}