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

export default function DocumentsView() {
  const { applicationId } = useParams();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          `${API_BASE_URL}/applications/upload-documents/${applicationId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setDocuments(Array.isArray(res.data) ? res.data : res.data.documents || []);
      } catch (err) {
        console.error("Error fetching documents:", err);
        setError(err.response?.data?.message || "Failed to load documents");
      } finally {
        setLoading(false);
      }
    };

    if (applicationId) {
      fetchDocuments();
    }
  }, [applicationId]);

  if (loading) return <h2 style={{ padding: 40 }}>Loading documents...</h2>;
  if (error) return <h2 style={{ padding: 40, color: "red" }}>Error: {error}</h2>;

  return (
    <div style={{ padding: 40, maxWidth: 900, margin: "0 auto" }}>
      <h1>Uploaded Documents</h1>
      <p style={{ color: "#666", marginBottom: 20 }}>Application ID: {applicationId}</p>
      
      {documents.length === 0 ? (
        <p style={{ color: "#999" }}>No documents uploaded yet.</p>
      ) : (
        <div style={{ background: "#f5f5f5", padding: 20, borderRadius: 8 }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #ddd" }}>
                <th style={{ textAlign: "left", padding: 10 }}>Document Type</th>
                <th style={{ textAlign: "left", padding: 10 }}>File Name</th>
                <th style={{ textAlign: "left", padding: 10 }}>Uploaded Date</th>
                <th style={{ textAlign: "left", padding: 10 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc, idx) => (
                <tr key={idx} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: 10 }}>{doc.documentType || "N/A"}</td>
                  <td style={{ padding: 10 }}>
                    {doc.url ? (
                      <a href={doc.url} target="_blank" rel="noreferrer">
                        {doc.fileName || "Download"}
                      </a>
                    ) : (
                      doc.fileName || "N/A"
                    )}
                  </td>
                  <td style={{ padding: 10 }}>{new Date(doc.uploadedAt).toLocaleDateString()}</td>
                  <td style={{ padding: 10 }}>
                    <span style={{ 
                      background: doc.status === "approved" ? "#d1fae5" : "#fef3c7",
                      padding: "4px 8px",
                      borderRadius: 4,
                      fontSize: "0.9rem"
                    }}>
                      {doc.status || "Pending"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

