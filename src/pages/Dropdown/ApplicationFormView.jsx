import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import "./ApplicationFormView.css";

const getApiBaseUrl = () => {
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return "http://localhost:5000";
    }
  }

  return process.env.REACT_APP_API_URL || "https://trustpermit-backend.onrender.com";
};

const API_BASE_URL = getApiBaseUrl();

export default function ApplicationFormView({ applicationId: propApplicationId }) {
  const { applicationId: routeApplicationId } = useParams();
  const applicationId = propApplicationId || routeApplicationId;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const safeText = (value) => {
    if (value === null || value === undefined || value === "") return "N/A";

    if (typeof value === "object") {
      return value.fullName || value.email || value.name || value._id || value.id || "N/A";
    }

    return String(value);
  };

  const getValue = (...values) => {
    for (const value of values) {
      if (value !== null && value !== undefined && value !== "") {
        return safeText(value);
      }
    }
    return "N/A";
  };

  const formatDate = (value) => {
    if (!value) return "N/A";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "N/A";

    return date.toLocaleString();
  };

  useEffect(() => {
    const fetchApplication = async () => {
      setLoading(true);
      setError("");

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
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        console.log("APPLICATION FORM VIEW RESPONSE:", res.data);

        const app =
          res.data?.application ||
          res.data?.data ||
          res.data?.result ||
          res.data;

        setData(app);
      } catch (err) {
        console.error(err);
        setError(
          err.response?.data?.message ||
            "Failed to fetch application form."
        );
      } finally {
        setLoading(false);
      }
    };

    if (applicationId) fetchApplication();
  }, [applicationId]);

  if (loading) {
    return <div className="application-view-loading">Loading application...</div>;
  }

  if (error) {
    return <div className="application-view-error">{error}</div>;
  }

  if (!data) {
    return <div className="application-view-error">No application data found.</div>;
  }

  return (
    <div className="application-form-view-page">
      <div className="application-form-card">
        <div className="application-form-header">
          <h1>Application Form</h1>
          <p>Complete submitted application details</p>
        </div>

        <div className="application-section">
          <h2>Application Information</h2>

          <div className="form-grid">
            <div className="form-field">
              <label>Application ID</label>
              <div>{getValue(data._id)}</div>
            </div>

            <div className="form-field">
              <label>Status</label>
              <div>{getValue(data.status)}</div>
            </div>

            <div className="form-field">
              <label>Application Type</label>
              <div>{getValue(data.applicationType)}</div>
            </div>

            <div className="form-field">
              <label>Created</label>
              <div>{formatDate(data.createdAt)}</div>
            </div>
          </div>
        </div>

        <div className="application-section">
          <h2>Taxpayer Information</h2>

          <div className="form-grid">
            <div className="form-field">
              <label>Registrant Name</label>
              <div>{getValue(data.taxpayer?.registrantName)}</div>
            </div>

            <div className="form-field">
              <label>Registrant Position</label>
              <div>{getValue(data.taxpayer?.registrantPosition)}</div>
            </div>

            <div className="form-field">
              <label>Ownership Type</label>
              <div>{getValue(data.taxpayer?.ownershipType, data.businessInfo?.ownershipType)}</div>
            </div>
          </div>
        </div>

        <div className="application-section">
          <h2>Applicant Information</h2>

          <div className="form-grid">
            <div className="form-field">
              <label>First Name</label>
              <div>{getValue(data.applicant?.firstName)}</div>
            </div>

            <div className="form-field">
              <label>Middle Name</label>
              <div>{getValue(data.applicant?.middleName)}</div>
            </div>

            <div className="form-field">
              <label>Last Name</label>
              <div>{getValue(data.applicant?.lastName)}</div>
            </div>

            <div className="form-field">
              <label>Suffix</label>
              <div>{getValue(data.applicant?.suffix, data.applicant?.suffixName)}</div>
            </div>

            <div className="form-field">
              <label>Birth Date</label>
              <div>{getValue(data.personalInfo?.birthDate, data.applicant?.birthDate)}</div>
            </div>

            <div className="form-field">
              <label>Gender</label>
              <div>{getValue(data.personalInfo?.gender, data.applicant?.gender)}</div>
            </div>

            <div className="form-field">
              <label>Civil Status</label>
              <div>{getValue(data.personalInfo?.civilStatus, data.applicant?.civilStatus)}</div>
            </div>

            <div className="form-field">
              <label>Nationality</label>
              <div>{getValue(data.personalInfo?.nationality, data.applicant?.nationality)}</div>
            </div>
          </div>
        </div>

        <div className="application-section">
          <h2>Contact Information</h2>

          <div className="form-grid">
            <div className="form-field">
              <label>Telephone</label>
              <div>{getValue(data.contact?.telephone)}</div>
            </div>

            <div className="form-field">
              <label>Mobile Number</label>
              <div>{getValue(data.contact?.mobile, data.contact?.contactNumber)}</div>
            </div>

            <div className="form-field">
              <label>Email</label>
              <div>{getValue(data.contact?.email, data.email, data.userId?.email)}</div>
            </div>

            <div className="form-field">
              <label>TIN</label>
              <div>{getValue(data.contact?.tin)}</div>
            </div>
          </div>
        </div>

        <div className="application-section">
          <h2>Address Information</h2>

          <div className="form-grid">
            <div className="form-field">
              <label>Province</label>
              <div>{getValue(data.address?.province)}</div>
            </div>

            <div className="form-field">
              <label>City</label>
              <div>{getValue(data.address?.city)}</div>
            </div>

            <div className="form-field">
              <label>Barangay</label>
              <div>{getValue(data.address?.barangay)}</div>
            </div>

            <div className="form-field">
              <label>Subdivision</label>
              <div>{getValue(data.address?.subdivision)}</div>
            </div>

            <div className="form-field">
              <label>Street</label>
              <div>{getValue(data.address?.street)}</div>
            </div>

            <div className="form-field">
              <label>Building</label>
              <div>{getValue(data.address?.building)}</div>
            </div>

            <div className="form-field">
              <label>House No.</label>
              <div>{getValue(data.address?.houseNo)}</div>
            </div>

            <div className="form-field">
              <label>Block</label>
              <div>{getValue(data.address?.block)}</div>
            </div>

            <div className="form-field">
              <label>Lot</label>
              <div>{getValue(data.address?.lot)}</div>
            </div>

            <div className="form-field">
              <label>Landmark</label>
              <div>{getValue(data.address?.landmark)}</div>
            </div>
          </div>
        </div>

        <div className="application-section">
          <h2>Business Information</h2>

          <div className="form-grid">
            <div className="form-field">
              <label>Business Name</label>
              <div>{getValue(data.businessName, data.businessInfo?.businessName, data.businessDetails?.businessName)}</div>
            </div>

            <div className="form-field">
              <label>Project Type</label>
              <div>{getValue(data.projectType, data.businessInfo?.projectType, data.businessDetails?.projectType)}</div>
            </div>

            <div className="form-field">
              <label>Zone Type</label>
              <div>{getValue(data.zoneType, data.businessInfo?.zoneType, data.businessDetails?.zoneType)}</div>
            </div>

            <div className="form-field">
              <label>Line of Business</label>
              <div>{getValue(data.businessInfo?.lineOfBusiness, data.businessDetails?.lineOfBusiness)}</div>
            </div>

            <div className="form-field">
              <label>Business Area</label>
              <div>{getValue(data.businessInfo?.area, data.businessInfo?.businessArea, data.businessDetails?.businessArea)} m�</div>
            </div>

            <div className="form-field">
              <label>Male Personnel</label>
              <div>{getValue(data.businessInfo?.malePersonnel, data.businessDetails?.malePersonnel, 0)}</div>
            </div>

            <div className="form-field">
              <label>Female Personnel</label>
              <div>{getValue(data.businessInfo?.femalePersonnel, data.businessDetails?.femalePersonnel, 0)}</div>
            </div>

            <div className="form-field">
              <label>Total Personnel</label>
              <div>{getValue(data.businessInfo?.totalPersonnel, data.businessDetails?.totalPersonnel, 0)}</div>
            </div>
          </div>
        </div>

        <div className="application-section">
          <h2>Signature</h2>

          {data.signature?.startsWith("data:image") ? (
            <img src={data.signature} alt="Applicant Signature" className="signature-preview" />
          ) : (
            <div className="empty-signature">No signature available</div>
          )}
        </div>

        
      </div>
    </div>
  );
}
