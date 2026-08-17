import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import html2pdf from "html2pdf.js/dist/html2pdf.js";
import "./PaymentView.css";

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

export default function PaymentView({ paymentIdProp, paymentData }) {
  const { paymentId: routePaymentId, applicationId } = useParams();
  const receiptRef = useRef(null);

  const [data, setData] = useState(paymentData || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloadingPDF, setDownloadingPDF] = useState(false);

  const safeText = (value) => {
    if (value === null || value === undefined || value === "") return "N/A";

    if (typeof value === "object") {
      return (
        value.fullName ||
        value.email ||
        value.name ||
        value.businessName ||
        value._id ||
        value.id ||
        "N/A"
      );
    }

    return String(value);
  };

  const getValue = (...values) => {
    for (const value of values) {
      if (value !== null && value !== undefined && value !== "") {
        return safeText(value);
      }
    }

    return "N/A";
  };

  const formatMoney = (value) => {
    const amount = Number(value);

    if (Number.isNaN(amount)) return "N/A";

    return amount.toLocaleString("en-PH", {
      style: "currency",
      currency: "PHP",
    });
  };

  const formatDate = (value) => {
    if (!value) return "N/A";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "N/A";

    return date.toLocaleDateString("en-PH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const defaultReceiptItems = [
    { label: "Basic Tax (Individual)", amount: 5.0 },
    { label: "CTC - Additional Tax", amount: 100.0 },
    { label: "Delivery Vans/Trucks", amount: 750.0 },
    { label: "Permit fee on OTHER EATING ESTABLISHMENT", amount: 1000.0 },
    { label: "Barangay Clearance", amount: 3000.0 },
    { label: "Sanitary Inspection Fee", amount: 500.0 },
    { label: "EPO Fee", amount: 500.0 },
    { label: "Garbage Fees", amount: 1200.0 },
    { label: "Occupational Fee", amount: 750.0 },
    { label: "Health Fee", amount: 300.0 },
    { label: "Health Clearances", amount: 150.0 },
    { label: "CEWMO Training Fee", amount: 300.0 },
    { label: "CEWMO Inspection Fee", amount: 300.0 },
    { label: "Work Permits", amount: 150.0 },
    { label: "Sticker Fee", amount: 100.0 },
    { label: "Business Plate Fee", amount: 500.0 },
    { label: "Locational/Zoning Clearance Fee", amount: 1000.0 },
  ];

  const receiptItems = Array.isArray(data?.items)
    ? data.items
    : Array.isArray(data?.breakdown)
    ? data.breakdown
    : defaultReceiptItems;

  const receiptTotal = receiptItems.reduce(
    (sum, item) => sum + Number(item.amount ?? item.price ?? item.total ?? 0),
    0
  );

  const paymentTotal = Number(data?.amount ?? receiptTotal);

  useEffect(() => {
    const fetchPayment = async () => {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      if (!token) {
        setError("You must be logged in to view payment details.");
        setLoading(false);
        return;
      }

      const id = paymentIdProp || routePaymentId || applicationId;

      if (!id) {
        setError("Payment ID not found.");
        setLoading(false);
        return;
      }

      if (paymentData) {
        setData(paymentData);
        setLoading(false);
        return;
      }

      try {
        let res;

        try {
          res = await axios.get(`${API_BASE_URL}/api/payments/${id}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
        } catch (firstErr) {
          res = await axios.get(
            `${API_BASE_URL}/api/payments/application/${id}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
        }

        console.log("PAYMENT VIEW RESPONSE:", res.data);

        let payment =
          res.data?.payment ||
          res.data?.data ||
          res.data?.result ||
          res.data;

        if (Array.isArray(payment)) {
          payment = payment[0] || null;
        }

        if (Array.isArray(res.data?.payments)) {
          payment = res.data.payments[0] || null;
        }

        setData(payment);
      } catch (err) {
        console.error("Payment view error:", err);
        setError(
          err.response?.data?.message ||
            err.response?.data?.error ||
            "Failed to fetch payment data."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchPayment();
  }, [paymentIdProp, routePaymentId, applicationId]);

  if (loading) {
    return <div className="payment-view-loading">Loading payment...</div>;
  }

  if (error) {
    return <div className="payment-view-error">{error}</div>;
  }

  if (!data) {
    return <div className="payment-view-error">No payment data found.</div>;
  }

  const orderNumber = getValue(data.reference, data.paymentReference, data.referenceNumber, data._id, data.id);
  const orderDate = formatDate(data.timestamp || data.createdAt || data.updatedAt || data.date);
  const paymentMethod = getValue(data.paymentMethod, data.method, data.payment_method);

  const downloadReceiptPDF = async () => {
    if (!receiptRef.current) return;

    setDownloadingPDF(true);

    try {
      const element = receiptRef.current;
      const opt = {
        margin: 10,
        filename: `Receipt_${orderNumber || "Payment"}_${Date.now()}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { orientation: "portrait", unit: "mm", format: "a4" },
      };

      // Clone the element to avoid modifying the original
      const element2 = element.cloneNode(true);
      
      // Remove the download button from the cloned element
      const actionsDiv = element2.querySelector(".receipt-actions");
      if (actionsDiv) {
        actionsDiv.remove();
      }

      html2pdf().set(opt).from(element2).save();
    } catch (err) {
      console.error("Error downloading PDF:", err);
      alert("Failed to download receipt. Please try again.");
    } finally {
      setDownloadingPDF(false);
    }
  };

  return (
    <div className="payment-view-page">
      <div className="receipt-card" ref={receiptRef}>
        <div className="receipt-top">
          <div className="receipt-status" aria-label="Payment successful" title="Payment successful">
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M5 12.5L9.2 16.7L19 6.9" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1>Payment Successful</h1>
          <p className="receipt-subtitle">
            Order number: <span>{orderNumber}</span>
          </p>
          <p className="receipt-subtitle">Order date: {orderDate}</p>
        </div>

        <div className="receipt-divider" />

        <div className="receipt-section">
          <table className="receipt-table">
            <thead>
              <tr>
                <th>?</th>
                <th>Item</th>
                <th>Price</th>
              </tr>
            </thead>
            <tbody>
              {receiptItems.map((item, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{getValue(item.label, item.name, item.description, item.item)}</td>
                  <td>{formatMoney(item.amount ?? item.price ?? item.total ?? 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="receipt-summary">
          <div className="summary-row total-row">
            <span>Total</span>
            <strong>{formatMoney(paymentTotal)}</strong>
          </div>
          <div className="summary-row">
            <span>Payment method</span>
            <span>{paymentMethod}</span>
          </div>
          <div className="summary-row">
            <span>Tax</span>
            <span>{formatMoney(0)}</span>
          </div>
        </div>

        <div className="receipt-actions">
          <button
            className="download-receipt-btn"
            onClick={downloadReceiptPDF}
            disabled={downloadingPDF}
            aria-label={downloadingPDF ? "Downloading receipt" : "Download receipt"}
            title={downloadingPDF ? "Downloading receipt" : "Download receipt"}
          >
            <span className="download-button-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 3V14M12 14L7 9M12 14L17 9M5 17.5V18.75C5 19.9926 6.00736 21 7.25 21H16.75C17.9926 21 19 19.9926 19 18.75V17.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
            <span className="download-button-label">
              {downloadingPDF ? "Downloading receipt" : "Download receipt"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
