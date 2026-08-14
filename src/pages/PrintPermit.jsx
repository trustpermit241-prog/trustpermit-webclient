import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import QRCode from "react-qr-code";
import axios from "axios";
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

const DEFAULT_PERMIT_SIGNERS = [
  { id: "bplo", label: "BPLO", name: "Glenn C. Altares", title: "BPLO", signature: "" },
  { id: "attorney", label: "Attorney", name: "Atty. Henry R. Rosantina", title: "Acting City Administrator", signature: "" },
  { id: "mayor", label: "Mayor", name: "HON. CASIMIRO A. YNARES III, M.D.", title: "City Mayor", signature: "" },
];

const readPermitSigners = (permitKey) => {
  try {
    const raw = localStorage.getItem("permitSigners");
    if (!raw) return DEFAULT_PERMIT_SIGNERS.map((signer) => ({ ...signer }));

    const map = JSON.parse(raw);
    const keysToTry = [
      permitKey,
      "default-permit-signers",
    ].filter(Boolean);

    for (const key of keysToTry) {
      const saved = map[key];
      if (Array.isArray(saved) && saved.length > 0) {
        return DEFAULT_PERMIT_SIGNERS.map((defaultSigner, index) => ({
          ...defaultSigner,
          ...(saved[index] || {}),
        }));
      }
    }
  } catch (error) {
    console.warn("Unable to read permit signatures:", error);
  }

  return DEFAULT_PERMIT_SIGNERS.map((signer) => ({ ...signer }));
};

