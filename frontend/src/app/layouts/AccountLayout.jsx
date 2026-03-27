import React from "react";
import { NavLink, Outlet } from "react-router-dom";

export default function AccountLayout() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 16 }}>
      <aside style={{ borderRight: "1px solid #eee", paddingRight: 12 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <NavLink to="/account/profile">Profile</NavLink>
          <NavLink to="/account/addresses">Addresses</NavLink>
          <NavLink to="/orders">Orders</NavLink>
          <NavLink to="/account/wishlists">Wishlists</NavLink>
          <NavLink to="/account/notifications">Notifications</NavLink>
          <NavLink to="/account/conversations">Conversations</NavLink>
        </div>
      </aside>

      <section>
        <Outlet />
      </section>
    </div>
  );
}