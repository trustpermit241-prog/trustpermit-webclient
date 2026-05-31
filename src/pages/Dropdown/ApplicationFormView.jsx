import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { coy } from "react-syntax-highlighter/dist/esm/styles/prism";
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
        const res = await axios.get(`${API_BASE_URL}/api/applications/${applicationId}`, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000,
        });
        setData(res.data);
      } catch (err) {
        console.error(err);
        if (err.response) setError(`Error ${err.response.status}: ${err.response.data?.message}`);
        else if (err.request) setError("No response from server. Check backend or network.");
        else setError(`Error: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    if (applicationId) fetchApplication();
  }, [applicationId]);

  if (loading) return <div className="loading">Loading Application Form...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!data) return <div className="error">No application data found.</div>;

  return (
    <div className="view-section">
      <h4>Application Form</h4>
      <SyntaxHighlighter language="json" style={coy} wrapLongLines={true}>
        {JSON.stringify(data, null, 2)}
      </SyntaxHighlighter>
    </div>
  );
}