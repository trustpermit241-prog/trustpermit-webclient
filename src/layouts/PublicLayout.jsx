import { Outlet, useNavigate } from "react-router-dom";
import { useCallback, useEffect, useRef, useState } from "react";
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
const getNotificationId = (item) => String(item?._id || item?.id || item?.sourceKey || "");

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
  const [notificationItems, setNotificationItems] = useState([]);
  const [selectedNotificationIds, setSelectedNotificationIds] = useState([]);
  const [showDeleteMenu, setShowDeleteMenu] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [pendingDeleteIds, setPendingDeleteIds] = useState([]);

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

  const userDisplayName =
    getStoredValue("name") || storedUser?.name || "Guest User";

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
      const response = await fetch(`${API_BASE_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = response.ok ? await response.json() : { notifications: [] };
      setNotificationItems(Array.isArray(data.notifications) ? data.notifications : []);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchNotificationData();
    }

    const interval = setInterval(() => {
      if (token) {
        fetchNotificationData();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchNotificationData, token]);

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

  const unreadCount = notificationItems.length;

  const latestNotifications = notificationItems.slice(0, 8);

  const deleteNotifications = (ids = []) => {
    if (!ids.length) return;
    setPendingDeleteIds(ids);
  };

  const confirmDeleteNotifications = async () => {
    const ids = pendingDeleteIds;
    if (!ids.length) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ids }),
      });
      if (!response.ok) throw new Error("Unable to delete notifications");
      setNotificationItems((items) => items.filter((item) => !ids.includes(getNotificationId(item))));
      setSelectedNotificationIds([]);
      setSelectionMode(false);
      setPendingDeleteIds([]);
    } catch (error) {
      console.error("Unable to delete notifications:", error);
    }
  };

  const handleBellClick = () => {
    setShowNotifications((prev) => !prev);
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
                    </div>

                    <div className="notification-dropdown-actions">
                      <div className="notification-delete-menu">
                        <button
                          type="button"
                          className={`notification-delete-menu-trigger${showDeleteMenu || selectionMode ? " active" : ""}`}
                          onClick={() => setShowDeleteMenu((open) => !open)}
                          aria-expanded={showDeleteMenu}
                        >
                          {selectionMode ? "Delete all" : "Delete"} <span aria-hidden="true">▾</span>
                        </button>
                        {showDeleteMenu && (
                          <div className="notification-delete-menu-list">
                            <button type="button" onClick={() => {
                              setSelectionMode(true);
                              setSelectedNotificationIds(notificationItems.map(getNotificationId).filter(Boolean));
                              setShowDeleteMenu(false);
                            }} disabled={!notificationItems.length}>
                              Delete all
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="notification-list">
                      {latestNotifications.length > 0 ? (
                        latestNotifications.map((item) => (
                          <div className="notification-row" key={getNotificationId(item)}>
                            {selectionMode && (
                              <input
                                type="checkbox"
                                checked={selectedNotificationIds.includes(getNotificationId(item))}
                                onChange={() => { const id = getNotificationId(item); setSelectedNotificationIds((ids) => ids.includes(id) ? ids.filter((selectedId) => selectedId !== id) : [...ids, id]); }}
                                aria-label={`Select ${item.title || "notification"}`}
                              />
                            )}
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
                              {new Date(item.occurredAt).toLocaleString(
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
                            <button
                              type="button"
                              className="notification-delete-btn"
                              onClick={() => deleteNotifications([getNotificationId(item)])}
                              aria-label={`Delete ${item.title || "notification"}`}
                              title="Delete notification"
                            >
                              ×
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="notification-empty">
                          No notifications yet.
                        </div>
                      )}
                    </div>

                    {selectionMode && (
                      <div className="notification-selection-actions">
                        <span>{selectedNotificationIds.length} selected</span>
                        <button type="button" onClick={() => { setSelectionMode(false); setSelectedNotificationIds([]); }}>
                          Cancel
                        </button>
                        <button type="button" onClick={() => deleteNotifications(selectedNotificationIds)} disabled={!selectedNotificationIds.length}>
                          Delete checked
                        </button>
                      </div>
                    )}

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

        {pendingDeleteIds.length > 0 && (
          <div className="notification-confirm-backdrop" role="presentation">
            <div className="notification-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="delete-notification-title">
              <h2 id="delete-notification-title">Delete notification?</h2>
              <p>Are you sure you want to delete it?</p>
              <div className="notification-confirm-actions">
                <button type="button" onClick={() => setPendingDeleteIds([])}>Cancel</button>
                <button type="button" className="confirm-delete" onClick={confirmDeleteNotifications}>Delete</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
