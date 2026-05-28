import React, { useState, useEffect } from "react";
import axios from "axios";
import "./InspectionProgress.css";

export default function InspectionProgress() {
  const [inspections, setInspections] = useState([]);
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [search, setSearch] = useState("");
  const [newInspection, setNewInspection] = useState({
    citizenEmail: "",
    type: "",
    date: "",
    time: "",
    remarks: "",
  });

  // ================= HELPER: get config with token =================
  const getAuthConfig = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("You are not logged in. Please log in first.");
      return null;
    }
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  // ================= FETCH CITIZENS =================
  useEffect(() => {
    const fetchUsers = async () => {
      const config = getAuthConfig();
      if (!config) return;
      try {
        // Use the correct endpoint that returns an array of users
        const res = await axios.get("https://trustpermit-backend.onrender.com/api/users", config);
        setUsers(res.data);
      } catch (err) {
        console.error("Fetch users error:", err);
      } finally {
        setLoadingUsers(false);
      }
    };
    fetchUsers();
  }, []);

  // ================= FETCH INSPECTIONS =================
  useEffect(() => {
    const fetchInspections = async () => {
      const config = getAuthConfig();
      if (!config) return;
      try {
        const res = await axios.get("https://trustpermit-backend.onrender.com/api/inspection", config);
        setInspections(res.data);
      } catch (err) {
        console.error("Fetch inspections error:", err);
      }
    };
    fetchInspections();
  }, []);

  // ================= SUBMIT NEW INSPECTION =================
  const safeUsers = Array.isArray(users) ? users : [];

