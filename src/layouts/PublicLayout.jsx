import { Outlet, useNavigate } from "react-router-dom";
import "./PublicLayout.css";

export default function PublicLayout() {
  const navigate = useNavigate();

  const logoStyle = {
    width: "50px",
    height: "50px",
    backgroundImage: "url('/images/lugoo.jpg')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    borderRadius: "50%",
    cursor: "pointer",
  };

  return (
    <>
      {/* NAVBAR */}
      <header className="top-nav">
        <div
          className="circular-logo"
          style={logoStyle}
          onClick={() => navigate("/account")}
          title="Go to Account"
        />
        <nav className="nav-buttons">
          <button onClick={() => navigate("/home")}>Home</button>
          <button onClick={() => navigate("/about")}>About</button>
          <button onClick={() => navigate("/contact")}>Contact</button>
          <button onClick={() => navigate("/login")}>Logout</button>
        </nav>
      </header>

      {/* RENDER PAGE CONTENT */}
      <main className="page-content">
        <Outlet />
      </main>
    </>
  );
}
