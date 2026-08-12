import React, { useEffect, useMemo, useState } from "react";
import QRCode from "react-qr-code";
import CenteredModal from "../../components/CenteredModal";
import PaymentView from "../Dropdown/PaymentView";
import "./Payment.css";

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

export default function Payment() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [approvingId, setApprovingId] = useState(null);
  const [qrModalPayment, setQrModalPayment] = useState(null);
  const [paymentViewModalPayment, setPaymentViewModalPayment] = useState(null);

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
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("No token found. Please login again.");
      }

      const res = await fetch(`${API_BASE_URL}/payments`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await parseJsonSafely(res);

      console.log("PAYMENT RESPONSE:", data);

      if (!res.ok) {
        throw new Error(data.message || "Failed to fetch payments.");
      }

      const paymentList = Array.isArray(data)
        ? data
        : Array.isArray(data.payments)
        ? data.payments
        : Array.isArray(data.data)
        ? data.data
        : Array.isArray(data.results)
        ? data.results
        : [];

      console.log("PAYMENT LIST:", paymentList);

      setPayments(paymentList);
    } catch (err) {
      console.error("Fetch payments error:", err);
      setPayments([]);
      setNotice(err.message || "Error fetching payments.");
    } finally {
      setLoading(false);
    }
  };

  const [confirmModal, setConfirmModal] = useState({ open: false, paymentId: null });

  const approveAndReleasePermit = async (paymentId) => {
    setConfirmModal({ open: true, paymentId });
  };

  const handleCancelConfirm = () => {
    setConfirmModal({ open: false, paymentId: null });
  };

  const handleConfirmApprove = async () => {
    const paymentId = confirmModal.paymentId;
    setConfirmModal({ open: false, paymentId: null });
    if (!paymentId) return;

    const approvedPayment = payments.find((p) => p._id === paymentId) || null;
    setApprovingId(paymentId);

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("No token found. Please login again.");
      }

      const res = await fetch(
        `${API_BASE_URL}/payments/${paymentId}/approve-release`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await parseJsonSafely(res);

      console.log("APPROVE PAYMENT RESPONSE:", data);

      if (!res.ok) {
        throw new Error(
          data.message || data.error || "Failed to approve and release permit."
        );
      }

      setNotice("Payment approved, permit released, QR generated, and Solana proof created!");

      const updatedPayment = data.payment
        ? {
            ...data.payment,
            blockchainRecord:
              data.payment.blockchainRecord || data.blockchainRecord || approvedPayment?.blockchainRecord,
          }
        : {
            ...approvedPayment,
            blockchainRecord: data.blockchainRecord || approvedPayment?.blockchainRecord,
          };

      setQrModalPayment(updatedPayment);
      await fetchPayments();
    } catch (error) {
      console.error("Approve payment error:", error);
      setNotice(error.message || "Something went wrong.");
    } finally {
      setApprovingId(null);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const filteredPayments = useMemo(() => {
    if (activeFilter === "all") return payments;

    return payments.filter((payment) => {
      const method = String(
        payment?.paymentMethod || payment?.method || ""
      ).toLowerCase();

      if (activeFilter === "card") {
        return method === "card" || method === "bank";
      }

      return method === activeFilter;
    });
  }, [payments, activeFilter]);

  const totalAmount = useMemo(() => {
    return filteredPayments.reduce(
      (sum, payment) => sum + Number(payment?.amount || 0),
      0
    );
  }, [filteredPayments]);

  const gcashCount = payments.filter((payment) => {
    const method = String(
      payment?.paymentMethod || payment?.method || ""
    ).toLowerCase();

    return method === "gcash";
  }).length;

  const bankCount = payments.filter((payment) => {
    const method = String(
      payment?.paymentMethod || payment?.method || ""
    ).toLowerCase();

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

  // table-style payments UI with search, filters, and pagination
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const matchingPayments = filteredPayments.filter((p) => {
    if (statusFilter !== "all") {
      const s = String(p?.status || "").toLowerCase();
      if (statusFilter === "paid" && s !== "paid") return false;
      if (statusFilter === "unpaid" && s === "paid") return false;
      if (statusFilter === "overdue" && s !== "overdue") return false;
    }

    if (!searchText) return true;

    const q = searchText.toLowerCase();
    const invoiceId = String(p?._id || p?.id || "").toLowerCase();
    const client = String(p?.name || p?.userId?.fullName || "").toLowerCase();
    const service = String(p?.service || p?.application?.applicationType || "").toLowerCase();

    return (
      invoiceId.includes(q) ||
      client.includes(q) ||
      service.includes(q) ||
      String(p?.email || "").toLowerCase().includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(matchingPayments.length / pageSize));
  const paged = matchingPayments.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => setCurrentPage(1), [searchText, statusFilter, activeFilter]);

  return (
    <section className="payments-overview table-mode">
      <div className="payments-hero">
        <div>
          
          <h1>Payments</h1>
          
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            className="payment-search"
            placeholder="Search invoice, client, or service..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />

          <button
            type="button"
            className="refresh-payment-btn"
            onClick={fetchPayments}
            disabled={loading}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      <div className="payment-summary-grid">
        <div className="summary-card">
          <span>In Transit</span>
          <strong>₱{formatAmount(payments.filter(p => String(p.status||"").toLowerCase() === "in transit").reduce((s, r) => s + Number(r.amount||0), 0))}</strong>
        </div>
        <div className="summary-card">
          <span>Total Paid</span>
          <strong>₱{formatAmount(payments.filter(p => String(p.status||"").toLowerCase() === "paid").reduce((s, r) => s + Number(r.amount||0), 0))}</strong>
        </div>
        <div className="summary-card">
          <span>Total Unpaid</span>
          <strong>₱{formatAmount(payments.filter(p => String(p.status||"").toLowerCase() !== "paid").reduce((s, r) => s + Number(r.amount||0), 0))}</strong>
        </div>
        <div className="summary-card">
          <span>Total Overdue</span>
          <strong>₱{formatAmount(payments.filter(p => String(p.status||"").toLowerCase() === "overdue").reduce((s, r) => s + Number(r.amount||0), 0))}</strong>
        </div>
      </div>

      <div className="payment-toolbar table-controls">
        <div className="payment-filter-tabs status-tabs">
          <button type="button" className={statusFilter === "all" ? "active" : ""} onClick={() => setStatusFilter("all")}>All</button>
          <button type="button" className={statusFilter === "paid" ? "active" : ""} onClick={() => setStatusFilter("paid")}>Paid</button>
          <button type="button" className={statusFilter === "unpaid" ? "active" : ""} onClick={() => setStatusFilter("unpaid")}>Unpaid</button>
          <button type="button" className={statusFilter === "overdue" ? "active" : ""} onClick={() => setStatusFilter("overdue")}>Overdue</button>
        </div>

        <div className="table-meta">
          <div className="results-count">Showing {paged.length} of {matchingPayments.length} entries</div>
        </div>
      </div>

      {notice && <div className="notice">{notice}</div>}

      <div className="payments-table-wrap">
        <table className="payments-table">
          <thead>
            <tr>
              <th></th>
              <th>Invoice ID</th>
              <th>Issue Date</th>
              <th>Client Name</th>
              <th>Status</th>
              <th>Services</th>
              <th>Price</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            {paged.map((payment) => {
              const status = String(payment?.status || "").toLowerCase();
              const payer = payment?.name || payment?.userId?.fullName || "-";
              const issue = formatDate(payment?.createdAt);
              const service = payment?.service || payment?.application?.applicationType || "-";
              return (
                <tr key={payment._id}>
                  <td><input type="checkbox" /></td>
                  <td>{payment?._id?.slice?.(0,8) || "-"}</td>
                  <td>{issue}</td>
                  <td>{payer}</td>
                  <td><span className={`status-pill ${status}`}>{status || "-"}</span></td>
                  <td>{service}</td>
                  <td>₱{formatAmount(payment?.amount)}</td>
                  <td className="row-actions">
                    {payment?._id && (
                      <>
                        {!payment?.permitReleased && (
                          <button
                            className="approve-btn small"
                            disabled={approvingId === payment._id}
                            onClick={() => approveAndReleasePermit(payment._id)}
                          >
                            {approvingId === payment._id ? "Processing..." : "Approve & Release"}
                          </button>
                        )}

                        {payment?.permitReleased && (
                          <>
                            <button
                              className="refresh-payment-btn small"
                              onClick={() => setQrModalPayment(payment)}
                            >
                              View Permit
                            </button>

                            <button
                              className="refresh-payment-btn small"
                              style={{ marginLeft: 8 }}
                              onClick={() => setPaymentViewModalPayment(payment)}
                            >
                              View
                            </button>
                          </>
                        )}
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="table-footer">
        <div className="pagination">
          <button onClick={() => setCurrentPage((p) => Math.max(1, p-1))} disabled={currentPage<=1}>&lt;</button>
          <span>{currentPage} / {totalPages}</span>
          <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p+1))} disabled={currentPage>=totalPages}>&gt;</button>
        </div>
      </div>

      <CenteredModal
        open={confirmModal.open}
        title="Approve Payment"
        message="Approve this payment and automatically release the permit?"
        buttonText="Approve"
        cancelText="Cancel"
        variant="default"
        onConfirm={handleConfirmApprove}
        onCancel={handleCancelConfirm}
      />

      <CenteredModal
        open={Boolean(qrModalPayment)}
        title="Permit Verification"
        buttonText="Close"
        cancelText=""
        onClose={() => setQrModalPayment(null)}
        hideActions={false}
      >
        {qrModalPayment && (
          <div style={{ textAlign: 'left', marginTop: 10 }}>
            <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', justifyContent: 'center' }}>
              {(() => {
                const applicationId = getApplicationId(qrModalPayment);
                // Always generate the frontend URL for QR code display
                const verificationLink = applicationId 
                  ? `${FRONTEND_URL}/verify/${applicationId}` 
                  : "";
                return (
                  <>
                    {verificationLink ? (
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ marginBottom: 10 }}>Open verification</div>
                        <QRCode value={verificationLink} size={140} />
                        
                      </div>
                    ) : null}
                  </>
                );
              })()}
            </div>

            <div className="solana-proof-box" style={{ marginTop: 24, padding: 18, borderRadius: 16, background: '#f8fafc', border: '1px solid rgba(148,163,184,0.2)' }}>
              <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>Solana Proof</div>
              <div style={{ color: '#475569', marginBottom: 6 }}><strong>Hash:</strong> <span className="break-text">{qrModalPayment?.blockchainRecord?.hash || 'N/A'}</span></div>
              <div style={{ color: '#475569', marginBottom: 10 }}><strong>Tx:</strong> <span className="break-text">{qrModalPayment?.blockchainRecord?.transactionSignature || 'N/A'}</span></div>
              {qrModalPayment?.blockchainRecord?.transactionSignature && (
                <a href={`https://explorer.solana.com/tx/${qrModalPayment.blockchainRecord.transactionSignature}?cluster=devnet`} target="_blank" rel="noreferrer" style={{ color: '#2563eb', fontWeight: 700 }}>
                  View on Solana Explorer
                </a>
              )}
            </div>
          </div>
        )}
      </CenteredModal>

      <CenteredModal
        open={Boolean(paymentViewModalPayment)}
        overlayClassName="transparent-overlay"
        buttonText="Close"
        cancelText=""
        onClose={() => setPaymentViewModalPayment(null)}
        hideActions={false}
        className="request-details-modal"
      >
        {paymentViewModalPayment && (
          <PaymentView
            paymentIdProp={paymentViewModalPayment._id}
            paymentData={paymentViewModalPayment}
          />
        )}
      </CenteredModal>
    </section>
  );
}
