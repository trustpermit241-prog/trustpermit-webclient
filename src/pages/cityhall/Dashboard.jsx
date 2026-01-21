import React from "react";
import "./Dashboard.css";

const Dashboard = ({ requests = [] }) => {
  const total = requests.length;
  const pending = requests.filter(r => r.status === "Pending");
  const approved = requests.filter(r => r.status === "Approved");
  const rejected = requests.filter(r => r.status === "Rejected");
  const inspections = requests.filter(r => r.type === "Inspection");

  const renderRequestList = (title, requestList) => (
    <div className="request-section">
      <h2>{title} ({requestList.length})</h2>
      {requestList.length ? (
        <ul>
          {requestList.map((r, index) => (
            <li key={index} className="request-item">
              <span className="user">{r.user}</span>
              <span className="document">submitted {r.type}</span>
              <span className={`status ${r.status.toLowerCase()}`}>{r.status}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="no-requests">No requests</p>
      )}
    </div>
  );

  return (
    <section className="dashboard-overview">
      <h1>Dashboard Overview</h1>

      {/* Bigger Horizontal Cards */}
      <div className="bigger-cards-horizontal">
        <div className="card total">Total Requests<br /><span>{total}</span></div>
        <div className="card pending">Pending<br /><span>{pending.length}</span></div>
        <div className="card approved">Approved<br /><span>{approved.length}</span></div>
        <div className="card rejected">Rejected<br /><span>{rejected.length}</span></div>
      </div>

      {/* Detailed Request Lists */}
      {renderRequestList("Pending Requests", pending)}
      {renderRequestList("Approved Requests", approved)}
      {renderRequestList("Rejected Requests", rejected)}
      {renderRequestList("Inspection Requests", inspections)}
    </section>
  );
};

export default Dashboard;
