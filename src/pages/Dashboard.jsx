import React from "react";
import "./Dashboard.css";

const Card = ({ title, path, onNavigate }) => {
  return (
    <div className="dashboard-card" onClick={() => onNavigate(path)}>
      <h3>{title}</h3>
    </div>
  );
};

export default function Dashboard() {
  const role = localStorage.getItem("role");

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  const handleNavigation = (path) => {
    window.location.href = path;
  };

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">Dashboard</h1>

      {/* ================= ADMIN PANEL ================= */}
      {role === "admin" && (
        <>
          <h2 className="section-title">Admin Panel</h2>

          <div className="admin-welcome">
            <h3>Welcome, Administrator</h3>
            <p>
              Manage permit approvals, inspections, and permit releases from
              this dashboard.
            </p>
          </div>

          <div className="stats-container">
            <div className="stat-box">
              <h2>12</h2>
              <span>Pending Requests</span>
            </div>
            <div className="stat-box">
              <h2>8</h2>
              <span>Approved Today</span>
            </div>
            <div className="stat-box">
              <h2>3</h2>
              <span>For Inspection</span>
            </div>
          </div>

          <div className="card-grid">
            <Card
              title="For Approval"
              path="/admin/approve-documents"
              onNavigate={handleNavigation}
            />
            <Card
              title="Release Permit"
              path="/admin/release-permit"
              onNavigate={handleNavigation}
            />
            <Card
              title="Update Citizen Inspection"
              path="/admin/update-inspection"
              onNavigate={handleNavigation}
            />
          </div>
        </>
      )}

      {/* ================= CITIZEN PANEL ================= */}
      {role === "citizen" && (
        <>
          <h2 className="section-title">Citizen Panel</h2>

          <div className="card-grid">
            <Card
              title="Request Permit"
              path="/citizen/request-permit"
              onNavigate={handleNavigation}
            />
            <Card
              title="My Permit"
              path="/citizen/my-permit"
              onNavigate={handleNavigation}
            />
            <Card
              title="Submit Requirements"
              path="/citizen/submit-requirements"
              onNavigate={handleNavigation}
            />
            <Card
              title="My Account"
              path="/citizen/my-account"
              onNavigate={handleNavigation}
            />
            <Card
              title="Inspection / Progress"
              path="/citizen/inspection-progress"
              onNavigate={handleNavigation}
            />
            <Card
              title="Approval / Release Date"
              path="/citizen/approval-release"
              onNavigate={handleNavigation}
            />
          </div>
        </>
      )}

      <button className="logout-btn" onClick={handleLogout}>
        Logout
      </button>
    </div>
  );
}
