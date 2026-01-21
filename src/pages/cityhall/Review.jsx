import { useState, useEffect } from "react";
import "./Review.css";

export default function Review({
  applicationType = "New Application",
  applicantType = "Individual/Sole Proprietorship",
}) {
  const [documentStatus, setDocumentStatus] = useState({});

  useEffect(() => {
    setDocumentStatus({});
  }, [applicationType, applicantType]);

  const getRequiredDocuments = () => {
    if (applicationType === "New Application") {
      if (applicantType === "Individual/Sole Proprietorship") {
        return [
          "Business Permit Application Form",
          "Barangay Clearance",
          "Lease Contract or Land Title",
          "DTI Business Name Registration",
          "Community Tax Certificate (CTC)",
          "Valid ID (government-issued)",
          "Sketch/Photo of Business Location",
          "Occupancy Permit or Fire Safety Inspection Certificate",
          "Zoning Clearance",
          "Payment of Fees",
        ];
      } else {
        return [
          "SEC Registration",
          "Articles of Incorporation / Bylaws",
          "Mayor’s Permit Application Form",
          "Barangay Clearance",
          "Lease Contract or Land Title",
          "Community Tax Certificate (CTC)",
          "Occupancy Permit",
          "Payment of Fees",
        ];
      }
    }

    // Renewal documents
    return [
      "Business Permit Renewal Application Form",
      "Previous Year’s Business / Mayor’s Permit",
      "Updated Barangay Clearance",
      "Community Tax Certificate (CTC)",
      "Fire Safety Inspection Certificate",
      "Zoning / Locational Clearance",
      "Payment of Renewal Fees",
    ];
  };

  const handleApprove = (doc) => {
    setDocumentStatus((prev) => ({ ...prev, [doc]: "Approved" }));
  };

  const handleReject = (doc) => {
    setDocumentStatus((prev) => ({ ...prev, [doc]: "Rejected" }));
  };

  const handleUpdate = (doc) => {
    // When updating, reset status to Pending for staff to decide again
    setDocumentStatus((prev) => ({ ...prev, [doc]: "Pending" }));
  };

  const requiredDocuments = getRequiredDocuments();

  return (
    <section className="review-section">
      <div className="card">
        <h3>Staff Document Review</h3>
        <h4>Application Type: {applicationType}</h4>
        {applicationType === "New Application" && (
          <h4>Applicant Type: {applicantType}</h4>
        )}

        <h4>Required Documents:</h4>

        <ul className="document-list">
          {requiredDocuments.map((doc) => {
            const status = documentStatus[doc] || "Pending";

            return (
              <li key={doc} className="document-item">
                <span className="doc-name">{doc}</span>

                <div className="doc-actions">
                  <span className={`status ${status.toLowerCase()}`}>
                    {status}
                  </span>

                  {/* Approve / Reject buttons only if not Rejected or Pending */}
                  {status === "Pending" && (
                    <>
                      <button
                        className="btn approve"
                        onClick={() => handleApprove(doc)}
                      >
                        Approve
                      </button>
                      <button
                        className="btn reject"
                        onClick={() => handleReject(doc)}
                      >
                        Reject
                      </button>
                    </>
                  )}

                  {/* Show Update button only if the document was Rejected */}
                  {status === "Rejected" && (
                    <button
                      className="btn update"
                      onClick={() => handleUpdate(doc)}
                    >
                      Update
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>

        <button
          className="btn primary"
          onClick={() => console.log("Finalized Status:", documentStatus)}
        >
          Finalize Review
        </button>
      </div>
    </section>
  );
}
