import React, { useEffect, useMemo, useState } from "react";
import QRCode from "react-qr-code";
import "./Payment.css";

const API_BASE_URL = "https://trustpermit-backend.onrender.com";
const FRONTEND_URL = "https://trustpermit-webclient.vercel.app";

export default function Payment() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [approvingId, setApprovingId] = useState(null);

  const getApplicationId = (payment) => {
    if (!payment) return null;

    return (
      payment?.applicationId?._id ||
      payment?.applicationId ||
      payment?.application?._id ||
      payment?.application ||
      null
    );
  };

  const parseJsonSafely = async (res) => {
    const text = await res.text();

    try {
      return text ? JSON.parse(text) : {};
    } catch {
      console.error("Backend returned non-JSON/HTML:", text);
      throw new Error(
        "Server returned HTML instead of JSON. Check if the backend route exists."
      );
    }
  };

  const fetchPayments = async () => {
    setLoading(true);
    setNotice("");

    try {
      const res = await fetch(`${API_BASE_URL}/api/payments`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      const data = await parseJsonSafely(res);

      if (!res.ok) {
        throw new Error(data.message || "Failed to fetch payments.");
      }

      setPayments(data.success && Array.isArray(data.payments) ? data.payments : []);
    } catch (err) {
      console.error("Fetch payments error:", err);
      setPayments([]);
      setNotice(err.message || "Error fetching payments.");
    } finally {
      setLoading(false);
    }
  };

  const approveAndReleasePermit = async (paymentId) => {
    const confirmApprove = window.confirm(
      "Approve this payment and automatically release the permit?"
    );

    if (!confirmApprove) return;

    setApprovingId(paymentId);

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/payments/${paymentId}/approve-release`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const data = await parseJsonSafely(res);

      if (!res.ok) {
        throw new Error(
          data.message || data.error || "Failed to approve and release permit."
        );
      }

      alert(
        "Payment approved, permit released, QR generated, and Solana proof created!"
      );

      await fetchPayments();
    } catch (error) {
      console.error("Approve payment error:", error);
      alert(error.message || "Something went wrong.");
    } finally {
      setApprovingId(null);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const filteredPayments = useMemo(() => {
    if (activeFilter === "all") return payments;

    return payments.filter(
      (payment) =>
        String(payment?.paymentMethod || "").toLowerCase() === activeFilter
    );
  }, [payments, activeFilter]);

  const totalAmount = useMemo(() => {
    return filteredPayments.reduce(
      (sum, payment) => sum + Number(payment?.amount || 0),
      0
    );
  }, [filteredPayments]);

  const gcashCount = payments.filter(
    (payment) => String(payment?.paymentMethod || "").toLowerCase() === "gcash"
  ).length;

  const bankCount = payments.filter((payment) => {
    const method = String(payment?.paymentMethod || "").toLowerCase();
    return method === "card" || method === "bank";
  }).length;

  const formatAmount = (amount) => {
    const value = Number(amount || 0);

    return value.toLocaleString("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatDate = (date) => {
    if (!date) return "N/A";

    try {
      return new Date(date).toLocaleString("en-PH", {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "N/A";
    }
  };

  const getPaymentIcon = (method) => {
    const value = String(method || "").toLowerCase();

    if (value === "gcash") return "📱";
    if (value === "bank" || value === "card") return "🏦";

    return "💳";
  };

  return (
    <section className="payments-overview">
      <div className="payments-hero">
        <div>
          <span className="payments-eyebrow">Staff Payment Center</span>
          <h1>User Payments</h1>
          <p>Approve payments and automatically release permits.</p>
        </div>

        <button
          type="button"
          className="refresh-payment-btn"
          onClick={fetchPayments}
          disabled={loading}
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div className="payment-summary-grid">
        <div className="summary-card">
          <span>Total Records</span>
          <strong>{payments.length}</strong>
        </div>

        <div className="summary-card">
          <span>Visible Amount</span>
          <strong>₱{formatAmount(totalAmount)}</strong>
        </div>

        <div className="summary-card">
          <span>GCash Payments</span>
          <strong>{gcashCount}</strong>
        </div>

        <div className="summary-card">
          <span>Bank/Card Payments</span>
          <strong>{bankCount}</strong>
        </div>
      </div>

      <div className="payment-toolbar">
        <div className="payment-filter-tabs">
          <button
            type="button"
            className={activeFilter === "all" ? "active" : ""}
            onClick={() => setActiveFilter("all")}
          >
            All
          </button>

          <button
            type="button"
            className={activeFilter === "gcash" ? "active" : ""}
            onClick={() => setActiveFilter("gcash")}
          >
            GCash
          </button>

          <button
            type="button"
            className={activeFilter === "card" ? "active" : ""}
            onClick={() => setActiveFilter("card")}
          >
            Bank / Card
          </button>
        </div>
      </div>

      {notice && <div className="notice">{notice}</div>}
      {loading && <div className="loading">Loading payments...</div>}

      {!loading && filteredPayments.length === 0 && !notice && (
        <div className="empty-state">
          <div className="empty-icon">💰</div>
          <strong>No payments found</strong>
          <span>Try another filter or wait for users to submit payments.</span>
        </div>
      )}

      {!loading && filteredPayments.length > 0 && (
        <div className="payment-list">
          {filteredPayments.map((payment, index) => {
            const payerName =
              payment?.name || payment?.userId?.fullName || payment?.userId?.name || "N/A";

            const payerEmail = payment?.email || payment?.userId?.email || "N/A";
            const status = payment?.status || "pending";
            const method = String(payment?.paymentMethod || "N/A").toLowerCase();
            const isReleased = payment?.permitReleased === true;
            const applicationId = getApplicationId(payment);

            const verificationLink =
              payment?.verificationUrl ||
              (applicationId ? `${FRONTEND_URL}/verify/${applicationId}` : "");

            return (
              <div className="payment-card" key={payment?._id || index}>
                <div className="payment-card-top">
                  <div className="payer-info">
                    <div className="payment-method-icon">
                      {getPaymentIcon(method)}
                    </div>

                    <div>
                      <h3>{payerName}</h3>
                      <span>{payerEmail}</span>
                    </div>
                  </div>

                  <span className={`status-pill ${String(status).toLowerCase()}`}>
                    {isReleased ? "Released" : status}
                  </span>
                </div>

                <div className="payment-amount-box">
                  <span>Amount Paid</span>
                  <strong>₱{formatAmount(payment?.amount)}</strong>
                </div>

                <div className="payment-row">
                  <strong>Payment Method</strong>
                  <span className={`method-pill ${method}`}>
                    {method === "card" ? "Bank / Card" : method}
                  </span>
                </div>

                <div className="payment-row">
                  <strong>Payment ID</strong>
                  <span className="payment-id">{payment?._id || "N/A"}</span>
                </div>

                <div className="payment-row">
                  <strong>Application ID</strong>
                  <span className="payment-id">{applicationId || "N/A"}</span>
                </div>

                <div className="payment-row">
                  <strong>Date Received</strong>
                  <span>{formatDate(payment?.createdAt)}</span>
                </div>

                <div className="payment-row">
                  <strong>Permit Status</strong>
                  <span>{isReleased ? "Released" : "Not Released"}</span>
                </div>

                {isReleased && applicationId && verificationLink && (
                  <div className="payment-qr-box">
                    <h4>Permit QR Verification</h4>
                    <QRCode value={verificationLink} size={120} />
                    <small>{verificationLink}</small>
                  </div>
                )}

                {isReleased && !applicationId && (
                  <div className="notice">
                    Permit released, but Application ID is missing.
                  </div>
                )}

                {payment?.blockchainRecord?.transactionSignature ? (
                  <div className="blockchain-box">
                    <strong>Solana Proof</strong>

                    <span className="break-text">
                      Hash: {payment.blockchainRecord.hash}
                    </span>

                    <span className="break-text">
                      Tx: {payment.blockchainRecord.transactionSignature}
                    </span>

                    <a
                      href={`https://explorer.solana.com/tx/${payment.blockchainRecord.transactionSignature}?cluster=devnet`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View on Solana Explorer
                    </a>
                  </div>
                ) : (
                  isReleased && (
                    <div className="blockchain-box">
                      <strong>Solana Proof</strong>
                      <span>Transaction pending...</span>
                    </div>
                  )
                )}

                <div className="payment-actions">
                  <button
                    type="button"
                    className="approve-btn"
                    disabled={isReleased || approvingId === payment._id}
                    onClick={() => approveAndReleasePermit(payment._id)}
                  >
                    {approvingId === payment._id
                      ? "Processing..."
                      : isReleased
                      ? "Permit Released"
                      : "Approve & Release Permit"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}