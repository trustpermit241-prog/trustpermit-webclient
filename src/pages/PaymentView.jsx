import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const API_BASE_URL = "https://trustpermit-backend.onrender.com";

export default function PaymentView() {
  const { paymentId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPayment = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          `${API_BASE_URL}/api/payments`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const payments = res.data.payments || [];
        const payment = payments.find(p => p._id === paymentId);
        if (payment) {
          setData(payment);
        } else {
          setError("Payment not found");
        }
      } catch (err) {
        console.error("Error fetching payment:", err);
        setError(err.response?.data?.message || "Failed to load payment");
      } finally {
        setLoading(false);
      }
    };

    if (paymentId) {
      fetchPayment();
    }
  }, [paymentId]);

  if (loading) return <h2 style={{ padding: 40 }}>Loading payment...</h2>;
  if (error) return <h2 style={{ padding: 40, color: "red" }}>Error: {error}</h2>;
  if (!data) return <h2 style={{ padding: 40 }}>Payment not found</h2>;

  return (
    <div style={{ padding: 40, maxWidth: 900, margin: "0 auto" }}>
      <h1>Payment Details</h1>
      <div style={{ background: "#f5f5f5", padding: 20, borderRadius: 8 }}>
        <p><strong>Payment ID:</strong> {paymentId}</p>
        <p><strong>Amount:</strong> ₱ {data.amount?.toLocaleString("en-PH", { minimumFractionDigits: 2 }) || "N/A"}</p>
        <p><strong>Status:</strong> {data.status || "N/A"}</p>
        <p><strong>Payment Method:</strong> {data.paymentMethod || "N/A"}</p>
        <p><strong>Date:</strong> {new Date(data.createdAt).toLocaleDateString()}</p>
        {data.referenceNo && <p><strong>Reference No:</strong> {data.referenceNo}</p>}
      </div>
    </div>
  );
}
