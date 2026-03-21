import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/useAuth.jsx";

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header style={{ borderBottom: "1px solid #eee", padding: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Link to="/">Shop</Link>
        <Link to="/search?q=">Search</Link>
        <Link to="/cart">Cart</Link>

        <div style={{ marginLeft: "auto", display: "flex", gap: 12 }}>
          {!user ? (
            <>
              <Link to="/auth/login">Login</Link>
              <Link to="/auth/register">Register</Link>
            </>
          ) : (
            <>
              <Link to="/account/profile">Account</Link>
              <Link to="/orders">Orders</Link>
              {user.role === "seller" && <Link to="/seller">Seller</Link>}
              {user.role === "admin" && <Link to="/admin">Admin</Link>}
              <button onClick={logout}>Logout</button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}