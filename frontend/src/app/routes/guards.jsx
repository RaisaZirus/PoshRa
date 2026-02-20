// =======================================================
// FILE: src/app/routes/guards.jsx
// =======================================================
import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../auth/useAuth.jsx";

export function RequireAuth({ children }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return (
      <Navigate
        to="/auth/login"
        replace
        state={{ from: location }}
      />
    );
  }

  // Supports both usages:
  // 1) element: <RequireAuth />   -> renders Outlet
  // 2) <RequireAuth>...</RequireAuth> -> renders children
  return children ? children : <Outlet />;
}

export function RequireRole({ allowed = [], children }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return (
      <Navigate
        to="/auth/login"
        replace
        state={{ from: location }}
      />
    );
  }

  if (allowed.length > 0 && !allowed.includes(user.role)) {
    // you can change this to a nicer Unauthorized page later
    return <Navigate to="/" replace />;
  }

  return children ? children : <Outlet />;
}