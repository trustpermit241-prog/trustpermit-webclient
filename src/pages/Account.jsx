import React, { useState, useRef, useEffect } from "react";
import InspectionSection from "./InspectionSection";
import ProfileSection from "./ProfileSection";
import axios from "axios";
import emailjs from "@emailjs/browser";
import PermitProgressRealtime from "./PermitProgressRealtime";
import "./Account.css";

const API_BASE_URL = "https://trustpermit-backend.onrender.com";

// Helper for status badge color
const getStatusBadgeClass = (status) => {
  switch ((status || "").toLowerCase()) {
    case "approved":
      return "dashboard-status-badge approved";
    case "pending":
      return "dashboard-status-badge pending";
    case "rejected":
      return "dashboard-status-badge rejected";
    default:
      return "dashboard-status-badge";
  }
};
// Get user info from localStorage
const userRole = (localStorage.getItem("role") || "").toLowerCase();
const userName = localStorage.getItem("name") || "";
const userEmail = localStorage.getItem("email") || "";


const getInitialActiveMenu = (initialMenu) => {
  if (initialMenu) return initialMenu;

  const params = new URLSearchParams(window.location.search);
  const menuParam = params.get("menu");

  if (menuParam === "apply-permit") return "Apply Permit";
  if (menuParam) return menuParam;

  try {
    return localStorage.getItem("accountActiveMenu") || "Account Details";
  } catch (e) {
    return "Account Details";
  }
};

