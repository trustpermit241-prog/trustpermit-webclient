import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import "./InspectionProgress.css";
import CenteredModal from "../../components/CenteredModal";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { PAGE_SIZE, getFilteredInspections, getPagedInspections } from "./inspectionListUtils";

export default function InspectionProgress() {
  const [inspections, setInspections] = useState([]);
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [search, setSearch] = useState("");
  const [inspectionSearch, setInspectionSearch] = useState("");
  const [inspectionPage, setInspectionPage] = useState(1);
  const [newInspection, setNewInspection] = useState({
    citizenEmail: "",
    // allow selecting multiple types via multi-select; stored as an array
    types: [],
    // schedule per type: { "Fire Safety Inspection": { date: '', time: '' }, ... }
    typesSchedule: {},
    date: "",
    time: "",
    remarks: "",
  });
  const [typesOpen, setTypesOpen] = useState(false);
  const [openPickerFor, setOpenPickerFor] = useState(null); // tracks which type picker is open (type string or '__global__')

  const allTypes = [
    "Fire Safety Inspection",
    "Sanitary Inspection",
    "Building & Electrical",
    "Locational / Zoning",
    "Environmental",
  ];
  const [modal, setModal] = useState({ open: false, title: "", message: "", buttonText: "OK", variant: "default" });
  const [confirmAction, setConfirmAction] = useState({ open: false, inspection: null, status: "" });

  // ================= HELPER: get config with token =================
  const getAuthConfig = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setModal({ open: true, title: "Not Logged In", message: "You are not logged in. Please log in first.", buttonText: "OK", variant: "error" });
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
        const res = await axios.get("https://trustpermitbackend.onrender.com/api/users", config);
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
        const res = await axios.get("https://trustpermitbackend.onrender.com/api/inspection", config);
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

  // Suggest common inspection types based on business/category hints
  const suggestTypesForBusiness = (user) => {
    if (!user) return [];
    const text = (
      (user.businessName || "") + " " + (user.lineOfBusiness || "") + " " + (user.businessInfo?.lineOfBusiness || "")
    ).toLowerCase();

    const suggestions = new Set();
    if (text.includes("sari") || text.includes("sari-sari") || text.includes("grocery") || text.includes("retail")) {
      suggestions.add("Fire Safety Inspection");
      suggestions.add("Sanitary Inspection");
      suggestions.add("Locational / Zoning");
    }
    if (text.includes("restaurant") || text.includes("food") || text.includes("bakery") || text.includes("eat")) {
      suggestions.add("Sanitary Inspection");
      suggestions.add("Fire Safety Inspection");
    }
    if (text.includes("industrial") || text.includes("factory") || text.includes("auto") || text.includes("workshop")) {
      suggestions.add("Building & Electrical");
      suggestions.add("Fire Safety Inspection");
    }
    if (text.includes("environment") || text.includes("chemical") || text.includes("waste")) {
      suggestions.add("Environmental");
    }

    // fallback common set
    if (suggestions.size === 0) {
      suggestions.add("Fire Safety Inspection");
    }

    return Array.from(suggestions);
  };

  const suggestedTypes = selectedCitizen ? suggestTypesForBusiness(selectedCitizen) : [];

  const handleSubmit = async () => {
    const types = Array.isArray(newInspection.types)
      ? newInspection.types.map((t) => String(t || "").trim()).filter(Boolean)
      : [];

    // ensure each type has a date/time (per-type required)
    const missingForTypes = types.filter((type) => {
      const sched = (newInspection.typesSchedule || {})[type] || {};
      const date = sched.date;
      const time = sched.time;
      return !date || !time;
    });

    if (!newInspection.citizenEmail || types.length === 0 || missingForTypes.length > 0) {
      setModal({ open: true, title: "Missing Information", message: "Please select citizen, at least one type, and set date & time for each selected type.", buttonText: "OK", variant: "error" });
      return;
    }

    const config = getAuthConfig();
    if (!config) return;

    try {
      const created = [];

      // Create one inspection per selected type
      for (const type of types) {
        const sched = (newInspection.typesSchedule || {})[type] || {};
        const dateVal = sched.date || newInspection.date;
        const time = sched.time || newInspection.time;

        // Convert Date objects to 'YYYY-MM-DD' for backend (backend constructs full datetime using date + time)
        let date;
        if (dateVal instanceof Date) {
          const y = dateVal.getFullYear();
          const m = String(dateVal.getMonth() + 1).padStart(2, "0");
          const d = String(dateVal.getDate()).padStart(2, "0");
          date = `${y}-${m}-${d}`;
        } else {
          date = dateVal;
        }

        const payload = {
          citizenEmail: newInspection.citizenEmail,
          type,
          date,
          time,
          remarks: newInspection.remarks,
        };

        const res = await axios.post(
          "https://trustpermitbackend.onrender.com/api/inspection/schedule",
          payload,
          config
        );

        const savedInspection = res.data?.inspection;
        if (savedInspection && savedInspection._id) {
          created.push(savedInspection);
          try {
            const reportRes = await axios.get(`https://trustpermitbackend.onrender.com/api/inspection/${savedInspection._id}`, config);
            localStorage.setItem(`inspectionReport_${savedInspection._id}`, JSON.stringify(reportRes.data || { inspection: savedInspection }));
          } catch (cacheErr) {
            console.warn("Could not cache full inspection report details:", cacheErr);
            localStorage.setItem(`inspectionReport_${savedInspection._id}`, JSON.stringify(savedInspection));
          }
        }
      }

      if (created.length === 0) {
        setModal({ open: true, title: "Schedule Failed", message: "Backend did not return any inspection IDs!", buttonText: "OK", variant: "error" });
        return;
      }

      setInspections((prev) => [...created, ...prev]);
      setNewInspection({ citizenEmail: "", types: [], typesSchedule: {}, date: "", time: "", remarks: "" });
      // open each created inspection report in a new tab (one per inspection)
      try {
        created.forEach((ins) => {
          if (ins && ins._id) window.open(`/inspection-report/${ins._id}`, "_blank", "noopener,noreferrer");
        });
      } catch (e) {
        // ignore popup blocker errors
        console.warn("Could not open one or more inspection report tabs:", e);
      }

      setModal({ open: true, title: "Inspection(s) Scheduled", message: `Scheduled ${created.length} inspection${created.length === 1 ? "" : "s"}. Opened ${created.length} report${created.length === 1 ? "" : "s"} in new tab(s).`, buttonText: "OK", variant: "success" });
    } catch (err) {
      console.error("Schedule Inspection Error:", err);
      if (err.response) {
        setModal({ open: true, title: "Server Error", message: err.response.data.message || JSON.stringify(err.response.data), buttonText: "OK", variant: "error" });
      } else if (err.request) {
        setModal({ open: true, title: "Server Error", message: "No response from server. Check if backend is running.", buttonText: "OK", variant: "error" });
      } else {
        setModal({ open: true, title: "Error", message: "Error: " + err.message, buttonText: "OK", variant: "error" });
      }
    }
  };

  // ================= UPDATE STATUS =================
  const updateStatus = async (inspection, status) => {
    if (!inspection._id) {
      setModal({ open: true, title: "Update Failed", message: "Cannot update status: Inspection ID is missing!", buttonText: "OK", variant: "error" });
      return;
    }
    const config = getAuthConfig();
    if (!config) return;
    try {
      const res = await axios.patch(
        `https://trustpermitbackend.onrender.com/api/inspection/${inspection._id}/status`,
        { status },
        config
      );
      const updatedInspection = res.data;
      setInspections((prev) =>
        prev.map((ins) => (ins._id === inspection._id ? { ...ins, ...updatedInspection } : ins))
      );
      localStorage.setItem(
        `inspectionReport_${inspection._id}`,
        JSON.stringify({ ...inspection, ...updatedInspection })
      );
      setModal({ open: true, title: "Status Updated", message: `Inspection ${status.toLowerCase()} successfully.`, buttonText: "OK", variant: "success" });
    } catch (err) {
      console.error("Update status error:", err);
      setModal({ open: true, title: "Update Failed", message: "Failed to update status.", buttonText: "OK", variant: "error" });
    }
  };

  const confirmUpdateStatus = (inspection, status) => {
    if (!inspection || !inspection._id) {
      setModal({ open: true, title: "Update Failed", message: "Cannot update status: Inspection ID is missing!", buttonText: "OK", variant: "error" });
      return;
    }
    setConfirmAction({ open: true, inspection, status });
  };

  const handleConfirmStatus = async () => {
    const { inspection, status } = confirmAction;
    setConfirmAction({ open: false, inspection: null, status: "" });
    if (!inspection || !status) return;
    await updateStatus(inspection, status);
  };

  const filteredCitizens = users.filter((user) =>
    user.fullName.toLowerCase().includes(search.toLowerCase())
  );

  const filteredInspections = useMemo(
    () => getFilteredInspections(inspections, inspectionSearch),
    [inspections, inspectionSearch]
  );

  const pagedInspections = useMemo(
    () => getPagedInspections(filteredInspections, inspectionPage, PAGE_SIZE),
    [filteredInspections, inspectionPage]
  );

  useEffect(() => {
    setInspectionPage(1);
  }, [inspectionSearch]);

  useEffect(() => {
    if (inspectionPage > pagedInspections.totalPages) {
      setInspectionPage(pagedInspections.totalPages || 1);
    }
  }, [pagedInspections.totalPages, inspectionPage]);

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
        </div>
        <div className="ip-topbar-right">
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
                      <label className="ip-form-label">Inspection Type(s)</label>
                      <div className="ip-select-wrapper" style={{ position: 'relative' }}>
                        <button type="button" className="ip-multi-btn" onClick={() => setTypesOpen((s) => !s)}>
                          {Array.isArray(newInspection.types) && newInspection.types.length > 0
                            ? `${newInspection.types.length} selected`
                            : "Select inspection types"}
                        </button>

                        {typesOpen && (
                          <div className="ip-multi-panel" style={{ position: 'absolute', zIndex: 40, background: '#fff', border: '1px solid #e5e7eb', padding: 8, borderRadius: 6, marginTop: 6, minWidth: 260 }}>
                            {allTypes.map((t) => (
                              <label key={t} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                <input
                                  type="checkbox"
                                  checked={Array.isArray(newInspection.types) && newInspection.types.includes(t)}
                                onChange={() => {
                                  setNewInspection((prev) => {
                                    const prevTypes = Array.isArray(prev.types) ? prev.types.slice() : [];
                                    const idx = prevTypes.indexOf(t);
                                    const next = { ...prev };
                                    if (idx === -1) {
                                      prevTypes.push(t);
                                      // initialize schedule for this type with global date/time fallback (as Date object when possible)
                                      next.typesSchedule = { ...(next.typesSchedule || {}) };
                                      const existing = next.typesSchedule[t] || {};
                                      next.typesSchedule[t] = {
                                        date: existing.date || null,
                                        time: existing.time || "",
                                      };
                                    } else {
                                      prevTypes.splice(idx, 1);
                                      // remove schedule for removed type
                                      next.typesSchedule = { ...(next.typesSchedule || {}) };
                                      delete next.typesSchedule[t];
                                    }
                                    next.types = prevTypes;
                                    return next;
                                  });
                                }}
                                />
                                <span>{t}</span>
                              </label>
                            ))}
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                              <button type="button" className="ip-apply-btn" onClick={() => setTypesOpen(false)}>Done</button>
                              <button type="button" className="ip-clear-btn" onClick={() => setNewInspection((prev) => ({ ...prev, types: [], typesSchedule: {} }))}>Clear</button>
                            </div>
                          </div>
                        )}
                      </div>
                    
                      {/* Per-type schedule inputs */}
                      {Array.isArray(newInspection.types) && newInspection.types.length > 0 && (
                        <div style={{ marginTop: 10 }}>
                        {newInspection.types.map((t) => {
                          const sched = (newInspection.typesSchedule || {})[t] || { date: newInspection.date || "", time: newInspection.time || "" };
                          return (
                            <div key={t} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
                              <div style={{ minWidth: 220 }}>{t}</div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '1 1 220px', minWidth: 160 }}>
                                <button type="button" onClick={() => setOpenPickerFor(t)} style={{ width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, background: '#fff', border: '1px solid #e5e7eb' }} aria-hidden>
                                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M7 11H17" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M7 15H13" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                    <rect x="3" y="4" width="18" height="18" rx="2" stroke="#374151" strokeWidth="1.5"/>
                                    <path d="M16 2V6" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M8 2V6" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                </button>

                                <div style={{ flex: '1 1 auto' }}>
                                  <DatePicker
                                    selected={sched.date ? (sched.date instanceof Date ? sched.date : new Date(sched.date)) : null}
                                    onChange={(date) => setNewInspection((prev) => ({ ...prev, typesSchedule: { ...(prev.typesSchedule||{}), [t]: { ...(prev.typesSchedule?.[t]||{}), date } } }))}
                                    dateFormat="yyyy-MM-dd"
                                    placeholderText="Select date"
                                    open={openPickerFor === t}
                                    onClickOutside={() => setOpenPickerFor(null)}
                                    onSelect={() => setOpenPickerFor(null)}
                                    className="ip-input"
                                  />
                                </div>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 140 }}>
                                <input
                                  type="time"
                                  value={sched.time}
                                  onChange={(e) => setNewInspection((prev) => ({ ...prev, typesSchedule: { ...(prev.typesSchedule||{}), [t]: { ...(prev.typesSchedule?.[t]||{}), time: e.target.value } } }))}
                                  style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid #e5e7eb' }}
                                />
                              </div>
                            </div>
                          );
                        })}
                        </div>
                      )}
                      {suggestedTypes && suggestedTypes.length > 0 && (!newInspection.types || newInspection.types.length === 0) && (
                        <div className="ip-suggestion" style={{ marginTop: 8, color: '#6b7280', fontSize: 13 }}>Suggested: {suggestedTypes.join(', ')} <button type="button" style={{ marginLeft: 10, padding: '4px 8px' }} onClick={() => setNewInspection((prev) => ({ ...prev, types: suggestedTypes }))}>Apply</button></div>
                      )}
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

                {/* Per-type date/time pickers are used; global date/time removed */}

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
                {filteredInspections.length} total entries
              </div>
            </div>

            <div className="ip-inspection-search">
              <input
                type="text"
                value={inspectionSearch}
                onChange={(event) => setInspectionSearch(event.target.value)}
                placeholder="Search by citizen, email, or inspection type"
              />
              {inspectionSearch && (
                <button type="button" className="ip-clear-search" onClick={() => setInspectionSearch("")}>
                  Clear
                </button>
              )}
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
                  {pagedInspections.items.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="ip-empty">No inspections scheduled yet.</td>
                    </tr>
                  ) : (
                    pagedInspections.items.map((ins) => {
                      const { icon, cls } = getTypeIcon(ins.type);
                      return (
                        <tr key={ins._id}>
                          <td>
                            <div className="ip-type-cell">
                              <div className={`ip-type-icon ${cls}`}>{icon}</div>
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
                                type="button"
                                className="ip-action-print"
                                onClick={() => window.open(`/inspection-report/${ins._id}`, "_blank", "noopener,noreferrer")}
                                title="Print Report"
                              >
                                Print Report
                              </button>
                              <button
                                type="button"
                                className="ip-action-approve"
                                onClick={() => confirmUpdateStatus(ins, "Approved")}
                                title="Approve"
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                className="ip-action-reject"
                                onClick={() => confirmUpdateStatus(ins, "Rejected")}
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
                Showing {filteredInspections.length === 0 ? 0 : pagedInspections.startIndex + 1} to {pagedInspections.endIndex + 1} of {filteredInspections.length} entries
              </div>
              <div className="ip-page-btns">
                <button
                  type="button"
                  className="ip-page-btn ip-arr"
                  onClick={() => setInspectionPage((prev) => Math.max(prev - 1, 1))}
                  disabled={inspectionPage === 1}
                >
                  ‹
                </button>
                {Array.from({ length: pagedInspections.totalPages }, (_, index) => index + 1).map((pageNumber) => (
                  <button
                    key={pageNumber}
                    type="button"
                    className={`ip-page-btn ${inspectionPage === pageNumber ? "ip-active" : ""}`}
                    onClick={() => setInspectionPage(pageNumber)}
                  >
                    {pageNumber}
                  </button>
                ))}
                <button
                  type="button"
                  className="ip-page-btn ip-arr"
                  onClick={() => setInspectionPage((prev) => Math.min(prev + 1, pagedInspections.totalPages))}
                  disabled={inspectionPage === pagedInspections.totalPages || pagedInspections.totalPages === 0}
                >
                  ›
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <CenteredModal
        open={modal.open}
        title={modal.title}
        message={modal.message}
        buttonText={modal.buttonText}
        variant={modal.variant}
        onClose={() => setModal((prev) => ({ ...prev, open: false }))}
      />

      <CenteredModal
        open={confirmAction.open}
        title={confirmAction.status === "Rejected" ? "Confirm Rejection" : "Confirm Approval"}
        message={
          confirmAction.status === "Rejected"
            ? "Are you sure you want to reject this user?"
            : "Are you sure you want to approve this user?"
        }
        buttonText={confirmAction.status === "Rejected" ? "Reject" : "Approve"}
        cancelText="Cancel"
        onConfirm={handleConfirmStatus}
        onCancel={() => setConfirmAction({ open: false, inspection: null, status: "" })}
      />
    </div>
  );
}