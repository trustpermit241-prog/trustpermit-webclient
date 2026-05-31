import React, { useEffect, useMemo, useState } from "react";
import "./Dashboard.css";

const API_BASE_URL = "https://trustpermit-backend.onrender.com";

export default function Dashboard() {
  const [requests, setRequests] = useState([]);
  const [inspections, setInspections] = useState([]);
  const [payments, setPayments] = useState([]);
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotif, setShowNotif] = useState(false);

  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");

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
        icon: "💰",
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
        icon: "🔍",
        title: "Inspection Update",
        message: `${getApplicantName(inspection)} - ${inspection.status || "Pending"} inspection.`,
        date: inspection.createdAt || inspection.updatedAt,
        link: "/staff/inspection",
      });
    });

    usersData.forEach((user) => {
      notifList.push({
        id: `user-${user._id}`,
        icon: "👤",
        title: "New Account Created",
        message: `${user.fullName || user.name || user.email || "New user"} created an account.`,
        date: user.createdAt,
        link: "/staff/users",
      });
    });

    appsData.forEach((app) => {
      notifList.push({
        id: `application-${app._id}`,
        icon: "📄",
        title: "New Application",
        message: `${getApplicantName(app)} submitted ${getType(app)}.`,
        date: app.createdAt,
        link: "/staff/review",
      });
    });

    messagesData.forEach((msg) => {
      notifList.push({
        id: `message-${msg._id}`,
        icon: "💬",
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
        icon: "📎",
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

        setNotifications(
          buildNotifications({
            appsData,
            inspData,
            paymentsData,
            usersData,
            messagesData,
            docsData,
          })
        );
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        setNotice("Dashboard loaded, but some backend data is not reachable.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const pendingApps = filterByStatus(requests, "Pending");
  const approvedApps = filterByStatus(requests, "Approved");
  const rejectedApps = filterByStatus(requests, "Rejected");

  const pendingInspections = filterByStatus(inspections, "Pending");
  const approvedInspections = filterByStatus(inspections, "Approved");
  const rejectedInspections = filterByStatus(inspections, "Rejected");

  const latestPayment = payments.length
    ? [...payments].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]
    : null;

  const todayText = useMemo(() => {
    return new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }, []);

  const renderMiniList = (items, emptyTitle, emptySubtitle, statusClass = "approved") => {
    if (items.length === 0) {
      return (
        <div className="empty-state">
          <div className={`empty-icon ${statusClass}`}>
            {statusClass === "rejected" ? "✕" : statusClass === "pending" ? "⏳" : "✓"}
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
              {statusClass === "rejected" ? "✕" : statusClass === "pending" ? "⏳" : "✓"}
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
        <div>
          <h1>Welcome back, {staffName}! 👋</h1>
          <p>Here&apos;s what's happening with permits and inspections today.</p>
        </div>

        <div className="topbar-actions">
          <div className="date-chip">📅 {todayText}</div>

          <div className="notif-wrapper">
            <button
              type="button"
              className="notif-chip"
              onClick={() => setShowNotif(!showNotif)}
            >
              🔔
              {notifications.length > 0 && <span>{notifications.length}</span>}
            </button>

            {showNotif && (
              <div className="notif-dropdown">
                <div className="notif-header">
                  <strong>Notifications</strong>
                  <small>{notifications.length} new</small>
                </div>

                {notifications.length === 0 ? (
                  <div className="notif-empty">No notifications yet.</div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      className="notif-item"
                      key={notif.id}
                      onClick={() => {
                        window.location.href = notif.link;
                      }}
                    >
                      <div className="notif-icon">{notif.icon}</div>
                      <div>
                        <strong>{notif.title}</strong>
                        <p>{notif.message}</p>
                        <small>{formatDateTime(notif.date)}</small>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <button
            className="logout-btn"
            onClick={() => {
              localStorage.clear();
              window.location.href = "/";
            }}
          >
            🚪 Logout
          </button>
        </div>
      </div>

      {notice && <div className="dashboard-notice">{notice}</div>}
      {loading && <div className="dashboard-loading">Loading dashboard data...</div>}

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

      <div className="dashboard-layout">
        <div className="panel chart-panel">
          <div className="panel-header">
            <h2>Applications Overview</h2>
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

        <div className="panel">
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

        <div className="panel">
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

        <div className="panel">
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

        <div className="panel pending-panel">
          <div className="panel-header">
            <h2>Pending Items</h2>
          </div>

          <div className="pending-card">
            <div className="pending-icon orange">📋</div>
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
            <div className="pending-icon blue">📅</div>
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

        <div className="panel payment-panel">
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
              <div className="empty-icon pending">💰</div>
              <strong>No payments yet</strong>
              <span>Recent payments will appear here.</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}