const selectedCitizen = safeUsers.find(
  (u) => u.email === newInspection.citizenEmail
);

  const handleSubmit = async () => {
    if (!newInspection.citizenEmail || !newInspection.type || !newInspection.date || !newInspection.time) {
      return alert("Please fill all required fields (Citizen, Type, Date, Time)!");
    }
    const config = getAuthConfig();
    if (!config) return;
    try {
      const res = await axios.post(
        "https://trustpermit-backend.onrender.com/api/inspection/schedule",
        newInspection,
        config
      );
      const savedInspection = res.data.inspection;
      if (!savedInspection || !savedInspection._id) {
        return alert("Backend did not return an inspection ID!");
      }
      setInspections((prev) => [savedInspection, ...prev]);
      setNewInspection({ citizenEmail: "", type: "", date: "", time: "", remarks: "" });
      alert("Inspection scheduled successfully!");
    } catch (err) {
      console.error("Schedule Inspection Error:", err);
      if (err.response) {
        alert("Server Error:\n" + (err.response.data.message || JSON.stringify(err.response.data)));
      } else if (err.request) {
        alert("No response from server. Check if backend is running.");
      } else {
        alert("Error: " + err.message);
      }
    }
  };

  // ================= UPDATE STATUS =================
  const updateStatus = async (inspection, status) => {
    if (!inspection._id) return alert("Cannot update status: Inspection ID is missing!");
    const config = getAuthConfig();
    if (!config) return;
    try {
      await axios.patch(
        `https://trustpermit-backend.onrender.com/api/inspection/${inspection._id}/status`,
        { status },
        config
      );
      setInspections((prev) =>
        prev.map((ins) => (ins._id === inspection._id ? { ...ins, status } : ins))
      );
    } catch (err) {
      console.error("Update status error:", err);
      alert("Failed to update status.");
    }
  };

  const filteredCitizens = users.filter((user) =>
    user.fullName.toLowerCase().includes(search.toLowerCase())
  );

  // ================= STATS =================
  const total = inspections.length;
  const approved = inspections.filter((i) => i.status === "Approved").length;
  const pending = inspections.filter((i) => !i.status || i.status === "Pending").length;
  const rejected = inspections.filter((i) => i.status === "Rejected").length;

  const getTypeIcon = (type) => {
    if (!type) return { icon: "", cls: "type-default" };
    const t = type.toLowerCase();
    if (t.includes("fire")) return { icon: "", cls: "type-fire" };
    if (t.includes("sanit")) return { icon: "", cls: "type-sanit" };
    if (t.includes("build") || t.includes("electr")) return { icon: "", cls: "type-building" };
    if (t.includes("locat") || t.includes("zone") || t.includes("zoning")) return { icon: "", cls: "type-location" };
    if (t.includes("environ")) return { icon: "", cls: "type-env" };
    return { icon: "", cls: "type-default" };
  };

  const getStatusBadge = (status) => {
    if (status === "Approved") return "badge-approved";
    if (status === "Rejected") return "badge-rejected";
    return "badge-pending";
  };

  const getStatusLabel = (status) => {
    if (status === "Approved") return "Approved";
    if (status === "Rejected") return "Rejected";
    return "Pending";
  };

  // ================= RENDER =================
  return (
    <div className="ip-wrapper">

      {/* ── TOP BAR ── */}
      <div className="ip-topbar">
        <div className="ip-topbar-left">
          <div className="ip-page-title">Inspections</div>
          <div className="ip-breadcrumb">Dashboard › <span>Inspections</span></div>
        </div>
        <div className="ip-topbar-right">
          <div className="ip-date-chip">
            
            {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </div>
        </div>
      </div>

      <div className="ip-content">

        {/* ── STAT CARDS ── */}
        <div className="ip-stats-grid">
          <div className="ip-stat-card ip-stat-blue">
            <div className="ip-stat-top">
              <span className="ip-stat-viewall">View all</span>
            </div>
            <div className="ip-stat-label">Total Inspections</div>
            <div className="ip-stat-num">{total}</div>
            <div className="ip-stat-sub">All time</div>
            <svg className="ip-sparkline" width="100%" height="28" viewBox="0 0 120 28">
              <polyline points="0,20 20,16 40,18 60,10 80,14 100,8 120,12" fill="none" stroke="#3B6EF6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
            </svg>
          </div>
          <div className="ip-stat-card ip-stat-green">
            <div className="ip-stat-top">
              
              <span className="ip-stat-viewall">View all</span>
            </div>
            <div className="ip-stat-label">Approved</div>
            <div className="ip-stat-num">{approved}</div>
            <div className="ip-stat-sub">{total ? Math.round((approved / total) * 100) : 0}% of total</div>
            <svg className="ip-sparkline" width="100%" height="28" viewBox="0 0 120 28">
              <polyline points="0,22 20,18 40,14 60,10 80,12 100,8 120,6" fill="none" stroke="#16A34A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
            </svg>
          </div>
          <div className="ip-stat-card ip-stat-amber">
            <div className="ip-stat-top">
              <span className="ip-stat-viewall">View all</span>
            </div>
            <div className="ip-stat-label">Pending</div>
            <div className="ip-stat-num">{pending}</div>
            <div className="ip-stat-sub">{total ? Math.round((pending / total) * 100) : 0}% of total</div>
            <svg className="ip-sparkline" width="100%" height="28" viewBox="0 0 120 28">
              <polyline points="0,14 20,18 40,12 60,16 80,10 100,14 120,16" fill="none" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
            </svg>
          </div>
          <div className="ip-stat-card ip-stat-red">
            <div className="ip-stat-top">
              <span className="ip-stat-viewall">View all</span>
            </div>
            <div className="ip-stat-label">Rejected</div>
            <div className="ip-stat-num">{rejected}</div>
            <div className="ip-stat-sub">{total ? Math.round((rejected / total) * 100) : 0}% of total</div>
            <svg className="ip-sparkline" width="100%" height="28" viewBox="0 0 120 28">
              <polyline points="0,10 20,14 40,8 60,16 80,12 100,18 120,10" fill="none" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
            </svg>
          </div>
        </div>

        {/* ── TWO COLUMN: FORM + TABLE ── */}
        <div className="ip-two-col">

          {/* ── SCHEDULE FORM ── */}
          <div className="ip-form-card">
            <div className="ip-card-header">
              <div>
                <div className="ip-card-title">Schedule New Inspection</div>
                <div className="ip-card-sub">Fill in the details to schedule</div>
              </div>
            </div>

            {loadingUsers ? (
              <div className="ip-loading">Loading citizens...</div>
            ) : (
              <>
                {/* Search citizen */}
                <div className="ip-search-box">
                  <span className="ip-search-icon"></span>
                  <input
                    type="text"
                    placeholder="Search by name, email or address..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>

                {/* Citizen select */}
                <div className="ip-form-row">
                  <div className="ip-form-group">
                    <label className="ip-form-label">Citizen</label>
                    <div className="ip-select-wrapper">
                      <select
                        value={newInspection.citizenEmail}
                        onChange={(e) =>
                          setNewInspection((prev) => ({ ...prev, citizenEmail: e.target.value }))
                        }
                      >
                        <option value="">Select citizen</option>
                        {filteredCitizens.map((c) => (
                          <option key={c._id || c.email} value={c.email}>
                            {c.fullName} ({c.email})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="ip-form-group">
                    <label className="ip-form-label">Inspection Type</label>
                    <div className="ip-select-wrapper">
                      <select
                        value={newInspection.type}
                        onChange={(e) =>
                          setNewInspection((prev) => ({ ...prev, type: e.target.value }))
                        }
                      >
                        <option value="">Select type</option>
                        <option>Fire Safety Inspection</option>
                        <option>Sanitary Inspection</option>
                        <option>Building &amp; Electrical</option>
                        <option>Locational / Zoning</option>
                        <option>Environmental</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Citizen info preview */}
                {selectedCitizen && (
                  <div className="ip-citizen-preview">
                    <div className="ip-citizen-avatar">
                      {selectedCitizen.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="ip-citizen-name">{selectedCitizen.fullName}</div>
                      <div className="ip-citizen-email">{selectedCitizen.email}</div>
                    </div>
                  </div>
                )}

                {/* Date & Time */}
                <div className="ip-form-row">
                  <div className="ip-form-group">
                    <label className="ip-form-label">Date</label>
                    <input
                      className="ip-input"
                      type="date"
                      value={newInspection.date}
                      onChange={(e) =>
                        setNewInspection((prev) => ({ ...prev, date: e.target.value }))
                      }
                    />
                  </div>
                  <div className="ip-form-group">
                    <label className="ip-form-label">Time</label>
                    <input
                      className="ip-input"
                      type="time"
                      value={newInspection.time}
                      onChange={(e) =>
                        setNewInspection((prev) => ({ ...prev, time: e.target.value }))
                      }
                    />
                  </div>
                </div>

                {/* Remarks */}
                <div className="ip-form-group">
                  <label className="ip-form-label">Remarks (Optional)</label>
                  <textarea
                    className="ip-textarea"
                    placeholder="Add any additional notes..."
                    value={newInspection.remarks}
                    onChange={(e) =>
                      setNewInspection((prev) => ({ ...prev, remarks: e.target.value }))
                    }
                  />
                </div>

                <button className="ip-submit-btn" onClick={handleSubmit}>
                  Schedule Inspection
                </button>

                <div className="ip-disclaimer">
                  Please ensure all information is accurate before scheduling.
                </div>
              </>
            )}
          </div>

          {/* ── TABLE ── */}
          <div className="ip-table-card">
            <div className="ip-table-top">
              <div className="ip-card-header" style={{ marginBottom: 0 }}>
                <div className="ip-card-title">All Scheduled Inspections</div>
              </div>
              <div className="ip-tbl-meta">
                {inspections.length} total entries
              </div>
            </div>

            <div className="ip-table-scroll">
              <table className="ip-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Citizen</th>
                    <th>Date &amp; Time</th>
                    <th>Inspector</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {inspections.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="ip-empty">No inspections scheduled yet.</td>
                    </tr>
                  ) : (
                    inspections.map((ins) => {
                      const { icon, cls } = getTypeIcon(ins.type);
                      return (
                        <tr key={ins._id}>
                          <td>
                            <div className="ip-type-cell">
                              <div>
                                <div className="ip-type-name">{ins.type || "—"}</div>
                                <div className="ip-type-sub">Inspection</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="ip-citizen-cell-name">
                              {ins.citizenId?.fullName || "—"}
                            </div>
                            <div className="ip-citizen-cell-email">
                              {ins.citizenId?.email || "—"}
                            </div>
                          </td>
                          <td>
                            <div className="ip-date-line">
                              {ins.date ? new Date(ins.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                            </div>
                            <div className="ip-time-line">
                              {ins.date ? new Date(ins.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ins.time || "—"}
                            </div>
                          </td>
                          <td>
                            <div className="ip-inspector">
                              {ins.inspector || <span className="ip-dash">—</span>}
                            </div>
                          </td>
                          <td>
                            <span className={`ip-badge ${getStatusBadge(ins.status)}`}>
                              {getStatusLabel(ins.status)}
                            </span>
                          </td>
                          <td>
                            <div className="ip-row-actions">
                              <button
                                className="ip-action-approve"
                                onClick={() => updateStatus(ins, "Approved")}
                                title="Approve"
                              >
                                Approve
                              </button>
                              <button
                                className="ip-action-reject"
                                onClick={() => updateStatus(ins, "Rejected")}
                                title="Reject"
                              >
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="ip-pagination">
              <div className="ip-page-info">
                Showing 1 to {Math.min(inspections.length, 10)} of {inspections.length} entries
              </div>
              <div className="ip-page-btns">
                <button className="ip-page-btn ip-arr">‹</button>
                <button className="ip-page-btn ip-active">1</button>
                <button className="ip-page-btn">2</button>
                <button className="ip-page-btn">3</button>
                <button className="ip-page-btn ip-arr">›</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}