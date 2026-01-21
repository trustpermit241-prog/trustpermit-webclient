// Login.jsx
import { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import "./Login.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Forgot password states
  const [showForgot, setShowForgot] = useState(false);
  const [showForgotLink, setShowForgotLink] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");

  // Track failed attempts
  const [failedAttempts, setFailedAttempts] = useState(0);

  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const res = await axios.post("http://localhost:5000/api/auth/login", {
        email,
        password,
      });

      console.log("Login response:", res.data); // ✅ Debug role

      // Reset attempts on success
      setFailedAttempts(0);
      setShowForgotLink(false);
      setError("");
      setMessage("");

      // Save token and role in localStorage ✅ ADDED
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.role.toLowerCase());

      // Redirect based on role
      const role = res.data.role?.toLowerCase();
      if (role === "admin") navigate("/dashboard");
      else if (role === "staff") navigate("/staff-dashboard");
      else navigate("/home"); // citizen or other roles

    } catch (err) {
      console.error("Login error:", err.response?.data); // debug
      setFailedAttempts((prev) => prev + 1);
      setError(err.response?.data?.message || "Login failed");

      // Show forgot password link after 2 failed attempts
      if (failedAttempts + 1 >= 2) {
        setShowForgotLink(true);
      }
    }
  };

  const handleForgotPassword = async () => {
    try {
      const res = await axios.post(
        "http://localhost:5000/api/auth/forgot-password",
        { email: forgotEmail }
      );

      setMessage(res.data.msg);
      setError("");
    } catch (err) {
      console.error("Forgot password error:", err.response?.data);
      setError(err.response?.data?.msg || "Failed to send reset link");
    }
  };

  // Styles
  const containerStyle = {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    backgroundImage: "url('/images/Antipolo-City-Hall.png')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    position: "relative",
  };

  const overlayStyle = {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0,0,0,0.5)",
    zIndex: 0,
  };

  return (
    <div style={containerStyle}>
      <div style={overlayStyle}></div>

      <div className="login-card" style={{ position: "relative", zIndex: 1 }}>
        <h1>TrustPermit Login</h1>

        {error && <p className="error">{error}</p>}
        {message && <p style={{ color: "green" }}>{message}</p>}

        {!showForgot ? (
          <>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button onClick={handleLogin}>Login</button>

            {/* Hidden until failed attempts */}
            {showForgotLink && (
              <p
                style={{ cursor: "pointer", color: "#00cfff" }}
                onClick={() => setShowForgot(true)}
              >
                Forgot password?
              </p>
            )}

            <p>
              No account yet? <Link to="/register">Register here</Link>
            </p>
          </>
        ) : (
          <>
            <h3>Reset Password</h3>

            <input
              type="email"
              placeholder="Enter your email"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
            />

            <button onClick={handleForgotPassword}>Send Reset Link</button>

            <p
              style={{ cursor: "pointer", color: "#00cfff" }}
              onClick={() => setShowForgot(false)}
            >
              Back to Login
            </p>
          </>
        )}
      </div>
    </div>
  );
}