export default function PrintPermit() {
  const { permitId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPermit = async () => {
      setLoading(true);
      setError(null);
      try {
        // Get auth token from localStorage
        const token = localStorage.getItem("token");
        const config = {};
        if (token) {
          config.headers = {
            Authorization: `Bearer ${token}`,
          };
        }

        const res = await axios.get(
          `${API_BASE_URL}/api/blockchain/verify/${permitId}`,
          config
        );
        setData(res.data);
      } catch (err) {
        console.error("Error fetching permit via blockchain verify:", err);
        
        // Fallback: try fetching application directly
        try {
          console.log("Attempting fallback: fetching application directly...");
          
          // Get auth token for fallback request too
          const token = localStorage.getItem("token");
          const fallbackConfig = {};
          if (token) {
            fallbackConfig.headers = {
              Authorization: `Bearer ${token}`,
            };
          }

          const appRes = await axios.get(
            `${API_BASE_URL}/api/applications/${permitId}`,
            fallbackConfig
          );
          const application = appRes.data?.application || appRes.data?.data || appRes.data;
          
          if (application) {
            setData({
              success: true,
              application,
              blockchainRecord: null,
              message: "Permit loaded (blockchain record pending)"
            });
            return;
          }
        } catch (fallbackErr) {
          console.error("Fallback fetch also failed:", fallbackErr);
        }
        
        setError(err.response?.data?.message || err.message || "Failed to load permit");
      } finally {
        setLoading(false);
      }
    };

    if (permitId) {
      fetchPermit();
    } else {
      setError("No permit ID provided");
      setLoading(false);
    }
  }, [permitId]);

  if (error) {
    return (
      <div style={{ padding: 40, textAlign: "center", minHeight: "100vh" }}>
        <div style={{ background: "#fee", padding: 20, borderRadius: 8, maxWidth: 600, margin: "0 auto" }}>
          <h2 style={{ color: "#d00", marginBottom: 10 }}>Error Loading Permit</h2>
          <p style={{ color: "#666", marginBottom: 20 }}>{error}</p>
          <p style={{ color: "#999", fontSize: 14, marginBottom: 20 }}>
            The permit may not have been released yet or there's an issue with the blockchain record.
            Please contact City Hall if the problem persists.
          </p>
          <button 
            onClick={() => window.history.back()}
            style={{ padding: "10px 20px", cursor: "pointer", background: "#2563eb", color: "white", border: "none", borderRadius: 4 }}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (loading || !data) return <h2 style={{ padding: 40 }}>Loading permit...</h2>;

  const app = data.application;
  const blockchain = data.blockchainRecord;
  const issueDate = app.createdAt ? new Date(app.createdAt).toLocaleDateString() : "N/A";
  const permitteeName = `${app.applicant?.firstName || ""} ${app.applicant?.middleName || ""} ${app.applicant?.lastName || ""} ${app.applicant?.suffixName || ""}`.trim();
  const residentialAddress = `${app.address?.houseNo || ""} ${app.address?.street || ""}${app.address?.barangay ? ", " + app.address.barangay : ""}${app.address?.city ? ", " + app.address.city : ""}${app.address?.province ? ", " + app.address.province : ""}`.trim();
  const businessAddress = app.businessAddress || `${app.address?.houseNo || ""} ${app.address?.street || ""}${app.address?.barangay ? ", " + app.address.barangay : ""}${app.address?.city ? ", " + app.address.city : ""}${app.address?.province ? ", " + app.address.province : ""}`.trim();
  const kindOfBusiness = app.businessDetails?.lineOfBusiness || app.applicationType || "N/A";
  const businessTradeName = app.businessName || "N/A";
  const permitNumber = app._id || "N/A";
  const orNumber = app.orNumber || permitNumber.slice(0, 8).toUpperCase();

  const verificationLink = FRONTEND_URL
    ? `${FRONTEND_URL}/verify/${app._id}`
    : `${API_BASE_URL}/api/blockchain/redirect/${app._id}`;
  const permitSigners = readPermitSigners(app?._id || permitId || "default-permit-signers");

  return (
    <div className="permit-print-page">
      <div className="permit-print-sheet official-permit">
        <div className="permit-top-row">
          <div className="permit-seal-logo">
            <div className="seal-circle">City Seal</div>
          </div>
          <div className="permit-title-block">
            <div className="permit-government">Republic of the Philippines</div>
            <div className="permit-government">Province of Rizal</div>
            <div className="permit-government">City of Antipolo</div>
            <h1 className="permit-main-title">MAYOR&apos;S PERMIT</h1>
          </div>
          <div className="permit-qr-block">
            {/* Use verify UI route so the scanner opens the blockchain verification page */}
            <QRCode value={verificationLink} size={110} />
          </div>
        </div>

        <div className="permit-subtext">
          Pursuant to the provisions of the 2019 Antipolo City Revenue Code and the Local Government Code of 1991, this PERMIT is issued purposely to operate the specified business below, with the following particulars:
        </div>

        <div className="permit-fields-grid">
          <div className="permit-field-row">
            <div className="permit-field-label">Name of Permittee:</div>
            <div className="permit-field-value">{permitteeName || "N/A"}</div>
          </div>
          <div className="permit-field-row">
            <div className="permit-field-label">Permit No.:</div>
            <div className="permit-field-value">{permitNumber}</div>
          </div>
          <div className="permit-field-row">
            <div className="permit-field-label">Issued on:</div>
            <div className="permit-field-value">{issueDate}</div>
          </div>
          <div className="permit-field-row">
            <div className="permit-field-label">Residential Address:</div>
            <div className="permit-field-value">{residentialAddress || "N/A"}</div>
          </div>
          <div className="permit-field-row">
            <div className="permit-field-label">Business Address:</div>
            <div className="permit-field-value">{businessAddress || "N/A"}</div>
          </div>
          <div className="permit-field-row">
            <div className="permit-field-label">Kind/Nature of business:</div>
            <div className="permit-field-value">{kindOfBusiness}</div>
          </div>
          <div className="permit-field-row">
            <div className="permit-field-label">under the business name/trade name of:</div>
            <div className="permit-field-value permit-trade-name">{businessTradeName}</div>
          </div>
        </div>

        <div className="permit-notice-box">
          This PERMIT shall take effect upon approval and will terminate on <strong>December 31, {new Date().getFullYear()}</strong> unless sooner revoked for cause or in the interest of public service.
        </div>

        <div className="permit-conditions">
          <div className="permit-conditions-title">CONDITIONS FOR THE VALIDITY OF THIS PERMIT</div>
          <ol>
            <li>This permit and its corresponding issued Business Plate must be conspicuously posted in plain view at all times.</li>
            <li>This permit is not valid if unsigned or there is alteration, addition or erasure in it or if taxes, fees, charges are not paid pursuant to City Tax Ordinance.</li>
            <li>This permit is subject to the compliance by the permittee to all existing laws, ordinances, rules and regulations of the business, trade or calling permitted herein.</li>
            <li>This permit shall not in any way be construed to legalize any illegal activity or any illegal act.</li>
            <li>In case of retirement from business, trade or occupation, the permit owner/holder shall notify the City Government of Antipolo not later than the date of retirement and shall surrender this permit including prior permit(s) issued and business plate issued.</li>
            <li>This permit is non-transferable.</li>
            <li>Any misrepresentation(s) on the submitted document(s) in relation to the application for the issuance of this permit shall cause automatic revocation of this permit and forfeiture of whatever payments made in favor of the City Government of Antipolo without prejudice to the filing of suit before appropriate court.</li>
            <li>The permittee shall cause the posting in its premises, any public announcements/notices that the City Government may require from time to time.</li>
          </ol>
        </div>

        <div className="permit-bottom-row">
          <div className="permit-bottom-left">
            <div className="permit-mini-field">
              <span>BIN:</span> <strong>{app.bin || "021-02-2014-0001022"}</strong>
            </div>
            <div className="permit-mini-field">
              <span>PLATE NO.:</span> <strong>{app.plateNo || "007344"}</strong>
            </div>
            <div className="permit-mini-field">
              <span>O.R. Number:</span> <strong>{orNumber}</strong>
            </div>
            <div className="permit-mini-field">
              <span>Date Issued:</span> <strong>{issueDate}</strong>
            </div>
          </div>
        </div>

        <div className="permit-signatures-row">
          {permitSigners.map((signer) => (
            <div className="permit-signature-block" key={signer.id}>
              <div className="signature-line">
                {signer.signature ? (
                  <img
                    src={signer.signature}
                    alt={signer.name}
                    style={{ maxWidth: "100%", maxHeight: 60, display: "block", margin: "0 auto" }}
                  />
                ) : null}
              </div>
              <div className="signature-name">{signer.name}</div>
              <div className="signature-title">{signer.title}</div>
            </div>
          ))}
        </div>

        <button className="permit-print-button" onClick={() => window.print()}>
          Print / Save as PDF
        </button>
      </div>
    </div>
  );
}

