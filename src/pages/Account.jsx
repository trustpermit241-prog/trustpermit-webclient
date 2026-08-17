import React, { useState, useRef, useEffect, useMemo } from "react";
import InspectionSection from "./InspectionSection";
import ProfileSection from "./ProfileSection";
import axios from "axios";
import emailjs from "@emailjs/browser";
import PermitProgressRealtime from "./PermitProgressRealtime";
import PaymentView from "./Dropdown/PaymentView";
import ApplicationFormView from "./Dropdown/ApplicationFormView";
import UploadedDocumentsView from "./Dropdown/UploadedDocumentsView";
import { getCanvasPoint } from "./signatureUtils";
import "./Account.css";
import CenteredModal from "../components/CenteredModal";

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

  // Modal state for centered popups (replaces native alerts for key flows)
  const [modal, setModal] = useState({ open: false, title: "", message: "", buttonText: "OK", variant: "default" });

  // ================= VIEW DROPDOWN STATE =================
  const [openViewDropdown, setOpenViewDropdown] = useState(null); // track which company dropdown is open

  // ================= VIEW DROPDOWN FUNCTIONS =================
  const viewApplicationForm = (applicationId) => {
    if (!applicationId) return alert("Application ID not found.");
    setModal({
      open: true,
      
      message: "",
      buttonText: "Close",
      variant: "default",
      hideActions: false,
      className: "request-details-modal",
      children: <ApplicationFormView applicationId={applicationId} />,
      onClose: () => setModal({ open: false }),
    });
  };

  const viewPayment = (payment) => {
    const paymentId = payment?._id || payment?.id || payment?.paymentId;
    if (!paymentId) return alert("Payment ID not found.");
    setModal({
      open: true,
      title: "",
      message: "",
      buttonText: "Close",
      variant: "default",
      hideActions: false,
      className: "request-details-modal",
      children: <PaymentView paymentIdProp={paymentId} paymentData={payment} />,
      onClose: () => setModal({ open: false }),
    });
  };

  const viewUploadedDocuments = (applicationId) => {
    if (!applicationId) return alert("Application ID not found.");
    setModal({
      open: true,
      
      message: "",
      buttonText: "Close",
      variant: "default",
      hideActions: false,
      className: "request-details-modal",
      children: <UploadedDocumentsView applicationId={applicationId} />,
      onClose: () => setModal({ open: false }),
    });
  };

  // ================= FETCH APPLICATIONS =================
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
        const res = await fetch(`${API_BASE_URL}/api/applications/my`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Failed to fetch applications");

        const data = await res.json();

        const apps = Array.isArray(data)
          ? data
          : Array.isArray(data.applications)
          ? data.applications
          : Array.isArray(data.data)
          ? data.data
          : [];

        if (isMounted) setApplications(apps);
      } catch (err) {
        if (isMounted) {
          setApplicationsError("Failed to fetch applications");
          setApplications([]);
        }
      } finally {
        if (isMounted) setApplicationsLoading(false);
      }
    };

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

  useEffect(() => {
    if (!activeMenu) return;

    try {
      localStorage.setItem("accountActiveMenu", activeMenu);
    } catch (e) {
      // Ignore localStorage errors.
    }
  }, [activeMenu]);

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
  const [isRenewalMode, setIsRenewalMode] = useState(false);
  const [renewalSourceApplicationId, setRenewalSourceApplicationId] = useState(null);
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
  const [businessCategoryMain, setBusinessCategoryMain] = useState("");
  const [businessSubSearch, setBusinessSubSearch] = useState("");
  const [businessSubFocused, setBusinessSubFocused] = useState(false);

  const BUSINESS_CATEGORIES = {
    "Sari-Sari Store": ["Sari-Sari Store"],
    "Food & Beverage": [
      "Carinderia",
      "Food stall",
      "Small restaurant",
      "Bakery",
      "Milk tea / coffee shop",
    ],
    "Retail": ["Retail Store", "Clothing", "General merchandise", "Mini grocery", "Hardware"],
    "Beauty & Personal Care": ["Barber shop", "Beauty salon", "Nail salon", "Massage services"],
    "Repair & Maintenance": ["Cellphone repair", "Computer repair", "Appliance repair", "Motorcycle repair"],
    "Laundry Services": ["Self-service laundry", "Wash-and-fold"],
    "Automotive Services": ["Car wash", "Vulcanizing shop", "Small auto repair"],
    "Printing & Digital Services": ["Printing shop", "Computer shop", "Internet café", "Graphic design"],
    "Online / Home-Based Business": [
      "Online seller",
      "E-commerce",
      "Home-based online shop",
      "Home bakery",
      "Homemade food",
      "Handicrafts",
      "Tailoring",
    ],
    "Professional Services": ["Accounting", "Freelance services", "Consulting", "Tutorial services"],
    "Small Trading": ["Wholesale/reselling", "Supplier", "General trading"],
    "Small Agricultural Business": ["Plant nursery", "Agricultural supplies", "Small poultry/livestock"],
    "Other Small Business": ["Other Small Business"],
  };

  const getFilteredBusinessOptions = () => {
    if (!businessCategoryMain) {
      const query = businessSubSearch.trim().toLowerCase();
      const categories = Object.keys(BUSINESS_CATEGORIES);
      if (!query) return categories;
      return categories.filter((category) => category.toLowerCase().includes(query));
    }

    const query = businessSubSearch.trim().toLowerCase();
    const options = BUSINESS_CATEGORIES[businessCategoryMain] || [];
    if (!query) return options;
    return options.filter((option) => option.toLowerCase().includes(query));
  };

  const highlightMatch = (text, query) => {
    if (!query) return text;
    const safeQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const parts = text.split(new RegExp(`(${safeQuery})`, "gi"));
    return parts.map((part, index) =>
      new RegExp(`^${safeQuery}$`, "i").test(part) ? (
        <span key={index} style={{ backgroundColor: "#fff3b0", borderRadius: 3, padding: "0 2px" }}>{part}</span>
      ) : (
        <span key={index}>{part}</span>
      )
    );
  };

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
  const [pendingProfileImage, setPendingProfileImage] = useState("");

  const [appFormStep, setAppFormStep] = useState(1);

  // Apply Permit wizard
  const [permitStep, setPermitStep] = useState(1);
  const [permitLicenseTab, setPermitLicenseTab] = useState("new");
  const [showInstructions, setShowInstructions] = useState(false);
  const [registrantName, setRegistrantName] = useState(userName);
  const [registrantPosition, setRegistrantPosition] = useState("Owner");
  const [isIndividual, setIsIndividual] = useState(true);
  const [birthDate, setBirthDate] = useState("");
  const [telephone, setTelephone] = useState("");
  const [faxNo, setFaxNo] = useState("");
  const [tin, setTin] = useState("");
  const [outsideAntipolo, setOutsideAntipolo] = useState(false);
  
  // ================= RENEWAL-SPECIFIC FIELDS =================
  const [businessPermitNo, setBusinessPermitNo] = useState("");
  const [dateOfPreviousPermit, setDateOfPreviousPermit] = useState("");
  const [dtiSecNumber, setDtiSecNumber] = useState("");
  const [leaseLandTitleNo, setLeaseLandTitleNo] = useState("");
  const [barangayClearanceFile, setBarangayClearanceFile] = useState(null);
  const [sanitaryBfpFile, setSanitaryBfpFile] = useState(null);
  const [previousMayorPermitFile, setPreviousMayorPermitFile] = useState(null);
  const [officialReceiptsFile, setOfficialReceiptsFile] = useState(null);
  
  const [showRequirements, setShowRequirements] = useState(true);

  // ================= INSPECTION =================
  const [inspections, setInspections] = useState([]);
  const [inspectionsLoading, setInspectionsLoading] = useState(true);
  const [inspectionsError, setInspectionsError] = useState(null);

  // ================= PAYMENTS =================
  const [payments, setPayments] = useState([]);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  const [paymentsError, setPaymentsError] = useState(null);

  // Payment
  const isRenewalPayment = applicationType === "Renewal" || isRenewalMode || Boolean(renewalSourceApplicationId);

  const paymentFeeBreakdown = useMemo(() => {
    if (isRenewalPayment) {
      return [
        { label: "Mayor's Permit Renewal Fee", amount: 1000.0 },
        { label: "Garbage Fee / Charges", amount: 1200.0 },
        { label: "Sanitary Inspection Fee", amount: 500.0 },
        { label: "EPO Fee", amount: 500.0 },
        { label: "Sticker Fee", amount: 100.0 },
        { label: "Local Business Tax (LBT) & Basic Tax", amount: 1000.0 },
      ];
    }

    return [
      { label: "Mayor's Permit Fee", amount: 1000.0 },
      { label: "Basic Tax (Individual)", amount: 5.0 },
      { label: "CTC - Additional Tax", amount: 100.0 },
      { label: "Delivery Vans/Trucks", amount: 750.0 },
      { label: "Permit fee on OTHER EATING ESTABLISHMENT", amount: 1000.0 },
      { label: "Barangay Clearance", amount: 3000.0 },
      { label: "Sanitary Inspection Fee", amount: 500.0 },
      { label: "EPO Fee", amount: 500.0 },
      { label: "Garbage Fees", amount: 1200.0 },
      { label: "Occupational Fee", amount: 750.0 },
      { label: "Health Fee", amount: 300.0 },
      { label: "Health Clearances", amount: 150.0 },
      { label: "CEWMO Training Fee", amount: 300.0 },
      { label: "CEWMO Inspection Fee", amount: 300.0 },
      { label: "Work Permits", amount: 150.0 },
      { label: "Sticker Fee", amount: 100.0 },
      { label: "Business Plate Fee", amount: 500.0 },
      { label: "Locational/Zoning Clearance Fee", amount: 1000.0 },
    ];
  }, [isRenewalPayment]);

  const calculatedPaymentAmount = useMemo(
    () => paymentFeeBreakdown.reduce((sum, fee) => sum + Number(fee.amount || 0), 0),
    [paymentFeeBreakdown]
  );

  const hasApprovedInspection = useMemo(
    () => Array.isArray(inspections) && inspections.some((inspection) => String(inspection.status || "").toLowerCase() === "approved"),
    [inspections]
  );

  const [paymentMethod, setPaymentMethod] = useState("");
  const [bank, setBank] = useState("");
  const [paymentAmount, setPaymentAmount] = useState(calculatedPaymentAmount);
  const [paymentReference, setPaymentReference] = useState("");
  const [gcashName, setGcashName] = useState(userName || "");
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [cardHolderName, setCardHolderName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [billingEmail, setBillingEmail] = useState(userEmail || "");
  const [billingCountry, setBillingCountry] = useState("Philippines");

  // Keep paymentAmount in sync with calculatedPaymentAmount (updates when fees or inspections change)
  useEffect(() => {
    setPaymentAmount(calculatedPaymentAmount);
  }, [calculatedPaymentAmount]);
  const [billingOpen, setBillingOpen] = useState(true);
  const [paymentMethodOpen, setPaymentMethodOpen] = useState(true);

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
      const res = await fetch(`${API_BASE_URL}/api/inspection/my`, {
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
      const res = await fetch(`${API_BASE_URL}/api/inspection/my`, {
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

  // Auto-refresh inspections periodically until an approved inspection is present.
  useEffect(() => {
    let intervalId = null;
    if (!hasApprovedInspection) {
      intervalId = setInterval(() => {
        fetchInspections();
      }, 10000); // poll every 10s
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [hasApprovedInspection]);

  // ================= FETCH PAYMENTS =================
  const fetchPayments = async () => {
    setPaymentsLoading(true);
    setPaymentsError(null);

    const userEmail = localStorage.getItem("email") || userEmail;
    if (!userEmail) {
      setPayments([]);
      setPaymentsError("Not logged in. Please sign in to view your payments.");
      setPaymentsLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/payments`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` },
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || errData.msg || "Failed to fetch payments.");
      }

      const data = await res.json();
      if (Array.isArray(data.payments)) {
        setPayments(data.payments);
      } else {
        setPayments([]);
        setPaymentsError("No payment data returned from server.");
      }
    } catch (err) {
      console.error("Fetch payments error:", err);
      setPayments([]);
      setPaymentsError(err.message || "Failed to fetch payments.");
    } finally {
      setPaymentsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);


  useEffect(() => {
    if (activeMenu === "Application Forms") {
      setActiveMenu("Apply Permit");
    }
  }, [activeMenu]);

  useEffect(() => {
    if (activeMenu === "Apply Permit" && !renewalSourceApplicationId) {
      setIsRenewalMode(false);
      if (applicationType !== "New Application") {
        setApplicationType("New Application");
      }
    }
  }, [activeMenu, renewalSourceApplicationId, applicationType]);

  const notificationItems = [
    ...inspections.map((inspection) => ({
      type: "inspection",
      status: inspection.status || "Pending",
      message: `Inspection ${inspection.status || "scheduled"} for ${inspection.date ? new Date(inspection.date).toLocaleDateString() : "Unknown date"}${inspection.type ? ` (${inspection.type})` : ""}`,
      timestamp: inspection.updatedAt || inspection.createdAt || inspection.date || "",
    })),
    ...applications.map((app) => ({
      type: "application",
      status: app.status || "Pending",
      message: `${app.applicationType || "Application"} ${app.status || "updated"} for Permit #${app.permitId || app._id || app.id}`,
      timestamp: app.updatedAt || app.createdAt || "",
    })),
    ...payments.map((payment) => ({
      type: "payment",
      status: payment.status || "Pending",
      message: `Payment ${payment.status || "pending"} for Permit #${payment.permitId || payment._id || payment.id}`,
      timestamp: payment.updatedAt || payment.createdAt || "",
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

  const startDrawing = (event) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const point = getCanvasPoint(event, canvas);
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
    setIsDrawing(true);
  };

  const draw = (event) => {
    if (!isDrawing || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const point = getCanvasPoint(event, canvas);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    try {
      const canvas = canvasRef.current;
      if (canvas) {
        localStorage.setItem(`${APPLICATION_DRAFT_KEY}_signature`, canvas.toDataURL("image/png"));
      }
    } catch (error) {
      console.error("Failed to save signature draft:", error);
    }
  };

  const restoreSignatureDraft = () => {
    try {
      const savedSignature = localStorage.getItem(`${APPLICATION_DRAFT_KEY}_signature`);
      const canvas = canvasRef.current;
      if (!savedSignature || !canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
      img.src = savedSignature;
    } catch (error) {
      console.error("Failed to restore signature draft:", error);
    }
  };

  const clearSignature = () => {
    if (!canvasRef.current) return;

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    try {
      localStorage.removeItem(`${APPLICATION_DRAFT_KEY}_signature`);
    } catch (error) {
      console.error("Failed to clear signature draft:", error);
    }
  };

  const [submittingApp, setSubmittingApp] = useState(false);

  const [missingFields, setMissingFields] = useState([]);
  const [isDraftHydrated, setIsDraftHydrated] = useState(false);

  const APPLICATION_DRAFT_KEY = "permitApplicationDraft";
  const UPLOADED_FILES_KEY = "permitUploadedFiles";

  const readApplicationDraft = () => {
    try {
      const raw = localStorage.getItem(APPLICATION_DRAFT_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (error) {
      console.error("Failed to read permit draft:", error);
      return {};
    }
  };

  const fileToDataUrl = (file) =>
    new Promise((resolve, reject) => {
      if (!file) {
        resolve("");
        return;
      }

      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("Failed to read uploaded file"));
      reader.readAsDataURL(file);
    });

  const saveUploadedFilesState = async (files) => {
    try {
      const serializable = {};

      for (const [docName, file] of Object.entries(files || {})) {
        if (!file) continue;

        const dataUrl = await fileToDataUrl(file);
        serializable[docName] = {
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified,
          dataUrl,
        };
      }

      localStorage.setItem(UPLOADED_FILES_KEY, JSON.stringify(serializable));
    } catch (error) {
      console.error("Failed to save uploaded files:", error);
    }
  };

  const readUploadedFilesState = () => {
    try {
      const raw = localStorage.getItem(UPLOADED_FILES_KEY);
      if (!raw) return {};

      const parsed = JSON.parse(raw);
      const restored = {};

      Object.entries(parsed || {}).forEach(([docName, info]) => {
        if (!info || !info.dataUrl) return;

        try {
          const [header, body] = String(info.dataUrl).split(",");
          const mimeMatch = header.match(/:(.*?);/);
          const mime = mimeMatch ? mimeMatch[1] : info.type || "application/octet-stream";
          const binary = atob(body || "");
          const byteArray = new Uint8Array(binary.length);

          for (let i = 0; i < binary.length; i += 1) {
            byteArray[i] = binary.charCodeAt(i);
          }

          restored[docName] = new File([byteArray], info.name || docName, {
            type: mime,
            lastModified: info.lastModified || Date.now(),
          });
        } catch (error) {
          console.error("Failed to restore uploaded file:", docName, error);
        }
      });

      return restored;
    } catch (error) {
      console.error("Failed to read uploaded files:", error);
      return {};
    }
  };

  const saveCurrentApplicationDraft = () => {
    try {
      const draft = {
        businessName,
        applicationType,
        isRenewalMode,
        renewalSourceApplicationId,
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
        applicantEmail,
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
        businessCategoryMain,
        registrantName,
        registrantPosition,
        isIndividual,
        birthDate,
        telephone,
        faxNo,
        tin,
        outsideAntipolo,
        permitStep,
        permitLicenseTab,
        paypalMethod: paymentMethod,
      };

      localStorage.setItem(APPLICATION_DRAFT_KEY, JSON.stringify(draft));
    } catch (error) {
      console.error("Failed to save permit draft:", error);
    }
  };

  const clearApplicationDraft = () => {
    try {
      localStorage.removeItem(APPLICATION_DRAFT_KEY);
      localStorage.removeItem(`${APPLICATION_DRAFT_KEY}_signature`);
      localStorage.removeItem(UPLOADED_FILES_KEY);
    } catch (error) {
      console.error("Failed to clear permit draft:", error);
    }
  };

  useEffect(() => {
    const savedDraft = readApplicationDraft();
    const restoredFiles = readUploadedFilesState();

    if (savedDraft && Object.keys(savedDraft).length > 0) {
      setBusinessName(savedDraft.businessName ?? "");
      setApplicationType(savedDraft.applicationType ?? "New Application");
      setIsRenewalMode(Boolean(savedDraft.isRenewalMode));
      setRenewalSourceApplicationId(savedDraft.renewalSourceApplicationId ?? null);
      setProjectType(savedDraft.projectType ?? "Residential");
      setZoneType(savedDraft.zoneType ?? "Residential Zone");
      setFirstName(savedDraft.firstName ?? "");
      setMiddleName(savedDraft.middleName ?? "");
      setLastName(savedDraft.lastName ?? "");
      setSuffixName(savedDraft.suffixName ?? "");
      setGender(savedDraft.gender ?? "");
      setCivilStatus(savedDraft.civilStatus ?? "");
      setNationality(savedDraft.nationality ?? "");
      setContactNumber(savedDraft.contactNumber ?? "");
      setApplicantEmail(savedDraft.applicantEmail ?? "");
      setProvince(savedDraft.province ?? "");
      setCity(savedDraft.city ?? "");
      setBarangay(savedDraft.barangay ?? "");
      setSubdivision(savedDraft.subdivision ?? "");
      setStreet(savedDraft.street ?? "");
      setBuilding(savedDraft.building ?? "");
      setHouseNo(savedDraft.houseNo ?? "");
      setBlock(savedDraft.block ?? "");
      setLot(savedDraft.lot ?? "");
      setLandmark(savedDraft.landmark ?? "");
      setBusinessArea(savedDraft.businessArea ?? "");
      setMalePersonnel(Number(savedDraft.malePersonnel ?? 0));
      setFemalePersonnel(Number(savedDraft.femalePersonnel ?? 0));
      setOwnershipType(savedDraft.ownershipType ?? "");
      setLineOfBusiness(savedDraft.lineOfBusiness ?? "");
      setBusinessCategoryMain(savedDraft.businessCategoryMain ?? "");
      setRegistrantName(savedDraft.registrantName ?? userName);
      setRegistrantPosition(savedDraft.registrantPosition ?? "Owner");
      setIsIndividual(Boolean(savedDraft.isIndividual));
      setBirthDate(savedDraft.birthDate ?? "");
      setTelephone(savedDraft.telephone ?? "");
      setFaxNo(savedDraft.faxNo ?? "");
      setTin(savedDraft.tin ?? "");
      setOutsideAntipolo(Boolean(savedDraft.outsideAntipolo));
      setPermitStep(Number(savedDraft.permitStep ?? 1));
      setPermitLicenseTab(savedDraft.permitLicenseTab ?? "new");
      setPaymentMethod(savedDraft.paypalMethod ?? "");
    }

    setUploadedFiles(restoredFiles);
    setDocsUploaded(Object.keys(restoredFiles || {}).length > 0);
    setIsDraftHydrated(true);
  }, []);

  useEffect(() => {
    if (!isDraftHydrated) return;
    restoreSignatureDraft();
  }, [isDraftHydrated]);

  useEffect(() => {
    if (!isDraftHydrated) return;
    saveCurrentApplicationDraft();
  }, [
    businessName,
    applicationType,
    isRenewalMode,
    renewalSourceApplicationId,
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
    applicantEmail,
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
    businessCategoryMain,
    registrantName,
    registrantPosition,
    isIndividual,
    birthDate,
    telephone,
    faxNo,
    tin,
    outsideAntipolo,
    permitStep,
    permitLicenseTab,
    paymentMethod,
    isDraftHydrated,
  ]);

  useEffect(() => {
    if (!isDraftHydrated) return;
    saveUploadedFilesState(uploadedFiles);
  }, [uploadedFiles, isDraftHydrated]);

  // Step 1: Submit application form (no documents)
  const submitApplication = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setModal({
        open: true,
        title: "Authentication Required",
        message: "Please log in to submit your application.",
        buttonText: "OK",
        variant: "error",
      });
      return;
    }

    // ================= COMPREHENSIVE VALIDATION =================
    const validationErrors = validateApplicationFields();

    if (validationErrors.length > 0) {
      setModal({
        open: true,
        title: "Validation Failed",
        message: `Please correct the following errors:\n\n${validationErrors.join("\n\n")}`,
        buttonText: "OK",
        variant: "error",
      });
      return;
    }

    setMissingFields([]);
    setSubmittingApp(true);

    const signatureData = canvasRef.current?.toDataURL?.();

    // IMPORTANT:
    // Send nested fields so it matches Application.js and Staff Requests.jsx.
    // This fixes N/A values for applicant, address, contact, personalInfo, and businessInfo.
    const payload = {
      applicationType,
      projectType,
      zoneType,
      businessName,

      taxpayer: {
        registrantName,
        registrantPosition,
        ownershipType,
      },

      applicant: {
        firstName,
        middleName,
        lastName,
        suffixName,
      },

      personalInfo: {
        birthDate,
        gender,
        civilStatus,
        nationality,
      },

      contact: {
        telephone,
        mobile: contactNumber,
        contactNumber,
        fax: faxNo,
        email: applicantEmail,
        tin,
      },

      address: {
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
      },

      businessInfo: {
        businessName,
        projectType,
        zoneType,
        area: businessArea,
        businessArea,
        malePersonnel: Number(malePersonnel) || 0,
        femalePersonnel: Number(femalePersonnel) || 0,
        totalPersonnel: Number(totalPersonnel) || 0,
        ownershipType,
        lineOfBusiness,
      },

      // Kept also for pages that already read businessDetails.
      businessDetails: {
        businessName,
        projectType,
        zoneType,
        businessArea,
        area: businessArea,
        malePersonnel: Number(malePersonnel) || 0,
        femalePersonnel: Number(femalePersonnel) || 0,
        totalPersonnel: Number(totalPersonnel) || 0,
        ownershipType,
        lineOfBusiness,
      },

      signature: signatureData,
    };

    console.log("APPLICATION PAYLOAD:", payload);

    try {
      const res = await fetch(`${API_BASE_URL}/api/applications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || "Failed to submit application.");
      }

      const newApplication = data.application || data.data || data;
      setApplicationId(newApplication._id || newApplication.id);

      setModal({
        open: true,
        title: "Application Submitted",
        message: "Application submitted successfully! Please upload your required documents.",
        buttonText: "OK",
        variant: "success",
      });
      clearApplicationDraft();
      setDocsUploaded(false);
      setPermitStep(5);
    } catch (err) {
      console.error("Submit application error:", err);
      setModal({
        open: true,
        title: "Submission Failed",
        message: err.message || "Failed to submit application.",
        buttonText: "OK",
        variant: "error",
      });
    } finally {
      setSubmittingApp(false);
    }
  };

  const loadRenewalApplication = async (applicationId) => {
    if (!applicationId) {
      setModal({
        open: true,
        title: "Renewal Failed",
        message: "Application ID not found.",
        buttonText: "OK",
        variant: "error",
      });
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setModal({
        open: true,
        title: "Renewal Failed",
        message: "Please log in to renew an application.",
        buttonText: "OK",
        variant: "error",
      });
      return;
    }

    try {
      const res = await axios.get(`${API_BASE_URL}/api/applications/${applicationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const app = res.data?.application || res.data?.data || res.data;
      if (!app) {
        throw new Error("Unable to load application details.");
      }

      setIsRenewalMode(true);
      setRenewalSourceApplicationId(applicationId);
      setApplicationType("Renewal");
      setPermitStep(1);
      setPermitLicenseTab("new");
      setActiveMenu("Apply Permit");
      setApplicationId(null);
      setUploadedFiles({});
      setDocsUploaded(false);
      setMissingFields([]);
      setShowRequirements(true);
      clearSignature();

      setBusinessName(app.businessName || app.businessInfo?.businessName || "");
      setLineOfBusiness(app.businessInfo?.lineOfBusiness || app.lineOfBusiness || "");
      setProjectType(app.projectType || app.businessInfo?.projectType || "Residential");
      setZoneType(app.zoneType || app.businessInfo?.zoneType || "Residential Zone");
      setBusinessArea(app.businessInfo?.businessArea || app.businessArea || "");
      setMalePersonnel(app.businessInfo?.malePersonnel || app.malePersonnel || 0);
      setFemalePersonnel(app.businessInfo?.femalePersonnel || app.femalePersonnel || 0);
      setOwnershipType(app.businessInfo?.ownershipType || app.taxpayer?.ownershipType || "");
      setRegistrantName(app.taxpayer?.registrantName || "");
      setRegistrantPosition(app.taxpayer?.registrantPosition || "Owner");

      setFirstName(app.applicant?.firstName || "");
      setMiddleName(app.applicant?.middleName || "");
      setLastName(app.applicant?.lastName || "");
      setSuffixName(app.applicant?.suffixName || app.applicant?.suffix || "");

      setGender(app.personalInfo?.gender || "");
      setCivilStatus(app.personalInfo?.civilStatus || "");
      setNationality(app.personalInfo?.nationality || "");

      setContactNumber(app.contact?.mobile || app.contact?.contactNumber || "");
      setTelephone(app.contact?.telephone || "");
      setFaxNo(app.contact?.fax || "");
      setApplicantEmail(app.contact?.email || "");
      setTin(app.contact?.tin || "");

      setProvince(app.address?.province || "");
      setCity(app.address?.city || "");
      setBarangay(app.address?.barangay || "");
      setSubdivision(app.address?.subdivision || "");
      setStreet(app.address?.street || "");
      setBuilding(app.address?.building || "");
      setHouseNo(app.address?.houseNo || "");
      setBlock(app.address?.block || "");
      setLot(app.address?.lot || "");
      setLandmark(app.address?.landmark || "");
      setOutsideAntipolo(Boolean(app.address?.outsideAntipolo));
    } catch (err) {
      console.error("Renewal load error:", err);
      setModal({
        open: true,
        title: "Renewal Failed",
        message: err.response?.data?.message || err.message || "Failed to load application for renewal.",
        buttonText: "OK",
        variant: "error",
      });
    }
  };

  // Step 2: Upload documents after application is created
  const uploadDocuments = async () => {
    if (!applicationId) {
      setModal({
        open: true,
        title: "Missing Application",
        message: "No application ID. Please submit the application form first.",
        buttonText: "OK",
        variant: "error",
        className: "custom-upload-modal",
      });
      return;
    }

    // ================= VALIDATE DOCUMENTS =================
    const docErrors = validateUploadedDocuments();

    if (docErrors.length > 0) {
      setModal({
        open: true,
        title: "Document Validation Failed",
        message: `Please correct the following issues:\n\n${docErrors.join("\n\n")}`,
        buttonText: "OK",
        variant: "error",
        className: "custom-upload-modal",
      });
      return;
    }

    setUploadingDocs(true);

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setModal({
          open: true,
          title: "Authentication Required",
          message: "Please log in again before uploading documents.",
          buttonText: "OK",
          variant: "error",
          className: "custom-upload-modal",
        });
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

      const res = await fetch(`${API_BASE_URL}/api/applications/upload-documents`, {
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
      clearApplicationDraft();
      setModal({
        open: true,
        title: "Upload Successful",
        message: "Documents uploaded successfully! Your application is now ready for staff review.",
        buttonText: "OK",
        variant: "success",
        className: "custom-upload-modal",
      });

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
      setIsRenewalMode(false);
      setRenewalSourceApplicationId(null);
    //  setApplicationId(null);
      setPermitStep(1);
    } catch (err) {
      console.error("Upload documents error:", err);
      setModal({
        open: true,
        title: "Upload Failed",
        message: err.message || "Failed to upload documents",
        buttonText: "OK",
        variant: "error",
        className: "custom-upload-modal",
      });
    } finally {
      setUploadingDocs(false);
    }
  };

  const handleFileUpload = (docName, files) => {
    if (!files || files.length === 0) return;

    const file = files[0];

    const validation = validateFile(file);
    if (!validation.valid) {
      setModal({
        open: true,
        title: "File Upload Error",
        message: validation.error,
        buttonText: "OK",
        variant: "error",
      });
      return;
    }

    setUploadedFiles((prev) => {
      const nextFiles = {
        ...prev,
        [docName]: file,
      };
      saveUploadedFilesState(nextFiles);
      return nextFiles;
    });

    setModal({
      open: true,
      title: "File Uploaded",
      message: `"${file.name}" has been successfully uploaded for "${docName}".`,
      buttonText: "OK",
      variant: "success",
    });
  };

  // ================= REQUIRED DOCUMENTS =================
  const getRequiredDocuments = () => {
    if (applicationType === "New Application") {
      let docs = [
        "DTI/SEC Registration",
        "Contract OF LEASE IF RENTING & COPY OF LESSOR'S PERMIT IF OWNED TAX DECLARATION OF LAND AND BUILDING",
        "PROPERTY TAX RECEIPT OF LAND AND BUILDING",
        "PICTURE OF OWNER",
        "PANORAMIC PICTURE OF THE ESTABLISHMENT",
        "PICTURE OF THE ESTABLISHMENT'S SHOWING INSTALLED CCTV CAMERA",
        "LOCATIONAL SKETCH",
        "PROFILE OF G-CASH/PAYMAYA",
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

  // ================= VALIDATION FUNCTIONS =================
  
  /**
   * Check if the signature canvas has actual content (is not empty)
   */
  const isSignatureValid = () => {
    if (!canvasRef.current) return false;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Check if any pixel has non-zero alpha (is not fully transparent)
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] > 0) return true; // Found non-transparent pixel
    }
    return false; // Canvas is empty
  };

  /**
   * Validate a single file (type and size)
   */
  const validateFile = (file) => {
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
    const ALLOWED_TYPES = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/jpg",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `File "${file.name}" exceeds maximum size of 10 MB (Current: ${(file.size / 1024 / 1024).toFixed(2)} MB)`,
      };
    }

    // Check file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      const extension = file.name.split(".").pop().toUpperCase();
      return {
        valid: false,
        error: `File type ".${extension}" is not allowed. Accepted: PDF, JPG, PNG, DOC, DOCX, XLS, XLSX`,
      };
    }

    return { valid: true, error: null };
  };

  /**
   * Validate all uploaded documents before submission
   */
  const validateUploadedDocuments = () => {
    const errors = [];

    // Check all required documents are uploaded
    const requiredDocs = getRequiredDocuments();
    const missingDocs = requiredDocs.filter((doc) => !uploadedFiles[doc]);

    if (missingDocs.length > 0) {
      errors.push(`Missing documents:\n- ${missingDocs.join("\n- ")}`);
    }

    // Validate each uploaded file
    Object.entries(uploadedFiles).forEach(([docName, file]) => {
      if (file) {
        const validation = validateFile(file);
        if (!validation.valid) {
          errors.push(validation.error);
        }
      }
    });

    return errors;
  };

  /**
   * Validate application form fields with detailed errors
   */
  const validatePermitStepFields = (step) => {
    const stepFields = {
      1: [
        { key: "firstName", label: "First Name", value: firstName },
        { key: "lastName", label: "Last Name", value: lastName },
        { key: "contactNumber", label: "Contact Number", value: contactNumber },
        { key: "applicantEmail", label: "Email Address", value: applicantEmail },
        { key: "province", label: "Province", value: province },
        { key: "city", label: "City", value: city },
        { key: "barangay", label: "Barangay", value: barangay },
        { key: "street", label: "Street", value: street },
      ],
      2: [
        // Taxpayer Information
        { key: "businessName", label: "Business Name", value: businessName, section: "Business Information" },
        { key: "lineOfBusiness", label: "Line of Business", value: lineOfBusiness, section: "Business Information" },
        { key: "businessArea", label: "Business Area (sqm)", value: businessArea, section: "Business Information" },
        { key: "ownershipType", label: "Ownership Type", value: ownershipType, section: "Business Information" },
        { key: "street", label: "Business Address", value: street, section: "Business Information" },
        { key: "city", label: "City / Municipality", value: city, section: "Business Information" },
        { key: "province", label: "Province", value: province, section: "Business Information" },
        { key: "barangay", label: "Barangay", value: barangay, section: "Business Information" },
        { key: "landmark", label: "Landmark / Area", value: landmark, section: "Business Information" },
        // Owner / Applicant Details
        { key: "applicantFirstName", label: "First Name", value: firstName, section: "Owner / Applicant Details" },
        { key: "applicantLastName", label: "Last Name", value: lastName, section: "Owner / Applicant Details" },
        { key: "applicantContactNumber", label: "Contact Number", value: contactNumber, section: "Owner / Applicant Details" },
        { key: "applicantEmail", label: "Email Address", value: applicantEmail, section: "Owner / Applicant Details" },
        { key: "tin", label: "TIN", value: tin, section: "Owner / Applicant Details" },
        { key: "registrantPosition", label: "Position", value: registrantPosition, section: "Owner / Applicant Details" },
        ...(applicationType === "Renewal" ? [
          // Additional Renewal Details
          { key: "businessPermitNo", label: "Business Permit No.", value: businessPermitNo, section: "Additional Renewal Details" },
          { key: "dateOfPreviousPermit", label: "Date of Previous Permit", value: dateOfPreviousPermit, section: "Additional Renewal Details" },
          { key: "dtiSecNumber", label: "DTI / SEC Number", value: dtiSecNumber, section: "Additional Renewal Details" },
          { key: "leaseLandTitleNo", label: "Lease / Land Title No.", value: leaseLandTitleNo, section: "Additional Renewal Details" },
          // Clearances / Attachments
          { key: "barangayClearanceFile", label: "Barangay Clearance", value: barangayClearanceFile, section: "Clearances / Attachments" },
          { key: "sanitaryBfpFile", label: "Sanitary / BFP", value: sanitaryBfpFile, section: "Clearances / Attachments" },
          { key: "previousMayorPermitFile", label: "Previous Mayor's Permit", value: previousMayorPermitFile, section: "Clearances / Attachments" },
          { key: "officialReceiptsFile", label: "Official Receipts", value: officialReceiptsFile, section: "Clearances / Attachments" },
        ] : []),
      ],
      3: [
        { key: "signature", label: "Applicant Signature", value: isSignatureValid() ? "filled" : "" },
      ],
    };

    const required = stepFields[step] || [];
    const missing = required.filter(
      (field) => !field.value || String(field.value).trim() === ""
    );

    return missing;
  };

  const showStepValidationModal = (step) => {
    const missing = validatePermitStepFields(step);
    
    // Group fields by section
    const groupedBySection = {};
    missing.forEach(field => {
      const section = field.section || "Required Fields";
      if (!groupedBySection[section]) {
        groupedBySection[section] = [];
      }
      groupedBySection[section].push(field.label);
    });

    // Build message with sections
    let messageText = "Please complete all required fields before proceeding:\n\n";
    let fieldCount = 1;
    
    Object.entries(groupedBySection).forEach(([section, fields]) => {
      messageText += `📋 ${section}\n`;
      fields.forEach(field => {
        messageText += `   ${fieldCount}. ${field}\n`;
        fieldCount++;
      });
      messageText += "\n";
    });

    setModal({
      open: true,
      title: "⚠️ Incomplete Information",
      message: messageText,
      buttonText: "Got it, let me fill these fields",
      variant: "error",
    });

    setMissingFields(missing.map((field) => field.key));
  };

  const handlePermitNext = () => {
    const missing = validatePermitStepFields(permitStep);

    if (missing.length > 0) {
      showStepValidationModal(permitStep);
      return;
    }

    setMissingFields([]);
    setPermitStep((prev) => Math.min(prev + 1, 3));
  };

  const validateApplicationFields = () => {
    const errors = [];

    // Check signature
    if (!isSignatureValid()) {
      errors.push("Signature is required. Please sign in the signature box.");
    }

    // Check required text fields
    const requiredFields = [
      { key: "businessName", label: "Business Name", value: businessName },
      { key: "firstName", label: "First Name", value: firstName },
      { key: "lastName", label: "Last Name", value: lastName },
      { key: "contactNumber", label: "Contact Number", value: contactNumber },
      { key: "applicantEmail", label: "Email Address", value: applicantEmail },
      { key: "province", label: "Province", value: province },
      { key: "city", label: "City", value: city },
      { key: "barangay", label: "Barangay", value: barangay },
      { key: "street", label: "Street", value: street },
    ];

    const missingFields = requiredFields.filter(
      (field) => !field.value || String(field.value).trim() === ""
    );

    if (missingFields.length > 0) {
      errors.push(
        `Missing required fields:\n- ${missingFields.map((f) => f.label).join("\n- ")}`
      );
    }

    // Validate email format
    if (applicantEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(applicantEmail)) {
      errors.push("Invalid email format");
    }

    // Validate contact number (basic validation)
    if (contactNumber && !/^\d{7,11}$/.test(contactNumber.replace(/\D/g, ""))) {
      errors.push("Contact number must be between 7 and 11 digits");
    }

    // Validate business area (must be positive number if provided)
    if (businessArea && isNaN(businessArea)) {
      errors.push("Business area must be a valid number");
    }

    // Validate personnel numbers
    const maleNum = Number(malePersonnel) || 0;
    const femaleNum = Number(femalePersonnel) || 0;
    if (maleNum < 0 || femaleNum < 0) {
      errors.push("Personnel numbers cannot be negative");
    }

    return errors;
  };

  // helper actions
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("name");
    localStorage.removeItem("email");
    clearApplicationDraft();
    window.location.reload();
  };

  const saveDraft = () => {
    saveCurrentApplicationDraft();
    setModal({
      open: true,
      title: "Draft Saved",
      message: "Your form progress has been saved and will still be here when you return.",
      buttonText: "OK",
      variant: "success",
    });
  };

  const viewCompany = (name) => {
    alert(`Viewing details for ${name}`);
  };

  const downloadReceipt = (details) => {
    try {
      const paymentData = details || {};
      const reference = paymentData.reference || paymentData.paymentReference || paymentReference || `TP-${Date.now()}`;
      const date = paymentData.timestamp || paymentData.createdAt || paymentData.date
        ? new Date(paymentData.timestamp || paymentData.createdAt || paymentData.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
        : new Date().toLocaleDateString();

      const matchedApplication = applications.find((app) => {
        if (!app) return false;
        return String(app._id || app.id) === String(paymentData.applicationId || "");
      });

      const clientName = paymentData.name || localStorage.getItem("name") || "__________________________";
      const businessName = matchedApplication?.businessName || paymentData.businessName || "_______________________";
      const address = matchedApplication?.address
        ? [
            matchedApplication.address.street,
            matchedApplication.address.barangay,
            matchedApplication.address.city,
            matchedApplication.address.province,
          ]
            .filter(Boolean)
            .join(", ")
        : paymentData.address || "___________________________";
      const contact =
        matchedApplication?.contact?.contactNumber ||
        matchedApplication?.contactNumber ||
        paymentData.contact ||
        localStorage.getItem("contactNumber") ||
        "_________________________";
      const method = paymentData.paymentMethod || paymentMethod || "";
      const formattedMethod = method === "gcash" ? "GCash" : method === "card" ? "Bank/Card" : method;
      const amount = Number(paymentData.amount || paymentAmount || calculatedPaymentAmount || 0);

      const breakdownRows = paymentFeeBreakdown
        .map((fee, index) => `<tr><td>${index + 1}</td><td>${fee.label}</td><td style="text-align:right">₱${Number(fee.amount || 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td></tr>`)
        .join("");

      const html = `
        <!doctype html>
        <html>
        <head>
          <meta charset="utf-8" />
          <title>TRUSTPERMIT - Payment Receipt</title>
          <style>
            * { box-sizing: border-box; }
            body {
              margin: 0;
              padding: 32px;
              font-family: Arial, Helvetica, sans-serif;
              color: #111827;
              background: #e5e7eb;
            }
            .receipt-card {
              max-width: 760px;
              margin: 0 auto;
              background: #ffffff;
              border-radius: 20px;
              padding: 34px 36px 30px;
              box-shadow: 0 10px 30px rgba(17, 24, 39, 0.12);
            }
            .success-check {
              width: 88px;
              height: 88px;
              border-radius: 50%;
              background: #20c05c;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 0 auto 18px;
              color: white;
              font-size: 42px;
              font-weight: 700;
            }
            .title {
              text-align: center;
              font-size: 2.1rem;
              font-weight: 700;
              margin: 0 0 8px;
            }
            .subtitle {
              text-align: center;
              margin: 0;
              color: #6b7280;
              font-size: 1rem;
            }
            .subtitle span {
              font-weight: 700;
            }
            .divider {
              border-top: 2px dashed #cbd5e1;
              margin: 24px 0 22px;
            }
            .receipt-table {
              width: 100%;
              border-collapse: collapse;
            }
            .receipt-table th,
            .receipt-table td {
              padding: 10px 6px;
              text-align: left;
              border-bottom: 1px solid transparent;
            }
            .receipt-table th {
              font-size: 0.95rem;
              color: #374151;
              font-weight: 700;
            }
            .receipt-table td:nth-child(3),
            .receipt-table th:nth-child(3) {
              text-align: right;
            }
            .receipt-table .desc {
              display: block;
              color: #6b7280;
              font-size: 0.86rem;
              margin-top: 2px;
            }
            .summary-box {
              margin-top: 24px;
              background: #f3f4f6;
              border-radius: 12px;
              padding: 18px 20px;
            }
            .summary-row {
              display: flex;
              justify-content: space-between;
              align-items: center;
              gap: 16px;
              margin: 10px 0;
              font-size: 1rem;
            }
            .summary-row.total {
              font-size: 1.25rem;
              font-weight: 800;
              margin-top: 14px;
            }
            .summary-row .label {
              color: #4b5563;
            }
            .summary-row .value {
              color: #111827;
              font-weight: 700;
            }
            .summary-row .value.total-value {
              color: #111827;
              font-size: 1.35rem;
            }
            .button-wrap {
              margin-top: 26px;
              display: grid;
              gap: 14px;
            }
            .btn-primary {
              background: linear-gradient(135deg, #7c3aed, #6d28d9);
              color: #fff;
              border: none;
              padding: 16px 18px;
              border-radius: 12px;
              font-size: 1.1rem;
              font-weight: 700;
              cursor: pointer;
            }
            .btn-secondary {
              background: #ffffff;
              border: 1px solid #d1d5db;
              color: #111827;
              padding: 14px 18px;
              border-radius: 12px;
              font-size: 1.02rem;
              font-weight: 700;
              cursor: pointer;
            }
            .meta {
              color: #6b7280;
              font-size: 0.92rem;
            }
          </style>
        </head>
        <body>
          <div class="receipt-card">
            <div class="success-check">✓</div>
            <h1 class="title">Payment Successful</h1>
            <p class="subtitle">Order number: <span>${reference}</span></p>
            <p class="subtitle">Order date: ${date}</p>

            <div class="divider"></div>

            <table class="receipt-table">
              <thead>
                <tr>
                  <th style="width: 10%;">№</th>
                  <th>Item</th>
                  <th style="width: 22%;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${breakdownRows}
              </tbody>
            </table>

            <div class="summary-box">
              <div class="summary-row total">
                <span class="label">Total</span>
                <span class="value total-value">₱${amount.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div class="summary-row">
                <span class="label">Payment method</span>
                <span class="value">${formattedMethod || "Payment Method"}</span>
              </div>
              <div class="summary-row">
                <span class="label">Tax</span>
                <span class="value">₱0.00</span>
              </div>
            </div>

            <div class="button-wrap">
              <button class="btn-primary" type="button" onclick="try { if (window.opener && !window.opener.closed) { window.opener.location.href='/'; } else { window.location.href='/'; } } catch (e) { window.location.href='/'; } finally { window.close(); }">Back to Home Page</button>
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

  const compressImageToDataUrl = (file, maxWidth = 900, quality = 0.72) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        const img = new Image();

        img.onload = () => {
          const canvas = document.createElement("canvas");
          const scale = Math.min(1, maxWidth / Math.max(img.width, 1));
          canvas.width = Math.max(1, Math.round(img.width * scale));
          canvas.height = Math.max(1, Math.round(img.height * scale));

          const ctx = canvas.getContext("2d");
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          const mimeType = file.type === "image/png" ? "image/png" : "image/jpeg";
          const dataUrl = canvas.toDataURL(mimeType, quality);
          resolve(dataUrl);
        };

        img.onerror = () => reject(new Error("Failed to load image."));
        img.src = reader.result;
      };

      reader.onerror = () => reject(new Error("Failed to read image file."));
      reader.readAsDataURL(file);
    });
  };

  const handleProfileImageChange = async (files) => {
    const file = files && files[0];
    if (!file) {
      setPendingProfileImage("");
      return;
    }

    try {
      const compressedImage = await compressImageToDataUrl(file);
      setPendingProfileImage(compressedImage || "");
    } catch (error) {
      console.error("Profile image compression failed:", error);
      setPendingProfileImage("");
      setModal({
        open: true,
        title: "Image Error",
        message: "Unable to process this image. Please try a smaller photo.",
        buttonText: "OK",
        variant: "error",
      });
    }
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
    const releaseDate = payment.permitReleasedAt ? new Date(payment.permitReleasedAt) : payment.updatedAt ? new Date(payment.updatedAt) : payment.createdAt ? new Date(payment.createdAt) : null;
    const expiryDateFromApp = app.expiryDate ? new Date(app.expiryDate) : null;
    const expiryDate = expiryDateFromApp
      ? expiryDateFromApp
      : releaseDate
      ? new Date(releaseDate.setFullYear(releaseDate.getFullYear() + 1))
      : null;
    const isExpired = expiryDate ? expiryDate < new Date() : false;
    const isRenewal =
      String(app.applicationType || "").toLowerCase() === "renewal" ||
      Boolean(app.previousApplicationId);

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
      applicationType: app.applicationType || "New Application",
      previousApplicationId: app.previousApplicationId || null,
      expiryDate,
      isExpired,
      isRenewal,
      permitStatus: payment.permitReleased ? "Active" : "Pending Release",
      paymentStatus: payment.status || "paid",
      permitReleased: Boolean(payment.permitReleased),
      releasedAt: releaseDate,
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

  const hasReleasedPermit = userReleasedPermits.length > 0;

  const currentPaymentApplication = useMemo(() => {
    if (!applications || !applications.length) return null;

    if (applicationId) {
      return applications.find((app) => String(app._id || app.id) === String(applicationId)) || null;
    }

    return applications.find((app) => {
      const status = String(app.status || "").toLowerCase();
      return app && app._id && status !== "released" && status !== "rejected";
    }) || null;
  }, [applications, applicationId]);

  const hasCurrentApplicationReleased = useMemo(() => {
    if (!currentPaymentApplication) return false;
    const currentAppId = String(currentPaymentApplication._id || currentPaymentApplication.id || "");
    return userReleasedPermits.some((permit) => String(permit.applicationId || permit.permitId || "") === currentAppId);
  }, [currentPaymentApplication, userReleasedPermits]);

  const hasReleaseWithoutCurrentApplication = !currentPaymentApplication && hasReleasedPermit;

  const canViewRenewalFees = !hasCurrentApplicationReleased && !hasReleaseWithoutCurrentApplication && (isRenewalPayment || hasApprovedInspection);
  const canProceedToPayment = !hasCurrentApplicationReleased && !hasReleaseWithoutCurrentApplication && hasApprovedInspection;

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
      const enriched = {
        ...record,
        email: record.email || userEmail || "",
        reference: record.reference || record.paymentReference || record._id || record.id || `TP-${Date.now()}`,
        timestamp: record.createdAt || record.updatedAt || record.timestamp || new Date().toISOString(),
      };
      list.unshift(enriched);
      localStorage.setItem("paymentHistory", JSON.stringify(list));
      setPaymentHistory(list);
    } catch (e) {
      console.error("Failed to save payment record:", e);
    }
  };

  // ================= CONTENT RENDER =================
  const handlePayment = async () => {
    if (!canProceedToPayment) {
      setModal({
        open: true,
        title: "Payment Unavailable",
        message: "Your inspection must be approved before payment can be processed.",
        buttonText: "OK",
        variant: "error",
      });
      return;
    }

    if (!paymentMethod || !paymentAmount || Number(paymentAmount) <= 0) {
      setModal({
        open: true,
        title: "Invalid Payment",
        message: "Please enter a valid amount and select a payment method.",
        buttonText: "OK",
        variant: "error",
      });
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setModal({
        open: true,
        title: "Not Logged In",
        message: "Please log in first before making a payment.",
        buttonText: "OK",
        variant: "error",
      });
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
        setModal({
          open: true,
          title: "Incomplete GCash Details",
          message: "Please complete all GCash payment fields.",
          buttonText: "OK",
          variant: "error",
        });
        return;
      }
    }

    if (!isGCash) {
      if (!payerName || !payerEmail || !paymentReference.trim() || !cardExpiry.trim() || !cardCvc.trim() || !amount) {
        setModal({
          open: true,
          title: "Incomplete Card Details",
          message: "Please complete all Bank/Card payment fields.",
          buttonText: "OK",
          variant: "error",
        });
        return;
      }
    }

let paymentApplicationId = applicationId || null;

if (!paymentApplicationId) {
  const payableApplication = applications.find((app) => {
    const status = String(app.status || "").toLowerCase();

    return (
      app &&
      app._id &&
      status !== "released" &&
      status !== "rejected"
    );
  });

  paymentApplicationId = payableApplication?._id || null;
}

if (!paymentApplicationId) {
  setModal({
    open: true,
    title: "Application Required",
    message: "No valid application found for payment. Please submit an application first.",
    buttonText: "OK",
    variant: "error",
  });
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

    // Replace native confirm with centered modal: define payment executor
    const doPayment = async () => {
      // show processing modal immediately
      setModal({ open: true, title: "Processing Payment", message: "Please wait, processing payment...", hideActions: true, variant: "default" });

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
          setModal({ open: true, title: "Payment Saved", message: "Payment saved successfully, but the confirmation email was not sent.", buttonText: "OK", variant: "default" });
        }

        setPaymentStatus({
          success: true,
          message: data.message || "Payment saved successfully.",
          details: record,
        });

        savePaymentRecord(record);
        setPaymentCompleted(true);

        await fetchReleasedPermits();

        setModal({ open: true, title: "Transaction Successful", message: "Payment saved successfully. Please wait for staff approval/release before printing your permit.", buttonText: "Got it", variant: "success", hideActions: false });

        setPaymentAmount("");
        setPaymentReference("");
        setGcashName(userName || "");
        setBillingEmail(userEmail || "");
        setCardHolderName("");
        setCardExpiry("");
        setCardCvc("");
      } catch (err) {
        console.error("Payment error:", err);
        setModal({ open: true, title: "Payment Error", message: err.message || "Payment failed. Please try again.", buttonText: "OK", variant: "error" });
      } finally {
        setProcessingPayment(false);
      }
    };

    // Show confirm modal instead of native confirm
    setModal({
      open: true,
      title: "Confirm Payment",
      message: `Proceed to pay PHP ${amount.toLocaleString("en-PH")} using ${methodForEmail}?`,
      buttonText: "Pay",
      cancelText: "Cancel",
      variant: "default",
      onConfirm: doPayment,
      onCancel: () => setModal({ open: false }),
    });
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

        
      </div>

      <div className="recent-applications-table-shell">
        <div className="recent-applications-table-scroll">
          <table className="dashboard-table recent-applications-table">
            <thead>
              <tr>
                <th>Company Name</th>
                <th>Business Type</th>
                <th>Permit Type</th>
                <th>Expiry</th>
                <th>Permit Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {userReleasedPermits.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", padding: "24px", color: "#6B7280" }}>
                    No released permits yet. Once a permit or renewal is approved/released, it will appear here.
                  </td>
                </tr>
              ) : (
                userReleasedPermits.map((company, idx) => {
                  const rowKey = company.permitId || `company-${idx}`;
                  return (
                  <tr key={rowKey}>
                    <td>{company.companyName || "Registered Business"}</td>
                    <td>{company.businessType || "N/A"}</td>
                    <td>
                      <span
                        className={`dashboard-status-badge ${company.isExpired ? "rejected" : company.isRenewal ? "pending" : "approved"}`}
                      >
                        <span className="status-dot" aria-hidden="true"></span>
                        {company.isExpired
                          ? "Expired"
                          : company.isRenewal
                          ? "Renewal"
                          : company.applicationType || "New"}
                      </span>
                    </td>
                    <td>
                      {company.expiryDate ? (
                        <span className="dashboard-status-badge pending">
                          <span className="status-dot" aria-hidden="true"></span>
                          {new Date(company.expiryDate).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>
                      <span className={`dashboard-status-badge ${company.permitReleased ? "approved" : "pending"}`}>
                        <span className="status-dot" aria-hidden="true"></span>
                        {company.permitStatus || (company.permitReleased ? "Active" : "Pending Release")}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", position: "relative" }}>
                        {/* View Dropdown */}
                        <div style={{ position: "relative" }}>
                          <button
                            className="action-btn action-btn-outline"
                            type="button"
                            onClick={() =>
                              setOpenViewDropdown(openViewDropdown === idx ? null : idx)
                            }
                          >
                            View
                          </button>

                          {openViewDropdown === idx && (
                            <div
                              style={{
                                position: "absolute",
                                top: "100%",
                                left: 0,
                                background: "#fff",
                                border: "1px solid #ddd",
                                borderRadius: "6px",
                                boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                                zIndex: 10,
                                minWidth: 160,
                                padding: 4,
                              }}
                            >
                              <button
                                className="dropdown-item"
                                onClick={() => viewApplicationForm(company.applicationId)}
                              >
                                Application Form
                              </button>
                              <button
                                className="dropdown-item"
                                onClick={() => viewUploadedDocuments(company.applicationId)}
                              >
                                Uploaded Documents
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Renew Button */}
                        <button
                          className="action-btn action-btn-outline"
                          type="button"
                          onClick={() => loadRenewalApplication(company.applicationId)}
                        >
                          Renew
                        </button>

                        {/* Print Permit */}
                        {company.paymentStatus === "approved" && company.permitReleased === true && (
                          <button
                            className="action-btn action-btn-download"
                            type="button"
                            onClick={() =>
                              window.open(`/permit/print/${company.applicationId}`, "_blank")
                            }
                          >
                            <span className="action-btn-icon" aria-hidden="true">
                              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M8 11.3334V3.99998" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                                <path d="M4 7.99998L8 11.99998L12 7.99998" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M3.3335 13.3333H12.6668" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                              </svg>
                            </span>
                            Download
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
                })
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
                <select
                  className="input"
                  value={applicationType}
                  onChange={(e) => setApplicationType(e.target.value)}
                  disabled={isRenewalMode}
                >
                  {isRenewalMode ? <option>Renewal</option> : <option>New Application</option>}
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
                  onPointerDown={startDrawing}
                  onPointerMove={draw}
                  onPointerUp={stopDrawing}
                  onPointerLeave={stopDrawing}
                  onPointerCancel={stopDrawing}
                  style={{ touchAction: "none" }}
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
                <span className="permit-tab-check">✔</span> CHECK REQUIREMENTS
              </button>
            </div>

            {permitLicenseTab === "new" ? (
              <div className="permit-form-card">
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
                        <select
                          className="input"
                          value={applicationType}
                          onChange={e => setApplicationType(e.target.value)}
                          disabled={isRenewalMode}
                        >
                          {isRenewalMode ? <option>Renewal</option> : <option>New Application</option>}
                        </select>
                      </div>
                      <div className="permit-field" style={{ position: "relative" }}>
                        <label className="permit-label">Line of Business</label>
                        <input
                          className="input"
                          type="text"
                          placeholder={businessCategoryMain ? `Search ${businessCategoryMain} options...` : "Search business category or line of business"}
                          value={businessSubSearch || lineOfBusiness}
                          onChange={(e) => {
                            setBusinessSubSearch(e.target.value);
                            setLineOfBusiness("");
                            if (businessCategoryMain && e.target.value.trim() === "") {
                              setBusinessCategoryMain(businessCategoryMain);
                            }
                          }}
                          onFocus={() => setBusinessSubFocused(true)}
                          onBlur={() => setTimeout(() => setBusinessSubFocused(false), 150)}
                        />

                        {businessSubFocused && (
                          <div
                            style={{
                              position: "absolute",
                              top: "calc(100% + 6px)",
                              left: 0,
                              right: 0,
                              border: "1px solid #d9d9f3",
                              borderRadius: 10,
                              background: "#ffffff",
                              boxShadow: "0 14px 36px rgba(15, 23, 42, 0.12)",
                              zIndex: 1200,
                              maxHeight: 260,
                              overflowY: "auto",
                            }}
                          >
                            {!businessCategoryMain ? (
                              getFilteredBusinessOptions().map((category) => (
                                <button
                                  key={category}
                                  type="button"
                                  onMouseDown={() => {
                                    setBusinessCategoryMain(category);
                                    setBusinessSubSearch("");
                                  }}
                                  style={{
                                    display: "block",
                                    width: "100%",
                                    padding: "12px 14px",
                                    border: "none",
                                    background: "transparent",
                                    textAlign: "left",
                                    cursor: "pointer",
                                    color: "#0f172a",
                                  }}
                                >
                                  {category}
                                </button>
                              ))
                            ) : (
                              <>
                                <div style={{ padding: "12px 14px", borderBottom: "1px solid #eef2ff", color: "#475569", fontSize: "0.95rem" }}>
                                  Select a line of business for <strong>{businessCategoryMain}</strong>
                                </div>
                                {getFilteredBusinessOptions().map((option) => (
                                  <button
                                    key={option}
                                    type="button"
                                    onMouseDown={() => {
                                      setLineOfBusiness(option);
                                      setBusinessSubSearch(option);
                                      setBusinessSubFocused(false);
                                    }}
                                    style={{
                                      display: "block",
                                      width: "100%",
                                      padding: "12px 14px",
                                      border: "none",
                                      background: "transparent",
                                      textAlign: "left",
                                      cursor: "pointer",
                                      color: "#0f172a",
                                    }}
                                  >
                                    {highlightMatch(option, businessSubSearch)}
                                  </button>
                                ))}
                                <button
                                  type="button"
                                  onMouseDown={() => {
                                    setBusinessCategoryMain("");
                                    setBusinessSubSearch("");
                                  }}
                                  style={{
                                    display: "block",
                                    width: "100%",
                                    padding: "12px 14px",
                                    borderTop: "1px solid #eef2ff",
                                    background: "#f8fafc",
                                    textAlign: "left",
                                    cursor: "pointer",
                                    color: "#2563eb",
                                  }}
                                >
                                  Change category
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Show different fields for Renewal */}
                    {applicationType === "Renewal" ? (
                      <>
                        <h4 className="permit-section-subtitle">Business Information</h4>
                        <div className="permit-row permit-row-2">
                          <div className="permit-field">
                            <label className="permit-label">Business Name</label>
                            <input className={`input${missingFields.includes("businessName") ? " input-invalid" : ""}`} value={businessName} onChange={e => { setBusinessName(e.target.value); setMissingFields(p => p.filter(f => f !== "businessName")); }} />
                          </div>
                          <div className="permit-field">
                            <label className="permit-label">Business Line / Trade Name</label>
                            <input className={`input${missingFields.includes("lineOfBusiness") ? " input-invalid" : ""}`} value={lineOfBusiness} onChange={e => { setLineOfBusiness(e.target.value); setMissingFields(p => p.filter(f => f !== "lineOfBusiness")); }} />
                          </div>
                        </div>

                        <div className="permit-row permit-row-2">
                          <div className="permit-field">
                            <label className="permit-label">Business Area (sqm)</label>
                            <input className={`input${missingFields.includes("businessArea") ? " input-invalid" : ""}`} type="number" value={businessArea} onChange={e => { setBusinessArea(e.target.value); setMissingFields(p => p.filter(f => f !== "businessArea")); }} />
                          </div>
                          <div className="permit-field">
                            <label className="permit-label">Ownership Type</label>
                            <select className={`input${missingFields.includes("ownershipType") ? " input-invalid" : ""}`} value={ownershipType} onChange={e => { setOwnershipType(e.target.value); setMissingFields(p => p.filter(f => f !== "ownershipType")); }}>
                              <option value="">Select ownership</option>
                              <option>Sole Proprietor</option>
                              <option>Partnership</option>
                              <option>Corporation</option>
                            </select>
                          </div>
                        </div>

                        <div className="permit-row permit-row-2">
                          <div className="permit-field">
                            <label className="permit-label">Business Address</label>
                            <input className={`input${missingFields.includes("street") ? " input-invalid" : ""}`} value={street} onChange={e => { setStreet(e.target.value); setMissingFields(p => p.filter(f => f !== "street")); }} placeholder="Street / Bldg" />
                          </div>
                          <div className="permit-field">
                            <label className="permit-label">Barangay</label>
                            <input className={`input${missingFields.includes("barangay") ? " input-invalid" : ""}`} value={barangay} onChange={e => { setBarangay(e.target.value); setMissingFields(p => p.filter(f => f !== "barangay")); }} />
                          </div>
                        </div>

                        <div className="permit-row permit-row-3">
                          <div className="permit-field">
                            <label className="permit-label">City / Municipality</label>
                            <input className={`input${missingFields.includes("city") ? " input-invalid" : ""}`} value={city} onChange={e => { setCity(e.target.value); setMissingFields(p => p.filter(f => f !== "city")); }} />
                          </div>
                          <div className="permit-field">
                            <label className="permit-label">Province</label>
                            <input className={`input${missingFields.includes("province") ? " input-invalid" : ""}`} value={province} onChange={e => { setProvince(e.target.value); setMissingFields(p => p.filter(f => f !== "province")); }} />
                          </div>
                          <div className="permit-field">
                            <label className="permit-label">Landmark / Area</label>
                            <input className={`input${missingFields.includes("landmark") ? " input-invalid" : ""}`} value={landmark} onChange={e => { setLandmark(e.target.value); setMissingFields(p => p.filter(f => f !== "landmark")); }} />
                          </div>
                        </div>

                        <h4 className="permit-section-subtitle">Owner / Applicant Details</h4>
                        <div className="permit-row permit-row-4">
                          <div className="permit-field">
                            <label className="permit-label">First Name</label>
                            <input className={`input${missingFields.includes("applicantFirstName") ? " input-invalid" : ""}`} value={firstName} onChange={e => { setFirstName(e.target.value); setMissingFields(p => p.filter(f => f !== "applicantFirstName")); }} />
                          </div>
                          <div className="permit-field">
                            <label className="permit-label">Middle Name</label>
                            <input className="input" value={middleName} onChange={e => setMiddleName(e.target.value)} />
                          </div>
                          <div className="permit-field">
                            <label className="permit-label">Last Name</label>
                            <input className={`input${missingFields.includes("applicantLastName") ? " input-invalid" : ""}`} value={lastName} onChange={e => { setLastName(e.target.value); setMissingFields(p => p.filter(f => f !== "applicantLastName")); }} />
                          </div>
                          <div className="permit-field">
                            <label className="permit-label">Suffix</label>
                            <input className="input" value={suffixName} onChange={e => setSuffixName(e.target.value)} />
                          </div>
                        </div>

                        <div className="permit-row permit-row-2">
                          <div className="permit-field">
                            <label className="permit-label">Contact Number</label>
                            <input className={`input${missingFields.includes("applicantContactNumber") ? " input-invalid" : ""}`} value={contactNumber} onChange={e => { setContactNumber(e.target.value); setMissingFields(p => p.filter(f => f !== "applicantContactNumber")); }} />
                          </div>
                          <div className="permit-field">
                            <label className="permit-label">Email Address</label>
                            <input className={`input${missingFields.includes("applicantEmail") ? " input-invalid" : ""}`} value={applicantEmail} onChange={e => { setApplicantEmail(e.target.value); setMissingFields(p => p.filter(f => f !== "applicantEmail")); }} />
                          </div>
                        </div>

                        <div className="permit-row permit-row-2">
                          <div className="permit-field">
                            <label className="permit-label">TIN</label>
                            <input className={`input${missingFields.includes("tin") ? " input-invalid" : ""}`} value={tin} onChange={e => { setTin(e.target.value); setMissingFields(p => p.filter(f => f !== "tin")); }} />
                          </div>
                          <div className="permit-field">
                            <label className="permit-label">Position</label>
                            <select className={`input${missingFields.includes("registrantPosition") ? " input-invalid" : ""}`} value={registrantPosition} onChange={e => { setRegistrantPosition(e.target.value); setMissingFields(p => p.filter(f => f !== "registrantPosition")); }}>
                              <option>Owner</option>
                              <option>Manager</option>
                              <option>Representative</option>
                            </select>
                          </div>
                        </div>

                        <h4 className="permit-section-subtitle">Additional Renewal Details</h4>
                        <div className="permit-row permit-row-2">
                          <div className="permit-field">
                            <label className="permit-label">Business Permit No.</label>
                            <input 
                              className={`input${missingFields.includes("businessPermitNo") ? " input-invalid" : ""}`}
                              value={businessPermitNo}
                              onChange={(e) => {
                                setBusinessPermitNo(e.target.value);
                                setMissingFields(p => p.filter(f => f !== "businessPermitNo"));
                              }}
                            />
                          </div>
                          <div className="permit-field">
                            <label className="permit-label">Date of Previous Permit</label>
                            <input 
                              className={`input${missingFields.includes("dateOfPreviousPermit") ? " input-invalid" : ""}`}
                              type="date"
                              value={dateOfPreviousPermit}
                              onChange={(e) => {
                                setDateOfPreviousPermit(e.target.value);
                                setMissingFields(p => p.filter(f => f !== "dateOfPreviousPermit"));
                              }}
                            />
                          </div>
                        </div>

                        <div className="permit-row permit-row-2">
                          <div className="permit-field">
                            <label className="permit-label">DTI / SEC Number</label>
                            <input 
                              className={`input${missingFields.includes("dtiSecNumber") ? " input-invalid" : ""}`}
                              value={dtiSecNumber}
                              onChange={(e) => {
                                setDtiSecNumber(e.target.value);
                                setMissingFields(p => p.filter(f => f !== "dtiSecNumber"));
                              }}
                            />
                          </div>
                          <div className="permit-field">
                            <label className="permit-label">Lease / Land Title No.</label>
                            <input 
                              className={`input${missingFields.includes("leaseLandTitleNo") ? " input-invalid" : ""}`}
                              value={leaseLandTitleNo}
                              onChange={(e) => {
                                setLeaseLandTitleNo(e.target.value);
                                setMissingFields(p => p.filter(f => f !== "leaseLandTitleNo"));
                              }}
                            />
                          </div>
                        </div>

                        <h4 className="permit-section-subtitle">Clearances / Attachments</h4>
                        <div className="permit-row permit-row-2">
                          <div className="permit-field">
                            <label className="permit-label">Barangay Clearance</label>
                            <label className={`file-upload-btn${missingFields.includes("barangayClearanceFile") ? " input-invalid" : ""}`}>
                              Upload
                              <input 
                                type="file" 
                                style={{ display: 'none' }}
                                onChange={(e) => {
                                  setBarangayClearanceFile(e.target.files?.[0] || null);
                                  setMissingFields(p => p.filter(f => f !== "barangayClearanceFile"));
                                }}
                              />
                            </label>
                            {barangayClearanceFile && <span style={{ marginLeft: "10px", color: "#16a34a" }}>✓ {barangayClearanceFile.name}</span>}
                          </div>
                          <div className="permit-field">
                            <label className="permit-label">Sanitary / BFP</label>
                            <label className={`file-upload-btn${missingFields.includes("sanitaryBfpFile") ? " input-invalid" : ""}`}>
                              Upload
                              <input 
                                type="file"
                                style={{ display: 'none' }}
                                onChange={(e) => {
                                  setSanitaryBfpFile(e.target.files?.[0] || null);
                                  setMissingFields(p => p.filter(f => f !== "sanitaryBfpFile"));
                                }}
                              />
                            </label>
                            {sanitaryBfpFile && <span style={{ marginLeft: "10px", color: "#16a34a" }}>✓ {sanitaryBfpFile.name}</span>}
                          </div>
                        </div>

                        <div className="permit-row permit-row-2">
                          <div className="permit-field">
                            <label className="permit-label">Previous Mayor's Permit</label>
                            <label className={`file-upload-btn${missingFields.includes("previousMayorPermitFile") ? " input-invalid" : ""}`}>
                              Upload
                              <input 
                                type="file"
                                style={{ display: 'none' }}
                                onChange={(e) => {
                                  setPreviousMayorPermitFile(e.target.files?.[0] || null);
                                  setMissingFields(p => p.filter(f => f !== "previousMayorPermitFile"));
                                }}
                              />
                            </label>
                            {previousMayorPermitFile && <span style={{ marginLeft: "10px", color: "#16a34a" }}>✓ {previousMayorPermitFile.name}</span>}
                          </div>
                          <div className="permit-field">
                            <label className="permit-label">Official Receipts</label>
                            <label className={`file-upload-btn${missingFields.includes("officialReceiptsFile") ? " input-invalid" : ""}`}>
                              Upload
                              <input 
                                type="file"
                                style={{ display: 'none' }}
                                onChange={(e) => {
                                  setOfficialReceiptsFile(e.target.files?.[0] || null);
                                  setMissingFields(p => p.filter(f => f !== "officialReceiptsFile"));
                                }}
                              />
                            </label>
                            {officialReceiptsFile && <span style={{ marginLeft: "10px", color: "#16a34a" }}>✓ {officialReceiptsFile.name}</span>}
                          </div>
                        </div>
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
                                <label className="permit-label">Business Address</label>
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
                      <button className="permit-next-btn" onClick={handlePermitNext}>Next &gt;</button>
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
                      <button className="permit-next-btn" onClick={handlePermitNext}>Next &gt;</button>
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
                      onPointerDown={startDrawing}
                      onPointerMove={draw}
                      onPointerUp={stopDrawing}
                      onPointerLeave={stopDrawing}
                      onPointerCancel={stopDrawing}
                      style={{ touchAction: "none" }}
                    />
                    <div style={{ marginTop: 8 }}>
                      <button className="btn clear-signature-btn" onClick={clearSignature}>Clear Signature</button>
                    </div>

                    <div className="permit-nav-btns">
                      <button className="permit-prev-btn" onClick={() => setPermitStep(2)}>&lt; Previous</button>
                      <button
                        className="permit-next-btn"
                        onClick={() => {
                          const missing = validatePermitStepFields(3);
                          if (missing.length > 0) {
                            showStepValidationModal(3);
                            return;
                          }
                          submitApplication();
                        }}
                        disabled={submittingApp}
                      >
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
              <div className="permit-form-card" style={{ textAlign: "left", padding: "32px 28px" }}>
                <h3 style={{ fontSize: "1.4rem", marginBottom: 12 }}>Check Requirements</h3>
                <p style={{ color: "#6B7280", marginBottom: 24 }}>
                  Please review and submit the required documents below before your permit can be released.
                </p>
                <div style={{ marginBottom: 16, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                  <p style={{ margin: 0, color: "#374151" }}>
                    Click this to view the instructions on where you can get those requirements.
                  </p>
                  <button
                    type="button"
                    className="btn"
                    style={{ padding: "10px 16px", borderRadius: 8, background: "#2563eb", color: "white", border: "none", cursor: "pointer" }}
                    onClick={() => setShowInstructions((prev) => !prev)}
                  >
                    {showInstructions ? "Hide" : "View"}
                  </button>
                </div>

                {showInstructions && (
                  <div className="permit-instructions-panel">
                    <h2 className="permit-instructions-title">
                      {applicationType === "Renewal"
                        ? "Renewal Application — Where to Get Your Required Documents"
                        : "New Application — Where to Get Your Required Documents"}
                    </h2>
                    <p className="permit-instructions-intro">
                      {applicationType === "Renewal"
                        ? "Please prepare the following documents before submitting your Business Permit Renewal application."
                        : "Please prepare the following documents before submitting your new Business Permit application."}
                    </p>

                    {applicationType === "Renewal" ? (
                      <>
                        <div className="permit-instructions-step">
                          <h3>1. Business Permit Renewal Application Form</h3>
                          <strong>Where to get it:</strong>
                          <p>You can access and complete the application form directly through the <strong>TrustPermit system</strong>.</p>
                          <strong>What to do:</strong>
                          <p>Complete all required information and review your details before submitting the application.</p>
                        </div>

                        <div className="permit-instructions-divider"></div>

                        <div className="permit-instructions-step">
                          <h3>2. Previous Year&apos;s Business / Mayor&apos;s Permit</h3>
                          <strong>Where to get it:</strong>
                          <p>Get this from your <strong>previous year&apos;s business records</strong>.</p>
                          <p>If you no longer have a copy, contact the <strong>Antipolo City Business Permits and Licensing Office (BPLO)</strong> for assistance.</p>
                          <strong>What to upload:</strong>
                          <p>Upload a clear copy of your previous year&apos;s Business / Mayor&apos;s Permit.</p>
                        </div>

                        <div className="permit-instructions-divider"></div>

                        <div className="permit-instructions-step">
                          <h3>3. Updated Barangay Clearance</h3>
                          <strong>Where to get it:</strong>
                          <p>Go to the <strong>Barangay Hall</strong> of the barangay where your business is located.</p>
                          <strong>What to do:</strong>
                          <p>Request an updated <strong>Barangay Business Clearance</strong> for your business.</p>
                          <strong>What to upload:</strong>
                          <p>Upload a clear and complete copy of the updated Barangay Clearance.</p>
                          <strong>Tip:</strong>
                          <p>Make sure the business name and address match the information in your renewal application.</p>
                        </div>

                        <div className="permit-instructions-divider"></div>

                        <div className="permit-instructions-step">
                          <h3>4. Community Tax Certificate (CTC)</h3>
                          <strong>Where to get it:</strong>
                          <p>Get your <strong>Community Tax Certificate (Cedula)</strong> from the appropriate <strong>City/Municipal Treasurer&apos;s Office or authorized issuing office</strong>.</p>
                          <p>For Antipolo business applications, the City Government identifies the CTC/Cedula as a document that may be secured during the application process.</p>
                          <strong>What to upload:</strong>
                          <p>Upload a clear copy of the required CTC.</p>
                        </div>

                        <div className="permit-instructions-divider"></div>

                        <div className="permit-instructions-step">
                          <h3>5. Fire Safety Inspection Certificate (FSIC)</h3>
                          <strong>Where to get it:</strong>
                          <p>Go to the <strong>Bureau of Fire Protection (BFP)</strong> office responsible for the location of your business.</p>
                          <strong>What to do:</strong>
                          <p>Request/process the required Fire Safety Inspection Certificate for your establishment.</p>
                          <strong>What to upload:</strong>
                          <p>Upload a clear and valid copy of the FSIC.</p>
                          <p>Antipolo&apos;s 2026 business-permit information identifies the <strong>Fire Safety Inspection Certificate (BFP)</strong> as one of the regulatory clearances processed with the business application.</p>
                        </div>

                        <div className="permit-instructions-divider"></div>

                        <div className="permit-instructions-step">
                          <h3>6. Sanitary / BFP</h3>
                          <h4>Sanitary Clearance / Permit</h4>
                          <strong>Where to get it:</strong>
                          <p>Go to the appropriate <strong>Antipolo City Health Office (CHO)</strong> or sanitary office.</p>
                          <strong>What to do:</strong>
                          <p>Request the required sanitary clearance/permit for your business, when applicable.</p>
                          <h4>BFP Clearance</h4>
                          <strong>Where to get it:</strong>
                          <p>Go to the appropriate <strong>Bureau of Fire Protection (BFP)</strong> office.</p>
                          <strong>What to do:</strong>
                          <p>Request the fire-related clearance or document required for your establishment.</p>
                          <p>Antipolo identifies the <strong>Sanitary Permit to Operate (CHO)</strong> and <strong>Fire Safety Inspection Certificate (BFP)</strong> as regulatory clearances associated with business-permit processing.</p>
                        </div>

                        <div className="permit-instructions-divider"></div>

                        <div className="permit-instructions-step">
                          <h3>7. Zoning / Locational Clearance</h3>
                          <strong>Where to get it:</strong>
                          <p>Go to the appropriate <strong>Antipolo City zoning/locational office</strong> responsible for your business location.</p>
                          <strong>What to do:</strong>
                          <p>Request the required <strong>Zoning / Locational Clearance</strong> for your business.</p>
                          <strong>What to upload:</strong>
                          <p>Upload a clear copy of the issued clearance.</p>
                          <p>Antipolo&apos;s 2026 business-permit information identifies the <strong>Locational/Zoning Clearance</strong> as a regulatory clearance handled during the application process.</p>
                        </div>

                        <div className="permit-instructions-divider"></div>

                        <div className="permit-instructions-step">
                          <h3>8. Official Receipts</h3>
                          <strong>Where to get it:</strong>
                          <p>Get your official receipt from the <strong>Antipolo City Treasurer&apos;s Office</strong> or the authorized payment channel used for your transaction.</p>
                          <strong>What to upload:</strong>
                          <p>Upload a clear copy of the Official Receipt or payment proof requested by TrustPermit.</p>
                          <strong>Make sure the following are readable:</strong>
                          <ul>
                            <li>Receipt number</li>
                            <li>Date</li>
                            <li>Amount paid</li>
                            <li>Transaction details</li>
                          </ul>
                          <p>Antipolo&apos;s 2026 system supports online payment for business permits, including Maya, GCash, QRPh and cards.</p>
                        </div>

                        <div className="permit-instructions-divider"></div>

                        <div className="permit-instructions-step">
                          <h3>9. Payment of Renewal Fees</h3>
                          <strong>Where to pay:</strong>
                          <p>Pay the assessed renewal fees using the <strong>authorized payment options provided by Antipolo City</strong>.</p>
                          <p>Antipolo&apos;s 2026 e-BOSS supports online payment through <strong>Maya, GCash, QRPh, Visa, Mastercard and JCB</strong>.</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="permit-instructions-step">
                          <h3>1. DTI / SEC Registration</h3>
                          <strong>Where to get it:</strong>
                          <ul>
                            <li>Sole Proprietorship — Department of Trade and Industry (DTI)</li>
                            <li>Corporation / Partnership — Securities and Exchange Commission (SEC)</li>
                          </ul>
                          <strong>What to submit:</strong>
                          <p>Upload a clear and complete copy of your DTI or SEC Registration Certificate.</p>
                        </div>

                        <div className="permit-instructions-divider"></div>

                        <div className="permit-instructions-step">
                          <h3>2. Contract of Lease & Copy of Lessor's Permit</h3>
                          <strong>Where to get it:</strong>
                          <ul>
                            <li>Contract of Lease — From your property owner or landlord</li>
                            <li>Lessor's Business Permit — Request a copy from your property owner or landlord</li>
                          </ul>
                          <strong>What to submit:</strong>
                          <p>Upload the signed Contract of Lease and a copy of the lessor's valid Business Permit if you are renting.</p>
                        </div>

                        <div className="permit-instructions-divider"></div>

                        <div className="permit-instructions-step">
                          <h3>3. Tax Declaration of Land and Building</h3>
                          <strong>Where to get it:</strong>
                          <p>Antipolo City Assessor's Office.</p>
                          <strong>What to submit:</strong>
                          <p>Upload a clear copy of the Tax Declaration for the land and building where your business is located.</p>
                          <p><strong>Note:</strong> This requirement applies if you own the property.</p>
                        </div>

                        <div className="permit-instructions-divider"></div>

                        <div className="permit-instructions-step">
                          <h3>4. Property Tax Receipt of Land and Building</h3>
                          <strong>Where to get it:</strong>
                          <p>Antipolo City Treasurer's Office / Land Tax Section.</p>
                          <strong>What to submit:</strong>
                          <p>Upload the latest Property Tax / Real Property Tax Receipt for the land and building.</p>
                        </div>

                        <div className="permit-instructions-divider"></div>

                        <div className="permit-instructions-step">
                          <h3>5. Picture of Owner</h3>
                          <strong>Where to get it:</strong>
                          <p>Take the picture yourself.</p>
                          <strong>What to submit:</strong>
                          <p>Upload a recent, clear passport-size picture of the business owner.</p>
                          <p><strong>Photo requirements:</strong></p>
                          <ul>
                            <li>Face must be clearly visible.</li>
                            <li>Photo must not be blurry.</li>
                            <li>Avoid heavily edited photographs.</li>
                          </ul>
                        </div>

                        <div className="permit-instructions-divider"></div>

                        <div className="permit-instructions-step">
                          <h3>6. Panoramic Picture of Establishment</h3>
                          <strong>Where to get it:</strong>
                          <p>Take the picture yourself at the actual business location.</p>
                          <strong>What to submit:</strong>
                          <p>Upload a clear panoramic or wide-angle photograph of the establishment.</p>
                          <p><strong>Recommended:</strong> Include the business name/signage, entrance, and surrounding area.</p>
                        </div>

                        <div className="permit-instructions-divider"></div>

                        <div className="permit-instructions-step">
                          <h3>7. Picture of Establishment Showing Installed CCTV Camera</h3>
                          <strong>Where to get it:</strong>
                          <p>Take the picture yourself at the business establishment.</p>
                          <strong>What to submit:</strong>
                          <p>Upload a clear photograph showing the establishment and the installed CCTV camera.</p>
                          <p><strong>Important:</strong> The CCTV camera should be clearly visible.</p>
                        </div>

                        <div className="permit-instructions-divider"></div>

                        <div className="permit-instructions-step">
                          <h3>8. Locational Sketch</h3>
                          <strong>Where to get it:</strong>
                          <p>Prepare the sketch yourself.</p>
                          <strong>What to include:</strong>
                          <ul>
                            <li>Exact business location</li>
                            <li>Street or road name</li>
                            <li>Barangay</li>
                            <li>Nearby roads</li>
                            <li>Nearby landmarks</li>
                            <li>Recognizable establishments</li>
                          </ul>
                          <strong>What to submit:</strong>
                          <p>Upload a clear image or document of your locational sketch.</p>
                        </div>

                        <div className="permit-instructions-divider"></div>

                        <div className="permit-instructions-step">
                          <h3>9. Profile of GCash / PayMaya</h3>
                          <strong>Where to get it:</strong>
                          <p>Get the profile/account information from your GCash or Maya application.</p>
                          <strong>What to submit:</strong>
                          <p>Upload a clear screenshot or copy of your GCash/Maya profile or merchant account information.</p>
                          <p><strong>Important:</strong> Make sure the relevant information is clearly readable.</p>
                        </div>
                      </>
                    )}
                  </div>
                )}

                <div>
                  <h4 style={{ marginBottom: 12 }}>
                    {applicationType === "Renewal" ? "Renewal fee breakdown" : "New application fee breakdown"}
                  </h4>
                  <div style={{ display: "grid", gap: "10px" }}>
                    {paymentFeeBreakdown.map((fee) => (
                      <div
                        key={fee.label}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: "12px",
                          padding: "10px 12px",
                          background: "#f8fafc",
                          border: "1px solid #e2e8f0",
                          borderRadius: "10px",
                        }}
                      >
                        <span>{fee.label}</span>
                        <span>₱{Number(fee.amount || 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      }

      case "Payment History": {
        const filteredPaymentHistory = paymentHistory.filter((payment) => {
          const paymentEmail = String(payment.email || payment.userId?.email || "").toLowerCase();
          return paymentEmail === String(userEmail || "").toLowerCase();
        });

        return (
          <div className="card form-card-wide payment-history-card" style={{ padding: "28px 30px" }}>
            <h3 style={{ marginBottom: 8 }}>Payment History</h3>
            <p style={{ color: "#4B5563", marginBottom: 24 }}>
              These are your completed payments and receipts. Only your payment history is shown here.
            </p>

            {filteredPaymentHistory.length === 0 ? (
              <div className="empty-state" style={{ padding: 28, background: "#f8fafc", borderRadius: 12 }}>
                <p style={{ margin: 0, color: "#475569" }}>
                  No payment history found yet. Complete a payment first and it will appear here.
                </p>
              </div>
            ) : (
              <div className="payment-history-list" style={{ display: "grid", gap: 14 }}>
                {filteredPaymentHistory.map((payment, index) => {
                  const dateValue = payment.date || payment.timestamp || payment.createdAt || payment.updatedAt;
                  const createdDate = dateValue
                    ? new Date(dateValue).toLocaleDateString("en-PH", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "No date available";
                  const amount = Number(payment.amount || payment.total || 0).toLocaleString("en-PH", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  });
                  const paymentId = payment._id || payment.id || payment.paymentId || "";

                  return (
                    <div
                      key={`${payment.reference || paymentId || index}`}
                      className="payment-history-item"
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: 20,
                        border: "1px solid #e5e7eb",
                        borderRadius: 16,
                        background: "#ffffff",
                      }}
                    >
                      <div style={{ maxWidth: "65%" }}>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 8, alignItems: "center" }}>
                          <span
                            style={{
                              padding: "4px 10px",
                              borderRadius: 999,
                              background: payment.status?.toLowerCase() === "paid" || payment.status?.toLowerCase() === "approved"
                                ? "#d1fae5"
                                : "#f3f4f6",
                              color: payment.status?.toLowerCase() === "paid" || payment.status?.toLowerCase() === "approved"
                                ? "#065f46"
                                : "#374151",
                              fontSize: "0.85rem",
                              fontWeight: 700,
                            }}
                          >
                            {String(payment.status || "Pending").toUpperCase()}
                          </span>
                        </div>
                        <div style={{ display: "grid", gap: 8, color: "#374151" }}>
                          <div>
                            <strong>Amount:</strong> ₱{amount}
                          </div>
                          <div>
                            <strong>Method:</strong> {payment.paymentMethod || payment.method || payment.payment_method || "N/A"}
                          </div>
                          <div>
                            <strong>Date:</strong> {createdDate}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: 170 }}>
                        {paymentId && (
                          <button
                            className="action-btn action-btn-outline"
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              viewPayment(payment);
                            }}
                          >
                            View Payment
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
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

              {hasCurrentApplicationReleased || hasReleaseWithoutCurrentApplication ? (
                <div
                  style={{
                    padding: 24,
                    background: "#ecfdf5",
                    border: "1px solid #22c55e",
                    borderRadius: 16,
                    color: "#0f172a",
                    marginBottom: 20,
                  }}
                >
                  <h4 style={{ marginBottom: 10 }}>Permit Released</h4>
                  <p style={{ margin: 0, color: "#166534" }}>
                    Your permit has been approved and released by staff. Payment is complete and this permit can no longer be paid again.
                  </p>
                </div>
              ) : paymentCompleted ? (
                <div
                  style={{
                    padding: 24,
                    background: "#f8fafc",
                    border: "1px solid #dbeafe",
                    borderRadius: 16,
                    color: "#0f172a",
                    marginBottom: 20,
                  }}
                >
                  <h4 style={{ marginBottom: 10 }}>No pending application</h4>
                  <p style={{ margin: 0, color: "#475569" }}>
                    Your payment has been received. Please wait for staff approval of your inspection and permit release.
                  </p>
                </div>
              ) : inspectionsLoading ? (
                <div
                  style={{
                    padding: 24,
                    background: "#eff6ff",
                    border: "1px solid #bfdbfe",
                    borderRadius: 16,
                    color: "#1e3a8a",
                    marginBottom: 20,
                  }}
                >
                  <h4 style={{ marginBottom: 10 }}>Checking inspection status...</h4>
                  <p style={{ margin: 0, color: "#1e40af" }}>
                    We are fetching your latest inspection data. Please wait a moment.
                  </p>
                </div>
              ) : !hasApprovedInspection ? (
                <div
                  style={{
                    padding: 24,
                    background: "#fff7ed",
                    border: "1px solid #fdba74",
                    borderRadius: 16,
                    color: "#92400e",
                    marginBottom: 20,
                  }}
                >
                  <h4 style={{ marginBottom: 10 }}>Inspection Required</h4>
                  <p style={{ margin: 0, color: "#92400e" }}>
                    Payment is disabled until staff schedules and approves your inspection.
                  </p>
                </div>
              ) : (
                <div>
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

              <label className="payment-label">You need to pay (PHP)</label>

              {/* Show breakdown for approved inspections or when renewing */}
              {canViewRenewalFees && (
                <div style={{ display: "grid", gap: "10px", marginBottom: "14px" }}>
                  <div
                    style={{
                      background: "#f8fafc",
                      border: "1px solid #dbeafe",
                      borderRadius: "12px",
                      padding: "12px",
                      color: "#0f172a",
                      fontWeight: 600,
                    }}
                  >
                    <div style={{ fontSize: "0.92rem", marginBottom: "6px", color: "#475569" }}>
                      {isRenewalPayment ? "Renewal fee breakdown" : "Breakdown of payable fees"}
                    </div>
                    {paymentFeeBreakdown.map((fee) => (
                      <div
                        key={fee.label}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: "12px",
                          padding: "5px 0",
                          fontSize: "0.94rem",
                          borderBottom: "1px solid #e2e8f0",
                        }}
                      >
                        <span>{fee.label}</span>
                        <span>₱{Number(fee.amount || 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    ))}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "12px",
                        paddingTop: "10px",
                        marginTop: "6px",
                        fontSize: "1rem",
                        color: "#0f172a",
                      }}
                    >
                      <span>Total payable amount</span>
                      <span style={{ color: "#16a34a", fontWeight: 800 }}>
                        ₱{Number(calculatedPaymentAmount || 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  <input
                    className="payment-field"
                    type="text"
                    readOnly
                    value={Number(calculatedPaymentAmount || 0).toLocaleString("en-PH", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                    aria-label="Calculated payable amount"
                  />

                  {!hasApprovedInspection && isRenewalPayment && (
                    <div style={{ marginTop: 8, color: "#92400e", background: "#fff7ed", border: "1px solid #fdba74", padding: 10, borderRadius: 8 }}>
                      Note: You can view the renewal fee breakdown now. Actual payment will be enabled after staff approves your inspection.
                    </div>
                  )}
                </div>
              )}

              {/* If not renewal and no approved inspection, show waiting info */}
              {!canViewRenewalFees && (
                <div
                  style={{
                    background: "#fff7ed",
                    border: "1px solid #fdba74",
                    borderRadius: "12px",
                    padding: "12px",
                    marginBottom: "14px",
                    color: "#9a5b00",
                    fontWeight: 600,
                  }}
                >
                  Wait for your inspection to be approved before the fee breakdown and payable total can be shown.
                </div>
              )}

              {!hasCurrentApplicationReleased && (
                <>
                  {paymentMethod === "Bank" ? (
                    <div className="cc-actions">
                      <button
                        className="cc-proceed-btn"
                        disabled={processingPayment || !paymentAmount || !canProceedToPayment}
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
                        disabled={processingPayment || !paymentMethod || !paymentAmount || !canProceedToPayment}
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
                      <button className="action-btn action-btn-download" onClick={() => downloadReceipt(paymentStatus.details)}>
                        <span className="action-btn-icon" aria-hidden="true">
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M8 11.3334V3.99998" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                            <path d="M4 7.99998L8 11.99998L12 7.99998" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M3.3335 13.3333H12.6668" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                          </svg>
                        </span>
                        Download Receipt
                      </button>
                    </div>
                  )}
                </>
              )}
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
      <>
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

                          const hasImageChange = Boolean(pendingProfileImage);
                          const hasPasswordInput = Boolean(
                            currentPassword.trim() || newPassword.trim() || confirmPassword.trim()
                          );

                          if (!hasImageChange && !hasPasswordInput) {
                            setModal({
                              open: true,
                              title: "No Changes Made",
                              message: "Please choose a profile image or enter a password to update your profile.",
                              buttonText: "OK",
                              variant: "error",
                            });
                            return;
                          }

                          if (hasPasswordInput) {
                            if (!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
                              setModal({
                                open: true,
                                title: "Incomplete Password Update",
                                message: "Please fill in the current password, new password, and confirm password fields.",
                                buttonText: "OK",
                                variant: "error",
                              });
                              return;
                            }

                            if (newPassword !== confirmPassword) {
                              setModal({
                                open: true,
                                title: "Password Mismatch",
                                message: "New password and confirmation do not match.",
                                buttonText: "OK",
                                variant: "error",
                              });
                              return;
                            }
                          }

                          if (pendingProfileImage) {
                            try {
                              localStorage.setItem("profileImage", pendingProfileImage);
                              window.dispatchEvent(new Event("profileImageUpdated"));
                              setProfileImage(pendingProfileImage);
                            } catch (e) {
                              console.error("Failed to save profile image:", e);
                              setModal({
                                open: true,
                                title: "Image Too Large",
                                message: "The selected image is too large to save. Please choose a smaller photo.",
                                buttonText: "OK",
                                variant: "error",
                              });
                              return;
                            }
                          }

                          setModal({
                            open: true,
                            title: "Profile Updated",
                            message: "Profile updated successfully!",
                            buttonText: "OK",
                            variant: "success",
                          });

                          setCurrentPassword("");
                          setNewPassword("");
                          setConfirmPassword("");
                          setPendingProfileImage("");
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
                            <button type="button" className="cancel-profile-btn" onClick={() => {
                              setCurrentPassword("");
                              setNewPassword("");
                              setConfirmPassword("");
                              setPendingProfileImage("");
                              setIsEditingProfile(false);
                            }}>Cancel</button>
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
                                        <span aria-hidden="true"></span>
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
      <CenteredModal
        open={modal.open}
        title={modal.title}
        message={modal.message}
        buttonText={modal.buttonText}
        variant={modal.variant}
        onClose={modal.onClose || (() => setModal({ open: false }))}
        onConfirm={modal.onConfirm}
        onCancel={modal.onCancel}
        cancelText={modal.cancelText}
        hideActions={modal.hideActions}
      >
        {modal.children}
      </CenteredModal>
      </>
    );
};

export default Account;
