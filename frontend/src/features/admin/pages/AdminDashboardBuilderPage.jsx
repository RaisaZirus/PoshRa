import React from "react";
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

// Sparkline via SVG
function Sparkline({ data, color = C.primary, height = 48 }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const w = 200;
  const h = height;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ height }}>
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <polyline
        points={`0,${h} ${pts} ${w},${h}`}
        fill={color}
        opacity="0.12"
        strokeWidth="0"
      />
    </svg>
  );
}

function KpiCard({ title, value, sub, data, color, fmt }) {
  const vals = data?.map((d) => Number(d.value) || 0) || [];
  return (
    <Card style={{ padding: 20 }}>
      <p style={{ fontSize: 11, fontWeight: 900, color: C.olive, margin: "0 0 6px", textTransform: "uppercase", letterSpacing: 0.5 }}>
        {title}
      </p>
      <p style={{ fontSize: 28, fontWeight: 900, color: C.ink, margin: "0 0 2px" }}>
        {fmt ? fmt(value) : value}
      </p>
      {sub && <p style={{ fontSize: 11, color: C.olive, margin: "0 0 12px", fontWeight: 700 }}>{sub}</p>}
      {vals.length > 1 && <Sparkline data={vals} color={color || C.primary} height={44} />}
    </Card>
  );
}

const DATE_RANGES = [
  { label: "7 days",  days: 7 },
  { label: "14 days", days: 14 },
  { label: "30 days", days: 30 },
];

