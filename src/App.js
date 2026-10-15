import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useEffect } from "react";

import PublicLayout from "./layouts/PublicLayout";

// STAFF MESSAGES
import Messages from "./pages/cityhall/Messages";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Verify from "./pages/Verify";
import PrintPermit from "./pages/PrintPermit";
import PrintClearance from "./pages/PrintClearance";
import InspectionReport from "./pages/InspectionReport";
import StaffInspectionReport from "./pages/StaffInspectionReport";
import SecurityVerification from "./pages/SecurityVerification";
import AskHelp from "./pages/Askhelp";

import Home from "./pages/Home";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Account from "./pages/Account";

import AdminDashboard from "./pages/SuperAdmin/AdminDashboard";
import ApproveDocuments from "./pages/ApproveDocuments";
import ReleasePermit from "./pages/ReleasePermit";
import UpdateInspection from "./pages/UpdateInspection";

import ApplicationFormView from "./pages/Dropdown/ApplicationFormView";
import PaymentView from "./pages/Dropdown/PaymentView";
import UploadedDocumentsView from "./pages/Dropdown/UploadedDocumentsView";

import StaffDashboard from "./pages/cityhall/StaffDashboard";

const SESSION_LOCK_KEY = "trustpermit_session";
const SESSION_ACTIVITY_KEY = "trustpermit_last_activity";
const SESSION_IDLE_TIMEOUT_MS = 15 * 60 * 1000;
const SESSION_HEARTBEAT_INTERVAL_MS = 5 * 60 * 1000;
const ADMIN_SESSION_CHECK_INTERVAL_MS = 10 * 1000;

const getAuthApiBaseUrl = () => {
  const configuredUrl = (process.env.REACT_APP_API_URL || "").replace(/\/+$/, "");

  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return "http://localhost:5000/api";
    }

    if (hostname.endsWith(".vercel.app") || hostname === "trustpermit.com" || hostname === "www.trustpermit.com") {
      return configuredUrl ? `${configuredUrl}/api` : "https://trustpermit-backend.onrender.com/api";
    }
  }

  return configuredUrl ? `${configuredUrl}/api` : "https://trustpermit-backend.onrender.com/api";
};

