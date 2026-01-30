import React from "react";
import { NavLink, Outlet } from "react-router-dom";

export default function SellerLayout() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 16 }}>
      <aside style={{ borderRight: "1px solid #eee", paddingRight: 12 }}>
        <h3>Seller</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <NavLink to="/seller/dashboard">Dashboard</NavLink>
          <NavLink to="/seller/store">Store</NavLink>
          <NavLink to="/seller/products">Products</NavLink>
          <NavLink to="/seller/inventory">Inventory</NavLink>
          <NavLink to="/seller/orders">Orders</NavLink>
          <NavLink to="/seller/shipments">Shipments</NavLink>
          <NavLink to="/seller/payouts">Payouts</NavLink>
          <NavLink to="/seller/qna">QnA</NavLink>
          <NavLink to="/seller/violations">Violations</NavLink>
        </div>
      </aside>

      <section>
        <Outlet />
      </section>
    </div>
  );
}
