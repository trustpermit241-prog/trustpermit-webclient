
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Account from "./Account";
import CompanyListSection from "./CompanyListSection";
import InspectionSection from "./InspectionSection";
import ProfileSection from "./ProfileSection";
import PermitProgressRealtime from "./PermitProgressRealtime";
import "./Home.css";

export default function Home() {
  const [activeCard, setActiveCard] = useState(null);
  const navigate = useNavigate();

  // Scroll animation trigger
  useEffect(() => {
    const sections = document.querySelectorAll("section");
    const reveal = () => {
      sections.forEach((sec) => {
        const top = sec.getBoundingClientRect().top;
        if (top < window.innerHeight - 100) {
          sec.classList.add("show");
        }
      });
    };
    window.addEventListener("scroll", reveal);
    reveal();
    return () => window.removeEventListener("scroll", reveal);
  }, []);

  // Card button data
  const cardButtons = [
    {
      key: "account-details",
      label: "Account Details",
      icon: (
        <svg width="40" height="40" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" stroke="#2563eb" strokeWidth="2"/><path d="M4 20c0-2.5 3.5-5 8-5s8 2.5 8 5" stroke="#2563eb" strokeWidth="2"/></svg>
      ),
    },
    {
      key: "apply-permit",
      label: "Business Permit & Licensing Office",
      icon: (
        <svg width="40" height="40" fill="none" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="3" stroke="#2563eb" strokeWidth="2"/><path d="M8 10h8M8 14h5" stroke="#2563eb" strokeWidth="2"/></svg>
      ),
    },
    {
      key: "companies",
      label: "List of Companies",
      icon: (
        <svg width="40" height="40" fill="none" viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="13" rx="2" stroke="#2563eb" strokeWidth="2"/><path d="M7 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" stroke="#2563eb" strokeWidth="2"/></svg>
      ),
    },
    {
      key: "inspection",
      label: "Inspection",
      icon: (
        <svg width="40" height="40" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="#2563eb" strokeWidth="2"/><path d="M12 8v4l3 3" stroke="#2563eb" strokeWidth="2"/></svg>
      ),
    },
    {
      key: "payment",
      label: "Payment",
      icon: (
        <svg width="40" height="40" fill="none" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="10" rx="2" stroke="#2563eb" strokeWidth="2"/><path d="M2 10h20" stroke="#2563eb" strokeWidth="2"/></svg>
      ),
    },
  ];

  // Render content for each card
  const renderCardContent = () => {
    switch (activeCard) {
      case "account-details":
        return <Account initialMenu="Account Details" />;
      case "apply-permit":
        return <Account initialMenu="Apply Permit" />;
      case "companies":
        return <Account initialMenu="List of Companies" />;
      case "inspection":
        return <Account initialMenu="Inspection" />;
      case "payment":
        return <Account initialMenu="Payment" />;
      default:
        return null;
    }
  };

  return (
    <>
      <div className="home-top-row" style={{ display: activeCard ? "none" : "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "2.5rem", justifyContent: "center", alignItems: "center", minHeight: 480 }}>
        {cardButtons.map((card) => (
          <div
            key={card.key}
            className="bplo-card"
            role="button"
            tabIndex={0}
            style={{ minHeight: 220, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
            onClick={() => setActiveCard(card.key)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") setActiveCard(card.key);
            }}
          >
            <div style={{ marginBottom: 18 }}>{card.icon}</div>
            <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: "#2563eb" }}>{card.label}</h2>
          </div>
        ))}
      </div>
      {/* Show content when a card is selected */}
      {activeCard && (
        <div style={{ margin: "0 auto", width: "100%", maxWidth: "none", padding: "0 20px" }}>
          <button style={{ margin: "18px 0 0 0", background: "#2563eb", color: "#fff", border: 0, borderRadius: 8, padding: "8px 22px", fontWeight: 600, cursor: "pointer" }} onClick={() => setActiveCard(null)}>
            ← Back to Home
          </button>
          <div style={{ marginTop: 18 }}>{renderCardContent()}</div>
        </div>
      )}
      {/* Floating Help Button */}
      <button
        className="help-icon-btn"
        onClick={() => navigate("/ask-help")}
        aria-label="Ask for help"
      >
        💬
      </button>
    </>
  );
}
