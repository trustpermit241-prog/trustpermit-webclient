import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import QRCode from "react-qr-code";
import axios from "axios";

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

const DOCUMENTS = {
  "barangay-clearance": {
    title: "BARANGAY BUSINESS CLEARANCE",
    subtitle: "Official Barangay Clearance",
  },
  "work-permit": {
    title: "WORK PERMIT",
    subtitle: "Official Work Permit",
  },
};

export default function PrintClearance() {
  const { documentType, permitId } = useParams();
  const [application, setApplication] = useState(null);
  const [error, setError] = useState("");
  const document = DOCUMENTS[documentType];

  useEffect(() => {
    const loadApplication = async () => {
      try {
        const token = localStorage.getItem("token");
        const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
        const response = await axios.get(`${API_BASE_URL}/api/applications/${permitId}`, config);
        setApplication(response.data?.application || response.data?.data || response.data);
      } catch (requestError) {
        setError(requestError.response?.data?.message || requestError.message || "Failed to load document.");
      }
    };

    if (document && permitId) loadApplication();
    else setError("Document not found.");
  }, [document, permitId]);

  if (!document || error) {
    return <div style={{ padding: 40, textAlign: "center" }}>{error || "Document not found."}</div>;
  }

  if (!application) return <div style={{ padding: 40, textAlign: "center" }}>Loading document...</div>;

  const applicant = application.applicant || {};
  const name = `${applicant.firstName || ""} ${applicant.middleName || ""} ${applicant.lastName || ""} ${applicant.suffixName || ""}`.replace(/\s+/g, " ").trim() || "N/A";
  const address = application.address || {};
  const businessName = application.businessName || application.businessDetails?.businessName || "N/A";
  const businessAddress = [address.houseNo, address.street, address.barangay, address.city, address.province].filter(Boolean).join(", ") || "N/A";
  const issuedOn = new Date(application.updatedAt || application.createdAt).toLocaleDateString();
  const verificationUrl = `${FRONTEND_URL}/verify/${application._id || permitId}`;

  return (
    <main style={{ minHeight: "100vh", padding: 32, background: "#f3f4f6", fontFamily: "Georgia, serif" }}>
      <section style={{ maxWidth: 850, margin: "0 auto", padding: 48, background: "#fff", border: "2px solid #1d4ed8", textAlign: "center" }}>
        <p style={{ margin: 0 }}>REPUBLIC OF THE PHILIPPINES</p>
        <p style={{ margin: "6px 0" }}>CITY OF ANTIPOLO</p>
        <h1 style={{ color: "#1d4ed8", margin: "28px 0 8px", fontSize: 30 }}>{document.title}</h1>
        <p style={{ marginBottom: 36 }}>{document.subtitle}</p>

        <div style={{ textAlign: "left", borderTop: "1px solid #d1d5db", borderBottom: "1px solid #d1d5db", padding: "24px 0", lineHeight: 2 }}>
          <div><strong>Name:</strong> {name}</div>
          <div><strong>Business:</strong> {businessName}</div>
          <div><strong>Business Address:</strong> {businessAddress}</div>
          <div><strong>Issued On:</strong> {issuedOn}</div>
          <div><strong>Status:</strong> <span style={{ color: "#15803d", fontWeight: 700 }}>RELEASED</span></div>
        </div>

        <p style={{ margin: "32px auto", maxWidth: 650, lineHeight: 1.7 }}>
          This document is issued separately from the Business Permit and is valid for the approved application identified above.
        </p>

        <QRCode value={verificationUrl} size={110} />
        <p style={{ marginTop: 28, paddingTop: 18, borderTop: "1px solid #d1d5db" }}>Authorized City Hall Officer</p>
      </section>
    </main>
  );
}
