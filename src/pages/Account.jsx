import React, { useState } from "react";
import "./Account.css";

const Account = () => {
  const [activeMenu, setActiveMenu] = useState("Accounts");
  const [applicationType, setApplicationType] = useState("New Application");
  const [applicantType, setApplicantType] = useState("Individual/Sole Proprietorship");

  // State to store uploaded files
  const [uploadedFiles, setUploadedFiles] = useState({});

  // Update files in state
  const handleFileUpload = (docName, files) => {
    setUploadedFiles((prev) => ({
      ...prev,
      [docName]: files[0] || null, // take the first file
    }));
  };

  // Generate required documents array
  const getRequiredDocuments = () => {
    if (applicationType === "New Application") {
      return applicantType === "Individual/Sole Proprietorship"
        ? [
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
          ]
        : [
            "SEC Registration",
            "Articles of Incorporation / Bylaws",
            "Mayor’s Permit Application Form",
            "Barangay Clearance",
            "Lease Contract or Land Title",
            "Community Tax Certificate (CTC)",
            "Occupancy Permit",
            "Payment of Fees",
          ];
    } else {
      return [
        "Business Permit Renewal Application Form",
        "Previous Year’s Business / Mayor’s Permit",
        "Updated Barangay Clearance",
        "Community Tax Certificate (CTC)",
        "Fire Safety Inspection Certificate",
        "Zoning / Locational Clearance",
        "Payment of Renewal Fees",
      ];
    }
  };

  // Render content based on menu selection
  const renderContent = () => {
    switch (activeMenu) {
      case "Accounts":
        return (
          <div className="card">
            <h3>My Account</h3>
            <p><strong>Name:</strong> Samantha Brown</p>
            <p><strong>Email:</strong> samantha@email.com</p>
            <button className="btn" onClick={() => alert("Update Profile clicked")}>
              Update Profile
            </button>
          </div>
        );

      case "List of Companies":
        return (
          <div className="card">
            <h3>My Registered Companies</h3>
            <ul className="company-list">
              <li>ABC Trading</li>
              <li>Juan Dela Cruz Store</li>
              <li>Antipolo Food Hub</li>
            </ul>
          </div>
        );

      case "Permit":
        return (
          <div className="card">
            <h3>My Permit Requests</h3>
            <table>
              <thead>
                <tr>
                  <th>Business Name</th>
                  <th>Status</th>
                  <th>Date Filed</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>ABC Trading</td>
                  <td>Under Review</td>
                  <td>Jan 12, 2026</td>
                </tr>
              </tbody>
            </table>
          </div>
        );

      case "Collection":
        return (
          <div className="card">
            <h3>Payments</h3>
            <p className="highlight">Total Paid: ₱26,568.00</p>
            <button className="btn">View Official Receipt</button>
          </div>
        );

      case "Clearance & Assessment":
        return (
          <div className="card">
            <h3>Clearance & Assessment</h3>
            <p>Your documents are currently being reviewed.</p>
          </div>
        );

      case "Business Clearance":
        return (
          <div className="card">
            <h3>Business Clearance</h3>
            <p className="approved">Status: Approved ✅</p>
            <button className="btn primary">Download Clearance</button>
          </div>
        );

      case "Business Assessment":
        return (
          <div className="card">
            <h3>Business Assessment</h3>
            <p>Assessment Fee: ₱5,000</p>
            <button className="btn primary">Proceed to Payment</button>
          </div>
        );

      case "Apply Permit":
        const requiredDocs = getRequiredDocuments();

        return (
          <div className="card">
            <h3>Apply for Business Permit</h3>
            <input placeholder="Business Name" />
            <select
              value={applicationType}
              onChange={(e) => setApplicationType(e.target.value)}
            >
              <option>New Application</option>
              <option>Renewal</option>
            </select>
            {applicationType === "New Application" && (
              <select
                value={applicantType}
                onChange={(e) => setApplicantType(e.target.value)}
              >
                <option>Individual/Sole Proprietorship</option>
                <option>Partnership/Corporation</option>
              </select>
            )}

            <h4>Required Documents:</h4>
            <ul>
              {requiredDocs.map((doc, index) => (
                <li key={index} className="document-upload">
                  {doc}{" "}
                  <label className="upload-btn">
                    Upload
                    <input
                      type="file"
                      accept=".doc,.docx"
                      onChange={(e) => handleFileUpload(doc, e.target.files)}
                    />
                  </label>
                  {uploadedFiles[doc] && (
                    <span className="file-name">{uploadedFiles[doc].name}</span>
                  )}
                </li>
              ))}
            </ul>

            <button
              className="btn primary"
              onClick={() => console.log("Uploaded files:", uploadedFiles)}
            >
              Submit Application
            </button>
          </div>
        );

      case "My Permits":
        return (
          <div className="card">
            <h3>My Permits</h3>
            <table>
              <thead>
                <tr>
                  <th>Business</th>
                  <th>Permit Type</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Juan Dela Cruz Store</td>
                  <td>Renewal</td>
                  <td className="status pending">Pending</td>
                </tr>
              </tbody>
            </table>
          </div>
        );

      case "Inspection":
        return (
          <div className="card">
            <h3>Inspection Schedule</h3>
            <table>
              <thead>
                <tr>
                  <th>Type of Inspection</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Fire Safety Inspection</td>
                  <td>Jan 25, 2026</td>
                  <td>Approved ✅</td>
                </tr>
                <tr>
                  <td>Sanitary Inspection</td>
                  <td>Jan 26, 2026</td>
                  <td>Pending ⏳</td>
                </tr>
                <tr>
                  <td>Building & Electrical</td>
                  <td>Jan 27, 2026</td>
                  <td>Failed ❌</td>
                </tr>
                <tr>
                  <td>Locational/Zoning</td>
                  <td>Jan 28, 2026</td>
                  <td>Pending ⏳</td>
                </tr>
                <tr>
                  <td>Environmental</td>
                  <td>Jan 29, 2026</td>
                  <td>Scheduled 🗓️</td>
                </tr>
              </tbody>
            </table>
          </div>
        );

      case "PaymentsForm":
        return (
          <div className="card">
            <h3>Payments</h3>
            <p>Assessment Fee: ₱5,000</p>
            <button className="btn primary">Pay Now</button>
          </div>
        );

      default:
        return (
          <div className="card">
            <p>Select a menu option to view content.</p>
          </div>
        );
    }
  };

  return (
    <div className="account-container">
      {/* Side Menu */}
      <nav className="side-menu">
        <div className="logo">
          <img src="/path/to/logo.png" alt="Logo" />
        </div>
        <ul>
          <li onClick={() => setActiveMenu("Accounts")}>Accounts</li>
          <li onClick={() => setActiveMenu("List of Companies")}>List of Companies</li>
          <li onClick={() => setActiveMenu("Permit")}>Permit</li>
          <li onClick={() => setActiveMenu("Collection")}>Collection</li>
          <li onClick={() => setActiveMenu("Clearance & Assessment")}>Clearance & Assessment</li>
          <li onClick={() => setActiveMenu("Business Clearance")}>Business Clearance</li>
          <li onClick={() => setActiveMenu("Business Assessment")}>Business Assessment</li>
          <li onClick={() => setActiveMenu("Apply Permit")}>Apply Permit</li>
          <li onClick={() => setActiveMenu("My Permits")}>My Permits</li>
          <li onClick={() => setActiveMenu("PaymentsForm")}>Payments Form</li>
          <li onClick={() => setActiveMenu("Inspection")}>Inspection</li>
        </ul>
      </nav>

      {/* Main Content */}
      <main className="content-area">{renderContent()}</main>
    </div>
  );
};

export default Account;