const getActiveSession = () => {
  try {
    const raw = localStorage.getItem(SESSION_LOCK_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const isAuthenticated = () => {
  const token = localStorage.getItem("token");
  const session = getActiveSession();

  if (!token) return false;
  if (!session) return true;

  return session.token === token;
};

const normalizeRole = (role = "") => {
  const rawRole = String(role || "")
    .trim()
    .toLowerCase();

  return rawRole === "super admin" ? "admin" : rawRole;
};

const getStoredRole = () => {
  const rawRole = normalizeRole(
    localStorage.getItem("role") || ""
  );

  if (rawRole) return rawRole;

  try {
    const storedUser = JSON.parse(
      localStorage.getItem("user")
    );

    return normalizeRole(storedUser?.role || "") || "";
  } catch {
    return "";
  }
};

const PrivateRoute = ({ children }) => {
  const location = useLocation();

  return isAuthenticated() ? (
    children
  ) : (
    <Navigate
      to="/"
      state={{ from: location }}
      replace
    />
  );
};

const AdminRoute = ({ children }) => {
  const role = getStoredRole();

  return role === "admin" ? (
    children
  ) : (
    <Navigate to="/home" replace />
  );
};

const StaffRoute = ({ children }) => {
  const role = getStoredRole();

  return role === "staff" ? (
    children
  ) : (
    <Navigate to="/home" replace />
  );
};

const StaffPage = () => (
  <PrivateRoute>
    <StaffRoute>
      <StaffDashboard />
    </StaffRoute>
  </PrivateRoute>
);

const SessionTimeout = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return undefined;
    const isAdminSession = getStoredRole() === "admin";

    let idleTimer;
    let lastHeartbeatAt = Date.now();
    let lastActivityWriteAt = 0;
    let loggingOut = false;
    let lastActivityAt;
    let shouldSaveInitialActivity = false;

    try {
      const savedActivity = JSON.parse(localStorage.getItem(SESSION_ACTIVITY_KEY) || "null");
      if (savedActivity?.token === token && Number.isFinite(savedActivity.timestamp)) {
        lastActivityAt = savedActivity.timestamp;
      } else {
        lastActivityAt = Date.now();
        shouldSaveInitialActivity = true;
      }
    } catch {
      lastActivityAt = Date.now();
      shouldSaveInitialActivity = true;
    }

    const saveActivity = (timestamp) => {
      localStorage.setItem(SESSION_ACTIVITY_KEY, JSON.stringify({ token, timestamp }));
      lastActivityWriteAt = timestamp;
    };

    if (shouldSaveInitialActivity) saveActivity(lastActivityAt);

    const endSession = (releaseServerSession = true) => {
      if (loggingOut || localStorage.getItem("token") !== token) return;
      loggingOut = true;
      window.clearTimeout(idleTimer);

      if (releaseServerSession) {
        fetch(`${getAuthApiBaseUrl()}/auth/logout`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          keepalive: true,
        }).catch(() => {});
      }

      ["token", "role", "user", "citizenId", "name", "email", SESSION_LOCK_KEY, SESSION_ACTIVITY_KEY]
        .forEach((key) => localStorage.removeItem(key));
      navigate("/", { replace: true, state: { sessionExpired: true } });
    };

    const scheduleLogout = () => {
      window.clearTimeout(idleTimer);
      const remaining = SESSION_IDLE_TIMEOUT_MS - (Date.now() - lastActivityAt);
      idleTimer = window.setTimeout(endSession, Math.max(remaining, 0));
    };

    const refreshBackendSession = (force = false) => {
      const now = Date.now();
      if (!force && now - lastHeartbeatAt < SESSION_HEARTBEAT_INTERVAL_MS) return;
      lastHeartbeatAt = now;

      fetch(`${getAuthApiBaseUrl()}/auth/session`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((response) => {
        if (response.status === 401) endSession(false);
      }).catch(() => {});
    };

    const recordActivity = () => {
      if (localStorage.getItem("token") !== token || loggingOut) return;
      const now = Date.now();
      if (now - lastActivityAt >= SESSION_IDLE_TIMEOUT_MS) {
        endSession();
        return;
      }
      lastActivityAt = now;
      if (now - lastActivityWriteAt >= 1000) saveActivity(now);
      scheduleLogout();
      refreshBackendSession();
    };

    const handleStorage = (event) => {
      if (event.key === "token" && event.newValue !== token) {
        window.location.reload();
        return;
      }

      if (event.key !== SESSION_ACTIVITY_KEY || !event.newValue) return;
      try {
        const sharedActivity = JSON.parse(event.newValue);
        if (sharedActivity?.token === token && sharedActivity.timestamp > lastActivityAt) {
          lastActivityAt = sharedActivity.timestamp;
          scheduleLogout();
        }
      } catch {
        return;
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState !== "visible") return;
      scheduleLogout();
      if (isAdminSession) refreshBackendSession(true);
    };

    const activityEvents = ["pointerdown", "pointermove", "keydown", "touchstart", "wheel"];
    activityEvents.forEach((eventName) => window.addEventListener(eventName, recordActivity, { passive: true }));
    window.addEventListener("storage", handleStorage);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    scheduleLogout();
    const sessionCheckTimer = isAdminSession
      ? window.setInterval(() => {
          if (document.visibilityState === "visible") refreshBackendSession(true);
        }, ADMIN_SESSION_CHECK_INTERVAL_MS)
      : null;

    return () => {
      window.clearTimeout(idleTimer);
      if (sessionCheckTimer) window.clearInterval(sessionCheckTimer);
      activityEvents.forEach((eventName) => window.removeEventListener(eventName, recordActivity));
      window.removeEventListener("storage", handleStorage);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [navigate]);

  return null;
};

const redirectToHomeIfNoPermission = (role) => {
  const normalizedRole = normalizeRole(role);
  return normalizedRole === "staff" || normalizedRole === "admin" ? false : true;
};

function App() {
  return (
    <BrowserRouter>
      <SessionTimeout />
      <Routes>
        {/* PUBLIC PAGES WITH NAVBAR */}
        <Route element={<PublicLayout />}>
          <Route path="/home" element={<Home />} />

          <Route path="/about" element={<About />} />

          <Route path="/contact" element={<Contact />} />

          <Route
            path="/ask-help"
            element={<AskHelp />}
          />

          <Route
            path="/account"
            element={
              <PrivateRoute>
                <Account />
              </PrivateRoute>
            }
          />
        </Route>

        {/* AUTH PAGES */}
        <Route path="/" element={<Login />} />

        <Route
          path="/register"
          element={<Register />}
        />

        {/* SECURITY / VERIFY PAGES */}
        <Route
          path="/security-verification"
          element={<SecurityVerification />}
        />

        <Route path="/verify" element={<Verify />} />

        <Route
          path="/verify/:permitId"
          element={<Verify />}
        />

        <Route
          path="/permit/print/:permitId"
          element={<PrintPermit />}
        />

        <Route
          path="/permit/document/:documentType/:permitId"
          element={<PrintClearance />}
        />

        <Route
          path="/inspection-report/:id"
          element={<StaffInspectionReport />}
        />

        <Route
          path="/inspection-certificate/:id"
          element={<InspectionReport />}
        />

        {/* DOCUMENT VIEW ROUTES */}
        <Route
          path="/application/view/:applicationId"
          element={
            <PrivateRoute>
              <ApplicationFormView />
            </PrivateRoute>
          }
        />

        <Route
          path="/payment/view/:paymentId"
          element={
            <PrivateRoute>
              <PaymentView />
            </PrivateRoute>
          }
        />

        <Route
          path="/documents/view/:applicationId"
          element={
            <PrivateRoute>
              <UploadedDocumentsView />
            </PrivateRoute>
          }
        />

        {/* ADMIN PAGES */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            </PrivateRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <PrivateRoute>
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            </PrivateRoute>
          }
        />

        <Route
          path="/admin/dashboard"
          element={
            <PrivateRoute>
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            </PrivateRoute>
          }
        />

        <Route
          path="/admin/approve-documents"
          element={
            <PrivateRoute>
              <AdminRoute>
                <ApproveDocuments />
              </AdminRoute>
            </PrivateRoute>
          }
        />

        <Route
          path="/admin/release-permit"
          element={
            <PrivateRoute>
              <AdminRoute>
                <ReleasePermit />
              </AdminRoute>
            </PrivateRoute>
          }
        />

        <Route
          path="/admin/update-inspection"
          element={
            <PrivateRoute>
              <AdminRoute>
                <UpdateInspection />
              </AdminRoute>
            </PrivateRoute>
          }
        />

        {/* STAFF PAGES */}
        <Route
          path="/staff"
          element={
            <Navigate
              to="/staff/dashboard"
              replace
            />
          }
        />

        <Route
          path="/staff/dashboard"
          element={<StaffPage />}
        />

        <Route
          path="/staff/review"
          element={<StaffPage />}
        />

        <Route
          path="/staff/review/:applicationId"
          element={<StaffPage />}
        />

        <Route
          path="/staff/requests"
          element={<StaffPage />}
        />

        <Route
          path="/staff/inspection"
          element={<StaffPage />}
        />

        <Route
          path="/staff/network"
          element={<StaffPage />}
        />

        <Route
          path="/staff/users"
          element={<StaffPage />}
        />

        <Route
          path="/staff/payments"
          element={<StaffPage />}
        />

        {/* STAFF MESSAGES */}
        <Route
          path="/staff/messages"
          element={<StaffPage />}
        />

        {/* OPTIONAL DIRECT MESSAGES PAGE */}
        <Route
          path="/messages"
          element={
            <PrivateRoute>
              <Messages />
            </PrivateRoute>
          }
        />

        {/* FALLBACK */}
        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;