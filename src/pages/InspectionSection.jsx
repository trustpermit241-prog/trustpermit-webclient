import React from "react";

const InspectionSection = ({
  inspections,
  inspectionsLoading,
  inspectionsError,
  fetchInspections
}) => {
  const totalInspections = inspections.length;
  const completedInspections = inspections.filter((insp) => (insp.status || "").toLowerCase() === "approved").length;
  const pendingInspections = inspections.filter((insp) => {
    const s = (insp.status || "pending").toLowerCase();
    return s !== "approved";
  }).length;
  const latestSchedule = inspections
    .map((insp) => (insp.date ? new Date(insp.date) : null))
    .filter(Boolean)
    .sort((a, b) => a - b)[0];

  return (
    <div className="card form-card-wide inspection-dashboard">
      <div className="inspection-dashboard-hero">
        <div>
          <p className="inspection-eyebrow">City Hall Scheduling Desk</p>
          <h3 className="inspection-dashboard-title">Inspection Schedule & Details</h3>
          <p className="inspection-dashboard-subtitle">
            View confirmed inspection schedules, assigned inspectors, and official remarks from city hall staff.
          </p>
        </div>
        <button className="btn inspection-dashboard-refresh" onClick={fetchInspections} disabled={inspectionsLoading}>
          {inspectionsLoading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div className="inspection-summary-grid">
        <div className="inspection-summary-card">
          <span className="inspection-summary-label">Total Records</span>
          <strong className="inspection-summary-value">{totalInspections}</strong>
        </div>
        <div className="inspection-summary-card">
          <span className="inspection-summary-label">Pending / In Progress</span>
          <strong className="inspection-summary-value">{pendingInspections}</strong>
        </div>
        <div className="inspection-summary-card">
          <span className="inspection-summary-label">Completed</span>
          <strong className="inspection-summary-value">{completedInspections}</strong>
        </div>
        <div className="inspection-summary-card">
          <span className="inspection-summary-label">Next Schedule</span>
          <strong className="inspection-summary-value inspection-summary-value-sm">
            {latestSchedule ? latestSchedule.toLocaleDateString() : "To be announced"}
          </strong>
        </div>
      </div>

      {inspectionsLoading ? (
        <div className="inspection-state-panel">
          <p>Loading inspection details...</p>
          <button className="btn" onClick={fetchInspections}>Refresh</button>
        </div>
      ) : inspectionsError ? (
        <div className="inspection-state-panel inspection-state-panel-error">
          <p>{inspectionsError}</p>
          <button className="btn" onClick={fetchInspections}>Retry</button>
        </div>
      ) : inspections.length === 0 ? (
        <div className="inspection-state-panel">
          <p>No staff schedule has been posted yet.</p>
          <button className="btn" onClick={fetchInspections}>Refresh</button>
        </div>
      ) : (
        <div className="inspection-table-panel">
          <table className="inspection-grid-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Date</th>
                <th>Time</th>
                <th>Inspector</th>
                <th>Remarks</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {inspections.map((insp, index) => (
                <tr key={index}>
                  <td>{insp.type || "General"}</td>
                  <td>{insp.date ? new Date(insp.date).toLocaleDateString() : "To be scheduled"}</td>
                  <td>{insp.date ? new Date(insp.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--"}</td>
                  <td>{insp.inspector || "--"}</td>
                  <td>{insp.remarks || "No remarks"}</td>
                  <td>
                    <span className={`inspection-status-badge ${insp.status ? `status-${insp.status.toLowerCase()}` : "status-pending"}`}>
                      {insp.status || "Pending"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="note inspection-dashboard-note">
        Schedule details are updated by city hall staff. Please monitor this page for official inspection updates.
      </p>
    </div>
  );
};

export default InspectionSection;
