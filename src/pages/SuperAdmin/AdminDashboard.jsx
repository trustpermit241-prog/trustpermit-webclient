import React, { useState, useEffect, useMemo } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import "./AdminDashboard.css";

const getApiBaseUrl = () => {
  const configuredUrl = (process.env.REACT_APP_API_URL || "").replace(/\/+$/, "");

  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return "http://localhost:5000/api";
    }

    if (hostname.endsWith(".vercel.app") || hostname === "trustpermit.com" || hostname === "www.trustpermit.com") {
      return configuredUrl ? `${configuredUrl}/api` : "https://trustpermit-backend.onrender.com/api";
    }
  }

  return configuredUrl ? `${configuredUrl}/api` : "https://trustpermit-backend.onrender.com/api";
};

const API_BASE = getApiBaseUrl();

const roleOptions = [{ value: "staff", label: "City Hall Staff" }];

const navItems = [
  { key: "dashboard", label: "Dashboard Analytics", icon: "ti-layout-dashboard" },
  { key: "users", label: "Registered Users", icon: "ti-users" },
  { key: "addStaff", label: "Add Staff", icon: "ti-user-plus" },
  { key: "logs", label: "System Logs", icon: "ti-activity" },
  { key: "auditTrail", label: "Audit Trail", icon: "ti-report-analytics" },
];

const normalizeRole = (role) => {
  const value = String(role || "").trim().toLowerCase();
  return value === "super admin" ? "admin" : value;
};

const roleLabel = (role) => {
  const normalized = normalizeRole(role);
  if (normalized === "admin") return "Super Admin";
  if (normalized === "staff") return "City Hall Staff";
  return normalized
    ? `${normalized.charAt(0).toUpperCase()}${normalized.slice(1)}`
    : "User";
};

const formatDisplayDate = (dateString) => {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "Unknown Date";
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const formatDateTime = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleString();
};

const safeArray = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.applications)) return data.applications;
  if (Array.isArray(data?.inspections)) return data.inspections;
  if (Array.isArray(data?.documents)) return data.documents;
  if (Array.isArray(data?.uploadedDocuments)) return data.uploadedDocuments;
  if (Array.isArray(data?.payments)) return data.payments;
  return [];
};

const logTypeConfig = {
  security: {
    cls: "badge-security",
    iconCls: "icon-security",
    icon: "ti-shield-lock",
    label: "Security",
  },
  user: {
    cls: "badge-user",
    iconCls: "icon-user",
    icon: "ti-user-circle",
    label: "User Activity",
  },
  staff: {
    cls: "badge-staff",
    iconCls: "icon-staff",
    icon: "ti-user",
    label: "Staff Activity",
  },
  system: {
    cls: "badge-system",
    iconCls: "icon-system",
    icon: "ti-settings",
    label: "System",
  },
};

const getLogConfig = (type) => logTypeConfig[type] || logTypeConfig.system;

const ITEMS_PER_PAGE = 12;

const PaginationControls = ({ currentPage, totalItems, onPageChange }) => {
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  if (totalPages <= 1) return null;

  return (
    <div className="pagination-controls">
      <button
        type="button"
        className="pagination-btn"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        Previous
      </button>
      {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
        <button
          key={page}
          type="button"
          className={`pagination-btn${currentPage === page ? " active" : ""}`}
          onClick={() => onPageChange(page)}
        >
          {page}
        </button>
      ))}
      <button
        type="button"
        className="pagination-btn"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        Next
      </button>
    </div>
  );
};

