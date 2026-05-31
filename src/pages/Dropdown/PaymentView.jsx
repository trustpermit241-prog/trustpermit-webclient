import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import "./PaymentView.css";

const API_BASE_URL = "https://trustpermit-backend.onrender.com";

export default function PaymentView() {
  const { applicationId } = useParams(); // get applicationId from URL
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

  if (loading) return <div>Loading Payment...</div>;
  if (error) return <div style={{ color: "red" }}>{error}</div>;
  if (!data) return <div>No payment data found.</div>;

  return (
    <div className="view-section">
      <h4>Payment</h4>
      <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}