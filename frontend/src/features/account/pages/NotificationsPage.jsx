import React from "react";
import { useAuth } from "../../../auth/useAuth.jsx";

const COLORS = {
  bg: "#FDFDF9", soft: "#FBEF9C",
  primary: "#FEE32B", olive: "#877928", ink: "#201D18",
};

function Card({ children, style }) {
  return (
    <div style={{
      background: COLORS.bg, border: `1px solid rgba(32,29,24,0.12)`,
      borderRadius: 16, boxShadow: "0 10px 26px rgba(32,29,24,0.08)",
      overflow: "hidden", ...style,
    }}>
      {children}
    </div>
  );
}

const TYPE_ICONS = {
  order:    "📦",
  payment:  "💳",
  shipping: "🚚",
  promo:    "🎁",
  system:   "🔔",
};

export default function NotificationsPage() {
  const { fetchWithAuth } = useAuth();
  const [notifications, setNotifications] = React.useState([]);
  const [unread, setUnread] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  const fetchNotifications = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchWithAuth("/api/notifications");
      setNotifications(data.data || []);
      setUnread(data.unread || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth]);

  React.useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const markRead = async (id) => {
    try {
      await fetchWithAuth(`/api/notifications/${id}/read`, { method: "PATCH" });
      setNotifications((prev) =>
        prev.map((n) => n.notification_id === id ? { ...n, is_read: true } : n)
      );
      setUnread((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const markAllRead = async () => {
    try {
      await fetchWithAuth("/api/notifications/read-all", { method: "PATCH" });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnread(0);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return (
    <div style={{ padding: 24, textAlign: "center", color: COLORS.olive, fontWeight: 700 }}>
      Loading notifications...
    </div>
  );

  return (
    <div style={{ padding: 12, fontFamily: "system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: COLORS.ink }}>
            Notifications
            {unread > 0 && (
              <span style={{
                marginLeft: 10, background: COLORS.primary, color: COLORS.ink,
                fontSize: 12, fontWeight: 900, padding: "2px 8px", borderRadius: 999,
              }}>
                {unread} new
              </span>
            )}
          </h2>
        </div>
        {unread > 0 && (
          <button
            onClick={markAllRead}
            style={{
              fontSize: 13, fontWeight: 700, color: COLORS.olive,
              background: "none", border: `1px solid ${COLORS.olive}`,
              borderRadius: 8, padding: "6px 12px", cursor: "pointer",
            }}
          >
            Mark all read
          </button>
        )}
      </div>

      {error && (
        <div style={{ color: "#dc2626", fontWeight: 700, marginBottom: 12 }}>❌ {error}</div>
      )}

      {notifications.length === 0 ? (
        <Card style={{ padding: 40, textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔔</div>
          <p style={{ fontWeight: 700, color: COLORS.olive }}>No notifications yet</p>
        </Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {notifications.map((n) => (
            <div
              key={n.notification_id}
              onClick={() => !n.is_read && markRead(n.notification_id)}
              style={{
                background: n.is_read ? COLORS.bg : "rgba(254,227,43,0.1)",
                border: `1px solid ${n.is_read ? "rgba(32,29,24,0.1)" : COLORS.primary}`,
                borderRadius: 12, padding: "14px 16px",
                display: "flex", gap: 12, alignItems: "flex-start",
                cursor: n.is_read ? "default" : "pointer",
                transition: "background 0.15s",
              }}
            >
              <span style={{ fontSize: 20, flexShrink: 0 }}>
                {TYPE_ICONS[n.type] || "🔔"}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  margin: "0 0 4px", fontSize: 14,
                  fontWeight: n.is_read ? 400 : 700, color: COLORS.ink,
                }}>
                  {n.message || "You have a new notification"}
                </p>
                <p style={{ margin: 0, fontSize: 12, color: COLORS.olive }}>
                  {new Date(n.created_at).toLocaleDateString("en-IN", {
                    day: "numeric", month: "short", year: "numeric",
                    hour: "2-digit", minute: "2-digit",
                  })}
                </p>
              </div>
              {!n.is_read && (
                <div style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: COLORS.primary, flexShrink: 0, marginTop: 4,
                }} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}