export default function AdminDashboardBuilderPage() {
  const { fetchWithAuth } = useAuth();
  const [rawData, setRawData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [range, setRange] = React.useState(14);
  const [activeTab, setActiveTab] = React.useState("site"); // site | traffic | finance

  React.useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const d = await fetchWithAuth("/api/admin/dashboard");
        setRawData(d.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <p style={{ color: C.olive, fontWeight: 700 }}>Loading KPI data...</p>;
  if (!rawData) return <p style={{ color: "#dc2626", fontWeight: 700 }}>Failed to load KPIs.</p>;

  const slice = (arr) => (arr || []).slice(-range);
  const kpis = slice(rawData.kpis);
  const traffic = slice(rawData.traffic);
  const finance = slice(rawData.finance);

  const sum = (arr, key) => arr.reduce((s, d) => s + (Number(d[key]) || 0), 0);
  const avg = (arr, key) => arr.length ? (sum(arr, key) / arr.length).toFixed(1) : 0;
  const fmtMoney = (n) => `৳${Number(n || 0).toLocaleString("en-BD")}`;
  const fmt2 = (n) => Number(n || 0).toLocaleString("en-BD");

  const TAB_STYLE = (active) => ({
    padding: "9px 20px", borderRadius: 10,
    background: active ? C.primary : "transparent",
    color: active ? C.ink : C.olive,
    fontWeight: 900, fontSize: 13, border: "none",
    cursor: "pointer", transition: "all 0.15s",
  });

  const btnRange = (d) => ({
    padding: "7px 16px", borderRadius: 8,
    background: range === d ? C.ink : C.soft,
    color: range === d ? C.primary : C.olive,
    fontWeight: 900, fontSize: 12, border: "none", cursor: "pointer",
  });

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: C.ink, margin: "0 0 4px" }}>KPI Dashboard</h1>
        <p style={{ fontSize: 13, color: C.olive, margin: 0, fontWeight: 700 }}>
          Platform performance metrics from daily snapshots.
        </p>
      </div>

      {/* Controls */}
      <Card style={{ marginBottom: 20, padding: 14 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          {/* Tabs */}
          <div style={{ display: "flex", gap: 4, background: C.soft, borderRadius: 12, padding: 4 }}>
            <button style={TAB_STYLE(activeTab === "site")}    onClick={() => setActiveTab("site")}>Site</button>
            <button style={TAB_STYLE(activeTab === "traffic")} onClick={() => setActiveTab("traffic")}>Traffic</button>
            <button style={TAB_STYLE(activeTab === "finance")} onClick={() => setActiveTab("finance")}>Finance</button>
          </div>

          {/* Date Range */}
          <div style={{ display: "flex", gap: 6, marginLeft: "auto" }}>
            {DATE_RANGES.map((r) => (
              <button key={r.days} onClick={() => setRange(r.days)} style={btnRange(r.days)}>
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Site KPIs */}
      {activeTab === "site" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14, marginBottom: 24 }}>
            <KpiCard
              title="New Users"
              value={fmt2(sum(kpis, "new_users"))}
              sub={`avg ${avg(kpis, "new_users")}/day`}
              data={kpis.map((d) => ({ value: d.new_users }))}
              color="#38bdf8"
            />
            <KpiCard
              title="New Sellers"
              value={fmt2(sum(kpis, "new_sellers"))}
              sub={`avg ${avg(kpis, "new_sellers")}/day`}
              data={kpis.map((d) => ({ value: d.new_sellers }))}
              color="#a3e635"
            />
            <KpiCard
              title="Total Orders"
              value={fmt2(sum(kpis, "total_orders"))}
              sub={`avg ${avg(kpis, "total_orders")}/day`}
              data={kpis.map((d) => ({ value: d.total_orders }))}
              color={C.primary}
            />
            <KpiCard
              title="Gross Merch Value"
              value={fmtMoney(sum(kpis, "gross_merch_value"))}
              sub="total GMV"
              data={kpis.map((d) => ({ value: d.gross_merch_value }))}
              color="#fb923c"
            />
            <KpiCard
              title="Net Revenue"
              value={fmtMoney(sum(kpis, "net_revenue"))}
              sub="platform net"
              data={kpis.map((d) => ({ value: d.net_revenue }))}
              color="#4ade80"
            />
            <KpiCard
              title="Refunds Total"
              value={fmtMoney(sum(kpis, "refunds_total"))}
              sub="total refunded"
              data={kpis.map((d) => ({ value: d.refunds_total }))}
              color="#f87171"
            />
          </div>

          {/* Data Table */}
          <Card style={{ padding: 0, overflow: "hidden" }}>
            <p style={{ padding: "14px 20px 0", fontSize: 13, fontWeight: 900, color: C.ink, margin: 0 }}>
              Daily Breakdown
            </p>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: C.soft }}>
                    {["Date", "New Users", "New Sellers", "Orders", "GMV", "Net Revenue", "Refunds"].map((h) => (
                      <th key={h} style={{
                        padding: "10px 14px", textAlign: "left",
                        fontSize: 10, fontWeight: 900, color: C.olive,
                        textTransform: "uppercase", letterSpacing: 0.5,
                        borderBottom: "1px solid rgba(32,29,24,0.1)",
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...kpis].reverse().map((d, i) => (
                    <tr key={d.kpi_date} style={{
                      background: i % 2 === 0 ? C.bg : "rgba(251,239,156,0.2)",
                      borderBottom: "1px solid rgba(32,29,24,0.05)",
                    }}>
                      <td style={{ padding: "9px 14px", fontSize: 12, fontWeight: 800, color: C.ink, whiteSpace: "nowrap" }}>{d.kpi_date}</td>
                      <td style={{ padding: "9px 14px", fontSize: 12, fontWeight: 700, color: C.ink }}>{d.new_users}</td>
                      <td style={{ padding: "9px 14px", fontSize: 12, fontWeight: 700, color: C.ink }}>{d.new_sellers}</td>
                      <td style={{ padding: "9px 14px", fontSize: 12, fontWeight: 700, color: C.ink }}>{d.total_orders}</td>
                      <td style={{ padding: "9px 14px", fontSize: 12, fontWeight: 700, color: C.ink }}>{fmtMoney(d.gross_merch_value)}</td>
                      <td style={{ padding: "9px 14px", fontSize: 12, fontWeight: 700, color: "#166534" }}>{fmtMoney(d.net_revenue)}</td>
                      <td style={{ padding: "9px 14px", fontSize: 12, fontWeight: 700, color: "#991B1B" }}>{fmtMoney(d.refunds_total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {/* Traffic KPIs */}
      {activeTab === "traffic" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14, marginBottom: 24 }}>
            <KpiCard
              title="Searches"
              value={fmt2(sum(traffic, "searches"))}
              sub={`avg ${avg(traffic, "searches")}/day`}
              data={traffic.map((d) => ({ value: d.searches }))}
              color="#38bdf8"
            />
            <KpiCard
              title="Product Clicks"
              value={fmt2(sum(traffic, "product_clicks"))}
              sub={`avg ${avg(traffic, "product_clicks")}/day`}
              data={traffic.map((d) => ({ value: d.product_clicks }))}
              color={C.primary}
            />
            <KpiCard
              title="Product Views"
              value={fmt2(sum(traffic, "product_views"))}
              sub={`avg ${avg(traffic, "product_views")}/day`}
              data={traffic.map((d) => ({ value: d.product_views }))}
              color="#fb923c"
            />
            <KpiCard
              title="Avg View Duration"
              value={`${avg(traffic, "avg_view_seconds")}s`}
              sub="seconds per product view"
              data={traffic.map((d) => ({ value: d.avg_view_seconds }))}
              color="#a3e635"
            />
          </div>

          <Card style={{ padding: 0, overflow: "hidden" }}>
            <p style={{ padding: "14px 20px 0", fontSize: 13, fontWeight: 900, color: C.ink, margin: 0 }}>Daily Traffic</p>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: C.soft }}>
                    {["Date", "Searches", "Product Clicks", "Product Views", "Avg View (s)"].map((h) => (
                      <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 10, fontWeight: 900, color: C.olive, textTransform: "uppercase", letterSpacing: 0.5, borderBottom: "1px solid rgba(32,29,24,0.1)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...traffic].reverse().map((d, i) => (
                    <tr key={d.kpi_date} style={{ background: i % 2 === 0 ? C.bg : "rgba(251,239,156,0.2)", borderBottom: "1px solid rgba(32,29,24,0.05)" }}>
                      <td style={{ padding: "9px 14px", fontSize: 12, fontWeight: 800, color: C.ink }}>{d.kpi_date}</td>
                      <td style={{ padding: "9px 14px", fontSize: 12, fontWeight: 700, color: C.ink }}>{d.searches}</td>
                      <td style={{ padding: "9px 14px", fontSize: 12, fontWeight: 700, color: C.ink }}>{d.product_clicks}</td>
                      <td style={{ padding: "9px 14px", fontSize: 12, fontWeight: 700, color: C.ink }}>{d.product_views}</td>
                      <td style={{ padding: "9px 14px", fontSize: 12, fontWeight: 700, color: C.ink }}>{Number(d.avg_view_seconds).toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {/* Finance KPIs */}
      {activeTab === "finance" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14, marginBottom: 24 }}>
            <KpiCard
              title="Commission Earned"
              value={fmtMoney(sum(finance, "commission_total"))}
              sub={`avg ${fmtMoney(avg(finance, "commission_total"))}/day`}
              data={finance.map((d) => ({ value: d.commission_total }))}
              color="#4ade80"
            />
            <KpiCard
              title="Payouts Requested"
              value={fmtMoney(sum(finance, "payouts_requested"))}
              sub="total requested"
              data={finance.map((d) => ({ value: d.payouts_requested }))}
              color="#fb923c"
            />
            <KpiCard
              title="Payouts Processed"
              value={fmtMoney(sum(finance, "payouts_processed"))}
              sub="total processed"
              data={finance.map((d) => ({ value: d.payouts_processed }))}
              color="#38bdf8"
            />
          </div>

          <Card style={{ padding: 0, overflow: "hidden" }}>
            <p style={{ padding: "14px 20px 0", fontSize: 13, fontWeight: 900, color: C.ink, margin: 0 }}>Daily Finance</p>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: C.soft }}>
                    {["Date", "Commission", "Payouts Requested", "Payouts Processed"].map((h) => (
                      <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 10, fontWeight: 900, color: C.olive, textTransform: "uppercase", letterSpacing: 0.5, borderBottom: "1px solid rgba(32,29,24,0.1)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...finance].reverse().map((d, i) => (
                    <tr key={d.kpi_date} style={{ background: i % 2 === 0 ? C.bg : "rgba(251,239,156,0.2)", borderBottom: "1px solid rgba(32,29,24,0.05)" }}>
                      <td style={{ padding: "9px 14px", fontSize: 12, fontWeight: 800, color: C.ink }}>{d.kpi_date}</td>
                      <td style={{ padding: "9px 14px", fontSize: 12, fontWeight: 700, color: "#166534" }}>{fmtMoney(d.commission_total)}</td>
                      <td style={{ padding: "9px 14px", fontSize: 12, fontWeight: 700, color: "#854D0E" }}>{fmtMoney(d.payouts_requested)}</td>
                      <td style={{ padding: "9px 14px", fontSize: 12, fontWeight: 700, color: "#0369A1" }}>{fmtMoney(d.payouts_processed)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}


