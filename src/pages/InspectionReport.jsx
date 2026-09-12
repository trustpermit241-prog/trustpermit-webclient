import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import QRCode from "react-qr-code";
import antipoloLogo from "../assets/antipolologo.jpg";
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
const FRONTEND_URL = "https://trustpermit-webclient.vercel.app";

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

  const inspectionType = inspection?.type || "N/A";
  const issueDate = inspection?.certificateIssuedAt || inspection?.updatedAt || inspection?.date || new Date().toISOString();
  const issueDateText = new Date(issueDate).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const expiryDate = application?.expiryDate
    ? new Date(application.expiryDate)
    : new Date(new Date(issueDate).setFullYear(new Date(issueDate).getFullYear() + 1));
  const expiryDateText = expiryDate.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const certificateNumber = inspection?._id || id;
  const trainingTitle = inspectionType.toUpperCase();
  const trainingDescription = `inspection covering ${inspectionType.toLowerCase()}, regulatory compliance, hazard awareness, and required safety protocols.`;
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
  const applicationId = application?._id || application?.id || inspection?.applicationId;
  const verificationUrl = applicationId
    ? `${FRONTEND_URL}/verify/${applicationId}`
    : "";

  if (loading) {
    return <div className="inspection-report-loading">Loading inspection report...</div>;
  }

  return (
    <div className="inspection-report-page">
      <div className="inspection-report-sheet">
        <div className="inspection-report-header">
          <div className="inspection-report-organization">
            <img src={antipoloLogo} alt="Antipolo City logo" className="inspection-report-logo" />
            <div>
              <div className="inspection-report-title">CITY GOVERNMENT OF ANTIPOLO</div>
              <div className="inspection-report-subtitle">BUSINESS PERMITS AND LICENSING OFFICE</div>
              <div className="inspection-report-contact">Antipolo City, Rizal | Business Permit and Inspection Services</div>
            </div>
            <div className="inspection-report-qr">
              {verificationUrl && <QRCode value={verificationUrl} size={104} />}
              <span>Scan to verify</span>
            </div>
          </div>
          <div className="inspection-report-main">CERTIFICATE OF COMPLETION</div>
          <div className="inspection-report-certificate-type">{trainingTitle}</div>
        </div>

        <div className="inspection-report-certificate-copy">
          <p>This is to proudly certify that</p>
          <h1>{owner}</h1>
          <p>has successfully completed the inspection and compliance review for</p>
          <h2>{businessName}</h2>
          <p>
            This certificate confirms completion of the {trainingDescription} The inspection was reviewed against the submitted permit application and recorded requirements.
          </p>
        </div>

        <div className="inspection-report-certificate-meta">
          <div><strong>Date of Issuance:</strong><span>{issueDateText}</span></div>
          <div><strong>Certificate No:</strong><span>{certificateNumber}</span></div>
          <div><strong>Validity Period:</strong><span>{issueDateText} - {expiryDateText}</span></div>
          <div><strong>Status:</strong><span>{userStatus}</span></div>
        </div>

        <div className="inspection-report-section inspection-report-details">
          <div className="inspection-report-section-title">Inspection and Application Details</div>
          <div className="inspection-report-row">
            <span className="inspection-report-label">Business Address</span>
            <span className="inspection-report-value">{address}</span>
          </div>
          <div className="inspection-report-row">
            <span className="inspection-report-label">Applicant Email</span>
            <span className="inspection-report-value">{email}</span>
          </div>
          <div className="inspection-report-row">
            <span className="inspection-report-label">Inspection Date and Time</span>
            <span className="inspection-report-value">{inspectionDate} at {inspectionTime}</span>
          </div>
          <div className="inspection-report-row">
            <span className="inspection-report-label">Assigned Inspector</span>
            <span className="inspection-report-value">{assignedInspector}</span>
          </div>
          <div className="inspection-report-row">
            <span className="inspection-report-label">Scheduled By</span>
            <span className="inspection-report-value">{remarksText}</span>
          </div>
        </div>

        <div className="inspection-report-signature-row">
          <div>
            <div className="inspection-report-signature-title">{assignedInspector}</div>
            <div className="inspection-report-signature-line" />
            <span>Authorized Inspector</span>
          </div>
          <div>
            <div className="inspection-report-signature-title">{scheduledBy}</div>
            <div className="inspection-report-signature-line" />
            <span>Head of Operations / Safety Officer</span>
          </div>
        </div>

        <div className="inspection-report-footer">
          <button type="button" onClick={() => window.print()}>
            Print Certificate
          </button>
        </div>
      </div>
    </div>
  );
}

