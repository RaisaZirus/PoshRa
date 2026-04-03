import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../../auth/useAuth.jsx";

const COLORS = { bg: "#FDFDF9", soft: "#FBEF9C", primary: "#FEE32B", olive: "#877928", ink: "#201D18" };

function Card({ children, style }) {
  return <div style={{ background: COLORS.bg, border: `1px solid rgba(32,29,24,0.12)`, borderRadius: 16, padding: 20, boxShadow: "0 4px 16px rgba(32,29,24,0.06)", ...style }}>{children}</div>;
}

function Label({ children }) {
  return <label style={{ fontSize: 12, fontWeight: 800, color: COLORS.olive, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.4 }}>{children}</label>;
}

function Input({ style, ...props }) {
  return <input {...props} style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1.5px solid rgba(32,29,24,0.2)`, fontSize: 14, fontWeight: 600, boxSizing: "border-box", outline: "none", ...style }} />;
}

export default function SellerProductEditPage() {
  const { product_id } = useParams();
  const { fetchWithAuth } = useAuth();
  const navigate = useNavigate();

  const [product, setProduct] = React.useState(null);
  const [categories, setCategories] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");
  const [saved, setSaved] = React.useState(false);

  const [form, setForm] = React.useState({
    name: "", description: "", brand: "", status: "active", category_id: "",
  });

  const [variants, setVariants] = React.useState([]);

  React.useEffect(() => {
    Promise.all([
      fetchWithAuth(`/api/seller/products/${product_id}`),
      fetch("/api/categories").then((r) => r.json()),
    ]).then(([prodData, catData]) => {
      const p = prodData.data;
      setProduct(p);
      setForm({ name: p.name, description: p.description || "", brand: p.brand || "", status: p.status, category_id: p.category_id || "" });
      setVariants(p.variants.map((v) => {
        const price = parseFloat(v.price);
        const discountPrice = v.discount_price ? parseFloat(v.discount_price) : 0;
        const discountPercentage = discountPrice > 0 ? Math.round(((price - discountPrice) / price) * 100) : "";
        return { ...v, discount_percentage: discountPercentage.toString() };
      }));
      setCategories(Array.isArray(catData) ? catData : []);
    }).catch((e) => setError(e.message))
    .finally(() => setLoading(false));
  }, [product_id]);

  const setVariant = (i, key, val) => setVariants((prev) => prev.map((v, idx) => idx === i ? { ...v, [key]: val } : v));

  const save = async (e) => {
    e.preventDefault();
    setSaving(true); setError(""); setSaved(false);
    try {
      // Update product info
      await fetchWithAuth(`/api/seller/products/${product_id}`, {
        method: "PATCH",
        body: JSON.stringify({ ...form, category_id: form.category_id ? Number(form.category_id) : null }),
      });
      // Update each variant stock/price
      await Promise.all(variants.map((v) => {
        const price = parseFloat(v.price);
        const discountPercentage = v.discount_percentage ? parseFloat(v.discount_percentage) : 0;
        const discountPrice = discountPercentage > 0 ? price * (1 - discountPercentage / 100) : null;
        return fetchWithAuth(`/api/seller/inventory/${v.variant_id}`, {
          method: "PATCH",
          body: JSON.stringify({
            stock: Number(v.stock),
            price: price,
            discount_price: discountPrice,
          }),
        });
      }));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  if (loading) return <p style={{ color: COLORS.olive, fontWeight: 700 }}>Loading...</p>;
  if (error && !product) return <p style={{ color: "#dc2626", fontWeight: 700 }}>{error}</p>;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <a href="/seller/products" style={{ fontSize: 13, color: COLORS.olive, fontWeight: 700, textDecoration: "none" }}>← Products</a>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: COLORS.ink, margin: "8px 0 0" }}>Edit product</h1>
      </div>

      <form onSubmit={save} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {error && <div style={{ background: "#fee2e2", border: "1.5px solid #dc2626", borderRadius: 10, padding: "12px 16px" }}>
          <p style={{ color: "#dc2626", fontWeight: 700, fontSize: 13, margin: 0 }}>{error}</p>
        </div>}
        {saved && <div style={{ background: "#DCFCE7", border: "1.5px solid #16a34a", borderRadius: 10, padding: "12px 16px" }}>
          <p style={{ color: "#166534", fontWeight: 700, fontSize: 13, margin: 0 }}>✓ Changes saved successfully</p>
        </div>}

        {/* Basic info */}
        <Card>
          <h2 style={{ fontSize: 14, fontWeight: 900, color: COLORS.ink, margin: "0 0 16px", textTransform: "uppercase", letterSpacing: 0.5 }}>Product info</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <Label>Product name</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <Label>Brand</Label>
              <Input value={form.brand} onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))} />
            </div>
            <div>
              <Label>Status</Label>
              <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1.5px solid rgba(32,29,24,0.2)`, fontSize: 14 }}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div>
              <Label>Category</Label>
              <select value={form.category_id} onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}
                style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1.5px solid rgba(32,29,24,0.2)`, fontSize: 14 }}>
                <option value="">No category</option>
                {categories.map((c) => <option key={c.category_id} value={c.category_id}>{c.parent_id ? `  └ ${c.name}` : c.name}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <Label>Description</Label>
              <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={4}
                style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1.5px solid rgba(32,29,24,0.2)`, fontSize: 14, resize: "vertical", boxSizing: "border-box", fontFamily: "system-ui" }} />
            </div>
          </div>
        </Card>

        {/* Variants */}
        <Card>
          <h2 style={{ fontSize: 14, fontWeight: 900, color: COLORS.ink, margin: "0 0 16px", textTransform: "uppercase", letterSpacing: 0.5 }}>Variants</h2>
          {variants.map((v, i) => (
            <div key={v.variant_id} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 10, marginBottom: 12 }}>
              <div>
                {i === 0 && <Label>SKU</Label>}
                <Input value={v.sku} disabled style={{ background: COLORS.soft, color: COLORS.olive }} />
              </div>
              <div>
                {i === 0 && <Label>Price ৳</Label>}
                <Input type="number" value={v.price} onChange={(e) => setVariant(i, "price", e.target.value)} />
              </div>
              <div>
                {i === 0 && <Label>Discount %</Label>}
                <Input type="number" value={v.discount_percentage} onChange={(e) => setVariant(i, "discount_percentage", e.target.value)} placeholder="10" />
              </div>
              <div>
                {i === 0 && <Label>Stock</Label>}
                <Input type="number" value={v.stock} onChange={(e) => setVariant(i, "stock", e.target.value)} />
              </div>
            </div>
          ))}
        </Card>

        <div style={{ display: "flex", gap: 12 }}>
          <button type="submit" disabled={saving}
            style={{ flex: 1, padding: "14px", background: COLORS.primary, color: COLORS.ink, fontWeight: 900, fontSize: 14, borderRadius: 12, border: "none", cursor: saving ? "not-allowed" : "pointer" }}>
            {saving ? "Saving..." : "Save changes"}
          </button>
          <a href="/seller/products"
            style={{ padding: "14px 24px", background: "transparent", border: `1.5px solid ${COLORS.olive}`, color: COLORS.olive, fontWeight: 700, fontSize: 14, borderRadius: 12, textDecoration: "none", display: "flex", alignItems: "center" }}>
            Cancel
          </a>
        </div>
      </form>
    </div>
  );
}

