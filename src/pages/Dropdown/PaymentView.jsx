import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import "./PaymentView.css";

const API_BASE_URL = "https://trustpermit-backend.onrender.com";

export default function PaymentView() {
  const { paymentId, applicationId } = useParams();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

    return date.toLocaleString();
  };

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

      const id = paymentId || applicationId;

      if (!id) {
        setError("Payment ID not found.");
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
  }, [paymentId, applicationId]);

  if (loading) {
    return <div className="payment-view-loading">Loading payment...</div>;
  }

  if (error) {
    return <div className="payment-view-error">{error}</div>;
  }

  if (!data) {
    return <div className="payment-view-error">No payment data found.</div>;
  }

  const application = data.applicationId || data.application || {};

  return (
    <div className="payment-view-page">
      <div className="payment-receipt-card">
        <div className="payment-header">
          <h1>Payment Details</h1>
          <p>TrustPermit payment transaction record</p>
        </div>

        <div className="payment-section">
          <h2>Transaction Information</h2>

          <div className="payment-grid">
            <div className="payment-field">
              <label>Payment ID</label>
              <div>{getValue(data._id, data.id)}</div>
            </div>

            <div className="payment-field">
              <label>Status</label>
              <div>{getValue(data.status)}</div>
            </div>

            <div className="payment-field">
              <label>Amount</label>
              <div>{formatMoney(data.amount)}</div>
            </div>

            <div className="payment-field">
              <label>Payment Method</label>
              <div>{getValue(data.paymentMethod, data.method)}</div>
            </div>

            <div className="payment-field">
              <label>Reference Number</label>
              <div>{getValue(data.referenceNumber, data.reference, data.paymentReference)}</div>
            </div>

            <div className="payment-field">
              <label>Date Paid</label>
              <div>{formatDate(data.paidAt || data.createdAt)}</div>
            </div>
          </div>
        </div>

        <div className="payment-section">
          <h2>Payer Information</h2>

          <div className="payment-grid">
            <div className="payment-field">
              <label>Name</label>
              <div>{getValue(data.name, data.userId?.fullName)}</div>
            </div>

            <div className="payment-field">
              <label>Email</label>
              <div>{getValue(data.email, data.userId?.email)}</div>
            </div>

            <div className="payment-field">
              <label>User ID</label>
              <div>{getValue(data.userId)}</div>
            </div>
          </div>
        </div>

        <div className="payment-section">
          <h2>Application Information</h2>

          <div className="payment-grid">
            <div className="payment-field">
              <label>Application ID</label>
              <div>{getValue(application)}</div>
            </div>

            <div className="payment-field">
              <label>Business Name</label>
              <div>
                {getValue(
                  application.businessName,
                  application.businessInfo?.businessName,
                  application.businessDetails?.businessName
                )}
              </div>
            </div>

            <div className="payment-field">
              <label>Application Type</label>
              <div>{getValue(application.applicationType)}</div>
            </div>

            <div className="payment-field">
              <label>Permit Released</label>
              <div>{data.permitReleased ? "Yes" : "No"}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}