import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "./Verify.css";

const API_BASE_URL = "https://trustpermit-backend.onrender.com";

export default function Verify() {
  const { permitId } = useParams();

  const [verifyType, setVerifyType] = useState("clearance");
  const [input, setInput] = useState(permitId || "");
  const [result, setResult] = useState(null);
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (permitId) {
      setVerifyType("permit");
      setInput(permitId);
      verifyPermit(permitId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permitId]);

  const verifyClearance = async () => {
    setLoading(true);

    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/clearance/verify/${input}`
      );

      setResult(res.data.valid ? "VALID CLEARANCE ✅" : "INVALID CLEARANCE ❌");
      setDetails(null);
    } catch {
      setResult("INVALID CLEARANCE ❌");
      setDetails(null);
    } finally {
      setLoading(false);
    }
  };

  const verifyPermit = async (permitInput = input) => {
    setLoading(true);

    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/blockchain/verify/${permitInput}`
      );

      if (res.data.success) {
        setResult("BLOCKCHAIN VERIFIED PERMIT ✅");
        setDetails(res.data);
      } else {
        setResult("INVALID PERMIT ❌");
        setDetails(null);
      }
    } catch {
      setResult("INVALID PERMIT ❌");
      setDetails(null);
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

    if (verifyType === "clearance") {
      verifyClearance();
    } else {
      verifyPermit();
    }
  };

  const isVerifiedPermit = details && result === "BLOCKCHAIN VERIFIED PERMIT ✅";
  const isValidClearance = result === "VALID CLEARANCE ✅";
  const isInvalid = result?.includes("INVALID");
  const isEmpty = result === "Please enter a value first.";

  return (
    <div className="verify-page">
      <div className="verify-card">
        <header className="verify-header">
          <div className="verify-title-wrap">
            <div className="verify-logo">✓</div>
            <div>
              <h1>Document Verification</h1>
              <p>Blockchain Verification System</p>
            </div>
          </div>

          <div className="verify-powered">
            <span>Powered by</span>
            <strong>Solana</strong>
          </div>
        </header>

        <div className="verify-body">
          <aside className="verify-left">
            <p className="section-label">Verify Type</p>

            <label className={`verify-option ${verifyType === "clearance" ? "active" : ""}`}>
              <input
                type="radio"
                value="clearance"
                checked={verifyType === "clearance"}
                onChange={() => {
                  setVerifyType("clearance");
                  setInput("");
                  setResult(null);
                  setDetails(null);
                }}
              />
              <span>
                <b>Verify Clearance</b>
                <small>Validate clearance documents</small>
              </span>
            </label>

            <label className={`verify-option ${verifyType === "permit" ? "active" : ""}`}>
              <input
                type="radio"
                value="permit"
                checked={verifyType === "permit"}
                onChange={() => {
                  setVerifyType("permit");
                  setInput("");
                  setResult(null);
                  setDetails(null);
                }}
              />
              <span>
                <b>Verify Business Permit</b>
                <small>Verify business permit on blockchain</small>
              </span>
            </label>

            <div className="verify-input-group">
              <label>
                {verifyType === "clearance"
                  ? "Clearance Hash"
                  : "Permit / Application ID"}
              </label>

              <input
                placeholder={
                  verifyType === "clearance"
                    ? "Enter clearance hash"
                    : "Enter application/permit ID"
                }
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
            </div>

            <button className="verify-button" onClick={handleVerify} disabled={loading}>
              {loading ? "Verifying..." : "Verify Document"}
            </button>

            <p className="verify-note">
              🔒 All verifications are checked securely through the blockchain record.
            </p>
          </aside>

          <main className="verify-right">
            {!result && !loading && (
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
                  <div className="result-icon">✓</div>
                  <div>
                    <h2>Verified</h2>
                    <p>This document is authentic and verified on the Solana Devnet.</p>
                  </div>
                </div>

                <div className="details-box">
                  <h3>Permit Details</h3>

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
                </div>
              </>
            )}

            {!loading && isValidClearance && (
              <div className="result-banner verified">
                <div className="result-icon">✓</div>
                <div>
                  <h2>Valid Clearance</h2>
                  <p>This clearance document is valid and verified successfully.</p>
                </div>
              </div>
            )}

            {!loading && isInvalid && (
              <>
                <div className="result-banner invalid">
                  <div className="result-icon">×</div>
                  <div>
                    <h2>Invalid Permit</h2>
                    <p>This document could not be found on the blockchain.</p>
                  </div>
                </div>

                <div className="invalid-box">
                  <h3>Possible Reasons</h3>
                  <p>× The permit ID is incorrect.</p>
                  <p>× The document has not been registered on the blockchain.</p>
                  <p>× The document may be revoked or expired.</p>
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