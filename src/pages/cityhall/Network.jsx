// Network.jsx
import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import "./Network.css";

const getApiBaseUrl = () => {
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return "http://localhost:5000";
    }
  }

  return process.env.REACT_APP_API_URL || "https://trustpermit-backend.onrender.com";
};

const API_BASE_URL = getApiBaseUrl();

export default function Network() {
  const [networkCounts, setNetworkCounts] = useState({
    validations: {
      B: 0,
      F: 0,
      H: 0,
      C: 0,
      E: 0,
    },
    releasedPermits: 0,
  });

  

  const agencies = [
    {
      id: "B",
      name: "Business Permits Office",
      dept: "City Hall",
      role: "Primary Issuer",
      status: "Online",
      validations: networkCounts.validations.B,
      avgResponse: "1h",
      load: 68,
    },
    {
      id: "F",
      name: "Fire Safety Bureau",
      dept: "Fire Department",
      role: "Validator",
      status: "Online",
      validations: networkCounts.validations.F,
      avgResponse: "4h",
      load: 45,
    },
    {
      id: "H",
      name: "Health Department",
      dept: "Sanitation",
      role: "Validator",
      status: "Online",
      validations: networkCounts.validations.H,
      avgResponse: "2h",
      load: 58,
    },
    {
      id: "C",
      name: "City Planning Office",
      dept: "Planning",
      role: "Validator",
      status: "Online",
      validations: networkCounts.validations.C,
      avgResponse: "1h",
      load: 72,
    },
    {
      id: "E",
      name: "Environment Office",
      dept: "Environment",
      role: "Validator",
      status: "Online",
      validations: networkCounts.validations.E,
      avgResponse: "2h",
      load: 40,
    },
  ];

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const fetchNetworkCounts = async () => {
      try {
        const [inspRes, paymentRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/inspection`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE_URL}/api/payments`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const inspectionsData = await inspRes.json();
        const paymentsData = await paymentRes.json();

        const inspections = Array.isArray(inspectionsData) ? inspectionsData : inspectionsData?.inspections || [];
        const payments = Array.isArray(paymentsData) ? paymentsData : paymentsData?.payments || [];

        // Count approved inspections per agency by matching keywords in inspection.type
        const approvedInspections = inspections.filter((i) => String(i.status || "").toLowerCase() === "approved");

        const counts = { B: 0, F: 0, H: 0, C: 0, E: 0 };

        const keywords = {
          F: ["fire", "bfp"],
          H: ["sanitary", "health", "sanitary inspection", "health inspection"],
          C: ["locational", "zoning", "planning"],
          E: ["environment", "environmental"],
        };

        approvedInspections.forEach((insp) => {
          const type = String(insp.type || "").toLowerCase();
          // Fire Safety
          if (keywords.F.some((k) => type.includes(k))) counts.F += 1;
          // Health
          if (keywords.H.some((k) => type.includes(k))) counts.H += 1;
          // City Planning
          if (keywords.C.some((k) => type.includes(k))) counts.C += 1;
          // Environment
          if (keywords.E.some((k) => type.includes(k))) counts.E += 1;
        });

        // Business Permits Office validations are based on released permits
        const releasedPermits = payments.filter((payment) => {
          const permitReleased = payment.permitReleased === true;
          const applicationReleased = String(payment?.applicationId?.status || "").toLowerCase() === "released";
          return permitReleased || applicationReleased;
        }).length;

        counts.B = releasedPermits;

        const pendingInspections = inspections.filter((i) => String(i.status || "").toLowerCase() === "pending").length;
        const totalValidates = Object.values(counts).reduce((s, v) => s + (Number(v) || 0), 0);

        // push trend data for realtime chart (keep last 24 points)
        setValidateTrend((prev) => {
          const next = [...prev, totalValidates];
          if (next.length > 24) next.shift();
          return next;
        });
        setPendingTrend((prev) => {
          const next = [...prev, pendingInspections];
          if (next.length > 24) next.shift();
          return next;
        });

        setNetworkCounts({ validations: counts, releasedPermits, pendingInspections, totalValidates });
      } catch (err) {
        console.warn("Failed to load Network counts", err);
      }
    };

    fetchNetworkCounts();

    const socket = io(API_BASE_URL, {
      path: "/socket.io",
      transports: ["polling", "websocket"],
      auth: { token },
    });

    const refreshCounts = () => {
      fetchNetworkCounts();
    };

    socket.on("inspection-created", refreshCounts);
    socket.on("inspection-updated", refreshCounts);
    socket.on("payment-updated", refreshCounts);
    socket.on("application-status-updated", refreshCounts);

    return () => {
      socket.off("inspection-created", refreshCounts);
      socket.off("inspection-updated", refreshCounts);
      socket.off("payment-updated", refreshCounts);
      socket.off("application-status-updated", refreshCounts);
      socket.disconnect();
    };
  }, []);

  // realtime trend points for chart
  const [validateTrend, setValidateTrend] = useState([]);
  const [pendingTrend, setPendingTrend] = useState([]);

  // compute displayed agencies with updated validations and load %
  const maxValidations = Math.max(...Object.values(networkCounts.validations || { B: 0, F: 0, H: 0, C: 0, E: 0 }), 1);

  const displayedAgencies = agencies.map((a) => {
    const val = Number(networkCounts.validations?.[a.id] || 0);
    const loadPct = Math.round((val / maxValidations) * 100);
    return { ...a, validations: val, load: loadPct };
  });

  return (
    <div className="network-page">
      <div className="network-header">
        <div>
          <h1>Agency Network</h1>
          <p className="network-description">
            Participating government agencies and their validation status.
          </p>
        </div>
      </div>

      <div className="summary-cards">
        <div className="summary-card">
          <div className="summary-icon active"></div>
          <div>
            <p>Active Agencies</p>
            <h2>{agencies.length}</h2>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon uptime"></div>
          <div>
              <p>Validates</p>
              <h2>{networkCounts.totalValidates || 0}</h2>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon clock"></div>
          <div>
              <p>Pending</p>
              <h2>{networkCounts.pendingInspections || 0}</h2>
          </div>
        </div>
      </div>

      <div className="agency-grid">
        <div className="agency-row">
          {displayedAgencies.slice(0, 3).map((agency) => (
            <div key={agency.id} className="agency-card">
              <div className="agency-header">
                <div className="initial">{agency.id}</div>
                <div className="agency-info">
                  <h3>{agency.name}</h3>
                  <p>{agency.dept}</p>
                </div>
                <span className="role">{agency.role}</span>
              </div>
                  <div className="agency-body">
                    <div className="info-row">
                      <span>Status</span>
                      <span className={agency.status.toLowerCase()}>{agency.status}</span>
                    </div>
                    <div className="info-row">
                      <span>Validates</span>
                      <span>{agency.validations}</span>
                    </div>
                    <div className="info-row load-row">
                      <span>Load Capacity</span>
                      <div className="progress-bar">
                        <div className="progress" style={{ width: `${agency.load}%` }}></div>
                      </div>
                      <span className="load-text">{agency.load}%</span>
                    </div>
                  </div>
            </div>
          ))}
        </div>

        <div className="agency-row">
          {displayedAgencies.slice(3).map((agency) => (
            <div key={agency.id} className="agency-card">
              <div className="agency-header">
                <div className="initial">{agency.id}</div>
                <div className="agency-info">
                  <h3>{agency.name}</h3>
                  <p>{agency.dept}</p>
                </div>
                <span className="role">{agency.role}</span>
              </div>
              <div className="agency-body">
                <div className="info-row">
                  <span>Status</span>
                  <span className={agency.status.toLowerCase()}>{agency.status}</span>
                </div>
                <div className="info-row">
                  <span>Validates</span>
                  <span>{agency.validations}</span>
                </div>
                <div className="info-row load-row">
                  <span>Load Capacity</span>
                  <div className="progress-bar">
                    <div className="progress" style={{ width: `${agency.load}%` }}></div>
                  </div>
                  <span className="load-text">{agency.load}%</span>
                </div>
              </div>
            </div>
          ))}

          <div className="network-summary-card">
            <div className="summary-top">
              <div>
                <h3>Network Summary</h3>
                <p>Validation Trends (This Week)</p>
              </div>
              <div className="summary-chip">View Full Report</div>
            </div>

            <div className="chart-card">
              <div className="chart-header">
                <span>Validation Trends (Realtime)</span>
              </div>
              <div className="realtime-visual">
                <div className="donut-wrap">
                  {/* donut showing per-agency segments */}
                  {(() => {
                    const agencyColors = { B: "#7c3aed", F: "#ef4444", H: "#10b981", C: "#2563eb", E: "#f59e0b" };
                    const countsObj = networkCounts.validations || { B: 0, F: 0, H: 0, C: 0, E: 0 };
                    const items = Object.keys(countsObj).map((k) => ({ id: k, name: (displayedAgencies.find(a => a.id===k)?.name)||k, value: countsObj[k], color: agencyColors[k] || "#94a3b8" }));
                    const total = Math.max(1, items.reduce((s, it) => s + Number(it.value || 0), 0));
                    const radius = 48;
                    const circumference = 2 * Math.PI * radius;
                    let offset = 0;
                    return (
                      <svg className="donut-svg" width="120" height="120" viewBox="0 0 120 120">
                        <g transform="translate(60,60)">
                          <circle r={radius} fill="#f3f4f6" />
                          <circle r={radius} fill="transparent" stroke="#e6eef6" strokeWidth="14" />
                          {items.map((it, idx) => {
                            const dash = (Number(it.value || 0) / total) * circumference;
                            const dashArr = `${dash} ${Math.max(0, circumference - dash)}`;
                            const dashOffset = -offset;
                            offset += dash;
                            return (
                              <circle
                                key={it.id}
                                r={radius}
                                fill="transparent"
                                stroke={it.color}
                                strokeWidth="14"
                                strokeDasharray={dashArr}
                                strokeDashoffset={dashOffset}
                                strokeLinecap="butt"
                                transform="rotate(-90)"
                              />
                            );
                          })}
                          <text x="0" y="6" textAnchor="middle" className="donut-label">
                            {total === 0 ? "0" : total}
                          </text>
                        </g>
                      </svg>
                    );
                  })()}
                  <div className="donut-legend">
                    {displayedAgencies.map((a) => (
                      <div key={a.id} className="donut-legend-item">
                        <span className="legend-dot" style={{ background: ({ B: "#7c3aed", F: "#ef4444", H: "#10b981", C: "#2563eb", E: "#f59e0b" })[a.id] }}></span>
                        <small>{a.name} — {a.validations}</small>
                      </div>
                    ))}
                  </div>
                </div>

                {/* mini-stats removed as requested */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

