import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/useAuth.jsx";

const C = {
  bg: "#FDFDF9",
  soft: "#FBEF9C",
  primary: "#FEE32B",
  olive: "#877928",
  ink: "#201D18",
  red: "#dc2626",
};

const NAV = [
  { to: "/admin/dashboard",         label: "Dashboard",         icon: "◈" },
  { to: "/admin/users",             label: "Users & Sellers",   icon: "◉" },
  { to: "/admin/reports",           label: "Reports",           icon: "⚑" },
  { to: "/admin/campaigns",         label: "Campaigns",         icon: "◆" },
  { to: "/admin/commissions",       label: "Commissions",       icon: "◐" },
  { to: "/admin/payouts",           label: "Payouts",           icon: "◑" },
  { to: "/admin/audit-logs",        label: "Audit Logs",        icon: "▦" },
  { to: "/admin/dashboard-builder", label: "KPI Builder",       icon: "◩" },
  { to: "/admin/stores",            label: "Store Approvals",   icon: "🏪" },
  { to: "/admin/product-views",     label: "Product Views",     icon: "👁" },
  { to: "/admin/couriers",          label: "Couriers",          icon: "📦" },
  { to: "/admin/coupons",           label: "Coupons",           icon: "🏷" },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "grid",
      gridTemplateColumns: "220px 1fr",
      background: C.soft,
      fontFamily: "system-ui, sans-serif",
    }}>
      {/* Sidebar */}
      <aside style={{
        background: C.ink,
        padding: "24px 0",
        display: "flex",
        flexDirection: "column",
        position: "sticky",
        top: 0,
        height: "100vh",
        overflowY: "auto",
      }}>
        <div style={{ padding: "0 20px 20px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
          <p style={{
            fontSize: 10, fontWeight: 900, color: C.primary,
            letterSpacing: 2, margin: "0 0 4px", textTransform: "uppercase",
          }}>
            Admin Control
          </p>
          <p style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.8)", margin: 0 }}>
            {user?.name || "Administrator"}
          </p>
        </div>

        <nav style={{ padding: "14px 12px", flex: 1 }}>
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              style={({ isActive }) => ({
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 12px",
                marginBottom: 2,
                borderRadius: 10,
                textDecoration: "none",
                fontSize: 13,
                fontWeight: 700,
                background: isActive ? C.primary : "transparent",
                color: isActive ? C.ink : "rgba(255,255,255,0.65)",
                transition: "all 0.15s",
              })}
            >
              <span style={{ fontSize: 14, lineHeight: 1 }}>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: "16px 12px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          <button
            onClick={handleLogout}
            style={{
              width: "100%", padding: "10px",
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.2)",
              color: "rgba(255,255,255,0.65)",
              borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer",
            }}
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ padding: 28, overflowY: "auto" }}>
        <Outlet />
      </main>
    </div>
  );
}