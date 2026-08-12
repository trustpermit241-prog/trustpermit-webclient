import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import PublicLayout from "./layouts/PublicLayout";

// STAFF MESSAGES
import Messages from "./pages/cityhall/Messages";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Verify from "./pages/Verify";
import PrintPermit from "./pages/PrintPermit";
import InspectionReport from "./pages/InspectionReport";
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

const isAuthenticated = () => localStorage.getItem("token") !== null;

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

function App() {
  return (
    <BrowserRouter>
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
          path="/inspection-report/:id"
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