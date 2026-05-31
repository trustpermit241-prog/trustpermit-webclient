import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import "./PaymentView.css";

const API_BASE_URL = "https://trustpermit-backend.onrender.com";

export default function PaymentView() {
  const { applicationId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPayment = async () => {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");
      if (!token) {
        setError("You must be logged in to view payment details.");
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get(`${API_BASE_URL}/api/payments/application/${applicationId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setData(res.data);
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || "Failed to fetch payment data.");
      } finally {
        setLoading(false);
      }
    };

    if (applicationId) fetchPayment();
  }, [applicationId]);

  if (loading) return <div className="loading">Loading Payment...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!data) return <div className="error-message">No payment data found.</div>;

  const renderValue = (value) => {
    if (value === null || value === undefined) return "—";
    if (Array.isArray(value)) return value.length ? value.join(", ") : "—";
    if (typeof value === "object") return JSON.stringify(value, null, 2);
    return value.toString();
  };

  const fields = Array.isArray(data)
    ? []
    : Object.entries(data).filter(([, value]) => value === null || typeof value !== "object");

  const nestedFields = Array.isArray(data)
    ? []
    : Object.entries(data).filter(([, value]) => value !== null && typeof value === "object");

  return (
    <div className="view-section">
      <h4>Payment</h4>
      <div className="details-grid">
        {fields.map(([key, value]) => (
          <div key={key} className="detail-row">
            <div className="detail-key">
              {key.replace(/([A-Z])/g, " $1").replace(/^./, (char) => char.toUpperCase())}
            </div>
            <div className="detail-value">{renderValue(value)}</div>
          </div>
        ))}
      </div>

      {nestedFields.length > 0 && (
        <div className="json-panel">
          <div className="json-label">Raw payment details</div>
          <pre>{JSON.stringify(Object.fromEntries(nestedFields), null, 2)}</pre>
        </div>
      )}

      {Array.isArray(data) && (
        <div className="json-panel">
          <div className="json-label">Payment list</div>
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
