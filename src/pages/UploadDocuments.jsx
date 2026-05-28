import React, { useState } from "react";

const REQUIRED_DOCUMENTS = [
  "Locational Clearance",
  "Barangay Clearance",
  "Fire Safety Evaluation Certificate",
  "Building Permit",
  "Wiring Permit",
];

export default function UploadDocuments({ applicationId }) {
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleFileChange = (doc, fileList) => {
    setUploadedFiles((prev) => ({
      ...prev,
      [doc]: fileList[0] || null,
    }));
  };

  const handleUpload = async () => {
    if (!applicationId) {
      alert("No application ID found.");
      return;
    }

    const selectedFiles = Object.values(uploadedFiles).filter(Boolean);

    if (selectedFiles.length === 0) {
      alert("Please upload at least one document.");
      return;
    }

    setUploading(true);
    setSuccess(false);

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        alert("No token found. Please log in again.");
        setUploading(false);
        return;
      }

      const formData = new FormData();
      formData.append("applicationId", applicationId);

      Object.entries(uploadedFiles).forEach(([docName, file]) => {
        if (file) {
          formData.append("documents", file);
          formData.append("documentNames", docName);
        }
      });

      const res = await fetch(
        "https://trustpermit-backend.onrender.com/api/applications/upload-documents",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await res.json().catch(() => ({}));

      console.log("UPLOAD RESPONSE:", data);

      if (!res.ok) {
        throw new Error(
          data.message || data.error || "Failed to upload documents"
        );
      }

      setSuccess(true);
      setUploadedFiles({});
      alert("Documents uploaded successfully!");
    } catch (err) {
      console.error("Upload error:", err);
      alert(err.message || "Failed to upload documents");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="upload-documents-page">
      <h2>Upload Required Documents</h2>

      <ul>
        {REQUIRED_DOCUMENTS.map((doc) => (
          <li key={doc} style={{ marginBottom: 16 }}>
            <span>{doc}</span>

            <input
              type="file"
              onChange={(e) => handleFileChange(doc, e.target.files)}
              disabled={uploading}
            />

            {uploadedFiles[doc] && (
              <small style={{ marginLeft: 10 }}>
                {uploadedFiles[doc].name}
              </small>
            )}
          </li>
        ))}
      </ul>

      <button onClick={handleUpload} disabled={uploading}>
        {uploading ? "Uploading..." : "Submit Documents"}
      </button>

      {success && (
        <div style={{ color: "green", marginTop: 10 }}>
          All documents uploaded!
        </div>
      )}
    </div>
  );
}