import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/useAuth.jsx";

const COLORS = {
  bg: "#FDFDF9", soft: "#FBEF9C",
  primary: "#FEE32B", olive: "#877928", ink: "#201D18",
};

const NAV = [
  { to: "/seller/dashboard", label: "Dashboard" },
  { to: "/seller/orders",    label: "Orders" },
  { to: "/seller/products",  label: "Products" },
  { to: "/seller/shipments", label: "Shipments" },
  { to: "/seller/payouts",   label: "Payouts" },
  { to: "/seller/returns",   label: "Returns" },
  { to: "/seller/store",     label: "Store settings" },
  { to: "/seller/qna",       label: "Q&A" },
];

export default function SellerLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => { await logout(); navigate("/"); };

  return (
    <div style={{
      minHeight: "100vh", display: "grid",
      gridTemplateColumns: "220px 1fr",
      background: COLORS.soft, fontFamily: "system-ui, sans-serif",
    }}>
      {/* Sidebar */}
      <aside style={{
        background: COLORS.ink, padding: "24px 0",
        display: "flex", flexDirection: "column",
      }}>
        <div style={{ padding: "0 20px 24px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
          <p style={{ fontSize: 11, fontWeight: 900, color: COLORS.primary, letterSpacing: 1, margin: "0 0 4px", textTransform: "uppercase" }}>
            Seller portal
          </p>
          <p style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.8)", margin: 0 }}>
            {user?.name || "Seller"}
          </p>
        </div>

        <nav style={{ padding: "16px 12px", flex: 1 }}>
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              style={({ isActive }) => ({
                display: "block", padding: "10px 12px", marginBottom: 2,
                borderRadius: 10, textDecoration: "none", fontSize: 13, fontWeight: 700,
                background: isActive ? COLORS.primary : "transparent",
                color: isActive ? COLORS.ink : "rgba(255,255,255,0.7)",
                transition: "all 0.15s",
              })}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: "16px 12px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          <button
            onClick={handleLogout}
            style={{
              width: "100%", padding: "10px", background: "transparent",
              border: "1px solid rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.7)",
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