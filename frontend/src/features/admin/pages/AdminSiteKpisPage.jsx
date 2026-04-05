import React from "react";
import { useAuth } from "../../../auth/useAuth.jsx";

const C = {
  bg: "#FDFDF9",
  soft: "#FBEF9C",
  primary: "#FEE32B",
  olive: "#877928",
  ink: "#201D18",
};

function Card({ children, style }) {
  return (
    <div style={{
      background: C.bg,
      border: "1px solid rgba(32,29,24,0.12)",
      borderRadius: 16,
      padding: 20,
      boxShadow: "0 6px 20px rgba(32,29,24,0.08)",
      ...style,
    }}>
      {children}
    </div>
  );
}

function Metric({ label, value, format = 'number' }) {
  const fmt = (v) => {
    if (format === 'currency') return `৳${Number(v).toLocaleString("en-IN")}`;
    if (format === 'date') return new Date(v).toLocaleDateString();
    return v.toLocaleString();
  };

  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 24, fontWeight: 900, color: C.ink }}>{fmt(value)}</div>
      <div style={{ fontSize: 12, color: C.olive, marginTop: 4 }}>{label}</div>
    </div>
  );
}

export default function AdminSiteKpisPage() {
  const { fetchWithAuth } = useAuth();

  const [kpis, setKpis] = React.useState([]);
  const [totals, setTotals] = React.useState({});
  const [loading, setLoading] = React.useState(true);
  const [groupBy, setGroupBy] = React.useState('day');
  const [fromDate, setFromDate] = React.useState('');
  const [toDate, setToDate] = React.useState('');

  const loadKpis = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ group_by: groupBy });
      if (fromDate) params.set('from', fromDate);
      if (toDate) params.set('to', toDate);

      const response = await fetchWithAuth(`/api/admin/site-kpis?${params}`);
      setKpis(response.data || []);
      setTotals(response.totals || {});
    } catch (err) {
      console.error(err);
      setKpis([]);
      setTotals({});
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth, groupBy, fromDate, toDate]);

  React.useEffect(() => {
    loadKpis();
  }, [loadKpis]);

  const handleApplyFilters = () => {
    loadKpis();
  };

  const handleClearFilters = () => {
    setFromDate('');
    setToDate('');
    setGroupBy('day');
  };

  const handleRefresh = () => {
    loadKpis();
  };

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", color: C.ink }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, margin: 0 }}>Site KPIs</h1>
        <p style={{ fontSize: 13, color: C.olive, margin: "6px 0 0" }}>
          Daily aggregated metrics for users, sellers, orders, and revenue.
        </p>
      </div>

      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div>
            <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 700, color: C.olive }}>
              Group by
            </label>
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value)}
              style={{
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid rgba(32,29,24,0.16)",
                fontSize: 13,
              }}
            >
              <option value="day">Day</option>
              <option value="month">Month</option>
            </select>
          </div>
          <div>
            <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 700, color: C.olive }}>
              From
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              style={{
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid rgba(32,29,24,0.16)",
                fontSize: 13,
              }}
            />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 700, color: C.olive }}>
              To
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              style={{
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid rgba(32,29,24,0.16)",
                fontSize: 13,
              }}
            />
          </div>
          <button
            onClick={handleApplyFilters}
            style={{
              padding: "10px 18px",
              borderRadius: 10,
              border: "none",
              background: C.primary,
              color: C.ink,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Apply
          </button>
          <button
            onClick={handleClearFilters}
            style={{
              padding: "10px 18px",
              borderRadius: 10,
              border: "1px solid rgba(32,29,24,0.16)",
              background: "transparent",
              color: C.olive,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Clear
          </button>
          <button
            onClick={handleRefresh}
            style={{
              padding: "10px 18px",
              borderRadius: 10,
              border: "1px solid rgba(32,29,24,0.16)",
              background: C.bg,
              color: C.ink,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Refresh
          </button>
        </div>
      </Card>

      <div style={{ display: "grid", gap: 20, gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
        <Card>
          <Metric label="New Users" value={totals.new_users || 0} />
        </Card>
        <Card>
          <Metric label="New Sellers" value={totals.new_sellers || 0} />
        </Card>
        <Card>
          <Metric label="Total Orders" value={totals.total_orders || 0} />
        </Card>
        <Card>
          <Metric label="Gross Merchandise Value" value={totals.gross_merch_value || 0} format="currency" />
        </Card>
        <Card>
          <Metric label="Net Revenue" value={totals.net_revenue || 0} format="currency" />
        </Card>
        <Card>
          <Metric label="Refunds Total" value={totals.refunds_total || 0} format="currency" />
        </Card>
      </div>

      <Card style={{ marginTop: 20, overflowX: "auto" }}>
        <h2 style={{ fontSize: 16, fontWeight: 900, margin: "0 0 16px" }}>
          {groupBy === 'day' ? 'Daily' : 'Monthly'} Breakdown
        </h2>
        {loading ? (
          <p style={{ color: C.olive, padding: 28, margin: 0 }}>Loading KPIs…</p>
        ) : kpis.length === 0 ? (
          <p style={{ color: C.olive, padding: 28, margin: 0 }}>No KPI data for the selected period.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(32,29,24,0.12)" }}>
                <th style={{ textAlign: "left", padding: "10px 10px", color: C.olive }}>
                  {groupBy === 'day' ? 'Date' : 'Month'}
                </th>
                <th style={{ textAlign: "right", padding: "10px 10px", color: C.olive }}>New Users</th>
                <th style={{ textAlign: "right", padding: "10px 10px", color: C.olive }}>New Sellers</th>
                <th style={{ textAlign: "right", padding: "10px 10px", color: C.olive }}>Orders</th>
                <th style={{ textAlign: "right", padding: "10px 10px", color: C.olive }}>GMV</th>
                <th style={{ textAlign: "right", padding: "10px 10px", color: C.olive }}>Net Revenue</th>
                <th style={{ textAlign: "right", padding: "10px 10px", color: C.olive }}>Refunds</th>
              </tr>
            </thead>
            <tbody>
              {kpis.map((kpi, index) => (
                <tr key={index} style={{ borderBottom: "1px solid rgba(32,29,24,0.08)" }}>
                  <td style={{ padding: "12px 10px", fontWeight: 700 }}>
                    {groupBy === 'day'
                      ? new Date(kpi.kpi_date || kpi.period).toLocaleDateString()
                      : new Date(kpi.period).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
                    }
                  </td>
                  <td style={{ padding: "12px 10px", textAlign: "right" }}>{kpi.new_users.toLocaleString()}</td>
                  <td style={{ padding: "12px 10px", textAlign: "right" }}>{kpi.new_sellers.toLocaleString()}</td>
                  <td style={{ padding: "12px 10px", textAlign: "right" }}>{kpi.total_orders.toLocaleString()}</td>
                  <td style={{ padding: "12px 10px", textAlign: "right" }}>৳{Number(kpi.gross_merch_value).toLocaleString("en-IN")}</td>
                  <td style={{ padding: "12px 10px", textAlign: "right" }}>৳{Number(kpi.net_revenue).toLocaleString("en-IN")}</td>
                  <td style={{ padding: "12px 10px", textAlign: "right" }}>৳{Number(kpi.refunds_total).toLocaleString("en-IN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}