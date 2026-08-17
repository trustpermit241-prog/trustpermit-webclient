import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

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

export default function ApplicationView() {
  const { applicationId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchApplication = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          `${API_BASE_URL}/api/applications/${applicationId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setData(res.data);
      } catch (err) {
        console.error("Error fetching application:", err);
        setError(err.response?.data?.message || "Failed to load application");
      } finally {
        setLoading(false);
      }
    };

    if (applicationId) {
      fetchApplication();
    }
  }, [applicationId]);

  if (loading) return <h2 style={{ padding: 40 }}>Loading application...</h2>;
  if (error) return <h2 style={{ padding: 40, color: "red" }}>Error: {error}</h2>;
  if (!data) return <h2 style={{ padding: 40 }}>Application not found</h2>;

  return (
    <div style={{ padding: 40, maxWidth: 900, margin: "0 auto" }}>
      <h1>Application Details</h1>
      <div style={{ background: "#f5f5f5", padding: 20, borderRadius: 8 }}>
        <p><strong>Application ID:</strong> {applicationId}</p>
        <p><strong>Status:</strong> {data.status || "N/A"}</p>
        <p><strong>Company Name:</strong> {data.businessName || "N/A"}</p>
        <p><strong>Application Type:</strong> {data.applicationType || "N/A"}</p>
        <p><strong>Created:</strong> {new Date(data.createdAt).toLocaleDateString()}</p>
      </div>
    </div>
  );
}

