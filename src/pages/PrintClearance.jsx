import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import QRCode from "react-qr-code";
import axios from "axios";
import antipoloLogo from "../assets/antipolologo.jpg";
import "./PrintPermit.css";

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

export default function PrintClearance({ documentType: propDocumentType, permitId: propPermitId }) {
  const { documentType: routeDocumentType, permitId: routePermitId } = useParams();
  const documentType = propDocumentType || routeDocumentType;
  const permitId = propPermitId || routePermitId;
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
  const issuedOn = new Date(application.updatedAt || application.createdAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const permitNumber = application._id || permitId;
  const kindOfBusiness = application.businessDetails?.lineOfBusiness || application.applicationType || "N/A";
  const expiryDate = application.expiryDate
    ? new Date(application.expiryDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : "December 31, " + new Date().getFullYear();
  const verificationUrl = `${FRONTEND_URL}/verify/${application._id || permitId}`;
  const isWorkPermit = documentType === "work-permit";
  const isBarangayClearance = documentType === "barangay-clearance";

  return (
    <div className="permit-print-page">
      <div className={`permit-print-sheet official-permit${isWorkPermit ? " work-permit-document" : ""}${isBarangayClearance ? " barangay-clearance-document" : ""}`}>
        <div className="permit-top-row">
          <div className="permit-seal-logo">
            <div className="seal-circle">
              <img src={antipoloLogo} alt="Antipolo City seal" />
            </div>
          </div>
          <div className="permit-title-block">
            <div className="permit-government">Republic of the Philippines</div>
            <div className="permit-government">Province of Rizal</div>
            <div className="permit-government">City of Antipolo</div>
            {isBarangayClearance && <div className="barangay-office-name">BARANGAY BUSINESS PERMIT AND CLEARANCE OFFICE</div>}
            <h1 className="permit-main-title">{document.title}</h1>
          </div>
          <div className="permit-qr-block">
            <QRCode value={verificationUrl} size={110} />
            <small>Scan to verify</small>
          </div>
        </div>

        <div className="permit-work-heading">
          <span>{isBarangayClearance ? "CLEARANCE NO." : "DOCUMENT NO."} {permitNumber}</span>
          <span>Date Issued: {issuedOn}</span>
        </div>

        <div className="permit-subtext">
          {isWorkPermit
            ? `This is to certify that ${name} is authorized to work under the business or establishment identified below, subject to the applicable rules and regulations of the issuing office.`
            : isBarangayClearance
            ? `This is to certify that ${name} with business address at ${businessAddress} has been granted this BARANGAY BUSINESS CLEARANCE for the purpose of securing the necessary business permit and license from the proper office.`
            : `This ${document.subtitle.toLowerCase()} is issued for the approved application below and is separate from the Mayor&apos;s Business Permit.`}
        </div>

        <div className="permit-fields-grid">
          <div className="permit-field-row"><div className="permit-field-label">{isWorkPermit ? "Issued to:" : isBarangayClearance ? "Business / Permittee:" : "Name of Permittee:"}</div><div className="permit-field-value permit-person-name">{name}</div></div>
          <div className="permit-field-row"><div className="permit-field-label">Document No.:</div><div className="permit-field-value">{permitNumber}</div></div>
          <div className="permit-field-row"><div className="permit-field-label">Issued on:</div><div className="permit-field-value">{issuedOn}</div></div>
          <div className="permit-field-row"><div className="permit-field-label">{isWorkPermit ? "Worker / Home Address:" : "Business Address:"}</div><div className="permit-field-value">{businessAddress}</div></div>
          <div className="permit-field-row"><div className="permit-field-label">{isWorkPermit ? "Employer / Business:" : "Business Name:"}</div><div className="permit-field-value permit-trade-name">{businessName}</div></div>
          <div className="permit-field-row"><div className="permit-field-label">Kind/Nature of Business:</div><div className="permit-field-value">{kindOfBusiness}</div></div>
          <div className="permit-field-row"><div className="permit-field-label">Validity:</div><div className="permit-field-value">{issuedOn} - {expiryDate}</div></div>
        </div>

        <div className="permit-notice-box">
          {isWorkPermit
            ? <>This work permit is <strong>RELEASED</strong> upon approved payment and application review. It is personal to the worker named above, non-transferable, and valid only for the stated employer or business during the validity period.</>
            : isBarangayClearance
            ? <>This clearance is <strong>NON-TRANSFERABLE</strong> and shall be null and void upon failure of the aforementioned applicant to strictly comply with the conditions of this permit.</>
            : <>This document is <strong>RELEASED</strong> upon approved payment and application review. It is valid only for the permittee and business identified above.</>}
        </div>

        <div className="permit-conditions">
          <div className="permit-conditions-title">{isWorkPermit ? "Conditions of this Work Permit" : isBarangayClearance ? "Conditions of this Clearance" : "Conditions for Validity"}</div>
          <ol>
            <li>{isWorkPermit ? "This permit must be presented when requested by the issuing office or authorized personnel." : "This document must be presented together with the Mayor&apos;s Business Permit when required."}</li>
            <li>{isWorkPermit ? "The holder may work only for the employer or business identified in this permit unless otherwise approved." : "This document is non-transferable and may be revoked for misrepresentation or non-compliance."}</li>
            <li>{isBarangayClearance ? "The clearance is valid only for the business and address identified above." : "This document is non-transferable and may be revoked for misrepresentation or non-compliance."}</li>
            <li>The QR code provides verification for this approved application.</li>
          </ol>
        </div>

        <div className="permit-signatures-row">
          <div className="permit-signature-block"><div className="signature-line" /><div className="signature-name">Authorized City Hall Officer</div><div className="signature-title">{isWorkPermit ? "Barangay / Issuing Office" : isBarangayClearance ? "Barangay / Issuing Officer" : "Issuing Office"}</div></div>
          <div className="permit-signature-block"><div className="signature-line" /><div className="signature-name">{name}</div><div className="signature-title">{isWorkPermit ? "Worker / Permit Holder" : "Permittee"}</div></div>
        </div>

        <button className="permit-print-button" onClick={() => window.print()}>Print / Save as PDF</button>
      </div>
    </div>
  );
}
