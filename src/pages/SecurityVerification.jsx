import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import emailjs from "@emailjs/browser";
import CenteredModal from "../components/CenteredModal";
import "./Register.css";

const getApiBaseUrl = () => {
  const configuredUrl = (process.env.REACT_APP_API_URL || "").replace(/\/+$/, "");

  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return "http://localhost:5000";
    }

    if (hostname.endsWith(".vercel.app") || hostname === "trustpermit.com" || hostname === "www.trustpermit.com") {
      return configuredUrl || "https://trustpermit-backend.onrender.com";
    }
  }

  return configuredUrl || "https://trustpermit-backend.onrender.com";
};

const API_BASE_URL = `${getApiBaseUrl()}/api`;

export default function SecurityVerification() {
  const location = useLocation();
  const navigate = useNavigate();

  // Get data passed from Register page
  const { fullName, email, password } = location.state || {};

  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [otpExpired, setOtpExpired] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [otpExpiredModal, setOtpExpiredModal] = useState(false);
  const [otpSuccessModal, setOtpSuccessModal] = useState(false);

  // Redirect if no state
  useEffect(() => {
    if (!email || !fullName || !password) {
      navigate("/register", { replace: true });
    }
  }, [email, fullName, password, navigate]);

  // ================= SEND OTP =================
  const sendOtp = async () => {
    if (resendCooldown) return;

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    try {
      await emailjs.send(
        process.env.REACT_APP_EMAILJS_SERVICE_ID,
        process.env.REACT_APP_EMAILJS_TEMPLATE_ID,
        {
          name: fullName,      // {{name}} in template
          passcode: otpCode,   // {{passcode}} in template
          time: "15 minutes",  // {{time}} in template
          user_email: email    // must match your template variable
        },
        process.env.REACT_APP_EMAILJS_PUBLIC_KEY
      );

      // Save OTP to backend
      await fetch(`${API_BASE_URL}/otp/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: otpCode }),
      });

      setOtpSuccessModal(true);
      setResendCooldown(true);
      setResendTimer(60);
      setOtpExpired(false);
      setOtp("");
    } catch (err) {
      console.error(err);
      const errorMessage = err.text || err.message || "Failed to send OTP.";
      setMessage(errorMessage);
    }
  };

  // ================= VERIFY OTP =================
  const verifyOtp = async () => {
    if (!otp) {
      setMessage("Please enter the OTP.");
      return;
    }

    try {
      // ================= VERIFY OTP ON BACKEND =================
      const verifyRes = await fetch(`${API_BASE_URL}/otp/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      if (!verifyRes.ok) {
        const errorData = await verifyRes.json().catch(() => ({}));
        throw new Error(errorData.message || "Invalid OTP.");
      }

      setEmailVerified(true);
      setMessage("Email verified successfully!");

      // ================= REGISTER USER =================
      const registerRes = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, password }),
      });

      if (!registerRes.ok) {
        const errorData = await registerRes.json().catch(() => ({}));
        throw new Error(errorData.message || "Registration failed.");
      }

      // Redirect to login page after short delay
      setTimeout(() => navigate("/", { replace: true }), 1500);
    } catch (err) {
      console.error(err);
      setEmailVerified(false);
      setMessage(err.message || "An error occurred. Please try again.");
    }
  };

  // Auto-send OTP on page load
  useEffect(() => {
    if (email) sendOtp();
    // eslint-disable-next-line
  }, [email]);

  useEffect(() => {
    if (!resendCooldown) return;

    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setResendCooldown(false);
          setOtpExpired(true);
          setOtpExpiredModal(true);
          setOtp("");
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [resendCooldown]);

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
    filter: "blur(14px) brightness(0.78)",
    transform: "scale(1.03)",
    zIndex: 0,
  };

  const overlayStyle = {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(255,255,255,0.18)",
    zIndex: 1,
  };

  const cardStyle = {
    position: "relative",
    zIndex: 2,
    width: "min(560px, calc(100vw - 32px))",
    background: "#ffffff",
    borderRadius: 24,
    boxShadow: "0 18px 50px rgba(15, 23, 42, 0.12)",
    border: "1.5px solid rgba(30, 64, 175, 0.10)",
    padding: "52px 46px 46px 46px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  };

  const inputStyle = {
    width: "100%",
    padding: "14px 16px",
    borderRadius: 12,
    border: "1px solid rgba(148, 163, 184, 0.9)",
    background: "#f8fafc",
    color: "#111827",
    fontSize: 16,
    marginBottom: 18,
    boxSizing: "border-box",
  };

  return (
    <div className="register-container" style={containerStyle}>
      <div style={backgroundBlurStyle} />
      <div style={overlayStyle}></div>

      <div className="register-card" style={cardStyle}>
        <h1>Security Verification</h1>

        {message && <p className="register-message">{message}</p>}

        <p style={{ color: "#334155", maxWidth: 450, textAlign: "center", marginBottom: 24 }}>
          A verification code has been sent to <b>{email}</b>
        </p>

        <input
          type="text"
          placeholder="Enter Security Code"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          maxLength={6}
          disabled={otpExpired}
          style={inputStyle}
        />

        <button onClick={verifyOtp} disabled={emailVerified || otpExpired}>
          {emailVerified ? "Verified" : "Verify and Register"}
        </button>

        <button
          onClick={sendOtp}
          disabled={resendCooldown || emailVerified}
          style={{ marginTop: "10px", backgroundColor: "#0f5dc0" }}
        >
          {resendCooldown ? `Resend in ${resendTimer}s` : "Resend OTP"}
        </button>

        <p className="register-link" style={{ marginTop: "15px" }}>
          Already have an account? <a href="/">Login here</a>
        </p>
      </div>

      {/* OTP Success Modal */}
      <CenteredModal
        open={otpSuccessModal}
        title="OTP Sent"
        message={`OTP sent successfully to ${email}`}
        buttonText="OK"
        variant="success"
        onClose={() => setOtpSuccessModal(false)}
      />

      {/* OTP Expired Error Modal */}
      <CenteredModal
        open={otpExpiredModal}
        title="OTP Expired"
        message="Your OTP has expired. Please request a new one."
        buttonText="OK"
        variant="error"
        onClose={() => {
          setOtpExpiredModal(false);
          setOtpExpired(true);
        }}
      />
    </div>
  );
}
