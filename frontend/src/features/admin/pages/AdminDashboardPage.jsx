import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../auth/useAuth.jsx";

const C = {
  bg: "#FDFDF9", soft: "#FBEF9C", primary: "#FEE32B",
  olive: "#877928", ink: "#201D18",
};

function Card({ children, style }) {
  return (
    <div style={{
      background: C.bg, border: "1px solid rgba(32,29,24,0.12)",
      borderRadius: 16, padding: 20,
      boxShadow: "0 4px 16px rgba(32,29,24,0.06)", ...style,
    }}>
      {children}
    </div>
  );
}

function StatCard({ label, value, sub, link, accent }) {
  const inner = (
    <Card style={{ padding: 20, borderLeft: `4px solid ${accent || C.primary}` }}>
      <p style={{ fontSize: 11, color: C.olive, fontWeight: 800, margin: "0 0 8px", textTransform: "uppercase", letterSpacing: 0.5 }}>
        {label}
      </p>
      <p style={{ fontSize: 28, fontWeight: 900, color: C.ink, margin: "0 0 4px" }}>{value}</p>
      {sub && <p style={{ fontSize: 11, color: C.olive, margin: 0 }}>{sub}</p>}
    </Card>
  );
  return link ? <Link to={link} style={{ textDecoration: "none" }}>{inner}</Link> : inner;
}

// Tiny bar chart using divs
function BarChart({ data, valueKey, labelKey, color = C.primary, height = 80 }) {
  if (!data || data.length === 0) return <p style={{ color: C.olive, fontSize: 13 }}>No data</p>;
  const max = Math.max(...data.map((d) => Number(d[valueKey]) || 0), 1);
  const show = data.slice(-14);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height }}>
      {show.map((d, i) => {
        const val = Number(d[valueKey]) || 0;
        const pct = (val / max) * 100;
        return (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            <div title={`${d[labelKey]}: ${val}`} style={{
              width: "100%", height: `${pct}%`, minHeight: pct > 0 ? 2 : 0,
              background: color, borderRadius: "3px 3px 0 0", transition: "height 0.3s",
            }} />
          </div>
        );
      })}
    </div>
  );
}

export default function AdminDashboardPage() {
  const { fetchWithAuth } = useAuth();
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    (async () => {
      try {
        const d = await fetchWithAuth("/api/admin/dashboard");
        setData(d.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <p style={{ color: C.olive, fontWeight: 700 }}>Loading dashboard...</p>;
  if (error) return <p style={{ color: "#dc2626", fontWeight: 700 }}>{error}</p>;
  if (!data) return null;

  const { stats, kpis, traffic, finance, coupons } = data;
  const fmt = (n) => Number(n || 0).toLocaleString("en-BD");
  const fmtMoney = (n) => `৳${Number(n || 0).toLocaleString("en-BD")}`;

  const STATS = [
    { label: "Total Users",      value: fmt(stats.total_users),    link: "/admin/users",       accent: C.primary },
    { label: "Total Sellers",    value: fmt(stats.total_sellers),  link: "/admin/users?role=seller", accent: "#a3e635" },
    { label: "Total Orders",     value: fmt(stats.total_orders),   accent: "#38bdf8" },
    { label: "Gross Merch Value",value: fmtMoney(stats.gmv),       accent: "#fb923c" },
    { label: "Net Revenue",      value: fmtMoney(stats.net_revenue), accent: "#4ade80" },
    { label: "Pending KYC",      value: fmt(stats.pending_kyc),    link: "/admin/users?kyc=pending", accent: "#f59e0b", sub: "sellers awaiting review" },
    { label: "Open Reports",     value: fmt(stats.pending_reports), link: "/admin/reports",    accent: "#f87171", sub: "need resolution" },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: C.ink, margin: 0 }}>Admin Dashboard</h1>
        <span style={{ fontSize: 12, fontWeight: 800, color: C.olive, padding: "6px 14px", background: C.soft, borderRadius: 8 }}>
          Super Admin
        </span>
      </div>

      {/* Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(175px, 1fr))", gap: 12, marginBottom: 28 }}>
        {STATS.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      {/* Charts Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 16, marginBottom: 28 }}>
        <Card>
          <p style={{ fontSize: 13, fontWeight: 900, color: C.ink, margin: "0 0 4px" }}>Orders (last 14 days)</p>
          <p style={{ fontSize: 11, color: C.olive, margin: "0 0 12px" }}>Daily order volume</p>
          <BarChart data={kpis} valueKey="total_orders" labelKey="kpi_date" color={C.primary} />
        </Card>
        <Card>
          <p style={{ fontSize: 13, fontWeight: 900, color: C.ink, margin: "0 0 4px" }}>GMV (last 14 days)</p>
          <p style={{ fontSize: 11, color: C.olive, margin: "0 0 12px" }}>Gross merchandise value</p>
          <BarChart data={kpis} valueKey="gross_merch_value" labelKey="kpi_date" color="#fb923c" />
        </Card>
        <Card>
          <p style={{ fontSize: 13, fontWeight: 900, color: C.ink, margin: "0 0 4px" }}>New Users (last 14 days)</p>
          <p style={{ fontSize: 11, color: C.olive, margin: "0 0 12px" }}>User registrations</p>
          <BarChart data={kpis} valueKey="new_users" labelKey="kpi_date" color="#38bdf8" />
        </Card>
        <Card>
          <p style={{ fontSize: 13, fontWeight: 900, color: C.ink, margin: "0 0 4px" }}>Commissions (last 14 days)</p>
          <p style={{ fontSize: 11, color: C.olive, margin: "0 0 12px" }}>Platform earnings</p>
          <BarChart data={finance} valueKey="commission_total" labelKey="kpi_date" color="#4ade80" />
        </Card>
        <Card>
          <p style={{ fontSize: 13, fontWeight: 900, color: C.ink, margin: "0 0 4px" }}>Coupon Usage (last 14 days)</p>
          <p style={{ fontSize: 11, color: C.olive, margin: "0 0 12px" }}>Orders with coupons applied</p>
          <BarChart data={coupons} valueKey="coupon_orders" labelKey="coupon_date" color="#a855f7" />
        </Card>
      </div>

      {/* Quick Links */}
      <Card>
        <p style={{ fontSize: 14, fontWeight: 900, color: C.ink, margin: "0 0 14px" }}>Quick Actions</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          {[
            { to: "/admin/users?kyc=pending", label: "Review KYC", color: "#f59e0b" },
            { to: "/admin/reports",           label: "Resolve Reports", color: "#f87171" },
            { to: "/admin/campaigns",         label: "Manage Campaigns", color: C.primary },
            { to: "/admin/commissions",       label: "Set Commissions", color: "#4ade80" },
            { to: "/admin/payouts",           label: "Process Payouts", color: "#38bdf8" },
            { to: "/admin/audit-logs",        label: "View Audit Log", color: C.olive },
          ].map((a) => (
            <Link key={a.to} to={a.to} style={{
              padding: "10px 18px", borderRadius: 10,
              background: a.color, color: C.ink,
              fontWeight: 900, fontSize: 13, textDecoration: "none",
            }}>
              {a.label}
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}


