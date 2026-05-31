import React, { useEffect, useState } from "react";
import "./Requests.css";
import { io } from "socket.io-client";

const BACKEND_URL = "https://trustpermit-backend.onrender.com";
const API_URL = `${BACKEND_URL}/api`;

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

    socket = io(BACKEND_URL, {
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

      {selectedApp && (
        <div className="details-card">
          <div className="details-title-row">
            <div>
              <h2>Application Details</h2>
              <p>Review all submitted application information.</p>
            </div>

            <button
              type="button"
              className="close-btn"
              onClick={() => {
                setSelectedApp(null);
                setActionError("");
              }}
            >
              ✕
            </button>
          </div>

          <div className="info-grid">
            <div className="info-box">
              <h3>Applicant Information</h3>
              <p><span>Name:</span> <b>{getApplicantName(selectedApp)}</b></p>
              <p><span>First Name:</span> <b>{getValue(selectedApp.applicant?.firstName)}</b></p>
              <p><span>Middle Name:</span> <b>{getValue(selectedApp.applicant?.middleName)}</b></p>
              <p><span>Last Name:</span> <b>{getValue(selectedApp.applicant?.lastName)}</b></p>
              <p><span>Suffix:</span> <b>{getValue(selectedApp.applicant?.suffix, selectedApp.applicant?.suffixName)}</b></p>
              <p><span>Contact:</span> <b>{getValue(selectedApp.contact?.mobile, selectedApp.contact?.contactNumber, selectedApp.applicant?.contactNumber)}</b></p>
              <p><span>Email:</span> <b>{getValue(selectedApp.contact?.email, selectedApp.applicant?.email, selectedApp.email, selectedApp.userId)}</b></p>
              <p><span>Nationality:</span> <b>{getValue(selectedApp.personalInfo?.nationality, selectedApp.applicant?.nationality)}</b></p>
              <p><span>Civil Status:</span> <b>{getValue(selectedApp.personalInfo?.civilStatus, selectedApp.applicant?.civilStatus)}</b></p>
              <p><span>Gender:</span> <b>{getValue(selectedApp.personalInfo?.gender, selectedApp.applicant?.gender)}</b></p>
              {renderObjectFields(selectedApp.applicant)}
            </div>

            <div className="info-box">
              <h3>Address Information</h3>
              <p><span>House No:</span> <b>{getValue(selectedApp.address?.houseNo)}</b></p>
              <p><span>Street:</span> <b>{getValue(selectedApp.address?.street)}</b></p>
              <p><span>Building:</span> <b>{getValue(selectedApp.address?.building)}</b></p>
              <p><span>Subdivision:</span> <b>{getValue(selectedApp.address?.subdivision)}</b></p>
              <p><span>Barangay:</span> <b>{getValue(selectedApp.address?.barangay)}</b></p>
              <p><span>City:</span> <b>{getValue(selectedApp.address?.city)}</b></p>
              <p><span>Province:</span> <b>{getValue(selectedApp.address?.province)}</b></p>
              <p><span>Landmark:</span> <b>{getValue(selectedApp.address?.landmark)}</b></p>
              {renderObjectFields(selectedApp.address)}
            </div>

            <div className="info-box">
              <h3>Business Details</h3>
              <p><span>Business Name:</span> <b>{getValue(selectedApp.businessName, selectedApp.businessInfo?.businessName, selectedApp.businessDetails?.businessName)}</b></p>
              <p><span>Application Type:</span> <b>{getValue(selectedApp.applicationType)}</b></p>
              <p><span>Project Type:</span> <b>{getValue(selectedApp.projectType, selectedApp.businessInfo?.projectType, selectedApp.businessDetails?.projectType)}</b></p>
              <p><span>Zone Type:</span> <b>{getValue(selectedApp.zoneType, selectedApp.businessInfo?.zoneType, selectedApp.businessDetails?.zoneType)}</b></p>
              <p><span>Line of Business:</span> <b>{getValue(selectedApp.businessInfo?.lineOfBusiness, selectedApp.businessDetails?.lineOfBusiness)}</b></p>
              <p><span>Business Area:</span> <b>{getValue(selectedApp.businessInfo?.area, selectedApp.businessInfo?.businessArea, selectedApp.businessDetails?.businessArea)} m²</b></p>
              <p><span>Male Personnel:</span> <b>{getValue(selectedApp.businessInfo?.malePersonnel, selectedApp.businessDetails?.malePersonnel, 0)}</b></p>
              <p><span>Female Personnel:</span> <b>{getValue(selectedApp.businessInfo?.femalePersonnel, selectedApp.businessDetails?.femalePersonnel, 0)}</b></p>
              {renderObjectFields(selectedApp.businessInfo || selectedApp.businessDetails)}
            </div>

            <div className="info-box">
              <h3>Application Status</h3>
              <p><span>Status:</span> <b>{getValue(selectedApp.status)}</b></p>
              <p><span>Created At:</span> <b>{selectedApp.createdAt ? new Date(selectedApp.createdAt).toLocaleString() : "N/A"}</b></p>
              <p><span>Updated At:</span> <b>{selectedApp.updatedAt ? new Date(selectedApp.updatedAt).toLocaleString() : "N/A"}</b></p>
              <p><span>Application ID:</span> <b>{getValue(selectedApp._id)}</b></p>
              <p><span>Citizen:</span> <b>{getValue(selectedApp.citizenId, selectedApp.userId)}</b></p>
            </div>
          </div>

          <div className="bottom-grid">
            <div className="small-card">
              <h3>Signature</h3>

              {selectedApp.signature?.startsWith("data:image") ? (
                <img src={selectedApp.signature} alt="Signature" className="signature-img" />
              ) : (
                <p>No signature available.</p>
              )}
            </div>

            <div className="small-card">
              <h3>Uploaded Documents</h3>

              {selectedApp.documents && Object.keys(selectedApp.documents).length > 0 ? (
                <div className="documents-list">
                  {Object.entries(selectedApp.documents).map(([key, value]) => (
                    <p key={key}>
                      <b>{key}:</b> {safeText(value)}
                    </p>
                  ))}
                </div>
              ) : selectedApp.attachments && Object.keys(selectedApp.attachments).length > 0 ? (
                <div className="documents-list">
                  {Object.entries(selectedApp.attachments).map(([key, value]) => (
                    <p key={key}>
                      <b>{key}:</b> {safeText(value)}
                    </p>
                  ))}
                </div>
              ) : (
                <p>No documents uploaded.</p>
              )}
            </div>
          </div>

          

          {actionError && <p className="action-error">{actionError}</p>}

          <div className="action-bar">
            <button
              type="button"
              className="approve-btn"
              disabled={actionLoading || selectedApp.status === "Approved"}
              onClick={() => updateApplicationStatus(selectedApp._id, "Approved")}
            >
              {actionLoading ? "Processing..." : "✓ Approve Application"}
            </button>

            <button
              type="button"
              className="reject-btn"
              disabled={actionLoading || selectedApp.status === "Rejected"}
              onClick={() => updateApplicationStatus(selectedApp._id, "Rejected")}
            >
              ✕ Reject Application
            </button>
          </div>
        </div>
      )}
    </div>
  );
}