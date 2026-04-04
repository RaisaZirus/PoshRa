import React from "react";
import { NavLink, Outlet } from "react-router-dom";

export default function AccountLayout() {
  const itemStyle = {
    display: "block",
    padding: "10px 14px",
    borderRadius: 10,
    textDecoration: "none",
    fontWeight: 700,
    color: "#475569",
    transition: "all 0.15s",
  };

  const activeItemStyle = {
    background: "#f8fafc",
    color: "#0f172a",
    borderLeft: "4px solid #1d4ed8",
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 16 }}>
      <aside style={{ borderRight: "1px solid #e2e8f0", paddingRight: 12, borderRadius: 12, background: "#fff", boxShadow: "0 8px 24px rgba(15,23,42,0.08)", padding: 18 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <NavLink to="/account/profile" style={({ isActive }) => ({ ...itemStyle, ...(isActive ? activeItemStyle : {}) })}>Profile</NavLink>
          <NavLink to="/account/addresses" style={({ isActive }) => ({ ...itemStyle, ...(isActive ? activeItemStyle : {}) })}>Addresses</NavLink>
          <NavLink to="/orders" style={({ isActive }) => ({ ...itemStyle, ...(isActive ? activeItemStyle : {}) })}>Orders</NavLink>
          <NavLink to="/account/wishlists" style={({ isActive }) => ({ ...itemStyle, ...(isActive ? activeItemStyle : {}) })}>Wishlists</NavLink>
          <NavLink to="/account/notifications" style={({ isActive }) => ({ ...itemStyle, ...(isActive ? activeItemStyle : {}) })}>Notifications</NavLink>
        </div>
      </aside>

      <section>
        <Outlet />
      </section>
    </div>
  );
}

