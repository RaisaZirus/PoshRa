// =======================================================
// FILE: src/auth/useAuth.jsx
// =======================================================
import React from "react";

const AuthContext = React.createContext(null);
const STORAGE_KEY = "poshra_auth_v1";

function saveAuth(payload) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}
function loadAuth() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : null;
}
function clearAuth() {
  localStorage.removeItem(STORAGE_KEY);
}

async function apiFetch(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || "Request failed");
  }
  return data;
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = React.useState(() => loadAuth());
  const [loading, setLoading] = React.useState(false);

  const login = async ({ email, password }) => {
    setLoading(true);
    try {
      const data = await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      saveAuth(data);
      setAuth(data);
      return data; // { success, accessToken, refreshToken, user }
    } finally {
      setLoading(false);
    }
  };

  const register = async ({ name, email, phone, password, role }) => {
    setLoading(true);
    try {
      const data = await apiFetch("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, phone, password, role }),
      });
      saveAuth(data);
      setAuth(data);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (auth?.refreshToken) {
        await apiFetch("/api/auth/logout", {
          method: "POST",
          body: JSON.stringify({ refreshToken: auth.refreshToken }),
        });
      }
    } catch {
      // ignore
    } finally {
      clearAuth();
      setAuth(null);
    }
  };

  const value = {
    user: auth?.user || null,
    accessToken: auth?.accessToken || null,
    refreshToken: auth?.refreshToken || null,
    loading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}