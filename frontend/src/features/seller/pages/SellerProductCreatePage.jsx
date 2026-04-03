import React from "react";
import { useNavigate } from "react-router-dom";
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

export default function SellerProductCreatePage() {
  const { fetchWithAuth } = useAuth();
  const navigate = useNavigate();

  const [stores, setStores] = React.useState([]);
  const [categories, setCategories] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");

  const [form, setForm] = React.useState({
    store_id: "", category_id: "", name: "", description: "", brand: "",
  });

  const [variants, setVariants] = React.useState([
    { sku: "", price: "", discount_percentage: "", stock: "" }
  ]);

  const [images, setImages] = React.useState([
    { image_url: "", is_primary: true }
  ]);

  React.useEffect(() => {
    Promise.all([
      fetchWithAuth("/api/seller/stores"),
      fetch("/api/categories").then((r) => r.json()),
    ]).then(([storeData, catData]) => {
      setStores(storeData.data || []);
      setCategories(Array.isArray(catData) ? catData : []);
      if (storeData.data?.length > 0) {
        setForm((f) => ({ ...f, store_id: storeData.data[0].store_id }));
      }
    }).catch(console.error)
    .finally(() => setLoading(false));
  }, []);

  const setVariant = (i, key, val) => setVariants((prev) => prev.map((v, idx) => idx === i ? { ...v, [key]: val } : v));
  const addVariant = () => setVariants((prev) => [...prev, { sku: "", price: "", discount_percentage: "", stock: "" }]);
  const removeVariant = (i) => setVariants((prev) => prev.filter((_, idx) => idx !== i));

  const setImage = (i, key, val) => setImages((prev) => prev.map((img, idx) => {
    if (key === "is_primary" && val) return { ...img, is_primary: idx === i };
    return idx === i ? { ...img, [key]: val } : img;
  }));
  const addImage = () => setImages((prev) => [...prev, { image_url: "", is_primary: false }]);
  const removeImage = (i) => setImages((prev) => prev.filter((_, idx) => idx !== i));

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.store_id) { setError("Select a store"); return; }
    if (!form.name.trim()) { setError("Product name is required"); return; }
    if (variants.some((v) => !v.sku || !v.price || !v.stock)) { setError("All variant fields (SKU, price, stock) are required"); return; }
    if (images.some((img) => !img.image_url)) { setError("All image URLs are required"); return; }

    setSaving(true);
    try {
      const payload = {
        store_id: Number(form.store_id),
        category_id: form.category_id ? Number(form.category_id) : null,
        name: form.name.trim(),
        description: form.description.trim() || null,
        brand: form.brand.trim() || null,
        variants: variants.map((v) => {
          const price = parseFloat(v.price);
          const discountPercentage = v.discount_percentage ? parseFloat(v.discount_percentage) : 0;
          const discountPrice = discountPercentage > 0 ? price * (1 - discountPercentage / 100) : null;
          return {
            sku: v.sku.trim(),
            price: price,
            discount_price: discountPrice,
            stock: parseInt(v.stock),
          };
        }),
        images: images.map((img) => ({
          image_url: img.image_url.trim(),
          is_primary: img.is_primary,
        })),
      };

      await fetchWithAuth("/api/products", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      navigate("/seller/products");
    } catch (err) {
      setError(err.message || "Failed to create product");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p style={{ color: COLORS.olive, fontWeight: 700 }}>Loading...</p>;

  if (stores.length === 0) return (
    <Card style={{ textAlign: "center", padding: 40 }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>🏪</div>
      <p style={{ fontWeight: 700, color: COLORS.ink, marginBottom: 16 }}>You need a store before adding products.</p>
      <a href="/seller/store" style={{ padding: "10px 20px", background: COLORS.primary, color: COLORS.ink, fontWeight: 900, fontSize: 13, borderRadius: 10, textDecoration: "none" }}>
        Create a store
      </a>
    </Card>
  );

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <a href="/seller/products" style={{ fontSize: 13, color: COLORS.olive, fontWeight: 700, textDecoration: "none" }}>← Products</a>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: COLORS.ink, margin: "8px 0 0" }}>Add product</h1>
      </div>

      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {error && (
          <div style={{ background: "#fee2e2", border: "1.5px solid #dc2626", borderRadius: 10, padding: "12px 16px" }}>
            <p style={{ color: "#dc2626", fontWeight: 700, fontSize: 13, margin: 0 }}>{error}</p>
          </div>
        )}

        {/* Basic info */}
        <Card>
          <h2 style={{ fontSize: 14, fontWeight: 900, color: COLORS.ink, margin: "0 0 16px", textTransform: "uppercase", letterSpacing: 0.5 }}>Basic info</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <Label>Product name *</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Wireless Earbuds Pro" />
            </div>
            <div>
              <Label>Store *</Label>
              <select value={form.store_id} onChange={(e) => setForm((f) => ({ ...f, store_id: e.target.value }))}
                style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1.5px solid rgba(32,29,24,0.2)`, fontSize: 14, fontWeight: 600 }}>
                {stores.map((s) => <option key={s.store_id} value={s.store_id}>{s.store_name}</option>)}
              </select>
            </div>
            <div>
              <Label>Category</Label>
              <select value={form.category_id} onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}
                style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1.5px solid rgba(32,29,24,0.2)`, fontSize: 14, fontWeight: 600 }}>
                <option value="">No category</option>
                {categories.map((c) => <option key={c.category_id} value={c.category_id}>{c.parent_id ? `  └ ${c.name}` : c.name}</option>)}
              </select>
            </div>
            <div>
              <Label>Brand</Label>
              <Input value={form.brand} onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))} placeholder="e.g. Sony" />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <Label>Description</Label>
              <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Describe your product..." rows={4}
                style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1.5px solid rgba(32,29,24,0.2)`, fontSize: 14, resize: "vertical", boxSizing: "border-box", fontFamily: "system-ui" }} />
            </div>
          </div>
        </Card>

        {/* Variants */}
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h2 style={{ fontSize: 14, fontWeight: 900, color: COLORS.ink, margin: 0, textTransform: "uppercase", letterSpacing: 0.5 }}>Variants *</h2>
            <button type="button" onClick={addVariant}
              style={{ padding: "6px 14px", background: COLORS.soft, color: COLORS.ink, fontWeight: 800, fontSize: 12, borderRadius: 8, border: "none", cursor: "pointer" }}>
              + Add variant
            </button>
          </div>
          {variants.map((v, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr auto", gap: 10, marginBottom: 12, alignItems: "end" }}>
              <div>
                {i === 0 && <Label>SKU</Label>}
                <Input value={v.sku} onChange={(e) => setVariant(i, "sku", e.target.value)} placeholder="SKU-001" />
              </div>
              <div>
                {i === 0 && <Label>Price ৳</Label>}
                <Input type="number" value={v.price} onChange={(e) => setVariant(i, "price", e.target.value)} placeholder="999" />
              </div>
              <div>
                {i === 0 && <Label>Discount %</Label>}
                <Input type="number" value={v.discount_percentage} onChange={(e) => setVariant(i, "discount_percentage", e.target.value)} placeholder="10" />
              </div>
              <div>
                {i === 0 && <Label>Stock</Label>}
                <Input type="number" value={v.stock} onChange={(e) => setVariant(i, "stock", e.target.value)} placeholder="50" />
              </div>
              {variants.length > 1 && (
                <button type="button" onClick={() => removeVariant(i)}
                  style={{ padding: "10px", background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 900, marginTop: i === 0 ? 22 : 0 }}>
                  ×
                </button>
              )}
            </div>
          ))}
        </Card>

        {/* Images */}
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h2 style={{ fontSize: 14, fontWeight: 900, color: COLORS.ink, margin: 0, textTransform: "uppercase", letterSpacing: 0.5 }}>Images *</h2>
            <button type="button" onClick={addImage}
              style={{ padding: "6px 14px", background: COLORS.soft, color: COLORS.ink, fontWeight: 800, fontSize: 12, borderRadius: 8, border: "none", cursor: "pointer" }}>
              + Add image
            </button>
          </div>
          {images.map((img, i) => (
            <div key={i} style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "center" }}>
              <Input value={img.image_url} onChange={(e) => setImage(i, "image_url", e.target.value)}
                placeholder="https://..." style={{ flex: 1 }} />
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: COLORS.olive, whiteSpace: "nowrap", cursor: "pointer" }}>
                <input type="radio" name="primary_image" checked={img.is_primary} onChange={() => setImage(i, "is_primary", true)} />
                Primary
              </label>
              {images.length > 1 && (
                <button type="button" onClick={() => removeImage(i)}
                  style={{ padding: "8px 10px", background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 900 }}>
                  ×
                </button>
              )}
              {img.image_url && (
                <img src={img.image_url} alt="" style={{ width: 40, height: 40, borderRadius: 6, objectFit: "cover", border: `1px solid rgba(32,29,24,0.1)` }}
                  onError={(e) => e.target.style.display = "none"} />
              )}
            </div>
          ))}
        </Card>

        {/* Submit */}
        <div style={{ display: "flex", gap: 12 }}>
          <button type="submit" disabled={saving}
            style={{ flex: 1, padding: "14px", background: COLORS.primary, color: COLORS.ink, fontWeight: 900, fontSize: 14, borderRadius: 12, border: "none", cursor: saving ? "not-allowed" : "pointer" }}>
            {saving ? "Creating product..." : "Create product"}
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

