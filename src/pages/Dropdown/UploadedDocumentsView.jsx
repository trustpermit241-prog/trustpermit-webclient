import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import "./UploadedDocumentsView.css";

const API_BASE_URL = "https://trustpermit-backend.onrender.com";

const getFileUrl = (path) => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  if (path.startsWith("/")) return `${API_BASE_URL}${path}`;
  return `${API_BASE_URL}/${path}`;
};

export default function UploadedDocumentsView() {
  const { applicationId } = useParams();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDocuments = async () => {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");
      if (!token) {
        setError("You must be logged in to view documents.");
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/applications/upload-documents/${applicationId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        setDocuments(Array.isArray(res.data) ? res.data : res.data.documents || []);
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || "Failed to fetch documents.");
      } finally {
        setLoading(false);
      }
    };

    if (applicationId) fetchDocuments();
  }, [applicationId]);

  if (loading) return <div className="loading">Loading Documents...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!documents.length) return <div className="error-message">No documents uploaded.</div>;

  return (
    <div className="view-section">
      <h4>Uploaded Documents</h4>
      <ul className="document-list">
        {documents.map((doc) => (
          <li key={doc._id} className="document-card">
            <span>{doc.documentName || doc.originalName || "Untitled document"}</span>
            <a href={getFileUrl(doc.filePath)} target="_blank" rel="noopener noreferrer">
              View
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
