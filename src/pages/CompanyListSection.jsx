import React from "react";

const CompanyListSection = ({ setBusinessName, setApplicationType, setActiveMenu, viewCompany }) => (
  <div className="card company-card-wide" style={{ width: "100%", maxWidth: "none" }}>
    <h3>Registered Companies</h3>
    <p style={{ color: "#4B5563", fontSize: "1.1rem", marginBottom: "15px" }}>Manage your registered businesses and view permit statuses.</p>
    <table className="company-table" style={{ marginTop: 12 }}>
      <thead>
        <tr>
          <th>Company Name</th>
          <th>Business Type</th>
          <th>Permit Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {["ABC Trading", "Juan Dela Cruz Store", "Antipolo Food Hub"].map((c) => (
          <tr key={c}>
            <td>{c}</td>
            <td>Retail</td>
            <td><span className="status-badge status-approved">Active</span></td>
            <td>
              <button className="btn small primary" onClick={() => viewCompany(c)}>View</button>
              <button className="btn small negative" style={{ marginLeft: 8 }} onClick={() => { setBusinessName(c); setApplicationType("Renewal"); setActiveMenu("Apply Permit"); }}>Renew</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default CompanyListSection;
