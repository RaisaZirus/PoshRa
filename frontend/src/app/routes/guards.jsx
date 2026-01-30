import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../auth/useAuth.jsx";

// If used as <RequireAuth /> wrapping nested routes, it renders <Outlet/>
// If used as <RequireAuth>{children}</RequireAuth>, it renders children.
export function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const loc = useLocation();

  if (loading) return <div style={{ padding: 16 }}>Loading...</div>;
  if (!user) return <Navigate to="/auth/login" replace state={{ from: loc }} />;

  return children ? children : <Outlet />;
}

export function RequireRole({ allowed, children }) {
  const { user, loading } = useAuth();

  if (loading) return <div style={{ padding: 16 }}>Loading...</div>;
  if (!user) return <Navigate to="/auth/login" replace />;

  const ok = allowed.includes(user.role); // role from users.role
  if (!ok) return <Navigate to="/" replace />;

  return children;
}
