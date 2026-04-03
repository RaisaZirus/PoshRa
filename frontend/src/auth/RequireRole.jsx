import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./useAuth.jsx";

export default function RequireRole({ roles, children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/auth/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

