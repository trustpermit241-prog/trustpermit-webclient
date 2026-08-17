import React, { useState } from "react";
import CenteredModal from "../components/CenteredModal";

const REQUIRED_DOCUMENTS = [
  "DTI/SEC Registration",
  "Contract OF LEASE IF RENTING & COPY OF LESSOR'S PERMIT IF OWNED TAX DECLARATION OF LAND AND BUILDING",
  "PROPERTY TAX RECEIPT OF LAND AND BUILDING",
  "PICTURE OF OWNER",
  "PANORAMIC PICTURE OF THE ESTABLISHMENT",
  "PICTURE OF THE ESTABLISHMENT'S SHOWING INSTALLED CCTV CAMERA",
  "LOCATIONAL SKETCH",
  "PROFILE OF G-CASH/PAYMAAYA"
];

export default function UploadDocuments({ applicationId }) {
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [modal, setModal] = useState({ open: false, title: "", message: "", buttonText: "OK", variant: "default", className: "" });

  const handleFileChange = (doc, fileList) => {
    setUploadedFiles((prev) => ({
      ...prev,
      [doc]: fileList[0] || null,
    }));
  };

  const handleUpload = async () => {
    if (!applicationId) {
      setModal({
        open: true,
        title: "Missing Application",
        message: "No application ID found.",
        buttonText: "OK",
        variant: "error",
        className: "custom-upload-modal",
      });
      return;
    }

    const missingDocs = REQUIRED_DOCUMENTS.filter((doc) => !uploadedFiles[doc]);

    if (missingDocs.length > 0) {
      setModal({
        open: true,
        title: "Missing Documents",
        message: `Please upload all required documents before continuing. Missing: ${missingDocs.join(", ")}`,
        buttonText: "OK",
        variant: "error",
        className: "custom-upload-modal",
      });
      return;
    }

    setUploading(true);
    setSuccess(false);

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setModal({
          open: true,
          title: "Authentication Required",
          message: "No token found. Please log in again.",
          buttonText: "OK",
          variant: "error",
          className: "custom-upload-modal",
        });
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
      setModal({
        open: true,
        title: "Upload Complete",
        message: "Documents uploaded successfully! Your application is now ready for staff review.",
        buttonText: "Continue",
        variant: "success",
        className: "custom-upload-modal",
      });
    } catch (err) {
      console.error("Upload error:", err);
      setModal({
        open: true,
        title: "Upload Failed",
        message: err.message || "Failed to upload documents",
        buttonText: "OK",
        variant: "error",
        className: "custom-upload-modal",
      });
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

      <CenteredModal
        open={modal.open}
        title={modal.title}
        message={modal.message}
        buttonText={modal.buttonText}
        variant={modal.variant}
        className={modal.className}
        onClose={() => setModal((prev) => ({ ...prev, open: false }))}
      />
    </div>
  );
}