import { useEffect } from "react";
import "./LogoutConfirmModal.css";

export default function LogoutConfirmModal({ open, onCancel, onConfirm }) {
  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") onCancel();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="logout-confirm-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="logout-confirm-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <div className="logout-confirm-card">
        <button type="button" className="logout-confirm-close" onClick={onCancel} aria-label="Close logout confirmation">
          <span aria-hidden="true">&times;</span>
        </button>

        <div className="logout-confirm-icon" aria-hidden="true">
          <span className="logout-confirm-icon-ring" />
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <path d="m16 17 5-5-5-5" />
            <path d="M21 12H9" />
          </svg>
        </div>

        <p className="logout-confirm-eyebrow">Session control</p>
        <h2 id="logout-confirm-title">Are you sure you want to logout?</h2>
        <p className="logout-confirm-message">You will need to sign in again to continue managing your TrustPermit account.</p>

        <div className="logout-confirm-actions">
          <button type="button" className="logout-confirm-cancel" onClick={onCancel}>Stay signed in</button>
          <button type="button" className="logout-confirm-submit" onClick={onConfirm}>Yes, logout</button>
        </div>
      </div>
    </div>
  );
}