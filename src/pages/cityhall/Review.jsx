import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./Review.css";

const API_BASE_URL = "https://trustpermit-backend.onrender.com";

export default function Review() {
  const { applicationId } = useParams();
  const navigate = useNavigate();

  const [application, setApplication] = useState(null);
  const [allApplications, setAllApplications] = useState([]);
  const [uploadedDocs, setUploadedDocs] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [documentStatus, setDocumentStatus] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const getToken = () => localStorage.getItem("token");

  const getFileUrl = (doc) => {
    if (!doc) return "";

    const fileName = doc.fileName || doc.filename || doc.originalName || "";
    const filePath = doc.filePath || doc.path || doc.url || doc.fileUrl || "";

    if (filePath.startsWith("http")) return filePath;

    if (filePath) {
      return `${API_BASE_URL}${filePath.startsWith("/") ? filePath : `/${filePath}`}`;
    }

    if (fileName) {
      return `${API_BASE_URL}/uploads/documents/${fileName}`;
    }

    return "";
  };

  const isImageFile = (doc) => {
    const type = doc?.mimeType || "";
    const name = doc?.originalName || doc?.fileName || "";
    return type.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp)$/i.test(name);
  };

  const isPdfFile = (doc) => {
    const type = doc?.mimeType || "";
    const name = doc?.originalName || doc?.fileName || "";
    return type === "application/pdf" || /\.pdf$/i.test(name);
  };

  const safeJson = async (res) => {
    const text = await res.text();

    try {
      return text ? JSON.parse(text) : {};
    } catch {
      console.log("Non-JSON response:", text);
      return {};
    }
  };

  const fetchUploadedDocuments = async (id) => {
    try {
      const token = getToken();

      const res = await fetch(
        `${API_BASE_URL}/api/applications/upload-documents/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await safeJson(res);

      if (!res.ok) {
        console.error("Documents fetch failed:", data);
        return [];
      }

      if (Array.isArray(data)) return data;
      if (Array.isArray(data.documents)) return data.documents;
      if (Array.isArray(data.uploadedDocuments)) return data.uploadedDocuments;
      if (Array.isArray(data.data)) return data.data;

      return [];
    } catch (error) {
      console.error("Documents fetch error:", error);
      return [];
    }
  };

  const fetchApplicationDetails = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const token = getToken();

      if (!token) {
        setError("Unauthorized");
        setLoading(false);
        return;
      }

      const url = applicationId
        ? `${API_BASE_URL}/api/applications/${applicationId}`
        : `${API_BASE_URL}/api/applications`;

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await safeJson(res);

      if (!res.ok) {
        throw new Error(data.message || "Failed to fetch applications");
      }

      if (applicationId) {
        const appData = data.application || data.data || data;

        setApplication(appData);
        setDocumentStatus(appData?.documentStatuses || {});

        const docs = await fetchUploadedDocuments(applicationId);
        setUploadedDocs(docs);
      } else {
        const apps = Array.isArray(data)
          ? data
          : Array.isArray(data.applications)
          ? data.applications
          : Array.isArray(data.data)
          ? data.data
          : [];

        const activeApps = apps.filter(
          (app) => String(app.status || "").toLowerCase() !== "completed"
        );

        setAllApplications(activeApps);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load applications.");
    } finally {
      setLoading(false);
    }
  }, [applicationId]);

  useEffect(() => {
    fetchApplicationDetails();
  }, [fetchApplicationDetails]);

  const handleApprove = (docName) => {
    setDocumentStatus((prev) => ({
      ...prev,
      [docName]: "Approved",
    }));
  };

  const handleReject = (docName) => {
    setDocumentStatus((prev) => ({
      ...prev,
      [docName]: "Rejected",
    }));
  };

  const handleUpdate = (docName) => {
    setDocumentStatus((prev) => ({
      ...prev,
      [docName]: "Pending",
    }));
  };

  const getCurrentDocStatus = (doc, index) => {
    const docName = doc.documentName || `Document ${index + 1}`;
    return documentStatus[docName] || doc.status || "Pending";
  };

  const formatDate = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const finalizeReview = async () => {
    try {
      const token = getToken();

      if (!application?._id) {
        alert("No application selected.");
        return;
      }

      if (uploadedDocs.length === 0) {
        alert("Cannot finalize review. No documents uploaded.");
        return;
      }

      const anyRejected = uploadedDocs.some(
        (doc, index) => getCurrentDocStatus(doc, index) === "Rejected"
      );

      if (anyRejected) {
        alert(
          "Cannot finalize review because one or more documents are rejected. The user must reupload the rejected document first."
        );
        return;
      }

      const allApproved = uploadedDocs.every(
        (doc, index) => getCurrentDocStatus(doc, index) === "Approved"
      );

      if (!allApproved) {
        alert("Cannot finalize review. Please approve all documents first.");
        return;
      }

      const res = await fetch(
        `${API_BASE_URL}/api/applications/${application._id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status: "Completed",
            documentStatuses: documentStatus,
          }),
        }
      );

      const data = await safeJson(res);

      if (!res.ok) {
        throw new Error(data.message || "Failed to finalize review");
      }

      alert("Review finalized successfully! Status: Completed");
      navigate("/staff/review");
    } catch (error) {
      alert(error.message);
    }
  };

  const closeViewer = () => {
    if (selectedDoc && selectedDoc.temp && selectedDoc.fileUrl) {
      try {
        URL.revokeObjectURL(selectedDoc.fileUrl);
      } catch (e) {
        // ignore
      }
    }

    setViewerOpen(false);
    setSelectedDoc(null);
  };

  const downloadAllDocuments = () => {
    const urls = uploadedDocs
      .map((doc) => getFileUrl(doc))
      .filter((url) => Boolean(url));

    if (urls.length === 0) {
      alert("No downloadable documents found.");
      return;
    }

    urls.forEach((url) => {
      window.open(url, "_blank");
    });
  };

  const fileInputs = useRef({});
  const [openActionIndex, setOpenActionIndex] = useState(null);

  if (loading) {
    return (
      <section className="review-section">
        <div className="review-content">
          <h3>Loading...</h3>
        </div>
      </section>
    );
  }

  if (!applicationId) {
    return (
      <section className="review-section">
        <div className="review-header-wrap">
          <h1 className="review-page-title">Uploaded Documents</h1>
        </div>
        <div className="review-content">
          {error && <div className="review-error">{error}</div>}

          <ul className="application-card-list">
            {allApplications.length > 0 ? (
              allApplications.map((app) => (
                <li key={app._id} className="application-card">
                  <div className="application-card-info">
                    <div className="application-card-title">
                      {app.businessName || "Application"}
                    </div>
                    <div className="application-card-meta">
                      {app.applicationNumber ? (
                        <span>Application No: {app.applicationNumber}</span>
                      ) : null}
                      <span>
                        Submitted on: {formatDate(app.createdAt || app.submittedAt)}
                      </span>
                    </div>
                  </div>

                  <button
                    className="review-now-btn"
                    type="button"
                    onClick={() => navigate(`/staff/review/${app._id}`)}
                  >
                    Review Now
                  </button>
                </li>
              ))
            ) : (
              <p className="center-text">No pending applications for review.</p>
            )}
          </ul>
        </div>
      </section>
    );
  }

  return (
    <section className="review-section">
      <div className="review-header-wrap">
        <h1 className="review-page-title">Uploaded Documents</h1>
      </div>
      <div className="review-content">
        {error && <div className="review-error">{error}</div>}

        <div className="application-summary-card">
          <div className="application-card-info">
            <div className="application-card-title">
              {application?.businessName || "Selected Application"}
            </div>
            <div className="application-card-meta">
              {application?.applicationNumber ? (
                <span>Application No: {application.applicationNumber}</span>
              ) : null}
              <span>
                Submitted on: {formatDate(application?.createdAt || application?.submittedAt)}
              </span>
            </div>
          </div>
          <div className="application-card-end">
            <span className={`status ${String(application?.status || "Pending").toLowerCase()}`}>
              {application?.status || "Pending"}
            </span>
            <button
              type="button"
              className="review-now-btn"
              onClick={() => navigate("/staff/review")}
            >
              Back to list
            </button>
          </div>
        </div>

        <div className="submitted-documents-card">
          <div className="section-heading">
            <h2 className="section-title">Submitted Documents</h2>
          </div>

          {uploadedDocs.length === 0 ? (
            <p className="center-text">No documents uploaded.</p>
          ) : (
            <div className="table-wrap">
              <table className="submitted-documents-table">
                <thead>
                  <tr>
                    <th>Document Name</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {uploadedDocs.map((doc, index) => {
                    const docName = doc.documentName || `Document ${index + 1}`;
                    const status = getCurrentDocStatus(doc, index);
                    const fileUrl = getFileUrl(doc);

                    return (
                      <tr key={doc._id || index}>
                        <td>{docName}</td>
                        <td>
                          <span className={`status ${status.toLowerCase()}`}>
                            {status}
                          </span>
                        </td>
                        <td>
                          <div className="doc-actions">
                            <button
                              type="button"
                              className="btn icon-btn view-icon"
                              onClick={() => {
                                if (fileUrl) {
                                  setSelectedDoc(doc);
                                  setViewerOpen(true);
                                }
                              }}
                              aria-label="View document"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="32"
                                height="32"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                              </svg>
                            </button>
                            <div className="status-dropdown">
                              <select
                                className="status-select"
                                value={status}
                                onChange={(e) => {
                                  const selectedStatus = e.target.value;
                                  if (selectedStatus === "Approved") {
                                    handleApprove(docName);
                                  } else if (selectedStatus === "Rejected") {
                                    handleReject(docName);
                                  } else if (selectedStatus === "Pending") {
                                    handleUpdate(docName);
                                  }
                                }}
                              >
                                <option value="Pending">Pending</option>
                                <option value="Approved">Approved</option>
                                <option value="Rejected">Rejected</option>
                              </select>
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <button
          type="button"
          className="review-now-btn finalize-btn"
          onClick={finalizeReview}
        >
          Finalize Review
        </button>
      </div>

      {viewerOpen && selectedDoc && (
        <div className="viewer-backdrop" onClick={closeViewer}>
          <div className="viewer-overlay" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="viewer-close"
              onClick={closeViewer}
            >
              ×
            </button>

            {isImageFile(selectedDoc) && (
              <img
                src={selectedDoc.temp ? selectedDoc.fileUrl : getFileUrl(selectedDoc)}
                alt="Document"
                className="viewer-image"
              />
            )}

            {isPdfFile(selectedDoc) && (
              <iframe
                title="PDF Preview"
                src={selectedDoc.temp ? selectedDoc.fileUrl : getFileUrl(selectedDoc)}
                className="viewer-frame"
              />
            )}

            {!isImageFile(selectedDoc) && !isPdfFile(selectedDoc) && (
              <div className="viewer-empty">
                Preview not available
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}