import { useNavigate } from "react-router-dom";
import "./Home.css";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      {/* Hero Section */}
      <div className="hero-section">
        <h1>Your Reliable Permit Management System</h1>
        <p>
          Streamline your permit applications, track approvals, and manage all
          your projects in one secure platform.
        </p>

        <button
          className="get-started"
          onClick={() => navigate("/ask-help")}
        >
          Ask Help
        </button>
      </div>

      {/* Features Section */}
      <div className="features-section">
        <h2>Why Choose TRUST PERMIT?</h2>

        <div className="features-cards">
          <div className="feature-card">
            <h3>Efficient Tracking</h3>
            <p>Monitor your permit applications from submission to approval.</p>
          </div>

          <div className="feature-card">
            <h3>Secure & Reliable</h3>
            <p>Your data is protected with top-notch security measures.</p>
          </div>

          <div className="feature-card">
            <h3>User-Friendly</h3>
            <p>Clean and simple interface for all users.</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="footer">
        <p>&copy; {new Date().getFullYear()} TRUST PERMIT. All rights reserved.</p>
      </div>
    </div>
  );
}
