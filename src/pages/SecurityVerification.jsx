import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import emailjs from "@emailjs/browser";
import "./Register.css";

export default function SecurityVerification() {
  const location = useLocation();
  const navigate = useNavigate();

  // Get data passed from Register page
  const { fullName, email, password } = location.state || {};

  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(false);

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
      await fetch("https://trustpermit-backend.onrender.com/api/otp/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: otpCode }),
      });

      setMessage(`OTP sent successfully to ${email}`);
      setResendCooldown(true);
      setTimeout(() => setResendCooldown(false), 60000); // 60s cooldown
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
      const verifyRes = await fetch("https://trustpermit-backend.onrender.com/api/otp/verify-otp", {
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
      const registerRes = await fetch("https://trustpermit-backend.onrender.com/api/auth/register", {
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

  return (
    <div
      className="register-container"
      style={{ backgroundImage: "url('/images/Antipolo-City-Hall.png')" }}
    >
      <div className="register-overlay"></div>

      <div className="register-card">
        <h1>Security Verification</h1>

        {message && <p className="register-message">{message}</p>}

        <p>
          A verification code has been sent to <b>{email}</b>
        </p>

        <input
          type="text"
          placeholder="Enter Security Code"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          maxLength={6}
        />

        <button onClick={verifyOtp} disabled={emailVerified}>
          {emailVerified ? "Verified" : "Verify and Register"}
        </button>

        <button
          onClick={sendOtp}
          disabled={resendCooldown || emailVerified}
          style={{ marginTop: "10px", backgroundColor: "#0f5dc0" }}
        >
          {resendCooldown ? "Resend in 60s" : "Resend OTP"}
        </button>

        <p className="register-link" style={{ marginTop: "15px" }}>
          Already have an account? <a href="/">Login here</a>
        </p>
      </div>
    </div>
  );
}
