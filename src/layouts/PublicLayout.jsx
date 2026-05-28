import { Outlet, useNavigate } from "react-router-dom";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./PublicLayout.css";

const API_BASE_URL = "https://trustpermit-backend.onrender.com";

export default function PublicLayout() {
  const navigate = useNavigate();
  const notificationRef = useRef(null);

  const [showNotifications, setShowNotifications] = useState(false);
  const [applications, setApplications] = useState([]);
  const [inspections, setInspections] = useState([]);
  const [payments, setPayments] = useState([]);
  const [seenNotificationIds, setSeenNotificationIds] = useState([]);

  const token = localStorage.getItem("token");

  let storedUser = {};
  try {
    const rawUser = localStorage.getItem("user");
    storedUser = rawUser ? JSON.parse(rawUser) : {};
  } catch (error) {
    console.error("Invalid user JSON:", error);
    localStorage.removeItem("user");
    storedUser = {};
  }

  const userEmail = localStorage.getItem("email") || storedUser?.email || "";
  const seenStorageKey = `seenNotifications_${userEmail || "guest"}`;

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/");
  };

  const fetchNotificationData = useCallback(async () => {
    if (!token) return;

    try {
      const [appRes, inspectionRes, paymentRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/applications/my`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE_URL}/api/inspection/my`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE_URL}/api/payments`),
      ]);

      const appData = appRes.ok ? await appRes.json() : [];
      const inspectionData = inspectionRes.ok ? await inspectionRes.json() : [];
      const paymentData = paymentRes.ok ? await paymentRes.json() : { payments: [] };

      setApplications(Array.isArray(appData) ? appData : []);
      setInspections(Array.isArray(inspectionData) ? inspectionData : []);
      setPayments(Array.isArray(paymentData.payments) ? paymentData.payments : []);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  }, [token]);

  useEffect(() => {
    let savedSeen = [];

    try {
      const storedSeen = localStorage.getItem(seenStorageKey);
      savedSeen = storedSeen ? JSON.parse(storedSeen) : [];
    } catch (error) {
      console.error("Invalid seen notifications JSON:", error);
      localStorage.removeItem(seenStorageKey);
      savedSeen = [];
    }

    setSeenNotificationIds(Array.isArray(savedSeen) ? savedSeen : []);

    fetchNotificationData();

    const interval = setInterval(() => {
      fetchNotificationData();
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchNotificationData, seenStorageKey]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const notificationItems = useMemo(() => {
    const userPayments = payments.filter((payment) => {
      const paymentEmail = String(payment.email || payment.userId?.email || "").toLowerCase();
      return paymentEmail === String(userEmail).toLowerCase();
    });

    return [
      ...userPayments
        .filter((payment) => payment.permitReleased === true)
        .map((payment) => ({
          id: `payment-${payment._id}`,
          type: "payment",
          status: "approved",
          message: "Your payment was approved and your permit has been released.",
          timestamp:
            payment.permitReleasedAt ||
            payment.updatedAt ||
            payment.createdAt ||
            "",
        })),

      ...inspections.map((inspection) => ({
        id: `inspection-${inspection._id || inspection.id}`,
        type: "inspection",
        message: `Inspection scheduled for ${
          inspection.date
            ? new Date(inspection.date).toLocaleDateString()
            : "Unknown date"
        }${inspection.type ? ` (${inspection.type})` : ""}`,
        timestamp: inspection.updatedAt || inspection.createdAt || inspection.date || "",
      })),

      ...applications.map((app) => ({
        id: `application-${app._id || app.id}`,
        type: "application",
        status: app.status || "Pending",
        message: `${app.applicationType || "New Application"} ${
          app.status || "Pending"
        } for Permit #${app.permitId || app._id || app.id}`,
        timestamp: app.updatedAt || app.createdAt || "",
      })),
    ]
      .filter((item) => item.timestamp)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [applications, inspections, payments, userEmail]);

  const unreadCount = notificationItems.filter(
    (item) => !seenNotificationIds.includes(item.id)
  ).length;

  const latestNotifications = notificationItems.slice(0, 8);

  const markNotificationsAsSeen = () => {
    const ids = notificationItems.map((item) => item.id);
    localStorage.setItem(seenStorageKey, JSON.stringify(ids));
    setSeenNotificationIds(ids);
  };

  const handleBellClick = () => {
    setShowNotifications((prev) => {
      const next = !prev;

      if (next) {
        markNotificationsAsSeen();
      }

      return next;
    });
  };

  const getNotificationIcon = (item) => {
    if (item.type === "payment") return "💳";
    if (item.type === "inspection") return "📅";
    if ((item.status || "").toLowerCase() === "approved") return "✓";
    return "📄";
  };

  const getNotificationClass = (item) => {
    if (item.type === "payment") return "approved";
    if (item.type === "inspection") return "inspection";
    if ((item.status || "").toLowerCase() === "approved") return "approved";
    return "pending";
  };

  return (
    <div className="public-layout">
      <div className="main-content">
        <header className="main-nav-header">
          <div className="header-container">
            <div className="logo" onClick={() => navigate("/home")}>
              TRUSTPERMIT
            </div>

            <nav className="nav-right-links">
              <button onClick={() => navigate("/home")}>Home</button>
              <button onClick={() => navigate("/about")}>About</button>
              <button onClick={() => navigate("/contact")}>Contact</button>

              <div className="nav-notification-wrapper" ref={notificationRef}>
                <button
                  className={`notification-bell-btn ${
                    showNotifications ? "active" : ""
                  }`}
                  onClick={handleBellClick}
                  type="button"
                  title="Notifications"
                  aria-label="Notifications"
                >
                  🔔

                  {unreadCount > 0 && (
                    <span className="notification-count">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="notification-dropdown">
                    <div className="notification-arrow" />

                    <div className="notification-dropdown-header">
                      <h3>Notifications</h3>
                      <button type="button" onClick={markNotificationsAsSeen}>
                        Mark all read
                      </button>
                    </div>

                    <div className="notification-list">
                      {latestNotifications.length > 0 ? (
                        latestNotifications.map((item) => (
                          <div className="notification-row" key={item.id}>
                            <div
                              className={`notification-icon ${getNotificationClass(
                                item
                              )}`}
                            >
                              {getNotificationIcon(item)}
                            </div>

                            <div className="notification-message">
                              <p>{item.message}</p>
                            </div>

                            <span className="notification-time">
                              {new Date(item.timestamp).toLocaleString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                  hour: "numeric",
                                  minute: "2-digit",
                                }
                              )}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="notification-empty">
                          No notifications yet.
                        </div>
                      )}
                    </div>

                    <button className="notification-footer-btn" type="button">
                      View All Notifications →
                    </button>
                  </div>
                )}
              </div>

              <button
                className="logout-btn"
                onClick={handleLogout}
                title="Logout"
                aria-label="Logout"
              >
                ⎋
              </button>
            </nav>
          </div>
        </header>

        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}