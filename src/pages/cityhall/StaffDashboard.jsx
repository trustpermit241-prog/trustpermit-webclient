import { useNavigate, useLocation } from "react-router-dom";
import Dashboard from "./Dashboard";
import Review from "./Review";
import Requests from "./Requests";
import InspectionProgress from "./InspectionProgress";
import Network from "./Network";
import Users from "./Users";
import Payment from "./Payment";
import Messages from "./Messages";
import "./StaffDashboard.css";

const Icons = {
  Dashboard: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),

  Review: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14,2 14,8 20,8" />
      <line x1="9" y1="13" x2="15" y2="13" />
      <line x1="9" y1="17" x2="12" y2="17" />
    </svg>
  ),

  Requests: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),

  Inspection: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),

  Payments: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <line x1="2" y1="10" x2="22" y2="10" />
    </svg>
  ),

  Messages: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      <path d="M8 10h8" />
      <path d="M8 14h5" />
    </svg>
  ),

  Network: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),

  Users: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),

  Mission: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="3,11 22,2 13,21 11,13 3,11" />
    </svg>
  ),

  Logout: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16,17 21,12 16,7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
};

export default function StaffDashboard() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("user");
    navigate("/");
  };

  const isActive = (path) => location.pathname.startsWith(path);

  const logoStyle = {
    width: "50px",
    height: "50px",
    backgroundImage: "url('/images/lugoo.jpg')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    borderRadius: "50%",
    border: "2px solid #fff",
  };

  const renderPage = () => {
    const path = location.pathname;

    switch (true) {
      case path === "/staff" || path === "/staff/" || path === "/staff/dashboard":
        return <Dashboard />;

      case path === "/staff/review" || path.startsWith("/staff/review/"):
        return <Review />;

      case path === "/staff/requests":
        return <Requests />;

      case path === "/staff/inspection":
        return <InspectionProgress />;

      case path === "/staff/payments":
        return <Payment />;

      case path === "/staff/messages":
        return <Messages />;

      case path === "/staff/network":
        return <Network />;

      case path === "/staff/users":
        return <Users />;

      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="staff-dashboard">
      <aside className="sidebar">
        <div className="logo-container" onClick={() => navigate("/staff/dashboard")}>
          <div style={logoStyle}></div>

          <div className="logo-text">
            <h3>Staff Panel</h3>
            <span>City Hall System</span>
          </div>
        </div>

        <nav className="nav-buttons">
          <span className="nav-section-label">MAIN</span>

          <button
            type="button"
            className={isActive("/staff/dashboard") ? "active" : ""}
            onClick={() => navigate("/staff/dashboard")}
          >
            <Icons.Dashboard /> Dashboard
          </button>

          <button
            type="button"
            className={isActive("/staff/review") ? "active" : ""}
            onClick={() => navigate("/staff/review")}
          >
            <Icons.Review /> Review
          </button>

          <button
            type="button"
            className={isActive("/staff/requests") ? "active" : ""}
            onClick={() => navigate("/staff/requests")}
          >
            <Icons.Requests /> Requests
          </button>

          <button
            type="button"
            className={isActive("/staff/inspection") ? "active" : ""}
            onClick={() => navigate("/staff/inspection")}
          >
            <Icons.Inspection /> Inspection
          </button>

          <button
            type="button"
            className={isActive("/staff/payments") ? "active" : ""}
            onClick={() => navigate("/staff/payments")}
          >
            <Icons.Payments /> Payments <span className="new-badge">New</span>
          </button>

          <button
            type="button"
            className={isActive("/staff/messages") ? "active" : ""}
            onClick={() => navigate("/staff/messages")}
          >
            <Icons.Messages /> Messages
          </button>

          <span className="nav-section-label">NETWORK</span>

          <button
            type="button"
            className={isActive("/staff/network") ? "active" : ""}
            onClick={() => navigate("/staff/network")}
          >
            <Icons.Network /> Agency Network
          </button>

          <button
            type="button"
            className={isActive("/staff/users") ? "active" : ""}
            onClick={() => navigate("/staff/users")}
          >
            <Icons.Users /> Users
          </button>
        </nav>

        <div className="mission-card">
          <div className="mission-icon-wrap">
            <Icons.Mission />
          </div>

          <div className="mission-text">
            <strong>City Hall Mission</strong>
            <span>Building safe, compliant and sustainable communities.</span>
          </div>
        </div>

        <div className="sidebar-footer">
          <div className="user-row">
            <div className="user-avatar">JD</div>

            <div className="user-info">
              <span className="user-name">Juan Dela Cruz</span>
              <span className="user-role">City Hall Staff</span>
            </div>
          </div>

          <button type="button" onClick={handleLogout} className="logout-btn">
            <Icons.Logout /> Logout
          </button>
        </div>
      </aside>

      <main className="content staff-content">
        {renderPage()}
      </main>
    </div>
  );
}