const Account = ({ initialMenu }) => {
  // ================= REAL-TIME APPLICATIONS =================
  const [applications, setApplications] = useState([]);
  const [applicationsLoading, setApplicationsLoading] = useState(true);
  const [applicationsError, setApplicationsError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const token = localStorage.getItem("token");

    if (!token) {
      setApplications([]);
      setApplicationsLoading(false);
      return;
    }

    const fetchApplications = async () => {
      setApplicationsLoading(true);
      setApplicationsError(null);

      try {
        const res = await fetch("https://trustpermit-backend.onrender.com/api/applications/my", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Failed to fetch applications");

        const data = await res.json();
        if (isMounted) setApplications(Array.isArray(data) ? data : []);
      } catch (err) {
        if (isMounted) {
          setApplicationsError("Failed to fetch applications");
          setApplications([]);
        }
      } finally {
        if (isMounted) setApplicationsLoading(false);
      }
    };

    // Fetch only once when the Account page opens.
    // Removed the 5-second interval because it makes the Account tab look like it is loading by itself.
    fetchApplications();

    return () => {
      isMounted = false;
    };
  }, []);

  const [activeMenu, setActiveMenuState] = useState(() => getInitialActiveMenu(initialMenu));
  const [showNotifications, setShowNotifications] = useState(false);

  const setActiveMenu = (menu) => {
    setActiveMenuState(menu);

    try {
      localStorage.setItem("accountActiveMenu", menu);
    } catch (e) {
      // Ignore localStorage errors.
    }
  };

  const submittedApplicationsCount = applications.length;
  const applicationsInReviewCount = applications.filter(
    (app) => (app.status || "").toLowerCase() === "pending"
  ).length;
  const approvedPermitsCount = applications.filter(
    (app) => (app.status || "").toLowerCase() === "approved"
  ).length;
  const rejectedApplicationsCount = applications.filter(
    (app) => (app.status || "").toLowerCase() === "rejected"
  ).length;

  // ================= ACCOUNT / APPLICATION STATES =================
  const [businessName, setBusinessName] = useState("");
  const [applicationType, setApplicationType] = useState("New Application");
  const [projectType, setProjectType] = useState("Residential");
  const [zoneType, setZoneType] = useState("Residential Zone");

  // Applicant Name
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [suffixName, setSuffixName] = useState("");

  // Personal Info
  const [gender, setGender] = useState("");
  const [civilStatus, setCivilStatus] = useState("");
  const [nationality, setNationality] = useState("");

  // Contact
  const [contactNumber, setContactNumber] = useState("");
  const [applicantEmail, setApplicantEmail] = useState("");
  // Address
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [barangay, setBarangay] = useState("");
  const [subdivision, setSubdivision] = useState("");
  const [street, setStreet] = useState("");
  const [building, setBuilding] = useState("");
  const [houseNo, setHouseNo] = useState("");
  const [block, setBlock] = useState("");
  const [lot, setLot] = useState("");
  const [landmark, setLandmark] = useState("");

  // Business / Other Information
  const [businessArea, setBusinessArea] = useState("");
  const [malePersonnel, setMalePersonnel] = useState(0);
  const [femalePersonnel, setFemalePersonnel] = useState(0);
  const totalPersonnel = Number(malePersonnel) + Number(femalePersonnel);

  const [ownershipType, setOwnershipType] = useState("");
  const [lineOfBusiness, setLineOfBusiness] = useState("");

  // Checklist
  const [isNewChecked, setIsNewChecked] = useState(true);
  const [isRenewalChecked, setIsRenewalChecked] = useState(false);

  // File Uploads
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [applicationId, setApplicationId] = useState(null);
  const [uploadingDocs, setUploadingDocs] = useState(false);
  const [docsUploaded, setDocsUploaded] = useState(false);

  // Profile image
  const [profileImage, setProfileImage] = useState(() => {
    try {
      return localStorage.getItem("profileImage") || "";
    } catch (e) {
      return "";
    }
  });

  // Edit profile toggle + password fields
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [appFormStep, setAppFormStep] = useState(1);

  // Apply Permit wizard
  const [permitStep, setPermitStep] = useState(1);
  const [permitLicenseTab, setPermitLicenseTab] = useState("new");
  const [registrantName, setRegistrantName] = useState(userName);
  const [registrantPosition, setRegistrantPosition] = useState("Owner");
  const [isIndividual, setIsIndividual] = useState(true);
  const [birthDate, setBirthDate] = useState("");
  const [telephone, setTelephone] = useState("");
  const [faxNo, setFaxNo] = useState("");
  const [tin, setTin] = useState("");
  const [outsideAntipolo, setOutsideAntipolo] = useState(false);
  const [showRequirements, setShowRequirements] = useState(true);

  // Payment
  const [paymentMethod, setPaymentMethod] = useState("");
  const [bank, setBank] = useState("");
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentReference, setPaymentReference] = useState("");
  const [gcashName, setGcashName] = useState(userName || "");
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [cardHolderName, setCardHolderName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [billingEmail, setBillingEmail] = useState(userEmail || "");
  const [billingCountry, setBillingCountry] = useState("Philippines");
  const [billingOpen, setBillingOpen] = useState(true);
  const [paymentMethodOpen, setPaymentMethodOpen] = useState(true);

  // ================= INSPECTION =================
  const [inspections, setInspections] = useState([]);
  const [inspectionsLoading, setInspectionsLoading] = useState(false);
  const [inspectionsError, setInspectionsError] = useState(null);

  // ================= INSPECTION ACTIONS =================
  const fetchInspections = async () => {
    setInspectionsLoading(true);
    setInspectionsError(null);

    const token = localStorage.getItem("token");
    if (!token) {
      setInspections([]);
      setInspectionsError("Not logged in. Please sign in to view your inspections.");
      setInspectionsLoading(false);
      return;
    }

    try {
      const res = await fetch(`https://trustpermit-backend.onrender.com/api/inspection/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const message = errData.message || errData.msg || "Failed to fetch inspections.";
        throw new Error(message);
      }

      const data = await res.json();
      if (Array.isArray(data)) {
        setInspections(data);
      } else {
        setInspections([]);
        setInspectionsError("No inspection data returned from server.");
      }
    } catch (err) {
      console.error("Fetch inspections error:", err);
      setInspections([]);
      setInspectionsError(err.message || "Failed to fetch inspections.");
    } finally {
      setInspectionsLoading(false);
    }
  };

  const clearRequestedInspections = async () => {
    const ok = window.confirm("Clear all your requested inspections?");
    if (!ok) return;

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Not logged in. Please sign in first.");
      return;
    }

    setInspectionsLoading(true);
    setInspectionsError(null);

    try {
      const res = await fetch("https://trustpermit-backend.onrender.com/api/inspection/my", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to clear requested inspections.");
      }

      setInspections([]);
      alert("Requested inspections cleared.");
    } catch (err) {
      console.error("Clear inspections error:", err);
      alert(err.message || "Failed to clear requested inspections.");
    } finally {
      setInspectionsLoading(false);
    }
  };

  useEffect(() => {
    // Fetch only once when the Account page opens.
    // Removed the 5-second interval to stop the page from reloading/loading by itself.
    fetchInspections();
  }, []);

  useEffect(() => {
    if (activeMenu === "Application Forms") {
      setActiveMenu("Apply Permit");
    }
  }, [activeMenu]);

  const notificationItems = [
    ...inspections.map((inspection) => ({
      type: "inspection",
      message: `Inspection scheduled for ${inspection.date ? new Date(inspection.date).toLocaleDateString() : "Unknown date"}${inspection.type ? ` (${inspection.type})` : ""}`,
      timestamp: inspection.updatedAt || inspection.createdAt || inspection.date || "",
    })),
    ...applications.map((app) => ({
      type: "application",
      status: app.status || "Pending",
      message: `${app.applicationType || "Application"} ${app.status || "updated"} for Permit #${app.permitId || app._id || app.id}`,
      timestamp: app.updatedAt || app.createdAt || "",
    })),
  ]
    .filter((item) => item.timestamp)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 5);

  const getNotificationIconClass = (note) => {
    if (note.type === "inspection") return "inspection";
    const status = String(note.status || note.message || "").toLowerCase();
    if (status.includes("approved")) return "approved";
    if (status.includes("rejected")) return "rejected";
    return "pending";
  };

  // Signature
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const startDrawing = (e) => {
    const ctx = canvasRef.current.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const ctx = canvasRef.current.getContext("2d");
    ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    if (!canvasRef.current) return;

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  const [submittingApp, setSubmittingApp] = useState(false);

  const [missingFields, setMissingFields] = useState([]);

  // Step 1: Submit application form (no documents)
  const submitApplication = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please log in to submit your application.");
      return;
    }

    // Basic validation: highlight any missing required fields
    const requiredFields = [
      { key: "businessName", label: "Business Name", value: businessName },
      { key: "firstName", label: "First Name", value: firstName },
      { key: "lastName", label: "Last Name", value: lastName },
      { key: "contactNumber", label: "Contact Number", value: contactNumber },
      { key: "applicantEmail", label: "Email", value: applicantEmail },
    ];

    const missing = requiredFields
      .filter((field) => !field.value || String(field.value).trim() === "")
      .map((field) => field.key);

    if (missing.length > 0) {
      setMissingFields(missing);
      const missingLabels = requiredFields
        .filter((field) => missing.includes(field.key))
        .map((field) => field.label);
      alert(`Please fill out the required fields before submitting:\n- ${missingLabels.join("\n- ")}`);
      return;
    }

    setMissingFields([]);
    setSubmittingApp(true);

    const signatureData = canvasRef.current?.toDataURL?.();

    const payload = {
      businessName,
      applicationType,
      projectType,
      zoneType,
      firstName,
      middleName,
      lastName,
      suffixName,
      gender,
      civilStatus,
      nationality,
      contactNumber,
      email: applicantEmail,
      province,
      city,
      barangay,
      subdivision,
      street,
      building,
      houseNo,
      block,
      lot,
      landmark,
      businessArea,
      malePersonnel,
      femalePersonnel,
      ownershipType,
      lineOfBusiness,
      signature: signatureData,
    };

    try {
      const res = await fetch("https://trustpermit-backend.onrender.com/api/applications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to submit application.");
      }

      const data = await res.json();
      setApplicationId(data.application._id || data.application.id);
      alert("Application submitted! Please upload your required documents.");
      setDocsUploaded(false);
      setPermitStep(5);
    } catch (err) {
      console.error("Submit application error:", err);
      alert(err.message || "Failed to submit application.");
    } finally {
      setSubmittingApp(false);
    }
  };

  // Step 2: Upload documents after application is created
  const uploadDocuments = async () => {
    if (!applicationId) {
      alert("No application ID. Please submit the application form first.");
      return;
    }

    const selectedFiles = Object.values(uploadedFiles).filter(Boolean);

    if (selectedFiles.length === 0) {
      alert("Please upload at least one document.");
      return;
    }

    setUploadingDocs(true);

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        alert("Please log in again before uploading documents.");
        setUploadingDocs(false);
        return;
      }

      const formData = new FormData();

      formData.append("applicationId", applicationId);

      Object.entries(uploadedFiles).forEach(([docName, file]) => {
        if (file) {
          // Backend multer expects the file field name to be "documents"
          formData.append("documents", file);

          // Backend uses this to match each uploaded file to its requirement name
          formData.append("documentNames", docName);
        }
      });

      const res = await fetch("https://trustpermit-backend.onrender.com/api/applications/upload-documents", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        console.error("Upload backend error:", data);
        throw new Error(data.message || data.error || "Failed to upload documents");
      }

      console.log("Upload success:", data);

      setDocsUploaded(true);
      alert("Documents uploaded successfully! Your application is now ready for staff review.");

      // Optionally clear form fields
      setBusinessName("");
      setApplicationType("New Application");
      setProjectType("Residential");
      setZoneType("Residential Zone");
      setFirstName("");
      setMiddleName("");
      setLastName("");
      setSuffixName("");
      setGender("");
      setCivilStatus("");
      setNationality("");
      setContactNumber("");
      setApplicantEmail("");
      setProvince("");
      setCity("");
      setBarangay("");
      setSubdivision("");
      setStreet("");
      setBuilding("");
      setHouseNo("");
      setBlock("");
      setLot("");
      setLandmark("");
      setBusinessArea("");
      setMalePersonnel(0);
      setFemalePersonnel(0);
      setOwnershipType("");
      setLineOfBusiness("");
      setUploadedFiles({});
      clearSignature();
      setApplicationId(null);
      setPermitStep(1);
    } catch (err) {
      console.error("Upload documents error:", err);
      alert(err.message || "Failed to upload documents");
    } finally {
      setUploadingDocs(false);
    }
  };

  const handleFileUpload = (docName, files) => {
    setUploadedFiles((prev) => ({
      ...prev,
      [docName]: files[0] || null,
    }));
  };

  // ================= REQUIRED DOCUMENTS =================
  const getRequiredDocuments = () => {
    if (applicationType === "New Application") {
      let docs = [
        "Locational Clearance",
        "Barangay Clearance",
        "Fire Safety Evaluation Certificate",
        "Building Permit",
        "Wiring Permit",
      ];

      if (projectType === "Commercial" && zoneType === "Residential Zone") {
        docs.unshift("Local Zoning Board Resolution");
      }

      return docs;
    }

    return [
      "Business Permit Renewal Application Form",
      "Previous Year’s Business / Mayor’s Permit",
      "Updated Barangay Clearance",
      "Community Tax Certificate (CTC)",
      "Fire Safety Inspection Certificate",
      "Zoning / Locational Clearance",
      "Payment of Renewal Fees",
    ];
  };

  // ================= PROCESS GUIDE =================
  const getProcessGuide = () => {
    if (projectType === "Residential") {
      return `1. Submit Application Form & Requirements
2. Assessment of Fees
3. Payment of Fees
4. Issuance of Permit`;
    }
    return `1. Submit Application Form & Requirements
2. Zoning & Fire Safety Inspection
3. Assessment of Fees
4. Payment of Fees
5. Issuance of Permit`;
  };

  // helper actions
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("name");
    localStorage.removeItem("email");
    window.location.reload();
  };

  const saveDraft = () => {
    console.log("Draft saved (stub)");
    alert("Draft saved locally.");
  };

  const viewCompany = (name) => {
    alert(`Viewing details for ${name}`);
  };

  const downloadReceipt = (details) => {
    try {
      const reference = details.reference || `TP-${Date.now()}`;
      const date = details.timestamp ? new Date(details.timestamp).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : new Date().toLocaleDateString();
      const clientName = localStorage.getItem("name") || "__________________________";
      const businessName = details.businessName || "_______________________";
      const address = details.address || "___________________________";
      const contact = localStorage.getItem("contactNumber") || "_________________________";
      const method = details.method || "";
      const bank = details.bank || "";

      const html = `
        <!doctype html>
        <html>
        <head>
          <meta charset="utf-8" />
          <title>TRUSTPERMIT SERVICES - Official Receipt</title>
          <style>
            body { font-family: Arial, Helvetica, sans-serif; padding: 32px; color: #22223b; background: #f8f9fa; }
            .receipt { max-width: 800px; margin: 0 auto; background: #fff; border: 1px solid #E5E7EB; border-radius: 12px; box-shadow: 0 2px 8px #e5e7eb; padding: 32px; }
            h1 { color: #4F46E5; font-size: 2rem; margin-bottom: 0; }
            h2 { color: #22223b; font-size: 1.2rem; margin-top: 0; }
            .section { margin: 24px 0; }
            .label { font-weight: bold; }
            .breakdown-table { width: 100%; border-collapse: collapse; margin-top: 12px; }
            .breakdown-table th, .breakdown-table td { border: 1px solid #E5E7EB; padding: 8px 12px; text-align: left; }
            .breakdown-table th { background: #f3f4f6; }
            .summary { font-size: 1.1rem; margin-top: 12px; }
            .summary strong { font-size: 1.2rem; }
            .payment-methods { margin: 12px 0; }
            .notes { font-size: 0.98rem; color: #555; margin-top: 12px; }
            .footer { margin-top: 32px; text-align: center; color: #4F46E5; font-weight: bold; font-size: 1.1rem; }
            .divider { border-top: 1px solid #E5E7EB; margin: 18px 0; }
          </style>
        </head>
        <body>
          <div class="receipt">
            <h1>TRUSTPERMIT SERVICES</h1>
            <h2>Permit Processing & Documentation Assistance</h2>
            <div class="divider"></div>
            <div class="section">
              <span class="label">Receipt No.:</span> TP-2026-0001<br>
              <span class="label">Date Issued:</span> ${date}
            </div>
            <div class="section">
              <span class="label">Client Name:</span> ${clientName}<br>
              <span class="label">Business Name:</span> ${businessName}<br>
              <span class="label">Address:</span> ${address}<br>
              <span class="label">Contact No.:</span> ${contact}
            </div>
            <div class="divider"></div>
            <div class="section">
              <h3>📋 PERMIT PROCESS BREAKDOWN</h3>
              <table class="breakdown-table">
                <tr><th>Step</th><th>Process Description</th><th style="text-align:right">Fee (PHP)</th></tr>
                <tr><td>1</td><td>Barangay Clearance</td><td style="text-align:right">₱500.00</td></tr>
                <tr><td>2</td><td>DTI / SEC Registration Assistance</td><td style="text-align:right">₱1,500.00</td></tr>
                <tr><td>3</td><td>Mayor’s Permit Processing</td><td style="text-align:right">₱2,500.00</td></tr>
                <tr><td>4</td><td>BIR Registration (TIN & Books)</td><td style="text-align:right">₱2,000.00</td></tr>
                <tr><td>5</td><td>Sanitary Permit</td><td style="text-align:right">₱800.00</td></tr>
                <tr><td>6</td><td>Fire Safety Inspection Certificate (FSIC)</td><td style="text-align:right">₱1,200.00</td></tr>
                <tr><td>7</td><td>Environmental Clearance (if applicable)</td><td style="text-align:right">₱1,000.00</td></tr>
                <tr><td>8</td><td>Documentation & Processing Fee</td><td style="text-align:right">₱2,000.00</td></tr>
              </table>
            </div>
            <div class="divider"></div>
            <div class="section summary">
              <div><strong>Subtotal:</strong> ₱11,500.00</div>
              <div><strong>Service Charge:</strong> ₱500.00</div>
              <div><strong>TOTAL AMOUNT:</strong> <span style="font-size:1.3rem; color:#16a34a;">₱12,000.00</span></div>
            </div>
            <div class="divider"></div>
            <div class="section payment-methods">
              <h3>💳 PAYMENT METHOD</h3>
              <div>☐ GCash</div>
              <div>☐ Bank Transfer</div>
              <div style="margin-top:8px;"><span class="label">Reference No.:</span> ${reference}</div>
            </div>
            <div class="divider"></div>
            <div class="section notes">
              <h3>📝 NOTES</h3>
              <ul>
                <li>Processing time: 5–10 working days</li>
                <li>Fees may vary depending on business type and location</li>
                <li>Client must provide complete requirements</li>
              </ul>
            </div>
            <div class="divider"></div>
            <div class="section">
              <span class="label">Processed by:</span> _________________________
            </div>
            <div class="footer">
              Thank you for choosing TRUSTPERMIT!<br>
              Your trusted partner in fast and reliable permit processing.
            </div>
          </div>
        </body>
        </html>
      `;

      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      const a = document.createElement("a");
      a.href = url;
      a.download = `${reference}.html`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    }
  };

  const deletePayment = (reference) => {
    try {
      const list = JSON.parse(localStorage.getItem("paymentHistory") || "[]");
      const filtered = list.filter((p) => p.reference !== reference);
      localStorage.setItem("paymentHistory", JSON.stringify(filtered));
      setPaymentHistory(filtered);
    } catch (e) {
      console.error("Failed to delete payment:", e);
    }
  };

  const handleProfileImageChange = (files) => {
    const file = files && files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const data = reader.result;
      try {
        localStorage.setItem("profileImage", data);
      } catch (e) {
        // ignore storage errors
      }
      setProfileImage(data);
    };
    reader.readAsDataURL(file);
  };

  // Payment history (persisted locally)
  const [paymentHistory, setPaymentHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("paymentHistory") || "[]");
    } catch (e) {
      return [];
    }
  });

  // Released permits / registered companies shown in the List of Companies section.
  // In a real staff approval flow, save released permits from your backend response.
  const [releasedPermits, setReleasedPermits] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("releasedPermits") || "[]");
    } catch (e) {
      return [];
    }
  });

  const saveReleasedPermitRecord = (permit) => {
    try {
      const list = JSON.parse(localStorage.getItem("releasedPermits") || "[]");
      const filtered = list.filter((item) => item.permitId !== permit.permitId);
      const updated = [permit, ...filtered];
      localStorage.setItem("releasedPermits", JSON.stringify(updated));
      setReleasedPermits(updated);
    } catch (e) {
      console.error("Failed to save released permit:", e);
    }
  };

  const normalizeReleasedPermit = (payment) => {
    const app = payment.applicationId || {};
    const appId = typeof app === "object" ? app._id : app;

    return {
      permitId: appId || payment._id || payment.id,
      applicationId: appId || null,
      paymentId: payment._id || payment.id,
      companyName: app.businessName || payment.name || "Registered Business",
      email: payment.email || payment.userId?.email || "",
      businessType:
        app.businessDetails?.lineOfBusiness ||
        app.lineOfBusiness ||
        app.applicationType ||
        "N/A",
      permitStatus: payment.permitReleased ? "Active" : "Pending Release",
      paymentStatus: payment.status || "paid",
      permitReleased: Boolean(payment.permitReleased),
      releasedAt: payment.permitReleasedAt || payment.updatedAt || payment.createdAt,
      verificationUrl: payment.verificationUrl || "",
    };
  };

  const fetchReleasedPermits = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/payments`);
      const payments = Array.isArray(res.data?.payments) ? res.data.payments : [];

      const currentUserEmail = String(localStorage.getItem("email") || userEmail || "").toLowerCase();

      const approvedReleased = payments
        .filter((payment) => {
          const paymentEmail = String(payment.email || payment.userId?.email || "").toLowerCase();

          return (
            String(payment.status || "").toLowerCase() === "approved" &&
            payment.permitReleased === true &&
            paymentEmail === currentUserEmail
          );
        })
        .map(normalizeReleasedPermit);

      setReleasedPermits(approvedReleased);
      localStorage.setItem("releasedPermits", JSON.stringify(approvedReleased));
    } catch (error) {
      console.error("Failed to fetch released permits:", error);
    }
  };

  useEffect(() => {
    fetchReleasedPermits();
  }, []);

  const currentUserEmail = String(localStorage.getItem("email") || userEmail || "").toLowerCase();

  const userReleasedPermits = releasedPermits.filter((permit) => {
    const permitEmail = String(permit.email || "").toLowerCase();
    return permitEmail === currentUserEmail;
  });

  const printReleasedPermit = (permit) => {
    const permitId = permit.permitId || `PERMIT-${Date.now()}`;
    const companyName = permit.companyName || "Registered Business";
    const businessType = permit.businessType || "N/A";
    const releasedDate = permit.releasedAt
      ? new Date(permit.releasedAt).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });

    const html = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>TrustPermit - Permit ${permitId}</title>
          <style>
            body { font-family: Arial, Helvetica, sans-serif; padding: 40px; color: #111827; }
            .permit { max-width: 850px; margin: 0 auto; border: 2px solid #1d4ed8; padding: 40px; border-radius: 14px; }
            .header { text-align: center; border-bottom: 2px solid #1d4ed8; padding-bottom: 18px; margin-bottom: 28px; }
            h1 { color: #1d4ed8; margin: 0; font-size: 32px; letter-spacing: 1px; }
            h2 { margin: 8px 0 0; font-size: 18px; font-weight: 500; }
            .row { display: flex; justify-content: space-between; border-bottom: 1px solid #e5e7eb; padding: 14px 0; font-size: 16px; }
            .label { font-weight: 700; color: #374151; }
            .status { color: #16a34a; font-weight: 700; }
            .footer { margin-top: 48px; display: flex; justify-content: space-between; gap: 40px; }
            .sign { flex: 1; text-align: center; padding-top: 50px; border-top: 1px solid #111827; }
            .note { margin-top: 28px; font-size: 14px; color: #6b7280; text-align: center; }
            @media print { button { display: none; } body { padding: 0; } .permit { border-radius: 0; } }
          </style>
        </head>
        <body>
          <div class="permit">
            <div class="header">
              <h1>TRUSTPERMIT</h1>
              <h2>Official Business Permit</h2>
            </div>

            <div class="row"><span class="label">Permit ID:</span><span>${permitId}</span></div>
            <div class="row"><span class="label">Company Name:</span><span>${companyName}</span></div>
            <div class="row"><span class="label">Business Type:</span><span>${businessType}</span></div>
            <div class="row"><span class="label">Permit Status:</span><span class="status">Active</span></div>
            <div class="row"><span class="label">Release Date:</span><span>${releasedDate}</span></div>

            <p class="note">This permit was released after staff approval/payment verification.</p>

            <div class="footer">
              <div class="sign">Authorized Staff</div>
              <div class="sign">Business Owner</div>
            </div>
          </div>
          <script>window.onload = function () { window.print(); };</script>
        </body>
      </html>
    `;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const savePaymentRecord = (record) => {
    try {
      const list = JSON.parse(localStorage.getItem("paymentHistory") || "[]");
      list.unshift(record);
      localStorage.setItem("paymentHistory", JSON.stringify(list));
      setPaymentHistory(list);
    } catch (e) {
      console.error("Failed to save payment record:", e);
    }
  };

  // ================= CONTENT RENDER =================
  const handlePayment = async () => {
    if (!paymentMethod || !paymentAmount || Number(paymentAmount) <= 0) {
      alert("Please enter a valid amount and select a payment method.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please log in first before making a payment.");
      return;
    }

    const isGCash = paymentMethod === "GCash";
    const methodForDatabase = isGCash ? "gcash" : "card";
    const methodForEmail = isGCash ? "GCash" : "Bank/Card";
    const payerName = isGCash ? gcashName.trim() : cardHolderName.trim();
    const payerEmail = billingEmail.trim();
    const amount = Number(paymentAmount);

    if (isGCash) {
      if (!payerName || !payerEmail || !paymentReference.trim() || !amount) {
        alert("Please complete all GCash payment fields.");
        return;
      }
    }

    if (!isGCash) {
      if (!payerName || !payerEmail || !paymentReference.trim() || !cardExpiry.trim() || !cardCvc.trim() || !amount) {
        alert("Please complete all Bank/Card payment fields.");
        return;
      }
    }

    let paymentApplicationId = applicationId || null;

    // Automatically fetch the latest application of the logged-in user before saving payment.
    // This prevents Application ID from becoming N/A/null in the staff payment page.
    if (!paymentApplicationId) {
      try {
        const appRes = await fetch("https://trustpermit-backend.onrender.com/api/applications/my", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const appData = await appRes.json().catch(() => []);

        if (appRes.ok && Array.isArray(appData) && appData.length > 0) {
          const latestApplication = appData
            .filter((app) => app && app._id)
            .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))[0];

          paymentApplicationId = latestApplication?._id || null;
        }
      } catch (err) {
        console.error("Failed to fetch application ID:", err);
      }
    }

    if (!paymentApplicationId) {
      alert("No application found. Please submit an application first before paying.");
      return;
    }

    const payload = {
      applicationId: paymentApplicationId,
      userId: localStorage.getItem("citizenId") || null,
      name: payerName,
      email: payerEmail,
      amount,
      paymentMethod: methodForDatabase,
    };

    console.log("PAYMENT PAYLOAD:", payload);

    const ok = window.confirm(`Proceed to pay PHP ${amount.toLocaleString("en-PH")} using ${methodForEmail}?`);
    if (!ok) return;

    setProcessingPayment(true);
    setPaymentStatus(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/payments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || data.error || `Payment failed with status ${res.status}`);
      }

      const savedPayment = data.payment || payload;
      const record = { ...payload, ...savedPayment };

      try {
        await emailjs.send(
          process.env.REACT_APP_EMAILJS_SERVICE_ID,
          process.env.REACT_APP_EMAILJS_PAYMENT_TEMPLATE_ID,
          {
            name: payload.name,
            user_email: payload.email,
            amount: Number(payload.amount).toLocaleString("en-PH", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }),
            payment_method: methodForEmail,
            status: "Paid",
            date: new Date().toLocaleString("en-PH"),
          },
          process.env.REACT_APP_EMAILJS_PUBLIC_KEY
        );
      } catch (emailErr) {
        console.error("Payment saved, but email failed:", emailErr);
        alert("Payment saved successfully, but the confirmation email was not sent.");
      }

      setPaymentStatus({
        success: true,
        message: data.message || "Payment saved successfully.",
        details: record,
      });

      savePaymentRecord(record);

      // Do not show the Print Permit button yet.
      // The company will appear in List of Companies only after staff approves/releases the permit.
      await fetchReleasedPermits();

      alert("Payment saved successfully. Please wait for staff approval/release before printing your permit.");

      setPaymentAmount("");
      setPaymentReference("");
      setGcashName(userName || "");
      setBillingEmail(userEmail || "");
      setCardHolderName("");
      setCardExpiry("");
      setCardCvc("");
    } catch (err) {
      console.error("Payment error:", err);
      alert(err.message || "Payment failed. Please try again.");
    } finally {
      setProcessingPayment(false);
    }
  };

  const renderContent = () => {
    switch (activeMenu) {
      case "Inspection": {
        return (
          <InspectionSection
            inspections={inspections}
            inspectionsLoading={inspectionsLoading}
            inspectionsError={inspectionsError}
            fetchInspections={fetchInspections}
          />
        );
      }

      case "Account Details": {
          const storedName = localStorage.getItem("name") || "No Name";
          const storedEmail = localStorage.getItem("email") || "No Email";
          return (
            <ProfileSection
              profileImage={profileImage}
              storedName={storedName}
              storedEmail={storedEmail}
              isEditingProfile={isEditingProfile}
              setIsEditingProfile={setIsEditingProfile}
              currentPassword={currentPassword}
              setCurrentPassword={setCurrentPassword}
              newPassword={newPassword}
              setNewPassword={setNewPassword}
              confirmPassword={confirmPassword}
              setConfirmPassword={setConfirmPassword}
              handleProfileImageChange={handleProfileImageChange}
            />
          );
      }

      case "List of Companies":
        return (
          <div className="card form-card-wide registered-companies-card">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: 20 }}>
              <div>
                <h3 style={{ marginBottom: 8 }}>Registered Companies</h3>
                <p style={{ color: "#4B5563", margin: 0 }}>
                  Released permits will appear here after payment approval/release.
                </p>
              </div>

              <button className="btn" type="button" onClick={() => setActiveMenu("Apply Permit")}>
                Apply New Permit
              </button>
            </div>

            <div className="recent-applications-table-shell">
              <div className="recent-applications-table-scroll">
                <table className="dashboard-table recent-applications-table">
                  <thead>
                    <tr>
                      <th>Company Name</th>
                      <th>Business Type</th>
                      <th>Permit Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {userReleasedPermits.length === 0 ? (
                      <tr>
                        <td colSpan="4" style={{ textAlign: "center", padding: "24px", color: "#6B7280" }}>
                          No released permits yet. Once the payment is approved/released, the company will appear here.
                        </td>
                      </tr>
                    ) : (
                      userReleasedPermits.map((company) => (
                        <tr key={company.permitId}>
                          <td>{company.companyName || "Registered Business"}</td>
                          <td>{company.businessType || "N/A"}</td>
                          <td>
                            <span className="dashboard-status-badge approved">
                              <span className="status-dot" aria-hidden="true"></span>
                              {company.permitStatus || "Active"}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                              <button
                                className="btn small"
                                type="button"
                                onClick={() => viewCompany(company.companyName || "Registered Business")}
                              >
                                View
                              </button>

                              <button
                                className="renew-btn"
                                type="button"
                                style={{
                                  backgroundColor: "#dc2626",
                                  color: "#ffffff",
                                  border: "none",
                                  borderRadius: "8px",
                                  padding: "8px 14px",
                                  fontWeight: "600",
                                  cursor: "pointer",
                                }}
                                onClick={() => {
                                  setApplicationType("Renewal");
                                  setPermitStep(1);
                                  setActiveMenu("Apply Permit");
                                }}
                              >
                                Renew
                              </button>

                              {company.paymentStatus === "approved" && company.permitReleased === true && (
                                <button
                                  className="print-permit-btn"
                                  type="button"
                                  onClick={() =>
                                    window.open(`/permit/print/${company.applicationId}`, "_blank")
                                  }
                                >
                                  Print Permit
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case "Application Forms":
        return (
          <div className="card form-card-wide">
            <h3>Application Forms</h3>
            <p style={{ color: "#4B5563", fontSize: "1.1rem", marginBottom: "15px" }}>Fill the form step-by-step. Click "Next" to continue.</p>

            {appFormStep === 1 ? (
              <div>
                <label>Application Type</label>
                <select className="input" value={applicationType} onChange={(e) => setApplicationType(e.target.value)}>
                  <option>New Application</option>
                  <option>Renewal</option>
                </select>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label>First Name</label>
                    <input
                      className={`input ${missingFields.includes("firstName") ? "input-invalid" : ""}`}
                      value={firstName}
                      onChange={(e) => {
                        setFirstName(e.target.value);
                        if (missingFields.includes("firstName")) {
                          setMissingFields((prev) => prev.filter((f) => f !== "firstName"));
                        }
                      }}
                    />

                    <label>Middle Name</label>
                    <input className="input" value={middleName} onChange={(e) => setMiddleName(e.target.value)} />

                    <label>Last Name</label>
                    <input
                      className={`input ${missingFields.includes("lastName") ? "input-invalid" : ""}`}
                      value={lastName}
                      onChange={(e) => {
                        setLastName(e.target.value);
                        if (missingFields.includes("lastName")) {
                          setMissingFields((prev) => prev.filter((f) => f !== "lastName"));
                        }
                      }}
                    />

                    <label>Suffix</label>
                    <input className="input" value={suffixName} onChange={(e) => setSuffixName(e.target.value)} />
                  </div>

                  <div>
                    <label>Gender</label>
                    <select className="input" value={gender} onChange={(e) => setGender(e.target.value)}>
                      <option value="">Select</option>
                      <option>Male</option>
                      <option>Female</option>
                      <option>Prefer not to say</option>
                    </select>

                    <label>Civil Status</label>
                    <select className="input" value={civilStatus} onChange={(e) => setCivilStatus(e.target.value)}>
                      <option value="">Select</option>
                      <option>Single</option>
                      <option>Married</option>
                      <option>Widowed</option>
                      <option>Separated</option>
                    </select>

                    <label>Nationality</label>
                    <input className="input" value={nationality} onChange={(e) => setNationality(e.target.value)} />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
                  <div>
                    <label>Contact Number</label>
                    <input
                      className={`input ${missingFields.includes("contactNumber") ? "input-invalid" : ""}`}
                      placeholder="09xx-xxx-xxxx"
                      value={contactNumber}
                      onChange={(e) => {
                        setContactNumber(e.target.value);
                        if (missingFields.includes("contactNumber")) {
                          setMissingFields((prev) => prev.filter((f) => f !== "contactNumber"));
                        }
                      }}
                    />
                  </div>
                  <div>
                    <label>Email</label>
                    <input
                      className={`input ${missingFields.includes("applicantEmail") ? "input-invalid" : ""}`}
                      placeholder="you@example.com"
                      value={applicantEmail}
                      onChange={(e) => {
                        setApplicantEmail(e.target.value);
                        if (missingFields.includes("applicantEmail")) {
                          setMissingFields((prev) => prev.filter((f) => f !== "applicantEmail"));
                        }
                      }}
                    />
                  </div>
                </div>

                <div style={{ marginTop: 12 }}>
                  <button className="btn" onClick={() => setAppFormStep(2)}>Next</button>
                </div>
              </div>
            ) : (
              <div>
                <h4>Business, Address & Documents</h4>

                <label>Line of Business</label>
                <input className="input" value={lineOfBusiness} onChange={(e) => setLineOfBusiness(e.target.value)} />

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label>Ownership Type</label>
                    <input className="input" value={ownershipType} onChange={(e) => setOwnershipType(e.target.value)} />

                    <label>Business Area (sqm)</label>
                    <input className="input" type="number" value={businessArea} onChange={(e) => setBusinessArea(e.target.value)} />

                    <label>Male Personnel</label>
                    <input className="input" type="number" value={malePersonnel} onChange={(e) => setMalePersonnel(e.target.value)} />

                    <label>Female Personnel</label>
                    <input className="input" type="number" value={femalePersonnel} onChange={(e) => setFemalePersonnel(e.target.value)} />
                    <div style={{ marginTop: 8, color: "#6B7280", fontSize: "1.1rem" }}>Total Personnel: {totalPersonnel}</div>
                  </div>

                  <div>
                    <label>Province</label>
                    <input className="input" value={province} onChange={(e) => setProvince(e.target.value)} />

                    <label>City</label>
                    <input className="input" value={city} onChange={(e) => setCity(e.target.value)} />

                    <label>Barangay</label>
                    <input className="input" value={barangay} onChange={(e) => setBarangay(e.target.value)} />

                    <label>Subdivision / Purok</label>
                    <input className="input" value={subdivision} onChange={(e) => setSubdivision(e.target.value)} />

                    <label>Street / Block / Lot</label>
                    <input className="input" value={street} onChange={(e) => setStreet(e.target.value)} />
                    <input className="input" placeholder="Building / House No" value={building} onChange={(e) => setBuilding(e.target.value)} />
                  </div>
                </div>


                {/* Document Upload Section: Only enabled after application form is submitted */}
                <h4 style={{ marginTop: 12 }}>Uploads</h4>
                {applicationId ? (
                  <div style={{ display: "grid", gap: 15 }}>
                    {getRequiredDocuments().map((doc) => (
                      <label key={doc} className="upload-inline" style={{ fontSize: "1.1rem" }}>
                        {doc}
                        {uploadedFiles[doc] && (
                          <span className="file-name" style={{ marginLeft: 8 }}>{uploadedFiles[doc].name}</span>
                        )}
                        <input type="file" onChange={(e) => handleFileUpload(doc, e.target.files)} disabled={uploadingDocs || docsUploaded} />
                      </label>
                    ))}
                    <button
                      className="btn"
                      style={{ marginTop: 10 }}
                      onClick={uploadDocuments}
                      disabled={uploadingDocs || docsUploaded}
                    >
                      {uploadingDocs ? "Uploading..." : docsUploaded ? "Uploaded" : "Upload Documents"}
                    </button>
                  </div>
                ) : (
                  <div style={{ color: '#888', fontSize: '1rem', marginBottom: 10 }}>
                    Please submit the application form first to enable document upload.
                  </div>
                )}

                <h4 style={{ marginTop: 12 }}>Applicant Signature</h4>
                <canvas
                  ref={canvasRef}
                  width={400}
                  height={150}
                  className="signature-canvas"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                />

                <div style={{ marginTop: 8 }}>
                  <button className="btn clear-signature-btn" onClick={clearSignature}>Clear Signature</button>
                  <button
                    className="btn"
                    style={{ marginLeft: 8 }}
                    onClick={submitApplication}
                    disabled={submittingApp}
                  >
                    {submittingApp ? "Submitting..." : "Submit"}
                  </button>
                  <button className="btn" style={{ marginLeft: 8 }} onClick={() => setAppFormStep(1)}>Back</button>
                </div>
              </div>
            )}
          </div>
        );

      case "Apply Permit": {
        const permitRequirements = [
          "Proof of business registration, incorporation, or legal personality [i.e., DTI/SEC/Cooperative Development Authority (CDA) registration].",
          "Basis for computing taxes, fees, and charges (e.g. business capitalization).",
          "Occupancy Permit, if required by national laws (e.g. Building Code) and local laws; (subject to post audit requirements as per Ordinance No. 322, Series of 2016).",
          "Contract of Lease (if Lessee).",
        ];
        const permitSteps = [
          { num: "01", label: "Taxpayer Information" },
          { num: "02", label: "Business Information" },
          { num: "03", label: "Undertaking/Waiver" },
        ];

        return (
          <div className="permit-form-wrapper" style={{ width: "100%", maxWidth: "none" }}>
            {/* Top Tab Bar */}
            <div className="permit-top-tabs">
              <button
                className={`permit-top-tab ${permitLicenseTab === "new" ? "active" : ""}`}
                onClick={() => setPermitLicenseTab("new")}
              >
                <span className="permit-tab-check">✔</span> NEW BUSINESS LICENSE
              </button>
              <button
                className={`permit-top-tab ${permitLicenseTab === "check" ? "active" : ""}`}
                onClick={() => setPermitLicenseTab("check")}
              >
                <span className="permit-tab-check">✔</span> CHECK SENT E-MAIL
              </button>
            </div>

            {permitLicenseTab === "new" ? (
              <div className="permit-form-card">
                {/* Requirements Accordion */}
                <div className="permit-requirements-box">
                  <button
                    className="permit-requirements-toggle"
                    onClick={() => setShowRequirements(!showRequirements)}
                  >
                    <span>📋 REQUIREMENTS</span>
                    <span>{showRequirements ? "▲" : "▼"}</span>
                  </button>
                  {showRequirements && (
                    <div className="permit-requirements-content">
                      <strong>New Business Registration:</strong>
                      <ol>
                        {permitRequirements.map((req, i) => (
                          <li key={i}>{req}</li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>

                {/* Step Wizard */}
                <div className="permit-steps">
                  {permitSteps.map((step, idx) => (
                    <React.Fragment key={step.num}>
                      <div className={`permit-step${permitStep === idx + 1 ? " active" : ""}${permitStep > idx + 1 ? " completed" : ""}`}>
                        <div className="permit-step-circle"></div>
                        <div className="permit-step-info">
                          <span className="permit-step-num">{step.num}</span>
                          <span className="permit-step-label">{step.label}</span>
                        </div>
                      </div>
                      {idx < permitSteps.length - 1 && (
                        <div className={`permit-step-connector${permitStep > idx + 1 ? " done" : ""}`}></div>
                      )}
                    </React.Fragment>
                  ))}
                </div>

                {/* ── Step 1: Taxpayer Information ── */}
                {permitStep === 1 && (
                  <div className="permit-step-content">
                    <h3 className="permit-section-title">Taxpayer Information</h3>
                    {/* Application Type moved here */}
                    <div className="permit-row permit-row-2">
                      <div className="permit-field">
                        <label className="permit-label">Application Type <span className="req-star">*</span></label>
                        <select className="input" value={applicationType} onChange={e => setApplicationType(e.target.value)}>
                          <option>New Application</option>
                          <option>Renewal</option>
                        </select>
                      </div>
                    </div>

                    {/* Show different fields for Renewal */}
                    {applicationType === "Renewal" ? (
                      // ...existing code for Renewal fields...
                      <>
                        <h4>🧾 1. BUSINESS INFORMATION</h4>
                        <label>Business Name</label>
                        <input className="input" value={businessName} onChange={e => setBusinessName(e.target.value)} />
                        <label>Trade Name (if different)</label>
                        <input className="input" />
                        <label>Business Address</label>
                        <input className="input" />
                        <label>Barangay</label>
                        <input className="input" value={barangay} onChange={e => setBarangay(e.target.value)} />
                        <label>Contact Number / Email</label>
                        <input className="input" value={contactNumber} onChange={e => setContactNumber(e.target.value)} />
                        <label>Business Area (sqm)</label>
                        <input className="input" value={businessArea} onChange={e => setBusinessArea(e.target.value)} />
                        <label>Ownership Type</label>
                        <select className="input" value={ownershipType} onChange={e => setOwnershipType(e.target.value)}>
                          <option>Sole Proprietor</option>
                          <option>Partnership</option>
                          <option>Corporation</option>
                        </select>
                        <h4>👤 2. OWNER / APPLICANT DETAILS</h4>
                        <label>Name of Owner / Authorized Representative</label>
                        <input className="input" value={firstName} onChange={e => setFirstName(e.target.value)} />
                        <label>Home Address</label>
                        <input className="input" />
                        <label>Contact Number</label>
                        <input className="input" value={contactNumber} onChange={e => setContactNumber(e.target.value)} />
                        <label>TIN (Tax Identification Number)</label>
                        <input className="input" value={tin} onChange={e => setTin(e.target.value)} />
                        <label>Position</label>
                        <select className="input" value={registrantPosition} onChange={e => setRegistrantPosition(e.target.value)}>
                          <option>Owner</option>
                          <option>Manager</option>
                          <option>Representative</option>
                        </select>
                        <h4>🏢 3. REGISTRATION DETAILS</h4>
                        <label>DTI Number (for sole prop)</label>
                        <input className="input" />
                        <label>SEC Registration (for corporation)</label>
                        <input className="input" />
                        <label>CDA (for cooperatives)</label>
                        <input className="input" />
                        <label>Date of Registration</label>
                        <input className="input" type="date" />
                        <h4>💰 4. FINANCIAL INFORMATION (VERY IMPORTANT)</h4>
                        <label>Gross Sales / Receipts (previous year)</label>
                        <input className="input" />
                        <label>Capitalization (if needed)</label>
                        <input className="input" />
                        <label>Financial Statement (upload)</label>
                        <input className="input" type="file" />
                        <label>OR Sworn Declaration (upload)</label>
                        <input className="input" type="file" />
                        <h4>🏭 5. BUSINESS ACTIVITY</h4>
                        <label>Nature of Business</label>
                        <input className="input" />
                        <label>Line of Business</label>
                        <input className="input" value={lineOfBusiness} onChange={e => setLineOfBusiness(e.target.value)} />
                        <label>Number of Employees</label>
                        <input className="input" />
                        <h4>📍 6. LOCATION & PROPERTY INFO</h4>
                        <label>Owned or Leased?</label>
                        <select className="input">
                          <option>Owned</option>
                          <option>Leased</option>
                        </select>
                        <label>If leased: Name of Lessor</label>
                        <input className="input" />
                        <label>Lease Contract details</label>
                        <input className="input" />
                        <label>TCT / Tax Declaration number</label>
                        <input className="input" />
                        <h4>📋 7. CLEARANCES</h4>
                        <label>Barangay Clearance (upload)</label>
                        <input className="input" type="file" />
                        <label>Fire Safety (BFP) (upload)</label>
                        <input className="input" type="file" />
                        <label>Sanitary Permit (upload)</label>
                        <input className="input" type="file" />
                        <label>Zoning Clearance (upload)</label>
                        <input className="input" type="file" />
                        <label>Environmental Permit (upload)</label>
                        <input className="input" type="file" />
                        <h4>✍️ 8. DECLARATION / UNDERTAKING</h4>
                        <label>Declaration that all info is true</label>
                        <input className="input" />
                        <label>Agreement to comply with city ordinances</label>
                        <input className="input" />
                        <label>Signature of owner or authorized representative (upload)</label>
                        <input className="input" type="file" />
                        <h4>📎 9. ATTACHMENTS (UPLOAD / SUBMIT)</h4>
                        <label>Previous Mayor’s Permit (upload)</label>
                        <input className="input" type="file" />
                        <label>Official Receipts (upload)</label>
                        <input className="input" type="file" />
                        <label>Financial Documents (upload)</label>
                        <input className="input" type="file" />
                        <label>Lease / Land Title (upload)</label>
                        <input className="input" type="file" />
                        <label>Barangay Clearance (upload)</label>
                        <input className="input" type="file" />
                      </>
                    ) : (
                      // Restore all original New Application fields
                      <>
                        <div className="permit-row permit-row-2">
                          <div className="permit-field">
                            <label className="permit-label">Registrant Name <span className="req-star">*</span></label>
                            <input className="input" value={registrantName} onChange={e => setRegistrantName(e.target.value)} />
                          </div>
                          <div className="permit-field">
                            <label className="permit-label">Registrant Position <span className="req-star">*</span></label>
                            <select className="input" value={registrantPosition} onChange={e => setRegistrantPosition(e.target.value)}>
                              <option>Owner</option>
                              <option>Manager</option>
                              <option>Representative</option>
                              <option>Partner</option>
                            </select>
                          </div>
                        </div>
                        <div className="permit-ownership-row">
                          <label className="permit-label" style={{ marginBottom: 6 }}>Ownership Type <span className="req-star">*</span></label>
                          <div className="permit-radio-group">
                            <label className="permit-radio-label">
                              <input type="radio" name="ownerType" checked={isIndividual} onChange={() => setIsIndividual(true)} />
                              Individual
                            </label>
                            <label className="permit-radio-label">
                              <input type="radio" name="ownerType" checked={!isIndividual} onChange={() => setIsIndividual(false)} />
                              Corporation/Organization/Group/Couple
                            </label>
                          </div>
                        </div>
                        <div className="permit-row permit-row-4">
                          <div className="permit-field">
                            <label className="permit-label">First Name <span className="req-star">*</span></label>
                            <input className={`input${missingFields.includes("firstName") ? " input-invalid" : ""}`} value={firstName} onChange={e => { setFirstName(e.target.value); setMissingFields(p => p.filter(f => f !== "firstName")); }} />
                          </div>
                          <div className="permit-field">
                            <label className="permit-label">Middle Name/Initial</label>
                            <input className="input" value={middleName} onChange={e => setMiddleName(e.target.value)} />
                          </div>
                          <div className="permit-field">
                            <label className="permit-label">Last Name <span className="req-star">*</span></label>
                            <input className={`input${missingFields.includes("lastName") ? " input-invalid" : ""}`} value={lastName} onChange={e => { setLastName(e.target.value); setMissingFields(p => p.filter(f => f !== "lastName")); }} />
                          </div>
                          <div className="permit-field">
                            <label className="permit-label">Suffix Name</label>
                            <input className="input" value={suffixName} onChange={e => setSuffixName(e.target.value)} />
                          </div>
                        </div>
                        <div className="permit-row permit-row-4">
                          <div className="permit-field">
                            <label className="permit-label">Birth Date</label>
                            <input className="input" type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} />
                          </div>
                          <div className="permit-field">
                            <label className="permit-label">Gender <span className="req-star">*</span></label>
                            <select className="input" value={gender} onChange={e => setGender(e.target.value)}>
                              <option value=""></option>
                              <option>Male</option>
                              <option>Female</option>
                              <option>Prefer not to say</option>
                            </select>
                          </div>
                          <div className="permit-field">
                            <label className="permit-label">Civil Status</label>
                            <select className="input" value={civilStatus} onChange={e => setCivilStatus(e.target.value)}>
                              <option value=""></option>
                              <option>Single</option>
                              <option>Married</option>
                              <option>Widowed</option>
                              <option>Separated</option>
                            </select>
                          </div>
                          <div className="permit-field">
                            <label className="permit-label">Nationality</label>
                            <select className="input" value={nationality} onChange={e => setNationality(e.target.value)}>
                              <option>Filipino</option>
                              <option>Foreign</option>
                            </select>
                          </div>
                        </div>
                        <div className="permit-addr-contact">
                          <div className="permit-addr-col">
                            <div className="permit-addr-header">
                              <span className="permit-section-subtitle">Address</span>
                              <label className="permit-radio-label" style={{ fontWeight: "normal" }}>
                                <input type="checkbox" checked={outsideAntipolo} onChange={e => setOutsideAntipolo(e.target.checked)} />
                                Outside City of Antipolo
                              </label>
                            </div>
                            <div className="permit-row permit-row-2">
                              <div className="permit-field">
                                <label className="permit-label">Province Name <span className="req-star">*</span></label>
                                <input className="input" placeholder="Province of Rizal" value={province} onChange={e => setProvince(e.target.value)} />
                              </div>
                              <div className="permit-field">
                                <label className="permit-label">City/Municipality Name <span className="req-star">*</span></label>
                                <input className="input" placeholder="Antipolo" value={city} onChange={e => setCity(e.target.value)} />
                              </div>
                            </div>
                            <div className="permit-row permit-row-2">
                              <div className="permit-field">
                                <label className="permit-label">Barangay Name <span className="req-star">*</span></label>
                                <input className="input" value={barangay} onChange={e => setBarangay(e.target.value)} />
                              </div>
                              <div className="permit-field">
                                <label className="permit-label">Subdivision</label>
                                <input className="input" value={subdivision} onChange={e => setSubdivision(e.target.value)} />
                              </div>
                            </div>
                            <div className="permit-row permit-row-2">
                              <div className="permit-field">
                                <label className="permit-label">Street</label>
                                <input className="input" value={street} onChange={e => setStreet(e.target.value)} />
                              </div>
                              <div className="permit-field">
                                <label className="permit-label">Building Name</label>
                                <input className="input" value={building} onChange={e => setBuilding(e.target.value)} />
                              </div>
                            </div>
                            <div className="permit-row permit-row-3">
                              <div className="permit-field">
                                <label className="permit-label">House No.</label>
                                <input className="input" value={houseNo} onChange={e => setHouseNo(e.target.value)} />
                              </div>
                              <div className="permit-field">
                                <label className="permit-label">Block</label>
                                <input className="input" value={block} onChange={e => setBlock(e.target.value)} />
                              </div>
                              <div className="permit-field">
                                <label className="permit-label">Lot</label>
                                <input className="input" value={lot} onChange={e => setLot(e.target.value)} />
                              </div>
                            </div>
                            <div className="permit-field">
                              <label className="permit-label">Landmark/Corner/Ave.</label>
                              <input className="input" value={landmark} onChange={e => setLandmark(e.target.value)} />
                            </div>
                          </div>
                          <div className="permit-contact-col">
                            <span className="permit-section-subtitle" style={{ display: "block", marginBottom: 14 }}>Contact</span>
                            <div className="permit-field">
                              <label className="permit-label">Tel. No(s).</label>
                              <input className="input" value={telephone} onChange={e => setTelephone(e.target.value)} />
                            </div>
                            <div className="permit-field">
                              <label className="permit-label">C.P. No(s). <span className="req-star">*</span></label>
                              <div className="permit-cp-input">
                                <span className="permit-cp-prefix">+63</span>
                                <input className={`input permit-cp-field${missingFields.includes("contactNumber") ? " input-invalid" : ""}`} value={contactNumber} onChange={e => { setContactNumber(e.target.value); setMissingFields(p => p.filter(f => f !== "contactNumber")); }} />
                              </div>
                            </div>
                            <div className="permit-field">
                              <label className="permit-label">Fax No(s).</label>
                              <input className="input" value={faxNo} onChange={e => setFaxNo(e.target.value)} />
                            </div>
                            <div className="permit-field">
                              <label className="permit-label">Email Address <span className="req-star">*</span></label>
                              <input className={`input${missingFields.includes("applicantEmail") ? " input-invalid" : ""}`} value={applicantEmail} onChange={e => { setApplicantEmail(e.target.value); setMissingFields(p => p.filter(f => f !== "applicantEmail")); }} />
                            </div>
                            <div className="permit-field">
                              <label className="permit-label">TIN</label>
                              <input className="input" value={tin} onChange={e => setTin(e.target.value)} />
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                    <div className="permit-nav-btns">
                      <button className="permit-prev-btn" onClick={() => setActiveMenu("Account Details")}>&lt; Previous</button>
                      <button className="permit-next-btn" onClick={() => setPermitStep(2)}>Next &gt;</button>
                    </div>
                  </div>
                )}

                {/* ── Step 2: Business Information ── */}
                {permitStep === 2 && (
                  <div className="permit-step-content">
                    <h3 className="permit-section-title">Business Information</h3>
                    <div className="permit-row permit-row-2">
                      <div className="permit-field">
                        <label className="permit-label">Business Name <span className="req-star">*</span></label>
                        <input className={`input${missingFields.includes("businessName") ? " input-invalid" : ""}`} value={businessName} onChange={(e) => { setBusinessName(e.target.value); setMissingFields(p => p.filter(f => f !== "businessName")); }} />
                      </div>
                      {/* Application Type removed from here */}
                    </div>

                    <div className="permit-row permit-row-2">
                      <div className="permit-field">
                        <label className="permit-label">Line of Business</label>
                        <input className="input" value={lineOfBusiness} onChange={(e) => setLineOfBusiness(e.target.value)} />
                      </div>
                      <div className="permit-field">
                        <label className="permit-label">Ownership Type</label>
                        <input className="input" value={ownershipType} onChange={(e) => setOwnershipType(e.target.value)} />
                      </div>
                    </div>

                    <div className="permit-row permit-row-2">
                      <div className="permit-field">
                        <label className="permit-label">Project Type</label>
                        <select className="input" value={projectType} onChange={(e) => setProjectType(e.target.value)}>
                          <option>Residential</option>
                          <option>Commercial</option>
                        </select>
                      </div>
                      <div className="permit-field">
                        <label className="permit-label">Zone Type</label>
                        <select className="input" value={zoneType} onChange={(e) => setZoneType(e.target.value)}>
                          <option>Residential Zone</option>
                          <option>Commercial Zone</option>
                        </select>
                      </div>
                    </div>

                    <div className="permit-row permit-row-3">
                      <div className="permit-field">
                        <label className="permit-label">Business Area (sqm)</label>
                        <input className="input" type="number" value={businessArea} onChange={(e) => setBusinessArea(e.target.value)} />
                      </div>
                      <div className="permit-field">
                        <label className="permit-label">Male Personnel</label>
                        <input className="input" type="number" value={malePersonnel} onChange={(e) => setMalePersonnel(e.target.value)} />
                      </div>
                      <div className="permit-field">
                        <label className="permit-label">Female Personnel</label>
                        <input className="input" type="number" value={femalePersonnel} onChange={(e) => setFemalePersonnel(e.target.value)} />
                      </div>
                    </div>
                    <div style={{ marginBottom: 16, color: "#6B7280", fontSize: "0.95rem" }}>Total Personnel: <strong>{totalPersonnel}</strong></div>

                    <div className="permit-nav-btns">
                      <button className="permit-prev-btn" onClick={() => setPermitStep(1)}>&lt; Previous</button>
                      <button className="permit-next-btn" onClick={() => setPermitStep(3)}>Next &gt;</button>
                    </div>
                  </div>
                )}

                {/* ── Step 3: Undertaking / Waiver ── */}
                {permitStep === 3 && (
                  <div className="permit-step-content">
                    <h3 className="permit-section-title">Undertaking / Waiver</h3>
                    <div className="permit-waiver-box">
                      <p>
                        I hereby certify that all information provided in this application are true and correct to the best of my knowledge and belief.
                        I understand that any misrepresentation of facts herein shall be a cause for the cancellation and/or revocation of my business permit.
                        I further undertake to comply with all the requirements of applicable laws and ordinances.
                      </p>
                    </div>

                    <h4 style={{ marginTop: 20, marginBottom: 8, fontSize: "1rem", fontWeight: "700" }}>Applicant Signature</h4>
                    <canvas
                      ref={canvasRef}
                      width={560}
                      height={150}
                      className="signature-canvas"
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                    />
                    <div style={{ marginTop: 8 }}>
                      <button className="btn clear-signature-btn" onClick={clearSignature}>Clear Signature</button>
                    </div>

                    <div className="permit-nav-btns">
                      <button className="permit-prev-btn" onClick={() => setPermitStep(2)}>&lt; Previous</button>
                      <button className="permit-next-btn" onClick={submitApplication} disabled={submittingApp}>
                        {submittingApp ? "Submitting..." : "Submit Application"}
                      </button>
                    </div>
                  </div>
                )}

                {/* ── Step 5: Upload Documents ── */}
                {permitStep === 5 && (
                  <div className="permit-step-content">
                    <h3 className="permit-section-title">Upload Required Documents</h3>
                    <p style={{ color: "#4B5563", marginBottom: 20, fontSize: "1rem" }}>
                      Your application has been submitted successfully. Please upload your required documents below.
                    </p>

                    <ul className="document-list">
                      {getRequiredDocuments().map((doc) => (
                        <li key={doc} className="document-upload">
                          <span>{doc}</span>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            {uploadedFiles[doc] && <span className="file-name">{uploadedFiles[doc].name}</span>}
                            <label className="upload-btn">
                              Upload
                              <input
                                type="file"
                                onChange={(e) => handleFileUpload(doc, e.target.files)}
                                disabled={uploadingDocs || docsUploaded}
                              />
                            </label>
                          </div>
                        </li>
                      ))}
                    </ul>

                    <div className="permit-nav-btns">
                      <button
                        className="permit-next-btn"
                        onClick={uploadDocuments}
                        disabled={uploadingDocs || docsUploaded}
                      >
                        {uploadingDocs ? "Uploading..." : docsUploaded ? "Uploaded" : "Submit Documents"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="permit-form-card" style={{ textAlign: "center", padding: "48px 24px" }}>
                <h3 style={{ fontSize: "1.4rem", marginBottom: 12 }}>Check Sent Email</h3>
                <p style={{ color: "#6B7280" }}>Please check your email inbox for the permit application confirmation and further instructions.</p>
              </div>
            )}
          </div>
        );
      }

      case "Payment":
        return (
          <div className="card form-card-wide payment-form-card">
            <div className="payment-shell">
              <h3 className="payment-heading">Payment Method</h3>

              <div className="payment-method-grid">
                <button
                  type="button"
                  className={`payment-method-card ${paymentMethod === "Bank" ? "active" : ""}`}
                  onClick={() => setPaymentMethod("Bank")}
                >
                  <span className="payment-method-brand">VISA</span>
                  <span className="payment-method-sub">MasterCard</span>
                </button>
                <button
                  type="button"
                  className={`payment-method-card ${paymentMethod === "GCash" ? "active" : ""}`}
                  onClick={() => setPaymentMethod("GCash")}
                >
                  <span className="payment-method-brand">GCash</span>
                  <span className="payment-method-sub">eWallet</span>
                </button>
              </div>

              {paymentMethod === "GCash" ? (
                <>
                  <label className="payment-label">Name</label>
                  <input
                    className="payment-field"
                    type="text"
                    placeholder="Your full name"
                    value={gcashName}
                    onChange={(e) => setGcashName(e.target.value)}
                  />

                  <label className="payment-label">Email</label>
                  <input
                    className="payment-field"
                    type="email"
                    placeholder="Enter your email"
                    value={billingEmail}
                    onChange={(e) => setBillingEmail(e.target.value)}
                  />

                  <label className="payment-label">GCash Number</label>
                  <input
                    className="payment-field"
                    type="text"
                    placeholder="09XXXXXXXXX"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                  />
                </>
              ) : (
                <>
                  {/* Payment Method accordion */}
                  <div className="cc-section">
                    <div className="cc-section-header">
                      <span className="cc-section-title">Payment Method</span>
                      <button type="button" className="cc-accordion-btn" onClick={() => setPaymentMethodOpen(o => !o)}>
                        {paymentMethodOpen ? "∧" : "∨"}
                      </button>
                    </div>
                    {paymentMethodOpen && (
                      <div className="cc-method-body">
                        <label className="cc-radio-row">
                          <input type="radio" checked readOnly className="cc-radio" />
                          <span className="cc-card-icon-svg">
                            <svg width="18" height="13" viewBox="0 0 18 13" fill="none">
                              <rect x="0.5" y="0.5" width="17" height="12" rx="1.5" stroke="#6366f1" strokeWidth="1.2" fill="none"/>
                              <rect x="0.5" y="3" width="17" height="2.5" fill="#6366f1" opacity="0.35"/>
                            </svg>
                          </span>
                          <span className="cc-radio-label">Credit/Debit Card</span>
                        </label>

                        {/* Visual card preview */}
                        <div className="cc-card-visual">
                          <div className="cc-card-top">
                            <div className="cc-chip">
                              <svg width="32" height="26" viewBox="0 0 32 26" fill="none">
                                <rect x="1" y="1" width="30" height="24" rx="3" fill="#c8a84b" stroke="#a8892f" strokeWidth="1.2"/>
                                <line x1="8.75" y1="1" x2="8.75" y2="25" stroke="#a8892f" strokeWidth="1" opacity="0.5"/>
                                <line x1="23.25" y1="1" x2="23.25" y2="25" stroke="#a8892f" strokeWidth="1" opacity="0.5"/>
                                <line x1="1" y1="9.5" x2="31" y2="9.5" stroke="#a8892f" strokeWidth="1" opacity="0.5"/>
                                <line x1="1" y1="16.5" x2="31" y2="16.5" stroke="#a8892f" strokeWidth="1" opacity="0.5"/>
                                <rect x="8.75" y="9.5" width="14.5" height="7" rx="1" fill="#e8c86c" stroke="#a8892f" strokeWidth="0.8"/>
                              </svg>
                            </div>
                            <div className="cc-card-valid-area">
                              <span className="cc-valid-lbl">VALID</span>
                              <span className="cc-cvv-lbl">CVV</span>
                            </div>
                          </div>
                          <div className="cc-card-bottom">
                            <span className="cc-card-holder-name">{cardHolderName || "Card Holder Name"}</span>
                          </div>
                        </div>

                        <p className="cc-info-section-label">Card Information</p>
                        <div className="cc-card-info-box">
                          <div className="cc-number-row">
                            <input
                              className="cc-number-input"
                              type="text"
                              placeholder="1234 1234 1234 1234"
                              value={paymentReference}
                              onChange={e => {
                                let v = e.target.value.replace(/\D/g, "").slice(0, 16);
                                v = v.replace(/(.{4})/g, "$1 ").trim();
                                setPaymentReference(v);
                              }}
                              maxLength={19}
                            />
                            <div className="cc-brand-row">
                              <span className="cc-brand-chip" title="Amex">
                                <svg width="30" height="19" viewBox="0 0 30 19"><rect width="30" height="19" rx="3" fill="#1a7abf"/><text x="4" y="13" fontSize="7" fontWeight="800" fill="white" fontFamily="Arial">AMEX</text></svg>
                              </span>
                              <span className="cc-brand-chip" title="JCB">
                                <svg width="30" height="19" viewBox="0 0 30 19"><rect width="30" height="19" rx="3" fill="#e8e8e8"/><text x="5" y="13" fontSize="7" fontWeight="800" fill="#333" fontFamily="Arial">JCB</text></svg>
                              </span>
                              <span className="cc-brand-chip" title="Mastercard">
                                <svg width="30" height="19" viewBox="0 0 30 19"><circle cx="11" cy="9.5" r="7.5" fill="#eb001b"/><circle cx="19" cy="9.5" r="7.5" fill="#f79e1b"/><path d="M15 3.3a7.5 7.5 0 0 1 0 12.4A7.5 7.5 0 0 1 15 3.3z" fill="#ff5f00"/></svg>
                              </span>
                              <span className="cc-brand-chip" title="VISA">
                                <svg width="38" height="19" viewBox="0 0 38 19"><rect width="38" height="19" rx="3" fill="#1a1f71"/><text x="5" y="14" fontSize="10" fontWeight="900" fill="white" fontFamily="Arial" letterSpacing="1">VISA</text></svg>
                              </span>
                            </div>
                          </div>
                          <div className="cc-divider" />
                          <div className="cc-expiry-cvc-row">
                            <input
                              className="cc-split-input"
                              type="text"
                              placeholder="MM / YY"
                              value={cardExpiry}
                              onChange={e => {
                                let v = e.target.value.replace(/\D/g, "").slice(0, 4);
                                if (v.length > 2) v = v.slice(0, 2) + " / " + v.slice(2);
                                setCardExpiry(v);
                              }}
                              maxLength={7}
                            />
                            <div className="cc-split-divider" />
                            <div className="cc-cvc-field">
                              <input
                                className="cc-split-input"
                                type="password"
                                placeholder="CVC"
                                value={cardCvc}
                                onChange={e => setCardCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
                                maxLength={4}
                              />
                              <span className="cc-cvc-icon">
                                <svg width="22" height="16" viewBox="0 0 22 16" fill="none">
                                  <rect x="1" y="1" width="20" height="14" rx="2" stroke="#9ca3af" strokeWidth="1.4" fill="white"/>
                                  <rect x="1" y="4" width="20" height="3.5" fill="#9ca3af" opacity="0.45"/>
                                  <rect x="3" y="9" width="10" height="2.5" rx="1" fill="#d1d5db"/>
                                </svg>
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Billing Information accordion */}
                  <div className="cc-section">
                    <div className="cc-section-header">
                      <span className="cc-section-title">Billing Information</span>
                      <button type="button" className="cc-accordion-btn" onClick={() => setBillingOpen(o => !o)}>
                        {billingOpen ? "∧" : "∨"}
                      </button>
                    </div>
                    {billingOpen && (
                      <div className="cc-billing-body">
                        <div className="cc-field-group">
                          <label className="cc-field-label">Name</label>
                          <input className="cc-field-input" type="text" placeholder="Name"
                            value={cardHolderName} onChange={e => setCardHolderName(e.target.value)} />
                        </div>
                        <div className="cc-field-group">
                          <label className="cc-field-label">Email</label>
                          <input className="cc-field-input" type="email" placeholder="Email"
                            value={billingEmail} onChange={e => setBillingEmail(e.target.value)} />
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              <label className="payment-label">Amount (PHP)</label>
              <input
                className="payment-field"
                type="number"
                min="1"
                placeholder="Enter amount"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
              />

              {paymentMethod === "Bank" ? (
                <div className="cc-actions">
                  <button
                    className="cc-proceed-btn"
                    disabled={processingPayment || !paymentAmount}
                    onClick={handlePayment}
                  >
                    ▬ {processingPayment ? "Processing..." : "Make a Payment"}
                  </button>
                  <button className="cc-cancel-btn" type="button" onClick={() => setPaymentMethod("")}>
                    ✕ Cancel
                  </button>
                </div>
              ) : (
                <div className="cc-actions">
                  <button
                    className="cc-proceed-btn"
                    disabled={processingPayment || !paymentMethod || !paymentAmount}
                    onClick={handlePayment}
                  >
                    ▬ {processingPayment ? "Processing..." : "Make a Payment"}
                  </button>
                  <button className="cc-cancel-btn" type="button" onClick={() => setPaymentMethod("")}>
                    ✕ Cancel
                  </button>
                </div>
              )}

              {paymentStatus && (
                <div className="payment-success-box">
                  <div>{paymentStatus.message || "Payment successful"}</div>
                  <button className="btn small" onClick={() => downloadReceipt(paymentStatus.details)}>
                    Download Receipt
                  </button>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

    // Hide header and dropdown if initialMenu is provided (i.e., when rendered from Home)
    const hideHeader = !!initialMenu;

    return (
      <div className="account-container" style={{ display: "flex", minHeight: hideHeader ? undefined : "100vh" }}>
        <div className="account-notification-wrapper">
            <button
              type="button"
              className={`account-notification-btn ${showNotifications ? "active" : ""}`}
              onClick={() => setShowNotifications((open) => !open)}
              aria-label="Open notifications"
            >
              <span className="account-notification-bell" aria-hidden="true">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 9.8C18 6.58 15.55 4 12 4C8.45 4 6 6.58 6 9.8V13.6L4.8 15.7C4.42 16.37 4.9 17.2 5.67 17.2H18.33C19.1 17.2 19.58 16.37 19.2 15.7L18 13.6V9.8Z" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9.75 19C10.18 19.9 10.93 20.4 12 20.4C13.07 20.4 13.82 19.9 14.25 19" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"/>
                </svg>
              </span>
              {notificationItems.length > 0 && (
                <span className="account-notification-count">{notificationItems.length}</span>
              )}
            </button>

            {showNotifications && (
              <div className="account-notification-panel">
                <div className="account-notification-panel-header">
                  <div>
                    <h3>Notifications</h3>
                    <p>{notificationItems.length} recent update{notificationItems.length === 1 ? "" : "s"}</p>
                  </div>
                  <button type="button" onClick={() => setShowNotifications(false)}>View All</button>
                </div>

                <div className="account-notification-list">
                  {notificationItems.length === 0 ? (
                    <div className="account-notification-empty">No recent notifications.</div>
                  ) : (
                    notificationItems.map((note, index) => (
                      <div key={index} className="account-notification-row">
                        <span className={`account-notification-icon ${getNotificationIconClass(note)}`}>
                          {note.type === "inspection" ? (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M7 3V6M17 3V6M4.5 9H19.5M6 5H18C19.1 5 20 5.9 20 7V18C20 19.1 19.1 20 18 20H6C4.9 20 4 19.1 4 18V7C4 5.9 4.9 5 6 5Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M8 13H10.2M8 16H13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                            </svg>
                          ) : getNotificationIconClass(note) === "approved" ? (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M5 12.5L9.2 16.5L19 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          ) : (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M8 3.5H14L19 8.5V20.5H8C6.9 20.5 6 19.6 6 18.5V5.5C6 4.4 6.9 3.5 8 3.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M14 3.5V8.5H19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M9.5 13H15.5M9.5 16H14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                            </svg>
                          )}
                        </span>
                        <div className="account-notification-text">
                          <p>{note.message}</p>
                          {note.timestamp && (
                            <span>{new Date(note.timestamp).toLocaleString([], { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {(inspectionsError || applicationsError) && (
                  <div className="account-notification-error">
                    {inspectionsError || applicationsError}
                  </div>
                )}

                <button type="button" className="account-notification-footer" onClick={() => setShowNotifications(false)}>
                  View All Notifications <span aria-hidden="true">→</span>
                </button>
              </div>
            )}
          </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <main
            className="content-area"
            style={{
              maxWidth: hideHeader ? "100%" : "100%",
              margin: hideHeader ? undefined : "0 auto",
              width: "100%",
              padding: hideHeader ? 0 : "20px 30px",
            }}
          >
            {activeMenu === "Account Details" ? (
              <div className="dashboard-main">
                {/* Left column: Profile, Permit Progress, Recent Applications */}
                <div>
                  {/* Profile Card */}
                  <div className="dashboard-profile-card" style={{ padding: "30px" }}>
                    <div className="dashboard-profile-img" style={{ width: 120, height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F3F4F6', borderRadius: '50%' }}>
                      {profileImage ? (
                        <img src={profileImage} alt="profile" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: '50%' }} />
                      ) : (
                        // Default user icon (SVG)
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="12" cy="12" r="12" fill="#E5E7EB"/>
                          <circle cx="12" cy="10" r="4" fill="#9CA3AF"/>
                          <path d="M4 20c0-2.21 3.58-4 8-4s8 1.79 8 4" fill="#9CA3AF"/>
                        </svg>
                      )}
                    </div>
                    <div className="dashboard-profile-info">
                      {(userRole !== "admin" && userRole !== "staff") ? (
                        <>
                          <h3 style={{ fontSize: "2.2rem", marginBottom: "8px" }}>{userName}</h3>
                          <div className="dashboard-profile-email" style={{ fontSize: "1.2rem", margin: "10px 0" }}>{userEmail}</div>
                        </>
                      ) : null}
                      <span className="dashboard-profile-verified" style={{ fontSize: "1.1rem" }}>
                        <span style={{ fontSize: 16, marginRight: 4 }}></span> Verified User
                      </span>
                      <button className="edit-profile-btn" onClick={() => setIsEditingProfile(true)} style={{marginTop:12}}>Edit Profile</button>
                    </div>
                  </div>
                  {isEditingProfile && (
                    <div className="edit-profile-modal">
                      <div className="edit-profile-content">
                        <h2>Edit Profile</h2>
                        <form onSubmit={(e) => {
                          e.preventDefault();
                          if (newPassword && newPassword !== confirmPassword) {
                            alert("New password and confirmation do not match.");
                            return;
                          }
                          // In a real app, you'd call an API here.
                          alert("Profile updated successfully!");
                          setCurrentPassword("");
                          setNewPassword("");
                          setConfirmPassword("");
                          setIsEditingProfile(false);
                        }}>
                          <div style={{ marginBottom: 15 }}>
                            <label style={{ display: "block", marginBottom: 5, fontWeight: "600" }}>Profile Image</label>
                            <input type="file" accept="image/*" onChange={(e) => handleProfileImageChange(e.target.files)} />
                          </div>

                          <div style={{ marginBottom: 15 }}>
                            <label style={{ display: "block", marginBottom: 5, fontWeight: "600" }}>Current Password</label>
                            <input className="input" type="password" placeholder="Enter current password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                          </div>

                          <div style={{ marginBottom: 15 }}>
                            <label style={{ display: "block", marginBottom: 5, fontWeight: "600" }}>New Password</label>
                            <input className="input" type="password" placeholder="Enter new password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                          </div>

                          <div style={{ marginBottom: 15 }}>
                            <label style={{ display: "block", marginBottom: 5, fontWeight: "600" }}>Confirm New Password</label>
                            <input className="input" type="password" placeholder="Confirm new password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                          </div>

                          <div style={{ display: 'flex', gap: 12, marginTop: 18 }}>
                            <button type="submit" className="save-profile-btn">Save</button>
                            <button type="button" className="cancel-profile-btn" onClick={() => setIsEditingProfile(false)}>Cancel</button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}
                  {/* Permit Progress */}
                  <div className="dashboard-section">
                    <div className="dashboard-section-title">Permit Progress</div>
                    <PermitProgressRealtime />
                  </div>
                  {/* Permit Progress Bar Component (Real-time) is defined below */}
                  {/* Recent Applications Table */}
                  <div className="dashboard-section recent-applications-card">
                    <div className="recent-applications-header">
                      <div className="recent-applications-title-wrap">
                        <div className="recent-applications-icon" aria-hidden="true">
                          <i className="ti-files"></i>
                        </div>
                        <div>
                          <h3>Recent Applications</h3>
                          <p>A list of your most recent permit applications and their current status.</p>
                        </div>
                      </div>
                      <button className="recent-view-all-btn" type="button">
                        View All Applications <span aria-hidden="true">→</span>
                      </button>
                    </div>

                    {applicationsLoading ? (
                      <div className="recent-applications-state">Loading applications...</div>
                    ) : applicationsError ? (
                      <div className="recent-applications-state error">{applicationsError}</div>
                    ) : applications.length === 0 ? (
                      <div className="recent-applications-state">No applications found.</div>
                    ) : (
                      <div className="recent-applications-table-shell">
                        <div className="recent-applications-table-scroll">
                          <table className="dashboard-table recent-applications-table">
                            <thead>
                              <tr>
                                <th>Permit ID</th>
                                <th>Type</th>
                                <th>Status</th>
                                <th>Date</th>
                              </tr>
                            </thead>

                            <tbody>
                              {applications.map((app) => {
                                const appId = app._id || app.id;
                                const createdDate = app.createdAt
                                  ? new Date(app.createdAt).toLocaleDateString("en-US", {
                                      year: "numeric",
                                      month: "long",
                                      day: "numeric",
                                    })
                                  : "-";

                                return (
                                  <tr key={appId}>
                                    <td>
                                      <span className="permit-id-text">{appId}</span>
                                    </td>

                                    <td>
                                      <div className="application-type-cell">
                                        <span className="application-type-icon" aria-hidden="true">
                                          <i className="ti-file-description"></i>
                                        </span>
                                        <span>{app.applicationType || "N/A"}</span>
                                      </div>
                                    </td>

                                    <td>
                                      <span className={getStatusBadgeClass(app.status)}>
                                        <span className="status-dot" aria-hidden="true"></span>
                                        {app.status || "Pending"}
                                      </span>
                                    </td>

                                    <td>
                                      <div className="application-date-cell">
                                        <span aria-hidden="true">📅</span>
                                        <span>{createdDate}</span>
                                      </div>
                                    </td>

                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        <div className="recent-applications-footer">
                          <span>Showing 1 to {applications.length} of {applications.length} entries</span>
                          <div className="recent-pagination" aria-label="Recent applications pagination">
                            <button type="button" disabled>‹</button>
                            <button type="button" className="active">1</button>
                            <button type="button" disabled>›</button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                {/* Right column: Stats, Notifications, Recent Applications (side) */}
                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                  {/* Stats Cards */}
                  <div className="dashboard-stats-grid">
                    <div className="dashboard-stat-box">
                      Submitted Applications
                      <span className="stat-value" style={{ fontSize: "3rem" }}>{submittedApplicationsCount}</span>
                    </div>
                    <div className="dashboard-stat-box yellow">
                      Applications In Review
                      <span className="stat-value" style={{ fontSize: "3rem" }}>{applicationsInReviewCount}</span>
                    </div>
                    <div className="dashboard-stat-box green">
                      Approved Permits
                      <span className="stat-value" style={{ fontSize: "3rem" }}>{approvedPermitsCount}</span>
                    </div>
                    <div className="dashboard-stat-box red">
                      Rejected Applications
                      <span className="stat-value" style={{ fontSize: "3rem" }}>{rejectedApplicationsCount}</span>
                    </div>
                  </div>

                </div>
              </div>
            ) : renderContent()}
          </main>
        </div>
      </div>
      
    );
};

export default Account;
