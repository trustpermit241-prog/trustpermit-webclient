import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "./Verify.css";

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

export default function Verify() {
  const { permitId } = useParams();

  const [input, setInput] = useState(permitId || "");
  const [result, setResult] = useState(null);
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (permitId) {
      setInput(permitId);
      verifyPermit(permitId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permitId]);

  const verifyPermit = async (permitInput = input) => {
    setLoading(true);
    setDetails(null);

    try {
      console.log("🔍 Verifying permit:", permitInput);
      
      const res = await axios.get(
        `${API_BASE_URL}/api/blockchain/verify/${permitInput}`
      );

      console.log("✅ Verification response:", res.data);

      if (res.data.success) {
        setResult("BLOCKCHAIN VERIFIED PERMIT ✅");
        setDetails(res.data);
      } else {
        setResult("INVALID PERMIT ❌");
        setDetails(res.data); // Show details even on error
      }
    } catch (err) {
      console.error("❌ Verification error:", err);
      
      // Handle different error cases
      if (err.response?.status === 404) {
        setResult("PERMIT NOT FOUND ❌");
        setDetails({
          message: "This permit ID doesn't exist in the system.",
          errorCode: 404,
        });
      } else if (err.response?.status === 400) {
        setResult("PERMIT NOT RELEASED ❌");
        setDetails({
          message: err.response?.data?.message || "This permit has not been released yet.",
          status: err.response?.data?.application?.status,
          errorCode: 400,
        });
      } else {
        setResult("INVALID PERMIT ❌");
        setDetails({
          message: err.response?.data?.message || err.message || "Verification failed",
          errorCode: err.response?.status || 500,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = () => {
    if (!input.trim()) {
      setResult("Please enter a value first.");
      setDetails(null);
      return;
    }

    verifyPermit();
  };

  const isVerifiedPermit = details && result === "BLOCKCHAIN VERIFIED PERMIT ✅";
  const isEmpty = result === "Please enter a value first.";
  const isInvalid =
    !!result &&
    !isVerifiedPermit &&
    !isEmpty &&
    (permitId || result.includes("INVALID") || result.includes("NOT FOUND") || result.includes("NOT RELEASED"));

  return (
    <div className="verify-page">
      <div className="verify-card">
        <div className="verify-body">
          {!permitId && (
            <aside className="verify-left">
              <div className="verify-input-group">
                <label>PERMIT / APPLICATION ID</label>

                <input
                  placeholder="6aac116027f8bb62d531f4c3"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                />
              </div>

              <button className="verify-button" onClick={handleVerify} disabled={loading}>
                {loading ? "Verifying..." : "Verify Permit"}
              </button>
            </aside>
          )}

          <main className="verify-right">
            {!result && !loading && !permitId && (
              <div className="empty-state">
                <div className="empty-icon">⌕</div>
                <h2>Ready to Verify</h2>
                <p>Enter a document ID to check its authenticity.</p>
              </div>
            )}

            {loading && (
              <div className="empty-state">
                <div className="loader"></div>
                <h2>Verifying Document</h2>
                <p>Please wait while we check the blockchain record.</p>
              </div>
            )}

            {!loading && isVerifiedPermit && (
              <>
                <div className="result-banner verified">
                  <div className="result-icon verified-icon">✓</div>
                  <div className="result-text">
                    <h2>VERIFIED</h2>
                    <p>This document is authentic and verified on the Solana Devnet.</p>
                  </div>
                </div>

                <div className="details-box">
                  <h3>PERMIT DETAILS</h3>

                  <div className="detail-row">
                    <span>Business Name</span>
                    <b>{details.application?.businessName || "N/A"}</b>
                  </div>

                  <div className="detail-row">
                    <span>Application Type</span>
                    <b>{details.application?.applicationType || "N/A"}</b>
                  </div>

                  <div className="detail-row">
                    <span>Status</span>
                    <b className="status-pill">{details.application?.status || "Approved"}</b>
                  </div>

                  <div className="detail-row">
                    <span>Permit / Application ID</span>
                    <b className="break-text">{details.application?._id || input}</b>
                  </div>

                  <div className="detail-row">
                    <span>Blockchain Hash</span>
                    <b className="break-text">{details.blockchainRecord?.hash || "N/A"}</b>
                  </div>

                  <div className="detail-row">
                    <span>Transaction Signature</span>
                    <b className="break-text">
                      {details.blockchainRecord?.transactionSignature || "N/A"}
                    </b>
                  </div>

                  <div className="detail-row">
                    <span>Verification Status</span>
                    <b className="verified-text">Verified on Solana Devnet</b>
                  </div>

                  <div className="detail-row detail-row--full">
                    <span>Verification Note</span>
                    <b>This permit has been officially issued by the City Government and its record matches the secure blockchain ledger for authenticity and integrity.</b>
                  </div>
                </div>
              </>
            )}

            {!loading && isInvalid && (
              <>
                <div className="result-banner invalid">
                  <div className="result-icon invalid-icon">×</div>
                  <div className="result-text">
                    <h2>INVALID PERMIT</h2>
                    <p>{details?.message || "Failed to verify permit"}</p>
                  </div>
                </div>

                <div className="invalid-box">
                  {details?.status && (
                    <div className="status-note">
                      <strong>Current Status:</strong> <span>{details.status}</span>
                    </div>
                  )}
                  {details?.errorCode === 400 && (
                    <>
                      <h3>Permit Not Released</h3>
                      <p>This permit has not been released by staff yet. Once approved and payment is verified, the permit will be available for verification.</p>
                    </>
                  )}
                  {details?.errorCode === 404 && (
                    <>
                      <h3>Permit Not Found</h3>
                      <p>This permit ID doesn't exist in the system. Please check the ID and try again.</p>
                    </>
                  )}
                  {!details?.errorCode && (
                    <>
                      <h3>Possible Reasons</h3>
                      <p>• The permit ID is incorrect or incomplete.</p>
                      <p>• The document has not been released yet by the issuing office.</p>
                      <p>• The permit may have been revoked, expired, or does not match the official blockchain record.</p>
                    </>
                  )}

                  <div className="invalid-footer-note">
                    TrustPermit could not confirm this record against the official blockchain ledger. Please verify the ID or contact the City Government for assistance.
                  </div>
                </div>
              </>
            )}

            {!loading && isEmpty && (
              <div className="warning-box">
                <h3>Please enter a value first.</h3>
                <p>Input is required before verification.</p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}   
