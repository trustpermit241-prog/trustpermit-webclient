import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Register.css";

export default function Register() {
  // ================== STATE VARIABLES ==================
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isCitizen, setIsCitizen] = useState(false);

  const navigate = useNavigate();

  // ================== VALIDATIONS ==================
  const validateEmail = (email) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validatePassword = (password) =>
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/.test(password);

  const getPasswordStrength = (password) => {
    if (!password) return { label: "", color: "#374151" };
    const lengthScore = password.length >= 8 ? 1 : 0;
    const lowerScore = /[a-z]/.test(password) ? 1 : 0;
    const upperScore = /[A-Z]/.test(password) ? 1 : 0;
    const numberScore = /\d/.test(password) ? 1 : 0;
    const symbolScore = /[^a-zA-Z0-9]/.test(password) ? 1 : 0;
    const score = lengthScore + lowerScore + upperScore + numberScore + symbolScore;

    if (score <= 2) return { label: "Weak", color: "#dc2626" };
    if (score === 3 || score === 4) return { label: "Medium", color: "#f59e0b" };
    return { label: "Strong", color: "#16a34a" };
  };

  // ================== NEXT BUTTON ==================
  const handleNext = () => {
    // Check Full Name
    if (!fullName.trim()) {
      setMessage("Please enter your full name.");
      return;
    }

    // Check Email
    if (!email || !validateEmail(email)) {
      setMessage("Please enter a valid email address.");
      return;
    }

    // Check Password
    if (!validatePassword(password)) {
      setMessage(
        "Password must contain uppercase, lowercase, number, symbol, and at least 8 characters."
      );
      return;
    }

    // Check Confirm Password
    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    // Check Citizen Checkbox
    if (!isCitizen) {
      setMessage("You must confirm you are a citizen in Antipolo.");
      return;
    }

    // Clear any previous message
    setMessage("");

    // Navigate to Security Verification page with state
    navigate("/security-verification", {
      state: { fullName, email, password },
    });
  };

  // ================== UI ==================
  const containerStyle = {
    display: "flex",
    height: "100vh",
    position: "relative",
    overflow: "hidden",
  };

  const backgroundBlurStyle = {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundImage: "url('/images/Antipolo-City-Hall.png')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    filter: "blur(12px) brightness(0.72)",
    transform: "scale(1.03)",
    zIndex: 0,
  };

  const overlayStyle = {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0,0,0,0.18)",
    zIndex: 1,
  };

  const rightStyle = {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    minWidth: 0,
  };

  return (
    <div style={containerStyle}>
      <div style={backgroundBlurStyle} />
      <div style={overlayStyle}></div>
      <div style={rightStyle}>
        <div
          className="register-card"
          style={{
            position: "relative",
            zIndex: 2,
            minWidth: 580,
            maxWidth: 700,
            background: "rgba(255,255,255,0.96)",
            borderRadius: 24,
            boxShadow: "0 12px 40px rgba(0,0,0,0.18)",
            padding: "64px 56px 56px 56px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            border: "1.5px solid rgba(30, 64, 175, 0.10)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)"
          }}
        >
          <h1 style={{ color: "#1a237e", marginBottom: 22, fontSize: 28, fontWeight: 700 }}>Create Account</h1>

          {/* Show Validation Message */}
          {message && <p className="register-message" style={{ color: "#e53935", marginBottom: 14, fontSize: 17, fontWeight: 500 }}>{message}</p>}

          {/* Full Name */}
          <input
            type="text"
            placeholder="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            style={{ marginBottom: 14, width: "100%", padding: "13px", borderRadius: 8, border: "1px solid #bbb", fontSize: 17 }}
          />

          {/* Email */}
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ marginBottom: 14, width: "100%", padding: "13px", borderRadius: 8, border: "1px solid #bbb", fontSize: 17 }}
          />

          {/* Password */}
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ marginBottom: 6, width: "100%", padding: "13px", borderRadius: 8, border: "1px solid #bbb", fontSize: 17 }}
          />
          <div style={{ width: "100%", marginBottom: 12, fontSize: 14, color: getPasswordStrength(password).color, fontWeight: 600 }}>
            {password ? `Password strength: ${getPasswordStrength(password).label}` : ""}
          </div>

          {/* Confirm Password */}
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            style={{ marginBottom: 6, width: "100%", padding: "13px", borderRadius: 8, border: "1px solid #bbb", fontSize: 17 }}
          />
          {confirmPassword && confirmPassword !== password && (
            <div style={{ width: "100%", marginBottom: 12, fontSize: 14, color: "#dc2626", fontWeight: 600 }}>
              Passwords do not match.
            </div>
          )}

          {/* Citizen Checkbox */}
          <div style={{ display: 'flex', alignItems: 'center', margin: '12px 0 20px 0', width: '100%' }}>
            <input
              type="checkbox"
              id="isCitizen"
              checked={isCitizen}
              onChange={e => setIsCitizen(e.target.checked)}
              style={{ marginRight: 8, width: 18, height: 18 }}
            />
            <label htmlFor="isCitizen" style={{ fontSize: 17, color: '#1a237e', cursor: 'pointer', fontWeight: 500 }}>
              Are you citizen in Antipolo?
            </label>
          </div>

          {/* NEXT BUTTON */}
          <button
            onClick={handleNext}
            style={{
              width: "100%",
              padding: "14px 0",
              background: "#1976d2",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontWeight: 700,
              fontSize: 18,
              marginBottom: 18,
              cursor: "pointer",
              letterSpacing: 1
            }}
          >
            Next → Security Verification
          </button>

          {/* Login Link */}
          <p className="register-link" style={{ color: '#1a237e', marginTop: 12, fontSize: 18, fontWeight: 500, textAlign: 'center', textShadow: '0 1px 8px #fff' }}>
            Already have an account? <a href="/" style={{ color: '#1976d2', textDecoration: 'underline', fontWeight: 700 }}>Login here</a>
          </p>
        </div>
      </div>
    </div>
  );
}
