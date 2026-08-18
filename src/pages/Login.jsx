// Login.jsx
import { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import emailjs from "@emailjs/browser";
import CenteredModal from "../components/CenteredModal";
import "./Login.css";

const API_BASE_URL = (() => {
  const configuredUrl = (process.env.REACT_APP_API_URL || "").replace(/\/+$/, "");
  const localUrl = "http://localhost:5000/api";
  const remoteUrl = "https://trustpermit-backend.onrender.com/api";

  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return localUrl;
    }

    if (hostname.endsWith(".vercel.app") || hostname === "trustpermit.com" || hostname === "www.trustpermit.com") {
      return configuredUrl ? `${configuredUrl}/api` : remoteUrl;
    }
  }

  return configuredUrl ? `${configuredUrl}/api` : remoteUrl;
})();

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpExpired, setOtpExpired] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otpExpiredModal, setOtpExpiredModal] = useState(false);
  const [otpSuccessModal, setOtpSuccessModal] = useState(false);

  const [failedAttempts, setFailedAttempts] = useState(0);

  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const normalizedEmail = email.toLowerCase().trim();

      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: normalizedEmail,
        password,
      });

      console.log("Login response:", response.data);

      setFailedAttempts(0);
      setError("");
      setMessage("");

      const user = response.data.user || {};
      const token = response.data.token;

      let role = String(
        user.role ||
          response.data.role ||
          user.userRole ||
          response.data.userRole ||
          ""
      )
        .toLowerCase()
        .trim();

      if (!role && normalizedEmail === "admin@trustpermit.com") {
        role = "admin";
      }

      if (!role && normalizedEmail === "staff@cityhall.gov") {
        role = "staff";
      }

      const userId = user.id || user._id || response.data.userId || "";
      const userName = user.fullName || user.name || "";
      const userEmail = user.email || normalizedEmail;

      if (!token) {
        setError("Login failed. No token received.");
        return;
      }

      if (!role) {
        setError("Login failed. User role not found.");
        return;
      }

      localStorage.setItem("token", token);
      localStorage.setItem("role", role);
      localStorage.setItem("citizenId", userId);
      localStorage.setItem("name", userName);
      localStorage.setItem("email", userEmail);

      localStorage.setItem(
        "user",
        JSON.stringify({
          id: userId,
          _id: userId,
          name: userName,
          fullName: userName,
          email: userEmail,
          role,
        })
      );

      if (role === "admin") {
        window.location.href = "/dashboard";
        return;
      }

      if (role === "staff") {
        window.location.href = "/staff/dashboard";
        return;
      }

      window.location.href = "/home";
    } catch (err) {
      console.error("Login error:", err.response?.data || err.message);
      setFailedAttempts((prev) => prev + 1);
      setError(err.response?.data?.message || "Invalid login credentials.");
    }
  };

  const sendOtp = async () => {
    if (!forgotEmail) {
      setError("Please enter your email first.");
      return;
    }

    if (resendCooldown) return;

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    try {
      await emailjs.send(
        process.env.REACT_APP_EMAILJS_SERVICE_ID,
        process.env.REACT_APP_EMAILJS_TEMPLATE_ID,
        {
          name: "TrustPermit",
          passcode: otpCode,
          time: "15 minutes",
          user_email: forgotEmail,
        },
        process.env.REACT_APP_EMAILJS_PUBLIC_KEY
      );

      const res = await fetch(`${API_BASE_URL}/otp/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail, otp: otpCode }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ message: "Server error" }));
        throw new Error(data.message || "Failed to store OTP on server.");
      }

      setOtpSuccessModal(true);
      setError("");
      setResendCooldown(true);
      setResendTimer(60);
      setOtpExpired(false);
      setOtp("");

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
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to send OTP.");
      setMessage("");
    }
  };

  const verifyOtp = async () => {
    if (!otp) {
      setError("Please enter the OTP.");
      return;
    }

    try {
      const res = await axios.post(`${API_BASE_URL}/otp/verify-otp`, {
        email: forgotEmail,
        otp,
      });

      setOtpVerified(true);
      setMessage(res.data.message || "OTP verified. You can now reset your password.");
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid or expired OTP.");
      setMessage("");
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      setError("Please fill out both password fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      const res = await axios.post(`${API_BASE_URL}/auth/reset-password`, {
        email: forgotEmail,
        password: newPassword,
      });

      console.log("Password reset response:", res.data);
      setMessage("Password reset successfully. Redirecting to login...");
      setError("");

      setTimeout(() => {
        setShowForgot(false);
        setOtpVerified(false);
        setForgotEmail("");
        setOtp("");
        setNewPassword("");
        setConfirmPassword("");
        navigate("/");
      }, 2000);
    } catch (err) {
      console.error("Reset password failed:", err.response?.data || err.message || err);
      setError(err.response?.data?.message || "Failed to reset password");
    }
  };

  const containerStyle = {
    display: "flex",
    height: "100vh",
    position: "relative",
    overflow: "hidden",
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
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
    minWidth: 0,
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

  return (
    <div style={containerStyle}>
      <div className="login-background-blur" style={backgroundBlurStyle} />
      <div style={overlayStyle}></div>

      <div style={rightStyle}>
        <div
          className="login-card"
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
            WebkitBackdropFilter: "blur(10px)",
          }}
        >
          {error && (
            <p className="error" style={{ color: "#e53935", fontSize: 17, fontWeight: 500, marginBottom: 10 }}>
              {error}
            </p>
          )}

          {message && (
            <p style={{ color: "#1b5e20", fontSize: 17, fontWeight: 500, marginBottom: 10 }}>
              {message}
            </p>
          )}

          {!showForgot ? (
            <>
              <div className="login-field-block">
                <label htmlFor="email" className="login-field-label" style={{ fontSize: 18, color: "#1a237e", fontWeight: 600 }}>
                  Email
                </label>

                <div style={{ position: "relative" }}>
                  <input
                    type="email"
                    id="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ fontSize: 17, padding: "12px", borderRadius: 8, border: "1px solid #bbb", marginTop: 4, marginBottom: 2, width: "100%" }}
                  />
                </div>
              </div>

              <div className="login-field-block">
                <div className="login-password-row">
                  <label htmlFor="password" className="login-field-label" style={{ fontSize: 18, color: "#1a237e", fontWeight: 600 }}>
                    Password
                  </label>

                  <span
                    className="login-forgot-link"
                    onClick={() => setShowForgot(true)}
                    role="button"
                    tabIndex={0}
                    style={{ color: "#1976d2", fontWeight: 500, fontSize: 15, cursor: "pointer" }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setShowForgot(true);
                      }
                    }}
                  >
                    Forgot password?
                  </span>
                </div>

                <div className="password-input-wrap">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    className="password-input"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ fontSize: 17, padding: "12px", borderRadius: 8, border: "1px solid #bbb", marginTop: 4, marginBottom: 2, width: "100%" }}
                  />

                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <button
                className="login-submit-btn"
                onClick={handleLogin}
                style={{
                  width: "100%",
                  padding: "13px 0",
                  fontSize: 18,
                  fontWeight: 700,
                  background: "#1976d2",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  marginTop: 10,
                  marginBottom: 18,
                  cursor: "pointer",
                  letterSpacing: 1,
                }}
              >
                SIGN IN
              </button>

              <div className="login-divider" style={{ display: "flex", alignItems: "center", width: "100%", margin: "18px 0" }}>
                <div style={{ flex: 1, height: 1, background: "#bdbdbd", opacity: 0.7 }}></div>
                <span style={{ margin: "0 12px", color: "#444", fontWeight: 600, fontSize: 16, opacity: 0.95 }}>or</span>
                <div style={{ flex: 1, height: 1, background: "#bdbdbd", opacity: 0.7 }}></div>
              </div>

              <button
                className="login-google-btn"
                type="button"
                tabIndex={-1}
                style={{
                  width: "100%",
                  padding: "14px 0",
                  fontSize: 18,
                  fontWeight: 700,
                  background: "#fff",
                  color: "#1a237e",
                  border: "1.5px solid #1a237e",
                  borderRadius: 8,
                  marginBottom: 16,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  letterSpacing: 0.5,
                  boxShadow: "0 2px 8px rgba(66,133,244,0.08)",
                }}
              >
                <span style={{ color: "#1a237e", fontWeight: 700 }}>
                  Sign in with Google
                </span>
              </button>

              <div className="login-footer-text" style={{ color: "#1a237e", fontSize: 18, marginTop: 16, fontWeight: 700, textAlign: "center", textShadow: "0 1px 8px #fff", opacity: 1 }}>
                Are you new?{" "}
                <Link to="/register" style={{ color: "#1a237e", fontWeight: 700, textDecoration: "underline", opacity: 1 }}>
                  Create an Account
                </Link>
              </div>
            </>
          ) : (
            <div className="forgot-password-section">
              <h3>Reset Password</h3>

              {!otpVerified ? (
                <>
                  <input type="email" placeholder="Enter your email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} />

                  <button onClick={sendOtp} disabled={resendCooldown}>
                    {resendCooldown ? `Resend in ${resendTimer}s` : "Send OTP"}
                  </button>

                  <input type="text" placeholder="Enter OTP" value={otp} onChange={(e) => setOtp(e.target.value)} maxLength={6} disabled={otpExpired} />

                  <button onClick={verifyOtp} disabled={otpExpired}>Verify OTP</button>

                  <span
                    className="back-to-login-link"
                    onClick={() => setShowForgot(false)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setShowForgot(false);
                      }
                    }}
                  >
                    Back to Login
                  </span>
                </>
              ) : (
                <>
                  <input type="password" placeholder="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />

                  <input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />

                  <button onClick={handleResetPassword}>Reset Password</button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* OTP Success Modal */}
      <CenteredModal
        open={otpSuccessModal}
        title="OTP Sent"
        message={`OTP sent successfully to ${forgotEmail}`}
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