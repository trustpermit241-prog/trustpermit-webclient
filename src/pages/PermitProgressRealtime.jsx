import React, { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";

const API_BASE_URL = "https://trustpermit-backend.onrender.com";

const normalizeArray = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.applications)) return data.applications;
  if (Array.isArray(data?.inspections)) return data.inspections;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

const getLatestApplication = (data) => {
  const apps = normalizeArray(data);

  if (apps.length === 0) return null;

  return [...apps]
    .filter((app) => app && (app._id || app.id))
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))[0];
};

const PermitProgressRealtime = () => {
  const [application, setApplication] = useState(null);
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // This prevents the component from showing "Loading..." again and again
  // when Socket.IO receives realtime updates.
  const hasLoadedOnceRef = useRef(false);
  const isMountedRef = useRef(false);

  const safeSetState = (callback) => {
    if (isMountedRef.current) callback();
  };

  const fetchPermitData = useCallback(async ({ showLoader = false } = {}) => {
    const token = localStorage.getItem("token");

    if (!token) {
      safeSetState(() => {
        setError("Not logged in");
        setLoading(false);
        setApplication(null);
        setInspections([]);
      });
      return;
    }

    // Only show loading on the very first page load.
    // Realtime updates will refresh data silently without flashing Loading...
    if (showLoader && !hasLoadedOnceRef.current) {
      safeSetState(() => setLoading(true));
    }

    safeSetState(() => setError(null));

    try {
      const [appRes, inspRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/applications/my`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_BASE_URL}/api/inspection/my`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const latestApplication = getLatestApplication(appRes.data);
      const inspectionList = normalizeArray(inspRes.data);

      safeSetState(() => {
        setApplication(latestApplication || null);
        setInspections(inspectionList);
      });
    } catch (err) {
      console.error("Permit progress load error:", err);
      safeSetState(() => {
        setError("Failed to load permit progress");
        setApplication(null);
        setInspections([]);
      });
    } finally {
      hasLoadedOnceRef.current = true;
      safeSetState(() => setLoading(false));
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    const token = localStorage.getItem("token");

    if (!token) {
      setError("Not logged in");
      setLoading(false);
      return () => {
        isMountedRef.current = false;
      };
    }

    // Initial load only. This is the only time Loading... will appear.
    fetchPermitData({ showLoader: true });

    // Realtime updates stay enabled through Socket.IO.
    // Removed the 5-second setInterval because it caused the progress card
    // to keep loading by itself.
    const socket = io(API_BASE_URL, {
      path: "/socket.io",
      transports: ["polling", "websocket"],
      reconnection: true,
      auth: { token },
    });

    const refreshSilently = () => {
      fetchPermitData({ showLoader: false });
    };

    socket.on("connect", () => {
      console.log("Permit progress realtime connected");
    });

    socket.on("application-status-updated", (data) => {
      const userId =
        localStorage.getItem("userId") ||
        localStorage.getItem("citizenId") ||
        localStorage.getItem("id");

      if (!data) return;

      const dataUserId =
        data.userId ||
        data.application?.userId?._id ||
        data.application?.userId ||
        data.application?._id;

      if (!userId || !dataUserId || String(dataUserId) === String(userId)) {
        refreshSilently();
      }
    });

    socket.on("inspection-updated", refreshSilently);
    socket.on("inspection-created", refreshSilently);
    socket.on("documents-uploaded", refreshSilently);
    socket.on("payment-updated", refreshSilently);

    socket.on("connect_error", (err) => {
      console.warn("Permit progress realtime connection error:", err.message);
      // Do not set loading to true here. This avoids repeated loading flashes.
    });

    return () => {
      isMountedRef.current = false;
      socket.off("application-status-updated");
      socket.off("inspection-updated");
      socket.off("inspection-created");
      socket.off("documents-uploaded");
      socket.off("payment-updated");
      socket.disconnect();
    };
  }, [fetchPermitData]);

  const steps = [
    { key: "application_submitted", label: "Application Submitted" },
    { key: "uploaded_documents", label: "Uploaded Documents" },
    { key: "inspection", label: "Inspection" },
    { key: "payment", label: "Payment" },
    { key: "permit_release", label: "Permit Release" },
  ];

  const status = String(application?.status || "").toLowerCase();

  const hasUploadedDocuments = Boolean(
    application?.documentsUploaded === true ||
      application?.requirements?.locational_clearance ||
      application?.requirements?.barangay_clearance ||
      application?.requirements?.fire_safety_certification ||
      application?.requirements?.building_permit ||
      application?.requirements?.wiring_permit ||
      (application?.documents && Object.keys(application.documents).length > 0)
  );

  const hasInspection = inspections.length > 0;
  const isApproved = status === "approved";
  const isReleased = status === "released" || application?.permitReleased === true;
  const isRejected = status === "rejected";
  const isPaid =
    status === "paid" ||
    String(application?.paymentStatus || "").toLowerCase() === "paid" ||
    String(application?.paymentStatus || "").toLowerCase() === "approved";

  let currentStep = 0;

  if (isRejected) {
    currentStep = 0;
  } else if (isReleased) {
    currentStep = 4;
  } else if (isPaid || isApproved) {
    currentStep = 3;
  } else if (hasInspection) {
    currentStep = 2;
  } else if (hasUploadedDocuments) {
    currentStep = 1;
  } else if (application) {
    currentStep = 0;
  }

  const getStepColor = (idx) => {
    if (isRejected && idx === currentStep) return "#dc2626";
    if (currentStep > idx) return "#16a34a";
    if (currentStep === idx && !isRejected) return "#f59e42";
    return "#d1d5db";
  };

  const getStepIcon = (idx) => {
    if (isRejected && idx === currentStep) {
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="10" fill="#dc2626" />
          <text x="10" y="15" textAnchor="middle" fontSize="16" fill="#fff">
            !
          </text>
        </svg>
      );
    }

    if (currentStep > idx) {
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="10" fill="#16a34a" />
          <path d="M6 10.5l3 3 5-5" stroke="#fff" strokeWidth="2" fill="none" />
        </svg>
      );
    }

    if (currentStep === idx && !isRejected) {
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" fill="#f59e42" stroke="#f59e42" strokeWidth="2" />
          <circle cx="12" cy="12" r="7" fill="#fff" />
        </svg>
      );
    }

    return (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="10" fill="#d1d5db" />
      </svg>
    );
  };

  return (
    <div
      style={{
        padding: "24px 16px",
        background: "#fafbfc",
        borderRadius: 12,
        margin: "18px 0",
        boxShadow: "0 2px 8px #0001",
      }}
    >
      <strong style={{ fontSize: 18, color: "#222" }}>Permit Progress</strong>

      {loading ? (
        <div style={{ marginTop: 16, fontSize: 16 }}>Loading...</div>
      ) : error ? (
        <div style={{ color: "#dc2626", marginTop: 16, fontSize: 16 }}>{error}</div>
      ) : application ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginTop: 32,
            justifyContent: "space-between",
            overflowX: "auto",
            paddingBottom: 6,
          }}
        >
          {steps.map((step, idx) => (
            <React.Fragment key={step.key}>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  minWidth: 100,
                }}
              >
                <div
                  style={{
                    width: currentStep === idx && !isRejected ? 36 : 28,
                    height: currentStep === idx && !isRejected ? 36 : 28,
                    borderRadius: "50%",
                    background: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow:
                      currentStep === idx && !isRejected
                        ? "0 0 0 4px #f59e4222"
                        : "0 1px 4px #0001",
                    border:
                      currentStep === idx && !isRejected
                        ? "2px solid #f59e42"
                        : "2px solid #fff",
                    transition: "all 0.2s",
                  }}
                  title={step.label}
                >
                  {getStepIcon(idx)}
                </div>

                <span
                  style={{
                    marginTop: 10,
                    fontSize: 13,
                    color: getStepColor(idx),
                    textAlign: "center",
                    fontWeight: currentStep === idx && !isRejected ? 600 : 400,
                    opacity: currentStep === idx || currentStep > idx ? 1 : 0.7,
                  }}
                >
                  {step.label}
                </span>
              </div>

              {idx < steps.length - 1 && (
                <div
                  style={{
                    height: 4,
                    minWidth: 60,
                    background: getStepColor(idx),
                    margin: "0 4px",
                    borderRadius: 2,
                    transition: "background 0.2s",
                  }}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      ) : (
        <div style={{ marginTop: 16, fontSize: 16 }}>No permit status found.</div>
      )}
    </div>
  );
};

export default PermitProgressRealtime;
