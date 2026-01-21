import React, { useState } from "react";
import "./InspectionProgress.css";

export default function InspectionProgress() {
  const initialInspections = [
    { id: 1, type: "Fire Safety Inspection", date: "", time: "", status: "Pending" },
    { id: 2, type: "Sanitary Inspection", date: "", time: "", status: "Pending" },
    { id: 3, type: "Building & Electrical", date: "", time: "", status: "Pending" },
    { id: 4, type: "Locational / Zoning", date: "", time: "", status: "Pending" },
    { id: 5, type: "Environmental", date: "", time: "", status: "Pending" },
  ];

  const [inspections, setInspections] = useState(initialInspections);

  const updateDate = (id, date) => {
    setInspections((prev) =>
      prev.map((i) => (i.id === id ? { ...i, date } : i))
    );
  };

  const updateTime = (id, time) => {
    setInspections((prev) =>
      prev.map((i) => (i.id === id ? { ...i, time } : i))
    );
  };

  const submitSchedule = (id) => {
    setInspections((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, status: "Pending" } : i
      )
    );
    alert("Schedule submitted. Status is now Pending.");
  };

  const updateStatus = (id, status) => {
    setInspections((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status } : i))
    );
  };

  const statusEmoji = (status) => {
    if (status === "Approved") return "✅";
    if (status === "Rejected") return "❌";
    return "⏳";
  };

  return (
    <div className="inspection-card">
      <h3>Inspection Schedule</h3>

      <table>
        <thead>
          <tr>
            <th>Inspection Type</th>
            <th>Date</th>
            <th>Time</th>
            <th>Status</th>
            <th>Actions (Staff)</th>
          </tr>
        </thead>

        <tbody>
          {inspections.map((inspection) => (
            <tr key={inspection.id}>
              <td>{inspection.type}</td>

              <td>
                <input
                  type="date"
                  value={inspection.date}
                  onChange={(e) =>
                    updateDate(inspection.id, e.target.value)
                  }
                />
              </td>

              <td className="time-submit-cell">
                <input
                  type="time"
                  value={inspection.time}
                  onChange={(e) =>
                    updateTime(inspection.id, e.target.value)
                  }
                />
                <button
                  className="submit-btn"
                  onClick={() => submitSchedule(inspection.id)}
                  disabled={!inspection.date || !inspection.time}
                >
                  Submit
                </button>
              </td>

              <td>
                {inspection.status} {statusEmoji(inspection.status)}
              </td>

              <td>
                <button
                  className="approve-btn"
                  onClick={() =>
                    updateStatus(inspection.id, "Approved")
                  }
                >
                  Approve
                </button>

                <button
                  className="reject-btn"
                  onClick={() =>
                    updateStatus(inspection.id, "Rejected")
                  }
                >
                  Reject
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
