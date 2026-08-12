import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import "./UploadedDocumentsView.css";

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

const getFileUrl = (doc) => {
  if (!doc) return "";

  const filePath = doc.filePath || doc.path || doc.url || doc.fileUrl || "";
  const fileName = doc.fileName || doc.filename || "";

  if (filePath && filePath.startsWith("http")) return filePath;

  if (filePath) {
    return `${API_BASE_URL}${filePath.startsWith("/") ? filePath : `/${filePath}`}`;
  }

  if (fileName) {
    return `${API_BASE_URL}/uploads/documents/${fileName}`;
  }

  return "";
};

const getDocName = (doc, index) => {
  return (
    doc.documentName ||
    doc.name ||
    doc.originalName ||
    doc.fileName ||
    `Document ${index + 1}`
  );
};

const isImageFile = (doc) => {
  const type = doc?.mimeType || doc?.type || "";
  const name = doc?.originalName || doc?.fileName || doc?.filename || "";

  return type.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp)$/i.test(name);
};

const isPdfFile = (doc) => {
  const type = doc?.mimeType || doc?.type || "";
  const name = doc?.originalName || doc?.fileName || doc?.filename || "";

  return type === "application/pdf" || /\.pdf$/i.test(name);
};

const normalizeStatus = (status) => {
  if (!status) return "Pending";

  const value = String(status).toLowerCase();

  if (value === "approved") return "Approved";
  if (value === "rejected") return "Rejected";
  if (value === "pending") return "Pending";

  return status;
};

export default function UploadedDocumentsView({ applicationId: propApplicationId }) {
  const { applicationId: routeApplicationId } = useParams();
  const applicationId = propApplicationId || routeApplicationId;

  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [rejectedPopupOpen, setRejectedPopupOpen] = useState(false);
  const [rejectedDocumentName, setRejectedDocumentName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDocuments = async () => {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      if (!token) {
        setError("You must be logged in to view documents.");
        setLoading(false);
        return;
      }

      if (!applicationId) {
        setError("Application ID not found.");
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get(
          `${API_BASE_URL}/applications/upload-documents/${applicationId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        console.log("UPLOADED DOCUMENTS RESPONSE:", res.data);

        const docs = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.documents)
          ? res.data.documents
          : Array.isArray(res.data?.uploadedDocuments)
          ? res.data.uploadedDocuments
          : Array.isArray(res.data?.data)
          ? res.data.data
          : [];

        setDocuments(docs);

        const rejectedDoc = docs.find(
          (doc) => normalizeStatus(doc.status).toLowerCase() === "rejected"
        );

        if (rejectedDoc) {
          setRejectedDocumentName(getDocName(rejectedDoc, 0));
          setRejectedPopupOpen(true);
        }
      } catch (err) {
        console.error("Fetch uploaded documents error:", err);

        setError(
          err.response?.data?.message ||
            err.response?.data?.error ||
            "Failed to fetch documents."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [applicationId]);

  if (loading) {
    return <div className="documents-view-loading">Loading documents...</div>;
  }

  if (error) {
    return <div className="documents-view-error">{error}</div>;
  }

  if (!documents.length) {
    return <div className="documents-view-error">No documents uploaded.</div>;
  }

  return (
    <div className="documents-view-page">
      <div className="documents-view-card">
        <div className="documents-view-header">
          <h1>Uploaded Documents</h1>
          <p>Documents submitted for application verification</p>
        </div>

        <div className="documents-list">
          {documents.map((doc, index) => {
            const fileUrl = getFileUrl(doc);
            const status = normalizeStatus(doc.status);

            return (
              <div key={doc._id || doc.id || index} className="document-card">
                <div className="document-icon">
                  {isPdfFile(doc) ? "PDF" : isImageFile(doc) ? "" : "FILE"}
                </div>

                <div className="document-info">
                  <h3>{getDocName(doc, index).replace(/G-CASH/g, "G\u2011CASH")}</h3>

                  <p>
                    <strong>Status:</strong>{" "}
                    <span
                      className={`document-status ${status
                        .toLowerCase()
                        .replace(/\s+/g, "-")}`}
                    >
                      {status}
                    </span>
                  </p>

                  {status === "Rejected" && (
                    <p className="document-reupload-message">
                      This document was rejected. Please reupload a valid file.
                    </p>
                  )}
                </div>

                <div className="document-actions">
                  {fileUrl ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDoc(doc);
                        setViewerOpen(true);
                      }}
                    >
                      Preview
                    </button>
                  ) : (
                    <span>No file URL</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {rejectedPopupOpen && (
        <div
          className="document-viewer-overlay"
          onClick={() => setRejectedPopupOpen(false)}
        >
          <div
            className="document-rejected-popup"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Document Rejected</h2>
            <p>
              Your document{" "}
              <strong>{rejectedDocumentName || "uploaded document"}</strong> was
              rejected. Please reupload the correct document.
            </p>

            <button
              type="button"
              onClick={() => setRejectedPopupOpen(false)}
            >
              Okay
            </button>
          </div>
        </div>
      )}

      {viewerOpen && selectedDoc && (
        <div
          className="document-viewer-overlay"
          onClick={() => setViewerOpen(false)}
        >
          <div
            className="document-viewer-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="document-viewer-close"
              onClick={() => setViewerOpen(false)}
            >
              �
            </button>

            {isImageFile(selectedDoc) && (
              <img
                src={getFileUrl(selectedDoc)}
                alt={getDocName(selectedDoc, 0)}
                className="document-preview-image"
              />
            )}

            {isPdfFile(selectedDoc) && (
              <iframe
                title="Document preview"
                src={getFileUrl(selectedDoc)}
                className="document-preview-frame"
              />
            )}

            {!isImageFile(selectedDoc) && !isPdfFile(selectedDoc) && (
              <div className="document-preview-empty">
                Preview not available.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
