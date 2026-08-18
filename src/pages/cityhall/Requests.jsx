import React, { useEffect, useState } from "react";
import "./Requests.css";
import CenteredModal from "../../components/CenteredModal";
import { io } from "socket.io-client";

const getApiBaseUrl = () => {
  const configuredUrl = (process.env.REACT_APP_API_URL || "").replace(/\/+$/, "");

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

const API_URL = `${getApiBaseUrl()}/api`;

export default function Request() {
  const [dateFilter, setDateFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("All");
  const [applications, setApplications] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [selectedApp, setSelectedApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");
  const [confirmAction, setConfirmAction] = useState({ open: false, appId: null, status: "" });

  const staffName = localStorage.getItem("name") || "City Hall Staff";

  const staffInitials = staffName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const safeText = (value) => {
    if (value === null || value === undefined || value === "") return "N/A";

    if (typeof value === "object") {
      return (
        value.fullName ||
        value.email ||
        value.name ||
        value._id ||
        value.id ||
        "N/A"
      );
    }

    return String(value);
  };

  const getValue = (...values) => {
    for (const value of values) {
      if (value !== null && value !== undefined && value !== "") {
        return safeText(value);
      }
    }
    return "N/A";
  };

  const getApplicantName = (app) => {
    const fullName = `${app?.applicant?.firstName || ""} ${
      app?.applicant?.middleName || ""
    } ${app?.applicant?.lastName || ""} ${
      app?.applicant?.suffix || app?.applicant?.suffixName || ""
    }`.trim();

    return getValue(fullName, app?.fullName, app?.name, app?.userId);
  };

  const fetchApplicationDetails = async (appId) => {
    setDetailsLoading(true);
    setActionError("");

    const token = localStorage.getItem("token");

    if (!token) {
      setActionError("Not authenticated. Please login again.");
      setDetailsLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/applications/${appId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await res.json().catch(() => ({}));

      console.log("FULL APPLICATION DETAILS:", data);

      if (!res.ok) {
        throw new Error(data.message || "Failed to fetch full application details.");
      }

      const fullApp = data.application || data.data || data.result || data;

      setSelectedApp(fullApp);
    } catch (err) {
      setActionError(err.message || "Failed to fetch full application details.");
    } finally {
      setDetailsLoading(false);
    }
  };

  useEffect(() => {
    let socket;

    const fetchApplications = async () => {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      if (!token) {
        setError("Not authenticated. Please login again.");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_URL}/applications`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const data = await res.json().catch(() => ({}));

        console.log("APPLICATIONS RESPONSE:", data);

        if (!res.ok) {
          throw new Error(data.message || "Failed to load applications.");
        }

        const apps = Array.isArray(data)
          ? data
          : Array.isArray(data.applications)
          ? data.applications
          : Array.isArray(data.data)
          ? data.data
          : Array.isArray(data.results)
          ? data.results
          : [];

        setApplications(apps);
      } catch (err) {
        setError(err.message || "Failed to load applications.");
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();

    socket = io(getApiBaseUrl(), {
      path: "/socket.io",
      transports: ["polling", "websocket"],
      reconnection: true,
    });

    socket.on("new-application", (application) => {
      setApplications((prev) => [application, ...prev]);
    });

    socket.on("application-status-updated", (data) => {
      if (data?.application) {
        setApplications((prev) =>
          prev.map((app) =>
            app._id === data.application._id ? data.application : app
          )
        );

        setSelectedApp((current) =>
          current && current._id === data.application._id
            ? data.application
            : current
        );
      }
    });

    return () => {
      if (socket) socket.disconnect();
    };
  }, []);

  useEffect(() => {
    const now = new Date();
    const today = now.toISOString().split("T")[0];

    let filtered = applications.map((app) => ({
      id: app._id,
      name: getApplicantName(app),
      date: app.createdAt ? new Date(app.createdAt).toISOString().split("T")[0] : "",
      displayDate: app.createdAt
        ? new Date(app.createdAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "2-digit",
          })
        : "-",
      type: getValue(app.applicationType),
      status: getValue(app.status, "Pending"),
      raw: app,
    }));

    if (dateFilter === "today") {
      filtered = filtered.filter((req) => req.date === today);
    } else if (dateFilter === "week") {
      const startOfWeek = new Date(now);
      startOfWeek.setHours(0, 0, 0, 0);
      startOfWeek.setDate(now.getDate() - now.getDay());

      filtered = filtered.filter((req) => {
        const reqDate = new Date(req.date);
        return reqDate >= startOfWeek && reqDate <= now;
      });
    } else if (dateFilter === "month") {
      const month = now.getMonth();
      const year = now.getFullYear();

      filtered = filtered.filter((req) => {
        const reqDate = new Date(req.date);
        return reqDate.getMonth() === month && reqDate.getFullYear() === year;
      });
    }

    if (typeFilter !== "All") {
      filtered = filtered.filter((req) => req.type === typeFilter);
    }

    setFilteredRequests(filtered);
  }, [applications, dateFilter, typeFilter]);

  const updateApplicationStatus = async (appId, status) => {
    setActionLoading(true);
    setActionError("");

    const token = localStorage.getItem("token");

    if (!token) {
      setActionError("Not authenticated. Please login again.");
      setActionLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/applications/${appId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || "Failed to update application status.");
      }

      const updatedApplication = data.application || data.data || data;

      setApplications((prev) =>
        prev.map((app) => (app._id === appId ? updatedApplication : app))
      );

      setSelectedApp(updatedApplication);
    } catch (err) {
      setActionError(err.message || "Failed to update application status.");
    } finally {
      setActionLoading(false);
    }
  };

  const confirmUpdateApplicationStatus = (appId, status) => {
    setConfirmAction({ open: true, appId, status });
  };

  const handleConfirmAction = async () => {
    const { appId, status } = confirmAction;
    setConfirmAction({ open: false, appId: null, status: "" });
    if (!appId || !status) return;
    await updateApplicationStatus(appId, status);
  };

  const getStatusClass = (status) => {
    return String(status || "Pending").toLowerCase();
  };

  const renderObjectFields = (obj) => {
    if (!obj || typeof obj !== "object") {
      return <p>N/A</p>;
    }

    return Object.entries(obj).map(([key, value]) => {
      if (
        key === "_id" ||
        key === "__v" ||
        key === "password" ||
        key === "signature" ||
        value === null ||
        value === undefined ||
        value === ""
      ) {
        return null;
      }

      const label = key
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (char) => char.toUpperCase());

      return (
        <p key={key}>
          <span>{label}:</span> <b>{safeText(value)}</b>
        </p>
      );
    });
  };

  const closeSelectedApp = () => {
    setSelectedApp(null);
    setActionError("");
  };

  const renderApplicationDetails = (app) => {
    if (!app) return null;

    return (
      <div className="application-details-modal">
        <div className="application-details-topbar">
          <div>
            <div className="application-details-title">Application Details</div>
            <div className="application-details-subtitle">Summary of the selected request</div>
          </div>
          <span className={`status-pill ${getStatusClass(app.status)} application-details-status`}>
            {getValue(app.status)}
          </span>
        </div>

        <div className="application-details-actions">
          <button
            type="button"
            className="approve-btn"
            disabled={actionLoading || app.status === "Approved"}
            onClick={() => confirmUpdateApplicationStatus(app._id, "Approved")}
          >
            {actionLoading ? "Processing..." : "Approve"}
          </button>
          <button
            type="button"
            className="reject-btn"
            disabled={actionLoading || app.status === "Rejected"}
            onClick={() => confirmUpdateApplicationStatus(app._id, "Rejected")}
          >
            Reject
          </button>
        </div>

        <div className="application-details-grid">
          <div className="application-details-card">
            <h3>Applicant Information</h3>
            <p><span>Name:</span> <b>{getApplicantName(app)}</b></p>
            <p><span>First Name:</span> <b>{getValue(app.applicant?.firstName)}</b></p>
            <p><span>Middle Name:</span> <b>{getValue(app.applicant?.middleName)}</b></p>
            <p><span>Last Name:</span> <b>{getValue(app.applicant?.lastName)}</b></p>
            <p><span>Suffix:</span> <b>{getValue(app.applicant?.suffix, app.applicant?.suffixName)}</b></p>
            <p><span>Contact:</span> <b>{getValue(app.contact?.mobile, app.contact?.contactNumber, app.applicant?.contactNumber)}</b></p>
            <p><span>Email:</span> <b>{getValue(app.contact?.email, app.applicant?.email, app.email)}</b></p>
            <p><span>Nationality:</span> <b>{getValue(app.personalInfo?.nationality, app.applicant?.nationality)}</b></p>
            <p><span>Civil Status:</span> <b>{getValue(app.personalInfo?.civilStatus, app.applicant?.civilStatus)}</b></p>
            <p><span>Gender:</span> <b>{getValue(app.personalInfo?.gender, app.applicant?.gender)}</b></p>
          </div>

          <div className="application-details-card">
            <h3>Address</h3>
            <p><span>House No:</span> <b>{getValue(app.address?.houseNo)}</b></p>
            <p><span>Street:</span> <b>{getValue(app.address?.street)}</b></p>
            <p><span>Building:</span> <b>{getValue(app.address?.building)}</b></p>
            <p><span>Subdivision:</span> <b>{getValue(app.address?.subdivision)}</b></p>
            <p><span>Barangay:</span> <b>{getValue(app.address?.barangay)}</b></p>
            <p><span>City:</span> <b>{getValue(app.address?.city)}</b></p>
            <p><span>Province:</span> <b>{getValue(app.address?.province)}</b></p>
            <p><span>Landmark:</span> <b>{getValue(app.address?.landmark)}</b></p>
          </div>

          <div className="application-details-card">
            <h3>Business Details</h3>
            <p><span>Business Name:</span> <b>{getValue(app.businessName, app.businessInfo?.businessName, app.businessDetails?.businessName)}</b></p>
            <p><span>Application Type:</span> <b>{getValue(app.applicationType)}</b></p>
            <p><span>Project Type:</span> <b>{getValue(app.projectType, app.businessInfo?.projectType, app.businessDetails?.projectType)}</b></p>
            <p><span>Zone Type:</span> <b>{getValue(app.zoneType, app.businessInfo?.zoneType, app.businessDetails?.zoneType)}</b></p>
            <p><span>Line of Business:</span> <b>{getValue(app.businessInfo?.lineOfBusiness, app.businessDetails?.lineOfBusiness)}</b></p>
            <p><span>Business Area:</span> <b>{getValue(app.businessInfo?.area, app.businessInfo?.businessArea, app.businessDetails?.businessArea)} m²</b></p>
            <p><span>Male Personnel:</span> <b>{getValue(app.businessInfo?.malePersonnel, app.businessDetails?.malePersonnel, 0)}</b></p>
            <p><span>Female Personnel:</span> <b>{getValue(app.businessInfo?.femalePersonnel, app.businessDetails?.femalePersonnel, 0)}</b></p>
          </div>

          <div className="application-details-card">
            <h3>Application Summary</h3>
            <p><span>Status:</span> <b>{getValue(app.status)}</b></p>
            <p><span>Submitted:</span> <b>{app.createdAt ? new Date(app.createdAt).toLocaleString() : "N/A"}</b></p>
            <p><span>Updated:</span> <b>{app.updatedAt ? new Date(app.updatedAt).toLocaleString() : "N/A"}</b></p>
            <p><span>Application ID:</span> <b>{getValue(app._id)}</b></p>
            <p><span>Citizen:</span> <b>{getValue(app.citizenId, app.userId)}</b></p>
          </div>
        </div>

        <div className="application-details-grid application-details-fullwidth">
          <div className="application-details-card">
            <h3>Additional Submitted Data</h3>
            {renderObjectFields(app.applicant)}
            {renderObjectFields(app.address)}
            {renderObjectFields(app.businessInfo || app.businessDetails)}
          </div>
        </div>

        <div className="application-details-grid">
          <div className="application-details-card">
            <h3>Documents</h3>
            {app.documents && Object.keys(app.documents).length > 0 ? (
              Object.entries(app.documents).map(([key, value]) => (
                <p key={key}><span>{key}:</span> <b>{safeText(value)}</b></p>
              ))
            ) : app.attachments && Object.keys(app.attachments).length > 0 ? (
              Object.entries(app.attachments).map(([key, value]) => (
                <p key={key}><span>{key}:</span> <b>{safeText(value)}</b></p>
              ))
            ) : (
              <p>No documents uploaded.</p>
            )}
          </div>

          <div className="application-details-card">
            <h3>Signature</h3>
            {app.signature?.startsWith("data:image") ? (
              <img src={app.signature} alt="Signature" className="signature-img" />
            ) : (
              <p>No signature available.</p>
            )}
          </div>
        </div>

        {actionError && <p className="action-error">{actionError}</p>}
      </div>
    );
  };

  return (
    <div className="requests-page">
      <div className="requests-header">
        <div>
          <h1>Requests</h1>
          <p>Review, approve, or reject submitted application forms.</p>
        </div>

        <div className="staff-profile">
          <div className="staff-avatar">{staffInitials || "ST"}</div>
          <div>
            <strong>{staffName}</strong>
            <span>City Hall Staff</span>
          </div>
        </div>
      </div>

      <div className="filter-card">
        <div className="filter-group">
          <label>Date Filter</label>
          <div>
            <button type="button" className={dateFilter === "today" ? "active" : ""} onClick={() => setDateFilter("today")}>Today</button>
            <button type="button" className={dateFilter === "week" ? "active" : ""} onClick={() => setDateFilter("week")}>This Week</button>
            <button type="button" className={dateFilter === "month" ? "active" : ""} onClick={() => setDateFilter("month")}>This Month</button>
            <button type="button" className={dateFilter === "all" ? "active" : ""} onClick={() => setDateFilter("all")}>All Time</button>
          </div>
        </div>

        <div className="filter-group">
          <label>Type</label>
          <div>
            {["All", "New Application", "Renewal"].map((type) => (
              <button type="button" key={type} className={typeFilter === type ? "active" : ""} onClick={() => setTypeFilter(type)}>
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="table-card">
        {loading ? (
          <p className="table-message">Loading requests...</p>
        ) : error ? (
          <p className="table-error">{error}</p>
        ) : (
          <table className="request-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Applicant Name</th>
                <th>Request Type</th>
                <th>Date Submitted</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredRequests.length > 0 ? (
                filteredRequests.map((req) => (
                  <tr key={req.id}>
                    <td className="id-cell">{safeText(req.id)}</td>
                    <td>{safeText(req.name)}</td>
                    <td>{safeText(req.type)}</td>
                    <td>{safeText(req.displayDate)}</td>
                    <td>
                      <span className={`status-pill ${getStatusClass(req.status)}`}>
                        {safeText(req.status)}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="view-btn"
                        disabled={detailsLoading}
                        onClick={() => fetchApplicationDetails(req.id)}
                      >
                        {detailsLoading ? "Loading..." : "View Details"}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="empty-cell">
                    No requests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <CenteredModal
        open={Boolean(selectedApp)}
        title="Application Details"
        onClose={closeSelectedApp}
        hideActions
        className="request-details-modal"
      >
        {renderApplicationDetails(selectedApp)}
      </CenteredModal>

      <CenteredModal
        open={confirmAction.open}
        title={confirmAction.status === "Rejected" ? "Reject Application" : "Approve Application"}
        message={
          confirmAction.status === "Rejected"
            ? "Are you sure you want to reject this user?"
            : "Are you sure you want to approve this user?"
        }
        buttonText={confirmAction.status === "Rejected" ? "Reject" : "Approve"}
        cancelText="Cancel"
        onConfirm={handleConfirmAction}
        onCancel={() => setConfirmAction({ open: false, appId: null, status: "" })}
      />
    </div>
  );
}