import React, { useEffect, useMemo, useState, useRef } from "react";
import "./Dashboard.css";

const getApiBaseUrl = () => {
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return "http://localhost:5000";
    }
  }

  return process.env.REACT_APP_API_URL || "https://trustpermitbackend.onrender.com";
};

const API_BASE_URL = getApiBaseUrl();

export default function Dashboard() {
  const [requests, setRequests] = useState([]);
  const [inspections, setInspections] = useState([]);
  const [payments, setPayments] = useState([]);
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotif, setShowNotif] = useState(false);
  const [activeRightContent, setActiveRightContent] = useState(null);
  const notificationsRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("Overview");
  const [unreadCount, setUnreadCount] = useState(0);

  const staffName = localStorage.getItem("name") || "Staff";

  const formatDateTime = (dateValue) => {
    if (!dateValue) return "N/A";
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return "N/A";

    return date.toLocaleString("en-PH", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatAmount = (amount) => {
    const value = Number(amount || 0);
    return value.toLocaleString("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const normalizeStatus = (status) => {
    return String(status || "Pending").trim().toLowerCase();
  };

  const getApplicantName = (item) => {
    if (item?.applicant?.firstName || item?.applicant?.lastName) {
      return `${item.applicant?.firstName || ""} ${item.applicant?.lastName || ""}`.trim();
    }

    if (item?.applicationId?.applicant?.firstName || item?.applicationId?.applicant?.lastName) {
      return `${item.applicationId?.applicant?.firstName || ""} ${
        item.applicationId?.applicant?.lastName || ""
      }`.trim();
    }

    if (item?.citizenId?.fullName) return item.citizenId.fullName;
    if (item?.userId?.fullName) return item.userId.fullName;
    if (item?.applicationId?.citizenId?.fullName) return item.applicationId.citizenId.fullName;
    if (item?.applicationId?.businessName) return item.applicationId.businessName;
    if (item?.businessName) return item.businessName;
    if (item?.name) return item.name;
    if (item?.applicantName) return item.applicantName;

    return "N/A";
  };

  const getType = (item, fallback = "Application") =>
    item.applicationType ||
    item.inspectionType ||
    item.type ||
    item.permitType ||
    item.applicationId?.applicationType ||
    item.applicationId?.permitType ||
    fallback;

  const filterByStatus = (list, status) =>
    list.filter((item) => normalizeStatus(item.status) === normalizeStatus(status));

  const pendingApps = filterByStatus(requests, "Pending");
  const approvedApps = filterByStatus(requests, "Approved");
  const rejectedApps = filterByStatus(requests, "Rejected");

  const pendingInspections = filterByStatus(inspections, "Pending");
  const approvedInspections = filterByStatus(inspections, "Approved");
  const rejectedInspections = filterByStatus(inspections, "Rejected");

  const totalPendingCount = pendingApps.length + pendingInspections.length;

  const paymentCount = payments.length;

  const showOverviewSection = selectedFilter === "Overview";
  const showApprovedAppsSection = selectedFilter === "Recent Approved Applications";
  const showApprovedInspectionsSection = selectedFilter === "Approved Inspections";
  const showRejectedInspectionsSection = selectedFilter === "Rejected Inspections";
  const showPendingItemsSection = selectedFilter === "Pending Items";
  const showPaymentReceivedSection = selectedFilter === "Payment Received";

  const buildNotifications = ({
    appsData = [],
    inspData = [],
    paymentsData = [],
    usersData = [],
    messagesData = [],
    docsData = [],
  }) => {
    const notifList = [];

    paymentsData.forEach((payment) => {
      notifList.push({
        id: `payment-${payment._id}`,
        icon: "payment",
        title: "New Payment Received",
        message: `${payment.name || "User"} paid ₱${formatAmount(payment.amount)} using ${
          payment.paymentMethod || "payment method"
        }.`,
        date: payment.createdAt,
        link: "/staff/payments",
      });
    });

    inspData.forEach((inspection) => {
      notifList.push({
        id: `inspection-${inspection._id}`,
        icon: "inspection",
        title: "Inspection Update",
        message: `${getApplicantName(inspection)} - ${inspection.status || "Pending"} inspection.`,
        date: inspection.createdAt || inspection.updatedAt,
        link: "/staff/inspection",
      });
    });

    usersData.forEach((user) => {
      notifList.push({
        id: `user-${user._id}`,
        icon: "user",
        title: "New Account Created",
        message: `${user.fullName || user.name || user.email || "New user"} created an account.`,
        date: user.createdAt,
        link: "/staff/users",
      });
    });

    appsData.forEach((app) => {
      notifList.push({
        id: `application-${app._id}`,
        icon: "application",
        title: "New Application",
        message: `${getApplicantName(app)} submitted ${getType(app)}.`,
        date: app.createdAt,
        link: "/staff/review",
      });
    });

    messagesData.forEach((msg) => {
      notifList.push({
        id: `message-${msg._id}`,
        icon: "message",
        title: "New Message",
        message: `${msg.userName || msg.senderName || msg.name || "User"}: ${
          msg.lastMessage || msg.message || msg.text || msg.content || "Sent a message"
        }`,
        date: msg.updatedAt || msg.createdAt,
        link: "/staff/messages",
      });
    });

    docsData.forEach((doc) => {
      notifList.push({
        id: `document-${doc._id}`,
        icon: "document",
        title: "Uploaded Document",
        message: `${doc.documentName || doc.originalName || "A document"} was uploaded.`,
        date: doc.createdAt,
        link: "/staff/review",
      });
    });

    return notifList
      .filter((item) => item.date)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 20);
  };

  const renderSvgIcon = (name, size = 18) => {
    const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg" };
    switch (name) {
      case "payment":
        return (
          <svg {...common} aria-hidden>
            <path d="M12 1v2" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M17 21H7a2 2 0 0 1-2-2V7h14v12a2 2 0 0 1-2 2z" stroke="#2563eb" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M7 10h10" stroke="#2563eb" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );
      case "inspection":
        return (
          <svg {...common} aria-hidden>
            <path d="M21 21l-4.35-4.35" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="11" cy="11" r="6" stroke="#16a34a" strokeWidth="1.2" fill="none" />
          </svg>
        );
      case "user":
        return (
          <svg {...common} aria-hidden>
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="#6b7280" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="12" cy="7" r="4" stroke="#6b7280" strokeWidth="1.2" fill="none" />
          </svg>
        );
      case "application":
        return (
          <svg {...common} aria-hidden>
            <path d="M7 7h10v10H7z" stroke="#0f172a" strokeWidth="1.2" fill="#f8fafc" />
            <path d="M9 9h6" stroke="#64748b" strokeWidth="1" strokeLinecap="round" />
            <path d="M9 12h6" stroke="#94a3b8" strokeWidth="1" strokeLinecap="round" />
          </svg>
        );
      case "message":
        return (
          <svg {...common} aria-hidden>
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="#0f172a" strokeWidth="1.2" fill="#fff" />
          </svg>
        );
      case "document":
        return (
          <svg {...common} aria-hidden>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" stroke="#0f172a" strokeWidth="1.2" fill="#fff" />
            <path d="M14 2v6h6" stroke="#0f172a" strokeWidth="1" strokeLinecap="round" />
          </svg>
        );
      case "calendar":
        return (
          <svg {...common} aria-hidden>
            <rect x="3" y="5" width="18" height="16" rx="2" stroke="#2563eb" strokeWidth="1.2" fill="#fff" />
            <path d="M16 3v4M8 3v4" stroke="#2563eb" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        );
      case "check":
        return (
          <svg {...common} aria-hidden>
            <path d="M20 6L9 17l-5-5" stroke="#16a34a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
        );
      case "cross":
        return (
          <svg {...common} aria-hidden>
            <path d="M18 6L6 18M6 6l12 12" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
        );
      case "hourglass":
        return (
          <svg {...common} aria-hidden>
            <path d="M6 2h12M6 22h12M6 2v6a6 6 0 0 0 6 6 6 6 0 0 0 6-6V2" stroke="#f59e0b" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
        );
      case "bell":
        return (
          <svg {...common} aria-hidden>
            <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0 1 18 14.158V11a6 6 0 1 0-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
        );
      default:
        return null;
    }
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setNotice("No token found. Please login again.");
        setLoading(false);
        return;
      }

      try {
        const headers = {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        };

        const [appsRes, inspectionsRes, paymentsRes, chatsRes, usersRes] =
          await Promise.allSettled([
            fetch(`${API_BASE_URL}/api/applications`, { headers }),
            fetch(`${API_BASE_URL}/api/inspection`, { headers }),
            fetch(`${API_BASE_URL}/api/payments`, { headers }),
            fetch(`${API_BASE_URL}/api/chats`, { headers }),
            fetch(`${API_BASE_URL}/api/users`, { headers }),
          ]);

        let appsData = [];
        let inspData = [];
        let paymentsData = [];
        let usersData = [];
        let messagesData = [];
        let docsData = [];

        if (appsRes.status === "fulfilled" && appsRes.value.ok) {
          const data = await appsRes.value.json();

          appsData = Array.isArray(data)
            ? data
            : Array.isArray(data.applications)
            ? data.applications
            : Array.isArray(data.data)
            ? data.data
            : [];

          setRequests(appsData);
        }

        if (inspectionsRes.status === "fulfilled" && inspectionsRes.value.ok) {
          const data = await inspectionsRes.value.json();

          inspData = Array.isArray(data)
            ? data
            : Array.isArray(data.inspections)
            ? data.inspections
            : Array.isArray(data.data)
            ? data.data
            : Array.isArray(data.requests)
            ? data.requests
            : [];

          setInspections(inspData);
        }

        if (paymentsRes.status === "fulfilled" && paymentsRes.value.ok) {
          const data = await paymentsRes.value.json();

          paymentsData =
            data.success && Array.isArray(data.payments)
              ? data.payments
              : Array.isArray(data.payments)
              ? data.payments
              : Array.isArray(data)
              ? data
              : Array.isArray(data.data)
              ? data.data
              : [];

          setPayments(paymentsData);
        }

        if (chatsRes.status === "fulfilled" && chatsRes.value.ok) {
          const data = await chatsRes.value.json();

          messagesData = Array.isArray(data)
            ? data
            : Array.isArray(data.chats)
            ? data.chats
            : Array.isArray(data.messages)
            ? data.messages
            : Array.isArray(data.data)
            ? data.data
            : [];

          setMessages(messagesData);
        }

        if (usersRes.status === "fulfilled" && usersRes.value.ok) {
          const data = await usersRes.value.json();

          usersData = Array.isArray(data)
            ? data
            : Array.isArray(data.users)
            ? data.users
            : Array.isArray(data.data)
            ? data.data
            : [];

          setUsers(usersData);
        }

        setDocuments(docsData);

        const builtNotifs = buildNotifications({
          appsData,
          inspData,
          paymentsData,
          usersData,
          messagesData,
          docsData,
        });

        setNotifications(builtNotifs);
        setUnreadCount(builtNotifs.length);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        setNotice("Dashboard loaded, but some backend data is not reachable.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const latestPayment = payments.length
    ? [...payments].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]
    : null;

  const [todayText, setTodayText] = React.useState(() =>
    (() => {
      const d = new Date();
      const weekday = d.toLocaleDateString("en-US", { weekday: "long" });
      const month = d.toLocaleDateString("en-US", { month: "long" });
      const day = d.getDate();
      const year = d.getFullYear();
      return `${weekday}, ${month} ${day}, ${year}`;
    })()
  );

  React.useEffect(() => {
    const update = () => {
      const d = new Date();
      const weekday = d.toLocaleDateString("en-US", { weekday: "long" });
      const month = d.toLocaleDateString("en-US", { month: "long" });
      const day = d.getDate();
      const year = d.getFullYear();
      setTodayText(`${weekday}, ${month} ${day}, ${year}`);
    };

    const id = setInterval(update, 60 * 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (activeRightContent === "notifications" && notificationsRef.current) {
      // ensure the right-side panel is visible
      notificationsRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [activeRightContent]);

  const renderMiniList = (items, emptyTitle, emptySubtitle, statusClass = "approved") => {
    if (items.length === 0) {
      return (
        <div className="empty-state">
          <div className={`empty-icon ${statusClass}`}>
            {statusClass === "rejected"
              ? renderSvgIcon("cross", 28)
              : statusClass === "pending"
              ? renderSvgIcon("hourglass", 28)
              : renderSvgIcon("check", 28)}
          </div>
          <strong>{emptyTitle}</strong>
          <span>{emptySubtitle}</span>
        </div>
      );
    }

    return (
      <div className="modern-list">
        {items.slice(0, 5).map((item, index) => (
          <div className="modern-list-item" key={item._id || item.id || index}>
            <div className={`list-icon ${statusClass}`}>
              {statusClass === "rejected"
                ? renderSvgIcon("cross", 18)
                : statusClass === "pending"
                ? renderSvgIcon("hourglass", 18)
                : renderSvgIcon("check", 18)}
            </div>

            <div className="list-content">
              <strong>{getApplicantName(item)}</strong>
              <span>{getType(item, "Inspection")}</span>
            </div>

            <span className={`status-pill ${statusClass}`}>
              {item.status || statusClass}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <section className="dashboard-overview">
      <div className="dashboard-topbar">
        <div className="topbar-actions" style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div className="page-title" style={{ margin: 0 }}>
              <h1>Dashboard</h1>
            </div>
          </div>

          <div className="page-date" style={{ fontSize: 18, fontWeight: 600, color: "#6b7280" }}>{todayText}</div>
        </div>

        <div className="topbar-right">
          <div className="notif-wrapper" style={{ position: "relative" }}>
            <button
              type="button"
              className="notif-chip"
              onClick={() => {
                if (activeRightContent === "notifications") {
                  setActiveRightContent(null);
                } else {
                  setActiveRightContent("notifications");
                  setShowNotif(false);
                  if (unreadCount > 0) setUnreadCount(0);
                }
              }}
            >
              {renderSvgIcon("bell", 28)}
              {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}
            </button>

            {activeRightContent === "notifications" && (
              <div className="notifications-panel" ref={notificationsRef}>
                <div className="panel-header">
                  <h2>Notifications</h2>
                  <button type="button" onClick={() => { setActiveRightContent(null); }}>
                    Close
                  </button>
                </div>

                {notifications.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon pending">{renderSvgIcon("bell", 40)}</div>
                    <strong>No notifications</strong>
                    <span>You're all caught up.</span>
                  </div>
                ) : (
                  <div className="notif-list">
                    {notifications.map((notif) => (
                      <div key={notif.id} className="notif-item" onClick={() => { if (notif.link) window.location.href = notif.link; }}>
                        <div className="notif-icon">{renderSvgIcon(notif.icon, 18)}</div>
                        <div>
                          <strong>{notif.title}</strong>
                          <p>{notif.message}</p>
                          <small>{formatDateTime(notif.date)}</small>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="dashboard-filters">
        {[
          "Overview",
          "Recent Approved Applications",
          "Approved Inspections",
          "Rejected Inspections",
          "Pending Items",
          "Payment Received",
        ].map((label) => (
          <button
            key={label}
            type="button"
            className={`filter-button ${selectedFilter === label ? "active" : ""}`}
            onClick={() => setSelectedFilter(label)}
          >
            {label}
          </button>
        ))}
      </div>

      {notice && <div className="dashboard-notice">{notice}</div>}
      {loading && <div className="dashboard-loading">Loading dashboard data...</div>}

      {showOverviewSection && (
        <div className="bigger-cards-horizontal">
        <div className="stat-card total">
          <div>
            <p>Total Applications</p>
            <h2>{requests.length}</h2>
            <span>All time applications</span>
          </div>
        </div>

        <div className="stat-card pending">
          <div>
            <p>Pending Applications</p>
            <h2>{pendingApps.length}</h2>
            <span>Awaiting review</span>
          </div>
          <div className="stat-line"></div>
        </div>

        <div className="stat-card approved">
          <div>
            <p>Approved Applications</p>
            <h2>{approvedApps.length}</h2>
            <span>Successfully approved</span>
          </div>
          <div className="stat-line"></div>
        </div>

        <div className="stat-card rejected">
          <div>
            <p>Rejected Applications</p>
            <h2>{rejectedApps.length}</h2>
            <span>Applications rejected</span>
          </div>
          <div className="stat-line"></div>
        </div>
        </div>
      )}

      {showOverviewSection && (
        <div className="summary-widgets">
          <div className="summary-card inspection approved">
            <div className="summary-card-icon">{renderSvgIcon("check", 20)}</div>
            <p>Approved Inspections</p>
            <h3>{approvedInspections.length}</h3>
            <span>Successfully completed inspections</span>
          </div>

          <div className="summary-card inspection rejected">
            <div className="summary-card-icon">{renderSvgIcon("cross", 20)}</div>
            <p>Rejected Inspections</p>
            <h3>{rejectedInspections.length}</h3>
            <span>Inspections that need follow-up</span>
          </div>

          <div className="summary-card inspection pending">
            <div className="summary-card-icon">{renderSvgIcon("hourglass", 20)}</div>
            <p>Pending Items</p>
            <h3>{totalPendingCount}</h3>
            <span>Applications and inspections waiting</span>
          </div>

          <div className="summary-card inspection payment">
            <div className="summary-card-icon">{renderSvgIcon("payment", 20)}</div>
            <p>Payment Received</p>
            <h3>{paymentCount}</h3>
            <span>Latest payment events logged</span>
          </div>
        </div>
      )}

      <div className="dashboard-layout">
        {showOverviewSection && (
          <div className="panel chart-panel large">
            <div className="panel-header">
              <h2>Application Overview</h2>
              <button type="button">This Month⌄</button>
            </div>

            <div className="fake-chart">
              <div className="chart-grid"></div>
              <svg viewBox="0 0 500 220" preserveAspectRatio="none">
                <polyline
                  points="0,200 45,182 90,170 135,140 180,128 225,105 270,98 315,80 360,58 410,35 500,12"
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="4"
                />
                <polyline
                  points="0,205 45,205 90,205 135,204 180,202 225,195 270,175 315,145 360,105 410,65 500,25"
                  fill="none"
                  stroke="#16a34a"
                  strokeWidth="4"
                />
                <polyline
                  points="0,206 500,206"
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="4"
                />
              </svg>
            </div>

            <div className="chart-legend">
              <span>
                <i className="blue"></i> Submitted
              </span>
              <span>
                <i className="green"></i> Approved
              </span>
              <span>
                <i className="orange"></i> Rejected
              </span>
            </div>
          </div>
        )}

        {showApprovedInspectionsSection && (
          <div className="panel large">
            <div className="panel-header">
              <h2>Approved Inspections</h2>
              <span className="count-badge green">{approvedInspections.length}</span>
            </div>
            {renderMiniList(
              approvedInspections,
              "No approved inspections",
              "Approved inspections will appear here.",
              "approved"
            )}
          </div>
        )}

        {showRejectedInspectionsSection && (
          <div className="panel large">
            <div className="panel-header">
              <h2>Rejected Inspections</h2>
              <span className="count-badge red">{rejectedInspections.length}</span>
            </div>
            {renderMiniList(
              rejectedInspections,
              "No rejected inspections",
              "Rejected inspections will appear here.",
              "rejected"
            )}
          </div>
        )}

        {showApprovedAppsSection && (
          <div className="panel large">
            <div className="panel-header">
              <h2>Recent Approved Applications</h2>
              <span className="count-badge blue">{approvedApps.length}</span>
            </div>
            {renderMiniList(
              approvedApps,
              "No approved applications",
              "Approved applications will appear here.",
              "approved"
            )}
          </div>
        )}

        {showPendingItemsSection && (
          <div className="panel pending-panel large">
            <div className="panel-header">
              <h2>Pending Items</h2>
            </div>

            <div className="pending-card">
              <div className="pending-icon orange">{renderSvgIcon("application", 28)}</div>
              <div>
                <strong>Pending Applications</strong>
                <h2>{pendingApps.length}</h2>
                <span>
                  {pendingApps.length > 0
                    ? "Applications awaiting review"
                    : "No pending applications"}
                </span>
              </div>
            </div>

            <div className="pending-card">
              <div className="pending-icon blue">{renderSvgIcon("calendar", 28)}</div>
              <div>
                <strong>Pending Inspections</strong>
                <h2>{pendingInspections.length}</h2>
                <span>
                  {pendingInspections.length > 0
                    ? "Inspections awaiting action"
                    : "No pending inspections"}
                </span>
              </div>
            </div>
          </div>
        )}

        {showPaymentReceivedSection && (
          <div className="panel payment-panel large">
            <div className="panel-header">
              <h2>Payment Received</h2>
              <span className="new-badge">New</span>
            </div>

            {latestPayment ? (
              <div className="payment-details">
                <div className="payment-row">
                  <strong>From:</strong> {latestPayment.name || "N/A"}
                </div>

                <div className="payment-row">
                  <strong>Email:</strong> {latestPayment.email || "N/A"}
                </div>

                <div className="payment-row">
                  <strong>Amount:</strong> ₱{formatAmount(latestPayment.amount)}
                  <span className="status-pill paid">
                    {latestPayment.status || "paid"}
                  </span>
                </div>

                <div className="payment-row">
                  <strong>Payment Method:</strong> {latestPayment.paymentMethod || "N/A"}
                </div>

                <div className="payment-row">
                  <strong>Date Received:</strong> {formatDateTime(latestPayment.createdAt)}
                </div>

                <button
                  className="view-all-payments"
                  onClick={() => {
                    window.location.href = "/staff/payments";
                  }}
                >
                  View all payments →
                </button>
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon pending">{renderSvgIcon("payment", 40)}</div>
                <strong>No payments yet</strong>
                <span>Recent payments will appear here.</span>
              </div>
            )}
          </div>
        )}
        {/* notifications panel is now rendered under the bell inside notif-wrapper */}
      </div>
    </section>
  );
}