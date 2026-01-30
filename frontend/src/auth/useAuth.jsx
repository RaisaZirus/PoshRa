import React from "react";

const AuthCtx = React.createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(false);

  // Example "login" stub; replace with API call to Express
  const login = async ({ email }) => {
    setLoading(true);
    try {
      // DEMO ONLY: choose role based on email
      const role =
        email?.includes("admin") ? "admin" : email?.includes("seller") ? "seller" : "user";
      setUser({ user_id: 1, email, role, name: "Demo" });
    } finally {
      setLoading(false);
    }
  };

  const logout = () => setUser(null);

  const value = { user, loading, login, logout };
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthCtx);
  if (!ctx) {
    // If you forget to wrap your app, you’ll see a clear error.
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
}
