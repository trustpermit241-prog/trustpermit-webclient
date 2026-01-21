import { Outlet, useNavigate, useLocation } from "react-router-dom";
import "./StaffDashboard.css";

export default function StaffDashboard() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/");
  };

  const isActive = (path) => location.pathname.startsWith(path);

  const logoStyle = {
    width: "50px",
    height: "50px",
    backgroundImage: "url('/images/lugoo.jpg')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    borderRadius: "50%",
    border: "2px solid #2c3e50",
    cursor: "pointer"
  };

  return (
    <div className="staff-dashboard">
      {/* Top Navbar */}
      <header className="top-nav">
        {/* Logo */}
        <div
          className="logo-container"
          onClick={() => navigate("/staff/dashboard")}
        >
          <div style={logoStyle}></div>
          <div className="logo-text">
            <span className="logo-title">TrustPermit</span>
            <span className="logo-subtitle">Decentralized Ledger System</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="nav-buttons">
          <button
            className={isActive("/staff/dashboard") ? "active" : ""}
            onClick={() => navigate("/staff/dashboard")}
          >
            Dashboard
          </button>
          <button
            className={isActive("/staff/review") ? "active" : ""}
            onClick={() => navigate("/staff/review")}
          >
            Review
          </button>
          <button
            className={isActive("/staff/verify") ? "active" : ""}
            onClick={() => navigate("/staff/verify")}
          >
            Verify
          </button>
          <button
            className={isActive("/staff/inspection") ? "active" : ""}
            onClick={() => navigate("/staff/inspection")}
          >
            Inspection
          </button>
          <button
            className={isActive("/staff/network") ? "active" : ""}
            onClick={() => navigate("/staff/network")}
          >
            Agency Network
          </button>
        </nav>

        {/* User Area */}
        <div className="user-area">
          <span className="notification">🔔</span>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
