import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../auth/useAuth.jsx";

const COLORS = { bg: "#FDFDF9", soft: "#FBEF9C", primary: "#FEE32B", olive: "#877928", ink: "#201D18" };

function Card({ children, style }) {
  return <div style={{ background: COLORS.bg, border: `1px solid rgba(32,29,24,0.12)`, borderRadius: 16, padding: 20, boxShadow: "0 4px 16px rgba(32,29,24,0.06)", ...style }}>{children}</div>;
}

const STATUS_COLORS = {
  pending: { bg: "#FEF9C3", text: "#854D0E" }, processing: { bg: "#DBEAFE", text: "#1E40AF" },
  shipped: { bg: "#E0F2FE", text: "#0369A1" }, delivered: { bg: "#DCFCE7", text: "#166534" },
  cancelled: { bg: "#FEE2E2", text: "#991B1B" },
};

function StatusBadge({ status }) {
  const s = STATUS_COLORS[status] || { bg: COLORS.soft, text: COLORS.olive };
  return <span style={{ background: s.bg, color: s.text, fontWeight: 800, fontSize: 11, padding: "3px 9px", borderRadius: 999, textTransform: "capitalize" }}>{status}</span>;
}

function CreateStoreForm({ onCreated }) {
  const { fetchWithAuth } = useAuth();
  const [name, setName] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const autoSlug = (n) => n.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  const handleNameChange = (e) => {
    setName(e.target.value);
    setSlug(autoSlug(e.target.value));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim()) { setError("Store name is required"); return; }
    setLoading(true); setError("");
    try {
      const data = await fetchWithAuth("/api/seller/stores", {
        method: "POST",
        body: JSON.stringify({ store_name: name.trim(), store_slug: slug }),
      });
      onCreated(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card style={{ maxWidth: 480 }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>🏪</div>
      <h2 style={{ fontSize: 20, fontWeight: 900, color: COLORS.ink, margin: "0 0 8px" }}>Create your first store</h2>
      <p style={{ fontSize: 13, color: COLORS.olive, margin: "0 0 24px" }}>
        You need a store before you can list products.
      </p>
      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 800, color: COLORS.olive, display: "block", marginBottom: 6 }}>Store name</label>
          <input value={name} onChange={handleNameChange} placeholder="e.g. Tech Haven"
            style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1.5px solid rgba(32,29,24,0.2)`, fontSize: 14, fontWeight: 700, boxSizing: "border-box" }} />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 800, color: COLORS.olive, display: "block", marginBottom: 6 }}>Store URL slug</label>
          <div style={{ display: "flex", alignItems: "center", border: `1.5px solid rgba(32,29,24,0.2)`, borderRadius: 10, overflow: "hidden" }}>
            <span style={{ padding: "10px 12px", background: COLORS.soft, fontSize: 12, color: COLORS.olive, fontWeight: 700, whiteSpace: "nowrap" }}>/s/</span>
            <input value={slug} onChange={(e) => setSlug(autoSlug(e.target.value))} placeholder="tech-haven"
              style={{ flex: 1, padding: "10px 12px", border: "none", fontSize: 14, fontWeight: 700, outline: "none", background: "transparent" }} />
          </div>
        </div>
        {error && <p style={{ fontSize: 13, color: "#dc2626", fontWeight: 700, margin: 0 }}>{error}</p>}
        <button type="submit" disabled={loading}
          style={{ padding: "12px", background: COLORS.primary, color: COLORS.ink, fontWeight: 900, fontSize: 14, borderRadius: 10, border: "none", cursor: loading ? "not-allowed" : "pointer" }}>
          {loading ? "Creating..." : "Create store"}
        </button>
      </form>
    </Card>
  );
}

export default function SellerDashboardPage() {
  const { fetchWithAuth } = useAuth();
  const [stores, setStores] = React.useState(null); // null = loading
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  const loadStores = React.useCallback(async () => {
    try {
      const d = await fetchWithAuth("/api/seller/stores");
      setStores(d.data || []);
    } catch (err) {
      console.error(err);
      setStores([]);
    }
  }, [fetchWithAuth]);

  const loadDashboard = React.useCallback(async () => {
    try {
      const d = await fetchWithAuth("/api/seller/dashboard");
      setData(d.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth]);

  React.useEffect(() => {
    loadStores();
    loadDashboard();
  }, []);

  // Loading
  if (stores === null || loading) {
    return <p style={{ color: COLORS.olive, fontWeight: 700 }}>Loading dashboard...</p>;
  }

  // No stores yet — show create store form
  if (stores.length === 0) {
    return <CreateStoreForm onCreated={(store) => setStores([store])} />;
  }

  if (!data) return <p style={{ color: "#dc2626", fontWeight: 700 }}>Failed to load dashboard.</p>;

  const { stats, recent_orders } = data;
  const STAT_CARDS = [
    { label: "Total orders", value: stats.total_orders, link: "/seller/orders" },
    { label: "Pending orders", value: stats.pending_orders, link: "/seller/orders?status=pending" },
    { label: "Active products", value: stats.active_products, link: "/seller/products" },
    { label: "Net earnings", value: `৳${Number(stats.total_revenue).toLocaleString("en-BD")}`, link: "/seller/payouts" },
    { label: "Commissions paid", value: `৳${Number(stats.total_commissions).toLocaleString("en-BD")}`, color: "#dc2626", link: "/seller/payouts" },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: COLORS.ink, margin: 0 }}>Dashboard</h1>
        <div style={{ display: "flex", gap: 10 }}>
          {stores.map((s) => (
            <span key={s.store_id} style={{ fontSize: 12, fontWeight: 800, padding: "6px 12px", background: COLORS.soft, borderRadius: 8, color: COLORS.ink }}>
              🏪 {s.store_name}
            </span>
          ))}
          <Link to="/seller/store" style={{ fontSize: 12, fontWeight: 800, padding: "6px 12px", background: "transparent", border: `1px solid ${COLORS.olive}`, borderRadius: 8, color: COLORS.olive, textDecoration: "none" }}>
            + New store
          </Link>
        </div>
      </div>

      {/* Pending store approval banners */}
      {stores.filter((s) => s.store_status === "pending").map((s) => (
        <div key={s.store_id} style={{
          display: "flex", alignItems: "center", gap: 12,
          background: "#FEF9C3", border: "1px solid #FDE047",
          borderRadius: 12, padding: "12px 16px", marginBottom: 16,
          fontSize: 13, fontWeight: 700, color: "#A16207",
        }}>
          <span style={{ fontSize: 18 }}>⏳</span>
          <span>
            <strong>{s.store_name}</strong> is pending admin approval. Your products will go live once approved — usually within 24 hours.
          </span>
        </div>
      ))}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 14, marginBottom: 32 }}>
        {STAT_CARDS.map((s) => (
          <Link key={s.label} to={s.link} style={{ textDecoration: "none" }}>
            <Card style={{ padding: 20 }}>
              <p style={{ fontSize: 12, color: COLORS.olive, fontWeight: 700, margin: "0 0 8px", textTransform: "uppercase", letterSpacing: 0.5 }}>{s.label}</p>
              <p style={{ fontSize: 26, fontWeight: 900, color: s.color || COLORS.ink, margin: 0 }}>{s.value}</p>
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ fontSize: 15, fontWeight: 900, color: COLORS.ink, margin: 0 }}>Recent orders</h2>
          <Link to="/seller/orders" style={{ fontSize: 13, color: COLORS.olive, fontWeight: 700, textDecoration: "none" }}>View all →</Link>
        </div>
        {recent_orders.length === 0 ? (
          <p style={{ color: COLORS.olive, fontSize: 13 }}>No orders yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {recent_orders.map((o) => (
              <Link key={o.seller_order_id} to={`/seller/orders/${o.seller_order_id}`} style={{ textDecoration: "none" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", background: COLORS.soft, borderRadius: 12 }}>
                  <div>
                    <p style={{ fontWeight: 800, fontSize: 13, color: COLORS.ink, margin: "0 0 3px" }}>Order #{o.order_id}</p>
                    <p style={{ fontSize: 11, color: COLORS.olive, margin: 0 }}>{o.item_count} item{o.item_count !== 1 ? "s" : ""} · {new Date(o.created_at).toLocaleDateString("en-BD")}</p>
                  </div>
                  <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                    <p style={{ fontWeight: 900, fontSize: 14, color: COLORS.ink, margin: 0 }}>৳{Number(o.subtotal).toLocaleString("en-BD")}</p>
                    <StatusBadge status={o.status} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

