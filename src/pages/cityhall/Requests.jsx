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
      name: app.applicant?.firstName
        ? `${app.applicant.firstName} ${app.applicant.lastName || ""}`.trim()
        : app.businessName || "Unknown Applicant",
      date: app.createdAt ? new Date(app.createdAt).toISOString().split("T")[0] : "",
      displayDate: app.createdAt
        ? new Date(app.createdAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "2-digit",
          })
        : "-",
      type: app.applicationType || "N/A",
      status: app.status || "Pending",
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

      const updatedApplication = data.application || data;

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
            <button
              type="button"
              className={dateFilter === "today" ? "active" : ""}
              onClick={() => setDateFilter("today")}
            >
              Today
            </button>

            <button
              type="button"
              className={dateFilter === "week" ? "active" : ""}
              onClick={() => setDateFilter("week")}
            >
              This Week
            </button>

            <button
              type="button"
              className={dateFilter === "month" ? "active" : ""}
              onClick={() => setDateFilter("month")}
            >
              This Month
            </button>

            <button
              type="button"
              className={dateFilter === "all" ? "active" : ""}
              onClick={() => setDateFilter("all")}
            >
              All Time
            </button>
          </div>
        </div>

        <div className="filter-group">
          <label>Type</label>
          <div>
            {["All", "New Application", "Renewal"].map((type) => (
              <button
                type="button"
                key={type}
                className={typeFilter === type ? "active" : ""}
                onClick={() => setTypeFilter(type)}
              >
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
                    <td className="id-cell">{req.id}</td>
                    <td>{req.name}</td>
                    <td>{req.type}</td>
                    <td>{req.displayDate}</td>
                    <td>
                      <span className={`status-pill ${getStatusClass(req.status)}`}>
                        {req.status}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="view-btn"
                        onClick={() => {
                          setSelectedApp(req.raw);
                          setActionError("");
                        }}
                      >
                        View Details
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
              <p>Review applicant information and documents.</p>
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

              <p>
                <span>Name:</span>{" "}
                <b>
                  {selectedApp.applicant?.firstName || ""}{" "}
                  {selectedApp.applicant?.middleName || ""}{" "}
                  {selectedApp.applicant?.lastName || ""}{" "}
                  {selectedApp.applicant?.suffixName || ""}
                </b>
              </p>

              <p>
                <span>Contact:</span>{" "}
                <b>{selectedApp.applicant?.contactNumber || "N/A"}</b>
              </p>
              <p>
                <span>Email:</span>{" "}
                <b>{selectedApp.applicant?.email || "N/A"}</b>
              </p>
              <p>
                <span>Nationality:</span>{" "}
                <b>{selectedApp.applicant?.nationality || "N/A"}</b>
              </p>
              <p>
                <span>Civil Status:</span>{" "}
                <b>{selectedApp.applicant?.civilStatus || "N/A"}</b>
              </p>
              <p>
                <span>Gender:</span>{" "}
                <b>{selectedApp.applicant?.gender || "N/A"}</b>
              </p>
            </div>

            <div className="info-box">
              <h3>Address Information</h3>

              <p>
                <span>Address:</span>{" "}
                <b>
                  {selectedApp.address?.houseNo || ""}{" "}
                  {selectedApp.address?.street || ""}
                </b>
              </p>

              <p>
                <span>Barangay:</span>{" "}
                <b>{selectedApp.address?.barangay || "N/A"}</b>
              </p>
              <p>
                <span>City:</span>{" "}
                <b>{selectedApp.address?.city || "N/A"}</b>
              </p>
              <p>
                <span>Province:</span>{" "}
                <b>{selectedApp.address?.province || "N/A"}</b>
              </p>
              <p>
                <span>Subdivision:</span>{" "}
                <b>{selectedApp.address?.subdivision || "N/A"}</b>
              </p>
              <p>
                <span>Landmark:</span>{" "}
                <b>{selectedApp.address?.landmark || "N/A"}</b>
              </p>
            </div>

            <div className="info-box">
              <h3>Business Details</h3>

              <p>
                <span>Business Name:</span>{" "}
                <b>{selectedApp.businessName || "N/A"}</b>
              </p>
              <p>
                <span>Type:</span>{" "}
                <b>{selectedApp.applicationType || "N/A"}</b>
              </p>
              <p>
                <span>Project:</span>{" "}
                <b>{selectedApp.projectType || "N/A"}</b>
              </p>
              <p>
                <span>Zone:</span>{" "}
                <b>{selectedApp.zoneType || "N/A"}</b>
              </p>
              <p>
                <span>Line of Business:</span>{" "}
                <b>{selectedApp.businessDetails?.lineOfBusiness || "N/A"}</b>
              </p>
              <p>
                <span>Area:</span>{" "}
                <b>{selectedApp.businessDetails?.businessArea || 0} m²</b>
              </p>
              <p>
                <span>Staff:</span>{" "}
                <b>
                  {selectedApp.businessDetails?.malePersonnel || 0} M /{" "}
                  {selectedApp.businessDetails?.femalePersonnel || 0} F
                </b>
              </p>
            </div>
          </div>

          <div className="bottom-grid">
            <div className="small-card">
              <h3>Signature</h3>

              {selectedApp.signature?.startsWith("data:image") ? (
                <img
                  src={selectedApp.signature}
                  alt="Signature"
                  className="signature-img"
                />
              ) : (
                <p>No signature available.</p>
              )}
            </div>

            <div className="small-card">
              <h3>Uploaded Documents</h3>

              {selectedApp.documents &&
              Object.keys(selectedApp.documents).length > 0 ? (
                <div className="documents-list">
                  {Object.entries(selectedApp.documents).map(([key, value]) => (
                    <p key={key}>
                      <b>{key}:</b> {value}
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