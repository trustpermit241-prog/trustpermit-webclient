import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "./InspectionReport.css";

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

export default function InspectionReport() {
  const { id } = useParams();
  const [inspection, setInspection] = useState(null);
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInspection = async () => {
      let cachedInspection = null;
      let cachedApplication = null;

      const cached = localStorage.getItem(`inspectionReport_${id}`) || sessionStorage.getItem(`inspectionReport_${id}`);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          cachedInspection = parsed.inspection || parsed;
          cachedApplication = parsed.application || null;
          if (cachedInspection) {
            setInspection(cachedInspection);
            setApplication(cachedApplication);
          }
        } catch (parseErr) {
          console.error("Failed to parse cached inspection report:", parseErr);
        }
      }

      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_BASE_URL}/api/inspection/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        const responseData = res.data || {};
        const inspectionFromResponse = responseData.inspection || responseData;
        const applicationFromResponse = responseData.application || null;

        if (inspectionFromResponse) {
          setInspection(inspectionFromResponse);
          setApplication(applicationFromResponse);
          const cacheData = { inspection: inspectionFromResponse, application: applicationFromResponse };
          localStorage.setItem(`inspectionReport_${id}`, JSON.stringify(cacheData));
          sessionStorage.setItem(`inspectionReport_${id}`, JSON.stringify(cacheData));
        }
      } catch (err) {
        console.error("Failed to load inspection report:", err);

        if (!cachedInspection) {
          try {
            const fallbackRes = await axios.get(`${API_BASE_URL}/api/inspection/debug/all`);
            const inspections = Array.isArray(fallbackRes.data) ? fallbackRes.data : [];
            const found = inspections.find((item) => String(item._id) === String(id));
            if (found) {
              setInspection(found);
              setApplication(null);
              const cacheData = { inspection: found, application: null };
              localStorage.setItem(`inspectionReport_${id}`, JSON.stringify(cacheData));
              sessionStorage.setItem(`inspectionReport_${id}`, JSON.stringify(cacheData));
            }
          } catch (fallbackErr) {
            console.error("Fallback inspection debug fetch failed:", fallbackErr);
            setInspection(null);
            setApplication(null);
          }
        }
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchInspection();
    }
  }, [id]);

  useEffect(() => {
    if (!loading && inspection) {
      window.print();
    }
  }, [loading, inspection]);

  const formatAddress = (addr) => {
    if (!addr) return null;
    const parts = [
      addr.street,
      addr.houseNo || addr.houseNumber,
      addr.barangay,
      addr.city,
      addr.province,
      addr.subdivision,
      addr.building,
      addr.block,
      addr.lot,
      addr.landmark,
    ]
      .filter(Boolean)
      .map((part) => String(part).trim());
    return parts.length ? parts.join(", ") : null;
  };

  const businessName =
    inspection?.businessName ||
    application?.businessName ||
    application?.businessInfo?.businessName ||
    application?.businessDetails?.businessName ||
    inspection?.citizenId?.fullName ||
    "N/A";

  const owner =
    inspection?.citizenId?.fullName ||
    application?.taxpayer?.registrantName ||
    (application?.applicant?.firstName
      ? `${application.applicant.firstName} ${application.applicant.lastName || ""}`.trim()
      : null) ||
    "N/A";

  const address =
    formatAddress(application?.address) ||
    inspection?.businessAddress ||
    inspection?.address ||
    "N/A";

  const email =
    inspection?.citizenId?.email ||
    application?.applicant?.email ||
    application?.contact?.email ||
    "N/A";

  const role = inspection?.citizenId?.role || "N/A";
  const inspectionType = inspection?.type || "N/A";
  const inspectionDate = inspection?.date
    ? new Date(inspection.date).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "N/A";
  const inspectionTime = inspection?.date
    ? new Date(inspection.date).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : inspection?.time || "N/A";
  const assignedInspector = inspection?.inspector || "N/A";
  const userStatus = inspection?.status || "Pending";
  const remarksText = inspection?.remarks || "No remarks provided.";
  const scheduledBy =
    inspection?.scheduledBy?.fullName ||
    inspection?.scheduledBy ||
    "N/A";

  const checklistItems = useMemo(() => {
    const typesFromInspection = [];
    if (inspection) {
      if (Array.isArray(inspection.types) && inspection.types.length) {
        typesFromInspection.push(...inspection.types.map((t) => String(t).toLowerCase()));
      } else if (inspection.type) {
        typesFromInspection.push(String(inspection.type).toLowerCase());
      }
    }

    const matchesType = (label) => {
      const l = String(label).toLowerCase();
      return typesFromInspection.some((t) => t.includes(l) || l.includes(t) || t === l);
    };

    return [
      { label: "Fire Safety", checked: inspection ? matchesType("Fire Safety") : false },
      { label: "Electrical", checked: inspection ? matchesType("Electrical") : false },
      { label: "Sanitary", checked: inspection ? matchesType("Sanitary") : false },
      { label: "Building", checked: inspection ? matchesType("Building") : false },
      { label: "Environmental", checked: inspection ? matchesType("Environmental") : false },
    ];
  }, [inspection]);

  if (loading) {
    return <div className="inspection-report-loading">Loading inspection report...</div>;
  }

  return (
    <div className="inspection-report-page">
      <div className="inspection-report-sheet">
        <div className="inspection-report-header">
          <div className="inspection-report-title">CITY GOVERNMENT OF ANTIPOLO</div>
          <div className="inspection-report-subtitle">BUSINESS PERMITS AND LICENSING OFFICE</div>
          <div className="inspection-report-main">BUSINESS PERMIT INSPECTION REPORT</div>
        </div>

        <div className="inspection-report-body">
          <div className="inspection-report-row">
            <span className="inspection-report-label">Inspection No.</span>
            <span className="inspection-report-value">{inspection?._id || "N/A"}</span>
          </div>
          <div className="inspection-report-row">
            <span className="inspection-report-label">Business Name</span>
            <span className="inspection-report-value">{businessName}</span>
          </div>
          <div className="inspection-report-row">
            <span className="inspection-report-label">Owner</span>
            <span className="inspection-report-value">{owner}</span>
          </div>
          <div className="inspection-report-row">
            <span className="inspection-report-label">Business Address</span>
            <span className="inspection-report-value">{address}</span>
          </div>
          <div className="inspection-report-row">
            <span className="inspection-report-label">Email</span>
            <span className="inspection-report-value">{email}</span>
          </div>
          <div className="inspection-report-row">
            <span className="inspection-report-label">Role</span>
            <span className="inspection-report-value">{role}</span>
          </div>
          <div className="inspection-report-row">
            <span className="inspection-report-label">Inspection Date</span>
            <span className="inspection-report-value">{inspectionDate}</span>
          </div>
          <div className="inspection-report-row">
            <span className="inspection-report-label">Inspection Time</span>
            <span className="inspection-report-value">{inspectionTime}</span>
          </div>
          <div className="inspection-report-row">
            <span className="inspection-report-label">Assigned Inspector</span>
            <span className="inspection-report-value">{assignedInspector}</span>
          </div>
          <div className="inspection-report-row">
            <span className="inspection-report-label">Scheduled By</span>
            <span className="inspection-report-value">{scheduledBy}</span>
          </div>
          <div className="inspection-report-row">
            <span className="inspection-report-label">Status</span>
            <span className="inspection-report-value">{userStatus}</span>
          </div>
        </div>

        <div className="inspection-report-section">
          <div className="inspection-report-section-title">Inspection Checklist</div>
          <div className="inspection-report-checklist">
            {checklistItems.map((item) => (
              <div key={item.label} className="inspection-report-check-item">
                <span className="inspection-report-checkbox">{item.checked ? "☑" : "☐"}</span>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="inspection-report-section">
          <div className="inspection-report-section-title">Remarks</div>
          <div className="inspection-report-section-content">
            <p>{remarksText}</p>
          </div>
        </div>

        <div className="inspection-report-section">
          <div className="inspection-report-section-title">Recommendation</div>
          <div className="inspection-report-recommendations">
            <div className="inspection-report-check-item">
              <span className="inspection-report-checkbox">☐</span>
              <span>Approved</span>
            </div>
            <div className="inspection-report-check-item">
              <span className="inspection-report-checkbox">☐</span>
              <span>Re-inspection</span>
            </div>
            <div className="inspection-report-check-item">
              <span className="inspection-report-checkbox">☐</span>
              <span>Disapproved</span>
            </div>
          </div>
        </div>

        <div className="inspection-report-signature-row">
          <div>
            <div className="inspection-report-signature-title">Inspector Signature</div>
            <div className="inspection-report-signature-line" />
          </div>
          <div>
            <div className="inspection-report-signature-title">Date</div>
            <div className="inspection-report-signature-line" />
          </div>
        </div>

        <div className="inspection-report-footer">
          <button type="button" onClick={() => window.print()}>
            Print Report
          </button>
        </div>
      </div>
    </div>
  );
}

