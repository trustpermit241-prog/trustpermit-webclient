// Network.jsx
import React from "react";
import "./Network.css";

export default function Network() {
  const agencies = [
    { id: "B", name: "Business Permits Office", dept: "City Hall", role: "Primary Issuer", status: "Online", validations: 58, avgResponse: "1h", load: 70 },
    { id: "F", name: "Fire Safety Bureau", dept: "Fire Department", role: "Validator", status: "Online", validations: 23, avgResponse: "4h", load: 50 },
    { id: "H", name: "Health Department", dept: "Sanitation", role: "Validator", status: "Online", validations: 29, avgResponse: "2h", load: 65 },
    { id: "C", name: "City Planning Office", dept: "Planning", role: "Validator", status: "Online", validations: 56, avgResponse: "1h", load: 80 },
    { id: "E", name: "Environment Office", dept: "Environment", role: "Validator", status: "Online", validations: 12, avgResponse: "2h", load: 40 }
  ];

  return (
    <div className="network-page">
      <h1>Agency Network</h1>
      <p className="network-description">
        Participating government agencies and their validation status.
      </p>

      <div className="summary-cards">
        <div className="card">
          <div className="icon shield"></div>
          <div className="text">
            <h2>{agencies.length}</h2>
            <p>Active Agencies</p>
          </div>
        </div>
        <div className="card">
          <div className="icon uptime"></div>
          <div className="text">
            <h2>99.9%</h2>
            <p>Network Uptime</p>
          </div>
        </div>
        <div className="card">
          <div className="icon clock"></div>
          <div className="text">
            <h2>4.2 hrs</h2>
            <p>Avg. Validation Time</p>
          </div>
        </div>
      </div>

      <div className="agency-cards">
        {agencies.map((agency) => (
          <div key={agency.id} className="agency-card">
            <div className="agency-header">
              <div className="initial">{agency.id}</div>
              <div className="agency-info">
                <h3>{agency.name}</h3>
                <p>{agency.dept}</p>
              </div>
              <span className="role">{agency.role}</span>
            </div>

            <div className="agency-body">
              <div className="status">
                <span>Status</span>
                <span className={agency.status.toLowerCase()}>{agency.status}</span>
              </div>
              <div className="validations">
                <span>Validations (24h)</span>
                <span>{agency.validations}</span>
              </div>
              <div className="response">
                <span>Avg. Response</span>
                <span>{agency.avgResponse}</span>
              </div>
              <div className="load">
                <span>Load Capacity</span>
                <div className="progress-bar">
                  <div
                    className="progress"
                    style={{ width: `${agency.load}%` }}
                  ></div>
                </div>
                <span className="load-text">Normal</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
