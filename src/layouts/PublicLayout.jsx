import { Outlet, useNavigate } from "react-router-dom";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./PublicLayout.css";

const getApiBaseUrl = () => {
  const configuredUrl = (process.env.REACT_APP_API_URL || "")
    .replace(/\/+$/, "");

  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return "http://localhost:5000";
    }

    if (hostname.endsWith(".vercel.app") || hostname === "trustpermit.com" || hostname === "www.trustpermit.com") {
      return configuredUrl || "https://trustpermit-backend.onrender.com";
    }
  }

  return configuredUrl || "https://trustpermit-backend.onrender.com";
};

const API_BASE_URL = getApiBaseUrl();

const getStoredValue = (key) => {
  try {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(key);
  } catch (error) {
    return null;
  }
};

const removeStoredValue = (key) => {
  try {
    if (typeof window !== "undefined") {
      localStorage.removeItem(key);
    }
  } catch (error) {
    // Ignore storage access errors in restricted browser contexts.
  }
};

export default function PublicLayout() {
  const navigate = useNavigate();
  const notificationRef = useRef(null);

  const [leftRailOpen, setLeftRailOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [applications, setApplications] = useState([]);
  const [inspections, setInspections] = useState([]);
  const [payments, setPayments] = useState([]);
  const [seenNotificationIds, setSeenNotificationIds] = useState([]);

  const token = getStoredValue("token");

  let storedUser = {};
  try {
    const rawUser = getStoredValue("user");
    storedUser = rawUser ? JSON.parse(rawUser) : {};
  } catch (error) {
    console.error("Invalid user JSON:", error);
    removeStoredValue("user");
    storedUser = {};
  }

  const userEmail = getStoredValue("email") || storedUser?.email || "";
  const userDisplayName =
    getStoredValue("name") || storedUser?.name || "Guest User";
  const seenStorageKey = `seenNotifications_${userEmail || "guest"}`;

  const handleLogout = () => {
    removeStoredValue("token");
    removeStoredValue("role");
    removeStoredValue("user");
    removeStoredValue("email");
    removeStoredValue("name");
    removeStoredValue("profileImage");
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
        fetch(`${API_BASE_URL}/api/payments`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }),
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
      const storedSeen = getStoredValue(seenStorageKey);
      savedSeen = storedSeen ? JSON.parse(storedSeen) : [];
    } catch (error) {
      console.error("Invalid seen notifications JSON:", error);
      removeStoredValue(seenStorageKey);
      savedSeen = [];
    }

    setSeenNotificationIds(Array.isArray(savedSeen) ? savedSeen : []);

    if (token) {
      fetchNotificationData();
    }

    const interval = setInterval(() => {
      if (token) {
        fetchNotificationData();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchNotificationData, seenStorageKey, token]);

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
    const normalizeStatus = (value) => String(value ?? "").trim().toLowerCase();

    const userPayments = payments.filter((payment) => {
      const paymentEmail = String(payment.email || payment.userId?.email || "").toLowerCase();
      return paymentEmail === String(userEmail).toLowerCase();
    });

    return [
      ...userPayments
        .map((payment) => {
          const status = normalizeStatus(
            payment.status || payment.paymentStatus || payment.result || ""
          );
          const isApproved =
            status === "approved" ||
            status === "paid" ||
            status === "success" ||
            status === "completed" ||
            payment.permitReleased === true;
          const isRejected =
            status === "rejected" ||
            status === "declined" ||
            status === "failed" ||
            status === "cancelled" ||
            status === "denied";

          if (!isApproved && !isRejected) return null;

          return {
            id: `payment-${payment._id}`,
            type: "payment",
            status: isRejected ? "rejected" : "approved",
            message: isRejected
              ? "Your payment was rejected or failed. Please review and try again."
              : "Your payment was approved and your permit has been released.",
            timestamp:
              payment.permitReleasedAt ||
              payment.updatedAt ||
              payment.createdAt ||
              "",
          };
        })
        .filter(Boolean),

      ...inspections
        .map((inspection) => {
          const status = normalizeStatus(inspection.status || inspection.inspectionStatus || "");
          const isRejected = ["rejected", "denied", "failed"].includes(status);

          return {
            id: `inspection-${inspection._id || inspection.id}`,
            type: "inspection",
            status,
            message: isRejected
              ? `Inspection was rejected for ${
                  inspection.date
                    ? new Date(inspection.date).toLocaleDateString()
                    : "the scheduled date"
                }${inspection.type ? ` (${inspection.type})` : ""}.`
              : `Inspection scheduled for ${
                  inspection.date
                    ? new Date(inspection.date).toLocaleDateString()
                    : "Unknown date"
                }${inspection.type ? ` (${inspection.type})` : ""}`,
            timestamp: inspection.updatedAt || inspection.createdAt || inspection.date || "",
          };
        })
        .filter((item) => item.timestamp),

      ...applications
        .filter((app) => {
          const status = normalizeStatus(app.status || "");
          return !status || ["pending", "approved", "rejected", "submitted", "in_review", "review"].includes(status);
        })
        .map((app) => ({
          id: `application-${app._id || app.id}`,
          type: "application",
          status: app.status || "Pending",
          message: `${app.applicationType || "New Application"} ${
            app.status || "Pending"
          } for Permit #${app.permitId || app._id || app.id}`,
          timestamp: app.updatedAt || app.createdAt || "",
        }))
        .filter((item) => item.timestamp),
    ]
      .filter((item) => item && item.timestamp)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [applications, inspections, payments, userEmail]);

  const unreadCount = notificationItems.filter(
    (item) => !seenNotificationIds.includes(item.id)
  ).length;

  const latestNotifications = notificationItems.slice(0, 8);

  const markNotificationsAsSeen = () => {
    const ids = notificationItems.map((item) => item.id);
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(seenStorageKey, JSON.stringify(ids));
      }
    } catch (error) {
      console.error("Unable to save notifications state:", error);
    }
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
    const status = String(item.status || "").toLowerCase();

    if (item.type === "payment") return status === "rejected" ? "⚠" : "💳";
    if (item.type === "inspection") return status === "rejected" ? "⚠" : "📅";
    if (status === "approved") return "✓";
    if (status === "rejected") return "✕";
    return "📄";
  };

  const [profileImage, setProfileImage] = useState("");

  useEffect(() => {
    const refreshProfileImage = () => {
      try {
        setProfileImage(getStoredValue("profileImage") || "");
      } catch (error) {
        setProfileImage("");
      }
    };

    refreshProfileImage();
    if (typeof window !== "undefined") {
      window.addEventListener("profileImageUpdated", refreshProfileImage);
      window.addEventListener("storage", (event) => {
        if (!event.key || event.key === "profileImage") {
          refreshProfileImage();
        }
      });
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("profileImageUpdated", refreshProfileImage);
      }
    };
  }, []);

  const getNotificationClass = (item) => {
    const status = String(item.status || "").toLowerCase();

    if (status === "rejected") return "rejected";
    if (item.type === "payment") return "approved";
    if (item.type === "inspection") return "inspection";
    if (status === "approved") return "approved";
    return "pending";
  };

  return (
    <div className={`public-layout ${leftRailOpen ? "rail-open" : "rail-collapsed"}`}>
      <div className="main-content">
        <header className="main-nav-header">
          <div className="header-container">
            <div className="header-brand-group">
              <button
                type="button"
                className="public-header-menu-toggle"
                onClick={() => setLeftRailOpen((prev) => !prev)}
                aria-label={leftRailOpen ? "Close menu" : "Open menu"}
                aria-expanded={leftRailOpen}
              >
            
                <span aria-hidden="true">{leftRailOpen ? "×" : "☰"}</span>
              </button>

              <div className="logo" onClick={() => navigate("/home")}> 
                TRUSTPERMIT
              </div>
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
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2z" fill="currentColor" />
                    <path d="M18 16v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5S10.5 3.17 10.5 4v.68C7.63 5.36 6 7.92 6 11v5l-1.7 1.7c-.14.14-.3.33-.3.55 0 .41.34.75.75.75h14.5c.41 0 .75-.34.75-.75 0-.22-.08-.41-.22-.55L18 16z" fill="currentColor" />
                  </svg>

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

              {/* Header logout button removed for readability on Home screen */}
            </nav>
          </div>
        </header>

        {leftRailOpen && <button
          type="button"
          className="public-left-sidebar-backdrop"
          aria-label="Close sidebar"
          onClick={() => setLeftRailOpen(false)}
        />}

        {leftRailOpen && (
          <aside className="public-left-sidebar" aria-label="Quick access sidebar">
            <div className="public-left-sidebar-brand">TRUSTPERMIT</div>

            <div className="public-left-sidebar-user">
              <div className="public-left-sidebar-avatar" aria-hidden="true">
                {profileImage ? (
                  <img src={profileImage} alt={`${userDisplayName}'s profile`} />
                ) : (
                  userDisplayName.trim().charAt(0).toUpperCase()
                )}
              </div>
              <div className="public-left-sidebar-user-copy">
                <div className="public-left-sidebar-user-name">{userDisplayName}</div>
                <div className="public-left-sidebar-user-status">Verified User ✓</div>
              </div>
            </div>

            <div className="public-left-sidebar-section public-left-sidebar-bottom-group">
              <button type="button" className="public-left-sidebar-item settings" onClick={() => { setLeftRailOpen(false); navigate("/account"); }}>
                <span className="public-left-sidebar-icon" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 8.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M19.4 13a7.1 7.1 0 00.1-1 7.1 7.1 0 00-.1-1l2.1-1.6a.5.5 0 00.1-.7l-2-3.4a.5.5 0 00-.7-.2l-2.5 1a7.6 7.6 0 00-1.7-1L14 2.5a.5.5 0 00-.5-.5h-4a.5.5 0 00-.5.5L8.3 4.1a7.6 7.6 0 00-1.7 1l-2.5-1a.5.5 0 00-.7.2l-2 3.4a.5.5 0 00.1.7L4.6 11a7.1 7.1 0 000 2l-2.1 1.6a.5.5 0 00-.1.7l2 3.4a.5.5 0 00.7.2l2.5-1c.5.4 1.1.7 1.7 1l.2 2.1a.5.5 0 00.5.5h4a.5.5 0 00.5-.5l.2-2.1c.6-.2 1.2-.5 1.7-1l2.5 1a.5.5 0 00.7-.2l2-3.4a.5.5 0 00-.1-.7L19.4 13z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
                <span className="public-left-sidebar-label">Settings</span>
              </button>

              <button type="button" className="public-left-sidebar-item payment-history" onClick={() => { setLeftRailOpen(false); navigate("/account?menu=Payment%20History"); }}>
                <span className="public-left-sidebar-icon" aria-hidden="true">💳</span>
                <span className="public-left-sidebar-label">Payment History</span>
              </button>

              <button type="button" className="public-left-sidebar-item logout" onClick={handleLogout}>
                <span className="public-left-sidebar-icon" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M16 17l5-5-5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M8 12h11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M13 18.5H8a2 2 0 01-2-2v-7a2 2 0 012-2h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
                <span className="public-left-sidebar-label">Logout</span>
              </button>
            </div>

            <button
              type="button"
              className="public-left-sidebar-action"
              onClick={() => {
                setLeftRailOpen(false);
                navigate("/account?menu=Apply%20Permit");
              }}
            >
              + New Permit
            </button>
          </aside>
        )}

        <main className="page-content">
          <Outlet />
        </main>

        <footer className="global-footer">
          <div className="global-footer-main">
            <div className="global-footer-left">
              <h2 className="global-footer-logo">TRUSTPERMIT</h2>
              <p className="global-footer-tagline">
                Secure document permits, inspections, and approvals with trust and transparency.
              </p>
              <div className="global-footer-social">
                <a href="https://facebook.com" target="_blank" rel="noreferrer">F</a>
                <a href="https://twitter.com" target="_blank" rel="noreferrer">T</a>
                <a href="https://linkedin.com" target="_blank" rel="noreferrer">L</a>
              </div>
            </div>

            <div className="global-footer-right">
              <h4>Quick links</h4>
              <div className="global-footer-legal-links">
                <button type="button" onClick={() => navigate("/home")}>Home</button>
                <button type="button" onClick={() => navigate("/about")}>About</button>
                <button type="button" onClick={() => navigate("/contact")}>Contact</button>
              </div>
            </div>
          </div>

          <div className="global-footer-bottom">
            <p className="global-footer-copy">
              © {new Date().getFullYear()} TRUSTPERMIT. All rights reserved.
            </p>
            <div className="global-footer-legal-links">
              <button type="button" onClick={() => navigate("/contact")}>Support</button>
              <button type="button" onClick={() => navigate("/about")}>Privacy</button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
