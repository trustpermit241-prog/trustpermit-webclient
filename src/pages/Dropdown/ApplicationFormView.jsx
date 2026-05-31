import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import "./ApplicationFormView.css";

const API_BASE_URL = "https://trustpermit-backend.onrender.com";

export default function ApplicationFormView() {
  const { applicationId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchApplication = async () => {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");

      if (!token) {
        setError("You must be logged in to view this application.");
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/applications/${applicationId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 10000,
          }
        );

        console.log("APPLICATION RESPONSE:", res.data);

        const application =
          res.data?.application ||
          res.data?.data ||
          res.data?.result ||
          res.data;

        setData(application);
      } catch (err) {
        console.error(err);

        if (err.response) {
          setError(
            `Error ${err.response.status}: ${
              err.response.data?.message || "Failed to fetch application."
            }`
          );
        } else if (err.request) {
          setError("No response from server. Check backend or network.");
        } else {
          setError(`Error: ${err.message}`);
        }
      } finally {
        setLoading(false);
      }
    };

    if (applicationId) fetchApplication();
  }, [applicationId]);

  const getValue = (...values) => {
    for (const value of values) {
      if (value !== null && value !== undefined && value !== "") {
        return value;
      }
    }
    return "N/A";
  };

  if (loading) return <div className="loading">Loading Application Form...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!data) return <div className="error-message">No application data found.</div>;

  return (
    <div className="view-section">
      <h4>Application Form</h4>

      <div className="details-grid">
        <div className="detail-row">
          <div className="detail-key">Business Name</div>
          <div className="detail-value">
            {getValue(data.businessName, data.businessDetails?.businessName)}
          </div>
        </div>

        <div className="detail-row">
          <div className="detail-key">Application Type</div>
          <div className="detail-value">{getValue(data.applicationType)}</div>
        </div>

        <div className="detail-row">
          <div className="detail-key">Project Type</div>
          <div className="detail-value">{getValue(data.projectType)}</div>
        </div>

        <div className="detail-row">
          <div className="detail-key">Zone Type</div>
          <div className="detail-value">{getValue(data.zoneType)}</div>
        </div>

        <div className="detail-row">
          <div className="detail-key">Applicant Name</div>
          <div className="detail-value">
            {getValue(
              `${data.applicant?.firstName || ""} ${
                data.applicant?.middleName || ""
              } ${data.applicant?.lastName || ""} ${
                data.applicant?.suffix || ""
              }`.trim(),
              data.fullName,
              data.name
            )}
          </div>
        </div>

        <div className="detail-row">
          <div className="detail-key">Gender</div>
          <div className="detail-value">{getValue(data.applicant?.gender)}</div>
        </div>

        <div className="detail-row">
          <div className="detail-key">Civil Status</div>
          <div className="detail-value">{getValue(data.applicant?.civilStatus)}</div>
        </div>

        <div className="detail-row">
          <div className="detail-key">Nationality</div>
          <div className="detail-value">{getValue(data.applicant?.nationality)}</div>
        </div>

        <div className="detail-row">
          <div className="detail-key">Email</div>
          <div className="detail-value">
            {getValue(data.applicant?.email, data.email, data.userId?.email)}
          </div>
        </div>

        <div className="detail-row">
          <div className="detail-key">Contact Number</div>
          <div className="detail-value">
            {getValue(data.applicant?.contactNumber, data.contactNumber)}
          </div>
        </div>

        <div className="detail-row">
          <div className="detail-key">Province</div>
          <div className="detail-value">{getValue(data.address?.province)}</div>
        </div>

        <div className="detail-row">
          <div className="detail-key">City</div>
          <div className="detail-value">{getValue(data.address?.city)}</div>
        </div>

        <div className="detail-row">
          <div className="detail-key">Barangay</div>
          <div className="detail-value">{getValue(data.address?.barangay)}</div>
        </div>

        <div className="detail-row">
          <div className="detail-key">Subdivision</div>
          <div className="detail-value">{getValue(data.address?.subdivision)}</div>
        </div>

        <div className="detail-row">
          <div className="detail-key">Street</div>
          <div className="detail-value">{getValue(data.address?.street)}</div>
        </div>

        <div className="detail-row">
          <div className="detail-key">Building</div>
          <div className="detail-value">{getValue(data.address?.building)}</div>
        </div>

        <div className="detail-row">
          <div className="detail-key">House No.</div>
          <div className="detail-value">{getValue(data.address?.houseNo)}</div>
        </div>

        <div className="detail-row">
          <div className="detail-key">Status</div>
          <div className="detail-value">{getValue(data.status)}</div>
        </div>

        <div className="detail-row">
          <div className="detail-key">Date Submitted</div>
          <div className="detail-value">
            {data.createdAt ? new Date(data.createdAt).toLocaleString() : "N/A"}
          </div>
        </div>
      </div>
    </div>
  );
}