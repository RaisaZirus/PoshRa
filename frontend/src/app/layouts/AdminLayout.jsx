import React from "react";
import { NavLink, Outlet } from "react-router-dom";

export default function AdminLayout() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 16 }}>
      <aside style={{ borderRight: "1px solid #eee", paddingRight: 12 }}>
        <h3>Admin</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <NavLink to="/admin/dashboard">Dashboard</NavLink>
          <NavLink to="/admin/users">Users</NavLink>
          <NavLink to="/admin/reports">Reports</NavLink>
          <NavLink to="/admin/campaigns">Campaigns</NavLink>
          <NavLink to="/admin/commissions">Commissions</NavLink>
          <NavLink to="/admin/audit-logs">Audit Logs</NavLink>
          <NavLink to="/admin/dashboard-builder">Dashboard Builder</NavLink>
        </div>
      </aside>

      <section>
        <Outlet />
      </section>
    </div>
  );
}
