import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import antipoloLogo from "../assets/antipolologo.jpg";
import "./InspectionReport.css";

const getApiBaseUrl = () => {
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    if (hostname === "localhost" || hostname === "127.0.0.1") return "http://localhost:5000";
  }
  return process.env.REACT_APP_API_URL || "https://trustpermit-backend.onrender.com";
};

const API_BASE_URL = getApiBaseUrl();

export default function StaffInspectionReport() {
  const { id } = useParams();
  const [inspection, setInspection] = useState(null);
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInspection = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`${API_BASE_URL}/api/inspection/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        setInspection(response.data?.inspection || response.data);
        setApplication(response.data?.application || null);
      } catch (error) {
        console.error("Failed to load staff inspection report:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchInspection();
  }, [id]);

  useEffect(() => {
    if (!loading && inspection) window.print();
  }, [loading, inspection]);

  if (loading) return <div className="inspection-report-loading">Loading inspection report...</div>;
  if (!inspection) return <div className="inspection-report-loading">Inspection report not found.</div>;

  const address = application?.address
    ? [
        application.address.houseNo || application.address.houseNumber,
        application.address.street,
        application.address.barangay,
        application.address.city,
        application.address.province,
      ].filter(Boolean).join(", ")
    : "N/A";
  const owner = inspection.citizenId?.fullName || application?.taxpayer?.registrantName || "N/A";
  const applicantEmail = inspection.citizenId?.email || application?.applicant?.email || application?.contact?.email || "N/A";
  const inspectionDate = inspection.date ? new Date(inspection.date).toLocaleString("en-US") : "N/A";

  return (
    <div className="inspection-report-page">
      <div className="inspection-report-sheet">
        <div className="inspection-report-header inspection-report-staff-header">
          <img src={antipoloLogo} alt="Antipolo City seal" className="inspection-report-staff-logo" />
          <div className="inspection-report-title">CITY GOVERNMENT OF ANTIPOLO</div>
          <div className="inspection-report-subtitle">BUSINESS PERMITS AND LICENSING OFFICE</div>
          <div className="inspection-report-contact">Staff Inspection Processing Record</div>
          <div className="inspection-report-main">BUSINESS PERMIT INSPECTION REPORT</div>
        </div>

        <div className="inspection-report-section">
          <div className="inspection-report-section-title">Inspection Record</div>
          <div className="inspection-report-body">
            <div className="inspection-report-row"><span className="inspection-report-label">Inspection No.</span><span className="inspection-report-value">{inspection._id}</span></div>
            <div className="inspection-report-row"><span className="inspection-report-label">Inspection Type</span><span className="inspection-report-value">{inspection.type || "N/A"}</span></div>
            <div className="inspection-report-row"><span className="inspection-report-label">Applicant / Owner</span><span className="inspection-report-value">{owner}</span></div>
            <div className="inspection-report-row"><span className="inspection-report-label">Business Name</span><span className="inspection-report-value">{application?.businessName || application?.businessInfo?.businessName || "N/A"}</span></div>
            <div className="inspection-report-row"><span className="inspection-report-label">Business Address</span><span className="inspection-report-value">{address}</span></div>
            <div className="inspection-report-row"><span className="inspection-report-label">Applicant Email</span><span className="inspection-report-value">{applicantEmail}</span></div>
            <div className="inspection-report-row"><span className="inspection-report-label">Schedule</span><span className="inspection-report-value">{inspectionDate}</span></div>
            <div className="inspection-report-row"><span className="inspection-report-label">Assigned Inspector</span><span className="inspection-report-value">{inspection.inspector || "N/A"}</span></div>
            <div className="inspection-report-row"><span className="inspection-report-label">Status</span><span className="inspection-report-value">{inspection.status || "Pending"}</span></div>
            <div className="inspection-report-row"><span className="inspection-report-label">Remarks</span><span className="inspection-report-value">{inspection.remarks || "No remarks provided."}</span></div>
          </div>
        </div>

        <div className="inspection-report-section">
          <div className="inspection-report-section-title">Staff Decision</div>
          <div className="inspection-report-recommendations">
            <div className="inspection-report-check-item"><span className="inspection-report-checkbox">{inspection.status === "Approved" ? "☑" : "☐"}</span><span>Approved</span></div>
            <div className="inspection-report-check-item"><span className="inspection-report-checkbox">{inspection.status === "Rejected" ? "☑" : "☐"}</span><span>Disapproved / Re-inspection</span></div>
          </div>
        </div>

        <div className="inspection-report-signature-row">
          <div><div className="inspection-report-signature-title">{inspection.inspector || "Authorized Inspector"}</div><div className="inspection-report-signature-line" /><span>Inspector Signature</span></div>
          <div><div className="inspection-report-signature-title">{inspection.scheduledBy?.fullName || "City Hall Staff"}</div><div className="inspection-report-signature-line" /><span>Staff / Reviewing Officer</span></div>
        </div>

        <div className="inspection-report-footer"><button type="button" onClick={() => window.print()}>Print Staff Report</button></div>
      </div>
    </div>
  );
}
