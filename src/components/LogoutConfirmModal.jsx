import { useEffect } from "react";
import { Trash2 } from "lucide-react";
import "./LogoutConfirmModal.css";

export default function LogoutConfirmModal({
  open,
  onCancel,
  onConfirm,
  eyebrow = "Session control",
  title = "Are you sure you want to logout?",
  message = "You will need to sign in again to continue managing your TrustPermit account.",
  cancelText = "Stay signed in",
  confirmText = "Yes, logout",
  destructive = false,
  busy = false,
}) {
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
        <button type="button" className="logout-confirm-close" onClick={onCancel} aria-label="Close confirmation" disabled={busy}>
          <span aria-hidden="true">&times;</span>
        </button>

        <div className={`logout-confirm-icon${destructive ? " is-destructive" : ""}`} aria-hidden="true">
          <span className="logout-confirm-icon-ring" />
          {destructive ? (
            <Trash2 aria-hidden="true" />
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <path d="m16 17 5-5-5-5" />
              <path d="M21 12H9" />
            </svg>
          )}
        </div>

        <p className={`logout-confirm-eyebrow${destructive ? " is-destructive" : ""}`}>{eyebrow}</p>
        <h2 id="logout-confirm-title">{title}</h2>
        <p className="logout-confirm-message">{message}</p>

        <div className="logout-confirm-actions">
          <button type="button" className="logout-confirm-cancel" onClick={onCancel} disabled={busy}>{cancelText}</button>
          <button type="button" className={`logout-confirm-submit${destructive ? " is-destructive" : ""}`} onClick={onConfirm} disabled={busy}>
            {busy ? "Please wait..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}