import React from "react";
import { useSearchParams } from "react-router-dom";
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

function Badge({ label, bg, text }) {
  return (
    <span style={{
      background: bg, color: text,
      fontWeight: 800, fontSize: 11,
      padding: "3px 9px", borderRadius: 999, textTransform: "capitalize",
    }}>
      {label}
    </span>
  );
}

const KYC_COLORS = {
  pending:  { bg: "#FEF9C3", text: "#854D0E" },
  verified: { bg: "#DCFCE7", text: "#166534" },
  rejected: { bg: "#FEE2E2", text: "#991B1B" },
};
const ROLE_COLORS = {
  admin:  { bg: "#E0E7FF", text: "#3730A3" },
  seller: { bg: "#FBEF9C", text: "#877928" },
  user:   { bg: "#F1F5F9", text: "#475569" },
};

function InputStyle({ value, onChange, placeholder, style }) {
  return (
    <input
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      style={{
        padding: "9px 14px", borderRadius: 10,
        border: "1.5px solid rgba(32,29,24,0.2)",
        fontSize: 13, fontWeight: 700,
        background: C.bg, color: C.ink, outline: "none",
        ...style,
      }}
    />
  );
}

export default function AdminUsersPage() {
  const { fetchWithAuth } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [users, setUsers] = React.useState([]);
  const [meta, setMeta] = React.useState({ total: 0, page: 1, limit: 20 });
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState(searchParams.get("search") || "");
  const [roleFilter, setRoleFilter] = React.useState(searchParams.get("role") || "");
  const [actionLoading, setActionLoading] = React.useState(null);
  const [page, setPage] = React.useState(1);

  const loadUsers = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (roleFilter) params.set("role", roleFilter);
      if (search) params.set("search", search);
      const d = await fetchWithAuth(`/api/admin/users?${params}`);
      setUsers(d.data || []);
      setMeta(d.meta || { total: 0, page: 1, limit: 20 });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth, page, roleFilter, search]);

  React.useEffect(() => { loadUsers(); }, [loadUsers]);

  const toggleActive = async (user) => {
    setActionLoading(`active-${user.user_id}`);
    try {
      await fetchWithAuth(`/api/admin/users/${user.user_id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ is_active: !user.is_active }),
      });
      setUsers((prev) =>
        prev.map((u) => u.user_id === user.user_id ? { ...u, is_active: !u.is_active } : u)
      );
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const setKyc = async (user, kyc_status) => {
    setActionLoading(`kyc-${user.seller_id}`);
    try {
      await fetchWithAuth(`/api/admin/sellers/${user.seller_id}/kyc`, {
        method: "PATCH",
        body: JSON.stringify({ kyc_status }),
      });
      setUsers((prev) =>
        prev.map((u) => u.user_id === user.user_id ? { ...u, kyc_status } : u)
      );
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const totalPages = Math.ceil(meta.total / meta.limit);

  const selectStyle = {
    padding: "9px 14px", borderRadius: 10,
    border: "1.5px solid rgba(32,29,24,0.2)",
    fontSize: 13, fontWeight: 700,
    background: C.bg, color: C.ink, cursor: "pointer",
  };

  const btnStyle = (bg, fg) => ({
    padding: "5px 12px", borderRadius: 8,
    background: bg, color: fg || C.ink,
    fontWeight: 800, fontSize: 11, border: "none", cursor: "pointer",
  });

  return (
    <div>
      <h1 style={{ fontSize: 26, fontWeight: 900, color: C.ink, margin: "0 0 24px" }}>
        Users & Sellers
      </h1>

      {/* Filters */}
      <Card style={{ marginBottom: 16, padding: 16 }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <InputStyle
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or email..."
            style={{ flex: "1 1 200px" }}
          />
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
            style={selectStyle}
          >
            <option value="">All roles</option>
            <option value="user">Customer</option>
            <option value="seller">Seller</option>
            <option value="admin">Admin</option>
          </select>
          <button
            onClick={() => { setPage(1); loadUsers(); }}
            style={btnStyle(C.primary)}
          >
            Search
          </button>
          <span style={{ fontSize: 12, color: C.olive, fontWeight: 700, marginLeft: "auto" }}>
            {meta.total} total
          </span>
        </div>
      </Card>

      {/* Table */}
      <Card style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <p style={{ padding: 24, color: C.olive, fontWeight: 700 }}>Loading users...</p>
        ) : users.length === 0 ? (
          <p style={{ padding: 24, color: C.olive, fontWeight: 700 }}>No users found.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: C.soft }}>
                  {["ID", "Name", "Email", "Role", "Active", "Email Verified", "KYC", "Actions"].map((h) => (
                    <th key={h} style={{
                      padding: "12px 16px", textAlign: "left",
                      fontSize: 11, fontWeight: 900, color: C.olive,
                      textTransform: "uppercase", letterSpacing: 0.5,
                      borderBottom: "1px solid rgba(32,29,24,0.1)",
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <tr
                    key={u.user_id}
                    style={{
                      background: i % 2 === 0 ? C.bg : "rgba(251,239,156,0.2)",
                      borderBottom: "1px solid rgba(32,29,24,0.06)",
                    }}
                  >
                    <td style={{ padding: "12px 16px", fontSize: 12, color: C.olive, fontWeight: 700 }}>#{u.user_id}</td>
                    <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 800, color: C.ink }}>{u.name}</td>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: C.olive }}>{u.email}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <Badge label={u.role} {...(ROLE_COLORS[u.role] || { bg: C.soft, text: C.olive })} />
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <Badge
                        label={u.is_active ? "Active" : "Inactive"}
                        bg={u.is_active ? "#DCFCE7" : "#FEE2E2"}
                        text={u.is_active ? "#166534" : "#991B1B"}
                      />
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <Badge
                        label={u.email_verified ? "Yes" : "No"}
                        bg={u.email_verified ? "#DCFCE7" : "#F1F5F9"}
                        text={u.email_verified ? "#166534" : "#475569"}
                      />
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      {u.kyc_status ? (
                        <Badge label={u.kyc_status} {...(KYC_COLORS[u.kyc_status] || {})} />
                      ) : (
                        <span style={{ fontSize: 11, color: "rgba(32,29,24,0.3)" }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <button
                          onClick={() => toggleActive(u)}
                          disabled={actionLoading === `active-${u.user_id}`}
                          style={btnStyle(u.is_active ? "#FEE2E2" : "#DCFCE7", u.is_active ? "#991B1B" : "#166534")}
                        >
                          {u.is_active ? "Deactivate" : "Activate"}
                        </button>
                        {u.role === "seller" && u.kyc_status === "pending" && (
                          <>
                            <button
                              onClick={() => setKyc(u, "verified")}
                              disabled={actionLoading === `kyc-${u.seller_id}`}
                              style={btnStyle("#DCFCE7", "#166534")}
                            >
                              Verify KYC
                            </button>
                            <button
                              onClick={() => setKyc(u, "rejected")}
                              disabled={actionLoading === `kyc-${u.seller_id}`}
                              style={btnStyle("#FEE2E2", "#991B1B")}
                            >
                              Reject KYC
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 16 }}>
          {Array.from({ length: Math.min(totalPages, 8) }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              style={{
                width: 36, height: 36, borderRadius: 8,
                border: "1.5px solid rgba(32,29,24,0.15)",
                background: page === p ? C.primary : C.bg,
                fontWeight: 900, fontSize: 13, cursor: "pointer",
                color: C.ink,
              }}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}


