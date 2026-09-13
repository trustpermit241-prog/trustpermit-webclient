import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import html2pdf from "html2pdf.js/dist/html2pdf.js";
import { buildCertificateData } from "./certificates/CertificateSharedData";
import FireSafetyCertificate from "./certificates/FireSafetyCertificate";
import EnvironmentalPermit from "./certificates/EnvironmentalPermit";
import ZoningClearance from "./certificates/ZoningClearance";
import VeterinaryCertificate from "./certificates/VeterinaryCertificate";
import SanitaryCertificate from "./certificates/SanitaryCertificate";
import "./InspectionReport.css";

const API_BASE_URL = typeof window !== "undefined" && ["localhost", "127.0.0.1"].includes(window.location.hostname)
  ? "http://localhost:5000"
  : process.env.REACT_APP_API_URL || "https://trustpermit-backend.onrender.com";
const FRONTEND_URL = "https://trustpermit-webclient.vercel.app";

const CERTIFICATE_COMPONENTS = {
  fire: FireSafetyCertificate,
  environmental: EnvironmentalPermit,
  locational: ZoningClearance,
  veterinary: VeterinaryCertificate,
  sanitary: SanitaryCertificate,
};

export default function InspectionReport() {
  const { id } = useParams();
  const [inspection, setInspection] = useState(null);
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const certificateRef = useRef(null);

  useEffect(() => {
    const fetchInspection = async () => {
      let cachedInspection = null;
      const cached = localStorage.getItem(`inspectionReport_${id}`) || sessionStorage.getItem(`inspectionReport_${id}`);

      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          cachedInspection = parsed.inspection || parsed;
          setInspection(cachedInspection);
          setApplication(parsed.application || null);
        } catch (error) {
          console.error("Failed to parse cached inspection report:", error);
        }
      }

      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`${API_BASE_URL}/api/inspection/${id}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        const nextInspection = response.data?.inspection || response.data;
        const nextApplication = response.data?.application || null;
        setInspection(nextInspection);
        setApplication(nextApplication);
        const cacheData = { inspection: nextInspection, application: nextApplication };
        localStorage.setItem(`inspectionReport_${id}`, JSON.stringify(cacheData));
        sessionStorage.setItem(`inspectionReport_${id}`, JSON.stringify(cacheData));
      } catch (error) {
        console.error("Failed to load inspection report:", error);
        if (!cachedInspection) setInspection(null);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchInspection();
  }, [id]);

  if (loading) return <div className="inspection-report-loading">Loading inspection report...</div>;
  if (!inspection) return <div className="inspection-report-loading">Inspection report not found.</div>;

  const applicationId = application?._id || application?.id || inspection.applicationId;
  const data = buildCertificateData({
    inspection,
    application,
    id,
    verificationUrl: applicationId ? `${FRONTEND_URL}/verify/${applicationId}` : `${FRONTEND_URL}/inspection-certificate/${id}`,
  });
  const Certificate = CERTIFICATE_COMPONENTS[data.profile.key] || FireSafetyCertificate;

  const downloadCertificate = async () => {
    if (!certificateRef.current || downloading) return;
    setDownloading(true);

    try {
      const clone = certificateRef.current.cloneNode(true);
      clone.querySelector(".certificate-actions")?.remove();
      await html2pdf().set({
        margin: 8,
        filename: `${data.profile.fileLabel}_${data.certificateNumber}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: "#fff" },
        jsPDF: { orientation: "portrait", unit: "mm", format: "a4" },
      }).from(clone).save();
    } catch (error) {
      console.error("Failed to download inspection certificate:", error);
      window.alert("Unable to download the certificate. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  return <Certificate data={data} certificateRef={certificateRef} downloading={downloading} onDownload={downloadCertificate} onPrint={() => window.print()} />;
}
