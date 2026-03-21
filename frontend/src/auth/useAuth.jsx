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

// Wraps fetch with automatic token refresh on 401
async function authFetch(path, options = {}, authData, onRefresh, onLogout) {
  if (!authData?.accessToken) {
    throw new Error("Not logged in");
  }
  const res = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authData.accessToken}`,
      ...(options.headers || {}),
    },
  });

  // Token expired — try to refresh once
  if (res.status === 401 && authData?.refreshToken) {
    try {
      const refreshRes = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: authData.refreshToken }),
      });
      const refreshData = await refreshRes.json();
      if (refreshRes.ok && refreshData.accessToken) {
        onRefresh(refreshData);
        // Retry original request with new token
        const retry = await fetch(path, {
          ...options,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${refreshData.accessToken}`,
            ...(options.headers || {}),
          },
        });
        const retryData = await retry.json().catch(() => ({}));
        if (!retry.ok) throw new Error(retryData?.message || "Request failed");
        return retryData;
      }
    } catch {
      // refresh failed — log out
      onLogout();
      throw new Error("Session expired. Please log in again.");
    }
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || "Request failed");
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

  // Convenience: authenticated fetch with auto-refresh
  const fetchWithAuth = React.useCallback(
    (path, options = {}) =>
      authFetch(
        path,
        options,
        auth,
        (newData) => {
          const updated = { ...auth, ...newData };
          saveAuth(updated);
          setAuth(updated);
        },
        logout
      ),
    [auth, logout]
  );

  const value = {
    user: auth?.user || null,
    accessToken: auth?.accessToken || null,
    refreshToken: auth?.refreshToken || null,
    loading,
    login,
    register,
    logout,
    fetchWithAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) {
    // Return safe defaults during initial render before AuthProvider mounts
    return {
      user: null,
      accessToken: null,
      refreshToken: null,
      loading: false,
      login: async () => {},
      register: async () => {},
      logout: async () => {},
      fetchWithAuth: async () => { throw new Error("Not logged in"); },
    };
  }
  return ctx;
}