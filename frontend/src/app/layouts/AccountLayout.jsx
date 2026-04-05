import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const COLORS = {
  bg: "#FDFDF9",
  soft: "#FBEF9C",
  primary: "#FEE32B",
  olive: "#877928",
  ink: "#201D18",
};

export default function AccountLayout() {
  const sidebarStyle = {
    background: COLORS.ink,
    color: "#f8f1c2",
    padding: 24,
    display: "flex",
    flexDirection: "column",
    position: "sticky",
    top: 0,
    height: "100vh",
    overflowY: "auto",
  };

  const itemStyle = {
    display: "block",
    padding: "10px 12px",
    borderRadius: 10,
    textDecoration: "none",
    fontSize: 13,
    fontWeight: 700,
    color: "rgba(255,255,255,0.65)",
    transition: "all 0.15s",
  };

  const activeItemStyle = {
    background: COLORS.primary,
    color: COLORS.ink,
  };

  const wrapperStyle = {
    minHeight: "100vh",
    display: "grid",
    gridTemplateColumns: "220px 1fr",
    background: COLORS.soft,
    fontFamily: "system-ui, sans-serif",
  };

  const mainStyle = {
    padding: 28,
    overflowY: "auto",
  };

  return (
    <div style={wrapperStyle}>
      <aside style={sidebarStyle}>
        <div style={{ padding: "0 0 20px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
          <p style={{
            fontSize: 10, fontWeight: 900, color: COLORS.primary,
            letterSpacing: 2, margin: "0 0 4px", textTransform: "uppercase",
          }}>
            Account control
          </p>
          <p style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.8)", margin: 0 }}>
            Customer center
          </p>
        </div>

        <nav style={{ padding: "14px 12px", flex: 1 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <NavLink to="/account/profile" style={({ isActive }) => ({ ...itemStyle, ...(isActive ? activeItemStyle : {}) })}>Profile</NavLink>
            <NavLink to="/account/addresses" style={({ isActive }) => ({ ...itemStyle, ...(isActive ? activeItemStyle : {}) })}>Addresses</NavLink>
            <NavLink to="/account/wishlists" style={({ isActive }) => ({ ...itemStyle, ...(isActive ? activeItemStyle : {}) })}>Wishlists</NavLink>
            <NavLink to="/account/notifications" style={({ isActive }) => ({ ...itemStyle, ...(isActive ? activeItemStyle : {}) })}>Notifications</NavLink>
            <NavLink
              to="/orders"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                marginTop: 6,
                padding: "14px 18px",
                borderRadius: 16,
                background: "#6dd7a7",
                color: "#10210f",
                border: "1px solid rgba(16,33,15,0.15)",
                boxShadow: "0 14px 24px rgba(16,33,15,0.09)",
                fontWeight: 900,
                fontSize: 12,
                textDecoration: "none",
              }}
            >
              See your orders
              <ArrowRight size={14} style={{ marginLeft: 6 }} />
            </NavLink>
          </div>
        </nav>
      </aside>

      <main style={mainStyle}>
        <Outlet />
      </main>
    </div>
  );
}

