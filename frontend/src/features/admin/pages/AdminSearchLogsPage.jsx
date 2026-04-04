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

function Pill({ children }) {
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      padding: "6px 12px",
      borderRadius: 999,
      border: "1px solid rgba(32,29,24,0.14)",
      background: C.soft,
      color: C.ink,
      fontSize: 12,
      marginRight: 8,
      marginBottom: 8,
    }}>
      {children}
    </span>
  );
}

export default function AdminSearchLogsPage() {
  const { fetchWithAuth } = useAuth();

  const [logs, setLogs] = React.useState([]);
  const [topSearches, setTopSearches] = React.useState([]);
  const [page, setPage] = React.useState(1);
  const [meta, setMeta] = React.useState({ total: 0, page: 1, limit: 30 });
  const [queryFilter, setQueryFilter] = React.useState("");
  const [fromDate, setFromDate] = React.useState("");
  const [toDate, setToDate] = React.useState("");
  const [loading, setLoading] = React.useState(true);

  const loadLogs = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 30 });
      if (queryFilter) params.set("query", queryFilter);
      if (fromDate) params.set("from", fromDate);
      if (toDate) params.set("to", toDate);

      const response = await fetchWithAuth(`/api/admin/search-logs?${params}`);
      setLogs(response.data || []);
      setTopSearches(response.top_searches || []);
      setMeta(response.meta || { total: 0, page: 1, limit: 30 });
    } catch (err) {
      console.error(err);
      setLogs([]);
      setTopSearches([]);
      setMeta({ total: 0, page: 1, limit: 30 });
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth, page, queryFilter, fromDate, toDate]);

  React.useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const totalPages = Math.max(1, Math.ceil(meta.total / meta.limit));

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", color: C.ink }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, margin: 0 }}>Search Logs</h1>
        <p style={{ fontSize: 13, color: C.olive, margin: "6px 0 0" }}>
          Review search terms from customers and identify the most popular queries.
        </p>
      </div>

      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-end" }}>
          <div style={{ minWidth: 260 }}>
            <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 700, color: C.olive }}>
              Search phrase
            </label>
            <input
              type="text"
              value={queryFilter}
              onChange={(e) => { setQueryFilter(e.target.value); setPage(1); }}
              placeholder="Filter by query"
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid rgba(32,29,24,0.16)",
                fontSize: 13,
              }}
            />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 700, color: C.olive }}>
              From
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
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
              onChange={(e) => { setToDate(e.target.value); setPage(1); }}
              style={{
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid rgba(32,29,24,0.16)",
                fontSize: 13,
              }}
            />
          </div>
          <button
            type="button"
            onClick={() => { setQueryFilter(""); setFromDate(""); setToDate(""); setPage(1); }}
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
            Clear filters
          </button>
        </div>
      </Card>

      <div style={{ display: "grid", gap: 20, gridTemplateColumns: "1fr 320px" }}>
        <Card style={{ overflowX: "auto" }}>
          <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 900, margin: 0 }}>Recent search logs</h2>
              <p style={{ fontSize: 12, color: C.olive, margin: "4px 0 0" }}>
                {meta.total.toLocaleString()} records found
              </p>
            </div>
          </div>

          {loading ? (
            <p style={{ color: C.olive, padding: 28, margin: 0 }}>Loading logs…</p>
          ) : logs.length === 0 ? (
            <p style={{ color: C.olive, padding: 28, margin: 0 }}>No search logs match the filters.</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(32,29,24,0.12)" }}>
                  <th style={{ textAlign: "left", padding: "10px 10px", color: C.olive }}>Query</th>
                  <th style={{ textAlign: "left", padding: "10px 10px", color: C.olive }}>User</th>
                  <th style={{ textAlign: "left", padding: "10px 10px", color: C.olive }}>Filters</th>
                  <th style={{ textAlign: "right", padding: "10px 10px", color: C.olive }}>When</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.search_id} style={{ borderBottom: "1px solid rgba(32,29,24,0.08)" }}>
                    <td style={{ padding: "12px 10px", maxWidth: 260, wordBreak: "break-word" }}>{log.query}</td>
                    <td style={{ padding: "12px 10px" }}>
                      {log.user_name || log.user_email ? (
                        <>
                          <strong>{log.user_name || log.user_email}</strong>
                          <div style={{ fontSize: 12, color: C.olive }}>{log.user_email || "—"}</div>
                        </>
                      ) : (
                        <span style={{ color: C.olive }}>Guest</span>
                      )}
                    </td>
                    <td style={{ padding: "12px 10px", fontSize: 12, color: C.olive, maxWidth: 220, whiteSpace: "pre-wrap" }}>
                      {log.filters ? JSON.stringify(log.filters) : "—"}
                    </td>
                    <td style={{ padding: "12px 10px", textAlign: "right", color: C.olive, whiteSpace: "nowrap" }}>
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, flexWrap: "wrap", marginTop: 16 }}>
              <button
                type="button"
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page === 1}
                style={{
                  padding: "8px 14px",
                  borderRadius: 10,
                  border: "1px solid rgba(32,29,24,0.16)",
                  background: page === 1 ? "rgba(32,29,24,0.06)" : "transparent",
                  cursor: page === 1 ? "not-allowed" : "pointer",
                }}
              >
                Prev
              </button>
              <span style={{ alignSelf: "center", color: C.olive, fontSize: 13 }}>
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={page === totalPages}
                style={{
                  padding: "8px 14px",
                  borderRadius: 10,
                  border: "1px solid rgba(32,29,24,0.16)",
                  background: page === totalPages ? "rgba(32,29,24,0.06)" : "transparent",
                  cursor: page === totalPages ? "not-allowed" : "pointer",
                }}
              >
                Next
              </button>
            </div>
          )}
        </Card>

        <Card>
          <h2 style={{ fontSize: 16, fontWeight: 900, margin: "0 0 12px" }}>Top search phrases</h2>
          {topSearches.length === 0 ? (
            <p style={{ color: C.olive, margin: 0 }}>No top search data yet.</p>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {topSearches.map((item, index) => (
                <div key={`${item.query}-${index}`} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <span style={{ fontWeight: 700 }}>{index + 1}. {item.query}</span>
                  <span style={{ color: C.olive }}>{item.count.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
          <div style={{ marginTop: 20 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, margin: "0 0 10px" }}>Recent popular searches</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {topSearches.slice(0, 12).map((item, index) => (
                <Pill key={`${item.query}-${index}`}>{item.query}</Pill>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
