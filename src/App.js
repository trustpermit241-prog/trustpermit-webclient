import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Layouts
import PublicLayout from "./layouts/PublicLayout";

// Auth pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import Verify from "./pages/Verify";
import AskHelp from "./pages/Askhelp";

// Public pages
import Home from "./pages/Home";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Account from "./pages/Account";

// Admin pages
import Dashboard from "./pages/Dashboard";
import CityhallDashboard from "./pages/cityhall/Dashboard";
import ApproveDocuments from "./pages/ApproveDocuments";
import ReleasePermit from "./pages/ReleasePermit";
import UpdateInspection from "./pages/UpdateInspection";

// Staff pages
import StaffDashboard from "./pages/cityhall/StaffDashboard";
import Review from "./pages/cityhall/Review";
import VerifyStaff from "./pages/cityhall/Verify";
import Network from "./pages/cityhall/Network";
import InspectionProgress from "./pages/cityhall/InspectionProgress";

// Auth helper
const isAuthenticated = () => localStorage.getItem("token") !== null;

// Route guards
const PrivateRoute = ({ children }) =>
  isAuthenticated() ? children : <Navigate to="/" />;

const AdminRoute = ({ children }) => {
  const role = localStorage.getItem("role");
  return role === "admin" ? children : <Navigate to="/home" />;
};

const StaffRoute = ({ children }) => {
  const role = localStorage.getItem("role");
  return role === "staff" ? children : <Navigate to="/home" />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ================= PUBLIC PAGES WITH NAVBAR ================= */}
        <Route element={<PublicLayout />}>
          <Route path="/home" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/ask-help" element={<AskHelp />} />

          {/* Account page now inside layout so it has navbar */}
          <Route
            path="/account"
            element={
              <PrivateRoute>
                <Account />
              </PrivateRoute>
            }
          />
        </Route>

        {/* ================= AUTH PAGES ================= */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/verify"
          element={
            <PrivateRoute>
              <Verify />
            </PrivateRoute>
          }
        />

        {/* ================= ADMIN DASHBOARD ================= */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <AdminRoute>
                <Dashboard />
              </AdminRoute>
            </PrivateRoute>
          }
        />

        <Route
          path="/cityhall-dashboard"
          element={
            <PrivateRoute>
              <AdminRoute>
                <CityhallDashboard />
              </AdminRoute>
            </PrivateRoute>
          }
        />

        {/* ================= STAFF DASHBOARD WITH NESTED ROUTES ================= */}
        <Route
          path="/staff"
          element={
            <PrivateRoute>
              <StaffRoute>
                <StaffDashboard />
              </StaffRoute>
            </PrivateRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" />} />
          <Route path="dashboard" element={<CityhallDashboard />} />
          <Route path="review" element={<Review />} />
          <Route path="verify" element={<VerifyStaff />} />
          <Route path="inspection" element={<InspectionProgress />} />
          <Route path="network" element={<Network />} />
        </Route>

        {/* ================= LEGACY STAFF ROUTES ================= */}
        <Route
          path="/staff-dashboard"
          element={
            <PrivateRoute>
              <StaffRoute>
                <StaffDashboard />
              </StaffRoute>
            </PrivateRoute>
          }
        />
        <Route
          path="/staff/review"
          element={
            <PrivateRoute>
              <StaffRoute>
                <StaffDashboard />
              </StaffRoute>
            </PrivateRoute>
          }
        />
        <Route
          path="/staff/network"
          element={
            <PrivateRoute>
              <StaffRoute>
                <StaffDashboard />
              </StaffRoute>
            </PrivateRoute>
          }
        />

        {/* ================= ADMIN ACTIONS ================= */}
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

        {/* ================= FALLBACK ================= */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