export default function AdminDashboard({ defaultPage = "dashboard" }) {
  const navigate = useNavigate();

  const getStoredUserRole = () => {
    const storedRole = localStorage.getItem("role");
    if (storedRole) return storedRole.trim().toLowerCase();

    try {
      const storedUser = JSON.parse(localStorage.getItem("user"));
      return storedUser?.role?.trim?.().toLowerCase() || "";
    } catch {
      return "";
    }
  };

  const role = normalizeRole(getStoredUserRole());
  const isAdmin = role === "admin";

  const [activePage, setActivePage] = useState(defaultPage);
  const [logFilter, setLogFilter] = useState("today");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [logSearch, setLogSearch] = useState("");

  const [applications, setApplications] = useState([]);
  const [inspections, setInspections] = useState([]);
  const [uploadedDocuments, setUploadedDocuments] = useState([]);
  const [payments, setPayments] = useState([]);
  const [auditRecords, setAuditRecords] = useState([]);

  const [loadingAudit, setLoadingAudit] = useState(true);
  const [auditSearch, setAuditSearch] = useState("");
  const [auditFilter, setAuditFilter] = useState("all");

  const [newStaff, setNewStaff] = useState({
    fullName: "",
    email: "",
    role: "staff",
    password: "",
  });

  // Pagination state
  const [logsCurrentPage, setLogsCurrentPage] = useState(1);

  const [auditCurrentPage, setAuditCurrentPage] = useState(1);
  const [usersCurrentPage, setUsersCurrentPage] = useState(1);

  const today = new Date().toISOString().slice(0, 10);
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);

  const nowStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const authHeaders = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchFirstWorking = async (paths) => {
    for (const path of paths) {
      try {
        const res = await fetch(`${API_BASE}${path}`, {
          headers: {
            "Content-Type": "application/json",
            ...authHeaders(),
          },
        });

        if (!res.ok) continue;

        const data = await res.json();
        return safeArray(data);
      } catch (err) {
        console.warn(`Failed endpoint: ${path}`, err);
      }
    }

    return [];
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch(`${API_BASE}/users`, {
          headers: {
            "Content-Type": "application/json",
            ...authHeaders(),
          },
        });

        const data = await res.json();
        setUsers(safeArray(data));
      } catch (err) {
        console.error("Error fetching users:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const fetchLogs = async () => {
    setLoadingLogs(true);

    try {
      const res = await fetch(`${API_BASE}/logs`, {
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
      });

      if (!res.ok) throw new Error("Failed to fetch logs");

      const data = await res.json();
      setLogs(safeArray(data));
    } catch (err) {
      console.error("Error fetching logs:", err);
    } finally {
      setLoadingLogs(false);
    }
  };

  const fetchAuditTrail = async () => {
    setLoadingAudit(true);

    try {
      const [apps, insp, docs, pays, audit] = await Promise.all([
        fetchFirstWorking(["/applications"]),
        fetchFirstWorking(["/inspection"]),
        fetchFirstWorking(["/applications/upload-documents"]),
        fetchFirstWorking(["/payments"]),
        fetchFirstWorking(["/audit"]),
      ]);

      setApplications(apps);
      setInspections(insp);
      setUploadedDocuments(docs);
      setPayments(pays);
      setAuditRecords(audit);
    } catch (err) {
      console.error("Error fetching audit trail:", err);
    } finally {
      setLoadingAudit(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    fetchAuditTrail();
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const filteredLogs = logs.filter((log) => {
    const logDate = log.date || log.createdAt?.slice?.(0, 10);

    const matchesFilter =
      logFilter === "today"
        ? logDate === today
        : logFilter === "week"
        ? logDate >= weekAgo
        : true;

    const matchesSearch = logSearch
      ? log.message?.toLowerCase().includes(logSearch.toLowerCase())
      : true;

    return matchesFilter && matchesSearch;
  });

  const groupedLogs = filteredLogs.reduce((acc, log) => {
    const logDate = log.date || log.createdAt?.slice?.(0, 10) || today;
    acc[logDate] = acc[logDate] || [];
    acc[logDate].push(log);
    return acc;
  }, {});

  const handleAddStaff = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch(`${API_BASE}/auth/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify({
          fullName: newStaff.fullName,
          email: newStaff.email,
          password: newStaff.password,
          role: newStaff.role,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Could not create staff account.");

      setUsers((prev) => [...prev, data.user]);

      setLogs((prev) => [
        {
          date: today,
          time: new Date().toLocaleTimeString(),
          type: "staff",
          message: `Staff ${newStaff.fullName} created`,
        },
        ...prev,
      ]);

      setNewStaff({ fullName: "", email: "", role: "staff", password: "" });
      alert("Staff account created successfully!");
    } catch (error) {
      console.error("Add staff error:", error);
      alert(error.message || "Failed to create staff account.");
    }
  };

  const normalizedUsers = users.map((u) => ({ ...u, role: normalizeRole(u.role) }));

  const cityHallStaff = normalizedUsers.filter((u) => u.role === "staff").length;

  const staffAddedToday = normalizedUsers.filter(
    (u) => u.role === "staff" && u.createdAt?.slice(0, 10) === today
  ).length;

  const auditActivities = useMemo(() => {
    return auditRecords.map((item) => ({
      ...item,
      id: item._id || item.id,
      type: item.type || item.resource || "System",
      icon: item.icon || "ti-activity",
      title: item.title || item.description || "Audit activity",
      user: item.user || "Unknown user",
      status: item.status || "Recorded",
      date: item.date || item.createdAt,
      description: item.description || "Audit activity recorded.",
    }));
  }, [auditRecords]);

  const filteredAuditActivities = auditActivities.filter((item) => {
    const search = auditSearch.toLowerCase();

    const matchesSearch = auditSearch
      ? `${item.type} ${item.title} ${item.user} ${item.status}`
          .toLowerCase()
          .includes(search)
      : true;

    const matchesFilter =
      auditFilter === "all" ? true : item.type.toLowerCase() === auditFilter;

    return matchesSearch && matchesFilter;
  });

  if (!role) return <Navigate to="/" replace />;
  if (!isAdmin) return <Navigate to="/home" replace />;

  const statCards = [
    {
      label: "Total users",
      value: users.length,
      icon: "ti-users",
      iconBg: "#eff6ff",
      iconColor: "#2563eb",
      trend: "+12.5% this week",
      trendUp: true,
    },
    {
      label: "Applications",
      value: applications.length,
      icon: "ti-file-description",
      iconBg: "#ecfdf5",
      iconColor: "#059669",
      trend: "Fetched",
      trendUp: true,
    },
    {
      label: "Inspections",
      value: inspections.length,
      icon: "ti-clipboard-check",
      iconBg: "#fff7ed",
      iconColor: "#d97706",
      trend: "Fetched",
      trendUp: true,
    },
    {
      label: "Uploaded docs",
      value: uploadedDocuments.length,
      icon: "ti-file-upload",
      iconBg: "#faf5ff",
      iconColor: "#7c3aed",
      trend: "Fetched",
      trendUp: true,
    },
    {
      label: "Payments",
      value: payments.length,
      icon: "ti-credit-card",
      iconBg: "#fefce8",
      iconColor: "#ca8a04",
      trend: "Fetched",
      trendUp: true,
    },
    {
      label: "City Hall staff",
      value: cityHallStaff,
      icon: "ti-building",
      iconBg: "#f0fdf4",
      iconColor: "#16a34a",
      trend: "+8.2% this week",
      trendUp: true,
    },
    {
      label: "Staff added today",
      value: staffAddedToday,
      icon: "ti-user-plus",
      iconBg: "#eff6ff",
      iconColor: "#3b82f6",
      trend: "+2 new today",
      trendUp: true,
    },
  ];

  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const weekHeights = [55, 70, 48, 62, 40, 90, 30];

  const donutData = [
    {
      label: "Applications",
      value: applications.length,
      color: "#2563eb",
      pct: auditActivities.length
        ? ((applications.length / auditActivities.length) * 100).toFixed(1)
        : 0,
    },
    {
      label: "Inspections",
      value: inspections.length,
      color: "#16a34a",
      pct: auditActivities.length
        ? ((inspections.length / auditActivities.length) * 100).toFixed(1)
        : 0,
    },
    {
      label: "Uploaded docs",
      value: uploadedDocuments.length,
      color: "#7c3aed",
      pct: auditActivities.length
        ? ((uploadedDocuments.length / auditActivities.length) * 100).toFixed(1)
        : 0,
    },
    {
      label: "Payments",
      value: payments.length,
      color: "#ca8a04",
      pct: auditActivities.length
        ? ((payments.length / auditActivities.length) * 100).toFixed(1)
        : 0,
    },
  ];

  return (
    <div className="adm-layout">
      <aside className="adm-sidebar">
        <div className="sb-brand">
          <div className="sb-brand-icon">
            <i className="ti ti-shield-check" />
          </div>
          <div>
            <div className="sb-brand-name">TrustPermit</div>
            <div className="sb-brand-sub">City Hall Analytics</div>
          </div>
        </div>

        <div className="sb-user">
          <div className="sb-avatar">SA</div>
          <div>
            <div className="sb-user-name">Super Admin</div>
            <div className="sb-online">
              <span className="sb-dot" />
              Online
            </div>
          </div>
        </div>

        <nav className="sb-nav">
          <div className="sb-nav-section">Main</div>
          {navItems.slice(0, 3).map((item) => (
            <button
              key={item.key}
              type="button"
              className={`sb-nav-item${activePage === item.key ? " active" : ""}`}
              onClick={() => setActivePage(item.key)}
            >
              <i className={`ti ${item.icon}`} />
              <span>{item.label}</span>
              {item.key === "users" && (
                <span className="sb-nav-badge">{users.length.toLocaleString()}</span>
              )}
            </button>
          ))}

          <div className="sb-nav-section">Monitoring</div>
          {navItems.slice(3, 5).map((item) => (
            <button
              key={item.key}
              type="button"
              className={`sb-nav-item${activePage === item.key ? " active" : ""}`}
              onClick={() => setActivePage(item.key)}
            >
              <i className={`ti ${item.icon}`} />
              <span>{item.label}</span>
              {item.key === "auditTrail" && (
                <span className="sb-nav-badge">{auditActivities.length}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="sb-promo">
          <div className="sb-promo-title">
            Building a Transparent &amp; Trusted Community
          </div>
          <div className="sb-promo-sub">
            City Hall Analytics — Serving citizens with integrity
          </div>
        </div>
      </aside>

      <div className="adm-main">
        <header className="adm-topbar">
          <div className="tb-left">
            <div className="tb-menu-btn">
              <i className="ti ti-menu-2" />
            </div>
            <div>
              <div className="tb-title">
                {navItems.find((n) => n.key === activePage)?.label || "Dashboard"}
              </div>
              <div className="tb-sub">
                Monitor system activities and administrative actions
              </div>
            </div>
          </div>

          <div className="tb-right">
            <div className="tb-date">
              <i className="ti ti-calendar" style={{ fontSize: 13 }} />
              {nowStr}
            </div>
            <button type="button" className="tb-logout" onClick={handleLogout}>
              <i className="ti ti-logout" />
            </button>
          </div>
        </header>

        <div className="adm-content">
          {activePage === "dashboard" && (
            <>
              <div className="dash-stats-grid">
                {statCards.map((card, i) => (
                  <div className="dash-stat-card" key={i}>
                    <div className="dsc-top">
                      <div>
                        <div className="dsc-label">{card.label}</div>
                        <div className="dsc-value">{card.value.toLocaleString()}</div>
                      </div>
                      <div
                        className="dsc-icon"
                        style={{ background: card.iconBg, color: card.iconColor }}
                      >
                        <i className={`ti ${card.icon}`} />
                      </div>
                    </div>
                    <div
                      className={`dsc-trend${
                        card.trendUp === true
                          ? " up"
                          : card.trendUp === false
                          ? " dn"
                          : ""
                      }`}
                    >
                      {card.trend}
                    </div>
                  </div>
                ))}
              </div>

              <div className="dash-bottom-grid">
                <div className="dash-left-col">
                  <div className="dash-panel">
                    <div className="dash-panel-hd">
                      <div className="dash-panel-title">
                        <i className="ti ti-chart-donut" />
                        Recent system overview
                      </div>
                    </div>

                    <div className="dash-panel-body">
                      <div className="donut-section">
                        <div className="donut-ring-wrap">
                          <svg viewBox="0 0 120 120" width="120" height="120">
                            {(() => {
                              const total =
                                donutData.reduce((s, d) => s + Math.max(d.value, 0), 0) ||
                                1;
                              let offset = 0;
                              const r = 44;
                              const cx = 60;
                              const cy = 60;
                              const circ = 2 * Math.PI * r;

                              return donutData.map((d, i) => {
                                const pct = Math.max(d.value, 0) / total;
                                const dash = pct * circ;
                                const rot = offset * 360 - 90;
                                offset += pct;

                                return (
                                  <circle
                                    key={i}
                                    cx={cx}
                                    cy={cy}
                                    r={r}
                                    fill="none"
                                    stroke={d.color}
                                    strokeWidth="16"
                                    strokeDasharray={`${dash} ${circ - dash}`}
                                    transform={`rotate(${rot} ${cx} ${cy})`}
                                  />
                                );
                              });
                            })()}
                            <text
                              x="60"
                              y="55"
                              textAnchor="middle"
                              fontSize="14"
                              fontWeight="500"
                              fill="currentColor"
                            >
                              {auditActivities.length}
                            </text>
                            <text x="60" y="68" textAnchor="middle" fontSize="8" fill="#9ca3af">
                              Activities
                            </text>
                          </svg>
                        </div>

                        <div className="donut-legend">
                          {donutData.map((d, i) => (
                            <div className="donut-legend-item" key={i}>
                              <span className="donut-dot" style={{ background: d.color }} />
                              <span className="donut-lbl">{d.label}</span>
                              <span className="donut-val">
                                {d.value.toLocaleString()} ({d.pct}%)
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="dash-panel" style={{ flex: 1 }}>
                    <div className="dash-panel-hd">
                      <div className="dash-panel-title">
                        <i className="ti ti-chart-bar" />
                        Activity summary this week
                      </div>
                    </div>

                    <div className="dash-panel-body">
                      <div className="bar-chart-wrap">
                        <div className="bar-y-axis">
                          {[150, 100, 50, 0].map((v) => (
                            <span key={v} className="bar-y-lbl">
                              {v}
                            </span>
                          ))}
                        </div>

                        <div className="bar-columns">
                          {weekDays.map((day, i) => (
                            <div className="bar-col" key={day}>
                              <div
                                className={`bar${day === "Sat" ? " bar-today" : ""}`}
                                style={{ height: `${weekHeights[i]}%` }}
                              />
                              <div
                                className={`bar-lbl${day === "Sat" ? " bar-lbl-today" : ""}`}
                              >
                                {day}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="dash-panel dash-logs-preview">
                  <div className="dash-panel-hd">
                    <div className="dash-panel-title">
                      <i className="ti ti-list-details" />
                      Recent audit activity
                    </div>
                    <button
                      type="button"
                      className="dash-view-all"
                      onClick={() => setActivePage("auditTrail")}
                    >
                      View all <i className="ti ti-arrow-right" style={{ fontSize: 12 }} />
                    </button>
                  </div>

                  <div className="log-scroll">
                    {auditActivities.slice(0, 6).map((item) => (
                      <div className="log-entry" key={`${item.type}-${item.id}`}>
                        <div className="le-icon icon-system">
                          <i className={`ti ${item.icon}`} />
                        </div>
                        <div className="le-time">{formatDateTime(item.date)}</div>
                        <div className="le-body">
                          <div className="le-actor">{item.title}</div>
                          <div className="le-meta">
                            {item.type} • {item.user}
                          </div>
                        </div>
                        <span className="le-badge badge-system">{item.status}</span>
                      </div>
                    ))}

                    {auditActivities.length === 0 && !loadingAudit && (
                      <div className="empty-state">No audit activity found.</div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {activePage === "auditTrail" && (() => {
            const totalAudit = filteredAuditActivities.length;
            const auditStartIdx = (auditCurrentPage - 1) * ITEMS_PER_PAGE;
            const paginatedAuditActivities = filteredAuditActivities.slice(
              auditStartIdx,
              auditStartIdx + ITEMS_PER_PAGE
            );

            return (
              <div className="dash-panel users-panel">
                <div className="dash-panel-hd">
                  <div className="dash-panel-title">
                    <i className="ti ti-report-analytics" />
                    Audit Trail
                  </div>

                  <div className="logs-controls">
                    <button type="button" className="dash-view-all" onClick={fetchAuditTrail}>
                      <i className="ti ti-refresh" /> Refresh
                    </button>

                    <div className="log-search-box">
                      <i className="ti ti-search" />
                      <input
                        placeholder="Search audit trail…"
                        value={auditSearch}
                        onChange={(e) => {
                          setAuditSearch(e.target.value);
                          setAuditCurrentPage(1);
                        }}
                      />
                    </div>

                    <div className="filter-pills">
                      {[
                        ["all", "All"],
                        ["user", "Users"],
                        ["application", "Applications"],
                        ["inspection", "Inspections"],
                        ["uploaded document", "Documents"],
                        ["payment", "Payments"],
                      ].map(([val, lbl]) => (
                        <button
                          key={val}
                          type="button"
                          className={`fp${auditFilter === val ? " active" : ""}`}
                          onClick={() => {
                            setAuditFilter(val);
                            setAuditCurrentPage(1);
                          }}
                        >
                          {lbl}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {loadingAudit ? (
                  <div className="empty-state">Loading audit trail…</div>
                ) : (
                  <>
                    <div className="table-responsive">
                      <table className="users-table">
                        <thead>
                          <tr>
                            <th>Activity Type</th>
                            <th>Record</th>
                            <th>User / Staff</th>
                            <th>Status</th>
                            <th>Date & Time</th>
                            <th>Activity Log</th>
                          </tr>
                        </thead>

                        <tbody>
                          {paginatedAuditActivities.length === 0 ? (
                            <tr>
                              <td colSpan="6" style={{ textAlign: "center", color: "#9ca3af" }}>
                                No audit activities found.
                              </td>
                            </tr>
                          ) : (
                            paginatedAuditActivities.map((item) => (
                              <tr key={`${item.type}-${item.id}`}>
                                <td>
                                  <span className="role-pill role-staff">
                                    <i className={`ti ${item.icon}`} /> {item.type}
                                  </span>
                                </td>
                                <td>{item.title}</td>
                                <td>{item.user}</td>
                                <td>
                                  <span className="role-pill role-user">{item.status}</span>
                                </td>
                                <td>{formatDateTime(item.date)}</td>
                                <td>{item.description}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    <PaginationControls
                      currentPage={auditCurrentPage}
                      totalItems={totalAudit}
                      onPageChange={setAuditCurrentPage}
                    />
                  </>
                )}
              </div>
            );
          })()}

          {activePage === "logs" && (
            <div className="dash-panel dash-logs-preview logs-full-panel">
              <div className="dash-panel-hd">
                <div className="dash-panel-title">
                  <i className="ti ti-list-details" />
                  System activity logs
                </div>

                <div className="logs-controls">
                  <div className="log-search-box">
                    <i className="ti ti-search" />
                    <input
                      placeholder="Search logs…"
                      value={logSearch}
                      onChange={(e) => setLogSearch(e.target.value)}
                    />
                  </div>

                  <div className="filter-pills">
                    {[
                      ["today", "Today"],
                      ["week", "This week"],
                      ["all", "All"],
                    ].map(([val, lbl]) => (
                      <button
                        key={val}
                        type="button"
                        className={`fp${logFilter === val ? " active" : ""}`}
                        onClick={() => {
                          setLogFilter(val);
                          setLogsCurrentPage(1);
                        }}
                      >
                        {lbl}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {loadingLogs ? (
                <div className="empty-state">Loading logs…</div>
              ) : Object.keys(groupedLogs).length === 0 ? (
                <div className="empty-state">No system logs available.</div>
              ) : (() => {
                // Flatten all logs from grouped logs
                const allLogs = Object.entries(groupedLogs).flatMap(([date, items]) =>
                  items.map((log) => ({ ...log, date }))
                );

                // Calculate pagination
                const totalLogs = allLogs.length;
                const startIdx = (logsCurrentPage - 1) * ITEMS_PER_PAGE;
                const paginatedLogs = allLogs.slice(startIdx, startIdx + ITEMS_PER_PAGE);

                // Group paginated logs by date
                const paginatedGroupedLogs = paginatedLogs.reduce((acc, log) => {
                  acc[log.date] = acc[log.date] || [];
                  acc[log.date].push(log);
                  return acc;
                }, {});

                return (
                  <>
                    {Object.entries(paginatedGroupedLogs).map(([date, items]) => (
                      <div key={date}>
                        <div className="log-hd-row">
                          <div className="log-date-lbl">
                            <i className="ti ti-calendar-event" style={{ fontSize: 13 }} />
                            {formatDisplayDate(date)}
                          </div>
                          <span className="log-count-badge">{items.length} activities</span>
                        </div>

                        <div className="log-scroll">
                          {items.map((log, idx) => {
                            const cfg = getLogConfig(log.type);

                            return (
                              <div className="log-entry" key={idx}>
                                <div className={`le-icon ${cfg.iconCls}`}>
                                  <i className={`ti ${cfg.icon}`} />
                                </div>

                                <div className="le-time">
                                  {log.time || formatDateTime(log.createdAt)}
                                </div>

                                <div className="le-body">
                                  <div className="le-actor">{log.message}</div>
                                  {log.ip && (
                                    <div className="le-meta">
                                      <i className="ti ti-network" style={{ fontSize: 11 }} />
                                      IP: {log.ip}
                                      {log.role && (
                                        <>
                                          <span className="le-dot">•</span>
                                          {log.role}
                                        </>
                                      )}
                                    </div>
                                  )}
                                </div>

                                <span className={`le-badge ${cfg.cls}`}>{cfg.label}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}

                    <PaginationControls
                      currentPage={logsCurrentPage}
                      totalItems={totalLogs}
                      onPageChange={setLogsCurrentPage}
                    />
                  </>
                );
              })()}
            </div>
          )}

          {activePage === "users" && (
            <div className="dash-panel users-panel">
              <div className="dash-panel-hd">
                <div className="dash-panel-title">
                  <i className="ti ti-users" />
                  Registered users
                </div>
                <span className="log-count-badge">{users.length} total</span>
              </div>

              {loading ? (
                <div className="empty-state">Loading users…</div>
              ) : (
                <div className="table-responsive">
                  <table className="users-table">
                    <thead>
                      <tr>
                        <th>Full name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Created at</th>
                      </tr>
                    </thead>

                    <tbody>
                      {users.length === 0 ? (
                        <tr>
                          <td colSpan="4" style={{ textAlign: "center", color: "#9ca3af" }}>
                            No users found.
                          </td>
                        </tr>
                      ) : (
                        users
                          .slice(
                            (usersCurrentPage - 1) * ITEMS_PER_PAGE,
                            usersCurrentPage * ITEMS_PER_PAGE
                          )
                          .map((user) => (
                          <tr key={user._id || user.id}>
                            <td>{user.fullName || user.name}</td>
                            <td>{user.email}</td>
                            <td>
                              <span
                                className={`role-pill ${
                                  normalizeRole(user.role) === "admin"
                                    ? "role-admin"
                                    : normalizeRole(user.role) === "staff"
                                    ? "role-staff"
                                    : "role-user"
                                }`}
                              >
                                {roleLabel(user.role)}
                              </span>
                            </td>
                            <td>
                              {user.createdAt
                                ? new Date(user.createdAt).toLocaleString()
                                : "N/A"}
                            </td>
                          </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                  <PaginationControls
                    currentPage={usersCurrentPage}
                    totalItems={users.length}
                    onPageChange={setUsersCurrentPage}
                  />
                </div>
              )}
            </div>
          )}

          {activePage === "addStaff" && (
            <div className="dash-panel add-staff-panel">
              <div className="dash-panel-hd">
                <div className="dash-panel-title">
                  <i className="ti ti-user-plus" />
                  Add staff account
                </div>
                <span className="status-new-badge">New</span>
              </div>

              <p className="panel-desc">
                Create a new staff account with role access and secure login credentials.
              </p>

              <form className="staff-form-grid" onSubmit={handleAddStaff}>
                <div className="sf-field">
                  <label htmlFor="fullName">Full name</label>
                  <input
                    id="fullName"
                    type="text"
                    value={newStaff.fullName}
                    onChange={(e) =>
                      setNewStaff({ ...newStaff, fullName: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="sf-field">
                  <label htmlFor="email">Email address</label>
                  <input
                    id="email"
                    type="email"
                    value={newStaff.email}
                    onChange={(e) =>
                      setNewStaff({ ...newStaff, email: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="sf-field">
                  <label htmlFor="role">Role</label>
                  <select
                    id="role"
                    value={newStaff.role}
                    onChange={(e) =>
                      setNewStaff({ ...newStaff, role: e.target.value })
                    }
                  >
                    {roleOptions.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sf-field">
                  <label htmlFor="password">Temporary password</label>
                  <input
                    id="password"
                    type="password"
                    value={newStaff.password}
                    onChange={(e) =>
                      setNewStaff({ ...newStaff, password: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="sf-field sf-full">
                  <button type="submit" className="sf-submit-btn">
                    <i className="ti ti-user-plus" />
                    Create staff account
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}